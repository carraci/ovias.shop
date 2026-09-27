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
const outImgDir = path.resolve('public/media/bags');
fs.mkdirSync(outImgDir, { recursive: true });

// Read All Bags (7).csv for master order
const allBagsContent = fs.readFileSync(path.join(dir, 'rimowa-com-2026-09-25-5 (7).csv'), 'utf8');
const allBagsLines = allBagsContent.split(/\r?\n/).filter(l => l.trim().length > 0);
const allBagsHeaders = parseCSVLine(allBagsLines[0]);

const orderedNames = [];
for (let i = 1; i < allBagsLines.length; i++) {
  const vals = parseCSVLine(allBagsLines[i]);
  const row = {};
  allBagsHeaders.forEach((h, idx) => row[h] = vals[idx] || '');
  if (!row.name || !row.name.trim()) continue;
  const cleanName = row.name.trim().replace(/^RIMOWA\s*x\s*/i, 'OVIA x ').replace(/\bRIMOWA\b/gi, 'OVIA');
  if (!orderedNames.includes(cleanName)) {
    orderedNames.push(cleanName);
  }
}

// Category mapping from category-specific CSVs
const categoryFiles = [
  { file: 'rimowa-com-2026-09-25-5.csv', category: 'Backpacks' },
  { file: 'rimowa-com-2026-09-25-5 (1).csv', category: 'Duffle Bags' },
  { file: 'rimowa-com-2026-09-25-5 (2).csv', category: 'Briefcases' },
  { file: 'rimowa-com-2026-09-25-5 (3).csv', category: 'Crossbodies' },
  { file: 'rimowa-com-2026-09-25-5 (4).csv', category: 'Totes' },
  { file: 'rimowa-com-2026-09-25-5 (5).csv', category: 'Shoulder Bags' },
  { file: 'rimowa-com-2026-09-25-5 (6).csv', category: 'Hand Carry' },
];

const categoryMap = new Map();
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
    if (!categoryMap.has(cleanName)) categoryMap.set(cleanName, new Set());
    categoryMap.get(cleanName).add(category);
  }
}

for (const [name] of categoryMap.entries()) {
  if (!orderedNames.includes(name)) orderedNames.push(name);
}

// Read all CSV files to collect all rows per product
const allFiles = fs.readdirSync(dir).filter(f => f.endsWith('.csv'));
const productRows = new Map();

for (const f of allFiles) {
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
    if (!productRows.has(cleanName)) productRows.set(cleanName, []);
    productRows.get(cleanName).push({
      file: f,
      order: row.web_scraper_order,
      price: (row.price || '').trim(),
      image: row.image || '',
      image2: row.image2 || '',
      swatches: [row.image3, row.image4, row.image5].filter(Boolean)
    });
  }
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

function determineMaterial(name) {
  const n = name.toLowerCase();
  if (n.includes('aluminium')) return 'Aluminium';
  if (n.includes('polycarbonate')) return 'Polycarbonate';
  if (n.includes('leather')) return 'Leather';
  if (n.includes('nylon')) return 'Nylon';
  if (n.includes('canvas')) return 'Canvas';
  return 'Leather';
}

function determineCollection(name) {
  if (name.startsWith('Never Still')) return 'Never Still';
  if (name.startsWith('Original')) return 'Original';
  if (name.startsWith('Personal')) return 'Personal';
  if (name.startsWith('Groove')) return 'Groove';
  if (name.startsWith('Attaché') || name.startsWith('Attache')) return 'Attaché';
  if (name.startsWith('Classic')) return 'Classic';
  if (name.startsWith('Travel Accessories')) return 'Travel';
  if (name.startsWith('Specialty')) return 'Specialty';
  if (name.startsWith('OVIA')) return 'Special Edition';
  return 'Never Still';
}

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Download image helper
async function downloadImage(url, filename) {
  if (!url) return null;
  const filePath = path.join(outImgDir, filename);
  if (fs.existsSync(filePath) && fs.statSync(filePath).size > 1000) {
    return `/media/bags/${filename}`;
  }
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
    if (!res.ok) return url;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > 500) {
      fs.writeFileSync(filePath, buf);
      return `/media/bags/${filename}`;
    }
    return url;
  } catch (e) {
    console.warn(`Failed to download ${url}: ${e.message}`);
    return url;
  }
}

