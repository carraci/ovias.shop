async function test() {
  const urls = [
    'https://www.rimowa.com/in/en/cabin-size?sz=100',
    'https://www.rimowa.com/in/en/cabin-size?start=0&sz=100',
    'https://www.rimowa.com/in/en/all-luggage?sz=100',
  ];
  for (const u of urls) {
    const res = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
    const text = await res.text();
    const ids = [...text.matchAll(/data-itemid="([^"]+)"/g)].map(m => m[1]);
    console.log(u, '=> items:', ids.length);
  }
}
test().catch(console.error);
