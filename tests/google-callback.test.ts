import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { SignJWT, generateKeyPair, exportJWK } from "jose";
import { NextRequest } from "next/server";
import {
  GET,
  POST,
} from "../src/app/api/auth/social/[provider]/[action]/route";
import { currentUser, signIn, signOut, passwordHash } from "../src/server/auth";
import { transaction } from "../src/server/db";
import { hash } from "../src/server/http";
import type { User, Cart, Session } from "../src/lib/types";
import { installMongoFixture } from "./helpers/mongo-fixture";

test("Google callback creates real OVIA sessions and preserves accounts/carts", async (t) => {
  const originalEnv = { ...process.env };
  const originalCwd = process.cwd();
  const originalFetch = globalThis.fetch;
  const directory = await mkdtemp(
    path.join(tmpdir(), "ovia-google-callback-test-"),
  );
  const require = createRequire(import.meta.url);
  const nextHeaders = require("next/headers");
  const originalCookies = nextHeaders.cookies;
  const values = new Map<string, string>();
  const attributes = new Map<string, Record<string, unknown>>();
  const jar = {
    get(name: string) {
      const value = values.get(name);
      return value ? { name, value } : undefined;
    },
    set(name: string, value: string, options: Record<string, unknown> = {}) {
      if (options.maxAge === 0) values.delete(name);
      else values.set(name, value);
      attributes.set(name, options);
    },
    delete(name: string) {
      values.delete(name);
    },
  };
  nextHeaders.cookies = async () => jar;
  process.chdir(directory);
  const database = installMongoFixture();
  delete process.env.VERCEL;
  Object.assign(process.env, {
    NODE_ENV: "test",
    APP_ORIGIN: "http://localhost:3000",
    JWT_SECRET: "google-callback-test-signing-key-at-least-32-chars",
    GOOGLE_CLIENT_ID: "callback-test-client",
    GOOGLE_CLIENT_SECRET: "callback-test-secret",
  });
  const rsa = await generateKeyPair("RS256", { extractable: true });
  const publicJwk = await exportJWK(rsa.publicKey);
  let nonce = "";
  let sub = "callback-subject";
  let email = "callback@example.test";
  let wrongSignature = false;
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    if (url === "https://www.googleapis.com/oauth2/v3/certs")
      return Response.json({
        keys: [
          { ...publicJwk, kid: "callback-test", alg: "RS256", use: "sig" },
        ],
      });
    assert.equal(
      url,
      "https://oauth2.googleapis.com/token",
      "Only simulated Google calls are permitted.",
    );
    const form = init!.body as URLSearchParams;
    assert.equal(form.get("client_secret"), "callback-test-secret");
    assert.ok(form.get("code_verifier"));
    const key = wrongSignature
      ? (await generateKeyPair("RS256")).privateKey
      : rsa.privateKey;
    const idToken = await new SignJWT({
      nonce,
      email,
      email_verified: true,
      name: "Callback Traveler",
    })
      .setProtectedHeader({ alg: "RS256", kid: "callback-test" })
      .setIssuer("https://accounts.google.com")
      .setAudience("callback-test-client")
      .setSubject(sub)
      .setIssuedAt(Math.floor(Date.now() / 1000) + 45)
      .setExpirationTime("1h")
      .sign(key);
    return Response.json({ id_token: idToken });
  };
  async function start(intent = "signin") {
    const response = await POST(
      new NextRequest("http://localhost:3000/api/auth/social/google/start", {
        method: "POST",
        headers: {
          origin: "http://localhost:3000",
          "content-type": "application/json",
        },
        body: JSON.stringify({ intent, terms: "on" }),
      }),
      { params: Promise.resolve({ provider: "google", action: "start" }) },
    );
    assert.equal(response.status, 200);
    const { data } = await response.json();
    const authorization = new URL(data.url);
    nonce = authorization.searchParams.get("nonce")!;
    assert.equal(attributes.get("ovia_social_google")?.httpOnly, true);
    return new NextRequest(
      `http://localhost:3000/api/auth/social/google/callback?state=${authorization.searchParams.get("state")}&code=simulated-code`,
    );
  }
  const context = {
    params: Promise.resolve({ provider: "google", action: "callback" }),
  };
  try {
    await t.test(
      "verified provider callback creates user, session, and merges guest cart",
      async () => {
        const request = await start();
        const guestId = hash(values.get("ovia_cart")!);
        await transaction((repo) =>
          repo.put<Cart>("carts", {
            id: guestId,
            version: 1,
            lines: [{ sku: "callback-sku", quantity: 2 }],
          }),
        );
        const response = await GET(request, context);
        assert.equal(response.status, 303);
        assert.equal(
          response.headers.get("location"),
          "http://localhost:3000/account",
        );
        assert.equal(attributes.get("ovia_session")?.httpOnly, true);
        assert.equal(attributes.get("ovia_session")?.sameSite, "lax");
        assert.ok(values.get("ovia_session"));
        const user = await currentUser();
        assert.equal(user?.email, email);
        assert.ok(user?.verifiedAt);
        await transaction(async (repo) => {
          assert.equal(
            (await repo.find<Session>("sessions", { userId: user!.id })).length,
            1,
          );
          assert.equal(
            (await repo.get<Cart>("carts", user!.id))?.lines[0].quantity,
            2,
          );
          assert.equal(await repo.get<Cart>("carts", guestId), undefined);
        });
        const replay = await GET(request, context);
        assert.match(replay.headers.get("location")!, /social_error=expired/);
        assert.equal((await currentUser())?.id, user!.id);
      },
    );
    await t.test(
      "returning Google subject reuses account and produces a valid fresh session",
      async () => {
        const before = await currentUser();
        await signOut();
        const request = await start();
        const response = await GET(request, context);
        assert.equal(
          response.headers.get("location"),
          "http://localhost:3000/account",
        );
        assert.equal((await currentUser())?.id, before!.id);
        await transaction(async (repo) =>
          assert.equal((await repo.find<User>("users", { email })).length, 1),
        );
      },
    );
    await t.test(
      "existing password account requires secure explicit linking and then Google login works",
      async () => {
        await signOut();
        sub = "existing-subject";
        email = "existing-callback@example.test";
        const existing: User = {
          id: "existing-callback-user",
          email,
          name: "Existing Traveler",
          passwordHash: passwordHash("Existing1!password"),
          createdAt: new Date().toISOString(),
          verifiedAt: new Date().toISOString(),
        };
        await transaction((repo) => repo.put("users", existing));
        const blocked = await GET(await start(), context);
        assert.match(
          blocked.headers.get("location")!,
          /social_error=account_link/,
        );
        assert.equal(await currentUser(), null);
        await signIn(existing);
        const linked = await GET(await start("link"), context);
        assert.match(
          linked.headers.get("location")!,
          /\/account\/security\?social_linked=1/,
        );
        assert.equal((await currentUser())?.id, existing.id);
        await signOut();
        const login = await GET(await start(), context);
        assert.equal(
          login.headers.get("location"),
          "http://localhost:3000/account",
        );
        assert.equal((await currentUser())?.id, existing.id);
      },
    );
    await t.test(
      "verified Gmail signs into the existing OVIA account without password linking",
      async () => {
        await signOut();
        sub = "gmail-owner-subject";
        email = "callback.owner@gmail.com";
        const existing: User = {
          id: "existing-gmail-user",
          email,
          name: "Original OVIA Name",
          passwordHash: passwordHash("Existing1!password"),
          createdAt: new Date().toISOString(),
          verifiedAt: new Date().toISOString(),
        };
        await transaction((repo) => repo.put("users", existing));
        const response = await GET(await start(), context);
        assert.equal(
          response.headers.get("location"),
          "http://localhost:3000/account",
        );
        assert.equal((await currentUser())?.id, existing.id);
        assert.equal((await currentUser())?.name, existing.name);
        await transaction(async (repo) => {
          assert.deepEqual(
            await repo.get<User>("users", existing.id),
            existing,
          );
          assert.equal((await repo.find<User>("users", { email })).length, 1);
          assert.equal(
            (await repo.find<Session>("sessions", { userId: existing.id }))
              .length,
            1,
          );
        });
        await signOut();
        const repeat = await GET(await start(), context);
        assert.equal(
          repeat.headers.get("location"),
          "http://localhost:3000/account",
        );
        assert.equal((await currentUser())?.id, existing.id);
      },
    );
    await t.test(
      "invalid provider signatures cannot create an OVIA session",
      async () => {
        await signOut();
        wrongSignature = true;
        sub = "forged-subject";
        email = "forged@example.test";
        const response = await GET(await start(), context);
        assert.match(response.headers.get("location")!, /social_error=failed/);
        assert.equal(await currentUser(), null);
        assert.equal(values.has("ovia_session"), false);
        await transaction(async (repo) =>
          assert.equal((await repo.find<User>("users", { email })).length, 0),
        );
      },
    );
  } finally {
    database.restore();
    nextHeaders.cookies = originalCookies;
    globalThis.fetch = originalFetch;
    process.chdir(originalCwd);
    for (const key of Object.keys(process.env))
      if (!(key in originalEnv)) delete process.env[key];
    Object.assign(process.env, originalEnv);
    assert.equal(path.dirname(path.resolve(directory)), path.resolve(tmpdir()));
    assert.ok(
      path.basename(directory).startsWith("ovia-google-callback-test-"),
    );
    await rm(directory, { recursive: true, force: true });
  }
});
