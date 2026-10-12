import { test, expect, type Page } from "@playwright/test";
import type { Address, Order } from "../../src/lib/types";

// Every account API response is a fixture. These tests never create customers,
// orders, emails, appointments, or address records in the application database.
const customer = {
  id: "account-ui-fixture",
  name: "Amelia Rowan",
  email: "amelia.rowan@example.test",
};
const address: Address = {
  name: customer.name,
  email: customer.email,
  line1: "123 Fictional Garden Avenue",
  city: "Mumbai",
  region: "Maharashtra",
  postalCode: "400001",
  country: "IN",
};
const order: Omit<Order, "owner" | "idempotencyKey"> = {
  id: "account-order-fixture",
  userId: customer.id,
  orderNumber: "OVIA-UI-1042",
  provider: "demo",
  status: "paid",
  total: 6050000,
  address,
  createdAt: "2026-09-22T12:00:00.000Z",
  expiresAt: "2026-09-22T13:00:00.000Z",
  lines: [
    {
      sku: "ACCOUNT-BACKPACK-FIXTURE",
      name: "OVIA Signature Travel Backpack with Extended Weekender Compartments",
      color: "Pebble Black",
      price: 2450000,
      quantity: 1,
      image: "/media/cat-crossbody.jpg",
      slug: "signature-backpack",
    },
    {
      sku: "ACCOUNT-CROSSBODY-FIXTURE",
      name: "OVIA City Crossbody with Adjustable Leather Shoulder Strap",
      color: "Warm Sand",
      price: 1800000,
      quantity: 2,
      image: "/media/account/wishlist-city-crossbody.png",
      slug: "signature-crossbody",
    },
  ],
};
type SavedAddress = Address & { id: string; userId: string };
type FixtureState = {
  user: typeof customer | null;
  orders: (typeof order)[];
  addresses: SavedAddress[];
  ordersFailures: number;
  logoutFails: boolean;
  requests: { path: string; method: string; body: unknown }[];
  unexpected: string[];
};

async function fixtures(page: Page, overrides: Partial<FixtureState> = {}) {
  const state: FixtureState = {
    user: customer,
    orders: [order],
    addresses: [],
    ordersFailures: 0,
    logoutFails: false,
    requests: [],
    unexpected: [],
    ...overrides,
  };
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;
    const method = request.method();
    const body = request.postData() ? request.postDataJSON() : undefined;
    state.requests.push({ path: pathname, method, body });
    const respond = (data: unknown) => route.fulfill({ json: { data } });
    const error = (message: string, status = 503) =>
      route.fulfill({ status, json: { error: { message } } });

    if (pathname === "/api/v1/account" && method === "GET")
      return respond({ user: state.user });
    if (pathname === "/api/v1/cart" && method === "GET")
      return respond({ lines: [], total: 0, version: 1 });
    if (pathname === "/api/v1/account/orders" && method === "GET") {
      if (state.ordersFailures > 0) {
        state.ordersFailures--;
        return error("Fixture order service is temporarily unavailable.");
      }
      return respond(state.orders);
    }
    if (pathname === "/api/v1/auth/logout" && method === "POST") {
      if (state.logoutFails)
        return error("Fixture sign-out connection interrupted.");
      state.user = null;
      return respond({ ok: true });
    }
    if (pathname === "/api/auth/social" && method === "GET")
      return respond({ google: false, apple: false });
    if (pathname === "/api/v1/care/security" && method === "GET")
      return respond({
        verified: true,
        activeSessions: 1,
        termsVersion: "fixture",
      });
    if (pathname === "/api/v1/account/addresses") {
      if (method === "GET") return respond(state.addresses);
      if (method === "POST") {
        const saved = {
          ...(body as Address),
          id: `fixture-address-${state.addresses.length + 1}`,
          userId: customer.id,
        };
        state.addresses.push(saved);
        return respond(saved);
      }
    }
    if (pathname.startsWith("/api/v1/account/addresses/")) {
      const id = pathname.split("/").at(-1);
      const index = state.addresses.findIndex((saved) => saved.id === id);
      if (index < 0) return error("Fixture address not found.", 404);
      if (method === "PATCH") {
        state.addresses[index] = {
          ...state.addresses[index],
          ...(body as Address),
        };
        return respond(state.addresses[index]);
      }
      if (method === "DELETE") {
        state.addresses.splice(index, 1);
        return respond({ deleted: true });
      }
    }
    state.unexpected.push(`${method} ${pathname}`);
    return error("Unexpected fixture API request.", 501);
  });
  // Prevent Link prefetch from reaching data-backed destinations; the tests
  // verify these destination URLs without opening a live product/order route.
  await page.route(/\/bags(?:\?.*)?$/, (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "Fixture collection destination",
    }),
  );
  await page.route(
    /\/orders\/account-order-fixture\/confirmation(?:\?.*)?$/,
    (route) =>
      route.fulfill({
        contentType: "text/html",
        body: "Fixture order destination",
      }),
  );
  return state;
}

