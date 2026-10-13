# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin-reference-design.spec.ts >> catalog menu, real product filters and category editor save actual form fields
- Location: tests\browser\admin-reference-design.spec.ts:236:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: 'Catalog', exact: true })

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - complementary [ref=e4]:
    - generic [ref=e5]:
      - link:
        - /url: /admin
    - generic [ref=e6]:
      - link "Dashboard" [ref=e7] [cursor=pointer]:
        - /url: /admin
      - link "Orders 5" [ref=e14] [cursor=pointer]:
        - /url: /admin/orders
        - generic [ref=e18]: Orders
        - generic [ref=e21]: "5"
      - button "Products" [ref=e22] [cursor=pointer]
      - link "Customers" [ref=e30] [cursor=pointer]:
        - /url: /admin/customers
      - link "Shipping & Logistics" [ref=e37] [cursor=pointer]:
        - /url: /admin/shipping
      - link "Payments" [ref=e44] [cursor=pointer]:
        - /url: /admin/payments
      - link "Returns & Refunds" [ref=e48] [cursor=pointer]:
        - /url: /admin/returns
      - link "Content" [ref=e53] [cursor=pointer]:
        - /url: /admin/content
      - link "Reports" [ref=e60] [cursor=pointer]:
        - /url: /admin/reports
      - link "Support" [ref=e64] [cursor=pointer]:
        - /url: /admin/support
      - link "Inventory" [ref=e68] [cursor=pointer]:
        - /url: /admin/inventory
      - link "Coupons" [ref=e80] [cursor=pointer]:
        - /url: /admin/coupons
    - link "Switch to Public Shop" [ref=e85] [cursor=pointer]:
      - /url: /
    - generic [ref=e91]:
      - generic [ref=e92]:
        - generic [ref=e93]: AS
        - generic [ref=e94]:
          - generic [ref=e95]: Adarsh Shukla
          - generic [ref=e96]: Owner
      - button "Sign out of Admin Control Center" [ref=e97] [cursor=pointer]
  - generic [ref=e101]:
    - banner [ref=e102]:
      - button "Toggle admin navigation" [expanded] [ref=e103] [cursor=pointer]
      - textbox "Search orders, products, customers..." [ref=e110]
      - generic [ref=e111]:
        - button "Last 30 days" [ref=e112]
        - button "1" [ref=e116] [cursor=pointer]
        - generic [ref=e121] [cursor=pointer]:
          - generic [ref=e122]: AS
          - generic [ref=e123]:
            - generic [ref=e124]: Adarsh Shukla
            - generic [ref=e125]: Owner
    - main [ref=e128]:
      - generic [ref=e129]:
        - generic [ref=e130]:
          - generic [ref=e131]:
            - generic [ref=e132]:
              - link "Dashboard" [ref=e133] [cursor=pointer]:
                - /url: /admin
              - text: / Products
            - heading "Products" [level=1] [ref=e134]
            - paragraph [ref=e135]: Manage your product catalog (2 products)
          - generic [ref=e136]:
            - button "Import" [ref=e137] [cursor=pointer]
            - button "Export CSV" [ref=e138] [cursor=pointer]
            - link "New product" [ref=e142] [cursor=pointer]:
              - /url: /admin/products/new
        - generic [ref=e144]:
          - complementary [ref=e145]:
            - heading "Filters" [level=2] [ref=e146]
            - generic [ref=e147]:
              - text: Price range (₹)
              - slider "Minimum price" [ref=e148]: "0"
              - slider "Maximum price slider" [ref=e149]: "5000"
              - generic [ref=e150]: ₹0 – ₹5,000
              - text: Maximum price
              - spinbutton "Maximum price" [ref=e151]
            - generic [ref=e152]:
              - heading "Categories" [level=3] [ref=e153]
              - generic [ref=e154]:
                - checkbox "Bags" [ref=e155]
                - text: Bags
              - generic [ref=e156]:
                - checkbox "Luggage" [ref=e157]
                - text: Luggage
            - generic [ref=e158]:
              - heading "Product type" [level=3] [ref=e159]
              - generic [ref=e160]:
                - radio "All" [checked] [ref=e161]
                - text: All
              - generic [ref=e162]:
                - radio "Simple" [ref=e163]
                - text: Simple
              - generic [ref=e164]:
                - radio "Variable" [ref=e165]
                - text: Variable
              - generic [ref=e166]:
                - radio "Digital" [ref=e167]
                - text: Digital
            - generic [ref=e168]:
              - text: Visibility
              - combobox "Status filter" [ref=e169] [cursor=pointer]:
                - option "All Status" [selected]
                - option "Active"
                - option "Draft"
                - option "Archived"
            - generic [ref=e170]:
              - text: Collections
              - combobox "Collection filter" [ref=e171] [cursor=pointer]:
                - option "All Collections" [selected]
            - button "Clear filters" [ref=e172] [cursor=pointer]
          - generic [ref=e173]:
            - generic [ref=e174]:
              - textbox "Search products" [ref=e179]:
                - /placeholder: Search by name, SKU, category…
              - button "Refresh catalog" [ref=e180] [cursor=pointer]
            - table [ref=e187]:
              - rowgroup [ref=e188]:
                - row [ref=e189]:
                  - columnheader [ref=e190]:
                    - checkbox "Select all displayed products" [ref=e191]
                  - columnheader "Product" [ref=e192]
                  - columnheader "Category" [ref=e193]
                  - columnheader "Stock" [ref=e194]
                  - columnheader "Price" [ref=e195]
                  - columnheader "Status" [ref=e196]
                  - columnheader "Actions" [ref=e197]
              - rowgroup [ref=e198]:
                - row [ref=e199]:
                  - cell [ref=e200]:
                    - checkbox "Select Stored Cabin" [ref=e201]
                  - 'cell "Stored Cabin ID: cabin · SKU: CABIN-1" [ref=e202]':
                    - generic [ref=e204]:
                      - link "Stored Cabin" [ref=e205] [cursor=pointer]:
                        - /url: /admin/products/cabin/edit
                      - generic [ref=e206]: "ID: cabin · SKU: CABIN-1"
                  - cell "Luggage" [ref=e207]
                  - cell "3 in Stock" [ref=e208]
                  - cell "₹5,000" [ref=e209]
                  - cell "Active" [ref=e210]
                  - cell [ref=e211]:
                    - group [ref=e212]:
                      - generic "Actions for Stored Cabin" [ref=e213] [cursor=pointer]: ⋮
                - row [ref=e214]:
                  - cell [ref=e215]:
                    - checkbox "Select Stored Bag" [ref=e216]
                  - 'cell "No image Stored Bag ID: bag · SKU: BAG-1" [ref=e217]':
                    - generic [ref=e218]:
                      - generic [ref=e219]: No image
                      - generic [ref=e220]:
                        - link "Stored Bag" [ref=e221] [cursor=pointer]:
                          - /url: /admin/products/bag/edit
                        - generic [ref=e222]: "ID: bag · SKU: BAG-1"
                  - cell "Bags" [ref=e223]
                  - cell "Out of Stock" [ref=e224]
                  - cell "₹2,000" [ref=e225]
                  - cell "Draft" [ref=e226]
                  - cell [ref=e227]:
                    - group [ref=e228]:
                      - generic "Actions for Stored Bag" [ref=e229] [cursor=pointer]: ⋮
            - generic [ref=e230]:
              - generic [ref=e231]: Showing 1–2 of 2 products
              - button "Previous" [disabled] [ref=e232]
              - generic [ref=e233]: 1 / 1
              - button "Next" [disabled] [ref=e234]
