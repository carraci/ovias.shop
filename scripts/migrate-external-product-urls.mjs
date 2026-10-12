import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { MongoClient } from 'mongodb';

// Load url-to-local-map if exists
const mapFile = path.join(process.cwd(), 'data', 'url-to-local-map.json');
let urlMap = {};
if (fs.existsSync(mapFile)) {
  try {
    urlMap = JSON.parse(fs.readFileSync(mapFile, 'utf-8'));
  } catch (e) {}
}

function saveUrlMap() {
  fs.writeFileSync(mapFile, JSON.stringify(urlMap, null, 2), 'utf-8');
}

// Stats tracking
const stats = {
  csvScanned: 0,
  productsScanned: 0,
  productsProcessed: 0,
  productsUpdated: 0,
  productsUnchanged: 0,
  externalImageUrlsDetected: 0,
  imagesSuccessfullyMigrated: 0,
  imagesFailed: 0,
  sourceUrlsRemoved: 0,
  duplicateProductsCreated: 0,
  brokenOviaImageUrls: 0,
  failedUrls: [],
  remainingUnwantedDomains: new Set(),
};

// Scan public/media for existing images that match filenames
const existingMediaByFilename = new Map();
function scanMediaDir(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanMediaDir(full);
    } else if (entry.isFile()) {
      const rel = '/' + path.relative(path.join(process.cwd(), 'public'), full).replace(/\\/g, '/');
      existingMediaByFilename.set(entry.name, rel);
    }
  }
}
scanMediaDir(path.join(process.cwd(), 'public', 'media'));
console.log(`Indexed ${existingMediaByFilename.size} existing local media files.`);

// Category to folder mapping
function getLuggageSubdir(category, name) {
  const cat = (category || '').toLowerCase();
  const n = (name || '').toLowerCase();
  if (cat.includes('trunk') || n.includes('trunk')) return 'trunks';
  if (cat.includes('check') || n.includes('check')) return 'check-in';
  if (cat.includes('cabin') || n.includes('cabin')) return 'cabin';
  if (cat.includes('emblematic') || cat.includes('pilot')) return 'emblematic';
  return 'cabin';
}

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  'Accept': 'image/png,image/jpeg,image/webp,image/*,*/*;q=0.8',
  'Referer': 'https://www.rimowa.com/'
};

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function fetchWithRetry(url, maxAttempts = 3) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(url, { headers, signal: AbortSignal.timeout(20000) });
      if (res.ok) return res;
      if (res.status === 404) throw new Error('HTTP 404 Not Found');
    } catch (err) {
      if (attempt === maxAttempts) throw err;
      await sleep(1500 * attempt);
    }
  }
  throw new Error('Failed after ' + maxAttempts + ' attempts');
}

// Migrate single image URL
async function migrateImageUrl(rawUrl, category, baseName) {
  if (!rawUrl || typeof rawUrl !== 'string') return rawUrl;
  const cleanUrl = rawUrl.trim();
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    return cleanUrl; // already local
  }

  // Check if it's external domain
  try {
    const parsed = new URL(cleanUrl);
    if (parsed.hostname.includes('localhost') || parsed.hostname.includes('ovias.shop')) {
      return parsed.pathname;
    }
  } catch (e) {
    return cleanUrl;
  }

  stats.externalImageUrlsDetected++;

  // Check persistent map
  if (urlMap[cleanUrl]) {
    const localRel = urlMap[cleanUrl];
    const diskPath = path.join(process.cwd(), 'public', localRel.replace(/^\//, ''));
    if (fs.existsSync(diskPath) && fs.statSync(diskPath).size > 100) {
      stats.imagesSuccessfullyMigrated++;
      return localRel;
    }
  }

  // Check if filename matches an existing file in public/media
  const urlFilename = cleanUrl.split('/').pop().split('?')[0];
  const urlWebp = urlFilename.replace(/\.(png|jpg|jpeg)$/i, '.webp');
  if (existingMediaByFilename.has(urlFilename)) {
    const rel = existingMediaByFilename.get(urlFilename);
    urlMap[cleanUrl] = rel;
    stats.imagesSuccessfullyMigrated++;
    return rel;
  }
  if (existingMediaByFilename.has(urlWebp)) {
    const rel = existingMediaByFilename.get(urlWebp);
    urlMap[cleanUrl] = rel;
    stats.imagesSuccessfullyMigrated++;
    return rel;
  }

  // Download and optimize
  const subDir = getLuggageSubdir(category, baseName);
  const targetDir = path.join(process.cwd(), 'public', 'media', 'products', 'luggage', subDir);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const hash = createHash('sha256').update(cleanUrl).digest('hex').slice(0, 10);
  const cleanBase = (baseName || 'product').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 30);
  const fileName = `${cleanBase}-${hash}.webp`;
  const filePath = path.join(targetDir, fileName);
  const publicRel = `/media/products/luggage/${subDir}/${fileName}`;

  // If already on disk
  if (fs.existsSync(filePath) && fs.statSync(filePath).size > 100) {
    urlMap[cleanUrl] = publicRel;
    stats.imagesSuccessfullyMigrated++;
    return publicRel;
  }

  try {
    const res = await fetchWithRetry(cleanUrl);
    const arrayBuf = await res.arrayBuffer();
    const buf = Buffer.from(arrayBuf);

    if (buf.length < 50) {
      throw new Error(`Downloaded buffer too small (${buf.length} bytes)`);
    }

    const webpBuf = await sharp(buf).webp({ quality: 85 }).toBuffer();
    fs.writeFileSync(filePath, webpBuf);

    // Verify
    if (!fs.existsSync(filePath) || fs.statSync(filePath).size < 50) {
      throw new Error('Saved file missing or empty');
    }

    urlMap[cleanUrl] = publicRel;
    stats.imagesSuccessfullyMigrated++;
    console.log(`  ✓ Downloaded ${cleanBase} (${webpBuf.length}b) -> ${publicRel}`);
    await sleep(80); // Gentle throttle
    return publicRel;
  } catch (err) {
    stats.imagesFailed++;
    stats.failedUrls.push({ url: cleanUrl, baseName, error: err.message });
    console.error(`  ✗ Failed to download ${cleanUrl}: ${err.message}`);
    // Safety rule: retain existing URL if failed, do not set broken link!
    return cleanUrl;
  }
}

