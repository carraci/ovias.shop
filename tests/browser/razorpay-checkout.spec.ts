import { expect, test, type Page } from "@playwright/test";

// All API responses and the hosted SDK are fixtures. These tests never contact
// Razorpay, create payment records, send emails, or use merchant credentials.
const localOrderId = "12345678-1234-4123-8123-123456789abc";
const providerOrderId = "order_browser_fixture";
const paymentId = "pay_browser_fixture";
const publicKey = "rzp_live_browser_fixture";
const idempotencyKey = "11111111-1111-4111-8111-111111111111";
const address = {
  name: "Test Customer",
  phone: "9876543210",
  email: "test@example.test",
  line1: "123 Fixture Street",
  line2: "Apartment 4",
  city: "Mumbai",
  region: "Maharashtra",
  postalCode: "400001",
  country: "IN",
};
const line = {
  sku: "RAZORPAY-UI-FIXTURE",
  name: "OVIA Signature Backpack",
  color: "Pebble Black",
  price: 2450000,
  quantity: 1,
  image: "/media/cat-crossbody.jpg",
  slug: "signature-backpack",
};
const quote = {
  id: "a".repeat(64),
  cartVersion: 1,
  lines: [line],
  subtotal: line.price,
  shipping: 0,
  discount: 0,
  tax: 441000,
  taxIncluded: false,
  total: 2891000,
  shippingMethod: "standard",
  shippingLabel: "Standard Delivery",
  estimate: "3–7 business days",
  currency: "INR",
  payment: { currency: "INR", amount: 2891000, rate: "1" },
  paypalReady: false,
  expiresAt: "2099-01-01T00:00:00.000Z",
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
const session = (status = "pending") => ({
  id: localOrderId,
  orderNumber: "OVIA-RZP-FIXTURE",
  provider: "razorpay",
  status,
  key: publicKey,
  orderId: providerOrderId,
  amount: quote.total,
  total: quote.total,
  currency: "INR",
  quote,
  address,
});
type FixtureSession = ReturnType<typeof session>;
type RecordedRequest = { path: string; method: string; body: unknown };
type FixtureState = {
  ready: boolean;
  active: FixtureSession | null;
  verificationStatus: string;
  creationFailures: number;
  verificationFailures: number;
  requests: RecordedRequest[];
  unexpected: string[];
};
type FixtureSdkOptions = {
  key: string;
  order_id: string;
  amount: number;
  currency: string;
  handler: (value: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => void | Promise<void>;
  modal?: { ondismiss?: () => void };
};
type FixtureWindow = Window & {
  __razorpayFixture?: {
    opened: number;
    options: FixtureSdkOptions;
    listeners: Record<string, (value: unknown) => void>;
  };
};

async function fixtures(page: Page, overrides: Partial<FixtureState> = {}) {
  const state: FixtureState = {
    ready: true,
    active: null,
    verificationStatus: "paid",
    creationFailures: 0,
    verificationFailures: 0,
    requests: [],
    unexpected: [],
    ...overrides,
  };
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const method = request.method();
    const body = request.postData() ? request.postDataJSON() : undefined;
    state.requests.push({ path, method, body });
    const respond = (data: unknown) => route.fulfill({ json: { data } });
    const fail = (message: string) =>
      route.fulfill({ status: 503, json: { error: { message } } });
    if (path === "/api/v1/account" && method === "GET")
      return respond({ user: null });
    if (path === "/api/v1/cart" && method === "GET")
      return respond({ lines: [line], total: line.price, version: 1 });
    if (path === "/api/v1/checkout/quote" && method === "POST")
      return respond(quote);
    if (path === "/api/v1/payments/razorpay/config" && method === "GET")
      return respond({
        ready: state.ready,
        provider: "razorpay",
        ...(state.ready ? { key: publicKey, mode: "live" } : {}),
      });
    if (path === "/api/v1/payments/razorpay/sessions" && method === "GET")
      return respond(state.active);
    if (path === "/api/v1/payments/razorpay/sessions" && method === "POST") {
      if (state.creationFailures-- > 0)
        return fail("Fixture gateway connection interrupted.");
      state.active ||= session();
      return respond(state.active);
    }
    if (
      path === `/api/v1/payments/razorpay/sessions/${localOrderId}` &&
      method === "GET"
    )
      return respond(state.active);
    if (path === "/api/v1/payments/razorpay/verify" && method === "POST") {
      if (state.verificationFailures-- > 0)
        return fail("Fixture payment verification is temporarily unavailable.");
      state.active = session(state.verificationStatus);
      return respond(state.active);
    }
    if (path === `/api/v1/orders/${localOrderId}` && method === "GET")
      return respond({
        ...state.active,
        lines: quote.lines,
        checkoutQuote: quote,
        createdAt: "2026-10-01T00:00:00.000Z",
        expiresAt: "2099-01-01T00:00:00.000Z",
      });
    // Historical PayPal recovery can coexist with the selected live provider.
    if (path === "/api/v1/checkout/session" && method === "GET")
      return respond(null);
    state.unexpected.push(`${method} ${path}`);
    return fail("Unexpected fixture request was blocked.");
  });
  // Fail closed for any real payment-provider request, except the SDK fixture.
  await page.route(/^https:\/\/(?:api|checkout)\.razorpay\.com\//, (route) =>
    route.abort("blockedbyclient"),
  );
  await page.route("https://checkout.razorpay.com/v1/checkout.js", (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: `
        window.__razorpayFixture = { opened: 0 };
        window.Razorpay = class {
          constructor(options) {
            this.options = options;
            this.listeners = {};
            window.__razorpayFixture.options = options;
            window.__razorpayFixture.listeners = this.listeners;
          }
          on(event, listener) { this.listeners[event] = listener; }
          open() { window.__razorpayFixture.opened += 1; }
          close() {}
        };
      `,
    }),
  );
  await page.route("https://embed.tawk.to/**", (route) =>
    route.abort("blockedbyclient"),
  );
  return state;
}

