import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';

const envFile = path.resolve('.env.local');
if (fs.existsSync(envFile)) {
  const lines = fs.readFileSync(envFile, 'utf8').split('\n');
  lines.forEach(l => {
    const [k, ...v] = l.split('=');
    if (k && v.length) process.env[k.trim()] = v.join('=').trim().replace(/^"|"$/g, '');
  });
}

async function check() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || 'ovia');
  
  const allTags = await db.collection('products').find({
    category: { $in: ['Address Tags', 'Stickers', 'Bag Straps', 'Wheels'] }
  }).toArray();
  
  console.log(`Found ${allTags.length} products in DB matching category names:`);
  allTags.forEach(p => {
    if (p.image && p.image.includes('svg')) {
      console.log('SVG Item in DB:', p.id, '|', p.name, '| dep:', p.department, '| cat:', p.category, '| img:', p.image);
    }
  });

  await client.close();
}

check().catch(console.error);
