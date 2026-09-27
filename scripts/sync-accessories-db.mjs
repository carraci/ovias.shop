import { MongoClient } from 'mongodb';
import { accessoriesProducts } from '../src/lib/accessories-collection.ts';
import fs from 'fs';
import path from 'path';

// Parse .env.local
const envFile = path.resolve('.env.local');
if (fs.existsSync(envFile)) {
  const lines = fs.readFileSync(envFile, 'utf8').split('\n');
  lines.forEach(l => {
    const [k, ...v] = l.split('=');
    if (k && v.length) process.env[k.trim()] = v.join('=').trim().replace(/^"|"$/g, '');
  });
}

async function sync() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('No MONGODB_URI found');
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || 'ovia');
  console.log('Connected to MongoDB. Syncing', accessoriesProducts.length, 'accessories products...');
  
  for (const p of accessoriesProducts) {
    await db.collection('products').updateOne(
      { id: p.id },
      { $set: p },
      { upsert: true }
    );
  }
  
  const total = await db.collection('products').countDocuments({ department: 'accessories' });
  console.log('Total accessories products in MongoDB:', total);
  await client.close();
}

sync().catch(e => {
  console.error('Error syncing to MongoDB:', e);
  process.exit(1);
});