async function seed(page: Page, step = 3, recoverOrder = false) {
  await page.addInitScript(
    ({ step, recoverOrder, localOrderId, idempotencyKey, address }) => {
      if (!sessionStorage.getItem("ovia-checkout-draft-v2"))
        sessionStorage.setItem(
          "ovia-checkout-draft-v2",
          JSON.stringify({
            draft: {
              civility: "Mr",
              firstName: "Test",
              lastName: "Customer",
              email: address.email,
              phone: address.phone,
              line1: address.line1,
              line2: address.line2,
              city: address.city,
              region: address.region,
              postalCode: address.postalCode,
            },
            step,
            shippingMethod: "standard",
            promoCode: "",
            key: idempotencyKey,
            savedAt: Date.now(),
          }),
        );
      if (recoverOrder)
        sessionStorage.setItem("ovia-checkout-payment-v2", localOrderId);
    },
    { step, recoverOrder, localOrderId, idempotencyKey, address },
  );
}

async function hostedOptions(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as FixtureWindow).__razorpayFixture?.opened || 0,
      ),
    )
    .toBeGreaterThan(0);
  return page.evaluate(() => {
    const value = (window as FixtureWindow).__razorpayFixture!.options;
    return {
      key: value.key,
      order_id: value.order_id,
      amount: value.amount,
      currency: value.currency,
    };
  });
}

async function signedCallback(page: Page) {
  await page.evaluate(
    async ({ providerOrderId, paymentId }) => {
      await (window as FixtureWindow).__razorpayFixture!.options.handler({
        razorpay_order_id: providerOrderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: "fixture-signed-proof",
      });
    },
    { providerOrderId, paymentId },
  );
}

