import { test, expect, type Page } from "./helpers/mocked-ui";
const customer = { id: "account-ui-fixture", name: "Amelia Rowan", email: "amelia.rowan@example.test" };
const address = { name: customer.name, email: customer.email, line1: "123 Fictional Garden Avenue", city: "Mumbai", region: "Maharashtra", postalCode: "400001", country: "IN" };
const sections = [["Payment methods", "/account/payments"], ["Returns & exchanges", "/account/returns"], ["Refunds", "/account/refunds"], ["Account activity", "/account/notifications"], ["Wishlist", "/account/wishlist"], ["Saved addresses", "/account/addresses"], ["Help & support", "/account/support"], ["Reviews", "/account/reviews"], ["Profile", "/account/details"], ["Account security", "/account/security"]] as const;
async function fixtures(page: Page, options: { signedOut?: boolean; profileFailures?: number; logoutFails?: boolean } = {}) {
  const state = { user: options.signedOut ? null : { ...customer }, addresses: [] as (typeof address & { id: string })[], failures: options.profileFailures || 0, requests: [] as { path: string; method: string; body: any }[], unexpected: [] as string[] };
  let profile = { title: "", firstName: "Amelia", lastName: "Rowan", displayName: customer.name, contactEmail: customer.email, email: customer.email, phoneType: "mobile", phoneCountryCode: "+91", phone: "", country: "IN", dateOfBirth: "", preferences: { email: false, phone: false, textMessage: false, postal: false } };
  await page.route("**/api/**", async route => {
    const req = route.request(), path = new URL(req.url()).pathname, method = req.method(), body = req.postData() ? req.postDataJSON() : undefined;
    state.requests.push({ path, method, body });
    const data = (value: unknown) => route.fulfill({ json: { data: value } });
    const fail = (message: string) => route.fulfill({ status: 503, json: { error: { message } } });
    if (path.startsWith("/api/analytics/")) return route.fulfill({ json: { ok: true } });
    if (path === "/api/v1/account") return data({ user: state.user });
    if (path === "/api/v1/cart") return data({ lines: [], total: 0, version: 1 });
    if (path === "/api/v1/account/wishlist") return data([]);
    if (path === "/api/auth/social") return data({ google: false, apple: false });
    if (path === "/api/v1/account/profile") {
      if (method === "GET" && state.failures-- > 0) return fail("Fixture profile service is temporarily unavailable.");
      if (method === "PATCH") { profile = { ...profile, ...body }; if (state.user) state.user.name = profile.displayName; }
      return data(profile);
    }
    if (path === "/api/v1/auth/logout") { if (options.logoutFails) return fail("Fixture sign-out connection interrupted."); state.user = null; return data({ ok: true }); }
    if (path === "/api/v1/account/addresses") { if (method === "POST") state.addresses.push({ ...body, id: "fixture-address" }); return data(method === "GET" ? state.addresses : state.addresses.at(-1)); }
    if (path.startsWith("/api/v1/account/addresses/")) { if (method === "PATCH") state.addresses[0] = { ...state.addresses[0], ...body }; if (method === "DELETE") state.addresses = []; return data(method === "DELETE" ? { deleted: true } : state.addresses[0]); }
    if (["/api/v1/account/orders", "/api/v1/care/tickets", "/api/v1/account/activity"].includes(path)) return data([]);
    if (path === "/api/v1/account/payment-preference") return data({ method: "" });
    if (path === "/api/support/realtime") return route.fulfill({ status: 503, json: { error: "Realtime fixture disabled" } });
    state.unexpected.push(`${method} ${path}`); return fail("Unexpected fixture request.");
  });
  return state;
}
async function navigation(page: Page) {
  const nav = page.getByRole("navigation", { name: "Customer dashboard" });
  if (!(await nav.isVisible())) await page.getByRole("button", { name: "Account menu", exact: true }).click();
  await expect(nav).toBeVisible(); for (const [name, href] of sections) await expect(nav.getByRole("link", { name, exact: true })).toHaveAttribute("href", href); return nav;
}
for (const width of [1440, 390, 320]) test(`account opens the customer's profile and accessible menu at ${width}px`, async ({ page }) => {
  const state = await fixtures(page); await page.setViewportSize({ width, height: 1000 }); await page.goto("/account"); await expect(page).toHaveURL(/\/account\/details$/);
  await expect(page.getByLabel("First name *", { exact: true })).toHaveValue("Amelia"); await expect(page.getByLabel("Display name *", { exact: true })).toHaveValue(customer.name);
  await expect((await navigation(page)).getByRole("link", { name: "Profile", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(page.locator("#main")).not.toContainText(/Adarsh Shukla|adarsh@gmail\.com/); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); expect(state.unexpected).toEqual([]);
});
test("navigation and direct URLs restore the selected current account section", async ({ page }) => {
  const state = await fixtures(page); await page.goto("/account/details");
  for (const [name, href] of sections.filter(([name]) => ["Payment methods", "Returns & exchanges", "Refunds", "Account activity", "Saved addresses", "Profile"].includes(name))) {
    await (await navigation(page)).getByRole("link", { name, exact: true }).click(); await expect(page).toHaveURL(new RegExp(`${href}$`));
    await expect((await navigation(page)).getByRole("link", { name, exact: true })).toHaveAttribute("aria-current", "page"); await page.reload(); await expect((await navigation(page)).getByRole("link", { name, exact: true })).toHaveAttribute("aria-current", "page");
  } expect(state.unexpected).toEqual([]);
});
test("empty wishlist and appointments show destinations without invented records", async ({ page }) => {
  const state = await fixtures(page); await page.goto("/account/wishlist"); await expect(page.locator("#main").getByRole("link", { name: "Explore the Collection", exact: true })).toHaveAttribute("href", "/new"); await expect(page.getByRole("button", { name: /Remove .* from wishlist/ })).toHaveCount(0);
  await page.goto("/account/appointments"); await expect(page.locator("#main").getByRole("link", { name: "Contact Us", exact: true })).toHaveAttribute("href", "/contact-us"); await expect(page.locator("#main")).not.toContainText(/Confirmed appointment|Appointment booked/); expect(state.unexpected).toEqual([]);
});
test("signed-out account offers sign-in without requesting private customer records", async ({ page }) => {
  const state = await fixtures(page, { signedOut: true }); await page.goto("/account"); await expect(page.getByRole("heading", { name: "Sign in to your account" })).toBeVisible(); await expect(page.locator('a[href="/account/register"]').first()).toBeVisible(); await expect(page.locator("#main")).not.toContainText(customer.name);
  expect(state.requests.filter(req => ["/api/v1/account/profile", "/api/v1/account/orders"].includes(req.path))).toHaveLength(0); expect(state.unexpected).toEqual([]);
});
test("profile failure offers a retry and does not invent personal details", async ({ page }) => {
  const state = await fixtures(page, { profileFailures: 1 }); await page.goto("/account/details"); await expect(page.getByRole("alert").filter({ hasText: "Fixture profile service" })).toBeVisible(); await page.getByRole("button", { name: "Try again", exact: true }).click(); await expect(page.getByLabel("First name *", { exact: true })).toHaveValue("Amelia"); expect(state.unexpected).toEqual([]);
});
test("profile save submits entered fields and refreshes the account", async ({ page }) => {
  const state = await fixtures(page); await page.goto("/account/details"); await page.getByLabel("Display name *", { exact: true }).fill("Amelia Traveler"); await page.getByRole("button", { name: "Save changes", exact: true }).click(); await expect(page.getByRole("status").filter({ hasText: "Your profile has been saved." })).toBeVisible(); expect(state.requests.find(req => req.path === "/api/v1/account/profile" && req.method === "PATCH")?.body).toMatchObject({ displayName: "Amelia Traveler" }); expect(state.user?.name).toBe("Amelia Traveler"); expect(state.unexpected).toEqual([]);
});
test("sign out revokes the account and refreshes before showing sign-in", async ({ page }) => {
  const state = await fixtures(page); await page.goto("/account/details"); await (await navigation(page)).getByRole("button", { name: "Sign out", exact: true }).click(); await expect(page).toHaveURL(/\/account\/sign-in$/); await expect(page.getByRole("heading", { name: "Sign in to your account" })).toBeVisible(); const i = state.requests.findIndex(req => req.path === "/api/v1/auth/logout"); expect(i).toBeGreaterThan(-1); expect(state.requests.slice(i + 1).some(req => req.path === "/api/v1/account" && req.method === "GET")).toBe(true); expect(state.user).toBeNull(); expect(state.unexpected).toEqual([]);
});
test("failed sign out preserves the session and reports the actual error", async ({ page }) => {
  const state = await fixtures(page, { logoutFails: true }); await page.goto("/account/details"); await (await navigation(page)).getByRole("button", { name: "Sign out", exact: true }).click(); await expect(page.getByRole("alert").filter({ hasText: "Fixture sign-out connection interrupted." })).toBeVisible(); await expect(page).toHaveURL(/\/account\/details$/); expect(state.user).toEqual(customer); expect(state.unexpected).toEqual([]);
});
test("saved addresses support creation editing and removal", async ({ page }) => {
  const state = await fixtures(page); await page.goto("/account/addresses"); for (const [label, value] of [["Full name", address.name], ["Email", address.email], ["Street address", address.line1], ["City", address.city], ["State", address.region], ["Postal code", address.postalCode]]) await page.getByLabel(label, { exact: true }).fill(value);
  await page.getByRole("button", { name: "Save address", exact: true }).click(); const saved = page.getByRole("article").filter({ hasText: address.line1 }); await expect(saved).toHaveCount(1); await saved.getByRole("button", { name: "Edit", exact: true }).click(); await page.getByLabel("Street address", { exact: true }).fill("456 Fictional Garden Avenue"); await page.getByRole("button", { name: "Save address", exact: true }).click(); const edited = page.getByRole("article").filter({ hasText: "456 Fictional Garden Avenue" }); await expect(edited).toHaveCount(1); await edited.getByRole("button", { name: "Remove", exact: true }).click(); await expect(edited).toHaveCount(0); expect(state.addresses).toEqual([]); expect(state.requests.filter(req => req.path.startsWith("/api/v1/account/addresses") && req.method !== "GET").map(req => req.method)).toEqual(["POST", "PATCH", "DELETE"]); expect(state.unexpected).toEqual([]);
});
