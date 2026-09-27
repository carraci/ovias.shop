import fs from 'fs';
import path from 'path';

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].replace(/^\uFEFF/, '').split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = [];
    let cur = '', inQuotes = false;
    for (let c = 0; c < line.length; c++) {
      const char = line[c];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        cols.push(cur);
        cur = '';
      } else {
        cur += char;
      }
    }
    cols.push(cur);
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = (cols[idx] || '').replace(/^"|"$/g, '').trim();
    });
    if (row.name) rows.push(row);
  }
  return rows;
}

const customFiles = [
  'rimowa-com-2026-09-26-5 (9).csv',
  'rimowa-com-2026-09-26-5 (10).csv',
  'rimowa-com-2026-09-26-5 (11).csv',
  'rimowa-com-2026-09-26-5 (12).csv'
];

const seenMainImages = new Map();
const bySubcat = {
  'address-tags': [],
  'stickers': [],
  'bag-straps': [],
  'wheels': []
};

customFiles.forEach(file => {
  const p = 'C:/Users/Adarsh/Downloads/' + file;
  if (!fs.existsSync(p)) return;
  const rows = parseCSV(fs.readFileSync(p, 'utf8'));
  rows.forEach(r => {
    const img1 = r.image ? path.basename(new URL(r.image).pathname) : '';
    if (!img1 || seenMainImages.has(img1)) return;
    seenMainImages.set(img1, r);

    const name = r.name || '';
    if (name.includes('Address Tag')) {
      bySubcat['address-tags'].push({ ...r, img1 });
    } else if (name.includes('Sticker')) {
      bySubcat['stickers'].push({ ...r, img1 });
    } else if (name.includes('Strap')) {
      bySubcat['bag-straps'].push({ ...r, img1 });
    } else if (name.includes('Wheel')) {
      bySubcat['wheels'].push({ ...r, img1 });
    }
  });
});

console.log('Unique customisation products by subcategory:');
console.log('Address Tags:', bySubcat['address-tags'].length);
console.log('Stickers:', bySubcat['stickers'].length);
console.log('Bag Straps:', bySubcat['bag-straps'].length);
console.log('Wheels:', bySubcat['wheels'].length);
console.log('TOTAL customisation:', Object.values(bySubcat).reduce((acc, v) => acc + v.length, 0));