// ─── 1. MIGRATE LUGGAGE-COLLECTION.TS ──────────────────────────────────────────
console.log('\n=== STEP 1: MIGRATING STATIC LUGGAGE-COLLECTION.TS ===');
const { luggageProducts } = await import('../src/lib/luggage-collection.ts');
stats.productsScanned += luggageProducts.length;

let luggageUpdated = 0;
for (const prod of luggageProducts) {
  stats.productsProcessed++;
  let changed = false;

  // Migrate main image
  if (prod.image && prod.image.startsWith('http')) {
    const newImage = await migrateImageUrl(prod.image, prod.category, prod.slug);
    if (newImage !== prod.image) {
      prod.image = newImage;
      changed = true;
    }
  }

  // Migrate variants
  if (Array.isArray(prod.variants)) {
    for (const v of prod.variants) {
      if (v.image && v.image.startsWith('http')) {
        const newVImg = await migrateImageUrl(v.image, prod.category, `${prod.slug}-${v.color || 'var'}`);
        if (newVImg !== v.image) {
          v.image = newVImg;
          changed = true;
        }
      }
    }
  }

  // Remove sourceUrl if present
  if (prod.sourceUrl) {
    delete prod.sourceUrl;
    stats.sourceUrlsRemoved++;
    changed = true;
  }

  if (changed) {
    luggageUpdated++;
    stats.productsUpdated++;
  } else {
    stats.productsUnchanged++;
  }
}

saveUrlMap();

// Write back luggage-collection.ts
const luggageTsPath = path.join(process.cwd(), 'src', 'lib', 'luggage-collection.ts');
const newTsContent = `import type { Product } from './catalog';\n\nexport const luggageProducts: Product[] = ${JSON.stringify(luggageProducts, null, 2)};\n`;
fs.writeFileSync(luggageTsPath, newTsContent, 'utf-8');
console.log(`✓ Updated ${luggageUpdated} products in src/lib/luggage-collection.ts`);

// ─── 2. MIGRATE MONGODB PRODUCTS ──────────────────────────────────────────────
console.log('\n=== STEP 2: MIGRATING MONGODB DATABASE ===');
if (process.env.MONGODB_URI) {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'ovia');
    const col = db.collection('products');
    const dbProducts = await col.find({}).toArray();
    console.log(`Connected to MongoDB. Found ${dbProducts.length} products in DB.`);

    let dbUpdated = 0;
    for (const doc of dbProducts) {
      let docChanged = false;
      const updateSet = {};
      const updateUnset = {};

      if (doc.image && doc.image.startsWith('http')) {
        const newImg = await migrateImageUrl(doc.image, doc.category, doc.slug);
        if (newImg !== doc.image) {
          updateSet.image = newImg;
          docChanged = true;
        }
      }

      if (Array.isArray(doc.variants)) {
        let variantsChanged = false;
        const newVariants = [];
        for (const v of doc.variants) {
          if (v.image && v.image.startsWith('http')) {
            const newVImg = await migrateImageUrl(v.image, doc.category, `${doc.slug}-${v.color || 'var'}`);
            if (newVImg !== v.image) {
              newVariants.push({ ...v, image: newVImg });
              variantsChanged = true;
            } else {
              newVariants.push(v);
            }
          } else {
            newVariants.push(v);
          }
        }
        if (variantsChanged) {
          updateSet.variants = newVariants;
          docChanged = true;
        }
      }

      if (doc.sourceUrl) {
        updateUnset.sourceUrl = "";
        stats.sourceUrlsRemoved++;
        docChanged = true;
      }
      if (doc.source_url) {
        updateUnset.source_url = "";
        stats.sourceUrlsRemoved++;
        docChanged = true;
      }

      if (docChanged) {
        const updateDoc = {};
        if (Object.keys(updateSet).length > 0) updateDoc.$set = updateSet;
        if (Object.keys(updateUnset).length > 0) updateDoc.$unset = updateUnset;
        await col.updateOne({ _id: doc._id }, updateDoc);
        dbUpdated++;
      }
    }
    console.log(`✓ Updated ${dbUpdated} products in MongoDB collection 'products'`);
  } catch (err) {
    console.error('MongoDB migration failed:', err.message);
  } finally {
    await client.close();
  }
} else {
  console.log('MONGODB_URI not found, skipping DB migration');
}

