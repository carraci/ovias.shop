import { test as base, expect } from "@playwright/test";

// Component and mocked route tests must never write to a running store.
// Test-specific handlers are registered later and take priority over this guard.
export const test = base.extend({
  page: async ({ page }, use) => {
    const unexpectedWrites: string[] = [];
    await page.route("**/api/**", async route => {
      const request = route.request();
      if (["GET", "HEAD", "OPTIONS"].includes(request.method())) return route.fallback();
      const path = new URL(request.url()).pathname;
      if (path.startsWith("/api/analytics/")) return route.fulfill({ json: { ok: true } });
      unexpectedWrites.push(`${request.method()} ${path}`);
      return route.fulfill({ status: 501, json: { error: { message: "This UI test has no fixture for this write." } } });
    });
    await use(page);
    expect(unexpectedWrites, "Every UI mutation must use an explicit fixture").toEqual([]);
  },
});
export { expect };
export type { Page } from "@playwright/test";