// Specs helper
function getProductSpecs(name, primaryCategory) {
  const n = name.toLowerCase();
  if (n.includes('large duffle') || n.includes('duffle bag large')) {
    return { dimensions: '55 × 34 × 24 cm', capacity: '42 L', weight: '1.9 kg' };
  }
  if (n.includes('medium duffle') || n.includes('duffle bag medium')) {
    return { dimensions: '48 × 30 × 22 cm', capacity: '32 L', weight: '1.6 kg' };
  }
  if (n.includes('backpack large') || n.includes('aluminium backpack')) {
    return { dimensions: '44 × 33 × 16 cm', capacity: '23 L', weight: '2.1 kg' };
  }
  if (n.includes('backpack small') || n.includes('backpack medium') || n.includes('zipped backpack')) {
    return { dimensions: '38 × 30 × 14 cm', capacity: '16 L', weight: '1.2 kg' };
  }
  if (n.includes('briefcase') || n.includes('attaché - aluminium briefcase')) {
    return { dimensions: '40 × 35 × 11 cm', capacity: '15 L', weight: '2.4 kg' };
  }
  if (n.includes('tote') || n.includes('shopping bag')) {
    return { dimensions: '42 × 36 × 15 cm', capacity: '22 L', weight: '1.1 kg' };
  }
  if (n.includes('hobo bag')) {
    return { dimensions: '36 × 32 × 12 cm', capacity: '14 L', weight: '0.8 kg' };
  }
  if (n.includes('cross-body bag 19') || n.includes('cross-body bag large')) {
    return { dimensions: '22 × 15 × 7 cm', capacity: '2.3 L', weight: '0.7 kg' };
  }
  if (n.includes('cross-body bag 16') || n.includes('cross-body bag small') || n.includes('personal')) {
    return { dimensions: '20 × 13 × 6.5 cm', capacity: '1.5 L', weight: '0.5 kg' };
  }
  if (n.includes('toiletry') || n.includes('pouch')) {
    return { dimensions: '25 × 16 × 9 cm', capacity: '3.5 L', weight: '0.4 kg' };
  }
  if (n.includes('chess') || n.includes('poker') || n.includes('mahjong')) {
    return { dimensions: '46 × 38 × 12 cm', capacity: '18 L', weight: '4.8 kg' };
  }
  if (n.includes('dartboard')) {
    return { dimensions: '52 × 52 × 14 cm', capacity: '25 L', weight: '5.2 kg' };
  }
  if (n.includes('grid hand-carry case')) {
    return { dimensions: '42 × 34 × 12 cm', capacity: '17 L', weight: '2.8 kg' };
  }
  if (n.includes('pet carrier')) {
    return { dimensions: '45 × 30 × 28 cm', capacity: '35 L', weight: '1.8 kg' };
  }
  if (n.includes('harness backpack')) {
    return { dimensions: '40 × 28 × 12 cm', capacity: '14 L', weight: '0.9 kg' };
  }
  return { dimensions: '42 × 30 × 18 cm', capacity: '20 L', weight: '1.1 kg' };
}

