import { mongo } from '../src/server/db';
import fs from 'fs';
import path from 'path';

async function removeProductsWithoutImage() {
  const client = await mongo();
  const db = client.db(process.env.MONGODB_DB || "ovia");

  const products = await db.collection("products").find({}).toArray();
  console.log(`Checking ${products.length} products in MongoDB...`);

  let removedCount = 0;

  for (const p of products) {
    const allImgs = [
      p.image,
      p.images?.main,
      ...(p.images?.gallery || []),
      ...(p.gallery || []),
      ...(p.variants?.map((v: any) => v.image) || [])
    ].filter(Boolean);

    const validImgs = allImgs.filter(src => {
      if (!src || typeof src !== 'string') return false;
      if (src.startsWith('http://') || src.startsWith('https://')) return true;
      if (src.startsWith('/')) {
        const disk = path.join(process.cwd(), 'public', src);
        return fs.existsSync(disk);
      }
      return false;
    });

    if (validImgs.length === 0 || p.id === "ovia-aero-cabin-test-5730" || p.name?.toLowerCase().includes("test")) {
      console.log(`Removing product without image / test product: ID=${p.id}, name="${p.name}", image="${p.image}"`);
      await db.collection("products").deleteOne({ id: p.id });
      if (p.variants) {
        for (const v of p.variants) {
          await db.collection("inventory").deleteOne({ id: v.sku });
        }
      }
      removedCount++;
    }
  }

  console.log(`Successfully removed ${removedCount} product(s) without images.`);
  await client.close();

  // Also clean .data/store.json if it exists
  const localFile = path.join(process.cwd(), '.data', 'store.json');
  if (fs.existsSync(localFile)) {
    try {
      const state = JSON.parse(fs.readFileSync(localFile, 'utf8'));
      if (Array.isArray(state.products)) {
        state.products = state.products.filter((p: any) => p.id !== "ovia-aero-cabin-test-5730" && !p.name?.toLowerCase().includes("test"));
        fs.writeFileSync(localFile, JSON.stringify(state, null, 2), 'utf8');
        console.log('Cleaned .data/store.json');
      }
    } catch {}
  }
}

removeProductsWithoutImage().catch(console.error);
