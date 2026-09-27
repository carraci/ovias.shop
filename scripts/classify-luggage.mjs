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
const allLuggageFile = path.join(dir, 'rimowa-com-2026-09-25-5 (4).csv');
const allLuggageContent = fs.readFileSync(allLuggageFile, 'utf8');
const allLuggageLines = allLuggageContent.split(/\r?\n/).filter(l => l.trim().length > 0);
const allLuggageHeaders = parseCSVLine(allLuggageLines[0]);

for (let i = 28; i < allLuggageLines.length; i++) {
  const vals = parseCSVLine(allLuggageLines[i]);
  const row = {};
  allLuggageHeaders.forEach((h, idx) => row[h] = vals[idx] || '');
  console.log(i, row.name, row.price);
}
