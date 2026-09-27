import http from 'http';

const testUrls = [
  '/accessories/address-tags',
  '/accessories/stickers',
  '/accessories/bag-straps',
  '/accessories/wheels',
  '/accessories?category=customisation'
];

function fetchHtml(path) {
  return new Promise((resolve) => {
    http.get(`http://localhost:3000${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
  });
}

async function run() {
  for (const url of testUrls) {
    const html = await fetchHtml(url);
    console.log(`\n========================================`);
    console.log(`URL: ${url}`);
    console.log(`========================================`);
    
    // Extract title
    const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i) || html.match(/<title>([^<]+)<\/title>/i);
    console.log('Page Title:', titleMatch ? titleMatch[1].trim() : 'N/A');

    // Extract product card names and images
    const cardRegex = /<article[^>]*class="[^"]*product-card[^"]*"[^>]*>([\s\S]*?)<\/article>/gi;
    let match;
    let count = 0;
    while ((match = cardRegex.exec(html)) !== null && count < 6) {
      count++;
      const cardHtml = match[1];
      const nameMatch = cardHtml.match(/<h3[^>]*class="[^"]*name[^"]*"[^>]*>([^<]+)<\/h3>/i) || cardHtml.match(/<h2[^>]*>([^<]+)<\/h2>/i) || cardHtml.match(/class="[^"]*title[^"]*"[^>]*>([^<]+)</i);
      const imgMatch = cardHtml.match(/src="([^"]+)"/i);
      const priceMatch = cardHtml.match(/₹[\s\d,.]+/i);
      console.log(`  Item ${count}: ${nameMatch ? nameMatch[1].trim() : 'Unknown'}`);
      console.log(`    Image: ${imgMatch ? imgMatch[1] : 'No image'}`);
      console.log(`    Price: ${priceMatch ? priceMatch[0] : 'N/A'}`);
    }
  }
}

run();
