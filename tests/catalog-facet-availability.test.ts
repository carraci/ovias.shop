import { test } from "node:test";
import assert from "node:assert/strict";
import { products, filterProducts, type Product } from "../src/lib/catalog";
import { catalogFacets } from "../src/lib/catalog-facets";

const product = (changes: Partial<Product>): Product => ({ ...products[0], tags: [], catalogCategories: [], ...changes });

test("collection category options never lead to an empty filtered result", () => {
  const catalog = [
    product({ id: "scoped-tote", department: "bags", name: "Daily tote", category: "Totes", catalogCategories: ["Totes"], tags: ["new-arrivals"] }),
    product({ id: "outside-backpack", department: "bags", name: "Travel backpack", category: "Backpacks", catalogCategories: ["Backpacks"] }),
    product({ id: "other-department", department: "luggage", category: "Cabin", catalogCategories: ["Cabin"], tags: ["new-arrivals"] }),
  ];
  const base = { department: "bags", tag: "new-arrivals" };
  const options = catalogFacets(catalog, base, base).categories.bags;
  assert.deepEqual(options.map(option => option.value), ["", "tote-bags"]);
  for (const option of options) assert.ok(filterProducts(catalog, { ...base, category: option.value }).total > 0);
});

test("unscoped categories retain the requested order and include only present catalog categories", () => {
  const catalog = [
    product({ department: "bags", name: "Duffel", category: "Duffle Bags", catalogCategories: ["Duffle Bags"] }),
    product({ department: "bags", name: "Backpack", category: "Backpacks", catalogCategories: ["Backpacks"] }),
  ];
  const base = { department: "bags" };
  assert.deepEqual(catalogFacets(catalog, base, base).categories.bags.map(option => option.label), ["All Bags", "Backpacks", "Duffel Bags"]);
});

test("luggage size options use the same classification as the product filter", () => {
  const catalog = [product({ department: "luggage", name: "Small suitcase", category: "Cabin", catalogCategories: ["Cabin"], dimensions: "55 x 38 x 23 cm", sizes: [] })];
  const base = { department: "luggage" };
  const options = catalogFacets(catalog, base, base).categories.luggage;
  assert.deepEqual(options.map(option => option.value), ["", "cabin-luggage", "small-luggage"]);
  for (const option of options) assert.equal(filterProducts(catalog, { ...base, category: option.value }).total, 1);
});