const sections = [
  ["Overview", "/account"],
  ["My Profile", "/account/details"],
  ["My Orders", "/account/orders"],
  ["My Wishlist", "/account/wishlist"],
  ["My Appointments", "/account/appointments"],
  ["Orders & Returns", "/account/returns"],
] as const;

async function accountNavigation(page: Page) {
  const navigation = page.getByRole("navigation", {
    name: "Account navigation",
    exact: true,
  });
  await expect(navigation).toBeVisible();
  for (const [name, href] of sections)
    await expect(
      navigation.getByRole("link", { name, exact: true }),
    ).toHaveAttribute("href", href);
  return navigation;
}

async function noPageOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}

for (const width of [1440, 390, 320]) {
  test(`account overview uses the real customer and readable orders at ${width}px`, async ({
    page,
  }, testInfo) => {
    const state = await fixtures(page);
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/account");
    const main = page.locator("#main");
    await expect(
      main.getByText(customer.name, { exact: true }).first(),
    ).toBeVisible();
    await expect(main.getByText(customer.email, { exact: true })).toBeVisible();
    await expect(main.getByText("A.R", { exact: true })).toBeVisible();
    await expect(main).not.toContainText(
      /Louis Vuitton|Adarsh Shukla|adarsh@gmail\.com/,
    );
    const hero = main.locator('img[src*="ovia-leather-hero.png"]');
    await expect(hero).toBeVisible();
    await expect
      .poll(() =>
        hero.evaluate((image) => (image as HTMLImageElement).naturalWidth),
      )
      .toBeGreaterThan(0);
    const navigation = await accountNavigation(page);
    await expect(
      navigation.getByRole("link", { name: "Overview", exact: true }),
    ).toHaveAttribute("aria-current", "page");
    await expect(
      main.getByRole("link", { name: "Manage My Profile", exact: true }),
    ).toHaveAttribute("href", "/account/details");
    for (const line of order.lines) {
      const name = main.getByText(line.name, { exact: true });
      await expect(name).toBeVisible();
      await expect(main.getByText(line.color, { exact: false })).toBeVisible();
      const thumbnail = main
        .getByRole("link", { name: `View ${line.name}`, exact: true })
        .locator("img");
      await expect(thumbnail).toBeVisible();
      await expect(thumbnail).toHaveAttribute(
        "src",
        new RegExp(
          line.image.replaceAll("/", "(?:/|%2F)").replaceAll(".", "\\."),
        ),
      );
      expect((await name.boundingBox())!.width).toBeGreaterThan(100);
    }
    await expect(main).toContainText("₹60,500");
    await expect(main).toContainText(order.orderNumber!);
    await expect(
      main.getByRole("link", { name: "View order", exact: true }),
    ).toHaveAttribute("href", `/orders/${order.id}/confirmation`);
    await expect(
      main.getByRole("link", { name: "Explore the Collection", exact: true }),
    ).toHaveAttribute("href", "/bags");
    await expect(
      main.getByRole("link", { name: "Contact Us", exact: true }),
    ).toHaveAttribute("href", "/contact-us");
    await noPageOverflow(page);
    await page.screenshot({
      path: testInfo.outputPath(`account-${width}.png`),
      fullPage: true,
    });
    expect(state.unexpected).toEqual([]);
  });
}

