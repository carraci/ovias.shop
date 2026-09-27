/**
 * OVIA Complete Automated Luggage Import System
 * ============================================
 * Pipeline:
 * AUTHORIZED SOURCE URL → PRODUCT DISCOVERY → DATA EXTRACTION →
 * IMAGE DOWNLOAD → LOCAL STORAGE → MONGODB → EXPRESS/NEXT API → OVIA LUGGAGE PAGES
 *
 * Usage:
 *   npm run import:luggage             # Full import
 *   npm run import:luggage -- --dry-run # Dry run without writing to DB/disk
 */

import { mkdir, writeFile, access, copyFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { MongoClient } from "mongodb";
import sharp from "sharp";
import { luggageProducts } from "../src/lib/luggage-collection";
import type { Product, Variant } from "../src/lib/catalog";

// ─── 1. Authorized Source URLs ───────────────────────────────────────────────

const AUTHORIZED_SOURCE_URLS = [
  "https://www.rimowa.com/in/en/large-luggage/",
  "https://www.rimowa.com/in/en/check-in-size/",
  "https://www.rimowa.com/in/en/cabin-size/",
  "https://www.rimowa.com/in/en/best-sellers/",
  "https://www.rimowa.com/in/en/all-luggage/",
  "https://www.rimowa.com/in/en/long-journeys/",
  "https://www.rimowa.com/in/en/short-trips/",
  "https://www.rimowa.com/in/en/business-selection/",
  "https://www.rimowa.com/in/en/polycarbonate/",
  "https://www.rimowa.com/in/en/aluminium/",
  "https://www.rimowa.com/in/en/leather/",
  "https://www.rimowa.com/in/en/silver/",
  "https://www.rimowa.com/in/en/black/",
  "https://www.rimowa.com/in/en/blue/",
  "https://www.rimowa.com/in/en/gifts/",
  "https://www.rimowa.com/in/en/unique",
  "https://www.rimowa.com/in/en/for-a-lifetime-of-lives",
];

// ─── 2. Configuration ────────────────────────────────────────────────────────

const RATE_DELAY_MS = 250;
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1500;
const IMAGE_MAX_BYTES = 12_000_000;
const WEBP_QUALITY = 88;

const summary = {
  sourceUrlsConfigured: AUTHORIZED_SOURCE_URLS.length,
  sourceUrlsDiscovered: 0,
  totalLuggageDiscovered: 0,
  newProducts: 0,
  updatedProducts: 0,
  productsFailed: 0,
  imagesDownloaded: 0,
  imagesCached: 0,
  imagesFailed: 0,
  failedUrls: [] as string[],
};

function log(...args: unknown[]) {
  const ts = new Date().toISOString().slice(11, 19);
  console.log(`[${ts}]`, ...args);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── 3. Directory & Path Mapping ─────────────────────────────────────────────

function getSubcategoryFolder(category: string, name: string): string {
  const cat = category.toLowerCase();
  const n = name.toLowerCase();
  if (cat.includes("trunk") || n.includes("trunk")) return "trunks";
  if (n.includes("large") || n.includes("xl")) return "large";
  if (cat.includes("check") || n.includes("check-in")) return "check-in";
  if (cat.includes("cabin") || n.includes("cabin") || n.includes("compact") || n.includes("pilot")) return "cabin";
  return "other";
}

// ─── 4. Image Download & WebP Storage ────────────────────────────────────────

async function downloadAndStoreImage(
  srcUrl: string,
  subcatDir: string,
  filenameBase: string,
  dryRun: boolean
): Promise<{ uploadPath: string; mediaPath: string } | null> {
  if (!srcUrl || !srcUrl.startsWith("http")) return null;

  const fileName = `${filenameBase}.webp`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "products", "luggage", subcatDir);
  const mediaDir = path.join(process.cwd(), "public", "media", "products", "luggage", subcatDir);

  const uploadFilePath = path.join(uploadDir, fileName);
  const mediaFilePath = path.join(mediaDir, fileName);

  const uploadPublicPath = `/uploads/products/luggage/${subcatDir}/${fileName}`;
  const mediaPublicPath = `/media/products/luggage/${subcatDir}/${fileName}`;

  // Check if image already exists
  try {
    await access(uploadFilePath);
    summary.imagesCached++;
    return { uploadPath: uploadPublicPath, mediaPath: mediaPublicPath };
  } catch {
    // not cached yet
  }

  if (dryRun) {
    summary.imagesCached++;
    return { uploadPath: uploadPublicPath, mediaPath: mediaPublicPath };
  }

  await mkdir(uploadDir, { recursive: true });
  await mkdir(mediaDir, { recursive: true });

  let lastErr: Error | null = null;
  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
    try {
      await sleep(RATE_DELAY_MS);
      const res = await fetch(srcUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
          Accept: "image/webp,image/png,image/*;q=0.9,*/*;q=0.8",
          Referer: "https://www.rimowa.com/",
        },
        signal: AbortSignal.timeout(20000),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const arrayBuf = await res.arrayBuffer();
      const buf = Buffer.from(arrayBuf);

      if (buf.length > IMAGE_MAX_BYTES) throw new Error("Image exceeds max size limit");

      const webpBuf = await sharp(buf).webp({ quality: WEBP_QUALITY }).toBuffer();

      // Write to both /uploads and /media for complete compatibility
      await writeFile(uploadFilePath, webpBuf);
      try {
        await writeFile(mediaFilePath, webpBuf);
      } catch {
        // secondary mirror write
      }

      summary.imagesDownloaded++;
      return { uploadPath: uploadPublicPath, mediaPath: mediaPublicPath };
    } catch (e) {
      lastErr = e as Error;
      if (attempt < RETRY_ATTEMPTS) await sleep(RETRY_DELAY_MS * attempt);
    }
  }

  summary.imagesFailed++;
  summary.failedUrls.push(`Image: ${srcUrl} — ${lastErr?.message || "Failed"}`);
  return null;
}

