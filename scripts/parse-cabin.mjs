import fs from 'node:fs';

const html = fs.readFileSync('scripts/cabin.html', 'utf8');

// 1. JSON-LD scripts
const jsonLdRegex = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let count = 0;
while ((match = jsonLdRegex.exec(html)) !== null) {
  count++;
  try {
    const data = JSON.parse(match[1]);
    console.log(`JSON-LD ${count} @type:`, data['@type']);
    if (data['@type'] === 'ItemList') {
      console.log(`ItemList has ${data.itemListElement?.length} items`);
      console.log('Sample item:', data.itemListElement?.[0]);
    }
    if (data['@type'] === 'Product') {
      console.log('Product:', data.name, data.offers?.price);
    }
  } catch (e) {
    console.log(`JSON-LD ${count} parse error`);
  }
}

// 2. Product tiles / data-pid / product-tile
const tiles = html.match(/<div[^>]*class="[^"]*product-tile[^"]*"[^>]*>[\s\S]*?<\/div>/gi) || [];
console.log('Product tile elements found:', tiles.length);

// 3. Search for data-pid, data-itemid, or similar
const pids = html.match(/data-pid="([^"]+)"/g) || [];
console.log('data-pid occurrences:', pids.length, pids.slice(0, 10));

// 4. Search for links to products
const prodLinks = new Set();
const linkRegex = /href="([^"]*\/luggage\/[^"]*|[^"]*\.html)"/g;
while ((match = linkRegex.exec(html)) !== null) {
  prodLinks.add(match[1]);
}
console.log('Product link candidates:', prodLinks.size, Array.from(prodLinks).slice(0, 10));

// 5. Look for window.__INITIAL_STATE__ or CQuotient or dw analytics
const scriptData = html.match(/window\.(?:__PRELOADED_STATE__|__INITIAL_STATE__|dataLayer)\s*=\s*([^\n;]+)/g) || [];
console.log('Preloaded state scripts:', scriptData.length);
