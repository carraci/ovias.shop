import { test, expect, type Page } from "./helpers/mocked-ui";
import type { Order } from "../../src/lib/types";
import type { CareTicket } from "../../src/lib/care";

// All customer, order, tracking and request responses are isolated fixtures.
// No test creates a real ticket, cancellation, refund, payment or shipment.
const customer = {
  id: "returns-customer-fixture",
  name: "Amelia Rowan",
  email: "amelia.rowan@example.test",
};
const timestamp = "2026-10-01T09:00:00.000Z";
const line = {
  sku: "RETURNS-BAG-FIXTURE",
  name: "OVIA Fixture Weekender",
  color: "Pebble Black",
  price: 100,
  quantity: 2,
  image: "/media/account/wishlist-city-crossbody.png",
  slug: "fixture-weekender",
};
function order(id: string, overrides: Partial<Order> = {}): Order {
  return {
    id,
    owner: `u:${customer.id}`,
    userId: customer.id,
    idempotencyKey: `fixture-${id}`,
    orderNumber: `OVIA-${id.toUpperCase()}`,
    provider: "razorpay",
    status: "paid",
    total: 200,
    lines: [line],
    address: {
      name: customer.name,
      email: customer.email,
      phone: "9999999999",
      line1: "123 Fictional Garden Avenue",
      city: "Mumbai",
      region: "Maharashtra",
      postalCode: "400001",
      country: "IN",
    },
    createdAt: timestamp,
    paidAt: timestamp,
    expiresAt: "2026-10-01T10:00:00.000Z",
    ...overrides,
  };
}
const ready = order("ready");
const shipped = order("shipped", {
  shipping: {
    provider: "delhivery",
    environment: "production",
    awb: "FIXTURE-AWB-102",
    courier: "Fixture courier",
    status: "IN_TRANSIT",
    estimatedDelivery: "2026-10-03T09:00:00.000Z",
    lastUpdatedAt: timestamp,
    events: [
      {
        status: "IN_TRANSIT",
        timestamp,
        location: "Fixture sorting facility",
        description: "Fixture package is moving through the courier network.",
      },
    ],
  },
});
const delivered = order("delivered", {
  shipping: {
    provider: "delhivery",
    environment: "production",
    awb: "FIXTURE-AWB-103",
    courier: "Fixture courier",
    status: "DELIVERED",
    deliveredAt: timestamp,
    events: [],
  },
});
const unpaid = [
  order("demo", { provider: "demo", status: "demo" }),
  order("expired", { status: "expired" }),
  order("failed", { status: "payment_failed" }),
  order("cancelled", { status: "cancelled" }),
  order("pending", { status: "pending" }),
];
type OrderAction = {
  type: "cancellation" | "return" | "refund";
  items?: { sku: string; quantity: number }[];
};
type FixtureTicket = CareTicket & { orderAction?: OrderAction };
type FixtureState = {
  user: typeof customer | null;
  orders: Order[];
  tickets: FixtureTicket[];
  ordersFailures: number;
  ticketsFailures: number;
  postFailures: number;
  pendingPosts: boolean;
  releasePost?: () => void;
  requests: { path: string; method: string; body: unknown }[];
  unexpected: string[];
};
function ticket(
  id: string,
  target: Order,
  type: OrderAction["type"],
  status: CareTicket["status"] = "Open",
): FixtureTicket {
  return {
    id,
    userId: customer.id,
    name: customer.name,
    email: customer.email,
    orderId: target.id,
    category:
      type === "cancellation"
        ? "Order issue"
        : type === "return"
          ? "Return"
          : "Refund",
    subject: `${type} request for ${target.orderNumber}`,
    status,
    orderAction: { type },
    messages: [
      {
        id: `${id}-message`,
        author: "customer",
        text: "A fixture request for client services to review.",
        createdAt: timestamp,
      },
    ],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}
async function fixtures(page: Page, overrides: Partial<FixtureState> = {}) {
  const state: FixtureState = {
    user: customer,
    orders: [ready, shipped, delivered, ...unpaid],
    tickets: [],
    ordersFailures: 0,
    ticketsFailures: 0,
    postFailures: 0,
    pendingPosts: false,
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
    const fail = (message: string, status = 503) =>
      route.fulfill({ status, json: { error: { message } } });
    if (path === "/api/v1/account" && method === "GET")
      return respond({ user: state.user });
    if (path === "/api/v1/cart" && method === "GET")
      return respond({ lines: [], total: 0, version: 1 });
    if (path === "/api/v1/account/orders" && method === "GET") {
      if (state.ordersFailures-- > 0)
        return fail("Fixture order service is temporarily unavailable.");
      return respond(state.orders);
    }
    if (path === "/api/v1/care/tickets" && method === "GET") {
      if (state.ticketsFailures-- > 0)
        return fail("Fixture requests service is temporarily unavailable.");
      return respond(state.tickets);
    }
    if (path === "/api/v1/care/tickets" && method === "POST") {
      if (state.pendingPosts)
        await new Promise<void>((resolve) => {
          state.releasePost = resolve;
        });
      if (state.postFailures-- > 0)
        return fail("Fixture request connection interrupted.");
      const payload = body as {
        orderId: string;
        category: string;
        subject: string;
        message: string;
        orderAction: OrderAction;
      };
      const target = state.orders.find((item) => item.id === payload.orderId);
      if (!target) return fail("Fixture order not found.", 404);
      const result = ticket(
        `fixture-request-${state.tickets.length + 1}`,
        target,
        payload.orderAction.type,
      );
      result.subject = payload.subject;
      result.category = payload.category;
      result.orderAction = payload.orderAction;
      result.messages[0].text = payload.message;
      state.tickets.push(result);
      return respond(result);
    }
    const tracking = path.match(/^\/api\/v1\/orders\/([^/]+)\/tracking$/);
    if (tracking && method === "GET") {
      const target = state.orders.find((item) => item.id === tracking[1]);
      return target
        ? respond({ ...target, shipping: target.shipping || null })
        : fail("Fixture order not found.", 404);
    }
    const detail = path.match(/^\/api\/v1\/care\/tickets\/([^/]+)$/);
    if (detail && method === "GET") {
      const result = state.tickets.find((item) => item.id === detail[1]);
      return result ? respond(result) : fail("Fixture request not found.", 404);
    }
    if (path === "/api/auth/social" && method === "GET")
      return respond({ google: false, apple: false });
    state.unexpected.push(`${method} ${path}`);
    return fail("Unexpected fixture API request.", 501);
  });
  return state;
}
function card(page: Page, target: Order) {
  return page.getByRole("article", {
    name: `Order ${target.orderNumber}`,
    exact: true,
  });
}
const actions = /Request cancellation|Request return|Request refund/;
const posts = (state: FixtureState) =>
  state.requests.filter(
    (item) => item.path === "/api/v1/care/tickets" && item.method === "POST",
  );
