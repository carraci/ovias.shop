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
  
  const dummyAcc = await db.collection('products').find({
    department: 'accessories',
    imageKind: 'illustration'
  }).toArray();
  
  console.log('Dummy SVG illustration accessories in DB:', dummyAcc.length);
  dummyAcc.forEach(d => console.log('  -', d.id, '|', d.name, '|', d.category, '|', d.image));

  if (dummyAcc.length > 0) {
    const del = await db.collection('products').deleteMany({
      department: 'accessories',
      imageKind: 'illustration'
    });
    console.log(`Deleted ${del.deletedCount} placeholder SVG products from DB.`);
  }

  const remaining = await db.collection('products').countDocuments({ department: 'accessories' });
  console.log(`Total real accessories remaining in DB: ${remaining}`);
  await client.close();
}

check().catch(console.error);
