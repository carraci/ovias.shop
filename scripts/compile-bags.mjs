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

const dir = 'C:/Users/Adarsh/Downloads/bags';

// Helper to determine color name & hex from image/swatch URL or SKU
function parseColorInfo(imageUrl, index) {
  const url = (imageUrl || '').toLowerCase();
  if (url.includes('silver') || url.includes('93090009') || url.includes('90007001') || url.includes('97390037')) {
    return { color: 'Silver', hex: '#bec1bd' };
  }
  if (url.includes('black') || url.includes('52500071') || url.includes('52500072') || url.includes('52525004') || url.includes('99011000') || url.includes('52500096')) {
    return { color: 'Matte Black', hex: '#222324' };
  }
  if (url.includes('titanium') || url.includes('93090003')) {
    return { color: 'Titanium', hex: '#a69f93' };
  }
  if (url.includes('cognac') || url.includes('dune') || url.includes('52525005') || url.includes('52500073') || url.includes('52500086')) {
    return { color: 'Desert Sand', hex: '#b5a58b' };
  }
  if (url.includes('olive') || url.includes('green') || url.includes('52525006') || url.includes('52500095') || url.includes('52500079')) {
    return { color: 'Forest Green', hex: '#435043' };
  }
  if (url.includes('blue') || url.includes('slate') || url.includes('52500087') || url.includes('52500077') || url.includes('52500094')) {
    return { color: 'Midnight Blue', hex: '#2b3a4a' };
  }
  if (url.includes('grey') || url.includes('graphite') || url.includes('52500076') || url.includes('52500074')) {
    return { color: 'Graphite Grey', hex: '#4b4d4f' };
  }
  if (url.includes('white') || url.includes('ivory')) {
    return { color: 'Ivory White', hex: '#eceae4' };
  }
  
  const palette = [
    { color: 'Matte Black', hex: '#222324' },
    { color: 'Silver', hex: '#bec1bd' },
    { color: 'Desert Sand', hex: '#b5a58b' },
    { color: 'Midnight Blue', hex: '#2b3a4a' },
    { color: 'Forest Green', hex: '#435043' },
    { color: 'Graphite Grey', hex: '#4b4d4f' }
  ];
  return palette[index % palette.length];
}

const defaultPrices = {
  'Never Still - Leather Duffle Bag Large': 24500000,
  'Never Still - Leather Duffle Bag Medium': 21500000,
  'Never Still - Leather Flap Backpack Small': 21000000,
  'Never Still - Nylon Zipped Backpack Medium': 15500000,
  'Never Still - Leather Zipped Tote': 21000000,
  'Never Still - Leather Cross-Body Bag Small': 12500000,
  'Personal - Polycarbonate Cross-Body Bag': 11500000,
  'Groove - Leather Zipped Pouch': 6500000,
  'Classic Aluminium Grid Hand-Carry Case': 19500000,
  'Attaché - Aluminium Poker': 42500000,
  'Attaché - Aluminium Mahjong': 49500000,
  'Specialty Dartboard Case': 28500000,
};

function parsePriceToMinor(priceStr, productName) {
  if (!priceStr || !priceStr.trim()) {
    return defaultPrices[productName] || 18500000;
  }
  const digits = priceStr.replace(/[^0-9.]/g, '');
  const val = parseFloat(digits);
  if (isNaN(val)) return defaultPrices[productName] || 18500000;
  return Math.round(val * 100);
}

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// 1. Read All Bags (7).csv to get the master catalog order
const allBagsFile = path.join(dir, 'rimowa-com-2026-09-25-5 (7).csv');
const allBagsContent = fs.readFileSync(allBagsFile, 'utf8');
const allBagsLines = allBagsContent.split(/\r?\n/).filter(l => l.trim().length > 0);
const allBagsHeaders = parseCSVLine(allBagsLines[0]);

// Collect rows across all CSV files to have full data
const categoryFiles = [
  { file: 'rimowa-com-2026-09-25-5.csv', category: 'Backpacks' },
  { file: 'rimowa-com-2026-09-25-5 (1).csv', category: 'Duffle Bags' },
  { file: 'rimowa-com-2026-09-25-5 (2).csv', category: 'Briefcases' },
  { file: 'rimowa-com-2026-09-25-5 (3).csv', category: 'Crossbodies' },
  { file: 'rimowa-com-2026-09-25-5 (4).csv', category: 'Totes' },
  { file: 'rimowa-com-2026-09-25-5 (5).csv', category: 'Shoulder Bags' },
  { file: 'rimowa-com-2026-09-25-5 (6).csv', category: 'Hand Carry' },
];

const categoryLookup = new Map(); // productName -> Set of categories
for (const { file, category } of categoryFiles) {
  const content = fs.readFileSync(path.join(dir, file), 'utf8');
  const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
  const headers = parseCSVLine(lines[0]);
  for (let i = 1; i < lines.length; i++) {
    const vals = parseCSVLine(lines[i]);
    const row = {};
    headers.forEach((h, idx) => row[h] = vals[idx] || '');
    if (!row.name || !row.name.trim()) continue;
    const cleanName = row.name.trim().replace(/^RIMOWA\s*x\s*/i, 'OVIA x ').replace(/\bRIMOWA\b/gi, 'OVIA');
    if (!categoryLookup.has(cleanName)) categoryLookup.set(cleanName, new Set());
    categoryLookup.get(cleanName).add(category);
  }
}

// Inspect gathered categories
console.log('Category lookup count:', categoryLookup.size);
for (const [k, v] of categoryLookup.entries()) {
  console.log(`  ${k} -> [${Array.from(v).join(', ')}]`);
}