async function noPageOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}

test("certificates URL now opens Orders & Returns with the new account navigation", async ({
  page,
}) => {
  const state = await fixtures(page);
  await page.goto("/account/registration");
  const nav = page.getByRole("navigation", {
    name: "Account navigation",
    exact: true,
  });
  const link = nav.getByRole("link", { name: "Orders & Returns", exact: true });
  await expect(link).toHaveAttribute("href", "/account/returns");
  await expect(link).toHaveAttribute("aria-current", "page");
  await expect(
    page.getByRole("heading", { name: "Orders & Returns", exact: true }),
  ).toBeVisible();
  await expect(page.locator("#main")).not.toContainText("My Certificates");
  await expect(card(page, ready)).toBeVisible();
  expect(state.unexpected).toEqual([]);
});

test("tracking is available before AWB assignment and after courier dispatch", async ({
  page,
}) => {
  const state = await fixtures(page);
  await page.goto("/account/returns");
  for (const target of [ready, shipped]) {
    await expect(
      card(page, target).getByRole("link", {
        name: "Track order",
        exact: true,
      }),
    ).toHaveAttribute("href", `/account/orders/${target.id}/tracking`);
  }
  await card(page, ready)
    .getByRole("link", { name: "Track order", exact: true })
    .click();
  await expect(page).toHaveURL(/\/account\/orders\/ready\/tracking$/);
  await expect(
    page.getByRole("heading", {
      name: /Fulfillment in Progress|Preparing your order/i,
    }),
  ).toBeVisible();
  await expect(page.locator("#main")).not.toContainText("FIXTURE-AWB");
  await page.goto("/account/orders/shipped/tracking");
  await expect(
    page.getByRole("region", { name: "Shipment details" }),
  ).toContainText("FIXTURE-AWB-102");
  await expect(
    page.getByRole("region", { name: "Tracking history" }),
  ).toContainText("Fixture sorting facility");
  expect(state.unexpected).toEqual([]);
});

