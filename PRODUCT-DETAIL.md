# Dynamic product detail page

Every `/products/[slug]` uses `ProductDetail`, with product records loaded through the existing `storefrontCatalog` MongoDB reader. Existing database-outage/demo fallback behavior is unchanged. Names, prices, variant SKUs, photographs, specifications and related products come from that catalog. No database records were inserted or updated for this change.

## Images

Existing `variant.image`, `images.main`, `image`, `images.gallery`, and `gallery` fields remain supported. The selected variant image takes precedence. Galleries are deduplicated; `images.swatches` are not treated as product photographs. `images.thumbnails`, when present, correspond to the same positions in `images.gallery` and are used only for thumbnail buttons, never the enlarged image.

The existing `images` object now accepts optional arrays named `editorial`, `details`, `dimensions`, `materials`, and `craftsmanship`. These are backward-compatible type additions, not required fields or a database migration. Each contains URLs belonging to that product. Explicit roles take precedence. Older galleries with clearly descriptive filenames such as `detail-interior.jpg` or `editorial-journey.jpg` also work. Numbered or hashed filenames remain ordinary gallery photos; image position is never used to invent a role. Optional image sections stay hidden when there are no matching images. Materials and specifications can also render from their existing text data.

Responsive images use Next.js optimization; the main image uses quality 90. Enlargement loads the original source on demand, preserving available resolution. True 8K requires an 8K source upload; small images are not upscaled into invented detail.

## Purchase flow

Add to Bag calls the existing store provider. Buy Now awaits that same selected-SKU operation and navigates directly to `/checkout`, skipping the cart screen. Existing bag contents are preserved and included by the existing checkout. API errors keep the customer on the product page. Auth, wishlist and payment services are unchanged.

The reference layout includes vertical thumbnails, gallery arrows, colour swatches and colour-image selectors, quantity controls, an optional editorial rail, a compact detail strip, a specification/material/craftsmanship band, service links, and scrollable recommendations. Quantity is sent through the existing cart API in one request, capped by stock and the existing ten-item limit. Existing callers of `add(sku)` still default to one item.

Sizes come from `sizes` and optional `variant.size`. SKU-mapped sizes select the matching colour/size variant. Multiple product-level sizes without SKU mappings remain descriptive rather than pretending checkout can distinguish them. CM/IN conversion applies only to clearly labeled centimetre dimensions; weight and capacity remain unchanged. Wishlist and Personalise links open their existing destinations. No unsupported 3D or video controls are displayed.

## Verification

- `npm run typecheck`
- `node --import tsx --test tests/product-media.test.ts tests/product-presentation.test.ts`
- `npx playwright test tests/browser/product-detail.spec.ts tests/browser/product-reference.spec.ts`

The browser tests select products from the running catalog and mock account/cart requests, so they do not change live customer records or create orders. They require at least one product with a gallery and a second product with multiple variants. Screenshots are saved under `artifacts/product-detail-390.png` and `artifacts/product-detail-1440.png`.

The reference-composition test renders the actual component in an isolated browser fixture with explicit test-only media roles, verifying the complete layout without inserting a sample product into MongoDB. Its screenshots are `artifacts/product-reference-1536.png` and `artifacts/product-reference-390.png`; these are layout fixtures, not live product records.

The broader existing suite has six failures unrelated to these components: four commerce tests assume an older catalog (83 products and four pages) or fixed inventory fixtures, and two storefront tests depend on an injected loader that the existing catalog function ignores.
