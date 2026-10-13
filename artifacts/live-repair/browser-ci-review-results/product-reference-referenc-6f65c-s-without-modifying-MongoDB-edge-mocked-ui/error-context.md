# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: product-reference.spec.ts >> reference composition renders all optional sections without modifying MongoDB
- Location: tests\browser\product-reference.spec.ts:6:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('complementary', { name: 'Editorial story' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('complementary', { name: 'Editorial story' }) with timeout 5000ms
  - waiting for getByRole('complementary', { name: 'Editorial story' })

```

```yaml
- banner:
  - link "OVIA home":
    - /url: /
    - text: OVIA TRAVEL GOODS
  - navigation "Main navigation":
    - link "New":
      - /url: /new
    - link "Luggage":
      - /url: /luggage
    - link "Bags":
      - /url: /bags
    - link "Services":
      - /url: /services
    - link "Discover":
      - /url: /discover
  - button "Call Us"
  - button "Search":
    - img
  - link "My account":
    - /url: /account/sign-in
    - img
  - link "Wishlist":
    - /url: /account/wishlist
    - img
  - link "Shopping bag, 0 items":
    - /url: /cart
    - img
    - text: "0"
- main:
  - article:
    - navigation "Breadcrumb":
      - link "bags":
        - /url: /bags
      - text: • Collection •
      - link "The Signature Collection":
        - /url: /bags?collection=The%20Signature%20Collection
      - text: • Crossbody Bags
    - region "Signature Crossbody images":
      - button "Previous image":
        - img
      - button "Next image":
        - img
      - button "Enlarge product image":
        - img
      - region "Product views":
        - button "View 1 of Signature Crossbody" [pressed]
        - button "View 2 of Signature Crossbody"
        - button "View 3 of Signature Crossbody"
        - button "View 4 of Signature Crossbody"
    - region "Product information":
      - text: THE SIGNATURE COLLECTION
      - heading "Signature Crossbody" [level=1]
      - text: ₹1.00 Inclusive of all taxes
      - paragraph: A refined crossbody bag crafted for modern life. Clean lines, exceptional materials and thoughtful details, designed to move with you.
      - button "Read more ▾"
      - button "Size guide"
      - paragraph: "Colour: Ivory"
      - radiogroup "Product colours":
        - radio "Select colour Ivory" [checked]
        - radio "Select colour Matte Black"
        - radio "Select colour Cognac Tan"
        - radio "Select colour Olive Green"
      - button "Add to cart" [disabled]: Add to Cart
      - button "Add to wishlist":
        - img
      - status: Live product updates are unavailable. Refresh before ordering.
      - text: Limited stock Delivery availability
      - textbox "Delivery availability":
        - /placeholder: Enter PIN code
      - button "Check"
      - status
      - paragraph:
        - strong: "Style:"
        - text: OV-SIG-XBODY-IVR
    - region "Additional product images":
      - button "View More"
    - region "Product information":
      - tablist "Product information tabs":
        - tab "Features" [selected]
        - tab "Specifications"
        - tab "Product Advisory"
        - tab "May We Help?"
        - tab "Shipping & Returns"
        - tab "Reviews"
      - tabpanel "Features":
        - paragraph: A refined crossbody bag crafted for modern life. Clean lines, exceptional materials and thoughtful details, designed to move with you.
        - list:
          - listitem: Thoughtfully organised interior
          - listitem: Adjustable strap for every journey
          - listitem: Secure and refined closure
          - listitem: Signature OVIA details
          - listitem: Exceptional craftsmanship in every stitch
```

# Test source

```ts
  1   | import { test, expect } from "./helpers/mocked-ui";
  2   | import { build } from "esbuild";
  3   | import { readFile } from "node:fs/promises";
  4   | import path from "node:path";
  5   | 
  6   | test("reference composition renders all optional sections without modifying MongoDB", async ({
  7   |   page,
  8   | }) => {
  9   |   // Render the real component in an isolated browser fixture. This is not a storefront route.
  10  |   const compiled = await build({
  11  |     stdin: {
  12  |       contents: `
  13  |         import React from 'react';
  14  |         import { createRoot } from 'react-dom/client';
  15  |         import { AppRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime';
  16  |         import { PathnameContext } from 'next/dist/shared/lib/hooks-client-context.shared-runtime';
  17  |         import { ProductDetail } from './src/components/product-detail';
  18  |         import { Header } from './src/components/header';
  19  |         import { products } from './src/lib/catalog';
  20  |         const source = products.find(p => p.slug === 'signature-crossbody');
  21  |         // Explicit test-role assignments exercise every panel; no production records are changed.
  22  |         const product = { ...source, images: { ...source.images,
  23  |           editorial: ['/media/editorial-journey-model.jpg'],
  24  |           details: ['/media/detail-interior.jpg', '/media/detail-strap.jpg'],
  25  |           dimensions: [source.image], materials: ['/media/detail-strap.jpg'], craftsmanship: ['/media/detail-interior.jpg']
  26  |         }};
  27  |         const router = { push(){}, replace(){}, prefetch(){}, back(){}, forward(){}, refresh(){}, hmrRefresh(){} };
  28  |         createRoot(document.getElementById('root')).render(
  29  |           <AppRouterContext.Provider value={router}><PathnameContext.Provider value='/products/reference-fixture'>
  30  |             <Header /><main><ProductDetail product={product} relatedProducts={products.filter(p => p.department === 'bags').slice(0,8)} /></main>
  31  |           </PathnameContext.Provider></AppRouterContext.Provider>
  32  |         );
  33  |       `,
  34  |       resolveDir: process.cwd(),
  35  |       loader: "tsx",
  36  |     },
  37  |     bundle: true,
  38  |     write: false,
  39  |     outdir: "fixture-build",
  40  |     platform: "browser",
  41  |     format: "iife",
  42  |     jsx: "automatic",
  43  |     loader: { ".css": "local-css" },
  44  |     define: { "process.env.NODE_ENV": '"development"', "process.env": "{}" },
  45  |   });
  46  |   const javascript = compiled.outputFiles.find((file) =>
  47  |     file.path.endsWith(".js"),
  48  |   )!.text;
  49  |   const css = compiled.outputFiles.find((file) =>
  50  |     file.path.endsWith(".css"),
  51  |   )!.text;
  52  |   const globals = await readFile(
  53  |     path.join(process.cwd(), "src/app/globals.css"),
  54  |     "utf8",
  55  |   );
  56  |   await page.route("**/__product-reference-fixture", (route) =>
  57  |     route.fulfill({
  58  |       contentType: "text/html",
  59  |       body: `<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${globals}\n${css}</style></head><body><div id="root"></div></body></html>`,
  60  |     }),
  61  |   );
  62  |   await page.setViewportSize({ width: 1536, height: 1024 });
  63  |   await page.goto("/__product-reference-fixture");
  64  |   await page.addScriptTag({ content: javascript });
  65  |   await expect(
  66  |     page.getByRole("heading", { level: 1, name: "Signature Crossbody" }),
  67  |   ).toBeVisible();
  68  |   await expect(
  69  |     page.getByRole("complementary", { name: "Editorial story" }),
> 70  |   ).toBeVisible();
      |     ^ Error: expect(locator).toBeVisible() failed
  71  |   await expect(
  72  |     page.getByRole("region", { name: "Size & weight" }),
  73  |   ).toBeVisible();
  74  |   await expect(
  75  |     page.getByRole("region", { name: "Materials", exact: true }),
  76  |   ).toBeVisible();
  77  |   await expect(
  78  |     page.getByRole("heading", { name: "Craftsmanship.", exact: true }),
  79  |   ).toBeVisible();
  80  |   const gallery = await page
  81  |     .getByRole("region", { name: "Signature Crossbody images" })
  82  |     .boundingBox();
  83  |   const info = await page
  84  |     .getByRole("region", { name: "Product information" })
  85  |     .boundingBox();
  86  |   const rail = await page
  87  |     .getByRole("complementary", { name: "Editorial story" })
  88  |     .boundingBox();
  89  |   expect(gallery!.x + gallery!.width).toBeLessThan(info!.x);
  90  |   expect(info!.x + info!.width).toBeLessThanOrEqual(rail!.x);
  91  |   expect(rail!.y).toBeLessThan(70);
  92  |   await page.screenshot({
  93  |     path: "artifacts/product-reference-1536.png",
  94  |     fullPage: true,
  95  |   });
  96  |   await page.setViewportSize({ width: 390, height: 844 });
  97  |   expect(
  98  |     await page.evaluate(
  99  |       () => document.documentElement.scrollWidth <= innerWidth,
  100 |     ),
  101 |   ).toBe(true);
  102 |   await page.screenshot({
  103 |     path: "artifacts/product-reference-390.png",
  104 |     fullPage: true,
  105 |   });
  106 | });
  107 | 
```