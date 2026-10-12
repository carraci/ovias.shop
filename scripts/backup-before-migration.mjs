import fs from 'node:fs';
import path from 'node:path';
import { MongoClient } from 'mongodb';

const backupDir = path.join(process.cwd(), 'data', 'backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
console.log(`Starting backup at ${timestamp}...`);

// 1. Backup luggage-collection.ts
const luggageSrc = path.join(process.cwd(), 'src', 'lib', 'luggage-collection.ts');
if (fs.existsSync(luggageSrc)) {
  const dest = path.join(backupDir, `luggage-collection-${timestamp}.ts.bak`);
  fs.copyFileSync(luggageSrc, dest);
  console.log(`✓ Backed up luggage-collection.ts -> ${dest}`);
}

// 2. Backup luggage-master.csv
const csvSrc = path.join(process.cwd(), 'data', 'luggage-master.csv');
if (fs.existsSync(csvSrc)) {
  const dest = path.join(backupDir, `luggage-master-${timestamp}.csv.bak`);
  fs.copyFileSync(csvSrc, dest);
  console.log(`✓ Backed up luggage-master.csv -> ${dest}`);
}

// 3. Backup MongoDB products collection
if (process.env.MONGODB_URI) {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'ovia');
    const products = await db.collection('products').find({}).toArray();
    const mongoDest = path.join(backupDir, `mongodb-products-${timestamp}.json.bak`);
    fs.writeFileSync(mongoDest, JSON.stringify(products, null, 2), 'utf-8');
    console.log(`✓ Backed up ${products.length} MongoDB products -> ${mongoDest}`);
  } catch (err) {
    console.error('MongoDB backup error:', err.message);
  } finally {
    await client.close();
  }
} else {
  console.log('MONGODB_URI not found, skipping DB backup');
}

console.log('Backup process completed successfully.');
