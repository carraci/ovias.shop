import fs from 'node:fs';

async function test() {
  const url = 'https://www.rimowa.com/in/en/cabin-size/';
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    }
  });
  console.log('Status:', res.status);
  const html = await res.text();
  console.log('Length:', html.length);
  fs.writeFileSync('scripts/fixtures/sample-page.html', html);
  
  // Find product links
  const links = new Set();
  const linkRegex = /href="(\/in\/en\/[^"]+)"/g;
  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    if (match[1].includes('/cabin') || match[1].includes('/luggage') || match[1].endsWith('.html')) {
      links.add(match[1]);
    }
  }
  console.log('Links found count:', links.size);
  console.log('Sample links:', Array.from(links).slice(0, 15));

  // Check for JSON-LD or data attributes
  const scripts = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
  console.log('JSON-LD scripts count:', scripts ? scripts.length : 0);
  if (scripts) {
    scripts.forEach((s, idx) => {
      const clean = s.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
      try {
        const parsed = JSON.parse(clean);
        console.log(`JSON-LD ${idx} type:`, parsed['@type']);
        if (parsed['@type'] === 'ItemList' || parsed.itemListElement) {
          console.log(`ItemList elements:`, parsed.itemListElement?.length);
          console.log('Sample item:', JSON.stringify(parsed.itemListElement?.[0], null, 2));
        }
      } catch (e) {
        console.log(`JSON-LD ${idx} parse error`);
      }
    });
  }
}

test().catch(console.error);
