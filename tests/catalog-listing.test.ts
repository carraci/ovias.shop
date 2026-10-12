import test from "node:test";
import assert from "node:assert/strict";
import { products, type Product } from "../src/lib/catalog";
import { filterProducts } from "../src/lib/catalog-filter";
import { catalogFacets } from "../src/lib/catalog-facets";
import { listingProduct, prepareListing } from "../src/lib/catalog-listing";

test("compact listing data preserves search, filters, facets, sorting and pagination", () => {
  const compact = products.map(listingProduct);
  for (const department of ["bags", "luggage", "accessories"]) {
    const base = { department };
    for (const selection of [{}, { material: "Leather" }, { color: "Black" }, { q: "travel" }, { tag: "best-sellers" }, { sort: "price-asc", page: "2", limit: "12" }]) {
      const filters = { ...base, ...selection };
      const original = filterProducts(products, filters);
      const next = filterProducts(compact, filters);
      assert.deepEqual(next.items.map(p => p.id), original.items.map(p => p.id));
      assert.deepEqual([next.total, next.page, next.pages], [original.total, original.page, original.pages]);
      assert.deepEqual(catalogFacets(compact, base, filters), catalogFacets(products, base, filters));
    }
  }
});

test("listing retains an approved fallback photo and verified variant prices", () => {
  const product: Product = {
    ...products[0], image: "/media/example-illustration.png",
    images: { main: "/media/example-illustration.png", gallery: ["/media/imported/verified-photo.webp"] },
    gallery: ["/media/uploads/another-photo.webp"],
  };
  const card = listingProduct(product);
  assert.equal(card.image, "/media/imported/verified-photo.webp");
  assert.deepEqual(card.variants, product.variants);
  assert.equal(card.gallery, undefined);
  assert.equal(card.images, undefined);
});

test("server prepared pages retain facets and query selection without transferring the full collection", () => {
  for (const department of ["bags", "luggage", "accessories"]) {
    for (const query of [{}, { sort: "price-asc", page: "2" }, { color: "Black" }, { material: "Leather" }, { q: "travel" }]) {
      const base = { department, category: undefined };
      const result = prepareListing(products, base, query);
      const filters = { department, ...query, limit: "12" };
      const expected = filterProducts(products, filters);
      assert.deepEqual(result.products.map(p => p.id), expected.items.map(p => p.id));
      assert.deepEqual(result.prepared.pagination, { total: expected.total, page: expected.page, pages: expected.pages });
      assert.deepEqual(result.prepared.facets, catalogFacets(products.filter(p => p.department === department), base, filters));
      assert.ok(result.products.length <= 12);
    }
  }
});
