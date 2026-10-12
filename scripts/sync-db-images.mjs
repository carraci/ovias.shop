import { MongoClient } from 'mongodb';
import { luggageProducts } from '../src/lib/luggage-collection.ts';

if (process.env.MONGODB_URI) {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'ovia');
    const col = db.collection('products');

    let fixedCount = 0;
    for (const p of luggageProducts) {
      const match = await col.findOne({ $or: [{ slug: p.slug }, { id: p.id }] });
      if (match) {
        // If match has outdated or broken image, sync with verified static luggage
        if (match.image !== p.image || JSON.stringify(match.variants) !== JSON.stringify(p.variants)) {
          await col.updateOne(
            { _id: match._id },
            {
              $set: {
                image: p.image,
                variants: p.variants,
              }
            }
          );
          fixedCount++;
        }
      }
    }
    console.log(`Synced ${fixedCount} MongoDB documents with verified static luggage images.`);
  } finally {
    await client.close();
  }
}
