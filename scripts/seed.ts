import { products } from "../src/lib/catalog";
import { mongo, setupDatabase } from "../src/server/db";
async function main() {
  await setupDatabase();
  const client = await mongo();
  const db = client.db(process.env.MONGODB_DB || "ovia");
  await db.collection("products").deleteMany({ department: "bags" });
  for (const p of products) {
    await db
      .collection("products")
      .updateOne({ id: p.id }, { $set: p }, { upsert: true });
    for (const v of p.variants)
      await db
        .collection("inventory")
        .updateOne(
          { id: v.sku },
          { $set: { id: v.sku, available: v.stock } },
          { upsert: true },
        );
  }
  console.log(
    `Validated and seeded ${products.length} products; existing records preserved.`,
  );
  await client.close();
}
main().catch(() => {
  console.error("Seed failed. Check MongoDB connection and permissions.");
  process.exitCode = 1;
});
