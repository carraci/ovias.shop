import { MongoClient } from 'mongodb';

async function run() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || 'ovia');
  const counts = await db.collection('products').aggregate([
    { $group: { _id: { department: '$department', category: '$category' }, count: { $sum: 1 } } },
    { $sort: { '_id.department': 1, '_id.category': 1 } }
  ]).toArray();
  console.log('Product Breakdown in DB:');
  console.table(counts.map(c => ({ department: c._id.department, category: c._id.category, count: c.count })));

  const sampleLuggage = await db.collection('products').findOne({ department: 'luggage' });
  console.log('Sample luggage record in DB:');
  console.log(JSON.stringify(sampleLuggage, null, 2));

  await client.close();
}

run().catch(console.error);