test("hosted payment uses a server quote and only verified paid status confirms the order", async ({
  page,
}) => {
  const state = await fixtures(page);
  await seed(page);
  await page.goto("/checkout");
  await page.getByRole("button", { name: "Place Order", exact: true }).click();
  expect(await hostedOptions(page)).toEqual({
    key: publicKey,
    order_id: providerOrderId,
    amount: quote.total,
    currency: "INR",
  });
  await expect(page).toHaveURL(/\/checkout$/);
  const creation = state.requests.find(
    (value) =>
      value.path.endsWith("razorpay/sessions") && value.method === "POST",
  )!;
  expect(creation.body).toEqual({
    address,
    idempotencyKey,
    quoteId: quote.id,
    shippingMethod: "standard",
    market: "IN",
  });
  await signedCallback(page);
  await expect(page).toHaveURL(`/orders/${localOrderId}/confirmation`);
  await expect(
    page.getByRole("heading", { name: "Thank you for choosing OVIA." }),
  ).toBeVisible();
  await expect(
    page.getByText(/Your Razorpay payment is verified/),
  ).toBeVisible();
  await expect(page.getByText(/PayPal sandbox/)).toHaveCount(0);
  expect(
    state.requests.find((value) => value.path.endsWith("razorpay/verify"))!
      .body,
  ).toEqual({
    localOrderId,
    razorpay_order_id: providerOrderId,
    razorpay_payment_id: paymentId,
    razorpay_signature: "fixture-signed-proof",
  });
  expect(state.unexpected).toEqual([]);
});

test("pending capture is never presented as paid", async ({ page }) => {
  const state = await fixtures(page, { verificationStatus: "payment_pending" });
  await seed(page);
  await page.goto("/checkout");
  await page.getByRole("button", { name: "Place Order", exact: true }).click();
  await hostedOptions(page);
  await signedCallback(page);
  await expect(page.getByText(/Your payment is pending/)).toBeVisible();
  await expect(page).toHaveURL(/\/checkout$/);
  await expect(
    page.getByRole("heading", { name: "Thank you for choosing OVIA." }),
  ).toHaveCount(0);
  expect(state.active?.status).toBe("payment_pending");
  expect(state.unexpected).toEqual([]);
});

test("closing hosted checkout permits retry using the same provider order", async ({
  page,
}) => {
  const state = await fixtures(page);
  await seed(page);
  await page.goto("/checkout");
  const placeOrder = page.getByRole("button", {
    name: "Place Order",
    exact: true,
  });
  await placeOrder.click();
  const first = await hostedOptions(page);
  await page.evaluate(() =>
    (window as FixtureWindow).__razorpayFixture!.options.modal?.ondismiss?.(),
  );
  await expect(
    page.getByText(
      /Payment window closed\. You can retry securely with the same order/,
    ),
  ).toBeVisible();
  await expect(placeOrder).toBeEnabled();
  await placeOrder.click();
  const second = await hostedOptions(page);
  expect(second.order_id).toBe(first.order_id);
  const creations = state.requests.filter(
    (value) =>
      value.path.endsWith("razorpay/sessions") && value.method === "POST",
  );
  expect(
    creations.every(
      (value) =>
        (value.body as { idempotencyKey: string }).idempotencyKey ===
        idempotencyKey,
    ),
  ).toBe(true);
  expect(
    state.requests.filter((value) => value.path.endsWith("razorpay/verify")),
  ).toHaveLength(0);
  expect(state.unexpected).toEqual([]);
});

test("an interrupted gateway setup preserves the idempotency key on retry", async ({
  page,
}) => {
  const state = await fixtures(page, { creationFailures: 1 });
  await seed(page);
  await page.goto("/checkout");
  const placeOrder = page.getByRole("button", {
    name: "Place Order",
    exact: true,
  });
  await placeOrder.click();
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "Fixture gateway connection interrupted." }),
  ).toBeVisible();
  await placeOrder.click();
  await hostedOptions(page);
  const bodies = state.requests
    .filter(
      (value) =>
        value.path.endsWith("razorpay/sessions") && value.method === "POST",
    )
    .map((value) => value.body as { idempotencyKey: string });
  expect(bodies).toHaveLength(2);
  expect(bodies[0].idempotencyKey).toBe(bodies[1].idempotencyKey);
  expect(bodies[0].idempotencyKey).toBe(idempotencyKey);
  expect(state.unexpected).toEqual([]);
});

