import fs from 'node:fs';

const html = fs.readFileSync('scripts/pdp.html', 'utf8');

// 1. JSON-LD in PDP
const jsonLdRegex = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
let match;
while ((match = jsonLdRegex.exec(html)) !== null) {
  try {
    const data = JSON.parse(match[1]);
    console.log('JSON-LD @type:', data['@type']);
    if (data['@type'] === 'Product') {
      console.log('Product JSON-LD:');
      console.log('  Name:', data.name);
      console.log('  Description:', data.description?.slice(0, 100));
      console.log('  SKU:', data.sku);
      console.log('  Brand:', data.brand?.name);
      console.log('  Image:', data.image);
      console.log('  Offers:', data.offers);
    }
  } catch (e) {
    console.log('JSON-LD parse error');
  }
}

// 2. Specifications: Dimensions, Weight, Volume, Materials
const dimensionsMatch = html.match(/(?:measurement|dimensions?)[^<]*<[^>]+>([^<]+)/i) || html.match(/(\d+\s*[xX×]\s*\d+\s*[xX×]\s*\d+\s*(?:cm|in|mm)?)/i);
console.log('Dimensions match:', dimensionsMatch?.[1]);

const weightMatch = html.match(/(\d+(?:\.\d+)?\s*(?:kg|lbs|g))/i);
console.log('Weight match:', weightMatch?.[1]);

const volumeMatch = html.match(/(\d+(?:\.\d+)?\s*(?:L|l|litres|liters))/i);
console.log('Volume/Capacity match:', volumeMatch?.[1]);

// 3. Images in PDP (gallery, zoom, high-res)
const images = Array.from(new Set(html.match(/https:\/\/[^"'\s]+\.(?:png|jpg|jpeg|webp)/gi) || []));
console.log('Images found:', images.length);
console.log('Sample images:', images.filter(img => img.includes('demandware') || img.includes('rimowa')).slice(0, 8));

// 4. Color / Swatches / Variants
const swatches = html.match(/class="[^"]*swatch[^"]*"[^>]*data-url="([^"]+)"/g) || [];
console.log('Swatches count:', swatches.length);
