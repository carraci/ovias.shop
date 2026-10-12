import assert from "node:assert/strict";
import nextEnv from "@next/env";
nextEnv.loadEnvConfig(process.cwd());
const { getAdminProducts, getAdminProductById } =
  await import("../src/server/admin-service");
const { mongo } = await import("../src/server/db");
const client = await mongo();
try {
  const rows = await getAdminProducts();
  const raw = await client
    .db(process.env.MONGODB_DB || "ovia")
    .collection("products")
    .findOne({ id: "csv-b0d9y2swd8" });
  assert.ok(raw);
  const row = rows.find((p) => p.id === raw.id);
  assert.ok(row);
  const edited = await getAdminProductById(raw.id);
  assert.ok(edited);
  assert.equal(row.price, raw.price / 100);
  assert.equal(edited.price, raw.price / 100);
  assert.equal(edited.variants[0].price, raw.variants[0].price / 100);
  assert.equal(edited.collection, raw.collection);
  const drafts = await client
    .db(process.env.MONGODB_DB || "ovia")
    .collection("products")
    .find({ status: "Draft" }, { projection: { id: 1 } })
    .toArray();
  for (const draft of drafts)
    assert.ok(
      rows.some((p) => p.id === draft.id),
      "Draft must be visible in admin",
    );
  console.log(
    JSON.stringify({
      products: rows.length,
      drafts: drafts.length,
      priceRupees: row.price,
      checks: "price units, edit data, collection and draft visibility passed",
    }),
  );
} finally {
  await client.close();
}