test("account navigation opens each panel and direct URLs restore the active section", async ({
  page,
}) => {
  const state = await fixtures(page);
  await page.goto("/account");
  for (const [name, href] of sections.slice(1)) {
    const navigation = await accountNavigation(page);
    await navigation.getByRole("link", { name, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${href}$`));
    await expect(
      (await accountNavigation(page)).getByRole("link", { name, exact: true }),
    ).toHaveAttribute("aria-current", "page");
    await page.reload();
    await expect(
      (await accountNavigation(page)).getByRole("link", { name, exact: true }),
    ).toHaveAttribute("aria-current", "page");
  }
  await page.goto("/account/details");
  const main = page.locator("#main");
  await expect(main).toContainText(customer.name);
  await expect(main).toContainText(customer.email);
  await expect(
    main.locator('a[href="/account/security"]').first(),
  ).toBeVisible();
  await expect(
    main.locator('a[href="/account/addresses"]').first(),
  ).toBeVisible();
  await expect(
    main.getByRole("button", { name: /Save Changes|Save Profile/i }),
  ).toHaveCount(0);
  expect(state.unexpected).toEqual([]);
});

test("empty wishlist and appointments expose useful destinations without invented records", async ({
  page,
}) => {
  const state = await fixtures(page, { orders: [] });
  await page.goto("/account/wishlist");
  const main = page.locator("#main");
  const collection = main.getByRole("link", {
    name: "Explore the Collection",
    exact: true,
  });
  await expect(collection).toHaveAttribute("href", "/bags");
  await expect(
    main.getByRole("button", { name: /Remove .* from wishlist/ }),
  ).toHaveCount(0);
  await expect(main).not.toContainText(/Voyage Duffel|Signature Tote|wish-1/);
  await expect(main.locator("img").last()).toBeVisible();
  await page.goto("/account/appointments");
  await expect(
    main.getByRole("link", { name: "Contact Us", exact: true }),
  ).toHaveAttribute("href", "/contact-us");
  await expect(main).not.toContainText(
    /Confirmed appointment|Upcoming appointment|Appointment booked/i,
  );
  await page.goto("/account/payments");
  await expect(main.locator('a[href="/cart"]')).toBeVisible();
  await expect(
    main.getByRole("button", { name: /Save Method|Add a payment method/i }),
  ).toHaveCount(0);
  await expect(main).not.toContainText("adarsh@upi");
  expect(state.unexpected).toEqual([]);
});

test("signed-out overview provides authentication links and omits personal mock data", async ({
  page,
}) => {
  const state = await fixtures(page, { user: null, orders: [] });
  await page.goto("/account");
  const main = page.locator("#main");
  await expect(
    main.locator('a[href="/account/sign-in"]').first(),
  ).toBeVisible();
  await expect(
    main.locator('a[href="/account/register"]').first(),
  ).toBeVisible();
  await expect(main).not.toContainText(
    /Adarsh|adarsh@gmail\.com|98765 43210|14 May 2003|Amelia Rowan/,
  );
  expect(
    state.requests.filter(
      (request) => request.path === "/api/v1/account/orders",
    ),
  ).toHaveLength(0);
  expect(state.unexpected).toEqual([]);
});

test("orders failure stays actionable and retry renders the returned order", async ({
  page,
}) => {
  const state = await fixtures(page, { ordersFailures: 1 });
  await page.goto("/account/orders");
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "Fixture order service is temporarily unavailable." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(page.locator("#main")).toContainText(order.orderNumber!);
  await expect(
    page.getByRole("alert").filter({ hasText: "Fixture order service" }),
  ).toHaveCount(0);
  expect(
    state.requests.filter(
      (request) => request.path === "/api/v1/account/orders",
    ),
  ).toHaveLength(2);
  expect(state.unexpected).toEqual([]);
});

test("sign out clears the account through the API and refreshes before showing sign-in", async ({
  page,
}) => {
  const state = await fixtures(page);
  await page.goto("/account");
  await expect(
    page.locator("#main").getByText(customer.email, { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Sign Out", exact: true }).click();
  await expect(page).toHaveURL(/\/account\/sign-in$/);
  await expect(
    page.getByRole("heading", { name: "Sign in to your account", exact: true }),
  ).toBeVisible();
  const logoutIndex = state.requests.findIndex(
    (request) => request.path === "/api/v1/auth/logout",
  );
  expect(logoutIndex).toBeGreaterThan(-1);
  expect(state.requests[logoutIndex].method).toBe("POST");
  expect(
    state.requests
      .slice(logoutIndex + 1)
      .some(
        (request) =>
          request.path === "/api/v1/account" && request.method === "GET",
      ),
  ).toBe(true);
  expect(state.user).toBeNull();
  expect(state.unexpected).toEqual([]);
});

test("sign out failure remains on the account and reports the actual error", async ({
  page,
}) => {
  const state = await fixtures(page, { logoutFails: true });
  await page.goto("/account");
  await expect(
    page.locator("#main").getByText(customer.email, { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Sign Out", exact: true }).click();
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "Fixture sign-out connection interrupted." }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/account$/);
  await expect(
    page.locator("#main").getByText(customer.email, { exact: true }),
  ).toBeVisible();
  expect(state.user).toEqual(customer);
  expect(state.unexpected).toEqual([]);
});

test("address panel preserves saved-address creation, editing and removal", async ({
  page,
}) => {
  const state = await fixtures(page);
  await page.goto("/account/addresses");
  await expect(
    page.getByRole("heading", { name: "Save an address", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Full name", { exact: true }).fill(address.name);
  await page.getByLabel("Email", { exact: true }).fill(address.email);
  await page.getByLabel("Street address", { exact: true }).fill(address.line1);
  await page.getByLabel("City", { exact: true }).fill(address.city);
  await page.getByLabel("State", { exact: true }).fill(address.region);
  await page
    .getByLabel("Postal code", { exact: true })
    .fill(address.postalCode);
  await page.getByRole("button", { name: "Save address", exact: true }).click();
  const saved = page.locator(".address-list article");
  await expect(saved).toHaveCount(1);
  await expect(saved).toContainText(address.line1);
  expect(state.addresses[0]).toMatchObject(address);
  await saved.getByRole("button", { name: "Edit", exact: true }).click();
  await expect(page.getByLabel("Street address", { exact: true })).toHaveValue(
    address.line1,
  );
  await page
    .getByLabel("Street address", { exact: true })
    .fill("456 Fictional Garden Avenue");
  await page.getByRole("button", { name: "Save address", exact: true }).click();
  await expect(saved).toContainText("456 Fictional Garden Avenue");
  await saved.getByRole("button", { name: "Remove", exact: true }).click();
  await expect(saved).toHaveCount(0);
  expect(state.addresses).toEqual([]);
  expect(
    state.requests
      .filter(
        (request) =>
          request.path.startsWith("/api/v1/account/addresses") &&
          request.method !== "GET",
      )
      .map((request) => request.method),
  ).toEqual(["POST", "PATCH", "DELETE"]);
  expect(state.unexpected).toEqual([]);
});
