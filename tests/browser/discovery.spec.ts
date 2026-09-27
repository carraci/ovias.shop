import { test, expect } from "@playwright/test";
test("new menu links open original OVIA edits", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "New", exact: true }).click();
  const menu = page.locator("#mega-menu");
  await expect(menu.getByText("Latest", { exact: true })).toBeVisible();
  for (const path of [
    "phone-cases",
    "artist-case",
    "in-motion",
    "anthracite",
    "stone",
  ]) {
    await expect(menu.locator(`a[href="/new/${path}"]`).first()).toBeVisible();
  }
  await menu
    .getByRole("link", { name: "Studio Artist Case", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Room for a new perspective." }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Studio Artist Case", exact: true }),
  ).toBeVisible();
});
test("store search, directions and offline map fallback", async ({ page }) => {
  await page.route("https://tile.openstreetmap.org/**", (route) =>
    route.abort(),
  );
  await page.goto("/storelocator");
  await expect(
    page.getByRole("heading", { name: "OVIA · Nalasopara East" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Get directions" }),
  ).toHaveAttribute("href", /401209/);
  await expect(
    page.getByText("Map tiles unavailable.", { exact: false }),
  ).toBeVisible();
  await page.getByLabel("Search city, area or postcode").fill("401209");
  await expect(page.getByText("1 location", { exact: true })).toBeVisible();
  await page.getByLabel("Search city, area or postcode").fill("Delhi");
  await expect(
    page.getByRole("heading", { name: "No stores found." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Show all locations" }).click();
  await expect(page.getByText("1 location", { exact: true })).toBeVisible();
});
test("homepage carousel and mobile menu stay within viewport", async ({
  page,
}) => {
  await page.goto("/");
  const rail = page.locator(".stories-rail");
  await page.getByRole("button", { name: "Next stories" }).click();
  await expect
    .poll(() => rail.evaluate((el) => el.scrollLeft))
    .toBeGreaterThan(50);
  await page.locator(".story-read").filter({ hasText: "Read" }).first().click();
  await expect(
    page.getByRole("heading", { name: "Take your ideas with you." }),
  ).toBeVisible();
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 850 });
    await page.goto("/");
    if (width < 760) {
      await page.getByRole("button", { name: "Open navigation" }).click();
      await page.getByRole("button", { name: "New", exact: true }).click();
      await expect(
        page.getByRole("link", { name: "All new products", exact: true }),
      ).toBeVisible();
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
  }
});
