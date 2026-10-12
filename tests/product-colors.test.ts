import { test } from "node:test";
import assert from "node:assert/strict";
import { products, type Product } from "../src/lib/catalog";
import { productColorOptions } from "../src/lib/product-colors";

function model(id: string, name: string, color: string, overrides: Partial<Product> = {}): Product {
  return {
    ...products[0], id, slug: id, name, collection: "Verified model series",
    department: "bags", material: "Polyester", image: `/media/${id}.webp`,
    variants: [{ sku: `${id}-SKU`, color, hex: "#111111", price: 499900, stock: 3 }],
    ...overrides,
  };
}

test("colour options link to the exact verified record and SKU for the same model", () => {
  const red = model("enigma-red", "Enigma Cabin Duffel Bag Red", "Red");
  const blue = model("enigma-blue", "Enigma Cabin Duffel Bag Blue", "Blue");
  const records = [red, blue, model("other", "Different Duffel Blue", "Blue")];
  const options = productColorOptions(red, records);
  assert.deepEqual(options.map(option => option.color), ["Red", "Blue"]);
  for (const option of options) {
    assert.ok(records.some(record => record.slug === option.slug && record.variants.some(variant => variant.sku === option.sku && variant.color === option.color)));
  }
});

test("colour matching cannot combine other collections, materials or departments", () => {
  const current = model("current", "Enigma Cabin Duffel Red", "Red");
  const records = [current,
    model("other-brand", "Enigma Cabin Duffel Blue", "Blue", { collection: "Different supplier" }),
    model("other-material", "Enigma Cabin Duffel Black", "Black", { material: "Leather" }),
    model("other-department", "Enigma Cabin Duffel Grey", "Grey", { department: "luggage" }),
  ];
  assert.deepEqual(productColorOptions(current, records).map(option => option.sku), ["current-SKU"]);
});

test("duplicate colours prefer the selected record and unknown colours stay hidden", () => {
  const current = model("current", "Enigma Cabin Duffel Red", "Red");
  const duplicate = model("duplicate", "Enigma Cabin Duffel Red", "red");
  const unknown = model("unknown", "Enigma Cabin Duffel", "As pictured");
  assert.deepEqual(productColorOptions(current, [duplicate, unknown, current]).map(option => option.sku), ["current-SKU"]);
});
