# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin-reference-design.spec.ts >> reference admin uses live summaries, chart controls, compact navigation and category actions
- Location: tests\browser\admin-reference-design.spec.ts:111:5

# Error details

```
Error: expect(locator).toHaveCSS(expected) failed

Locator:  locator('.admin-sidebar')
Expected: "rgb(61, 71, 78)"
Received: "rgb(255, 255, 255)"
Timeout:  5000ms

Call log:
  - Expect "toHaveCSS" locator('.admin-sidebar') with timeout 5000ms
  - waiting for locator('.admin-sidebar')
    13 × locator resolved to <aside class="admin-sidebar">…</aside>
       - unexpected value "rgb(255, 255, 255)"

```

```yaml
- complementary:
  - link:
    - /url: /admin
  - link "Dashboard":
    - /url: /admin
  - link "Orders 5":
    - /url: /admin/orders
  - button "Products"
  - link "Customers":
    - /url: /admin/customers
  - link "Shipping & Logistics":
    - /url: /admin/shipping
  - link "Payments":
    - /url: /admin/payments
  - link "Returns & Refunds":
    - /url: /admin/returns
  - link "Content":
    - /url: /admin/content
  - link "Reports":
    - /url: /admin/reports
  - link "Support":
    - /url: /admin/support
  - link "Inventory":
    - /url: /admin/inventory
  - link "Coupons":
    - /url: /admin/coupons
  - link "Switch to Public Shop":
    - /url: /
  - text: AS Adarsh Shukla Owner
  - button "Sign out of Admin Control Center"
```

# Test source