test("payment and dispatch states determine which request actions are offered", async ({
  page,
}) => {
  const state = await fixtures(page);
  await page.goto("/account/returns");
  await expect(
    card(page, ready).getByRole("button", {
      name: "Request cancellation",
      exact: true,
    }),
  ).toBeEnabled();
  await expect(
    card(page, shipped).getByRole("button", {
      name: "Request cancellation",
      exact: true,
    }),
  ).toHaveCount(0);
  await expect(
    card(page, delivered).getByRole("button", {
      name: "Request return",
      exact: true,
    }),
  ).toBeEnabled();
  await expect(
    card(page, delivered).getByRole("button", {
      name: "Request refund",
      exact: true,
    }),
  ).toBeEnabled();
  for (const target of unpaid)
    await expect(
      card(page, target).getByRole("button", { name: actions }),
    ).toHaveCount(0);
  expect(posts(state)).toEqual([]);
  expect(state.unexpected).toEqual([]);
});

test("a cancellation request submits a reason and remains under review rather than cancelling payment", async ({
  page,
}) => {
  const state = await fixtures(page, { orders: [ready] });
  await page.goto("/account/returns");
  await card(page, ready)
    .getByRole("button", { name: "Request cancellation", exact: true })
    .click();
  const form = page.getByRole("form", { name: /cancellation request/i });
  await expect(form).toBeVisible();
  await form
    .getByLabel("Reason", { exact: true })
    .fill("Changed travel plans; please review cancellation.");
  await form
    .getByRole("button", { name: "Submit request", exact: true })
    .click();
  await expect(card(page, ready)).toContainText("Open");
  expect(posts(state)).toHaveLength(1);
  expect(posts(state)[0].body).toMatchObject({
    category: "Order issue",
    orderId: ready.id,
    message: "Changed travel plans; please review cancellation.",
    orderAction: { type: "cancellation" },
    idempotencyKey: expect.stringMatching(/^[0-9a-f-]{36}$/i),
  });
  await expect(card(page, ready)).not.toContainText(
    /refund processed|refund successful|order cancelled|payment refunded/i,
  );
  await expect(
    card(page, ready).getByRole("link", { name: /View request/i }),
  ).toHaveAttribute("href", "/contact?ticket=fixture-request-1");
  await page.reload();
  await expect(card(page, ready)).toContainText("Open");
  const repeated = card(page, ready).getByRole("button", {
    name: "Request cancellation",
    exact: true,
  });
  if (await repeated.count()) await expect(repeated).toBeDisabled();
  expect(state.orders[0].status).toBe("paid");
  expect(state.unexpected).toEqual([]);
});