```

# Test source

```ts
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
  261 |             category: "Bags",
  262 |             price: 2000,
  263 |             stock: 0,
  264 |             status: "Draft",
  265 |           },
  266 |         ],
  267 |       },
  268 |     }),
  269 |   );
  270 |   await page.route("**/api/admin/categories", (route) =>
  271 |     route.fulfill({
  272 |       json: {
  273 |         success: true,
  274 |         categories: [
  275 |           {
  276 |             id: "luggage",
  277 |             name: "Luggage",
  278 |             slug: "luggage",
  279 |             parent: null,
  280 |             status: "Active",
  281 |             productCount: 1,
  282 |             image: "",
  283 |             description: "Stored description",
  284 |           },
  285 |         ],
  286 |       },
  287 |     }),
  288 |   );
  289 |   let saved: any;
  290 |   await page.route("**/api/admin/categories/luggage", async (route) => {
  291 |     saved = route.request().postDataJSON();
  292 |     await route.fulfill({ json: { success: true } });
  293 |   });
  294 |   await page.route("**/admin-fixture.js", (route) =>
  295 |     route.fulfill({ contentType: "application/javascript", body: js }),
  296 |   );
  297 |   await page.route("**/admin-fixture?*", (route) =>
  298 |     route.fulfill({
  299 |       contentType: "text/html",
  300 |       body: `<html><style>body{margin:0}*{box-sizing:border-box}</style><style>${css}</style><div id="root"></div><script src="/admin-fixture.js"></script></html>`,
  301 |     }),
  302 |   );
  303 |   await page.setViewportSize({ width: 1440, height: 1000 });
  304 |   await page.goto("http://localhost:3000/admin-fixture?products");
