async function test() {
  const u = 'https://www.rimowa.com/in/en/all-luggage';
  const res = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
  console.log(u, 'status:', res.status);
  const text = await res.text();
  const ids = [...text.matchAll(/data-itemid="([^"]+)"/g)].map(m => m[1]);
  console.log('all-luggage without params items:', ids.length);

  // Check for "load more" / "infinite scroll" or pagination buttons in all-luggage
  const showMore = text.match(/show-more|pagination|infinite-scroll|load-more|data-url="([^"]+)"/gi) || [];
  console.log('showMore tokens:', showMore.slice(0, 10));

  const dataUrls = [...text.matchAll(/data-url="([^"]+)"/g)].map(m => m[1]);
  console.log('data-urls count:', dataUrls.length, dataUrls.slice(0, 5));
}
test().catch(console.error);
