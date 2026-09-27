import { test, expect } from "@playwright/test";
test("care resources enforce ownership, exports omit secrets and staff APIs reject customers", async ({
  playwright,
}) => {
  const context = () =>
    playwright.request.newContext({
      baseURL: "http://localhost:3000",
      extraHTTPHeaders: { origin: "http://localhost:3000" },
    });
  const a = await context(),
    b = await context();
  const password = "Unique-care-passphrase-123";
  const signup = (email: string) => ({
    name: "Care Tester",
    email,
    password,
    confirmPassword: password,
    terms: "on",
  });
  const email = `care-a-${Date.now()}@example.com`;
  expect(
    (await a.post("/api/v1/auth/register", { data: signup(email) })).status(),
  ).toBe(200);
  expect(
    (
      await b.post("/api/v1/auth/register", {
        data: signup(`care-b-${Date.now()}@example.com`),
      })
    ).status(),
  ).toBe(200);
  const input = {
    category: "Product question",
    subject: "A useful question",
    message: "Please explain the cabin dimensions.",
    orderId: "",
    idempotencyKey: crypto.randomUUID(),
  };
  const created = await a.post("/api/v1/care/tickets", { data: input });
  expect(created.status()).toBe(200);
  const ticket = (await created.json()).data;
  expect((await a.post("/api/v1/care/tickets", { data: input })).status()).toBe(
    200,
  );
  expect((await b.get(`/api/v1/care/tickets/${ticket.id}`)).status()).toBe(404);
  expect(
    (
      await b.post("/api/v1/care/reply", {
        data: {
          ticketId: ticket.id,
          message: "unauthorized",
          idempotencyKey: crypto.randomUUID(),
        },
      })
    ).status(),
  ).toBe(404);
  expect((await a.get("/api/v1/care/admin")).status()).toBe(403);
  expect(
    (
      await a.post("/api/v1/checkout", {
        data: {
          market: "US",
          idempotencyKey: crypto.randomUUID(),
          address: {
            name: "Care Tester",
            email,
            line1: "10 Example Road",
            city: "Mumbai",
            region: "Maharashtra",
            postalCode: "400001",
            country: "IN",
          },
        },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await a.post("/api/v1/care/export", { data: { password: "wrong" } })
    ).status(),
  ).toBe(401);
  const exported = await a.post("/api/v1/care/export", { data: { password } });
  expect(exported.status()).toBe(200);
  const text = await exported.text();
  expect(text).toContain(email);
  for (const secret of [
    "passwordHash",
    "ovia_session",
    "idempotencyKey",
    "providerId",
  ])
    expect(text).not.toContain(secret);
  const privacy = await a.post("/api/v1/care/privacy", {
    data: {
      requestType: "Delete my account/data",
      message: "Test request",
      password,
      confirmed: true,
      idempotencyKey: crypto.randomUUID(),
    },
  });
  expect(privacy.status()).toBe(200);
  expect((await privacy.json()).data.status).toBe("Submitted");
  expect(
    (
      await a.post("/api/v1/care/tickets", {
        data: {
          ...input,
          idempotencyKey: crypto.randomUUID(),
          userId: "someone-else",
        },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await a.post("/api/v1/care/revoke-sessions", { data: { password } })
    ).status(),
  ).toBe(200);
  expect((await a.get("/api/v1/care/tickets")).status()).toBe(401);
  await a.dispose();
  await b.dispose();
});
test("signup requires terms and confirmation; support search and policies work at 320px", async ({
  page,
  request,
}) => {
  const base = {
    name: "Invalid Tester",
    email: `invalid-${Date.now()}@example.com`,
    password: "Long-test-password-123",
  };
  expect(
    (
      await request.post("/api/v1/auth/register", {
        headers: { origin: "http://localhost:3000" },
        data: base,
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.post("/api/v1/auth/register", {
        headers: { origin: "http://localhost:3000" },
        data: { ...base, confirmPassword: base.password },
      })
    ).status(),
  ).toBe(400);
  await page.setViewportSize({ width: 320, height: 850 });
  for (const path of [
    "/help",
    "/contact",
    "/privacy",
    "/terms",
    "/security",
    "/heritage",
    "/preferences",
    "/account/register",
  ]) {
    await page.goto(path);
    await expect(page.locator("main h1")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
  }
  await page.goto("/help");
  await page.getByLabel("How can we help?").fill("password");
  await expect(page.locator(".faq-list details")).toHaveCount(3);
  await page.goto("/faq#reset-password");
  await expect(page.locator("#reset-password")).toHaveAttribute("open", "");
  await page.goto("/account/register");
  await page.getByLabel("Password", { exact: true }).fill("Long-password-123");
  await page
    .getByRole("button", { name: "Show password", exact: true })
    .click();
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute(
    "type",
    "text",
  );
});
test("regional preferences persist, conversion uses supplied rates and rejecting preferences clears them", async ({
  page,
}) => {
  await page.route("**/api/v1/rates", (route) =>
    route.fulfill({
      json: {
        data: {
          rates: [{ currency: "USD", rate: 0.01, date: "2026-09-22" }],
          provider: "test fixture",
        },
      },
    }),
  );
  await page.goto("/preferences");
  await page.getByLabel("Country / region").selectOption("US");
  await page.getByLabel("Display currency").selectOption("USD");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Apply preferences" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Preferences applied" }),
  ).toBeVisible();
  await page.goto("/luggage");
  await expect(page.locator(".price").first()).toContainText("≈");
  await page.goto("/preferences");
  await expect(page.getByLabel("Country / region")).toHaveValue("US");
  await page.goto("/cookie-preferences");
  await page.getByRole("button", { name: "Reject optional storage" }).click();
  await expect(page.getByText("Cookie preferences saved.")).toBeVisible();
  await page.goto("/preferences");
  await expect(page.getByLabel("Country / region")).toHaveValue("IN");
});

test('customer can create a support conversation, reply and download their account data',async({page})=>{
 const password='UI-support-passphrase-123';
 const response=await page.request.post('/api/v1/auth/register',{headers:{origin:'http://localhost:3000'},data:{name:'Support Traveler',email:`support-ui-${Date.now()}@example.com`,password,confirmPassword:password,terms:'on'}});expect(response.status()).toBe(200);
 await page.goto('/contact');await page.getByLabel('Subject',{exact:true}).fill('Carry dimensions');await page.getByLabel('Message',{exact:true}).fill('Can you explain the cabin dimensions please?');await page.getByRole('button',{name:'Create support request'}).click();await expect(page.locator('.conversation h2')).toHaveText('Carry dimensions');
 await page.getByLabel('Reply',{exact:true}).fill('I am planning a short weekend trip.');await page.getByRole('button',{name:'Send reply',exact:true}).click();await expect(page.locator('.conversation-message')).toHaveCount(2);
 await page.goto('/privacy/request');await page.getByLabel('Password for download').fill(password);const download=page.waitForEvent('download');await page.getByRole('button',{name:'Download my data'}).click();expect((await download).suggestedFilename()).toBe('ovia-my-data.json');
});
