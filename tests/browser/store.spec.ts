import { test, expect } from "@playwright/test";
test("browse, filter, select variant, cart refresh and demo checkout", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Go further. Carry less." }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Explore the collection", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "Luggage", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Filters", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Material", exact: true })
    .selectOption("Aluminium");
  await expect(page.locator(".product-card")).toHaveCount(7);
  await page.locator(".product-card").first().locator(".product-image").click();
  await page.getByRole("button", { name: "Dune", exact: true }).click();
  await page.getByRole("button", { name: "Add to bag", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Added to your bag");
  await page.getByRole("link", { name: "View your bag" }).click();
  await expect(page.locator(".cart-line")).toHaveCount(1);
  await page.reload();
  await expect(page.locator(".cart-line")).toHaveCount(1);
  await page.getByRole("link", { name: "Continue to checkout" }).click();
  await page.getByLabel("Full name").fill("Demo Traveler");
  await page.getByLabel("Email", { exact: true }).fill("traveler@example.com");
  await page.getByLabel("Street address").fill("10 Example Road");
  await page.getByLabel("City", { exact: true }).fill("Mumbai");
  await page.getByLabel("State", { exact: true }).fill("Maharashtra");
  await page.getByLabel("Postal code").fill("400001");
  await page
    .getByRole("button", { name: "Continue with demo checkout" })
    .click();
  await expect(
    page.getByText("DEMO ORDER SAVED", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("This sample order was saved.", { exact: false }),
  ).toBeVisible();
});
test("account registration, logout and authentication errors", async ({
  page,
}) => {
  await page.goto("/account/register");
  const email = `test-${Date.now()}@example.com`;
  await page.getByLabel(/^First name/).fill("Test");
  await page.getByLabel(/^Last name/).fill("Traveler");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel(/^Password/).fill("Test-password-123");
  await page.getByLabel(/^Confirm password/).fill("Test-password-123");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(
    page.getByRole("heading", { name: "Welcome, Test." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.waitForURL("**/account/sign-in");
  await expect(
    page.getByRole("heading", { name: "Good to see you again." }),
  ).toBeVisible();
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel(/^Password/).fill("Incorrect-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.locator(".form-error")).toContainText(
    "Email or password is incorrect",
  );
});
test("narrow viewports do not overflow", async ({ page }) => {
  for (const width of [320, 375, 390, 414, 768, 1024, 1280, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("button", { name: "Luggage", exact: true }).click();
  await expect(
    page.getByRole("link", { name: "Cabin", exact: true }),
  ).toBeVisible();
});
test("API rejects wrong origins, missing ownership and invalid quantities", async ({
  request,
}) => {
  const badOrigin = await request.post("/api/v1/cart/items", {
    headers: { origin: "https://untrusted.example" },
    data: { sku: "fake", quantity: 1 },
  });
  expect(badOrigin.status()).toBe(403);
  const wrongQty = await request.post("/api/v1/cart/items", {
    headers: { origin: "http://localhost:3000" },
    data: { sku: "fake", quantity: -1 },
  });
  expect(wrongQty.status()).toBe(400);
  expect((await request.get("/api/v1/account/orders")).status()).toBe(401);
  expect((await request.get("/api/v1/orders/not-owned")).status()).toBe(404);
});
