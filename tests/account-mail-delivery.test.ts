import test from "node:test";
import assert from "node:assert/strict";
import { sendAccountEmail } from "../src/server/mail";

test("account email delivery uses the configured sender, recipient and idempotency identity", async () => {
  const saved = { ...process.env };
  const fetch = globalThis.fetch;
  try {
    Object.assign(process.env, { NODE_ENV: "test" });
    process.env.EMAIL_API_KEY = "test-only-provider-key";
    process.env.EMAIL_FROM = "OVIA <test@example.test>";
    let calls = 0;
    globalThis.fetch = async (url, init) => {
      calls++;
      assert.equal(String(url), "https://api.resend.com/emails");
      assert.equal(new Headers(init?.headers).get("Idempotency-Key"), "fixture-delivery-1");
      assert.equal(new Headers(init?.headers).get("Authorization"), "Bearer test-only-provider-key");
      assert.deepEqual(JSON.parse(String(init?.body)), {
        from: "OVIA <test@example.test>", to: ["customer@example.test"],
        subject: "Your order update", text: "Your verified order was packed.",
        html: "<p>Your verified order was packed.</p>",
        cc: ["participant@example.test"], reply_to: "support@example.test",
      });
      return Response.json({ id: "mock-provider-1" });
    };
    await sendAccountEmail({ id: "fixture-delivery-1", to: " CUSTOMER@EXAMPLE.TEST ", subject: "Your order update", text: "Your verified order was packed.", html: "<p>Your verified order was packed.</p>", cc: ["participant@example.test"], replyTo: "support@example.test" });
    assert.equal(calls, 1);
  } finally {
    globalThis.fetch = fetch;
    for (const key of Object.keys(process.env)) if (!(key in saved)) delete process.env[key];
    Object.assign(process.env, saved);
  }
});

test("unconfigured email delivery fails before any provider request", async () => {
  const saved = { ...process.env };
  const fetch = globalThis.fetch;
  try {
    delete process.env.EMAIL_API_KEY;
    delete process.env.EMAIL_FROM;
    globalThis.fetch = async () => { throw new Error("Unexpected external request"); };
    await assert.rejects(sendAccountEmail({ id: "fixture-no-provider", to: "customer@example.test", subject: "Update", text: "Update" }), /configuration missing/);
  } finally {
    globalThis.fetch = fetch;
    for (const key of Object.keys(process.env)) if (!(key in saved)) delete process.env[key];
    Object.assign(process.env, saved);
  }
});

test("email provider rejection is reported as failure rather than delivery", async () => {
  const saved = { ...process.env };
  const fetch = globalThis.fetch;
  try {
    Object.assign(process.env, { NODE_ENV: "test", EMAIL_API_KEY: "test-only-provider-key", EMAIL_FROM: "OVIA <test@example.test>" });
    globalThis.fetch = async () => Response.json({ name: "validation_error", message: "Recipient rejected" }, { status: 422 });
    await assert.rejects(sendAccountEmail({ id: "fixture-rejection", to: "customer@example.test", subject: "Update", text: "Update" }), /Resend \(422\).*Recipient rejected/);
  } finally {
    globalThis.fetch = fetch;
    for (const key of Object.keys(process.env)) if (!(key in saved)) delete process.env[key];
    Object.assign(process.env, saved);
  }
});

test("email transport failures cannot be mistaken for a sent email", async () => {
  const saved = { ...process.env };
  const fetch = globalThis.fetch;
  try {
    Object.assign(process.env, { NODE_ENV: "test", EMAIL_API_KEY: "test-only-provider-key", EMAIL_FROM: "OVIA <test@example.test>" });
    globalThis.fetch = async () => { throw new Error("Fixture provider disconnected"); };
    await assert.rejects(sendAccountEmail({ id: "fixture-disconnection", to: "customer@example.test", subject: "Update", text: "Update" }), /Resend request failed.*Fixture provider disconnected/);
  } finally {
    globalThis.fetch = fetch;
    for (const key of Object.keys(process.env)) if (!(key in saved)) delete process.env[key];
    Object.assign(process.env, saved);
  }
});
