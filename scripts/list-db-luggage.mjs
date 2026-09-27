import { MongoClient } from 'mongodb';

async function run() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || 'ovia');
  const luggage = await db.collection('products').find({ department: 'luggage' }, { projection: { id: 1, name: 1, category: 1, image: 1, sourceId: 1 } }).toArray();
  console.log(`Total luggage in DB: ${luggage.length}`);
  console.log('First 10:');
  luggage.slice(0, 10).forEach(l => console.log(l.id, '|', l.name, '|', l.category, '|', l.image));
  const realLuggage = luggage.filter(l => !l.id.startsWith('meridian') && !l.id.startsWith('passage') && !l.id.startsWith('forma') && !l.id.startsWith('interval'));
  console.log(`Real/curated luggage in DB: ${realLuggage.length}`);
  realLuggage.slice(0, 10).forEach(l => console.log(l.id, '|', l.name, '|', l.category, '|', l.image));
  await client.close();
}
run().catch(console.error);
