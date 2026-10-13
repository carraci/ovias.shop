import { test, expect, type Page, type Route } from "@playwright/test";

const fixtureUser = { id: "auth-browser-fixture", name: "Browser Fixture", email: "auth-browser@example.test", role: "CUSTOMER" };
const cart = { lines: [], total: 0, version: 0 };

// Every browser API request is intercepted. These scenarios never write to MongoDB or send email.
async function mockApis(page: Page, handler: (route: Route, path: string) => Promise<boolean>, signedIn: () => boolean = () => false) {
  await page.route("**/api/**", async route => {
    const path = new URL(route.request().url()).pathname;
    if (await handler(route, path)) return;
    if (path === "/api/v1/account") return route.fulfill({ json: { data: { user: signedIn() ? fixtureUser : null } } });
    if (path === "/api/v1/cart") return route.fulfill({ json: { data: cart } });
    if (path === "/api/auth/social") return route.fulfill({ json: { data: { google: true, apple: false } } });
    if (path === "/api/support/realtime") return route.fulfill({ status: 401, json: { error: { message: "Fixture realtime disabled" } } });
    if (route.request().method() !== "GET" && !/analytics|heartbeat|wishlist/.test(path)) {
      throw new Error(`Unexpected mutation blocked: ${route.request().method()} ${path}`);
    }
    await route.fulfill({ json: { data: [] } });
  });
}

async function fillCode(page: Page, code: string) {
  for (let index = 0; index < code.length; index++) await page.getByLabel(`Digit ${index + 1}`, { exact: true }).fill(code[index]);
}

test("sign-in updates account state before a delayed cart and then opens the requested account page", async ({ page }) => {
  let signedIn = false;
  let delayedCart: Route | undefined;
  await mockApis(page, async (route, path) => {
    if (path === "/api/v1/auth/login") {
      expect(route.request().postDataJSON()).toEqual({ email: fixtureUser.email, password: "Original-password-123" });
      signedIn = true;
      await route.fulfill({ json: { data: { user: fixtureUser } } });
      return true;
    }
    if (path === "/api/v1/cart" && signedIn && !delayedCart) {
      delayedCart = route;
      return true;
    }
    return false;
  }, () => signedIn);
  await page.goto("/account/sign-in?next=/account/notifications");
  await page.getByLabel("Email address", { exact: true }).fill(fixtureUser.email);
  await page.getByLabel("Password", { exact: true }).fill("Original-password-123");
  await page.getByRole("button", { name: "SIGN IN →", exact: true }).click();
  await expect(page.getByRole("link", { name: "My account", exact: true })).toHaveAttribute("href", "/account");
  await expect.poll(() => Boolean(delayedCart)).toBe(true);
  await delayedCart!.fulfill({ json: { data: cart } });
  await expect(page).toHaveURL(/\/account\/notifications$/);
  await expect(page.getByRole("heading", { name: "Account activity.", exact: true })).toBeVisible();
});

