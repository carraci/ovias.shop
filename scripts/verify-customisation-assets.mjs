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

let totalImgs = 0, missing = 0;
const missingUrls = [];

customFiles.forEach(file => {
  const content = fs.readFileSync('C:/Users/Adarsh/Downloads/' + file, 'utf8');
  const rows = parseCSV(content);
  rows.forEach(r => {
    ['image', 'image2', 'image3', 'image4', 'image5'].forEach(k => {
      const u = r[k];
      if (u && u.startsWith('http')) {
        totalImgs++;
        const fn = path.basename(new URL(u).pathname);
        if (!fs.existsSync(path.join('public/media/accessories', fn))) {
          missing++;
          missingUrls.push({ fn, u });
        }
      }
    });
  });
});

console.log(`Total URLs checked: ${totalImgs}, Missing files: ${missing}`);
if (missingUrls.length > 0) {
  console.log('Sample missing:', missingUrls.slice(0, 5));
}