> 305 |   await page.getByRole("button", { name: "Catalog", exact: true }).click();
      |                                                                    ^ Error: locator.click: Test timeout of 30000ms exceeded.
  306 |   await expect(
  307 |     page.getByRole("link", { name: "Products List", exact: true }),
  308 |   ).toBeVisible();
  309 |   await expect(
  310 |     page.getByRole("link", { name: "Categories List", exact: true }),
  311 |   ).toBeVisible();
  312 |   await expect(
  313 |     page.getByRole("link", { name: "Stored Cabin", exact: true }),
  314 |   ).toBeVisible();
  315 |   await page.getByLabel("Maximum price", { exact: true }).fill("3000");
  316 |   await expect(
  317 |     page.getByRole("link", { name: "Stored Cabin", exact: true }),
  318 |   ).toHaveCount(0);
  319 |   await expect(
  320 |     page.getByRole("link", { name: "Stored Bag", exact: true }),
  321 |   ).toBeVisible();
  322 |   let imported:any;
  323 |   await page.route("**/api/admin/products",async route=>{if(route.request().method()==="POST"){imported=route.request().postDataJSON();await route.fulfill({json:{success:true,product:{id:"imported"}}});}else await route.fallback();});
  324 |   await page.getByRole("button",{name:"Import",exact:true}).click();
  325 |   await page.getByLabel("Product import file").setInputFiles({name:"catalog.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify([{name:"Uploaded catalog product",sku:"UP-1",category:"Luggage",price:3000,stock:4,status:"Active"}]))});
  326 |   expect(imported).toBeUndefined();
  327 |   await page.getByRole("button",{name:"Import hidden drafts"}).click();
  328 |   await expect.poll(()=>imported?.name).toBe("Uploaded catalog product");expect(imported.status).toBe("Draft");
  329 |   await page.getByRole("button",{name:"Close",exact:true}).click();
  330 |   await page.screenshot({
  331 |     path: "artifacts/admin-catalog-products.png",
  332 |     fullPage: true,
  333 |   });
  334 |   await page.route("**/api/admin/settings", (route) =>
  335 |     route.fulfill({
  336 |       json: {
  337 |         shipping: { standardShippingFee: 199, freeShippingThreshold: 10000 },
  338 |       },
  339 |     }),
  340 |   );
  341 |   await page.route("**/api/admin/product-taxonomy", (route) =>
  342 |     route.fulfill({
  343 |       json: {
  344 |         success: true,
  345 |         categories: [
  346 |           { id: "luggage", name: "Luggage", slug: "luggage", parent: null },
  347 |         ],
  348 |         collections: [],
  349 |       },
  350 |     }),
  351 |   );
  352 |   page.on("pageerror", (error) =>
  353 |     console.log("Editor browser error:", error.message),
  354 |   );
  355 |   await page.goto("http://localhost:3000/admin-fixture?product-edit");
  356 |   await expect(page.locator('[data-editor-section="1"]')).toBeVisible();
  357 |   await expect(page.locator('[data-editor-section="2"]')).toBeVisible();
  358 |   await expect(page.locator('[data-editor-section="3"]')).toBeVisible();
  359 |   await expect(page.locator('[data-editor-section="7"]')).toBeVisible();
  360 |   let savedProduct: any;
  361 |   await page.route("**/api/admin/products", async (route) => {
  362 |     if (route.request().method() === "POST") {
  363 |       savedProduct = route.request().postDataJSON();
  364 |       await route.fulfill({ json: { success: true, id: "saved-product" } });
  365 |     } else await route.fallback();
  366 |   });
  367 |   await page
  368 |     .getByLabel("Product name", { exact: true })
  369 |     .fill("Customer Travel Case");
  370 |   await page.getByLabel("SKU", { exact: true }).fill("CASE-REAL-1");
  371 |   await page.getByLabel("Price", { exact: true }).fill("4900");
  372 |   await page.getByLabel("Old price", { exact: true }).fill("5900");
  373 |   await page.getByLabel("Stock quantity", { exact: true }).fill("8");
  374 |   await page
  375 |     .getByLabel("Product description")
  376 |     .fill("Stored product description");
  377 |   await page
  378 |     .getByLabel("Short description", { exact: true })
  379 |     .fill("Carry-on case");
  380 |   await page.getByLabel("Scheduled", { exact: true }).check();
  381 |   await page.getByLabel("Publish date").fill("2027-01-01T12:00");
  382 |   await page.getByLabel("Add tag").fill("Travel");
  383 |   await page.getByLabel("Add tag").press("Enter");
  384 |   await page.screenshot({
  385 |     path: "artifacts/admin-product-editor.png",
  386 |     fullPage: false,
  387 |   });
  388 |   let uploaded = 0;
  389 |   await page.route("**/api/admin/upload", (route) =>
  390 |     route.fulfill({
  391 |       json: { success: true, url: `/media/review-image-${++uploaded}.png` },
  392 |     }),
  393 |   );
  394 |   await page.locator('input[type="file"]').setInputFiles([
  395 |     {
  396 |       name: "front.png",
  397 |       mimeType: "image/png",
  398 |       buffer: Buffer.from("image fixture"),
  399 |     },
  400 |     {
  401 |       name: "back.png",
  402 |       mimeType: "image/png",
  403 |       buffer: Buffer.from("image fixture"),
  404 |     },
  405 |   ]);
```