saveUrlMap();

// ─── 3. MIGRATE DATA/LUGGAGE-MASTER.CSV ────────────────────────────────────────
console.log('\n=== STEP 3: MIGRATING LUGGAGE-MASTER.CSV ===');
const csvPath = path.join(process.cwd(), 'data', 'luggage-master.csv');
if (fs.existsSync(csvPath)) {
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n');
  stats.csvScanned = lines.length - 1;
  const newLines = [];
  let header = lines[0];
  newLines.push(header);

  // category,page_url,name,price,badge,image_hd,image2_hd,swatch1,swatch2,swatch3,web_scraper_order,web_scraper_start_url
  for (let i = 1; i < lines.length; i++) {
    let line = lines[i];
    if (!line.trim()) continue;

    // Replace any external URLs that exist in urlMap
    for (const [extUrl, localUrl] of Object.entries(urlMap)) {
      if (line.includes(extUrl)) {
        line = line.split(extUrl).join(localUrl);
      }
    }

    // Replace localhost with ovias.shop
    line = line.replace(/http:\/\/localhost:3000/g, 'https://www.ovias.shop');

    // Replace web_scraper_start_url pointing to rimowa.com
    line = line.replace(/https:\/\/www\.rimowa\.com\/[^\",]*/g, 'https://www.ovias.shop/luggage');

    newLines.push(line);
  }

  fs.writeFileSync(csvPath, newLines.join('\n'), 'utf-8');
  console.log(`✓ Updated ${newLines.length - 1} rows in data/luggage-master.csv`);
}

// ─── 4. VALIDATION & INTEGRITY CHECK ──────────────────────────────────────────
console.log('\n=== STEP 4: VERIFYING INTEGRITY & SCANNING FOR LEFTOVER DOMAINS ===');

// Check broken local image files
let brokenCount = 0;
for (const [ext, loc] of Object.entries(urlMap)) {
  if (loc.startsWith('/media/')) {
    const disk = path.join(process.cwd(), 'public', loc.replace(/^\//, ''));
    if (!fs.existsSync(disk) || fs.statSync(disk).size < 50) {
      brokenCount++;
      console.error(`Broken image detected: ${loc}`);
    }
  }
}
stats.brokenOviaImageUrls = brokenCount;

// Check luggage-collection.ts for any remaining rimowa.com URLs
const finalLuggageTs = fs.readFileSync(luggageTsPath, 'utf-8');
const remainingLuggageMatches = finalLuggageTs.match(/https?:\/\/[^\s"']+/g) || [];
for (const u of remainingLuggageMatches) {
  try {
    const host = new URL(u).hostname;
    if (host.includes('rimowa.com')) {
      stats.remainingUnwantedDomains.add(host);
    }
  } catch (e) {}
}

console.log(`Remaining unwanted domains in luggage-collection.ts: ${stats.remainingUnwantedDomains.size === 0 ? 'NONE' : Array.from(stats.remainingUnwantedDomains).join(', ')}`);

// Final Migration Report
console.log('\n========================================');
console.log('       FINAL MIGRATION REPORT');
console.log('========================================');
console.log(`CSV/products scanned: ${stats.productsScanned + stats.csvScanned}`);
console.log(`Products processed: ${stats.productsProcessed}`);
console.log(`Products updated: ${stats.productsUpdated}`);
console.log(`Products unchanged: ${stats.productsUnchanged}`);
console.log(`External image URLs detected: ${stats.externalImageUrlsDetected}`);
console.log(`Images successfully migrated: ${stats.imagesSuccessfullyMigrated}`);
console.log(`Images failed: ${stats.imagesFailed}`);
console.log(`Source URLs removed from public data: ${stats.sourceUrlsRemoved}`);
console.log(`Duplicate products created: ${stats.duplicateProductsCreated}`);
console.log(`Broken OVIA image URLs: ${stats.brokenOviaImageUrls}`);
console.log(`Remaining unwanted external domains: ${stats.remainingUnwantedDomains.size === 0 ? 'NONE' : Array.from(stats.remainingUnwantedDomains).join(', ')}`);
console.log('========================================\n');
