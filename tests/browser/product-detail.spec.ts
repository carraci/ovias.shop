import { test, expect } from "@playwright/test";
import type { Product } from "../../src/lib/catalog";
import { productMedia } from "../../src/lib/product-media";

let product: Product;
let other: Product;
test.beforeAll(async ({ request }) => {
  async function loadPage(page: number) {
    const response = await request.get(`/api/products?limit=100&page=${page}`);
    expect(response.ok()).toBe(true);
    return (await response.json()) as { items: Product[]; pages: number };
  }
  const first = await loadPage(1);
  const remaining = await Promise.all(
    Array.from({ length: first.pages - 1 }, (_, index) => loadPage(index + 2)),
  );
  const all = [...first.items, ...remaining.flatMap((page) => page.items)];
  // Legacy fallback data can contain duplicate slugs. Use unambiguous records for this UI test.
  const items = all.filter(
    (product) =>
      all.filter((candidate) => candidate.slug === product.slug).length === 1,
  );
  product = items.find(
    (p) =>
      p.imageKind === "photograph" &&
      productMedia(p, p.variants[0]).gallery.length > 1 &&
      p.variants.some((v) => v.stock > 0),
  )!;
  other = items.find((p) => p.id !== product?.id && p.variants.length > 1)!;
  expect(product).toBeTruthy();
  expect(other).toBeTruthy();
});

test.beforeEach(async ({ page }) => {
  // No live customer, cart or order records are changed by these tests.
  await page.route("**/api/v1/account", (route) =>
    route.fulfill({ json: { data: { user: null } } }),
  );
  await page.route("**/api/v1/cart", (route) =>
    route.fulfill({ json: { data: { lines: [], total: 0, version: 0 } } }),
  );
});

