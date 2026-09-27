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

async function removeSvgPlaceholders() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || 'ovia');

  const res = await db.collection('products').deleteMany({
    image: { $regex: 'accessories\\.svg$' }
  });
  console.log(`Deleted ${res.deletedCount} placeholder SVG products from DB.`);

  const remaining = await db.collection('products').countDocuments({ department: 'accessories' });
  console.log(`Remaining accessories in DB: ${remaining}`);
  await client.close();
}

removeSvgPlaceholders().catch(console.error);
