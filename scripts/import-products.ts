/**
 * OVIA Product Importer
 * ---------------------
 * Sources product data from the curated OVIA catalog (luggage-collection.ts,
 * bags-collection.ts, etc.), downloads all referenced CDN images locally to
 * public/media/products/{category}/, converts them to optimized WebP, and
 * upserts the full product+inventory records into MongoDB.
 *
 * Usage:
 *   npm run import-products            # full import
 *   npm run import-products:dry        # dry run — no writes
 *   npm run import-products -- --category trunk
 *   npm run import-products -- --department luggage
 *
 * The pipeline is idempotent: re-running updates existing records and skips
 * already-downloaded images (content-addressed filenames).
 */

import { mkdir, writeFile, access } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { MongoClient } from "mongodb";
import sharp from "sharp";
import { products as allCatalogProducts } from "../src/lib/catalog";

// ─── Config ─────────────────────────────────────────────────────────────────

const RATE_DELAY_MS = 600;       // ms between image requests
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 2500;
const IMAGE_MAX_BYTES = 12_000_000;
const WEBP_QUALITY = 87;
const MAX_GALLERY_IMAGES = 4;

// ─── Summary ─────────────────────────────────────────────────────────────────

const summary = {
  total: 0,
  created: 0,
  updated: 0,
  skipped: 0,
  imagesDownloaded: 0,
  imagesCached: 0,
  imagesFailed: 0,
  productsFailed: 0,
  failures: [] as string[],
};

// ─── Logging ─────────────────────────────────────────────────────────────────

function log(...args: unknown[]) {
  const ts = new Date().toISOString().slice(11, 19);
  console.log(ts, ...args);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Category → image directory mapping ─────────────────────────────────────

function imageDir(department: string, category: string): string {
  const cat = category.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  if (department === "luggage") {
    if (cat.includes("trunk")) return "luggage/trunks";
    if (cat.includes("check")) return "luggage/check-in";
    if (cat.includes("cabin")) return "luggage/cabin";
    if (cat.includes("emblematic") || cat.includes("best")) return "luggage/emblematic";
    return "luggage";
  }
  if (department === "bags") {
    if (cat.includes("backpack")) return "bags/backpacks";
    if (cat.includes("duffle") || cat.includes("weekend")) return "bags/duffle";
    if (cat.includes("briefcase")) return "bags/briefcases";
    if (cat.includes("crossbod")) return "bags/crossbody";
    if (cat.includes("tote")) return "bags/totes";
    if (cat.includes("shoulder")) return "bags/shoulder";
    if (cat.includes("hand-carry") || cat.includes("hand carry")) return "bags/hand-carry";
    return "bags";
  }
  if (department === "accessories") {
    return "accessories";
  }
  return "other";
}

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  attempts = RETRY_ATTEMPTS
): Promise<Response> {
  const defaultHeaders: Record<string, string> = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Accept": "image/webp,image/png,image/*;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://www.rimowa.com/",
  };
  const headers = { ...defaultHeaders, ...((options.headers as Record<string, string>) || {}) };
  let lastErr: Error | null = null;
  for (let i = 0; i < attempts; i++) {
    if (i > 0) await sleep(RETRY_DELAY_MS * i);
    try {
      const res = await fetch(url, {
        ...options,
        headers,
        signal: AbortSignal.timeout(25000),
        redirect: "follow",
      });
      if (res.ok || res.status < 500) return res;
      lastErr = new Error(`HTTP ${res.status}`);
    } catch (e) {
      lastErr = e as Error;
    }
  }
  throw lastErr || new Error("Fetch failed");
}

// ─── Image download + WebP conversion ────────────────────────────────────────

async function downloadImage(
  srcUrl: string,
  dir: string,
  baseName: string,
  dryRun: boolean
): Promise<string | null> {
  if (!srcUrl || !srcUrl.startsWith("http")) return null;

  const destDir = path.join(process.cwd(), "public", "media", "products", dir);
  const hash = createHash("sha256").update(srcUrl).digest("hex").slice(0, 12);
  const fileName = `${baseName}-${hash}.webp`;
  const filePath = path.join(destDir, fileName);
  const publicPath = `/media/products/${dir}/${fileName}`;

  // Check cache
  try {
    await access(filePath);
    summary.imagesCached++;
    return publicPath;
  } catch { /* not cached */ }

  if (dryRun) return `[dry-run]${publicPath}`;

  try {
    await mkdir(destDir, { recursive: true });
    await sleep(RATE_DELAY_MS);

    const res = await fetchWithRetry(srcUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const chunks: Uint8Array[] = [];
    let size = 0;
    const reader = res.body?.getReader();
    if (!reader) throw new Error("Empty body");
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > IMAGE_MAX_BYTES) { await reader.cancel(); throw new Error("Too large"); }
      chunks.push(value);
    }
    const buf = Buffer.concat(chunks);

    // Validate image signature
    const isPng = buf.slice(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const isJpeg = buf[0] === 0xff && buf[1] === 0xd8;
    const isWebp = buf.slice(0, 4).toString("ascii") === "RIFF" && buf.slice(8, 12).toString("ascii") === "WEBP";
    if (!isPng && !isJpeg && !isWebp) throw new Error("Invalid image signature");

    const webpBuf = await sharp(buf).webp({ quality: WEBP_QUALITY }).toBuffer();
    await writeFile(filePath, webpBuf);
    summary.imagesDownloaded++;
    return publicPath;
  } catch (e) {
    summary.imagesFailed++;
    summary.failures.push(`Image ${srcUrl.split("/").at(-1)}: ${(e as Error).message}`);
    return null;
  }
}

