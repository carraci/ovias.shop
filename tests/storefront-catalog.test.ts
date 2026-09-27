import { test } from "node:test";
import assert from "node:assert/strict";
import { MongoNetworkError, MongoServerSelectionError } from "mongodb";
import { products } from "../src/lib/catalog";
import { storefrontCatalog } from "../src/server/storefront-catalog";

test("storefront preserves database results, including an empty catalog", async () => {
  const live = products.slice(0, 2);
  assert.equal(await storefrontCatalog(async () => live), live);
  assert.deepEqual(await storefrontCatalog(async () => []), []);
});

test("storefront remains browsable during database connectivity failures", async () => {
  for (const error of [new MongoNetworkError("offline"), new MongoServerSelectionError("unavailable", {} as never)]) {
    assert.equal(await storefrontCatalog(async () => { throw error; }), products);
  }
});

test("storefront does not conceal unrelated programming errors", async () => {
  const error = new TypeError("invalid catalog implementation");
  await assert.rejects(storefrontCatalog(async () => { throw error; }), (actual) => actual === error);
});
