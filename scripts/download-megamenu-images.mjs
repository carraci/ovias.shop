import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const urls = {
  // New Mega Menu
  'mega-new-original-bags.jpg': 'https://www.rimowa.com/on/demandware.static/-/Library-Sites-RimowaSharedLibrary/default/dw172b79da/images/megamenu/inspirational/MM_NEW_THUMBNAIL_OGBACKPACKBLACK_24092026.jpg',
  'mega-new-never-still.jpg': 'https://www.rimowa.com/on/demandware.static/-/Library-Sites-RimowaSharedLibrary/default/dwfb3221f7/images/megamenu/inspirational/MM_NEW_THUMBNAIL_NSANTHRACITEMOCHA_02092026.jpg',
  'mega-new-distinct.jpg': 'https://www.rimowa.com/on/demandware.static/-/Library-Sites-RimowaSharedLibrary/default/dw0b723cb3/images/megamenu/inspirational/MM_NEW_THUMBNAIL_DISTINCTANTHRGREY_02092026.jpg',

  // Luggage Mega Menu
  'mega-luggage-original.png': 'https://www.rimowa.com/on/demandware.static/-/Library-Sites-RimowaSharedLibrary/default/dw19f1d545/images/product/small/MM_THUMBNAILS_ORIGINAL_02092026.png',
  'mega-luggage-essential.png': 'https://www.rimowa.com/on/demandware.static/-/Library-Sites-RimowaSharedLibrary/default/dw7c21f631/images/product/small/MM_THUMBNAILS_ESSENTIAL_23072026.png',
  'mega-luggage-classic.png': 'https://www.rimowa.com/on/demandware.static/-/Library-Sites-RimowaSharedLibrary/default/dw0fd7f78d/images/product/small/MM_THUMBNAILS_CLASSIC2.png',
  'mega-luggage-essential-sleeve.png': 'https://www.rimowa.com/on/demandware.static/-/Library-Sites-RimowaSharedLibrary/default/dw119f3394/images/product/small/MM_THUMBNAILS_ESSENTIALSLEEVE_2.png',
  'mega-luggage-distinct.png': 'https://www.rimowa.com/on/demandware.static/-/Library-Sites-RimowaSharedLibrary/default/dw2425f6b6/images/product/small/MM_THUMBNAILS_DISTINCT_02092026.png',
  'mega-luggage-hybrid.png': 'https://www.rimowa.com/on/demandware.static/-/Library-Sites-RimowaSharedLibrary/default/dw31f50e14/images/product/small/MM_THUMBNAILS_HYBRID_27082026.png',
  'mega-luggage-essential-lite.png': 'https://www.rimowa.com/on/demandware.static/-/Library-Sites-RimowaSharedLibrary/default/dw5ae02ac9/images/product/small/MM_THUMBNAILS_ESSENTIALLITE.png'
};

const outDir = 'public/media/megamenu';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function downloadAll() {
  for (const [filename, url] of Object.entries(urls)) {
    // Check if medium / large url exists for luggage
    let fetchUrl = url;
    if (url.includes('/images/product/small/')) {
      const mediumUrl = url.replace('/images/product/small/', '/images/product/medium/');
      try {
        const testRes = await fetch(mediumUrl, { method: 'HEAD', headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (testRes.status === 200) {
          fetchUrl = mediumUrl;
          console.log('Found medium version for', filename);
        }
      } catch (e) {}
    }

    try {
      const res = await fetch(fetchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
          'Accept': 'image/png,image/jpeg,image/webp,image/*,*/*;q=0.8',
          'Referer': 'https://www.rimowa.com/'
        }
      });
      const buffer = Buffer.from(await res.arrayBuffer());
      const metadata = await sharp(buffer).metadata();
      const targetPath = path.join(outDir, filename);
      fs.writeFileSync(targetPath, buffer);
      console.log(`Saved ${filename}: ${metadata.width}x${metadata.height}, format: ${metadata.format}, size: ${buffer.length} bytes`);
    } catch (err) {
      console.error(`Failed ${filename}:`, err);
    }
  }
}

downloadAll();
