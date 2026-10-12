import { MongoClient } from 'mongodb';

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("No MONGODB_URI");
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || 'ovia');

  await db.collection('coupons').updateMany(
    { code: { $in: ['FIRSTCLASS', 'LUXURYJOURNEY', 'CABINSUITE'] } },
    { $set: { status: 'Active', minOrder: 0, endDate: '2028-12-31' } }
  );

  const all = await db.collection('coupons').find({}).toArray();
  console.log('Coupons in DB:', all.map(c => ({ code: c.code, status: c.status, minOrder: c.minOrder, value: c.value })));
  await client.close();
}

main().catch(console.error);
