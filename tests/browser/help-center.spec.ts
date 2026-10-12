import { test, expect } from "@playwright/test";

test("FAQ topics, search, accordion and both entry points", async ({ page }) => {
  await page.goto("/services/faq");
  await expect(page.getByRole("heading", { name: "Frequently Asked Questions" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "FAQ topics" }).getByRole("button")).toHaveCount(27);
  await expect(page.getByRole("button", { name: /View FAQs/ })).toHaveCount(12);
  const topics = page.getByRole("navigation", { name: "FAQ topics" });
  await topics.getByRole("button", { name: "Refunds", exact: true }).click();
  await expect(page.locator("#answers-title")).toHaveText("Refunds");
  const search = page.getByRole("searchbox", { name: "Search FAQs" });
  await search.fill("OTP");
  await expect(page.locator("#answers-title")).toHaveText("Search results");
  await page.getByRole("button", { name: "How long is an OTP valid?", exact: true }).click();
  await expect(page.locator('[id$="-answer"]:visible').filter({ hasText: "10 minutes" })).toBeVisible();
  await search.fill("zzzznothingmatches");
  await expect(page.getByRole("heading", { name: "No matching answers" })).toBeVisible();
  await page.getByRole("button", { name: "Clear FAQ search" }).click();
  await expect(page.locator("#answers-title")).toHaveText("Refunds");
  await page.goto("/faq");
  await expect(page.getByRole("heading", { name: "Frequently Asked Questions" })).toBeVisible();
});

test("mobile topics remain usable without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/services/faq");
  await page.getByLabel("Browse a topic").selectOption("password-and-security");
  await expect(page.locator("#answers-title")).toHaveText("Password & Security");
  const fits = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  expect(fits).toBe(true);
  await page.screenshot({ path: "test-results/help-center-mobile.png", fullPage: true });
});
