import { test, expect, type Page } from "@playwright/test";
// Fixture API responses exercise UI without payments or customer record writes.
const item = {
  sku: "UI-FIXTURE",
  name: "OVIA Signature Backpack",
  color: "Pebble Black",
  price: 2450000,
  quantity: 1,
  image: "/media/cat-crossbody.jpg",
  slug: "signature-backpack",
};
let quantity = 1,
  version = 1,
  ready = true;
const cart = () => ({
  lines: quantity ? [{ ...item, quantity }] : [],
  total: item.price * quantity,
  version,
});
const quote = (shippingMethod = "standard", promoCode?: string) => {
  const subtotal = item.price * quantity,
    shipping = shippingMethod === "express" ? 49900 : 0,
    discount = promoCode === "FIXTURE10" ? Math.floor(subtotal * 0.1) : 0,
    tax = Math.round((subtotal - discount + shipping) * 0.18),
    total = subtotal - discount + shipping + tax;
  return {
    id: "a".repeat(64),
    cartVersion: version,
    lines: cart().lines,
    subtotal,
    shipping,
    discount,
    tax,
    taxIncluded: false,
    total,
    shippingMethod,
    shippingLabel:
      shippingMethod === "express" ? "Express Delivery" : "Standard Delivery",
    estimate:
      shippingMethod === "express" ? "1–3 business days" : "3–7 business days",
    promoCode,
    currency: "INR",
    payment: ready
      ? { currency: "USD", amount: Math.round(total / 80), rate: "80" }
      : undefined,
    paypalReady: ready,
    expiresAt: new Date(Date.now() + 600000).toISOString(),
    shippingOptions: [
      {
        id: "standard",
        label: "Standard Delivery",
        estimate: "3–7 business days",
        cost: 0,
      },
      {
        id: "express",
        label: "Express Delivery",
        estimate: "1–3 business days",
        cost: 49900,
      },
    ],
  };
};
const address = {
  name: "Test Customer",
  phone: "9876543210",
  email: "test@example.com",
  line1: "123 Test Street",
  line2: "Apartment 4",
  city: "Mumbai",
  region: "Maharashtra",
  postalCode: "400001",
  country: "IN",
};
const sessionId = "12345678-1234-4123-8123-123456789abc";
const session = (status = "pending") => ({
  id: sessionId,
  orderNumber: "OVIA-FIXTURE",
  provider: "paypal",
  status,
  total: quote().total,
  payment: quote().payment,
  quote: quote(),
  address,
  approvalUrl: "https://www.sandbox.paypal.com/checkoutnow?token=fixture",
});
test.beforeEach(async ({ page }) => {
  quantity = 1;
  version = 1;
  ready = true;
  await page.route("**/api/v1/account", (r) =>
    r.fulfill({ json: { data: { user: null } } }),
  );
  await page.route("**/api/v1/cart", (r) =>
    r.fulfill({ json: { data: cart() } }),
  );
  await page.route("**/api/v1/cart/items/*", async (r) => {
    expect(r.request().postDataJSON().version).toBe(version);
    quantity = r.request().postDataJSON().quantity;
    version++;
    await r.fulfill({ json: { data: cart() } });
  });
  await page.route("**/api/v1/checkout/session", (r) =>
    r.fulfill({ json: { data: null } }),
  );
  await page.route("**/api/v1/checkout/quote", (r) => {
    const b = r.request().postDataJSON();
    return r.fulfill({ json: { data: quote(b.shippingMethod, b.promoCode) } });
  });
});
async function information(page: Page) {
  await page.locator("#emailAddress").fill(address.email);
  await page.locator("#firstName").fill("Test");
  await page.locator("#lastName").fill("Customer");
  await page.locator("#phoneNumber").fill(address.phone);
  await page.locator("#streetAddress").fill(address.line1);
  await page.locator("#addressLine2").fill(address.line2);
  await page.locator("#city").fill(address.city);
  await page.locator("#pinCode").fill(address.postalCode);
}
async function review(page: Page) {
  await information(page);
  await page
    .getByRole("button", { name: "Continue to Shipping", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Continue to Payment", exact: true })
    .click();
  await page.getByRole("button", { name: "Review Order", exact: true }).click();
}
test("four steps validate and place one server-quoted order; retry preserves idempotency", async ({
  page,
}) => {
  const keys: string[] = [];
  await page.route("**/api/v1/checkout/paypal", async (r) => {
    const b = r.request().postDataJSON();
    expect(b.address).toMatchObject(address);
    expect(b.quoteId).toBe("a".repeat(64));
    expect(b).not.toHaveProperty("total");
    expect(b).not.toHaveProperty("price");
    keys.push(b.idempotencyKey);
    await r.fulfill({
      status: 503,
      json: { error: { message: "Fixture connection interrupted" } },
    });
  });
  await page.goto("/checkout");
  await expect(
    page.getByRole("heading", { name: "Your information", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Continue to Shipping", exact: true })
    .click();
  await expect(page.locator("#emailAddress")).toBeFocused();
  expect(keys).toHaveLength(0);
  await review(page);
  await expect(
    page.getByRole("heading", { name: "Review your order", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Place Order", exact: true }),
  ).toHaveCount(1);
  await page.getByRole("button", { name: "Place Order", exact: true }).click();
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "Fixture connection interrupted" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Place Order", exact: true }).click();
  await expect.poll(() => keys.length).toBe(2);
  expect(keys[0]).toBe(keys[1]);
});
test("shipping and promo use updated server totals; refresh restores draft and step", async ({
  page,
}) => {
  await page.goto("/checkout");
  await information(page);
  await page
    .getByRole("button", { name: "Continue to Shipping", exact: true })
    .click();
  await page.getByRole("radio", { name: /Express Delivery/ }).check();
  await expect(page.getByText("1–3 business days")).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Shipping", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("radio", { name: /Express Delivery/ }),
  ).toBeChecked();
  await page
    .getByRole("button", { name: "Return to Information", exact: true })
    .click();
  await expect(page.locator("#streetAddress")).toHaveValue(address.line1);
  await page.getByRole("button", { name: /Add a promo code/ }).click();
  await page.getByLabel("Promo code", { exact: true }).fill("FIXTURE10");
  await page.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(page.getByText("Discount", { exact: true })).toBeVisible();
});
test("mobile has a collapsible accessible summary, no overflow, and one final CTA", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/checkout");
  await expect(
    page.getByRole("heading", { name: "Your information", exact: true }),
  ).toHaveCSS("font-size", "28px");
  await review(page);
  const toggle = page.getByRole("button", { name: /Order summary ·/ });
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(
    page.getByRole("button", { name: "Place Order", exact: true }),
  ).toBeVisible();
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(
    page.getByRole("button", { name: "Place Order", exact: true }),
  ).toHaveCount(1);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "C:/Users/Adarsh/Documents/Codex/2026-09-30/op-3/work/checkout-mobile.png",
    fullPage: true,
  });
});
test("unconfigured PayPal blocks payment while preserving the information flow", async ({
  page,
}) => {
  ready = false;
  await page.goto("/checkout");
  await information(page);
  await page
    .getByRole("button", { name: "Continue to Shipping", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Continue to Payment", exact: true })
    .click();
  await expect(
    page.getByText(/PayPal sandbox is not configured yet/),
  ).toBeVisible();
  await page.getByRole("button", { name: "Review Order", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Place Order", exact: true }),
  ).toBeDisabled();
});
test("approved return is captured server-side and reaches verified confirmation", async ({
  page,
}) => {
  await page.route(`**/api/v1/checkout/session/${sessionId}`, (r) =>
    r.fulfill({ json: { data: session() } }),
  );
  let captures = 0;
  await page.route(`**/api/v1/checkout/capture/${sessionId}`, (r) => {
    captures++;
    return r.fulfill({ json: { data: session("paid") } });
  });
  await page.route(`**/api/v1/orders/${sessionId}`, (r) =>
    r.fulfill({
      json: {
        data: {
          ...session("paid"),
          lines: quote().lines,
          checkoutQuote: quote(),
          createdAt: new Date().toISOString(),
          expiresAt: new Date().toISOString(),
        },
      },
    }),
  );
  await page.goto(`/checkout?paypal=return&order=${sessionId}`);
  await expect(
    page.getByRole("heading", { name: "Thank you for choosing OVIA." }),
  ).toBeVisible();
  expect(captures).toBeGreaterThan(0);
  await expect(page.getByText("OVIA-FIXTURE", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Delivery details" }),
  ).toBeVisible();
});
test("cancelled approval restores checkout, and refresh recovers unfinished setup", async ({
  page,
}) => {
  await page.route(`**/api/v1/checkout/session/${sessionId}`, (r) =>
    r.fulfill({ json: { data: session() } }),
  );
  await page.route(`**/api/v1/checkout/cancel/${sessionId}`, (r) =>
    r.fulfill({ json: { data: session("cancelled") } }),
  );
  await page.goto(`/checkout?paypal=cancel&order=${sessionId}`);
  await expect(
    page.getByText(/Payment cancelled\. Your information is saved/),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Place Order", exact: true }),
  ).toBeVisible();
  await page.unroute(`**/api/v1/checkout/session/${sessionId}`);
  await page.route("**/api/v1/checkout/session", (r) =>
    r.fulfill({ json: { data: { ...session(), approvalUrl: undefined } } }),
  );
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Retry PayPal setup", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Place Order", exact: true }),
  ).toHaveCount(0);
});
test("desktop typography and summary stay restrained", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/checkout");
  await expect(
    page.getByRole("heading", { name: "Your information", exact: true }),
  ).toHaveCSS("font-size", "36px");
  await expect(
    page.getByRole("complementary", { name: "Order Summary" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Your order", exact: true }),
  ).toHaveCSS("font-size", "22px");
  await expect(
    page.getByRole("button", { name: "Continue to Shipping", exact: true }),
  ).toBeEnabled();
  await expect(page.getByText("Tax", { exact: true })).toBeVisible();
  await page.screenshot({
    path: "C:/Users/Adarsh/Documents/Codex/2026-09-30/op-3/work/checkout-desktop.png",
    fullPage: true,
  });
});

test("quantity changes refresh the server quote; removal gives an honest empty bag", async ({
  page,
}) => {
  await page.goto("/checkout");
  await expect(
    page.getByRole("button", { name: "Continue to Shipping", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: /Increase quantity/ }).click();
  await expect.poll(() => quantity).toBe(2);
  await expect(page.locator("#checkout-summary").getByText("₹57,820", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: /Remove OVIA Signature Backpack/ })
    .click();
  await expect(
    page.getByRole("link", { name: "Continue shopping", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Continue to Shipping", exact: true }),
  ).toBeDisabled();
});
test("a signed-in customer can select a saved address and complete review", async ({
  page,
}) => {
  await page.route("**/api/v1/account", (r) =>
    r.fulfill({
      json: {
        data: {
          user: {
            id: "fixture-user",
            name: "Test Customer",
            email: address.email,
          },
        },
      },
    }),
  );
  await page.route("**/api/v1/account/addresses", (r) =>
    r.fulfill({ json: { data: [{ ...address, id: "fixture-address" }] } }),
  );
  await page.goto("/checkout");
  await page
    .getByRole("button", { name: "Use a saved address", exact: true })
    .click();
  await page
    .getByRole("button", { name: /Test Customer.*123 Test Street/ })
    .click();
  await expect(page.locator("#firstName")).toHaveValue("Test");
  await expect(page.locator("#streetAddress")).toHaveValue(address.line1);
  await expect(page.locator("#phoneNumber")).toHaveValue(address.phone);
  await page
    .getByRole("button", { name: "Continue to Shipping", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Continue to Payment", exact: true })
    .click();
  await page.getByRole("button", { name: "Review Order", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Place Order", exact: true }),
  ).toBeEnabled();
});
