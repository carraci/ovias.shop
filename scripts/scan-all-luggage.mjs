import fs from 'node:fs';
import path from 'node:path';

function parseCSVLine(line) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur.trim());
  return result;
}

const dir = 'C:/Users/Adarsh/Downloads/luggage';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.csv'));

function isLuggage(name) {
  const n = name.toLowerCase();
  if (n.includes('iphone') || n.includes('case for iphone') || n.includes('sunglasses') || 
      n.includes('belt') || n.includes('card holder') || n.includes('backpack') || 
      n.includes('duffle') || n.includes('briefcase') || n.includes('cross-body') || 
      n.includes('tote') || n.includes('shopping bag') || n.includes('hobo bag') || 
      n.includes('pouch') || n.includes('packing cube') || n.includes('sticker') || 
      n.includes('wheels set') || n.includes('pet carrier') || n.includes('address tag') ||
      n.includes('hanger') || n.includes('violin') || n.includes('trumpet') || 
      n.includes('chess') || n.includes('poker') || n.includes('mahjong') || 
      n.includes('dartboard') || n.includes('toiletry') || n.includes('harness') ||
      n.includes('hand-carry case') || n.includes('watch case') || n.includes('jewellery case') ||
      n.includes('one bottle case') || n.includes('twelve bottle case') || n.includes('vanity case')) {
    return false;
  }
  return true;
}

const allLuggageMap = new Map();

for (const f of files) {
  const content = fs.readFileSync(path.join(dir, f), 'utf8');
  const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length < 2) continue;
  const headers = parseCSVLine(lines[0]);
  for (let i = 1; i < lines.length; i++) {
    const vals = parseCSVLine(lines[i]);
    const row = {};
    headers.forEach((h, idx) => row[h] = vals[idx] || '');
    if (!row.name || !row.name.trim()) continue;
    const cleanName = row.name.trim().replace(/^RIMOWA\s*x\s*/i, 'OVIA x ').replace(/\bRIMOWA\b/gi, 'OVIA');
    if (!isLuggage(cleanName)) continue;
    
    if (!allLuggageMap.has(cleanName)) {
      allLuggageMap.set(cleanName, {
        name: cleanName,
        sources: new Set([row.web_scraper_start_url]),
        files: new Set([f]),
        prices: new Set(),
        images: new Set()
      });
    }
    const item = allLuggageMap.get(cleanName);
    item.sources.add(row.web_scraper_start_url);
    item.files.add(f);
    if (row.price && row.price.trim()) item.prices.add(row.price.trim());
    if (row.image) item.images.add(row.image);
    if (row.image2) item.images.add(row.image2);
  }
}

console.log(`Total unique Luggage models across all files: ${allLuggageMap.size}`);

const cabin = [];
const checkIn = [];
const trunk = [];

for (const [name, info] of allLuggageMap.entries()) {
  const n = name.toLowerCase();
  let cat = 'Check-In';
  if (n.includes('trunk')) {
    cat = 'Trunk';
    trunk.push({ name, info });
  } else if (n.includes('cabin') || n.includes('compact') || n.includes('pilot')) {
    cat = 'Cabin';
    cabin.push({ name, info });
  } else {
    checkIn.push({ name, info });
  }
}

console.log(`\n=== CABIN (${cabin.length}) ===`);
cabin.forEach(c => console.log(`  - ${c.name} | ${Array.from(c.info.prices)[0] || 'NO_PRICE'} | ${c.info.images.size} imgs`));

console.log(`\n=== CHECK-IN (${checkIn.length}) ===`);
checkIn.forEach(c => console.log(`  - ${c.name} | ${Array.from(c.info.prices)[0] || 'NO_PRICE'} | ${c.info.images.size} imgs`));

console.log(`\n=== TRUNK (${trunk.length}) ===`);
trunk.forEach(c => console.log(`  - ${c.name} | ${Array.from(c.info.prices)[0] || 'NO_PRICE'} | ${c.info.images.size} imgs`));
