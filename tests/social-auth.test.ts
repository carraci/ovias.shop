import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  SignJWT,
  generateKeyPair,
  exportJWK,
  exportPKCS8,
  createLocalJWKSet,
  jwtVerify,
} from "jose";
import {
  availableProviders,
  prepareFlow,
  consumeFlow,
  verifyIdentity,
  resolveSocialUser,
  exchangeCode,
  appleClientSecret,
  cookieOptions,
  type Flow,
} from "../src/server/social-auth";
import { transaction } from "../src/server/db";
import { installMongoFixture } from "./helpers/mongo-fixture";
import { passwordHash } from "../src/server/auth";
import type { User, Session } from "../src/lib/types";

test("social OAuth cryptography, replay protection, account linking, and provider configuration", async (t) => {
  const originalCwd = process.cwd();
  const originalEnv = { ...process.env };
  const originalFetch = globalThis.fetch;
  const dir = await mkdtemp(path.join(tmpdir(), "ovia-social-test-"));
  process.chdir(dir);
  const database = installMongoFixture();
  process.env.JWT_SECRET = "social-test-signing-key-at-least-32-characters";
  process.env.APP_ORIGIN = "http://localhost:3000";
  delete process.env.GOOGLE_CLIENT_ID;
  delete process.env.GOOGLE_CLIENT_SECRET;
  delete process.env.APPLE_CLIENT_ID;
  try {
    await t.test("unconfigured providers fail closed", async () => {
      assert.deepEqual(availableProviders(), { google: false, apple: false });
      await assert.rejects(prepareFlow("google", "signin"));
    });
    process.env.GOOGLE_CLIENT_ID = "google-test-client";
    process.env.GOOGLE_CLIENT_SECRET = "google-test-secret";
    process.env.APPLE_CLIENT_ID = "shop.ovia.service";
    process.env.APPLE_TEAM_ID = "TEAM123";
    process.env.APPLE_KEY_ID = "KEY123";
    const ec = await generateKeyPair("ES256", { extractable: true });
    process.env.APPLE_PRIVATE_KEY = (await exportPKCS8(ec.privateKey)).replace(
      /\n/g,
      "\\n",
    );
    await t.test(
      "Apple is unavailable on HTTP localhost; Google permits local testing",
      () => {
        assert.deepEqual(availableProviders(), { google: true, apple: false });
      },
    );
    const start = await prepareFlow(
      "google",
      "signin",
      undefined,
      "guest-cart-hash",
    );
    await t.test(
      "Google redirect has PKCE, nonce, state, exact callback, and no secret",
      () => {
        const url = new URL(start.url);
        assert.equal(url.hostname, "accounts.google.com");
        assert.equal(url.searchParams.get("code_challenge_method"), "S256");
        assert.equal(url.searchParams.get("nonce"), start.flow.nonce);
        assert.equal(
          url.searchParams.get("redirect_uri"),
          "http://localhost:3000/api/auth/social/google/callback",
        );
        assert.ok(!start.url.includes(process.env.GOOGLE_CLIENT_SECRET!));
      },
    );
    await t.test(
      "missing browser cookie, wrong state, provider mismatch, and tampering rejected",
      async () => {
        await assert.rejects(consumeFlow("google", start.flow.state));
        await assert.rejects(
          consumeFlow("google", "a".repeat(64), start.token),
        );
        await assert.rejects(
          consumeFlow("apple", start.flow.state, start.token),
        );
        await assert.rejects(
          consumeFlow(
            "google",
            start.flow.state,
            start.token.slice(0, -8) + "tampered",
          ),
        );
      },
    );
    await t.test(
      "one-time callback is consumed atomically under concurrent requests",
      async () => {
        const results = await Promise.allSettled([
          consumeFlow("google", start.flow.state, start.token),
          consumeFlow("google", start.flow.state, start.token),
        ]);
        assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
        await assert.rejects(
          consumeFlow("google", start.flow.state, start.token),
        );
      },
    );
    const rsa = await generateKeyPair("RS256", { extractable: true });
    const jwk = await exportJWK(rsa.publicKey);
    const keys = createLocalJWKSet({
      keys: [{ ...jwk, kid: "test", alg: "RS256" }],
    });
    const flow = start.flow;
    async function token(
      overrides: Record<string, unknown> = {},
      issuer = "https://accounts.google.com",
      audience = "google-test-client",
      expiration: string | number = "5m",
    ) {
      return new SignJWT({
        nonce: flow.nonce,
        email: "social@example.test",
        email_verified: true,
        name: "Social Traveler",
        ...overrides,
      })
        .setProtectedHeader({ alg: "RS256", kid: "test" })
        .setIssuer(issuer)
        .setAudience(audience)
        .setSubject("provider-subject")
        .setIssuedAt()
        .setExpirationTime(expiration)
        .sign(rsa.privateKey);
    }
    await t.test(
      "Google issued-at clock skew is bounded and old tokens remain invalid",
      async () => {
        const now = Math.floor(Date.now() / 1000);
        async function issuedAt(iat: number) {
          return new SignJWT({
            nonce: flow.nonce,
            email: "skew@example.test",
            email_verified: true,
          })
            .setProtectedHeader({ alg: "RS256", kid: "test" })
            .setIssuer("https://accounts.google.com")
            .setAudience("google-test-client")
            .setSubject("clock-subject")
            .setIssuedAt(iat)
            .setExpirationTime(now + 3600)
            .sign(rsa.privateKey);
        }
        assert.equal(
          (await verifyIdentity(flow, await issuedAt(now + 45), keys)).sub,
          "clock-subject",
        );
        await assert.rejects(
          verifyIdentity(flow, await issuedAt(now + 180), keys),
        );
        await assert.rejects(
          verifyIdentity(flow, await issuedAt(now - 720), keys),
        );
      },
    );
    await t.test("signed valid identity accepted", async () => {
      const identity = await verifyIdentity(flow, await token(), keys);
      assert.equal(identity.email, "social@example.test");
      assert.equal(identity.sub, "provider-subject");
    });
    await t.test(
      "wrong issuer, audience, nonce, expiry, and unverified email rejected",
      async () => {
        for (const bad of [
          await token({}, "https://evil.example"),
          await token({}, undefined, "wrong-client"),
          await token({ nonce: "wrong" }),
          await token(
            {},
            undefined,
            undefined,
            Math.floor(Date.now() / 1000) - 120,
          ),
          await token({ email_verified: false }),
          await token({ email: "bad-email" }),
        ])
          await assert.rejects(verifyIdentity(flow, bad, keys));
      },
    );
    await t.test(
      "new social account verified; returning subject does not require email",
      async () => {
        const first = await resolveSocialUser(flow, {
          sub: "new-subject",
          email: "new@example.test",
          name: "New Traveler",
        });
        assert.ok(first.verifiedAt);
        assert.ok(first.passwordHash.startsWith("scrypt-v2:"));
        const returning = await resolveSocialUser(flow, { sub: "new-subject" });
        assert.equal(returning.id, first.id);
      },
    );
    const user: User = {
      id: "existing-user",
      email: "existing@example.test",
      name: "Existing",
      createdAt: new Date().toISOString(),
      verifiedAt: new Date().toISOString(),
      passwordHash: passwordHash("TestPass1!"),
    };
    await transaction((repo) => repo.put("users", user));
    await t.test(
      "matching email never implicitly links an existing account",
      async () => {
        await assert.rejects(
          resolveSocialUser(flow, {
            sub: "existing-subject",
            email: user.email,
          }),
          /account_link/,
        );
      },
    );
    await t.test(
      "only signed verified Gmail claims grant provider email authority",
      async () => {
        assert.equal(
          (
            await verifyIdentity(
              flow,
              await token({ email: "owner@gmail.com" }),
              keys,
            )
          ).googleOwnsEmail,
          true,
        );
        assert.equal(
          (
            await verifyIdentity(
              flow,
              await token({ email: "owner@example.test", hd: "example.test" }),
              keys,
            )
          ).googleOwnsEmail,
          false,
        );
        assert.equal(
          (
            await verifyIdentity(
              flow,
              await token({ email: "owner@gmail.com.evil.test" }),
              keys,
            )
          ).googleOwnsEmail,
          false,
        );
        await assert.rejects(
          verifyIdentity(
            flow,
            await token({ email: "owner@gmail.com", email_verified: false }),
            keys,
          ),
        );
      },
    );
    await t.test(
      "Gmail reuse requires verified OVIA user and Google ownership proof",
      async () => {
        const gmail: User = {
          ...user,
          id: "gmail-existing",
          email: "owner@gmail.com",
        };
        const unverified: User = {
          ...user,
          id: "gmail-unverified",
          email: "unverified@gmail.com",
          verifiedAt: undefined,
        };
        await transaction(async (repo) => {
          await repo.put("users", gmail);
          await repo.put("users", unverified);
        });
        await assert.rejects(
          resolveSocialUser(flow, {
            sub: "gmail-no-proof",
            email: gmail.email,
          }),
          /account_link/,
        );
        await assert.rejects(
          resolveSocialUser(
            { ...flow, provider: "apple" },
            {
              sub: "apple-cannot-assert-google",
              email: gmail.email,
              googleOwnsEmail: true,
            },
          ),
          /account_link/,
        );
        await assert.rejects(
          resolveSocialUser(flow, {
            sub: "unverified-gmail",
            email: unverified.email,
            googleOwnsEmail: true,
          }),
          /account_link/,
        );
        await assert.rejects(
          resolveSocialUser(flow, {
            sub: "external-cannot-assert-gmail",
            email: user.email,
            googleOwnsEmail: true,
          }),
          /account_link/,
        );
        const signed = await verifyIdentity(
          flow,
          await token({ email: gmail.email }),
          keys,
        );
        assert.equal((await resolveSocialUser(flow, signed)).id, gmail.id);
        assert.equal(
          (
            await resolveSocialUser(flow, {
              sub: signed.sub,
              email: "changed@gmail.com",
              googleOwnsEmail: true,
            })
          ).id,
          gmail.id,
        );
        await assert.rejects(
          resolveSocialUser(flow, {
            sub: "different-google-subject",
            email: gmail.email,
            googleOwnsEmail: true,
          }),
          /account_link/,
        );
      },
    );
    await t.test(
      "concurrent distinct Google subjects cannot bind one Gmail account",
      async () => {
        const gmail: User = {
          ...user,
          id: "gmail-concurrent",
          email: "concurrent@gmail.com",
        };
        await transaction((repo) => repo.put("users", gmail));
        const results = await Promise.allSettled(
          ["subject-a", "subject-b"].map((sub) =>
            resolveSocialUser(flow, {
              sub,
              email: gmail.email,
              googleOwnsEmail: true,
            }),
          ),
        );
        assert.equal(
          results.filter((result) => result.status === "fulfilled").length,
          1,
        );
        const links = await transaction((repo) =>
          repo.find<{
            id: string;
            purpose: string;
            provider: string;
            userId: string;
          }>("tokens", {
            purpose: "social-identity",
            provider: "google",
            userId: gmail.id,
          }),
        );
        assert.equal(links.length, 1);
      },
    );
    const session: Session = {
      id: "authenticated-session",
      userId: user.id,
      expiresAt: new Date(Date.now() + 60000).toISOString(),
    };
    await transaction((repo) => repo.put("sessions", session));
    const linking: Flow = {
      ...flow,
      intent: "link",
      userId: user.id,
      sessionId: session.id,
    };
    await t.test(
      "explicit linking requires authenticated live session",
      async () => {
        const linked = await resolveSocialUser(linking, {
          sub: "existing-subject",
          email: user.email,
        });
        assert.equal(linked.id, user.id);
        assert.equal(
          (await resolveSocialUser(flow, { sub: "existing-subject" })).id,
          user.id,
        );
      },
    );
    await t.test(
      "an identity already linked to another account cannot be reassigned",
      async () => {
        await assert.rejects(
          resolveSocialUser(linking, { sub: "new-subject" }),
          /linked_elsewhere/,
        );
      },
    );
    await transaction((repo) => repo.remove("sessions", session.id));
    await t.test("revoked sessions cannot link identities", async () => {
      await assert.rejects(
        resolveSocialUser(linking, { sub: "revoked-attempt" }),
        /expired/,
      );
    });
    await t.test(
      "server code exchange sends Google secret and PKCE only to fixed endpoint",
      async () => {
        globalThis.fetch = async (input, init) => {
          assert.equal(String(input), "https://oauth2.googleapis.com/token");
          const body = init!.body as URLSearchParams;
          assert.equal(body.get("client_secret"), "google-test-secret");
          assert.equal(body.get("code_verifier"), flow.verifier);
          assert.equal(init?.redirect, "error");
          return Response.json({ id_token: "test-id-token" });
        };
        assert.equal(await exchangeCode(flow, "test-code"), "test-id-token");
        globalThis.fetch = async () => new Response(null, { status: 400 });
        await assert.rejects(exchangeCode(flow, "declined-code"));
      },
    );
    process.env.APP_ORIGIN = "https://www.ovias.shop";
    await t.test(
      "Apple authorization uses form_post and Secure cross-site state cookie",
      async () => {
        assert.equal(availableProviders().apple, true);
        const start = await prepareFlow("apple", "signin");
        const url = new URL(start.url);
        assert.equal(url.searchParams.get("response_mode"), "form_post");
        assert.equal(
          url.searchParams.get("redirect_uri"),
          "https://www.ovias.shop/api/auth/social/apple/callback",
        );
        assert.equal(cookieOptions("apple").sameSite, "none");
        assert.equal(cookieOptions("apple").secure, true);
      },
    );
    await t.test(
      "Apple client secret is a valid short-lived ES256 JWT",
      async () => {
        const { payload, protectedHeader } = await jwtVerify(
          await appleClientSecret(),
          ec.publicKey,
          {
            algorithms: ["ES256"],
            issuer: "TEAM123",
            audience: "https://appleid.apple.com",
            subject: "shop.ovia.service",
          },
        );
        assert.equal(protectedHeader.kid, "KEY123");
        assert.ok(payload.exp! - payload.iat! <= 300);
      },
    );
    await t.test(
      "Apple Hide My Email and subsequent omitted email supported",
      async () => {
        const apple: Flow = { ...flow, provider: "apple" };
        const idToken = await token(
          { email: "relay@privaterelay.appleid.com", email_verified: "true" },
          "https://appleid.apple.com",
          "shop.ovia.service",
        );
        const identity = await verifyIdentity(apple, idToken, keys);
        const first = await resolveSocialUser(
          apple,
          identity,
          "Apple Traveler",
        );
        assert.equal(first.email, "relay@privaterelay.appleid.com");
        assert.equal(
          (await resolveSocialUser(apple, { sub: identity.sub })).id,
          first.id,
        );
      },
    );
  } finally {
    database.restore();
    globalThis.fetch = originalFetch;
    process.chdir(originalCwd);
    for (const key of Object.keys(process.env))
      if (!(key in originalEnv)) delete process.env[key];
    Object.assign(process.env, originalEnv);
    assert.equal(path.dirname(path.resolve(dir)), path.resolve(tmpdir()));
    assert.ok(path.basename(dir).startsWith("ovia-social-test-"));
    await rm(dir, { recursive: true, force: true });
  }
});
