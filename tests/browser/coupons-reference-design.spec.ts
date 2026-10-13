import { test, expect } from "./helpers/mocked-ui";
import esbuild from "esbuild";

let js = "";
let css = "";

test.beforeAll(async () => {
  const result = await esbuild.build({
    stdin: {
      contents: `
        import React from 'react';
        import { createRoot } from 'react-dom/client';
        import { AdminShell } from './src/components/admin/admin-shell';
        import CouponsPage from './src/app/admin/(control-center)/coupons/page';
        import { CouponEditor } from './src/components/admin/coupon-editor';
        import './src/app/admin/admin-typography.css';
        import './src/app/admin/admin-reference.css';

        const params = new URLSearchParams(window.location.search);
        const isEdit = params.has('edit');
        const isNew = params.has('new');

        createRoot(document.getElementById('root')).render(
          <AdminShell ownerName="Adarsh Shukla" ownerEmail="owner@example.test">
            {isEdit ? (
              <CouponEditor couponId="ANNIVERSARY70" />
            ) : isNew ? (
              <CouponEditor couponId="new" />
            ) : (
              <CouponsPage />
            )}
          </AdminShell>
        );
      `,
      resolveDir: process.cwd(),
      loader: "tsx",
    },
    bundle: true,
    write: false,
    outfile: "coupons-fixture.js",
    platform: "browser",
    jsx: "automatic",
    define: { "process.env.NODE_ENV": '"production"' },
    plugins: [
      {
        name: "fixture-next",
        setup(b) {
          b.onResolve({ filter: /^next\/(navigation|link)$/ }, (a) => ({
            path: a.path,
            namespace: "fixture",
          }));
          b.onLoad({ filter: /.*/, namespace: "fixture" }, (a) => ({
            contents: a.path.endsWith("navigation")
              ? 'export const usePathname=()=>"/admin/coupons";export const useRouter=()=>({push:()=>{},replace:()=>{}});export const useParams=()=>({id:"ANNIVERSARY70"});'
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

test("coupons list matches reference layout with search, types, badges and editor", async ({
  page,
}) => {
  const mockCoupons = [
    {
      id: "cpn-1",
      code: "ANNIVERSARY70",
      description: "Anniversary promo",
      discountType: "percentage",
      value: 25,
      status: "Active",
      startDate: "2015-05-09",
      endDate: "2015-05-19",
    },
    {
      id: "cpn-2",
      code: "FIVESTARS",
      description: "Five star loyalty",
      discountType: "fixed",
      value: 500,
      status: "Active",
      startDate: "2020-05-05",
      endDate: "2030-06-05",
    },
    {
      id: "cpn-3",
      code: "FREESHIP",
      description: "Free shipping voucher",
      discountType: "free_shipping",
      value: 0,
      status: "Active",
      startDate: "2020-05-05",
      endDate: "2030-06-05",
    },
  ];

  await page.route("**/api/admin/coupons**", (route) => {
    if (route.request().url().includes("ANNIVERSARY70")) {
      return route.fulfill({
        json: {
          success: true,
          coupon: mockCoupons[0],
        },
      });
    }
    return route.fulfill({
      json: {
        success: true,
        coupons: mockCoupons,
      },
    });
  });

  await page.route("**/coupons-fixture.js", (route) =>
    route.fulfill({ contentType: "application/javascript", body: js })
  );
  await page.route("**/coupons-fixture?*", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<html><style>body{margin:0}*{box-sizing:border-box}</style><style>${css}</style><div id="root"></div><script src="/coupons-fixture.js"></script></html>`,
    })
  );

  await page.setViewportSize({ width: 1440, height: 950 });

  // 1. Visit Coupons List
  await page.goto("http://localhost:3000/coupons-fixture?list");
  await expect(page.getByRole("heading", { name: "Coupons", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "New coupon", exact: true })).toBeVisible();

  // Search input
  const searchInput = page.getByPlaceholder("Start typing to search for coupons");
  await expect(searchInput).toBeVisible();

  // Verify columns & codes
  await expect(page.getByRole("cell", { name: "ANNIVERSARY70" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "FIVESTARS" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "FREESHIP" })).toBeVisible();

  // Filter with search
  await searchInput.fill("FIVESTARS");
  await expect(page.getByRole("cell", { name: "ANNIVERSARY70" })).toHaveCount(0);
  await expect(page.getByRole("cell", { name: "FIVESTARS" })).toBeVisible();
  await searchInput.clear();

  // Take screenshot of Coupons List
  await page.screenshot({
    path: "artifacts/admin-reference-coupons-list.png",
    fullPage: true,
  });

  // 2. Visit Edit Coupon
  await page.goto("http://localhost:3000/coupons-fixture?edit=ANNIVERSARY70");
  await expect(page.getByRole("heading", { name: "Edit Coupon", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Basic information", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Status", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Schedule", exact: true })).toBeVisible();

  // Verify form fields
  await expect(page.getByLabel("Percentage")).toBeChecked();
  await expect(page.getByRole("button", { name: "Delete", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Edit", exact: true })).toBeVisible();

  // Take screenshot of Edit Coupon
  await page.screenshot({
    path: "artifacts/admin-reference-coupons-edit.png",
    fullPage: true,
  });

  // 3. Visit New Coupon
  await page.goto("http://localhost:3000/coupons-fixture?new=true");
  await expect(page.getByRole("heading", { name: "New Coupon", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Save", exact: true })).toBeVisible();
});
