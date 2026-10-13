import fs from 'node:fs';

const html = fs.readFileSync('scripts/fixtures/cabin.html', 'utf8');

// Match all data-itemid
const itemIds = [...html.matchAll(/data-itemid="([^"]+)"/g)].map(m => m[1]);
console.log('Total data-itemid found:', itemIds.length, itemIds);

// Extract each product tile
const tileRegex = /<div[^>]*class="[^"]*product-tile[^"]*"([\s\S]*?)<\/div>\s*<\/div>/gi;
let match;
let count = 0;
while ((match = tileRegex.exec(html)) !== null) {
  count++;
  const block = match[0];
  const itemId = block.match(/data-itemid="([^"]+)"/)?.[1];
  const itemName = block.match(/data-itemname="([^"]+)"/)?.[1];
  const itemPrice = block.match(/data-itemprice="([^"]+)"/)?.[1];
  const itemCategory = block.match(/data-itemcategory="([^"]+)"/)?.[1];
  const href = block.match(/href="([^"]+)"/)?.[1];
  const img = block.match(/src="([^"]+)"/)?.[1] || block.match(/data-src="([^"]+)"/)?.[1];
  console.log(`Tile ${count}: ID=${itemId} | Name=${itemName} | Price=${itemPrice} | URL=${href}`);
}