function getProductDescription(name, material, category) {
  const n = name.toLowerCase();
  if (n.includes('aluminium backpack')) {
    return 'Engineered from premium grooved anodized aluminium with precision craftsmanship, full-grain Italian leather accents, and an ergonomically padded shoulder harness. A defining statement for modern urban journeys.';
  }
  if (n.includes('briefcase')) {
    return 'Exquisitely structured with a clean architectural profile, padded laptop compartment, and dual combination closure. Conceived for discerning professionals moving seamlessly between global boardrooms.';
  }
  if (n.includes('duffle')) {
    return 'Generously proportioned for weekend escapes and spontaneous getaways. Features a spacious main compartment, interior zip pocket, reinforced leather handles, and a detachable padded shoulder strap.';
  }
  if (n.includes('cross-body') || n.includes('personal')) {
    return 'A compact hard-shell and leather essential designed for lightweight daily mobility. Houses essentials securely with interior card slots, accordion compartments, and an adjustable webbing strap.';
  }
  if (n.includes('tote') || n.includes('shopping bag')) {
    return 'An elegant, versatile silhouette crafted from supple full-grain leather. Thoughtfully appointed with generous storage, reinforced base, and comfortable shoulder straps for effortless daily transitions.';
  }
  if (n.includes('backpack')) {
    return 'A considered daily carry uniting refined utility and balanced proportions. Features an easy-access flap closure, padded tech sleeve, and breathable back padding for effortless all-day comfort.';
  }
  if (n.includes('chess') || n.includes('poker') || n.includes('mahjong')) {
    return 'A collector piece precision-machined in Germany from grooved anodized aluminium. Contains custom-weighted luxury game pieces nestled in bespoke velvet-lined compartments.';
  }
  if (n.includes('grid hand-carry')) {
    return 'A vintage-inspired archive silhouette re-engineered with modern aircraft-grade aluminium and a distinctive grid profile. Designed for connoisseurs of timeless industrial design.';
  }
  return `A masterfully designed ${category.toLowerCase().replace(/s$/, '')} crafted in ${material.toLowerCase()}. Balanced proportions, enduring hardware, and considered internal organisation for every step of your journey.`;
}

function getProductTags(name, primaryCategory, allCategories, material) {
  const tags = new Set(['bags']);
  const n = name.toLowerCase();
  
  // Category slugs
  allCategories.forEach(c => tags.add(slugify(c)));
  tags.add(slugify(primaryCategory));
  
  // Material tag
  tags.add(material.toLowerCase());
  
  // Journey tags matching the user's menu specification
  if (n.includes('duffle') || n.includes('large flap backpack') || n.includes('pet carrier')) {
    tags.add('short-trips');
    tags.add('travel-bags');
  }
  if (n.includes('duffle bag large') || n.includes('harness backpack')) {
    tags.add('long-haul');
    tags.add('travel-bags');
  }
  if (n.includes('briefcase') || n.includes('backpack') || n.includes('tote')) {
    tags.add('business-selection');
    tags.add('business-bags');
  }
  if (n.includes('cross-body') || n.includes('tote') || n.includes('pouch') || n.includes('shopping bag') || n.includes('hobo')) {
    tags.add('everyday-mobility');
  }
  if (n.includes('toiletry') || n.includes('pouch') || n.includes('personal') || n.includes('chess') || n.includes('grid')) {
    tags.add('gifts');
  }
  if (n.includes('original bag') || n.includes('attaché') || n.includes('chess') || n.includes('poker') || n.includes('mahjong') || n.includes('dartboard') || n.includes('grid')) {
    tags.add('signature-pieces');
  }
  
  return Array.from(tags);
}

