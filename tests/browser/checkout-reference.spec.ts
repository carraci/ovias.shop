import { test, expect } from "@playwright/test";

// Isolated UI fixtures: never create a real order or change MongoDB records.
const item = {
  sku: "UI-TEST-TITANIUM",
  name: "Checkout test cabin",
  color: "Titanium",
  price: 1200,
  quantity: 1,
  image: "/media/cat-crossbody.jpg",
  slug: "original-cabin",
};
test.beforeEach(async ({ page }) => {
  await page.route("**/api/v1/account", (route) =>
    route.fulfill({ json: { data: { user: null } } }),
  );
  await page.route("**/api/v1/cart", (route) =>
    route.fulfill({
      json: { data: { lines: [item], total: 1200, version: 1 } },
    }),
  );
});

test("reference checkout uses real cart data and validates both Pay buttons", async ({
  page,
}) => {
  let calls = 0;
  await page.route("**/api/v1/checkout", async (route) => {
    calls++;
    expect(route.request().postDataJSON().address.name).toBe("Test Customer");
    await route.fulfill({
      status: 503,
      json: { error: { message: "Test payment unavailable" } },
    });
  });
  await page.setViewportSize({ width: 1536, height: 1024 });
  await page.goto("/checkout");
  await expect(
    page.getByRole("heading", { name: item.name, exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Signature Crossbody", { exact: true }),
  ).toHaveCount(0);
  const pay = page.getByRole("button", { name: /^PAY/ });
  await expect(pay).toHaveCount(2);
  await pay.last().click();
  expect(calls).toBe(0);
  await expect(page.locator("#fullName")).toBeFocused();
  await page.locator("#fullName").fill("Test Customer");
  await page.locator("#phoneNumber").fill("9876543210");
  await page.locator("#emailAddress").fill("test@example.com");
  await page.locator("#streetAddress").fill("123 Test Street");
  await page.locator("#city").fill("Mumbai");
  await page.locator("#pinCode").fill("400001");
  await page.screenshot({
    path: "artifacts/checkout-reference-desktop.png",
    fullPage: true,
  });
  await pay.first().click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Test payment unavailable" }),
  ).toBeVisible();
  expect(calls).toBe(1);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => {
    (document.activeElement as HTMLElement)?.blur();
    window.scrollTo({ top: 0, behavior: 'instant' });
  });
  await expect(
    page.getByRole("heading", { name: "Order Summary", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "artifacts/checkout-reference-mobile.png",
    fullPage: true,
  });
});

test("empty checkout never displays or charges a sample product", async ({
  page,
}) => {
  await page.route("**/api/v1/cart", (route) =>
    route.fulfill({ json: { data: { lines: [], total: 0, version: 0 } } }),
  );
  await page.goto("/checkout");
  await expect(
    page.getByText("Your bag is empty or could not be loaded.", {
      exact: false,
    }),
  ).toBeVisible();
  for (const button of await page.getByRole("button", { name: /^PAY/ }).all())
    await expect(button).toBeDisabled();
});

test("quantity updates use the existing cart API and unsupported options cannot alter totals", async ({
  page,
}) => {
  await page.route("**/api/v1/cart/items/*", async (route) => {
    expect(route.request().postDataJSON().quantity).toBe(2);
    await route.fulfill({
      json: {
        data: { lines: [{ ...item, quantity: 2 }], total: 2400, version: 2 },
      },
    });
  });
  await page.goto("/checkout");
  await page.getByRole("button", { name: "Increase quantity" }).click();
  await expect(page.getByText("2 items", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("radio").filter({ hasText: "Express Delivery" }),
  ).toHaveAttribute("aria-disabled", "true");
  await page.getByRole("button", { name: "Have a promo code?" }).click();
  await page.getByRole("textbox", { name: "Promo code" }).fill("TEST");
  await page.getByRole("button", { name: "APPLY", exact: true }).click();
  await expect(
    page.getByText("Promo codes are not supported", { exact: false }),
  ).toBeVisible();
});
