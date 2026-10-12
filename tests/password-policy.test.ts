import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { NextRequest } from "next/server";
import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_SPECIAL_CHARACTERS,
  getPasswordChecks,
  getPasswordValidationError,
} from "../src/lib/password-policy";
import { POST } from "../src/app/api/v1/[[...path]]/route";
import { transaction } from "../src/server/db";
import { passwordHash, checkPassword } from "../src/server/auth";
import { consumeAccountToken } from "../src/server/mail";
import { hash } from "../src/server/http";
import type { User, Session } from "../src/lib/types";
import { installMongoFixture } from "./helpers/mongo-fixture";

test("new password boundaries and every allowed special character", () => {
  assert.equal(PASSWORD_MIN_LENGTH, 8);
  assert.equal(PASSWORD_MAX_LENGTH, 128);
  assert.equal(PASSWORD_SPECIAL_CHARACTERS, "!@#$%^&*?+-/,.");
  const accepted = [
    "Abcd1!xy",
    "ABCD1!XY",
    "Longer1!password",
    "Ab1!é漢字x",
    `A1!${"x".repeat(125)}`,
    ...Array.from("!@#$%^&*?+-/,.", (special) => `Abcd1${special}xy`),
  ];
  for (const password of accepted) {
    assert.equal(getPasswordValidationError(password), undefined, password);
    assert.ok(
      getPasswordChecks(password).every((check) => check.met),
      password,
    );
  }
  const rejected = [
    "",
    "Abc1!xy",
    "abcdefgh",
    "abcd1!xy",
    "Abcde!xy",
    "Abcd1234",
    "Abcd1_xy",
    "Abcd1! x",
    "Abcd1!\tx",
    "Abcd1!\nx",
    "Abcd1!\rx",
    "Abcd1!\u00a0x",
    "Abcd1!\u2003x",
    "Abcd1!xy ",
  ];
  assert.match(getPasswordValidationError(`A1!${"x".repeat(126)}`)!, /128/);
  for (const password of rejected) {
    assert.ok(getPasswordValidationError(password), JSON.stringify(password));
    assert.ok(
      getPasswordChecks(password).some((check) => !check.met),
      JSON.stringify(password),
    );
  }
});