// ─── Product type (matches src/lib/catalog.ts) ──────────────────────────────

interface Variant {
  sku: string;
  color: string;
  hex: string;
  price: number;
  stock: number;
  image?: string;
}

interface Product {
  id: string;
  slug: string;
  name: string;
  collection: string;
  department: string;
  category: string;
  material: string;
  description: string;
  dimensions: string;
  capacity: string;
  weight: string;
  tags: string[];
  variants: Variant[];
  image: string;
  imageKind: string;
  featured: boolean;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const filterDept = args.find((a) => a.startsWith("--department="))?.split("=")[1] ||
    (args.indexOf("--department") >= 0 ? args[args.indexOf("--department") + 1] : null);
  const filterCat = args.find((a) => a.startsWith("--category="))?.split("=")[1] ||
    (args.indexOf("--category") >= 0 ? args[args.indexOf("--category") + 1] : null);

  console.log();
  log("🚀  OVIA Product Importer");
  log(`   Mode   : ${dryRun ? "DRY RUN (no writes)" : "LIVE"}`);
  if (filterDept) log(`   Filter : department=${filterDept}`);
  if (filterCat)  log(`   Filter : category=${filterCat}`);
  console.log();

  if (!process.env.MONGODB_URI) {
    console.error("❌  MONGODB_URI not set. Check .env.local");
    process.exitCode = 1;
    return;
  }

  // Use catalog imported at module level
  log("📚  Loading product catalog…");

  let products = [...allCatalogProducts] as Product[];
  if (filterDept) products = products.filter(p => p.department === filterDept);
  if (filterCat) {
    const fc = filterCat.toLowerCase();
    products = products.filter(p => p.category.toLowerCase().includes(fc));
  }

  summary.total = products.length;
  log(`   Found ${summary.total} products to process`);
  console.log();


