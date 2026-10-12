import fs from 'node:fs';
import path from 'node:path';
import { MongoClient } from 'mongodb';

// Load static luggage collection
const luggageContent = fs.readFileSync('src/lib/luggage-collection.ts', 'utf-8');
const luggageUrls = luggageContent.match(/https?:\/\/[^\s"']+/g) || [];

// Load CSV
const csvContent = fs.readFileSync('data/luggage-master.csv', 'utf-8');
const csvUrls = csvContent.match(/https?:\/\/[^\s"',]+/g) || [];

const allExternalUrls = new Set();

function addExternal(url) {
  try {
    const clean = url.replace(/[,;]+$/, '');
    const parsed = new URL(clean);
    if (!parsed.hostname.includes('localhost') && !parsed.hostname.includes('ovias.shop')) {
      allExternalUrls.add(clean);
    }
  } catch (e) {}
}

luggageUrls.forEach(addExternal);
csvUrls.forEach(addExternal);

// Load MongoDB
if (process.env.MONGODB_URI) {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'ovia');
    const prods = await db.collection('products').find({}).toArray();
    const str = JSON.stringify(prods);
    const mongoUrls = str.match(/https?:\/\/[^\s"'\\]+/g) || [];
    mongoUrls.forEach(addExternal);
  } finally {
    await client.close();
  }
}

console.log(`Total unique external URLs across static, DB, and CSV: ${allExternalUrls.size}`);

// Check how many are image URLs vs page URLs
const imageUrls = [];
const pageUrls = [];

for (const u of allExternalUrls) {
  if (/\.(png|jpg|jpeg|webp|gif|svg)/i.test(u) || u.includes('/images/')) {
    imageUrls.push(u);
  } else {
    pageUrls.push(u);
  }
}

console.log(`Image URLs: ${imageUrls.length}`);
console.log(`Page / Non-image URLs: ${pageUrls.length}`);
if (pageUrls.length > 0) {
  console.log('Sample Page URLs:', pageUrls.slice(0, 10));
}