test("registration and reset enforce the policy while existing logins remain compatible", async (t) => {
  const originalDirectory = process.cwd();
  const originalFetch = globalThis.fetch;
  const keys = [
    "MONGODB_URI",
    "EMAIL_API_KEY",
    "EMAIL_FROM",
    "JWT_SECRET",
    "APP_ORIGIN",
    "NODE_ENV",
    "VERCEL",
  ];
  const previous = Object.fromEntries(
    keys.map((key) => [key, process.env[key]]),
  );
  const directory = await mkdtemp(
    path.join(tmpdir(), "ovia-password-policy-test-"),
  );
  process.chdir(directory);
  const database = installMongoFixture();
  delete process.env.VERCEL;
  Object.assign(process.env, { NODE_ENV: "test" });
  process.env.EMAIL_API_KEY = "test-only-email-key";
  process.env.EMAIL_FROM = "OVIA <test@example.test>";
  process.env.JWT_SECRET =
    "test-only-secret-with-at-least-thirty-two-characters";
  process.env.APP_ORIGIN = "http://localhost:3000";
  const messages: { to: string[]; text: string }[] = [];
  globalThis.fetch = async (url, options) => {
    assert.equal(
      String(url),
      "https://api.resend.com/emails",
      "Only mocked email is permitted in these tests.",
    );
    messages.push(JSON.parse(String(options?.body)));
    return new Response("{}", { status: 200 });
  };
  async function post(route: string, data: unknown) {
    const request = new NextRequest(
      `http://localhost:3000/api/v1/auth/${route}`,
      {
        method: "POST",
        headers: {
          origin: "http://localhost:3000",
          "content-type": "application/json",
        },
        body: JSON.stringify(data),
      },
    );
    return POST(request, {
      params: Promise.resolve({ path: ["auth", route] }),
    });
  }
  type ResetToken = {
    id: string;
    userId: string;
    purpose: "reset";
    expiresAt: string;
  };
  const token = "a".repeat(64);
  const resetUser: User = {
    id: "password-policy-reset-user",
    name: "Reset Traveler",
    email: "reset-policy@example.test",
    passwordHash: passwordHash("Original1!password"),
    createdAt: new Date().toISOString(),
  };
  const session: Session = {
    id: "password-policy-session",
    userId: resetUser.id,
    expiresAt: new Date(Date.now() + 600000).toISOString(),
  };
  try {
    await t.test(
      "eight-character registration succeeds and invalid values create no accounts",
      async () => {
        const registration = {
          name: "Policy Traveler",
          email: "register-policy@example.test",
          password: "Abcd1!xy",
          confirmPassword: "Abcd1!xy",
          terms: "on",
        };
        const response = await post("register", registration);
        assert.equal(response.status, 200);
        assert.equal((await response.json()).data.verificationRequired, true);
        const [stored] = await transaction((repo) =>
          repo.find<User>("users", { email: registration.email }),
        );
        assert.ok(stored);
        assert.ok(checkPassword(registration.password, stored.passwordHash));
        for (const [index, password] of [
          "Abcd1! x",
          "abcd1!xy",
          "Abcde!xy",
          "Abcd1234",
        ].entries()) {
          const email = `invalid-policy-${index}@example.test`;
          const result = await post("register", {
            ...registration,
            email,
            password,
            confirmPassword: password,
          });
          assert.equal(result.status, 400);
          assert.match(
            (await result.json()).error.message,
            /password|character|digit|number|uppercase|special|space/i,
          );
          assert.deepEqual(
            await transaction((repo) => repo.find<User>("users", { email })),
            [],
          );
        }
        assert.equal(
          messages.length,
          1,
          "Invalid registration must not send verification email.",
        );
      },
    );
    await t.test(
      "both reset password aliases reject invalid values without consuming authorization",
      async () => {
        await transaction(async (repo) => {
          await repo.put("users", resetUser);
          await repo.put("tokens", {
            id: hash(token),
            userId: resetUser.id,
            purpose: "reset",
            expiresAt: new Date(Date.now() + 600000).toISOString(),
          });
          await repo.put("sessions", session);
        });
        for (const field of ["password", "newPassword"]) {
          for (const password of ["Abcd1234", "Abcd1! x"]) {
            const response = await post("reset-password", {
              token,
              [field]: password,
            });
            assert.equal(response.status, 400);
            assert.ok(
              await transaction((repo) =>
                repo.get<ResetToken>("tokens", hash(token)),
              ),
            );
            assert.ok(
              await transaction((repo) =>
                repo.get<Session>("sessions", session.id),
              ),
            );
            const stored = (await transaction((repo) =>
              repo.get<User>("users", resetUser.id),
            ))!;
            assert.equal(stored.passwordHash, resetUser.passwordHash);
          }
        }
        await assert.rejects(
          consumeAccountToken(token, "reset", "Abcd1234"),
          /password|special|character/i,
        );
        assert.ok(
          await transaction((repo) =>
            repo.get<ResetToken>("tokens", hash(token)),
          ),
        );
      },
    );
    await t.test(
      "a valid eight-character reset consumes authorization and revokes sessions",
      async () => {
        const response = await post("reset-password", {
          token,
          newPassword: "ABCD1!XY",
        });
        assert.equal(response.status, 200);
        const stored = (await transaction((repo) =>
          repo.get<User>("users", resetUser.id),
        ))!;
        assert.ok(checkPassword("ABCD1!XY", stored.passwordHash));
        assert.equal(
          checkPassword("Original1!password", stored.passwordHash),
          false,
        );
        assert.ok(stored.passwordChangedAt);
        assert.equal(
          await transaction((repo) =>
            repo.get<ResetToken>("tokens", hash(token)),
          ),
          undefined,
        );
        assert.equal(
          await transaction((repo) =>
            repo.get<Session>("sessions", session.id),
          ),
          undefined,
        );
        assert.equal(
          (await post("reset-password", { token, password: "ABCD1!XY" }))
            .status,
          400,
        );
      },
    );
    await t.test(
      "legacy passwords can still sign in without meeting the new creation policy",
      async () => {
        for (const [index, password] of ["legacy", "old pass"].entries()) {
          const user: User = {
            id: `legacy-policy-${index}`,
            name: "Legacy Traveler",
            email: `legacy-policy-${index}@example.test`,
            passwordHash: passwordHash(password),
            createdAt: new Date().toISOString(),
          };
          await transaction((repo) => repo.put("users", user));
          const response = await post("login", { email: user.email, password });
          assert.equal(response.status, 200);
          assert.equal((await response.json()).data.verificationRequired, true);
        }
        assert.equal(
          (
            await post("login", {
              email: "legacy-policy-0@example.test",
              password: "wrong",
            })
          ).status,
          401,
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
    const cleanupDirectory = path.resolve(directory);
    assert.equal(path.dirname(cleanupDirectory), path.resolve(tmpdir()));
    assert.ok(
      path.basename(cleanupDirectory).startsWith("ovia-password-policy-test-"),
    );
    await rm(cleanupDirectory, { recursive: true, force: true });
  }
});