for (const type of ["return", "refund"] as const) {
  test(`${type} requests carry the selected purchased product and quantity`, async ({
    page,
  }) => {
    const state = await fixtures(page, { orders: [delivered] });
    await page.goto("/account/returns");
    await card(page, delivered)
      .getByRole("button", { name: `Request ${type}`, exact: true })
      .click();
    const form = page.getByRole("form", {
      name: new RegExp(`${type} request`, "i"),
    });
    await form.getByLabel("Product", { exact: true }).selectOption(line.sku);
    await form.getByLabel("Quantity", { exact: true }).fill("1");
    await form
      .getByLabel("Reason", { exact: true })
      .fill("The fixture item does not suit my travel needs.");
    await form
      .getByRole("button", { name: "Submit request", exact: true })
      .click();
    await expect(card(page, delivered)).toContainText("Open");
    expect(posts(state)).toHaveLength(1);
    expect(posts(state)[0].body).toMatchObject({
      category: type === "return" ? "Return" : "Refund",
      orderId: delivered.id,
      orderAction: { type, items: [{ sku: line.sku, quantity: 1 }] },
    });
    expect(state.orders[0].status).toBe("paid");
    expect(state.unexpected).toEqual([]);
  });
}

test("short reasons are rejected and rapid submission cannot create two requests", async ({
  page,
}) => {
  const state = await fixtures(page, { orders: [ready], pendingPosts: true });
  await page.goto("/account/returns");
  await card(page, ready)
    .getByRole("button", { name: "Request cancellation", exact: true })
    .click();
  const form = page.getByRole("form", { name: /cancellation request/i });
  const reason = form.getByLabel("Reason", { exact: true });
  await expect(reason).toHaveAttribute("minlength", "10");
  await reason.fill("short");
  await form
    .getByRole("button", { name: "Submit request", exact: true })
    .click();
  expect(posts(state)).toHaveLength(0);
  await reason.fill("Changed travel plans; please review cancellation.");
  await form.evaluate((element) => {
    element.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    );
    element.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    );
  });
  await expect.poll(() => posts(state).length).toBe(1);
  await expect(
    form.getByRole("button", { name: /Submitting|Saving/i }),
  ).toBeDisabled();
  state.releasePost?.();
  await expect(card(page, ready)).toContainText("Open");
  expect(posts(state)).toHaveLength(1);
  expect(state.unexpected).toEqual([]);
});

test("request failure preserves the reason and idempotency key for a safe retry", async ({
  page,
}) => {
  const state = await fixtures(page, { orders: [ready], postFailures: 1 });
  await page.goto("/account/returns");
  await card(page, ready)
    .getByRole("button", { name: "Request cancellation", exact: true })
    .click();
  const form = page.getByRole("form", { name: /cancellation request/i });
  const reason = "Changed travel plans; please review cancellation.";
  await form.getByLabel("Reason", { exact: true }).fill(reason);
  await form
    .getByRole("button", { name: "Submit request", exact: true })
    .click();
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "Fixture request connection interrupted." }),
  ).toBeVisible();
  await expect(form.getByLabel("Reason", { exact: true })).toHaveValue(reason);
  await form
    .getByRole("button", { name: "Submit request", exact: true })
    .click();
  await expect(card(page, ready)).toContainText("Open");
  expect(posts(state)).toHaveLength(2);
  const [first, second] = posts(state).map(
    (item) => item.body as { idempotencyKey: string },
  );
  expect(second.idempotencyKey).toBe(first.idempotencyKey);
  expect(state.tickets).toHaveLength(1);
  expect(state.unexpected).toEqual([]);
});

