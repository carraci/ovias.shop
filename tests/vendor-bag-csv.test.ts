import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildVendorCsvCatalog, classifyVendorBag, csvPrice } from "../src/lib/vendor-bag-csv";
import { filterProducts } from "../src/lib/catalog-filter";
import { catalogFacets } from "../src/lib/catalog-facets";

test("vendor prices distinguish sale prices from MRP and currency punctuation", () => {
  assert.equal(csvPrice("Sale price₹. 1,999.00"), 199900);
  assert.equal(csvPrice("Sale price\nFrom ₹. 3,299.00"), 329900);
  assert.equal(csvPrice("₹999"), 99900);
  assert.equal(csvPrice("(50% OFF)"), undefined);
});
test("incorrect folder search results cannot label backpacks as crossbodies or duffels as luggage", () => {
  const backpack = classifyVendorBag("Skybags Peeps Grey 36L School Bag", { data: "BP" }, "crossboody bags");
  assert.deepEqual(backpack.categories, ["Backpacks"]);
  const duffel = classifyVendorBag("Skybags Hustle Cabin", { data: "DF" }, "duffle bags");
  assert.equal(duffel.department, "bags");
  assert.equal(duffel.category, "Duffel Bags");
  const luggage = classifyVendorBag("Skybags Nomad Small", { data: "HL" }, "travel bags");
  assert.equal(luggage.department, "luggage");
  assert.ok(classifyVendorBag("Men Classic Bag Pro Rain Cheater Suit", {}, "weekends bakgs").excluded);
});
test("the eighteen supplied feeds deduplicate, preserve evidence and filter with both old and new labels", () => {
  const inputs = JSON.parse(fs.readFileSync("data/bags-2026-10-12-sources.json", "utf8").replace(/^\uFEFF/, ""));
  const { products, report } = buildVendorCsvCatalog(inputs);
  assert.equal(report.files, 18);
  assert.equal(report.rows, 339);
  assert.equal(new Set(products.map(product => product.id)).size, products.length);
  assert.ok(report.duplicateRows > 0);
  assert.ok(report.corrections.length > 0);
  assert.equal(products.find(product => product.name === "Wildcraft Stride Backpack")?.variants[0].color, "Olive");
  assert.equal(products.find(product => product.name === "Wildcraft Wiki_1 Backpack_Blue")?.variants[0].color, "Blue");
  const crossbodies = filterProducts(products, { department: "bags", category: "crossbody-bags", limit: "1000" });
  assert.ok(crossbodies.total > 0);
  assert.ok(crossbodies.items.every(product => product.catalogCategories?.includes("Crossbody Bags") && !/school\s+bag|backpack/i.test(product.name)));
  assert.deepEqual(crossbodies.items.map(product => product.id), filterProducts(products, { department: "bags", category: "crossbodies", limit: "1000" }).items.map(product => product.id));
  for (const [modern, legacy] of [["duffel-bags", "duffle-bags"], ["tote-bags", "totes"]]) {
    const values = filterProducts(products, { department: "bags", category: modern, limit: "1000" });
    assert.ok(values.total > 0);
    assert.deepEqual(values.items.map(product => product.id), filterProducts(products, { department: "bags", category: legacy, limit: "1000" }).items.map(product => product.id));
  }
  const page = filterProducts(products, { department: "bags", category: "backpacks", collection: "Wildcraft", color: "Blue", sort: "price-asc", limit: "3", page: "2" });
  assert.ok(page.items.every(product => product.collection === "Wildcraft"));
  assert.ok(page.items.every((product, index, all) => index === 0 || all[index - 1].variants[0].price <= product.variants[0].price));
  const facets = catalogFacets(products, { department: "bags" }, { department: "bags" });
  assert.deepEqual(facets.categories.bags.slice(1).map(value => value.label), ["Backpacks", "Tote Bags", "Crossbody Bags", "Shoulder Bags", "Duffel Bags", "Briefcases", "Weekend Bags", "Travel Bags"]);
  assert.ok(products.every(product => product.variants.every(variant => variant.stock === 0)));
  for (const size of ["small", "medium", "large"]) {
    const category = filterProducts(products, { department: "luggage", category: `${size}-luggage`, limit: "1000" });
    const subcategory = filterProducts(products, { department: "luggage", subcategory: `${size}-luggage`, limit: "1000" });
    assert.ok(category.total > 0);
    assert.deepEqual(category.items.map(product => product.id), subcategory.items.map(product => product.id));
  }
  const legacy = { ...products[0], id: "legacy", catalogOrder: undefined };
  assert.equal(filterProducts([legacy, ...products], { limit: "1" }).items[0].id, products[0].id);
  assert.ok(!products.some(product => /rain\s*cheater|t-shirt|chalk bag/i.test(product.name)));
});
