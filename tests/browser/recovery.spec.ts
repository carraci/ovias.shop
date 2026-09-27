import { test, expect } from "@playwright/test";

test("recovery keeps credentials on the app origin and reset token in memory", async ({
  page,
}) => {
  const external: string[] = [];
  page.on("request", (request) => {
    if (!new URL(request.url()).hostname.match(/^(localhost|127\.0\.0\.1)$/))
      external.push(request.url());
  });
  await page.route("**/api/v1/auth/forgot-password", (route) =>
    route.fulfill({
      json: {
        data: { message: "If that email is registered, a code was sent." },
      },
    }),
  );
  await page.route("**/api/v1/account", route => route.fulfill({ json: { data: { user: null } } }));
  await page.route("**/api/v1/cart", route => route.fulfill({ json: { data: { lines: [], total: 0, version: 0 } } }));
  let attempts = 0;
  await page.route("**/api/v1/auth/verify-otp", async (route) => {
    expect(route.request().postDataJSON().email).toBe("recovery@example.test");
    attempts++;
    await route.fulfill(
      attempts === 1
        ? {
            status: 400,
            json: {
              error: {
                message: "Invalid or expired code. 4 of 5 attempts remaining.",
              },
            },
          }
        : { json: { data: { resetToken: "test-reset-authorization" } } },
    );
  });
  await page.route("**/api/v1/auth/reset-password", async (route) => {
    expect(route.request().postDataJSON()).toEqual({
      resetToken: "test-reset-authorization",
      newPassword: "Replacement-password-456",
    });
    await route.fulfill({
      json: {
        data: { message: "Password updated. Sign in with your new password." },
      },
    });
  });
  await page.goto("/account/forgot-password");
  await page
    .getByLabel(/^Email address/)
    .fill("recovery@example.test");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(
    page.getByRole("heading", { name: "Verify with email" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Resend code" }),
  ).toBeDisabled();
  await page.getByLabel("Enter code", { exact: true }).fill("123456");
  await page.getByRole("button", { name: "Submit code", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "4 of 5" }),
  ).toBeVisible();
  await page.getByLabel("Enter code", { exact: true }).fill("654321");
  await page.getByRole("button", { name: "Submit code", exact: true }).click();
  await page
    .getByLabel("New password", { exact: true })
    .fill("Replacement-password-456");
  await page
    .getByLabel(/^Confirm password/)
    .fill("Different-password-789");
  await page.getByRole("button", { name: "Save new password" }).click();
  await expect(
    page.getByText("Passwords must match.", { exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(() =>
      JSON.stringify({
        local: { ...localStorage },
        session: { ...sessionStorage },
        url: location.href,
      }),
    ),
  ).not.toContain("test-reset-authorization");
  await page
    .getByLabel(/^Confirm password/)
    .fill("Replacement-password-456");
  await page.getByRole("button", { name: "Save new password" }).click();
  await expect(page).toHaveURL(/\/account\/sign-in$/);
  expect(external).toEqual([]);
});

test("registration, refresh, login errors, logout and protected APIs use the existing account system", async ({
  page,
  request,
  baseURL,
}) => {
  test.skip(process.env.OVIA_AUTH_TEST_ISOLATED !== "true", "Run scripts/test-auth-isolated.mjs to avoid touching a configured database.");
  const email = `browser-${Date.now()}@example.test`;
  const headers = { origin: baseURL! };
  await page.goto("/account/register");
  await page.getByLabel(/^First name/).fill("Recovery");
  await page.getByLabel(/^Last name/).fill("Test");
  await page.getByLabel(/^Email address/).fill(email);
  await page
    .getByLabel(/^Password/)
    .fill("Original-password-123");
  await page
    .getByLabel(/^Confirm password/)
    .fill("Original-password-123");
  await page.getByRole("checkbox", { name: /I accept/ }).check();
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(
    page.getByRole("heading", { name: "Welcome, Recovery." }),
  ).toBeVisible();
  const cookie = (await page.context().cookies()).find(
    (cookie) => cookie.name === "ovia_session",
  );
  expect(cookie?.httpOnly).toBe(true);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Welcome, Recovery." }),
  ).toBeVisible();
  const signedOutHydrated = page.waitForResponse(response => response.url().endsWith("/api/v1/account"));
  await page.getByRole("button", { name: "Sign out" }).click();
  await signedOutHydrated;
  await expect(page).toHaveURL(/\/account\/sign-in$/);
  expect((await page.request.get("/api/v1/account/orders")).status()).toBe(401);
  expect(
    (
      await request.post("/api/v1/auth/register", {
        headers,
        data: {
          name: "Duplicate Test",
          email,
          password: "Original-password-123",
          confirmPassword: "Original-password-123",
          terms: "on",
        },
      })
    ).status(),
  ).toBe(409);
  await page.getByLabel(/^Email address/).fill(email);
  await page
    .getByLabel(/^Password/)
    .fill("Incorrect-password-123");
  const rejectedLogin = page.waitForResponse(response => response.url().endsWith("/api/v1/auth/login"));
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  expect((await rejectedLogin).status()).toBe(401);
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "Email or password is incorrect." }),
  ).toBeVisible();
  await page
    .getByLabel(/^Password/)
    .fill("Original-password-123");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Welcome, Recovery." }),
  ).toBeVisible();
});
