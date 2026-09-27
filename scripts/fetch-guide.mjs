async function run() {
  const res = await fetch('https://www.rimowa.com/in/en/bags-guide', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });
  const html = await res.text();
  const catBlocks = html.match(/<div[^>]*class="[^"]*(?:category|card|guide|tile|grid)[^"]*"[^>]*>[\s\S]*?<\/div>/gi) || [];
  // Search for the 5 categories: Backpacks, Duffle bags, Crossbodies, Totes, Briefcases
  const sections = ['Backpacks', 'Duffle bags', 'Crossbodies', 'Totes', 'Briefcases'];
  for (const s of sections) {
    const idx = html.indexOf(s);
    if (idx !== -1) {
      console.log('=== SECTION:', s);
      const snippet = html.substring(idx - 100, idx + 400);
      console.log(snippet.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '));
      const imgMatch = snippet.match(/src="([^"]+)"/);
      if (imgMatch) console.log('Image:', imgMatch[1]);
    }
  }
}
run();
