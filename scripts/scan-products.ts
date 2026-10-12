import { storefrontCatalog } from '../src/server/storefront-catalog';
import fs from 'fs';
import path from 'path';

async function main() {
  const products = await storefrontCatalog();
  console.log(`Total products returned by storefrontCatalog: ${products.length}`);
  
  const badProducts: any[] = [];
  const fixableProducts: any[] = [];

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

    if (validImgs.length === 0) {
      badProducts.push({
        id: p.id,
        name: p.name,
        slug: p.slug,
        image: p.image,
        variants: p.variants?.map((v: any) => ({ sku: v.sku, image: v.image }))
      });
    } else if (!validImgs.includes(p.image)) {
      fixableProducts.push({
        id: p.id,
        name: p.name,
        slug: p.slug,
        badMain: p.image,
        fallback: validImgs[0]
      });
    }
  }

  console.log(`Total products with NO valid images on disk: ${badProducts.length}`);
  console.log(JSON.stringify(badProducts, null, 2));

  console.log(`Total products with bad main image but valid fallback: ${fixableProducts.length}`);
  console.log(JSON.stringify(fixableProducts, null, 2));
}

main().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
