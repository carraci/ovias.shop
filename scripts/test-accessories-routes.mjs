const routes = [
  'http://localhost:3000/accessories/iphone-cases',
  'http://localhost:3000/accessories/hats',
  'http://localhost:3000/accessories/sunglasses',
  'http://localhost:3000/accessories/belts',
  'http://localhost:3000/accessories/card-holders'
];

async function testAll() {
  for (const url of routes) {
    const res = await fetch(url);
    const html = await res.text();
    const count = (html.match(/href="\/products\//g) || []).length;
    const hasMedia = html.includes('/media/accessories/');
    console.log(`URL: ${url}`);
    console.log(`  Status: ${res.status}`);
    console.log(`  Rendered products count: ${count}`);
    console.log(`  Contains HD local accessories media: ${hasMedia}`);
  }
}

testAll().catch(console.error);
