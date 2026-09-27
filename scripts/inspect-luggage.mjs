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

const allRows = [];
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
    allRows.push({
      file: f,
      url: row.web_scraper_start_url,
      order: row.web_scraper_order,
      name: row.name.trim().replace(/^RIMOWA\s*x\s*/i, 'OVIA x ').replace(/\bRIMOWA\b/gi, 'OVIA'),
      price: (row.price || '').trim(),
      image: row.image || '',
      image2: row.image2 || '',
      swatches: [row.image3, row.image4, row.image5].filter(Boolean)
    });
  }
}

console.log('Total rows in luggage CSVs:', allRows.length);

// Read All Luggage (4).csv for master order
const allLuggageFile = path.join(dir, 'rimowa-com-2026-09-25-5 (4).csv');
const allLuggageContent = fs.readFileSync(allLuggageFile, 'utf8');
const allLuggageLines = allLuggageContent.split(/\r?\n/).filter(l => l.trim().length > 0);
const allLuggageHeaders = parseCSVLine(allLuggageLines[0]);

const orderedLuggageNames = [];
for (let i = 1; i < allLuggageLines.length; i++) {
  const vals = parseCSVLine(allLuggageLines[i]);
  const row = {};
  allLuggageHeaders.forEach((h, idx) => row[h] = vals[idx] || '');
  if (!row.name || !row.name.trim()) continue;
  const cleanName = row.name.trim().replace(/^RIMOWA\s*x\s*/i, 'OVIA x ').replace(/\bRIMOWA\b/gi, 'OVIA');
  if (!orderedLuggageNames.includes(cleanName)) {
    orderedLuggageNames.push(cleanName);
  }
}

// Add any other products found in other files
for (const r of allRows) {
  if (!orderedLuggageNames.includes(r.name)) {
    orderedLuggageNames.push(r.name);
  }
}

console.log(`Unique luggage products count: ${orderedLuggageNames.length}`);
orderedLuggageNames.forEach((n, idx) => {
  const rowWithPrice = allRows.find(r => r.name === n && r.price);
  console.log(`${idx + 1}. ${n} | Price: ${rowWithPrice ? rowWithPrice.price : 'NO_PRICE'}`);
});
