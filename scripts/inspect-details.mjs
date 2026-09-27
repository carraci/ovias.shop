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

const tagRows = parseCSV(fs.readFileSync('C:/Users/Adarsh/Downloads/rimowa-com-2026-09-26-5 (9).csv', 'utf8'));
console.log('--- Address Tags ---');
tagRows.forEach((r, idx) => {
  const img1 = path.basename(r.image || '');
  const swatches = [r.image3, r.image4, r.image5].map(u => u ? path.basename(u) : '').filter(Boolean);
  console.log(`Tag ${idx + 1}: ${img1} | Swatches: ${swatches.join(', ')}`);
});

const p12 = parseCSV(fs.readFileSync('C:/Users/Adarsh/Downloads/rimowa-com-2026-09-26-5 (12).csv', 'utf8'));
const wheels = p12.filter(r => (r.name || '').includes('Wheels'));
console.log('\n--- Wheels ---');
wheels.forEach((r, idx) => {
  const img1 = path.basename(r.image || '');
  const swatches = [r.image2, r.image3, r.image4, r.image5].map(u => u ? path.basename(u) : '').filter(Boolean);
  console.log(`Wheel ${idx + 1}: ${img1} | Swatches: ${swatches.join(', ')}`);
});

const straps = parseCSV(fs.readFileSync('C:/Users/Adarsh/Downloads/rimowa-com-2026-09-26-5 (11).csv', 'utf8'));
console.log('\n--- Straps ---');
straps.forEach((r, idx) => {
  const img1 = path.basename(r.image || '');
  const swatches = [r.image3, r.image4, r.image5].map(u => u ? path.basename(u) : '').filter(Boolean);
  console.log(`Strap ${idx + 1}: ${r.name} | ${img1} | Swatches: ${swatches.join(', ')}`);
});