  // Connect MongoDB
  const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || "ovia");
  const col = db.collection("products");
  const invCol = db.collection("inventory");
  log("✅  Connected to MongoDB");

  // Ensure indexes
  if (!dryRun) {
    await col.createIndex({ id: 1 }, { unique: true });
    await col.createIndex({ slug: 1 });
    await col.createIndex({ sourceId: 1 });
    await col.createIndex({ department: 1, category: 1 });
    await db.collection("inventory").createIndex({ id: 1 }, { unique: true });
  }
  console.log();

  // Group by department for logging
  const depts = [...new Set(products.map(p => p.department))];
  for (const dept of depts) {
    const deptProds = products.filter(p => p.department === dept);
    const cats = [...new Set(deptProds.map(p => p.category))];
    log(`📦  ${dept}: ${deptProds.length} products across ${cats.length} categories`);
  }
  console.log();

  // Process each product
  for (const [idx, product] of products.entries()) {
    const progress = `[${String(idx + 1).padStart(3)}/${products.length}]`;
    const dir = imageDir(product.department, product.category);
    const safeSlug = product.slug || product.id;
    const basePrefix = `ovia-${product.department.slice(0,3)}-${String(idx + 1).padStart(4, "0")}`;

    log(`${progress} ${product.name} (${product.category})`);

    // Collect source image URLs from variants and main image
    const sourceUrls: string[] = [];
    if (product.image && product.image.startsWith("http")) {
      sourceUrls.push(product.image);
    }
    for (const v of product.variants) {
      if (v.image && v.image.startsWith("http") && !sourceUrls.includes(v.image)) {
        sourceUrls.push(v.image);
      }
    }

    // Download images
    let mainImagePath = product.image;
    const localImagePaths: string[] = [];

    if (sourceUrls.length > 0) {
      // Main image
      const mainLocal = await downloadImage(sourceUrls[0], dir, `${basePrefix}-main`, dryRun);
      if (mainLocal) {
        mainImagePath = mainLocal;
        localImagePaths.push(mainLocal);
      }

      // Additional gallery (variant images, limit to MAX_GALLERY_IMAGES)
      for (let g = 1; g < Math.min(sourceUrls.length, MAX_GALLERY_IMAGES); g++) {
        const gLocal = await downloadImage(
          sourceUrls[g], dir, `${basePrefix}-${String(g + 1).padStart(2, "0")}`, dryRun
        );
        if (gLocal) localImagePaths.push(gLocal);
      }
    }

    // Update variant images
    const updatedVariants = product.variants.map((v, vi) => {
      const variantSrcUrl = v.image;
      let variantLocalPath = v.image;
      if (variantSrcUrl && variantSrcUrl.startsWith("http")) {
        const found = localImagePaths.find((lp) =>
          lp.includes(`${basePrefix}-`) ||
          (vi === 0 && lp.includes("-main"))
        );
        if (found) variantLocalPath = found;
      }
      return { ...v, image: variantLocalPath };
    });

    const now = new Date().toISOString();
    const doc = {
      ...product,
      id: product.id,
      slug: safeSlug,
      image: mainImagePath,
      imageKind: "photograph",
      gallery: localImagePaths,
      variants: updatedVariants,
      sourceId: product.id,
      updatedAt: now,
    };

    if (!dryRun) {
      try {
        const existing = await col.findOne({ id: product.id }, { projection: { _id: 0, createdAt: 1 } });
        const withDates = { ...doc, createdAt: existing?.createdAt || now };

        if (existing) {
          await col.replaceOne({ id: product.id }, withDates);
          summary.updated++;
        } else {
          await col.insertOne(withDates);
          summary.created++;
        }

        // Upsert inventory for each variant
        for (const v of product.variants) {
          await invCol.updateOne(
            { id: v.sku },
            { $set: { id: v.sku, productId: product.id, available: v.stock } },
            { upsert: true }
          );
        }
      } catch (e) {
        summary.productsFailed++;
        summary.failures.push(`Product "${product.name}" (${product.id}): ${(e as Error).message}`);
        log(`   ⚠️  Failed: ${(e as Error).message}`);
      }
    } else {
      summary.created++; // count as "would create" in dry run
    }
  }

  await client.close();

  // ─── Summary ───────────────────────────────────────────────────────────────
  console.log();
  console.log("─".repeat(62));
  console.log("📊  IMPORT SUMMARY");
  console.log("─".repeat(62));
  console.log(`  Products processed:    ${summary.total}`);
  if (!dryRun) {
    console.log(`  New products:          ${summary.created}`);
    console.log(`  Updated products:      ${summary.updated}`);
  } else {
    console.log(`  Would create/update:   ${summary.created}`);
  }
  console.log(`  Images downloaded:     ${summary.imagesDownloaded}`);
  console.log(`  Images cached (skip):  ${summary.imagesCached}`);
  console.log(`  Images failed:         ${summary.imagesFailed}`);
  if (!dryRun) {
    console.log(`  Products failed:       ${summary.productsFailed}`);
  }
  if (summary.failures.length > 0) {
    console.log("\n  Failures (first 20):");
    for (const f of summary.failures.slice(0, 20)) {
      console.log(`    ⚠️  ${f}`);
    }
    if (summary.failures.length > 20) {
      console.log(`    … and ${summary.failures.length - 20} more`);
    }
  }
  console.log("─".repeat(62));
  console.log();

  if (dryRun) {
    console.log("✅  Dry run complete. Run without --dry-run to apply changes.");
  } else {
    console.log("✅  Import complete.");
    console.log();
    console.log("   Next steps:");
    console.log("   • Browse: http://localhost:3000/luggage/trunk");
    console.log("   • API:    http://localhost:3000/api/v1/products?department=luggage&category=trunk");
    console.log("   • API:    http://localhost:3000/api/v1/products?department=bags&page=1");
  }
  console.log();

  if (summary.productsFailed > 0) process.exitCode = 1;
}

main().catch((e) => {
  console.error("❌  Fatal error:", (e as Error).message);
  console.error((e as Error).stack);
  process.exitCode = 1;
});
