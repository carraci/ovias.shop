import { test, expect } from "@playwright/test";
import { build } from "esbuild";
import { readFile } from "node:fs/promises";
import path from "node:path";

test("reference composition renders all optional sections without modifying MongoDB", async ({
  page,
}) => {
  // Render the real component in an isolated browser fixture. This is not a storefront route.
  const compiled = await build({
    stdin: {
      contents: `
        import React from 'react';
        import { createRoot } from 'react-dom/client';
        import { AppRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime';
        import { PathnameContext } from 'next/dist/shared/lib/hooks-client-context.shared-runtime';
        import { ProductDetail } from './src/components/product-detail';
        import { Header } from './src/components/header';
        import { products } from './src/lib/catalog';
        const source = products.find(p => p.slug === 'signature-crossbody');
        // Explicit test-role assignments exercise every panel; no production records are changed.
        const product = { ...source, images: { ...source.images,
          editorial: ['/media/editorial-journey-model.jpg'],
          details: ['/media/detail-interior.jpg', '/media/detail-strap.jpg'],
          dimensions: [source.image], materials: ['/media/detail-strap.jpg'], craftsmanship: ['/media/detail-interior.jpg']
        }};
        const router = { push(){}, replace(){}, prefetch(){}, back(){}, forward(){}, refresh(){}, hmrRefresh(){} };
        createRoot(document.getElementById('root')).render(
          <AppRouterContext.Provider value={router}><PathnameContext.Provider value='/products/reference-fixture'>
            <Header /><main><ProductDetail product={product} relatedProducts={products.filter(p => p.department === 'bags').slice(0,8)} /></main>
          </PathnameContext.Provider></AppRouterContext.Provider>
        );
      `,
      resolveDir: process.cwd(),
      loader: "tsx",
    },
    bundle: true,
    write: false,
    outdir: "fixture-build",
    platform: "browser",
    format: "iife",
    jsx: "automatic",
    loader: { ".css": "local-css" },
    define: { "process.env.NODE_ENV": '"development"', "process.env": "{}" },
  });
  const javascript = compiled.outputFiles.find((file) =>
    file.path.endsWith(".js"),
  )!.text;
  const css = compiled.outputFiles.find((file) =>
    file.path.endsWith(".css"),
  )!.text;
  const globals = await readFile(
    path.join(process.cwd(), "src/app/globals.css"),
    "utf8",
  );
  await page.route("**/__product-reference-fixture", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${globals}\n${css}</style></head><body><div id="root"></div></body></html>`,
    }),
  );
  await page.setViewportSize({ width: 1536, height: 1024 });
  await page.goto("/__product-reference-fixture");
  await page.addScriptTag({ content: javascript });
  await expect(
    page.getByRole("heading", { level: 1, name: "Signature Crossbody" }),
  ).toBeVisible();
  await expect(
    page.getByRole("complementary", { name: "Editorial story" }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Size & weight" }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Materials", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Craftsmanship.", exact: true }),
  ).toBeVisible();
  const gallery = await page
    .getByRole("region", { name: "Signature Crossbody images" })
    .boundingBox();
  const info = await page
    .getByRole("region", { name: "Product information" })
    .boundingBox();
  const rail = await page
    .getByRole("complementary", { name: "Editorial story" })
    .boundingBox();
  expect(gallery!.x + gallery!.width).toBeLessThan(info!.x);
  expect(info!.x + info!.width).toBeLessThanOrEqual(rail!.x);
  expect(rail!.y).toBeLessThan(70);
  await page.screenshot({
    path: "artifacts/product-reference-1536.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "artifacts/product-reference-390.png",
    fullPage: true,
  });
});
