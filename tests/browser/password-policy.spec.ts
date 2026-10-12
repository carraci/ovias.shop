import { test, expect, type Page } from "@playwright/test";

async function mockReadOnlyAccount(page: Page) {
  await page.route("**/api/v1/account", (route) =>
    route.fulfill({ json: { data: { user: null } } }),
  );
  await page.route("**/api/v1/cart", (route) =>
    route.fulfill({ json: { data: { lines: [], total: 0, version: 0 } } }),
  );
}

for (const password of ["Abcd1!xy", "Longer1!password"]) {
  test(`registration accepts a ${password.length}-character password using the displayed policy`, async ({
    page,
  }) => {
    await mockReadOnlyAccount(page);
    const registrations: Record<string, unknown>[] = [];
    await page.route("**/api/v1/auth/register", async (route) => {
      const payload = route.request().postDataJSON();
      registrations.push(payload);
      await route.fulfill({
        json: { data: { verificationRequired: true, email: payload.email } },
      });
    });
    await page.goto("/account/register");
    await expect(
      page.getByRole("heading", { name: "Create your OVIA account" }),
    ).toBeVisible();
    await page.getByLabel(/^First name/).fill("Policy");
    await page.getByLabel(/^Last name/).fill("Traveler");
    await page.getByLabel(/^Email address/).fill("policy-browser@example.test");
    await page.getByRole("checkbox", { name: /I accept/ }).check();
    const field = page.getByLabel("Password *", { exact: true });
    const confirmation = page.getByLabel(/^Confirm password/);
    await expect(field).toHaveAttribute("minlength", "8");
    await expect(field).toHaveAttribute("maxlength", "128");
    await expect(
      page
        .getByRole("list", { name: "New password requirements", exact: true })
        .locator("li")
        .filter({ hasText: "At least 8 characters" }),
    ).toBeVisible();
    await expect(
      page.getByText("At least 10 characters", { exact: true }),
    ).toHaveCount(0);
    if (password.length === 8) {
      for (const invalid of ["Abcd1234", "abcd1!xy", "Abcde!xy", "Abcd1! x"]) {
        await field.fill(invalid);
        await confirmation.fill(invalid);
        await page.getByRole("button", { name: /^CREATE ACCOUNT/i }).click();
        await expect(page.getByRole("alert").filter({ hasText: /Password must/ })).toBeVisible();
        expect(registrations).toHaveLength(0);
      }
    }
    await field.fill(password);
    await confirmation.fill(password);
    await page.getByRole("button", { name: /^CREATE ACCOUNT/i }).click();
    await expect(
      page.getByRole("heading", { name: "Enter verification code" }),
    ).toBeVisible();
    expect(registrations).toHaveLength(1);
    expect(registrations[0]).toMatchObject({
      password,
      confirmPassword: password,
    });
  });
}

test("reset rejects missing special characters and accepts eight characters without lowercase", async ({
  page,
}) => {
  await mockReadOnlyAccount(page);
  const resets: Record<string, unknown>[] = [];
  const token = "a".repeat(64);
  await page.route("**/api/v1/auth/reset-password", async (route) => {
    resets.push(route.request().postDataJSON());
    await route.fulfill({
      json: {
        data: { message: "Password updated. Sign in with your new password." },
      },
    });
  });
  await page.goto(`/account/reset-password?token=${token}`);
  await expect(
    page.getByRole("heading", { name: "Reset your password" }),
  ).toBeVisible();
  const field = page.getByLabel("New password", { exact: true });
  const confirmation = page.getByLabel("Confirm new password", { exact: true });
  await expect(field).toHaveAttribute("minlength", "8");
  await field.fill("ABCD1234");
  await confirmation.fill("ABCD1234");
  await page.getByRole("button", { name: /^RESET PASSWORD/i }).click();
  await expect(page.getByRole("alert").filter({ hasText: /Password must/ })).toContainText(/special/i);
  expect(resets).toHaveLength(0);
  await field.fill("ABCD1!XY");
  await confirmation.fill("ABCD1!XY");
  await page.getByRole("button", { name: /^RESET PASSWORD/i }).click();
  await expect(
    page.getByRole("heading", { name: "Password updated" }),
  ).toBeVisible();
  expect(resets).toEqual([{ token, password: "ABCD1!XY" }]);
});

test("sign in submits existing credentials without applying the new password policy", async ({
  page,
}) => {
  await mockReadOnlyAccount(page);
  const logins: Record<string, unknown>[] = [];
  await page.route("**/api/v1/auth/login", async (route) => {
    const payload = route.request().postDataJSON();
    logins.push(payload);
    await route.fulfill({
      json: { data: { verificationRequired: true, email: payload.email } },
    });
  });
  await page.goto("/account/sign-in");
  await page.getByLabel(/^Email address/).fill("legacy-browser@example.test");
  await page.getByLabel("Password", { exact: true }).fill("old pass");
  await page.getByRole("button", { name: /^SIGN IN →$/i }).click();
  await expect(
    page.getByRole("heading", { name: "Enter verification code" }),
  ).toBeVisible();
  expect(logins).toEqual([
    { email: "legacy-browser@example.test", password: "old pass" },
  ]);
});