test("database gallery, original-resolution enlargement and conditional sections", async ({
  page,
}) => {
  const media = productMedia(product, product.variants[0]);
  await page.goto(`/products/${product.slug}?variant=invalid`, {
    waitUntil: "domcontentloaded",
  });
  await expect(
    page.getByRole("heading", { level: 1, name: product.name, exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: product.variants[0].color, exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("complementary", { name: "Editorial story" }),
  ).toHaveCount(media.editorial.length ? 1 : 0);
  await expect(
    page.getByRole("heading", { name: "Craftsmanship.", exact: true }),
  ).toHaveCount(media.craftsmanship.length ? 1 : 0);
  await page
    .getByRole("button", { name: `View 2 of ${product.name}`, exact: true })
    .click();
  await page.getByRole("button", { name: "Enlarge product image" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.locator("img")).toHaveJSProperty(
    "src",
    new URL(media.gallery[1].src, page.url()).href,
  );
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await page.goto(`/products/${other.slug}`, { waitUntil: "domcontentloaded" });
  await page
    .getByRole("button", { name: other.variants[1].color, exact: true })
    .click();
  await expect(page).toHaveURL(
    new RegExp(encodeURIComponent(other.variants[1].sku)),
  );
  await expect(
    page.getByRole("button", { name: other.variants[1].color, exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("Add to Bag and Buy Now reuse cart API and navigate only after success", async ({
  page,
}) => {
  const variant = other.variants.find((v) => v.stock > 0)!;
  const requests: unknown[] = [];
  let fail = true;
  await page.route("**/api/v1/cart/items", async (route) => {
    requests.push(route.request().postDataJSON());
    if (fail)
      return route.fulfill({
        status: 409,
        json: { error: { message: "Selected variation is unavailable" } },
      });
    await route.fulfill({
      json: {
        data: {
          lines: [
            {
              sku: variant.sku,
              name: other.name,
              color: variant.color,
              price: variant.price,
              quantity: 1,
            },
          ],
          total: variant.price,
          version: 1,
        },
      },
    });
  });
  await page.goto(`/products/${other.slug}?variant=${variant.sku}`, {
    waitUntil: "domcontentloaded",
  });
  const info = page.getByRole("region", { name: "Product information" });
  await info.getByRole("button", { name: "Buy now", exact: true }).click();
  await expect(info.getByRole("alert")).toContainText(
    "Selected variation is unavailable",
  );
  await expect(page).toHaveURL(new RegExp(`products/${other.slug}`));
  fail = false;
  await info.getByRole("button", { name: "Add to bag", exact: true }).click();
  await expect(page.getByRole("link", { name: "View your bag" })).toBeVisible();
  await info.getByRole("button", { name: "Buy now", exact: true }).click();
  await expect(page).toHaveURL(/\/checkout$/);
  expect(requests).toEqual(Array(3).fill({ sku: variant.sku, quantity: 1 }));
  await expect(
    page.getByRole("heading", { name: /^(Your selection|Order Summary)$/ }),
  ).toBeVisible();
});

test("responsive layout and product isolation", async ({ page }) => {
  await page.goto(`/products/${product.slug}`, {
    waitUntil: "domcontentloaded",
  });
  await expect(
    page.getByRole("heading", { level: 1, name: product.name, exact: true }),
  ).toBeVisible();
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 960 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (width === 390 || width === 1440) {
      const mainImage = page.getByAltText(
        `${product.name} in ${product.variants[0].color}, view 1`,
        { exact: true },
      );
      await expect(mainImage).toHaveJSProperty("complete", true, {
        timeout: 15000,
      });
      await mainImage.evaluate((image: HTMLImageElement) => image.decode());
      await page.screenshot({
        path: `artifacts/product-detail-${width}.png`,
        fullPage: true,
      });
    }
  }
  await page.goto(`/products/${other.slug}`, { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { level: 1, name: other.name, exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 1, name: product.name, exact: true }),
  ).toHaveCount(0);
});

test("unavailable product image shows an honest placeholder", async ({
  page,
}) => {
  await page.route("**/_next/image?**", (route) =>
    route.fulfill({ status: 404, body: "" }),
  );
  await page.goto(`/products/${product.slug}`, {
    waitUntil: "domcontentloaded",
  });
  await expect(
    page.getByRole("img", {
      name: `${product.name} in ${product.variants[0].color}, view 1 — image unavailable`,
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("region", { name: "Product information" })
      .getByRole("button", { name: "Buy now", exact: true }),
  ).toBeEnabled();
});

test("quantity, image colour choices, sizes and measurement units are functional", async ({
  page,
}) => {
  let submitted: unknown;
  await page.route("**/api/v1/cart/items", async (route) => {
    submitted = route.request().postDataJSON();
    await route.fulfill({
      json: { data: { lines: [], total: 0, version: 1 } },
    });
  });
  await page.goto(`/products/${product.slug}`, {
    waitUntil: "domcontentloaded",
  });
  const info = page.getByRole("region", { name: "Product information" });
  await info.getByRole("button", { name: "Increase quantity" }).click();
  await expect(info.getByLabel("Selected quantity")).toHaveText("2");
  await info.getByRole("button", { name: "Add to bag", exact: true }).click();
  expect(submitted).toEqual({ sku: product.variants[0].sku, quantity: 2 });
  if (product.sizes?.length === 1)
    await expect(
      info.getByRole("button", { name: product.sizes[0], exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
  const imageVariant = product.variants.find(
    (v) => v.image && v.sku !== product.variants[0].sku,
  );
  if (imageVariant) {
    await info
      .getByRole("button", {
        name: `Select ${imageVariant.color} product image`,
        exact: true,
      })
      .click();
    await expect(
      info.getByRole("button", { name: imageVariant.color, exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
  }
  const inches = page.getByRole("button", { name: "IN", exact: true });
  if (await inches.count()) {
    await inches.click();
    await expect(inches).toHaveAttribute("aria-pressed", "true");
    await expect(
      page.getByRole("region", { name: "Size & weight" }),
    ).toContainText("in");
  }
  await expect(
    info.getByRole("link", { name: "Personalise", exact: true }),
  ).toHaveAttribute("href", "/personalise");
  await expect(
    info.getByRole("link", { name: "Open your wishlist", exact: true }),
  ).toHaveAttribute("href", "/account/wishlist");
});