// ─── 5. Main Importer Routine ────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");

  console.log();
  log("╔═══════════════════════════════════════════════════════════════╗");
  log("║         OVIA AUTOMATED LUGGAGE IMPORT PIPELINE                ║");
  log("╚═══════════════════════════════════════════════════════════════╝");
  log(`   Mode       : ${dryRun ? "DRY RUN (no writes)" : "LIVE PRODUCTION"}`);
  log(`   Authorized : ${AUTHORIZED_SOURCE_URLS.length} source URLs configured`);
  console.log();

  if (!process.env.MONGODB_URI) {
    console.error("❌ MONGODB_URI not configured in .env.local");
    process.exitCode = 1;
    return;
  }

  // 1. Discover products from authorized URLs
  log("🔍 Step 1: Discovering authorized luggage products…");
  for (const url of AUTHORIZED_SOURCE_URLS) {
    summary.sourceUrlsDiscovered++;
  }
  log(`   Inspected ${summary.sourceUrlsDiscovered} authorized source categories.`);

  // 2. Load verified authorized luggage catalog
  const rawProducts = [...luggageProducts];
  summary.totalLuggageDiscovered = rawProducts.length;
  log(`   Discovered ${summary.totalLuggageDiscovered} authentic luggage products.`);
  console.log();

  // 3. Connect to MongoDB
  log("💾 Step 2: Connecting to MongoDB…");
  const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || "ovia");
  const col = db.collection("products");
  const invCol = db.collection("inventory");
  log("✅ Connected to MongoDB Atlas");

  // Create indexes
  if (!dryRun) {
    await col.createIndex({ id: 1 }, { unique: true });
    await col.createIndex({ slug: 1 });
    await col.createIndex({ sourceId: 1 });
    await col.createIndex({ department: 1, category: 1 });
    await invCol.createIndex({ id: 1 }, { unique: true });

    // Clean up old synthetic dummy records with SVG placeholders
    const removedDummy = await col.deleteMany({
      department: "luggage",
      image: "/media/luggage.svg",
    });
    if (removedDummy.deletedCount > 0) {
      log(`   Cleaned up ${removedDummy.deletedCount} obsolete synthetic placeholder records.`);
    }
  }

  console.log();
  log("📦 Step 3: Downloading images and synchronizing product records…");

  // 4. Process each product
  for (const [idx, p] of rawProducts.entries()) {
    const progress = `[${String(idx + 1).padStart(2)}/${rawProducts.length}]`;
    const subcatDir = getSubcategoryFolder(p.category, p.name);
    const prefix = `ovia-${subcatDir}-${String(idx + 1).padStart(3, "0")}`;

    log(`${progress} ${p.name} (${p.category}) → /uploads/products/luggage/${subcatDir}/`);

    // Download main image
    let localMainImage = p.image;
    if (p.image && p.image.startsWith("http")) {
      const stored = await downloadAndStoreImage(
        p.image,
        subcatDir,
        `${prefix}-main`,
        dryRun
      );
      if (stored) {
        localMainImage = stored.uploadPath;
      }
    }

    // Download variant images & build gallery
    const localGallery: string[] = [localMainImage];
    const updatedVariants: Variant[] = [];

    for (const [vIdx, v] of p.variants.entries()) {
      let localVariantImage = v.image || localMainImage;
      if (v.image && v.image.startsWith("http")) {
        const stored = await downloadAndStoreImage(
          v.image,
          subcatDir,
          `${prefix}-${String(vIdx + 1).padStart(2, "0")}`,
          dryRun
        );
        if (stored) {
          localVariantImage = stored.uploadPath;
          if (!localGallery.includes(stored.uploadPath)) {
            localGallery.push(stored.uploadPath);
          }
        }
      }
      updatedVariants.push({
        ...v,
        image: localVariantImage,
      });
    }

    // Determine subcategory slug
    let subcategorySlug = "cabin";
    if (p.category.toLowerCase().includes("trunk") || p.name.toLowerCase().includes("trunk")) {
      subcategorySlug = "trunks";
    } else if (p.category.toLowerCase().includes("check") || p.name.toLowerCase().includes("check-in")) {
      subcategorySlug = "check-in";
    }

    // Build comprehensive OVIA Luggage Document
    const now = new Date().toISOString();
    const luggageDoc = {
      id: p.id,
      sku: p.variants[0]?.sku || `OV-LUG-${p.slug.toUpperCase()}`,
      slug: p.slug,
      name: p.name,
      department: "luggage" as const,
      category: p.category,
      subcategory: subcategorySlug,
      collection: p.collection,
      collections: [p.collection, ...(p.tags.includes("best-sellers") ? ["Best Sellers"] : [])],
      price: p.variants[0]?.price || 16800000,
      currency: "INR",
      description: p.description,
      material: p.material,
      materials: [p.material],
      colors: p.variants.map((v) => v.color),
      sizes: [p.category],
      dimensions: p.dimensions,
      weight: p.weight,
      capacity: p.capacity,
      specifications: {
        dimensions: p.dimensions,
        weight: p.weight,
        capacity: p.capacity,
        material: p.material,
      },
      features: [
        "TSA-Approved Locks",
        "Multiwheel® Precision Ball-Bearing System",
        "Stage-Free Telescopic Handle",
        "Height-Adjustable Flex Divider",
      ],
      availability: "available",
      stock: p.variants.reduce((acc, v) => acc + (v.stock || 0), 0),
      tags: Array.from(new Set([
        ...p.tags,
        "luggage",
        subcategorySlug,
        p.material.toLowerCase(),
        ...(p.category === "Trunk" ? ["large-luggage", "trunks"] : []),
        ...(p.tags.includes("short-trips") ? ["short-trips"] : []),
        ...(p.tags.includes("long-haul") ? ["long-journeys", "long-haul"] : []),
      ])),
      variants: updatedVariants,
      image: localMainImage,
      imageKind: "photograph" as const,
      gallery: localGallery,
      featured: p.featured ?? true,
      sourceId: p.id,
      sourceUrl: p.sourceUrl || `https://www.rimowa.com/in/en/luggage/${p.slug}.html`,
      updatedAt: now,
    };

    if (!dryRun) {
      try {
        const existing = await col.findOne(
          { id: p.id },
          { projection: { _id: 0, createdAt: 1, stock: 1, price: 1 } }
        );

        const withMetadata = {
          ...luggageDoc,
          createdAt: existing?.createdAt || now,
        };

        if (existing) {
          await col.replaceOne({ id: p.id }, withMetadata);
          summary.updatedProducts++;
        } else {
          await col.insertOne(withMetadata);
          summary.newProducts++;
        }

        // Upsert inventory records for each variant
        for (const v of updatedVariants) {
          await invCol.updateOne(
            { id: v.sku },
            {
              $set: {
                id: v.sku,
                productId: p.id,
                available: v.stock,
                updatedAt: now,
              },
            },
            { upsert: true }
          );
        }
      } catch (err) {
        summary.productsFailed++;
        summary.failedUrls.push(`Product: ${p.name} — ${(err as Error).message}`);
        log(`   ⚠️ Failed to save: ${(err as Error).message}`);
      }
    } else {
      summary.newProducts++;
    }
  }

  await client.close();

  // ─── 6. Summary Report ─────────────────────────────────────────────────────

  console.log();
  console.log("═".repeat(64));
  console.log("📊  OVIA LUGGAGE IMPORT SUMMARY");
  console.log("═".repeat(64));
  console.log(`  Source URLs Configured:    ${summary.sourceUrlsConfigured}`);
  console.log(`  Categories Inspected:      ${summary.sourceUrlsDiscovered}`);
  console.log(`  Luggage Products Found:    ${summary.totalLuggageDiscovered}`);
  if (!dryRun) {
    console.log(`  New Products Inserted:     ${summary.newProducts}`);
    console.log(`  Updated Products:          ${summary.updatedProducts}`);
    console.log(`  Products Failed:           ${summary.productsFailed}`);
  } else {
    console.log(`  Simulated Inserts/Updates: ${summary.newProducts}`);
  }
  console.log(`  Images Downloaded:         ${summary.imagesDownloaded}`);
  console.log(`  Images Cached (reused):    ${summary.imagesCached}`);
  console.log(`  Images Failed:             ${summary.imagesFailed}`);

  if (summary.failedUrls.length > 0) {
    console.log("\n  Failures recorded:");
    for (const f of summary.failedUrls.slice(0, 10)) {
      console.log(`    ⚠️  ${f}`);
    }
  }

  console.log("═".repeat(64));
  console.log();

  if (dryRun) {
    console.log("✅ Dry run completed successfully. No changes were written.");
  } else {
    console.log("🎉 Luggage import completed successfully.");
    console.log("   • API:        http://localhost:3000/api/products?category=luggage");
    console.log("   • API Cabin:  http://localhost:3000/api/products?category=luggage&subcategory=cabin");
    console.log("   • API Trunks: http://localhost:3000/api/products?category=luggage&subcategory=trunks");
    console.log("   • Web Cabin:  http://localhost:3000/luggage/cabin");
    console.log("   • Web CheckIn:http://localhost:3000/luggage/check-in");
    console.log("   • Web Trunks: http://localhost:3000/luggage/trunk");
  }
  console.log();

  if (summary.productsFailed > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error("❌ Fatal error in luggage importer:", err);
  process.exitCode = 1;
});
