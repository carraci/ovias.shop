import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
test("checkout is idempotent and order access is isolated", async ({
  playwright,
}) => {
  const a = await playwright.request.newContext({
    baseURL: "http://localhost:3000",
    extraHTTPHeaders: { origin: "http://localhost:3000" },
  });
  const b = await playwright.request.newContext({
    baseURL: "http://localhost:3000",
  });
  const catalog = await (await a.get("/api/v1/products")).json();
  const sku = catalog.data.items[0].variants[0].sku;
  await a.post("/api/v1/cart/items", { data: { sku, quantity: 1 } });
  const input = {
    address: {
      name: "Test Traveler",
      email: "test@example.com",
      line1: "10 Example Road",
      city: "Mumbai",
      region: "Maharashtra",
      postalCode: "400001",
      country: "IN",
    },
    idempotencyKey: crypto.randomUUID(),
  };
  const first = await a.post("/api/v1/checkout", { data: input });
  expect(first.status()).toBe(200);
  const order = await first.json();
  const retry = await a.post("/api/v1/checkout", { data: input });
  expect((await retry.json()).data.url).toBe(order.data.url);
  const id = order.data.url.split("/")[2];
  expect((await b.get(`/api/v1/orders/${id}`)).status()).toBe(404);
  expect((await a.get(`/api/v1/orders/${id}`)).status()).toBe(200);
  await a.dispose();
  await b.dispose();
});
test("address ownership and logout revoke a captured JWT", async ({
  playwright,
}) => {
  const a = await playwright.request.newContext({
    baseURL: "http://localhost:3000",
    extraHTTPHeaders: { origin: "http://localhost:3000" },
  });
  const registration = await a.post("/api/v1/auth/register", {
    data: {
      name: "Address Tester",
      email: `address-${Date.now()}@example.com`,
      password: "A-secure-test-password", confirmPassword: "A-secure-test-password", terms: "on",
    },
  });
  expect(registration.status()).toBe(200);
  const captured = await a.storageState();
  const b = await playwright.request.newContext({
    baseURL: "http://localhost:3000",
    storageState: captured,
    extraHTTPHeaders: { origin: "http://localhost:3000" },
  });
  const created = await a.post("/api/v1/account/addresses", {
    data: {
      name: "Test Traveler",
      email: "test@example.com",
      line1: "10 Example Road",
      city: "Mumbai",
      region: "Maharashtra",
      postalCode: "400001",
      country: "IN",
    },
  });
  expect(created.status()).toBe(201);
  const address = (await created.json()).data;
  const other = await playwright.request.newContext({
    baseURL: "http://localhost:3000",
    extraHTTPHeaders: { origin: "http://localhost:3000" },
  });
  await other.post("/api/v1/auth/register", {
    data: {
      name: "Other Tester",
      email: `other-${Date.now()}@example.com`,
      password: "Another-test-password", confirmPassword: "Another-test-password", terms: "on",
    },
  });
  expect(
    (await other.delete(`/api/v1/account/addresses/${address.id}`)).status(),
  ).toBe(404);
  await other.dispose();
  expect((await a.get("/api/v1/account/addresses")).status()).toBe(200);
  await a.post("/api/v1/auth/logout", { data: {} });
  expect((await b.get("/api/v1/account/orders")).status()).toBe(401);
  expect(
    (await b.delete(`/api/v1/account/addresses/${address.id}`)).status(),
  ).toBe(401);
  await a.dispose();
  await b.dispose();
});
test("email verification links are single-use", async ({
  playwright,
}) => {
  test.skip(
    Boolean(process.env.MONGODB_URI),
    "This fixture reads only the local demo outbox.",
  );
  const a = await playwright.request.newContext({
    baseURL: "http://localhost:3000",
    extraHTTPHeaders: { origin: "http://localhost:3000" },
  });
  const email = `reset-${Date.now()}@example.com`;
  expect(
    (
      await a.post("/api/v1/auth/register", {
        data: {
          name: "Recovery Tester",
          email,
          password: "Original-test-password", confirmPassword: "Original-test-password", terms: "on",
        },
      })
    ).status(),
  ).toBe(200);
  async function tokenFor(subject: string) {
    const state = JSON.parse(await readFile(".data/store.json", "utf8"));
    const mail = state.outbox.find(
      (m: { to: string; subject: string }) =>
        m.to === email && m.subject === subject,
    );
    return /token=([a-f0-9]{64})/.exec(mail.text)![1];
  }
  const verification = await tokenFor("Verify your OVIA email");
  expect(
    (
      await a.post("/api/v1/auth/verify-email", {
        data: { token: verification },
      })
    ).status(),
  ).toBe(200);
  expect(
    (
      await a.post("/api/v1/auth/verify-email", {
        data: { token: verification },
      })
    ).status(),
  ).toBe(400);
  await a.dispose();
});