function parseColorInfo(imageUrl, index) {
  const url = (imageUrl || '').toLowerCase();
  if (url.includes('silver') || url.includes('93090009') || url.includes('90007001') || url.includes('97390037') || url.includes('93090004') || url.includes('93090001')) {
    return { color: 'Silver', hex: '#bec1bd' };
  }
  if (url.includes('black') || url.includes('52500071') || url.includes('52500072') || url.includes('52525004') || url.includes('99011000') || url.includes('52500096') || url.includes('93090002') || url.includes('90007010') || url.includes('52523009') || url.includes('52500074')) {
    return { color: 'Matte Black', hex: '#222324' };
  }
  if (url.includes('titanium') || url.includes('93090003')) {
    return { color: 'Titanium', hex: '#a69f93' };
  }
  if (url.includes('cognac') || url.includes('dune') || url.includes('52525005') || url.includes('52500073') || url.includes('52500086') || url.includes('52400004')) {
    return { color: 'Desert Sand', hex: '#b5a58b' };
  }
  if (url.includes('olive') || url.includes('green') || url.includes('52525006') || url.includes('52500095') || url.includes('52500079') || url.includes('52100018')) {
    return { color: 'Olive Green', hex: '#435043' };
  }
  if (url.includes('blue') || url.includes('slate') || url.includes('52500087') || url.includes('52500077') || url.includes('52500094') || url.includes('52100019')) {
    return { color: 'Midnight Blue', hex: '#2b3a4a' };
  }
  if (url.includes('grey') || url.includes('graphite') || url.includes('52500076') || url.includes('52400003')) {
    return { color: 'Graphite Grey', hex: '#4b4d4f' };
  }
  if (url.includes('white') || url.includes('ivory') || url.includes('89011660')) {
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

async function run() {
  console.log('Building products...');
  const products = [];
  
  for (let i = 0; i < orderedNames.length; i++) {
    const name = orderedNames[i];
    const rows = productRows.get(name) || [];
    const allCats = Array.from(categoryMap.get(name) || ['Hand Carry']);
    const primaryCategory = allCats[0] || 'Hand Carry';
    const material = determineMaterial(name);
    const collection = determineCollection(name);
    const slug = slugify(name);
    
    // Find best price
    let priceStr = '';
    for (const r of rows) {
      if (r.price) {
        priceStr = r.price;
        break;
      }
    }
    const basePrice = parsePriceToMinor(priceStr, name);
    
    // Primary image from first row
    const firstRow = rows[0] || {};
    const primaryImgUrl = firstRow.image || firstRow.image2;
    const primaryImgPath = await downloadImage(primaryImgUrl, `${slug}.png`);
    
    // Build variants
    // Group rows by unique image to get distinct colorways
    const seenImages = new Set();
    const colorwayRows = [];
    for (const r of rows) {
      const img = r.image;
      if (img && !seenImages.has(img)) {
        seenImages.add(img);
        colorwayRows.push(r);
      }
    }
    if (colorwayRows.length === 0 && primaryImgUrl) {
      colorwayRows.push({ image: primaryImgUrl, price: priceStr });
    }
    
    const variants = [];
    const usedColors = new Set();
    for (let vIdx = 0; vIdx < colorwayRows.length; vIdx++) {
      const cr = colorwayRows[vIdx];
      let colorInfo = parseColorInfo(cr.image, vIdx);
      if (usedColors.has(colorInfo.color)) {
        colorInfo = {
          color: `${colorInfo.color} ${vIdx + 1}`,
          hex: colorInfo.hex
        };
      }
      usedColors.add(colorInfo.color);
      
      const vSku = `OV-${slug.toUpperCase()}-${vIdx}`;
      const vPrice = cr.price ? parsePriceToMinor(cr.price, name) : basePrice;
      const vImg = await downloadImage(cr.image, `${slug}-${vIdx}.png`);
      
      variants.push({
        sku: vSku,
        color: colorInfo.color,
        hex: colorInfo.hex,
        price: vPrice,
        stock: 12,
        image: vImg
      });
    }
    
    // Specs
    const specs = getProductSpecs(name, primaryCategory);
    const description = getProductDescription(name, material, primaryCategory);
    const tags = getProductTags(name, primaryCategory, allCats, material);
    
    products.push({
      id: slug,
      slug,
      name,
      collection,
      department: 'bags',
      category: primaryCategory,
      material,
      description,
      dimensions: specs.dimensions,
      capacity: specs.capacity,
      weight: specs.weight,
      tags,
      variants,
      image: primaryImgPath,
      imageKind: 'photograph',
      featured: i < 6 || name.includes('Aluminium')
    });
  }
  
  console.log(`Successfully generated ${products.length} bag products.`);
  
  // Write to src/lib/bags-collection.ts
  const fileContent = `import type { Product } from "./catalog";

export const bagsProducts: Product[] = ${JSON.stringify(products, null, 2)};
`;
  
  fs.writeFileSync(path.resolve('src/lib/bags-collection.ts'), fileContent, 'utf8');
  console.log('Saved to src/lib/bags-collection.ts');
}

run().catch(e => console.error(e));
