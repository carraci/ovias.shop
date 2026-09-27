import fs from "fs";
import path from "path";
import { luggageProducts } from "../src/lib/luggage-collection.ts";

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].replace(/^\uFEFF/, "").split(",").map(h => h.trim().replace(/^"|"$/g, ""));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = [];
    let cur = "", inQuotes = false;
    for (let c = 0; c < line.length; c++) {
      const char = line[c];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        cols.push(cur);
        cur = "";
      } else {
        cur += char;
      }
    }
    cols.push(cur);
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = (cols[idx] || "").replace(/^"|"$/g, "").trim();
    });
    rows.push(row);
  }
  return rows;
}

const existingImages = new Set(luggageProducts.map(p => path.basename(p.image).toLowerCase()));

const files = [
  { name: "Leather", file: "rimowa-com-2026-09-26-4 (9).csv" },
  { name: "Silver", file: "rimowa-com-2026-09-26-4 (10).csv" },
  { name: "Black", file: "rimowa-com-2026-09-26-4 (11).csv" },
  { name: "Blue", file: "rimowa-com-2026-09-26-4 (12).csv" },
  { name: "Gifts", file: "rimowa-com-2026-09-26-4 (13).csv" },
];

let totalRows = 0;
let matchedExisting = 0;
let newItems = 0;
const newNames = new Set();

for (const f of files) {
  const p = path.join("C:/Users/Adarsh/Downloads", f.file);
  const rows = parseCSV(fs.readFileSync(p, "utf8")).filter(r => r.name);
  totalRows += rows.length;
  for (const r of rows) {
    const imgBase = path.basename(r.image).toLowerCase();
    if (existingImages.has(imgBase)) {
      matchedExisting++;
    } else {
      newItems++;
      newNames.add(r.name);
    }
  }
  console.log(`${f.name} (${f.file}): ${rows.length} rows`);
}

console.log({ totalRows, matchedExisting, newItems, distinctNewNames: Array.from(newNames) });