test("refresh recovers an unfinished order without opening a new payment automatically", async ({
  page,
}) => {
  const state = await fixtures(page, { active: session() });
  await seed(page, 3, true);
  await page.goto("/checkout");
  await expect(
    page.getByRole("heading", {
      name: "Review your order",
      exact: true,
      level: 2,
    }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Place Order", exact: true }),
  ).toBeEnabled();
  expect(
    await page.evaluate(
      () => (window as FixtureWindow).__razorpayFixture?.opened || 0,
    ),
  ).toBe(0);
  await page.getByRole("button", { name: "Place Order", exact: true }).click();
  expect((await hostedOptions(page)).order_id).toBe(providerOrderId);
  expect(
    state.requests.filter(
      (value) =>
        value.path.endsWith("razorpay/sessions") && value.method === "POST",
    ),
  ).toHaveLength(0);
  expect(state.unexpected).toEqual([]);
});

test("mobile payment choices never ask OVIA for card security details or a bank password", async ({
  page,
}) => {
  const state = await fixtures(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await seed(page, 2);
  await page.goto("/checkout");
  for (const label of [/UPI/, /Credit \/ Debit Card/, /Net Banking/]) {
    const radio = page.getByRole("radio", { name: label });
    await radio.check();
    await expect(radio).toBeChecked();
  }
  await expect(
    page.getByLabel(
      /Card Number|CVV|IPIN|NetBanking Password|Bank Password|OTP/i,
    ),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Continue to Review", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Place Order", exact: true }),
  ).toHaveCount(1);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(
    state.requests.filter(
      (value) => value.method === "POST" && value.path.includes("payments/"),
    ),
  ).toHaveLength(0);
  expect(state.unexpected).toEqual([]);
});

test("an unconfigured provider disables Place Order and makes no payment attempt", async ({
  page,
}) => {
  const state = await fixtures(page, { ready: false });
  await seed(page);
  await page.goto("/checkout");
  await expect(
    page.getByRole("button", { name: "Place Order", exact: true }),
  ).toBeDisabled();
  expect(
    state.requests.filter(
      (value) => value.method === "POST" && value.path.includes("payments/"),
    ),
  ).toHaveLength(0);
  expect(state.unexpected).toEqual([]);
});

test("a recovered paid order goes straight to verified confirmation", async ({
  page,
}) => {
  const state = await fixtures(page, { active: session("paid") });
  await seed(page, 3, true);
  await page.goto("/checkout");
  await expect(page).toHaveURL(`/orders/${localOrderId}/confirmation`);
  await expect(
    page.getByRole("heading", { name: "Thank you for choosing OVIA." }),
  ).toBeVisible();
  expect(
    state.requests.filter(
      (value) => value.method === "POST" && value.path.includes("payments/"),
    ),
  ).toHaveLength(0);
  expect(state.unexpected).toEqual([]);
});

test("an interrupted verification stays unconfirmed and can recover by checking server status", async ({
  page,
}) => {
  const state = await fixtures(page, { verificationFailures: 1 });
  await seed(page);
  await page.goto("/checkout");
  await page.getByRole("button", { name: "Place Order", exact: true }).click();
  await hostedOptions(page);
  await signedCallback(page);
  await expect(
    page
      .getByRole("alert")
      .filter({
        hasText: "Fixture payment verification is temporarily unavailable.",
      }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/checkout$/);
  await expect(
    page.getByRole("heading", { name: "Thank you for choosing OVIA." }),
  ).toHaveCount(0);
  state.active = session("paid");
  await page
    .getByRole("button", { name: "Check payment status", exact: true })
    .click();
  await expect(page).toHaveURL(`/orders/${localOrderId}/confirmation`);
  await expect(
    page.getByRole("heading", { name: "Thank you for choosing OVIA." }),
  ).toBeVisible();
  expect(
    state.requests.filter((value) => value.path.endsWith("razorpay/verify")),
  ).toHaveLength(1);
  expect(state.unexpected).toEqual([]);
});
