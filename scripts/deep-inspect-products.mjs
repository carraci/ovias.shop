import fs from 'node:fs';
import { MongoClient } from 'mongodb';
import { products } from '../src/lib/catalog.ts';

const domainsFound = new Set();
const fieldsAffected = new Set();
const productsWithExternalUrls = [];

function checkObject(obj, path = '', prodId = '') {
  if (!obj) return;
  if (typeof obj === 'string') {
    if (obj.startsWith('http://') || obj.startsWith('https://')) {
      try {
        const url = new URL(obj);
        const host = url.hostname;
        if (!host.includes('localhost') && !host.includes('ovias.shop')) {
          domainsFound.add(host);
          fieldsAffected.add(path);
          return { path, url: obj, host };
        }
      } catch (e) {}
    }
  } else if (Array.isArray(obj)) {
    const hits = [];
    obj.forEach((item, idx) => {
      const res = checkObject(item, `${path}[${idx}]`, prodId);
      if (res) hits.push(res);
    });
    return hits.length ? hits : null;
  } else if (typeof obj === 'object') {
    const hits = [];
    for (const [k, v] of Object.entries(obj)) {
      const p = path ? `${path}.${k}` : k;
      const res = checkObject(v, p, prodId);
      if (res) hits.push(res);
    }
    return hits.length ? hits : null;
  }
  return null;
}

console.log('=== 1. CHECKING STATIC CATALOG PRODUCTS (' + products.length + ' products) ===');
let externalUrlCount = 0;
for (const prod of products) {
  const hits = checkObject(prod, '', prod.id || prod.slug);
  if (hits && hits.length > 0) {
    productsWithExternalUrls.push({ id: prod.id, slug: prod.slug, hits: hits.flat(Infinity) });
    externalUrlCount += hits.flat(Infinity).length;
  }
}

console.log(`Static products checked: ${products.length}`);
console.log(`Products with external URLs: ${productsWithExternalUrls.length}`);
console.log(`Total external URL references in static products: ${externalUrlCount}`);
console.log(`External domains found in static catalog:`, Array.from(domainsFound));
console.log(`Fields affected in static catalog:`, Array.from(fieldsAffected));

console.log('\n=== 2. CHECKING MONGODB DATABASE ===');
if (process.env.MONGODB_URI) {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'ovia');
    const col = db.collection('products');
    const totalDb = await col.countDocuments();
    console.log(`Connected to MongoDB. Total products in DB: ${totalDb}`);

    const dbDomains = new Set();
    const dbFields = new Set();
    let dbExternalCount = 0;
    const dbHits = [];

    const cursor = col.find({});
    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      const hits = checkObject(doc, '', doc.id || doc.slug);
      if (hits && hits.length > 0) {
        dbHits.push({ id: doc.id, slug: doc.slug, hits: hits.flat(Infinity) });
        dbExternalCount += hits.flat(Infinity).length;
        hits.flat(Infinity).forEach(h => {
          if (h && h.host) dbDomains.add(h.host);
          if (h && h.path) dbFields.add(h.path.replace(/\[\d+\]/g, '[]'));
        });
      }
    }
    console.log(`MongoDB products with external URLs: ${dbHits.length}`);
    console.log(`Total external URL references in DB: ${dbExternalCount}`);
    console.log(`External domains found in DB:`, Array.from(dbDomains));
    console.log(`Fields affected in DB:`, Array.from(dbFields));
  } catch (err) {
    console.error('MongoDB check failed:', err.message);
  } finally {
    await client.close();
  }
} else {
  console.log('MONGODB_URI not set');
}
