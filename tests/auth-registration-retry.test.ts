import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { POST } from "../src/app/api/v1/[[...path]]/route";
import { transaction } from "../src/server/db";
import { checkPassword } from "../src/server/auth";
import { hash } from "../src/server/http";
import type { User } from "../src/lib/types";
import { installMongoFixture } from "./helpers/mongo-fixture";

test("registration can recover from rejected email without replacing an existing account", async (t) => {
  const saved = { ...process.env };
  const database = installMongoFixture([]);
  const originalFetch = globalThis.fetch;
  const input = {
    email: "registration-retry@example.test", name: "Original Traveler",
    password: "Original-password-123", confirmPassword: "Original-password-123", terms: "on",
  };
  Object.assign(process.env, {
    NODE_ENV: "test", APP_ORIGIN: "http://localhost:3000",
    EMAIL_API_KEY: "test-only-provider-key", EMAIL_FROM: "OVIA <test@example.test>",
  });
  let rejectEmail = true;
  let sent = 0;
  globalThis.fetch = async (url) => {
    assert.equal(String(url), "https://api.resend.com/emails", "Only the mocked email provider may be called.");
    sent++;
    return rejectEmail
      ? Response.json({ message: "Fixture email rejected" }, { status: 422 })
      : Response.json({ id: "mock-retry-email" });
  };
  const register = (data = input) => POST(new NextRequest("http://localhost:3000/api/v1/auth/register", {
    method: "POST", headers: { origin: "http://localhost:3000", "content-type": "application/json" },
    body: JSON.stringify(data),
  }), { params: Promise.resolve({ path: ["auth", "register"] }) });
  const account = async () => (await transaction(repo => repo.find<User>("users", { email: input.email })))[0];
  let original: User;
  try {
    await t.test("failed email reports failure and retains one unverified account", async () => {
      assert.equal((await register()).status, 502);
      original = await account();
      assert.ok(original);
      assert.equal(original.verifiedAt, undefined);
      assert.ok(checkPassword(input.password, original.passwordHash));
      assert.equal(database.snapshot().users.length, 1);
      assert.equal(database.snapshot().tokens.length, 0);
    });
    await t.test("another password cannot overwrite or verify the pending account", async () => {
      const response = await register({ ...input, name: "Replacement Traveler", password: "Another-password-456", confirmPassword: "Another-password-456" });
      assert.equal(response.status, 409);
      assert.deepEqual(await account(), original);
      assert.equal(sent, 1);
    });
    await t.test("the original password resumes verification after the resend cooldown", async () => {
      // Advance past the retry window in the isolated fixture only.
      await transaction(repo => repo.remove("limits", hash(`verify-cooldown:${input.email}`)));
      rejectEmail = false;
      const response = await register({ ...input, name: "Replacement Traveler" });
      assert.equal(response.status, 200);
      assert.equal((await response.json()).data.verificationRequired, true);
      assert.deepEqual(await account(), original);
      assert.equal(database.snapshot().users.length, 1);
      assert.equal(database.snapshot().tokens.filter(token => token.purpose === "verify-otp").length, 1);
      assert.equal(sent, 2);
    });
    await t.test("verified accounts still require sign-in or recovery", async () => {
      await transaction(repo => repo.put("users", { ...original, verifiedAt: new Date().toISOString() }));
      assert.equal((await register()).status, 409);
      assert.equal(sent, 2);
      assert.equal(database.snapshot().users.length, 1);
    });
  } finally {
    globalThis.fetch = originalFetch;
    database.restore();
    for (const key of Object.keys(process.env)) if (!(key in saved)) delete process.env[key];
    Object.assign(process.env, saved);
  }
});
