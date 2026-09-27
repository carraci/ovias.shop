import { test } from "node:test";
import assert from "node:assert/strict";
import { products, filterProducts } from "../src/lib/catalog";
import { quote, total, addressSchema } from "../src/server/commerce";
import { checkPassword, passwordHash } from "../src/server/auth";
test("catalog has distinct products and unique variants", () => {
  assert.equal(products.length, 83);
  assert.equal(new Set(products.map((p) => p.slug)).size, 83);
  for (const d of ["luggage", "bags", "accessories"])
    assert.equal(products.filter((p) => p.department === d).length, d === "luggage" ? 26 : d === "bags" ? 32 : 25);
  const skus = products.flatMap((p) => p.variants.map((v) => v.sku));
  assert.equal(new Set(skus).size, skus.length);
});
test("category and material filters intersect with stable price sorting", () => {
  const result = filterProducts(products, {
    department: "luggage",
    category: "cabin",
    material: "Aluminium",
    sort: "price-desc",
  });
  assert.ok(result.items.length);
  assert.ok(
    result.items.every(
      (p) =>
        p.department === "luggage" &&
        p.category === "Cabin" &&
        p.material === "Aluminium",
    ),
  );
  assert.ok(
    result.items.every(
      (p, i, a) => i === 0 || a[i - 1].variants[0].price >= p.variants[0].price,
    ),
  );
});
test("search is case insensitive; pagination clamps", () => {
  assert.ok(filterProducts(products, { q: "MERIDIAN" }).total > 0);
  assert.equal(filterProducts(products, { q: "no-such-object" }).total, 0);
  assert.equal(filterProducts(products, { page: "-3" }).page, 1);
  assert.equal(filterProducts(products, { page: "999" }).page, 4);
});
test("quote uses catalog price and rejects invalid quantities/SKUs", () => {
  const sku = products[0].variants[0].sku;
  const lines = quote([{ sku, quantity: 2 }], products);
  assert.equal(total(lines), products[0].variants[0].price * 2);
  for (const quantity of [-1, 0, 1.5, 11])
    assert.throws(() => quote([{ sku, quantity }], products));
  assert.throws(() => quote([{ sku: "fake", quantity: 1 }], products));
  assert.throws(() =>
    quote([{ sku: products[9].variants[0].sku, quantity: 1 }], products),
  );
});
test("address validation rejects bad postal code", () => {
  const valid = {
    name: "Test Person",
    email: "person@example.com",
    line1: "10 Test Street",
    city: "Mumbai",
    region: "Maharashtra",
    postalCode: "400001",
    country: "IN",
  };
  assert.ok(addressSchema.safeParse(valid).success);
  assert.equal(
    addressSchema.safeParse({ ...valid, postalCode: "00000" }).success,
    false,
  );
});
test("password hashing salts values and verifies without plain-text storage", () => {
  const password = "A-test-password-123";
  const first = passwordHash(password),
    second = passwordHash(password);
  assert.notEqual(first, second);
  assert.ok(checkPassword(password, first));
  assert.equal(checkPassword("wrong-password", first), false);
});

