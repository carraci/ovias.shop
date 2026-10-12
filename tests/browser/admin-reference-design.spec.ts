import { test, expect } from "@playwright/test";
import { build } from "esbuild";
let js = "",
  css = "";
const metric = (value: number) => ({
  value,
  formatted: String(value),
  period: "Live database",
});
const dashboard = {
  kpis: {
    revenue: metric(230000),
    avgOrderValue: metric(46000),
    totalOrders: metric(5),
    customers: metric(17),
  },
  salesOverview: {
    revenueData: [
      { label: "2026-10-01", value: 140000 },
      { label: "2026-10-02", value: 90000 },
    ],
    ordersData: [
      { label: "2026-10-01", value: 3 },
      { label: "2026-10-02", value: 2 },
    ],
  },
  liveStatus: {
    allOperational: true,
    services: [{ name: "Database", status: "Online" }],
  },
  ordersByStatus: {
    total: 5,
    breakdown: [
      { status: "Processing", count: 4, percentage: 80, color: "blue" },
      { status: "Cancelled", count: 1, percentage: 20, color: "red" },
    ],
  },
  topCategories: [{ name: "Luggage", count: 4, percentage: 80 }],
  recentOrders: [
    {
      orderId: "#OVIA-1042",
      customer: "Amelia Rowan",
      product: "Cabin",
      amount: "₹46,000",
      status: "Processing",
      date: "8 Oct 2026",
    },
  ],
  lowStockAlerts: [],
  revenueByChannel: {
    total: "₹2,30,000",
    channels: [{ name: "Website", percentage: 100, color: "yellow" }],
  },
  topProducts: [
    {
      name: "Passage Cabin",
      revenue: "₹46,000",
      sold: "1 sold",
      image: "/media/luggage.svg",
    },
  ],
  recentReviews: [
    {
      id: "review-1",
      productName: "Passage Cabin",
      productSlug: "passage-cabin",
      image: "/media/luggage.svg",
      reviewer: "Actual reviewer",
      rating: 4,
      status: "approved",
      createdAt: "2026-10-08T10:00:00Z",
    },
  ],
  todayActivity: [{ title: "ORDER CREATED", time: "10:00 am" }],
};
test.beforeAll(async () => {
  const result = await build({
    stdin: {
      contents: `import React from 'react';import {createRoot} from 'react-dom/client';import {AdminShell} from './src/components/admin/admin-shell';import Dashboard from './src/app/admin/(control-center)/page';import Categories from './src/app/admin/(control-center)/categories/page';import Products from './src/app/admin/(control-center)/products/page';import {CategoryEditor} from './src/components/admin/category-editor';import {ProductEditor} from './src/components/admin/product-editor';import './src/app/admin/admin-typography.css';import './src/app/admin/admin-reference.css';createRoot(document.getElementById('root')).render(<AdminShell ownerName="Adarsh Shukla" ownerEmail="owner@example.test">{location.search.includes('product-edit')?<ProductEditor/>:location.search.includes('category-edit')?<CategoryEditor id="luggage"/>:location.search.includes('products')?<Products/>:location.search.includes('categories')?<Categories/>:<Dashboard/>}</AdminShell>);`,
      resolveDir: process.cwd(),
      loader: "tsx",
    },
    bundle: true,
    write: false,
    outfile: "admin-fixture.js",
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
              ? 'export const usePathname=()=>"/admin";export const useRouter=()=>({push:()=>{}});'
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
test("reference admin uses live summaries, chart controls, compact navigation and category actions", async ({
  page,
}) => {
  let currentDashboard = dashboard;
  let dashboardRequests = 0;
  await page.route("**/api/admin/dashboard**", async (r) => {
    dashboardRequests++;
    if (r.request().url().includes("from=") && dashboardRequests <= 2)
      await new Promise(resolve => setTimeout(resolve, 6500));
    await r.fulfill({ json: { success: true, data: currentDashboard } });
  });
  await page.route("**/api/admin/categories", (r) =>
    r.fulfill({
      json: {
        success: true,
        categories: [
          {
            id: "luggage",
            name: "Luggage",
            productCount: 3,
            parent: null,
            status: "Visible",
          },
          {
            id: "travel",
            name: "Travel accessories",
            productCount: 2,
            parent: null,
            status: "Visible",
          },
        ],
      },
    }),
  );
  await page.route("**/admin-fixture.js", (r) =>
    r.fulfill({ contentType: "application/javascript", body: js }),
  );
  await page.route("**/admin-fixture?*", (r) =>
    r.fulfill({
      contentType: "text/html",
      body: `<html><meta charset="utf-8"><style>body{margin:0}*{box-sizing:border-box}</style><style>${css}</style><div id="root"></div><script src="/admin-fixture.js"></script></html>`,
    }),
  );
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("http://localhost:3000/admin-fixture?dashboard");
  await expect(
    page.getByRole("heading", { name: "Income statistics" }),
  ).toBeVisible({ timeout: 15000 });
  await expect(page.getByText("₹2,30,000").first()).toBeVisible();
  await expect(page.locator(".admin-sidebar")).toHaveCSS(
    "background-color",
    "rgb(61, 71, 78)",
  );
  await expect(page.locator(".admin-sidebar > div").first()).toHaveCSS(
    "background-color",
    "rgb(255, 211, 51)",
  );
  await expect(
    page.getByRole("heading", { name: "Dashboard", exact: true }),
  ).toHaveCSS("font-size", "28px");
  await expect(
    page.locator(
      'svg[aria-label="Revenue over time, 2 dates"] rect[fill="#ffd333"]',
    ),
  ).toHaveCount(2);
  await page.getByLabel("Income statistics metric").selectOption("Orders");
  await expect(
    page.getByRole("img", { name: "Orders over time, 2 dates" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Toggle admin navigation" }).click();
  await expect(page.locator(".ovia-admin")).toHaveClass(
    /admin-sidebar-collapsed/,
  );
  await page.getByRole("button", { name: "Toggle admin navigation" }).click();
  await expect(page.locator(".ovia-admin")).not.toHaveClass(
    /admin-sidebar-collapsed/,
  );
  await expect(page.locator("body")).toHaveJSProperty("scrollWidth", 1440);
  await expect(
    page.getByRole("heading", { name: "Recent reviews" }),
  ).toHaveCount(1);
  await expect(page.getByText("Reviewed by Actual reviewer")).toBeVisible();
  await expect(
    page.getByRole("img", { name: "4 out of 5 stars" }),
  ).toBeVisible();
  currentDashboard = {
    ...dashboard,
    recentReviews: [],
    kpis: {
      ...dashboard.kpis,
      revenue: { ...dashboard.kpis.revenue, value: 345678 },
    },
  };
  const refreshButton = page.getByRole("button", { name: "Refresh dashboard data", exact: true });
  await expect(refreshButton).toBeEnabled({ timeout: 15000 });
  await refreshButton.click();
  await expect(page.locator(".admin-live-label")).toContainText("Last updated");
  await expect(page.getByText("₹3,45,678").first()).toBeVisible({
    timeout: 10000,
  });
  await expect(page.getByText("No customer reviews yet.")).toBeVisible();
  await page.screenshot({
    path: "artifacts/admin-reference-dashboard.png",
    fullPage: true,
  });
  await page.goto("http://localhost:3000/admin-fixture?categories");
  await expect(
    page.getByRole("cell", { name: "Luggage", exact: true }).first(),
  ).toBeVisible();
  await page.getByPlaceholder("Search categories...").fill("travel");
  await expect(
    page.getByRole("cell", { name: "Luggage", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("cell", { name: "Travel accessories", exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Add Category/i }),
  ).toHaveCount(0);
  await page.screenshot({
    path: "artifacts/admin-reference-categories.png",
    fullPage: true,
  });
});

test("catalog menu, real product filters and category editor save actual form fields", async ({
  page,
}) => {
  await page.route("**/api/admin/dashboard**", (route) =>
    route.fulfill({ json: { success: true, data: dashboard } }),
  );
  await page.route("**/api/admin/products**", (route) =>
    route.fulfill({
      json: {
        success: true,
        products: [
          {
            id: "cabin",
            name: "Stored Cabin",
            sku: "CABIN-1",
            category: "Luggage",
            price: 5000,
            stock: 3,
            status: "Active",
            image: "/media/luggage.svg",
          },
          {
            id: "bag",
            name: "Stored Bag",
            sku: "BAG-1",
            category: "Bags",
            price: 2000,
            stock: 0,
            status: "Draft",
          },
        ],
      },
    }),
  );
  await page.route("**/api/admin/categories", (route) =>
    route.fulfill({
      json: {
        success: true,
        categories: [
          {
            id: "luggage",
            name: "Luggage",
            slug: "luggage",
            parent: null,
            status: "Active",
            productCount: 1,
            image: "",
            description: "Stored description",
          },
        ],
      },
    }),
  );
  let saved: any;
  await page.route("**/api/admin/categories/luggage", async (route) => {
    saved = route.request().postDataJSON();
    await route.fulfill({ json: { success: true } });
  });
  await page.route("**/admin-fixture.js", (route) =>
    route.fulfill({ contentType: "application/javascript", body: js }),
  );
  await page.route("**/admin-fixture?*", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<html><style>body{margin:0}*{box-sizing:border-box}</style><style>${css}</style><div id="root"></div><script src="/admin-fixture.js"></script></html>`,
    }),
  );
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("http://localhost:3000/admin-fixture?products");
  await page.getByRole("button", { name: "Catalog", exact: true }).click();
  await expect(
    page.getByRole("link", { name: "Products List", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Categories List", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Stored Cabin", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Maximum price", { exact: true }).fill("3000");
  await expect(
    page.getByRole("link", { name: "Stored Cabin", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Stored Bag", exact: true }),
  ).toBeVisible();
  let imported:any;
  await page.route("**/api/admin/products",async route=>{if(route.request().method()==="POST"){imported=route.request().postDataJSON();await route.fulfill({json:{success:true,product:{id:"imported"}}});}else await route.fallback();});
  await page.getByRole("button",{name:"Import",exact:true}).click();
  await page.getByLabel("Product import file").setInputFiles({name:"catalog.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify([{name:"Uploaded catalog product",sku:"UP-1",category:"Luggage",price:3000,stock:4,status:"Active"}]))});
  expect(imported).toBeUndefined();
  await page.getByRole("button",{name:"Import hidden drafts"}).click();
  await expect.poll(()=>imported?.name).toBe("Uploaded catalog product");expect(imported.status).toBe("Draft");
  await page.getByRole("button",{name:"Close",exact:true}).click();
  await page.screenshot({
    path: "artifacts/admin-catalog-products.png",
    fullPage: true,
  });
  await page.route("**/api/admin/settings", (route) =>
    route.fulfill({
      json: {
        shipping: { standardShippingFee: 199, freeShippingThreshold: 10000 },
      },
    }),
  );
  await page.route("**/api/admin/product-taxonomy", (route) =>
    route.fulfill({
      json: {
        success: true,
        categories: [
          { id: "luggage", name: "Luggage", slug: "luggage", parent: null },
        ],
        collections: [],
      },
    }),
  );
  page.on("pageerror", (error) =>
    console.log("Editor browser error:", error.message),
  );
  await page.goto("http://localhost:3000/admin-fixture?product-edit");
  await expect(page.locator('[data-editor-section="1"]')).toBeVisible();
  await expect(page.locator('[data-editor-section="2"]')).toBeVisible();
  await expect(page.locator('[data-editor-section="3"]')).toBeVisible();
  await expect(page.locator('[data-editor-section="7"]')).toBeVisible();
  let savedProduct: any;
  await page.route("**/api/admin/products", async (route) => {
    if (route.request().method() === "POST") {
      savedProduct = route.request().postDataJSON();
      await route.fulfill({ json: { success: true, id: "saved-product" } });
    } else await route.fallback();
  });
  await page
    .getByLabel("Product name", { exact: true })
    .fill("Customer Travel Case");
  await page.getByLabel("SKU", { exact: true }).fill("CASE-REAL-1");
  await page.getByLabel("Price", { exact: true }).fill("4900");
  await page.getByLabel("Old price", { exact: true }).fill("5900");
  await page.getByLabel("Stock quantity", { exact: true }).fill("8");
  await page
    .getByLabel("Product description")
    .fill("Stored product description");
  await page
    .getByLabel("Short description", { exact: true })
    .fill("Carry-on case");
  await page.getByLabel("Scheduled", { exact: true }).check();
  await page.getByLabel("Publish date").fill("2027-01-01T12:00");
  await page.getByLabel("Add tag").fill("Travel");
  await page.getByLabel("Add tag").press("Enter");
  await page.screenshot({
    path: "artifacts/admin-product-editor.png",
    fullPage: false,
  });
  let uploaded = 0;
  await page.route("**/api/admin/upload", (route) =>
    route.fulfill({
      json: { success: true, url: `/media/review-image-${++uploaded}.png` },
    }),
  );
  await page.locator('input[type="file"]').setInputFiles([
    {
      name: "front.png",
      mimeType: "image/png",
      buffer: Buffer.from("image fixture"),
    },
    {
      name: "back.png",
      mimeType: "image/png",
      buffer: Buffer.from("image fixture"),
    },
  ]);
  await expect(page.getByLabel("Image 2 alt text")).toBeVisible();
  await page.getByLabel("Image 1 alt text").fill("Front of travel case");
  await page.getByLabel("Image 2 order").fill("0");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect.poll(() => savedProduct?.name).toBe("Customer Travel Case");
  expect(savedProduct.price).toBe(4900);
  expect(savedProduct.oldPrice).toBe(5900);
  expect(savedProduct.stock).toBe(8);
  expect(savedProduct.gallery).toEqual([
    "/media/review-image-2.png",
    "/media/review-image-1.png",
  ]);
  expect(savedProduct.image).toBe("/media/review-image-2.png");
  expect(savedProduct.imageAltMap["/media/review-image-1.png"]).toBe(
    "Front of travel case",
  );
  expect(savedProduct.shortDescription).toBe("Carry-on case");
  expect(savedProduct.tags).toContain("Travel");
  expect(Date.parse(savedProduct.publishAt)).toBeGreaterThan(Date.now());

  await page.goto("http://localhost:3000/admin-fixture?category-edit");
  await expect(page.getByLabel("Name", { exact: true })).toHaveValue("Luggage");
  await page
    .getByRole("textbox", { name: "Description", exact: true })
    .fill("Updated stored description");
  await page.getByLabel("Hidden", { exact: true }).check();
  await page.getByLabel("Page title").fill("Travel luggage");
  await page.screenshot({
    path: "artifacts/admin-category-editor.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect
    .poll(() => saved?.description)
    .toBe("Updated stored description");
  expect(saved.status).toBe("Draft");
  expect(saved.metaTitle).toBe("Travel luggage");
});
