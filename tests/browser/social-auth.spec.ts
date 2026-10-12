import { test, expect, type Page } from "@playwright/test";
async function mockAccount(page: Page) {
  await page.route("**/api/v1/account", (r) =>
    r.fulfill({ json: { data: { user: null } } }),
  );
  await page.route("**/api/v1/cart", (r) =>
    r.fulfill({ json: { data: { lines: [], total: 0, version: 0 } } }),
  );
}
for (const width of [390, 1280]) {
  for (const provider of ["google", "apple"]) {
    test(`${provider} full-page OAuth redirect at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 844 });
      await mockAccount(page);
      await page.route("**/api/auth/social", (r) =>
        r.fulfill({ json: { data: { google: true, apple: true } } }),
      );
      let body: Record<string, unknown> | undefined;
      const host =
        provider === "google" ? "accounts.google.com" : "appleid.apple.com";
      await page.route(`https://${host}/**`, (r) =>
        r.fulfill({
          contentType: "text/html",
          body: "<h1>Provider consent simulation</h1>",
        }),
      );
      await page.route(`**/api/auth/social/${provider}/start`, (r) => {
        body = r.request().postDataJSON();
        return r.fulfill({
          json: { data: { url: `https://${host}/test-consent` } },
        });
      });
      await page.goto("/account/sign-in");
      const button = page.getByRole("button", {
        name: `Sign in with ${provider === "google" ? "Google" : "Apple"}`,
      });
      await expect(button).toBeEnabled();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
      const size = await button.boundingBox();
      expect(size!.height).toBeGreaterThanOrEqual(44);
      await button.click();
      await expect(page).toHaveURL(`https://${host}/test-consent`);
      expect(body).toEqual({ intent: "signin", terms: "on" });
    });
  }
}
test("provider failure allows retry and callback cancellation displays useful feedback", async ({
  page,
}) => {
  await mockAccount(page);
  await page.route("**/api/auth/social", (r) =>
    r.fulfill({ json: { data: { google: true, apple: true } } }),
  );
  await page.route("**/api/auth/social/google/start", (r) =>
    r.fulfill({
      status: 503,
      json: { error: { message: "Provider temporarily unavailable." } },
    }),
  );
  await page.goto("/account/sign-in?social_error=cancelled");
  await expect(page.locator("p[role=alert]")).toContainText("cancelled");
  const google = page.getByRole("button", { name: "Sign in with Google" });
  await google.click();
  await expect(page.locator("p[role=alert]")).toContainText(
    "temporarily unavailable",
  );
  await expect(google).toBeEnabled();
});
test("missing credentials hide Apple and keep email sign-in available", async ({
  page,
}) => {
  await mockAccount(page);
  await page.route("**/api/auth/social", (r) =>
    r.fulfill({ json: { data: { google: false, apple: false } } }),
  );
  await page.goto("/account/sign-in");
  await expect(
    page.getByRole("button", { name: "Sign in with Google" }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Sign in with Apple" }),
  ).toHaveCount(0);
  await expect(page.getByLabel("Email address", { exact: true })).toBeVisible();
});

test("Google-only setup hides unavailable Apple notices on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockAccount(page);
  await page.route("**/api/auth/social", (r) =>
    r.fulfill({ json: { data: { google: true, apple: false } } }),
  );
  await page.goto("/account/sign-in");
  await expect(
    page.getByRole("button", { name: "Sign in with Google" }),
  ).toBeEnabled();
  await expect(
    page.getByRole("button", { name: "Sign in with Apple" }),
  ).toHaveCount(0);
  await expect(
    page.getByText("Apple sign-in is not available on this site yet."),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Terms", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
