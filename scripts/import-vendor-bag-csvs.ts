import fs from "node:fs/promises";
import path from "node:path";
import { MongoClient } from "mongodb";
import sharp from "sharp";
import { buildVendorCsvCatalog, type VendorCsvInput } from "../src/lib/vendor-bag-csv";

async function main() {
const inputPath = path.resolve("data/bags-2026-10-12-sources.json");
const reportPath = path.resolve("data/bags-2026-10-12-import-report.json");
const inputs: VendorCsvInput[] = JSON.parse((await fs.readFile(inputPath, "utf8")).replace(/^\uFEFF/, ""));
const plan = buildVendorCsvCatalog(inputs);
await fs.writeFile("data/bags-2026-10-12-plan.json", JSON.stringify(plan, null, 2));
await fs.writeFile(reportPath, JSON.stringify(plan.report, null, 2));
console.log(JSON.stringify({ mode: process.argv.includes("--apply") ? "apply" : "dry-run", ...plan.report, excluded: plan.report.excluded.length, corrections: plan.report.corrections.length, priceConflicts: plan.report.priceConflicts.length }));

if (process.argv.includes("--apply")) {
  if (!process.env.MONGODB_URI) throw new Error("MongoDB is not configured; catalogue preserved.");
  const root = path.resolve("public/media/imported");
  await fs.mkdir(root, { recursive: true });
  const imageFailures: { name: string; host: string; error: string }[] = [];
  let cursor = 0;
  let completed = 0;
  const ready: typeof plan.products = [];
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (cursor < plan.products.length) {
      const product = plan.products[cursor++];
      const photos: string[] = [];
      for (const [index, url] of product.imageSources.slice(0, 3).entries()) {
        const destination = path.join(root, `vendor-bags-${product.vendorImport.key}-${index + 1}.webp`);
        if (!destination.startsWith(root + path.sep)) throw new Error("Image path escaped the import folder");
        try {
          try { const metadata = await sharp(destination).metadata(); if (metadata.width && metadata.width >= 100) { photos.push(`/media/imported/${path.basename(destination)}`); continue; } } catch {}
          let bytes: Buffer | undefined;
          for (let attempt = 0; attempt < 2; attempt++) {
            try {
              const response = await fetch(url, { signal: AbortSignal.timeout(25000), headers: { "User-Agent": "Mozilla/5.0 OVIA-Catalog-Importer", Accept: "image/webp,image/avif,image/*" } });
              if (!response.ok || !response.headers.get("content-type")?.startsWith("image/")) throw new Error(`Image HTTP ${response.status}`);
              if (Number(response.headers.get("content-length")) > 12_000_000) throw new Error("Image exceeds 12 MB");
              bytes = Buffer.from(await response.arrayBuffer());
              if (bytes.length > 12_000_000) throw new Error("Image exceeds 12 MB");
              break;
            } catch (error) { if (attempt === 1) throw error; }
          }
          if (!bytes) throw new Error("Empty image response");
          const metadata = await sharp(bytes).metadata();
          if (!metadata.width || !metadata.height || metadata.width < 100 || metadata.height < 100) throw new Error("Placeholder or invalid product photograph");
          await sharp(bytes).rotate().resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toFile(destination);
          photos.push(`/media/imported/${path.basename(destination)}`);
        } catch (error) { imageFailures.push({ name: product.name, host: new URL(url).hostname, error: (error as Error).message }); }
      }
      if (photos.length) {
        product.image = photos[0]; product.gallery = photos; product.variants[0].image = photos[0];
        ready.push(product);
      }
      completed++;
      if (completed % 20 === 0 || completed === plan.products.length) console.log(JSON.stringify({ photosChecked: completed, total: plan.products.length, ready: ready.length, imageFailures: imageFailures.length }));
    }
  }));
  const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000, ignoreUndefined: true });
  let created = 0;
  let updated = 0;
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || "ovia");
    const keys = ready.map(product => product.id);
    const previous = await db.collection("products").find({ id: { $in: keys } }, { projection: { _id: 0 } }).toArray();
    const previousById = new Map(previous.map(product => [product.id, product]));
    const balances = await db.collection("inventory").find({ id: { $in: ready.flatMap(product => product.variants.map(variant => variant.sku)) } }).toArray();
    const available = new Map(balances.map(balance => [balance.id, balance.available]));
    const backup = path.resolve("data/import-backups", `vendor-bags-before-${Date.now()}.json`);
    await fs.mkdir(path.dirname(backup), { recursive: true });
    await fs.writeFile(backup, JSON.stringify({ createdAt: new Date().toISOString(), products: previous, inventory: balances, plannedIds: keys }, null, 2));
    const now = new Date().toISOString();
    for (const product of plan.products.filter(product => ready.some(candidate => candidate.id === product.id))) {
      const existing = previousById.get(product.id);
      const { imageSources, ...document } = product;
      document.variants = document.variants.map(variant => ({ ...variant, stock: available.get(variant.sku) ?? existing?.variants?.find((value: { sku: string }) => value.sku === variant.sku)?.stock ?? 0 }));
      const stock = document.variants.reduce((sum, variant) => sum + variant.stock, 0);
      const status = existing?.status === "Archived" || existing?.status === "Draft" ? existing.status : stock > 0 ? "Active" : "Out of Stock";
      await db.collection("products").updateOne({ id: document.id }, {
        $set: { ...document, oldPrice: document.oldPrice || 0, stock, status, storefrontPublished: status === "Active" || status === "Out of Stock", createdAt: existing?.createdAt || now, updatedAt: now },
      }, { upsert: true });
      for (const variant of document.variants) await db.collection("inventory").updateOne({ id: variant.sku }, { $setOnInsert: { id: variant.sku, productId: document.id, available: variant.stock } }, { upsert: true });
      if (existing) updated++; else created++;
    }
    const report = { ...plan.report, created, updated, imageFailures, skippedMissingImages: plan.products.filter(product => !ready.some(candidate => candidate.id === product.id)).map(product => product.name), backup: path.relative(process.cwd(), backup) };
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ created, updated, publishedWithPhotos: ready.length, skippedMissingImages: report.skippedMissingImages.length, imageFailures: imageFailures.length, report: "data/bags-2026-10-12-import-report.json" }));
  } finally { await client.close(); }
}
}
main().catch(error => { console.error((error as Error).message); process.exitCode = 1; });
