import fs from 'node:fs';
import path from 'node:path';
import { MongoClient } from 'mongodb';
import { products } from '../src/lib/catalog.ts';

console.log('=== VERIFYING ALL IMAGE PATHS ACROSS CODEBASE AND MONGODB ===');

let totalChecked = 0;
let brokenCount = 0;
const brokenList = [];

function verifyPath(imgPath, source) {
  if (!imgPath || typeof imgPath !== 'string') return;
  totalChecked++;

  if (imgPath.startsWith('http://') || imgPath.startsWith('https://')) {
    brokenCount++;
    brokenList.push({ path: imgPath, source, reason: 'External URL still present' });
    return;
  }

  // Local path
  const localRel = imgPath.startsWith('/') ? imgPath.slice(1) : imgPath;
  const diskPath = path.join(process.cwd(), 'public', localRel);

  if (!fs.existsSync(diskPath)) {
    brokenCount++;
    brokenList.push({ path: imgPath, source, reason: 'File does not exist on disk' });
    return;
  }

  const stat = fs.statSync(diskPath);
  if (stat.size === 0) {
    brokenCount++;
    brokenList.push({ path: imgPath, source, reason: 'Zero-byte file' });
    return;
  }
}

// 1. Static products
for (const p of products) {
  verifyPath(p.image, `Static: ${p.slug} (main image)`);
  if (Array.isArray(p.variants)) {
    for (const v of p.variants) {
      if (v.image) verifyPath(v.image, `Static: ${p.slug} (variant ${v.color || v.sku})`);
    }
  }
}

// 2. MongoDB products
if (process.env.MONGODB_URI) {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'ovia');
    const dbProds = await db.collection('products').find({}).toArray();
    for (const p of dbProds) {
      verifyPath(p.image, `MongoDB: ${p.slug} (main image)`);
      if (Array.isArray(p.variants)) {
        for (const v of p.variants) {
          if (v.image) verifyPath(v.image, `MongoDB: ${p.slug} (variant ${v.color || v.sku})`);
        }
      }
    }
  } finally {
    await client.close();
  }
}

console.log(`Total image references verified: ${totalChecked}`);
console.log(`Broken or external images found: ${brokenCount}`);
if (brokenCount > 0) {
  console.log('Broken images:', brokenList.slice(0, 10));
} else {
  console.log('✓ 100% of images verified successfully! Zero broken images.');
}
