import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { NextRequest } from "next/server";
import { SignJWT } from "jose";
import { transaction } from "../src/server/db";
import {
  passwordHash,
  checkPassword,
  readPasswordResetToken,
} from "../src/server/auth";
import {
  requestRecoveryCode,
  verifyRecoveryCode,
  requestVerificationCode,
  verifyEmailCode,
  type RecoveryCode,
} from "../src/server/recovery";
import { consumeAccountToken } from "../src/server/mail";
import { api, hash } from "../src/server/http";
import { POST } from "../src/app/api/v1/[[...path]]/route";
import type { User } from "../src/lib/types";
import { installMongoFixture } from "./helpers/mongo-fixture";

test("OTP recovery uses owned storage, limits attempts, and revokes sessions", async (t) => {
  const originalDirectory = process.cwd();
  const originalFetch = globalThis.fetch;
  const keys = [
    "MONGODB_URI",
    "EMAIL_API_KEY",
    "EMAIL_FROM",
    "JWT_SECRET",
    "APP_ORIGIN",
  ];
  const previous = Object.fromEntries(
    keys.map((key) => [key, process.env[key]]),
  );
  const directory = await mkdtemp(path.join(tmpdir(), "ovia-recovery-test-"));
  process.chdir(directory);
  const database = installMongoFixture();
  process.env.EMAIL_API_KEY = "test-only-provider-key";
  process.env.EMAIL_FROM = "OVIA <test@example.test>";
  process.env.JWT_SECRET =
    "test-only-secret-with-at-least-thirty-two-characters";
  process.env.APP_ORIGIN = "http://localhost:3000";
  const messages: { to: string[]; subject: string; text: string }[] = [];
  globalThis.fetch = async (url, options) => {
    assert.equal(String(url), "https://api.resend.com/emails");
    const payload = JSON.parse(String(options?.body));
    assert.equal(payload.from, process.env.EMAIL_FROM);
    assert.equal(new Headers(options?.headers).get("Authorization"), `Bearer ${process.env.EMAIL_API_KEY}`);
    messages.push(payload);
    return new Response("{}", { status: 200 });
  };
  let sequence = 0;
  async function user() {
    const id = `test-${++sequence}`;
    const result: User = {
      id,
      email: `${id}@example.test`,
      name: "Test User",
      passwordHash: passwordHash("Original-password-123"),
      createdAt: new Date().toISOString(),
    };
    await transaction((repo) => repo.put("users", result));
    return result;
  }
  function otp() {
    return /code is: (\d{6})/.exec(messages.at(-1)!.text)![1];
  }
  async function record(email: string) {
    return transaction((repo) =>
      repo.get<RecoveryCode>("tokens", hash(`reset-otp:${email}`)),
    );
  }
  async function post(
    route: string,
    data: unknown,
    origin = "http://localhost:3000",
  ) {
    const req = new NextRequest(`http://localhost:3000/api/v1/auth/${route}`, {
      method: "POST",
      headers: { origin, "content-type": "application/json" },
      body: JSON.stringify(data),
    });
    return POST(req, { params: Promise.resolve({ path: ["auth", route] }) });
  }
  try {
    await t.test(
      "known and unknown email have identical responses and cooldown",
      async () => {
        const u = await user();
        const before = messages.length;
        const unknown = await requestRecoveryCode("unknown@example.test");
        assert.equal(messages.length, before);
        const known = await requestRecoveryCode(u.email);
        assert.deepEqual(known, unknown);
        assert.equal(messages.length, before + 1);
        assert.equal(messages.at(-1)!.subject, "Your OVIA Security Verification Code");
        const stored = (await record(u.email))!;
        assert.ok(stored.otpHash.startsWith("scrypt-v2:"));
        assert.ok(!JSON.stringify(stored).includes(otp()));
        assert.ok(
          Date.parse(stored.expiresAt) - Date.parse(stored.createdAt) <= 600000,
        );
        for (const email of [u.email, "unknown@example.test"])
          await assert.rejects(requestRecoveryCode(email), /wait 60 seconds/);
      },
    );
    await t.test(
      "fifth wrong attempt deletes code and committed attempts persist",
      async () => {
        const u = await user();
        await requestRecoveryCode(u.email);
        const valid = otp();
        const wrong = valid === "111111" ? "222222" : "111111";
        for (let attempt = 1; attempt <= 5; attempt++) {
          await assert.rejects(
            verifyRecoveryCode(u.email, wrong),
            attempt === 5 ? /Too many attempts/ : /Invalid or expired/,
          );
          assert.equal(
            (await record(u.email))?.attempts,
            attempt === 5 ? undefined : attempt,
          );
        }
        await assert.rejects(
          verifyRecoveryCode(u.email, valid),
          /Invalid or expired/,
        );
      },
    );
    await t.test("expired code fails even before TTL cleanup", async () => {
      const u = await user();
      await requestRecoveryCode(u.email);
      const code = otp();
      const stored = (await record(u.email))!;
      await transaction((repo) =>
        repo.put("tokens", { ...stored, expiresAt: new Date(0).toISOString() }),
      );
      await assert.rejects(
        verifyRecoveryCode(u.email, code),
        /Invalid or expired/,
      );
      assert.equal(await record(u.email), undefined);
    });
    await t.test(
      "valid OTP and reset authorization are each single-use; password changes revoke sessions",
      async () => {
        const u = await user();
        await requestRecoveryCode(u.email);
        const code = otp();
        await transaction((repo) =>
          repo.put("sessions", {
            id: "captured-session",
            userId: u.id,
            expiresAt: new Date(Date.now() + 600000).toISOString(),
          }),
        );
        const { resetToken } = await verifyRecoveryCode(u.email, code);
        await assert.rejects(
          verifyRecoveryCode(u.email, code),
          /Invalid or expired/,
        );
        const { tokenId, userId } = await readPasswordResetToken(resetToken);
        assert.equal(userId, u.id);
        const result = await post("reset-password", {
          resetToken,
          newPassword: "Replacement-password-456",
        });
        assert.equal(result.status, 200);
        const updated = (await transaction((repo) =>
          repo.get<User>("users", u.id),
        ))!;
        assert.equal(
          checkPassword("Original-password-123", updated.passwordHash),
          false,
        );
        assert.equal(
          checkPassword("Replacement-password-456", updated.passwordHash),
          true,
        );
        assert.equal(
          await transaction((repo) => repo.get("sessions", "captured-session")),
          undefined,
        );
        await assert.rejects(
          consumeAccountToken(tokenId, "reset", "Another-password-789"),
          /invalid or expired/,
        );
      },
    );
    await t.test(
      "concurrent verification consumes code only once",
      async () => {
        const u = await user();
        await requestRecoveryCode(u.email);
        const code = otp();
        const results = await Promise.allSettled([
          verifyRecoveryCode(u.email, code),
          verifyRecoveryCode(u.email, code),
        ]);
        assert.equal(
          results.filter((result) => result.status === "fulfilled").length,
          1,
        );
      },
    );
    await t.test(
      "resend replaces previous code and invalidates previous reset authorization",
      async () => {
        const u = await user();
        await requestRecoveryCode(u.email);
        const { resetToken } = await verifyRecoveryCode(u.email, otp());
        await transaction((repo) =>
          repo.remove("limits", hash(`reset-cooldown:${u.email}`)),
        );
        await requestRecoveryCode(u.email);
        assert.equal((await record(u.email))?.attempts, 0);
        const { tokenId } = await readPasswordResetToken(resetToken);
        await assert.rejects(
          consumeAccountToken(tokenId, "reset", "Replacement-password-456"),
          /invalid or expired/,
        );
      },
    );
    await t.test(
      "resending a code invalidates the previously emailed code",
      async () => {
        const u = await user();
        await requestRecoveryCode(u.email);
        const oldCode = otp();
        await transaction((repo) => repo.remove("limits", hash(`reset-cooldown:${u.email}`)));
        await requestRecoveryCode(u.email);
        const currentCode = otp();
        if (oldCode !== currentCode) await assert.rejects(verifyRecoveryCode(u.email, oldCode), /Invalid or expired/);
        assert.ok((await verifyRecoveryCode(u.email, currentCode)).resetToken);
      },
    );
    await t.test(
      "email verification and password recovery codes cannot authorize another purpose",
      async () => {
        const u = await user();
        await requestVerificationCode(u.email);
        const verification = otp();
        await assert.rejects(verifyRecoveryCode(u.email, verification), /Invalid or expired/);
        assert.equal((await verifyEmailCode(u.email, verification)).id, u.id);
        await requestRecoveryCode(u.email);
        const recovery = otp();
        await assert.rejects(verifyEmailCode(u.email, recovery), /Invalid or expired/);
        assert.ok((await verifyRecoveryCode(u.email, recovery)).resetToken);
      },
    );
    await t.test(
      "tampered, expired and wrong-purpose JWTs are rejected",
      async () => {
        const u = await user();
        await requestRecoveryCode(u.email);
        const { resetToken } = await verifyRecoveryCode(u.email, otp());
        await assert.rejects(
          readPasswordResetToken(`${resetToken.slice(0, -8)}tampered`),
          /Invalid or expired/,
        );
        const key = new TextEncoder().encode(process.env.JWT_SECRET);
        for (const [purpose, expiry] of [
          ["password-reset", 1],
          ["session", Math.floor(Date.now() / 1000) + 900],
        ] as const) {
          const jwt = await new SignJWT({ purpose })
            .setProtectedHeader({ alg: "HS256" })
            .setSubject(u.id)
            .setJti("test")
            .setIssuer("ovia")
            .setAudience("ovia-password-reset")
            .setExpirationTime(expiry)
            .sign(key);
          await assert.rejects(
            readPasswordResetToken(jwt),
            /Invalid or expired/,
          );
        }
      },
    );
    await t.test(
      "provider failure is displayed and logged, secrets are redacted, and code is removed",
      async () => {
        const u = await user();
        const mocked = globalThis.fetch;
        const originalError = console.error;
        const logs: string[] = [];
        console.error = (...args) => { logs.push(args.join(" ")); };
        globalThis.fetch = async () => new Response(JSON.stringify({ name: "validation_error", message: `Domain rejected ${process.env.EMAIL_API_KEY}` }), { status: 403 });
        try {
          const response = await api(() => requestRecoveryCode(u.email), 200, true);
          assert.equal(response.status, 502);
          const result = await response.json();
          assert.match(result.error.message, /Resend \(403\): validation_error: Domain rejected/);
          assert.ok(!JSON.stringify(result).includes(process.env.EMAIL_API_KEY!));
          assert.ok(logs.some(line => line.includes("Domain rejected")));
          assert.ok(!logs.join(" ").includes(process.env.EMAIL_API_KEY!));
          assert.equal(await record(u.email), undefined);
        } finally {
          globalThis.fetch = mocked;
          console.error = originalError;
        }
      },
    );
    await t.test(
      "missing email configuration fails for all accounts",
      async () => {
        delete process.env.EMAIL_API_KEY;
        await assert.rejects(
          requestRecoveryCode("unknown@example.test"),
          /Resend configuration missing: EMAIL_API_KEY/,
        );
        process.env.EMAIL_API_KEY = "test-only-provider-key";
      },
    );
    await t.test(
      "API validates fields, enforces origin and rate limits",
      async () => {
        assert.equal((await post("forgot-password", {})).status, 400);
        assert.equal(
          (await post("forgot-password", { email: "invalid" })).status,
          400,
        );
        assert.equal(
          (
            await post("verify-otp", {
              email: "valid@example.test",
              otp: "123",
            })
          ).status,
          400,
        );
        assert.equal(
          (
            await post("reset-password", {
              token: "a".repeat(64),
              password: "short",
            })
          ).status,
          400,
        );
        assert.equal(
          (
            await post(
              "forgot-password",
              { email: "valid@example.test" },
              "https://seller.example",
            )
          ).status,
          403,
        );
        for (let i = 0; i < 4; i++)
          await post("forgot-password", { email: `limit-${i}@example.test` });
        assert.equal(
          (await post("forgot-password", { email: "limit-final@example.test" }))
            .status,
          429,
        );
      },
    );
  } finally {
    database.restore();
    process.chdir(originalDirectory);
    globalThis.fetch = originalFetch;
    for (const key of keys) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
});