```ts
  60  |     },
  61  |   ],
  62  |   recentReviews: [
  63  |     {
  64  |       id: "review-1",
  65  |       productName: "Passage Cabin",
  66  |       productSlug: "passage-cabin",
  67  |       image: "/media/luggage.svg",
  68  |       reviewer: "Actual reviewer",
  69  |       rating: 4,
  70  |       status: "approved",
  71  |       createdAt: "2026-10-08T10:00:00Z",
  72  |     },
  73  |   ],
  74  |   todayActivity: [{ title: "ORDER CREATED", time: "10:00 am" }],
  75  | };
  76  | test.beforeAll(async () => {
  77  |   const result = await build({
  78  |     stdin: {
  79  |       contents: `import React from 'react';import {createRoot} from 'react-dom/client';import {AdminShell} from './src/components/admin/admin-shell';import Dashboard from './src/app/admin/(control-center)/page';import Categories from './src/app/admin/(control-center)/categories/page';import Products from './src/app/admin/(control-center)/products/page';import {CategoryEditor} from './src/components/admin/category-editor';import {ProductEditor} from './src/components/admin/product-editor';import './src/app/admin/admin-typography.css';import './src/app/admin/admin-reference.css';createRoot(document.getElementById('root')).render(<AdminShell ownerName="Adarsh Shukla" ownerEmail="owner@example.test">{location.search.includes('product-edit')?<ProductEditor/>:location.search.includes('category-edit')?<CategoryEditor id="luggage"/>:location.search.includes('products')?<Products/>:location.search.includes('categories')?<Categories/>:<Dashboard/>}</AdminShell>);`,
  80  |       resolveDir: process.cwd(),
  81  |       loader: "tsx",
  82  |     },
  83  |     bundle: true,
  84  |     write: false,
  85  |     outfile: "admin-fixture.js",
  86  |     platform: "browser",
  87  |     jsx: "automatic",
  88  |     define: { "process.env.NODE_ENV": '"production"' },
  89  |     plugins: [
  90  |       {
  91  |         name: "fixture-next",
  92  |         setup(b) {
  93  |           b.onResolve({ filter: /^next\/(navigation|link)$/ }, (a) => ({
  94  |             path: a.path,
  95  |             namespace: "fixture",
  96  |           }));
  97  |           b.onLoad({ filter: /.*/, namespace: "fixture" }, (a) => ({
  98  |             contents: a.path.endsWith("navigation")
  99  |               ? 'export const usePathname=()=>"/admin";export const useRouter=()=>({push:()=>{}});'
  100 |               : `import React from 'react';export default function Link({children,...props}){return React.createElement('a',props,children)}`,
  101 |             loader: "js",
  102 |             resolveDir: process.cwd(),
  103 |           }));
  104 |         },
  105 |       },
  106 |     ],
  107 |   });
  108 |   js = result.outputFiles.find((f) => f.path.endsWith(".js"))!.text;
  109 |   css = result.outputFiles.find((f) => f.path.endsWith(".css"))!.text;
  110 | });
  111 | test("reference admin uses live summaries, chart controls, compact navigation and category actions", async ({
  112 |   page,
  113 | }) => {
  114 |   let currentDashboard = dashboard;
  115 |   let dashboardRequests = 0;
  116 |   await page.route("**/api/admin/dashboard**", async (r) => {
  117 |     dashboardRequests++;
  118 |     if (r.request().url().includes("from=") && dashboardRequests <= 2)
  119 |       await new Promise(resolve => setTimeout(resolve, 6500));
  120 |     await r.fulfill({ json: { success: true, data: currentDashboard } });
  121 |   });
  122 |   await page.route("**/api/admin/categories", (r) =>
  123 |     r.fulfill({
  124 |       json: {
  125 |         success: true,
  126 |         categories: [
  127 |           {
  128 |             id: "luggage",
  129 |             name: "Luggage",
  130 |             productCount: 3,
  131 |             parent: null,
  132 |             status: "Visible",
  133 |           },
  134 |           {
  135 |             id: "travel",
  136 |             name: "Travel accessories",
  137 |             productCount: 2,
  138 |             parent: null,
  139 |             status: "Visible",
  140 |           },
  141 |         ],
  142 |       },
  143 |     }),
  144 |   );
  145 |   await page.route("**/admin-fixture.js", (r) =>
  146 |     r.fulfill({ contentType: "application/javascript", body: js }),
  147 |   );
  148 |   await page.route("**/admin-fixture?*", (r) =>
  149 |     r.fulfill({
  150 |       contentType: "text/html",
  151 |       body: `<html><meta charset="utf-8"><style>body{margin:0}*{box-sizing:border-box}</style><style>${css}</style><div id="root"></div><script src="/admin-fixture.js"></script></html>`,
  152 |     }),
  153 |   );
  154 |   await page.setViewportSize({ width: 1440, height: 1000 });
  155 |   await page.goto("http://localhost:3000/admin-fixture?dashboard");
  156 |   await expect(
  157 |     page.getByRole("heading", { name: "Income statistics" }),
  158 |   ).toBeVisible({ timeout: 15000 });
  159 |   await expect(page.getByText("₹2,30,000").first()).toBeVisible();
> 160 |   await expect(page.locator(".admin-sidebar")).toHaveCSS(
      |                                                ^ Error: expect(locator).toHaveCSS(expected) failed
  161 |     "background-color",
  162 |     "rgb(61, 71, 78)",
  163 |   );
  164 |   await expect(page.locator(".admin-sidebar > div").first()).toHaveCSS(
  165 |     "background-color",
  166 |     "rgb(255, 211, 51)",
  167 |   );
  168 |   await expect(
  169 |     page.getByRole("heading", { name: "Dashboard", exact: true }),
  170 |   ).toHaveCSS("font-size", "28px");
  171 |   await expect(
  172 |     page.locator(
  173 |       'svg[aria-label="Revenue over time, 2 dates"] rect[fill="#ffd333"]',
  174 |     ),
  175 |   ).toHaveCount(2);
  176 |   await page.getByLabel("Income statistics metric").selectOption("Orders");
  177 |   await expect(
  178 |     page.getByRole("img", { name: "Orders over time, 2 dates" }),
  179 |   ).toBeVisible();
  180 |   await page.getByRole("button", { name: "Toggle admin navigation" }).click();
  181 |   await expect(page.locator(".ovia-admin")).toHaveClass(
  182 |     /admin-sidebar-collapsed/,
  183 |   );
  184 |   await page.getByRole("button", { name: "Toggle admin navigation" }).click();
  185 |   await expect(page.locator(".ovia-admin")).not.toHaveClass(
  186 |     /admin-sidebar-collapsed/,
  187 |   );
  188 |   await expect(page.locator("body")).toHaveJSProperty("scrollWidth", 1440);
  189 |   await expect(
  190 |     page.getByRole("heading", { name: "Recent reviews" }),
  191 |   ).toHaveCount(1);
  192 |   await expect(page.getByText("Reviewed by Actual reviewer")).toBeVisible();
  193 |   await expect(
  194 |     page.getByRole("img", { name: "4 out of 5 stars" }),
  195 |   ).toBeVisible();
  196 |   currentDashboard = {
  197 |     ...dashboard,
  198 |     recentReviews: [],
  199 |     kpis: {
  200 |       ...dashboard.kpis,
  201 |       revenue: { ...dashboard.kpis.revenue, value: 345678 },
  202 |     },
  203 |   };
  204 |   const refreshButton = page.getByRole("button", { name: "Refresh dashboard data", exact: true });
  205 |   await expect(refreshButton).toBeEnabled({ timeout: 15000 });
  206 |   await refreshButton.click();
  207 |   await expect(page.locator(".admin-live-label")).toContainText("Last updated");
  208 |   await expect(page.getByText("₹3,45,678").first()).toBeVisible({
  209 |     timeout: 10000,
  210 |   });
  211 |   await expect(page.getByText("No customer reviews yet.")).toBeVisible();
  212 |   await page.screenshot({
  213 |     path: "artifacts/admin-reference-dashboard.png",
  214 |     fullPage: true,
  215 |   });
  216 |   await page.goto("http://localhost:3000/admin-fixture?categories");
  217 |   await expect(
  218 |     page.getByRole("cell", { name: "Luggage", exact: true }).first(),
  219 |   ).toBeVisible();
  220 |   await page.getByPlaceholder("Search categories...").fill("travel");
  221 |   await expect(
  222 |     page.getByRole("cell", { name: "Luggage", exact: true }),
  223 |   ).toHaveCount(0);
  224 |   await expect(
  225 |     page.getByRole("cell", { name: "Travel accessories", exact: true }).first(),
  226 |   ).toBeVisible();
  227 |   await expect(
  228 |     page.getByRole("button", { name: /Add Category/i }),
  229 |   ).toHaveCount(0);
  230 |   await page.screenshot({
  231 |     path: "artifacts/admin-reference-categories.png",
  232 |     fullPage: true,
  233 |   });
  234 | });
  235 | 
  236 | test("catalog menu, real product filters and category editor save actual form fields", async ({
  237 |   page,
  238 | }) => {
  239 |   await page.route("**/api/admin/dashboard**", (route) =>
  240 |     route.fulfill({ json: { success: true, data: dashboard } }),
  241 |   );
  242 |   await page.route("**/api/admin/products**", (route) =>
  243 |     route.fulfill({
  244 |       json: {
  245 |         success: true,
  246 |         products: [
  247 |           {
  248 |             id: "cabin",
  249 |             name: "Stored Cabin",
  250 |             sku: "CABIN-1",
  251 |             category: "Luggage",
  252 |             price: 5000,
  253 |             stock: 3,
  254 |             status: "Active",
  255 |             image: "/media/luggage.svg",
  256 |           },
  257 |           {
  258 |             id: "bag",
  259 |             name: "Stored Bag",
  260 |             sku: "BAG-1",
```