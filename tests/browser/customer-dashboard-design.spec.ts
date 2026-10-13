import { test, expect } from "./helpers/mocked-ui";
import { build } from "esbuild";
let js = "",
  css = "";
test.beforeAll(async () => {
  const result = await build({
    stdin: {
      contents: `import React from 'react';import {createRoot} from 'react-dom/client';import {StoreProvider} from './src/components/store-provider';import {CustomerAccountShell,CustomerAccountOverview} from './src/components/customer-account-shell';createRoot(document.getElementById('root')).render(<StoreProvider><CustomerAccountShell><CustomerAccountOverview/></CustomerAccountShell></StoreProvider>);`,
      resolveDir: process.cwd(),
      loader: "tsx",
    },
    bundle: true,
    write: false,
    outfile: "dashboard.js",
    platform: "browser",
    jsx: "automatic",
    define: { "process.env.NODE_ENV": '"production"' },
    plugins: [
      {
        name: "fixture-navigation",
        setup(b) {
          b.onResolve({ filter: /^next\/(navigation|link)$/ }, (a) => ({
            path: a.path,
            namespace: "fixture",
          }));
          b.onLoad({ filter: /.*/, namespace: "fixture" }, (a) => ({
            contents: a.path.endsWith("navigation")
              ? 'export const usePathname=()=>"/account";export const useRouter=()=>({push:()=>{}});'
              : `import React from 'react';export default function Link({children,...props}){return React.createElement('a',props,children)}`,
            loader: "js",
            resolveDir: process.cwd(),
          }));
        },
      },
    ],
  });
  js = result.outputFiles.find((f) => f.path.endsWith(".js"))!.text;
  css = result.outputFiles.find((f) => f.path.endsWith(".css"))!.text;
});
test("warm dashboard renders actual summaries and accessible mobile navigation", async ({
  page,
}) => {
  await page.route("**/api/v1/**", (r) => {
    const p = new URL(r.request().url()).pathname;
    let data: unknown = [];
    if (p.endsWith("/account"))
      data = {
        user: {
          id: "design-fixture",
          name: "Amelia Rowan",
          email: "amelia@example.test",
        },
      };
    if (p.endsWith("/cart")) data = { lines: [], total: 0, version: 0 };
    if (p.endsWith("/account/orders"))
      data = [
        {
          id: "fixture-order",
          orderNumber: "OVIA-1042",
          status: "paid",
          total: 2450000,
          createdAt: "2026-10-08T10:00:00Z",
          lines: [{}],
          shipping: { status: "IN_TRANSIT" },
        },
      ];
    if (p.endsWith("support/conversations")) data = [{ status: "Open" }];
    return r.fulfill({ json: { data } });
  });
  await page.route("**/dashboard-fixture", (r) =>
    r.fulfill({
      contentType: "text/html",
      body: `<html><style>*{box-sizing:border-box}body{margin:0}</style><style>${css}</style><div id="root"></div><script src="/dashboard-fixture.js"></script></html>`,
    }),
  );
  await page.route("**/dashboard-fixture.js", (r) =>
    r.fulfill({ contentType: "application/javascript", body: js }),
  );
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("http://localhost:3000/dashboard-fixture");
  await expect(
    page.getByRole("heading", { name: "Welcome back, Amelia." }),
  ).toBeVisible();
  await expect(page.getByText("OVIA-1042")).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Customer dashboard" }),
  ).toBeVisible();
  await expect(
    page.locator('section[aria-label="Account summary"]'),
  ).toContainText("Active shipments");
  await page.screenshot({
    path: "artifacts/customer-dashboard-warm-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByRole("button", { name: "Account menu" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Account menu" }).click();
  await expect(
    page.getByRole("navigation", { name: "Customer dashboard" }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.screenshot({
    path: "artifacts/customer-dashboard-warm-mobile.png",
    fullPage: true,
  });
});
