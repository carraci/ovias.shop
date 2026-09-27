import { test } from "node:test";
import assert from "node:assert/strict";
import { products } from "../src/lib/catalog";
import {
  displayMeasurement,
  presentationSpecifications,
  detailCaption,
} from "../src/lib/product-presentation";

test("inches conversion preserves dimension order and leaves weight/capacity unchanged", () => {
  assert.equal(
    displayMeasurement("55 × 40 × 23 cm", "in"),
    "21.7 × 15.7 × 9.1 in",
  );
  assert.equal(displayMeasurement("55 × 40 × 23 cm", "cm"), "55 × 40 × 23 cm");
  assert.equal(displayMeasurement("4.3 kg", "in"), "4.3 kg");
  assert.equal(displayMeasurement("35 L", "in"), "35 L");
  assert.equal(displayMeasurement("See guide", "in"), "See guide");
});

test("material specifications are separated from measurements without invented fields", () => {
  const product = {
    ...products[0],
    dimensions: "22 × 14 × 8 cm",
    weight: "0.6 kg",
    capacity: "2.5 L",
    specifications: { Exterior: "Leather", Lining: "Fabric" },
  };
  const result = presentationSpecifications(product);
  assert.deepEqual(result.composition, [
    ["Exterior", "Leather"],
    ["Lining", "Fabric"],
  ]);
  assert.deepEqual(
    result.measurements.map(([label]) => label),
    ["Dimensions", "Capacity", "Weight"],
  );
});

test("detail labels use descriptive metadata without assigning unrelated features by position", () => {
  const product = {
    ...products[0],
    specifications: { Strap: "Woven textile" },
    features: ["An unrelated feature"],
  };
  assert.deepEqual(detailCaption("/detail-strap.jpg", product, 0), {
    title: "Strap",
    description: "Woven textile",
  });
  assert.deepEqual(detailCaption("/opaque-file.webp", product, 0), {
    title: "Detail 01",
    description: "",
  });
});
