import fs from 'node:fs';

const html = fs.readFileSync('scripts/cabin.html', 'utf8');

const prodBlocks = html.match(/<div[^>]*class="[^"]*product-tile[^"]*"[^>]*>[\s\S]*?<\/div>\s*<\/div>/gi) || [];
console.log('prodBlocks:', prodBlocks.length);
if (prodBlocks.length > 0) {
  console.log('Sample block (first 1000 chars):');
  console.log(prodBlocks[0].slice(0, 1000));
}

// Also check for all URLs ending in digits followed by .html
const productUrls = Array.from(new Set(html.match(/https:\/\/www\.rimowa\.com\/in\/en\/luggage\/[^\s"']+\/[0-9]+\.html/g) || []));
console.log('Luggage Product URLs ending in [id].html count:', productUrls.length);
console.log(productUrls.slice(0, 10));

// Also let's check relative urls
const relativeUrls = Array.from(new Set(html.match(/\/in\/en\/luggage\/[^\s"']+\/[0-9]+\.html/g) || []));
console.log('Relative Luggage URLs:', relativeUrls.length);
console.log(relativeUrls.slice(0, 10));