test("shipping, cancellation and refund filters use stored order and request records", async ({
  page,
}) => {
  const state = await fixtures(page, {
    tickets: [
      ticket("fixture-cancel", ready, "cancellation"),
      ticket("fixture-refund", delivered, "refund", "In Review"),
    ],
  });
  await page.goto("/account/returns");
  await expect(card(page, ready)).toBeVisible();
  await page.getByRole("button", { name: "Shipping", exact: true }).click();
  await expect(card(page, shipped)).toBeVisible();
  await expect(card(page, ready)).toHaveCount(0);
  await page
    .getByRole("button", { name: "Cancellations", exact: true })
    .click();
  await expect(card(page, ready)).toBeVisible();
  await expect(
    card(
      page,
      unpaid.find((item) => item.status === "cancelled")!,
    ),
  ).toBeVisible();
  await expect(card(page, shipped)).toHaveCount(0);
  await page
    .getByRole("button", { name: "Returns & refunds", exact: true })
    .click();
  await expect(card(page, delivered)).toBeVisible();
  await expect(card(page, delivered)).toContainText("In Review");
  await expect(card(page, ready)).toHaveCount(0);
  await page.getByRole("button", { name: "All orders", exact: true }).click();
  await expect(card(page, ready)).toBeVisible();
  await expect(card(page, shipped)).toBeVisible();
  expect(state.unexpected).toEqual([]);
});

test("request-load errors keep orders available and retry returns stored requests", async ({
  page,
}) => {
  const state = await fixtures(page, {
    orders: [ready],
    tickets: [ticket("fixture-cancel", ready, "cancellation")],
    ticketsFailures: 1,
  });
  await page.goto("/account/returns");
  await expect(card(page, ready)).toBeVisible();
  await expect(
    page.getByRole("alert").filter({
      hasText: "Fixture requests service is temporarily unavailable.",
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Try again|Retry requests/i }).click();
  await expect(card(page, ready)).toContainText("Open");
  await expect(
    page.getByRole("alert").filter({ hasText: "Fixture requests service" }),
  ).toHaveCount(0);
  expect(state.unexpected).toEqual([]);
});

test("order-load failure offers a retry without inventing an empty order history", async ({
  page,
}) => {
  const state = await fixtures(page, { orders: [ready], ordersFailures: 1 });
  await page.goto("/account/returns");
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "Fixture order service is temporarily unavailable." }),
  ).toBeVisible();
  await expect(card(page, ready)).toHaveCount(0);
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(card(page, ready)).toBeVisible();
  await expect(
    page.getByRole("alert").filter({ hasText: "Fixture order service" }),
  ).toHaveCount(0);
  expect(state.unexpected).toEqual([]);
});

for (const width of [390, 320]) {
  test(`order requests remain usable by keyboard without page overflow at ${width}px`, async ({
    page,
  }, testInfo) => {
    const state = await fixtures(page, { orders: [delivered] });
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/account/returns");
    const requestButton = card(page, delivered).getByRole("button", {
      name: "Request return",
      exact: true,
    });
    await requestButton.focus();
    await page.keyboard.press("Enter");
    const form = page.getByRole("form", { name: /return request/i });
    await expect(form).toBeVisible();
    await form.getByLabel("Reason", { exact: true }).focus();
    await page.keyboard.type("This fixture item needs client service review.");
    await form
      .getByRole("button", { name: "Submit request", exact: true })
      .focus();
    await page.keyboard.press("Enter");
    await expect(card(page, delivered)).toContainText("Open");
    await noPageOverflow(page);
    await page.screenshot({
      path: testInfo.outputPath(`orders-returns-${width}.png`),
      fullPage: true,
    });
    expect(posts(state)).toHaveLength(1);
    expect(state.unexpected).toEqual([]);
  });
}

test("signed-out customers see sign-in rather than order or request data", async ({
  page,
}) => {
  const state = await fixtures(page, { user: null });
  await page.goto("/account/returns");
  await expect(
    page.locator("#main").getByRole("link", { name: "Sign In", exact: true }),
  ).toBeVisible();
  await expect(page.locator("#main")).not.toContainText(ready.orderNumber!);
  expect(
    state.requests.filter(
      (item) =>
        item.path === "/api/v1/account/orders" ||
        item.path === "/api/v1/care/tickets",
    ),
  ).toHaveLength(0);
  expect(state.unexpected).toEqual([]);
});