test("registration shows email-provider failure and a retry advances to six-digit verification", async ({ page }) => {
  let attempts = 0;
  await mockApis(page, async (route, path) => {
    if (path !== "/api/v1/auth/register") return false;
    const body = route.request().postDataJSON();
    expect(body.email).toBe(fixtureUser.email);
    expect(body.terms).toBe("on");
    attempts++;
    await route.fulfill(attempts === 1
      ? { status: 502, json: { error: { message: "Verification email could not be sent. Please try again." } } }
      : { json: { data: { verificationRequired: true, email: fixtureUser.email } } });
    return true;
  });
  await page.goto("/account/register");
  await page.getByLabel(/^First name/).fill("Browser");
  await page.getByLabel(/^Last name/).fill("Fixture");
  await page.getByLabel(/^Email address/).fill(fixtureUser.email);
  await page.getByLabel(/^Password/).fill("Original-password-123");
  await page.getByLabel(/^Confirm password/).fill("Original-password-123");
  await page.getByRole("checkbox", { name: /I accept/ }).check();
  await page.getByRole("button", { name: "CREATE ACCOUNT →", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Verification email could not be sent");
  await expect(page.getByRole("heading", { name: "Create your OVIA account" })).toBeVisible();
  await page.getByRole("button", { name: "CREATE ACCOUNT →", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Enter verification code" })).toBeVisible();
  await expect(page.getByRole("group", { name: "6-digit verification code" }).getByRole("textbox")).toHaveCount(6);
  await expect(page.getByRole("button", { name: "VERIFY CODE →", exact: true })).toBeDisabled();
  expect(attempts).toBe(2);
});

test("recovery rejects a wrong code, accepts the correct code and keeps reset authorization in memory", async ({ page }) => {
  let attempts = 0;
  let resetRequests = 0;
  const resetToken = "browser-fixture-reset-authorization";
  await mockApis(page, async (route, path) => {
    if (path === "/api/v1/auth/forgot-password") {
      expect(route.request().postDataJSON()).toEqual({ email: fixtureUser.email });
      await route.fulfill({ json: { data: { message: "If the account exists, a code was sent." } } });
      return true;
    }
    if (path === "/api/v1/auth/verify-otp") {
      attempts++;
      expect(route.request().postDataJSON().otp).toBe(attempts === 1 ? "123456" : "654321");
      await route.fulfill(attempts === 1
        ? { status: 400, json: { error: { message: "Invalid or expired code. 4 of 5 attempts remaining." } } }
        : { json: { data: { resetToken } } });
      return true;
    }
    if (path === "/api/v1/auth/reset-password") {
      resetRequests++;
      expect(route.request().postDataJSON()).toEqual({ resetToken, newPassword: "Replacement-password-456" });
      await route.fulfill({ json: { data: { message: "Password updated. Sign in with your new password." } } });
      return true;
    }
    return false;
  });
  await page.goto("/account/forgot-password");
  await page.getByLabel("Email address", { exact: true }).fill(fixtureUser.email);
  await page.getByRole("button", { name: "SEND VERIFICATION CODE →", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Enter verification code" })).toBeVisible();
  await fillCode(page, "123456");
  await page.getByRole("button", { name: "VERIFY CODE →", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("4 of 5 attempts remaining");
  await fillCode(page, "654321");
  await page.getByRole("button", { name: "VERIFY CODE →", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Reset your password" })).toBeVisible();
  expect(await page.evaluate(() => JSON.stringify({ url: location.href, local: { ...localStorage }, session: { ...sessionStorage } }))).not.toContain(resetToken);
  await page.getByLabel("New password", { exact: true }).fill("Replacement-password-456");
  await page.getByLabel("Confirm new password", { exact: true }).fill("Different-password-789");
  await page.getByRole("button", { name: "RESET PASSWORD →", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Passwords must match.");
  expect(resetRequests).toBe(0);
  await page.getByLabel("Confirm new password", { exact: true }).fill("Replacement-password-456");
  await page.getByRole("button", { name: "RESET PASSWORD →", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Password updated" })).toBeVisible();
  await expect(page.getByText("Your password has been reset. Please sign in.", { exact: true })).toBeVisible();
  expect(resetRequests).toBe(1);
});

test("Google provider errors remain visible and allow a retry instead of silently navigating", async ({ page }) => {
  let attempts = 0;
  await mockApis(page, async (route, path) => {
    if (path !== "/api/auth/social/google/start") return false;
    attempts++;
    expect(route.request().postDataJSON()).toEqual({ intent: "signin", terms: "on" });
    await route.fulfill({ status: 503, json: { error: { message: "Google sign-in is unavailable. Please try email and password." } } });
    return true;
  });
  await page.goto("/account/sign-in");
  const google = page.getByRole("button", { name: "Sign in with Google", exact: true });
  await expect(google).toBeEnabled();
  await google.click();
  await expect(page.getByRole("alert")).toContainText("Google sign-in is unavailable");
  await expect(google).toBeEnabled();
  expect(attempts).toBe(1);
  await expect(page).toHaveURL(/\/account\/sign-in$/);
});
