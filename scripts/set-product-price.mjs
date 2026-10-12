import { MongoClient } from "mongodb";
import { algoliasearch } from "algoliasearch";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const rupees = process.argv.find((value) => value.startsWith("--rupees="))?.split("=")[1];
if (!rupees || !/^\d+(?:\.\d{1,2})?$/.test(rupees))
  throw new Error("Specify a price with --rupees=1.");
const price = Math.round(Number(rupees) * 100);
if (!Number.isSafeInteger(price) || price < 1)
  throw new Error("The price must be a positive amount in paise.");
const syncSearch = process.argv.includes("--sync-search");
const backupDirectory = path.resolve(".data", "price-backups", new Date().toISOString().replace(/[:.]/g, "-"));

async function main() {
  if (!process.env.MONGODB_URI) throw new Error("MongoDB is not configured.");
  if (syncSearch && !process.env.ALGOLIA_WRITE_KEY)
    throw new Error("Search indexing credentials are not configured.");
  const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10_000 });
  await mkdir(backupDirectory, { recursive: true });
  let search;
  let searchRecords = [];
  const indexName = process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME || "ovia_products";
  if (syncSearch) {
    search = algoliasearch(process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || "6YBAZKW987", process.env.ALGOLIA_WRITE_KEY);
    await search.browseObjects({
      indexName,
      browseParams: { attributesToRetrieve: ["objectID", "price"] },
      aggregator: (response) => { searchRecords.push(...response.hits); },
    });
    await writeFile(path.join(backupDirectory, "search-prices.json"), JSON.stringify({ indexName, records: searchRecords }, null, 2));
  }
  try {
    await client.connect();
    const collection = client.db(process.env.MONGODB_DB || "ovia").collection("products");
    const records = await collection.find({}, { projection: { _id: 0, id: 1, slug: 1, price: 1, currency: 1, updatedAt: 1, "variants.sku": 1, "variants.price": 1 } }).toArray();
    if (!records.length || records.some((record) => !Array.isArray(record.variants)))
      throw new Error("Inspect the product catalog before repricing it.");
    await writeFile(path.join(backupDirectory, "catalog-prices.json"), JSON.stringify({ database: process.env.MONGODB_DB || "ovia", records }, null, 2));
    const result = await collection.updateMany({}, [{ $set: {
      price,
      currency: "INR",
      variants: { $map: { input: "$variants", as: "variant", in: { $mergeObjects: ["$$variant", { price }] } } },
      updatedAt: new Date().toISOString(),
    } }]);
    const verified = await collection.find({}, { projection: { price: 1, "variants.price": 1 } }).toArray();
    if (verified.some((record) => record.price !== price || record.variants.some((variant) => variant.price !== price)))
      throw new Error("Catalog verification failed. Original prices are backed up.");
    console.log(JSON.stringify({ productsUpdated: result.matchedCount, variantsVerified: verified.reduce((sum, record) => sum + record.variants.length, 0), pricePaise: price, backupDirectory }));
    if (search) {
      await search.partialUpdateObjects({ indexName, objects: searchRecords.map((record) => ({ objectID: record.objectID, price })), createIfNotExists: false, waitForTasks: true });
      const verifiedSearch = [];
      await search.browseObjects({ indexName, browseParams: { attributesToRetrieve: ["objectID", "price"] }, aggregator: (response) => { verifiedSearch.push(...response.hits); } });
      if (verifiedSearch.some((record) => record.price !== price))
        throw new Error("Search price verification failed. Original values are backed up.");
      console.log(JSON.stringify({ searchRecordsUpdated: searchRecords.length, searchRecordsVerified: verifiedSearch.length, pricePaise: price }));
    }
  } finally { await client.close(); }
}
main().catch(() => {
  console.error("Product repricing did not fully complete. Check configuration; any original prices are saved in the backup directory.");
  process.exitCode = 1;
});
