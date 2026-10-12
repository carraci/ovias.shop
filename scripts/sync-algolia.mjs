import { MongoClient } from 'mongodb';
import { algoliasearch } from 'algoliasearch';
import { products as staticProducts } from '../src/lib/catalog.ts';

const appId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID;
const writeKey = process.env.ALGOLIA_WRITE_KEY;
const indexName = process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME || 'ovia_products';

async function sync() {
  if (!appId || !writeKey) throw new Error("Algolia app ID and write key must be configured.");
  console.log(`[Algolia Sync] Connecting to Algolia App ${appId}, Index: ${indexName}`);
  const client = algoliasearch(appId, writeKey);

  // 1. Configure settings
  await client.setSettings({
    indexName,
    indexSettings: {
      searchableAttributes: [
        'name',
        'category',
        'subcategory',
        'material',
        'color',
        'department',
        'tags',
        'description',
        'sku',
      ],
      attributesForFaceting: [
        'searchable(department)',
        'searchable(category)',
        'searchable(material)',
        'searchable(color)',
        'filterOnly(price)',
      ],
      customRanking: ['desc(price)'],
    },
  });

  // 2. Gather products from DB (or fallback static)
  let allProducts = [];
  if (process.env.MONGODB_URI) {
    const mongo = new MongoClient(process.env.MONGODB_URI);
    try {
      await mongo.connect();
      const db = mongo.db(process.env.MONGODB_DB || 'ovia');
      const docs = await db.collection('products').find({}).toArray();
      if (docs && docs.length > 0) {
        allProducts = docs;
        console.log(`[Algolia Sync] Loaded ${docs.length} products from MongoDB`);
      }
    } catch (err) {
      console.warn('[Algolia Sync] MongoDB connection failed, using static catalog:', err.message);
    } finally {
      await mongo.close();
    }
  }

  if (allProducts.length === 0) {
    allProducts = staticProducts;
    console.log(`[Algolia Sync] Loaded ${staticProducts.length} static products`);
  }

  // 3. Format Algolia records
  const objects = allProducts.map((p) => {
    return {
      objectID: String(p.id || p.sku || p.slug),
      id: String(p.id || p.sku || p.slug),
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      department: p.department || (p.category === 'luggage' ? 'luggage' : 'bags'),
      category: p.category,
      subcategory: p.subcategory || p.subCategory,
      material: p.material,
      color: p.color,
      price: typeof p.price === 'number' ? p.price : (p.variants?.[0]?.price ?? 0),
      image: p.image || (Array.isArray(p.images) ? p.images[0] : '/media/pdp/hero_main.png'),
      images: Array.isArray(p.images) ? p.images.slice(0, 4) : undefined,
      description: p.description || p.summary || '',
      dimensions: p.dimensions,
      volume: p.volume,
      weight: p.weight,
      tags: Array.isArray(p.tags) ? p.tags : [],
    };
  });

  console.log(`[Algolia Sync] Uploading ${objects.length} records to index '${indexName}'...`);
  const response = await client.saveObjects({
    indexName,
    objects,
  });

  console.log(`[Algolia Sync] Successfully indexed ${objects.length} products to Algolia!`, response);
}

sync().catch((err) => {
  console.error('[Algolia Sync Error]', err);
  process.exit(1);
});