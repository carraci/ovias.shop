import fs from "fs";
import path from "path";
import { luggageProducts } from "../src/lib/luggage-collection.ts";
import { bagsProducts } from "../src/lib/bags-collection.ts";

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

const existingLuggageImages = new Set(luggageProducts.map(p => path.basename(p.image).toLowerCase()));
const existingLuggageSlugs = new Set(luggageProducts.map(p => p.slug.toLowerCase()));

console.log("Current luggageProducts count:", luggageProducts.length);
console.log("Current bagsProducts count:", bagsProducts.length);

const targetFiles = [
  { name: "Long Journeys", file: "rimowa-com-2026-09-26-4 (4).csv" },
  { name: "Short Trips", file: "rimowa-com-2026-09-26-4 (5).csv" },
  { name: "Polycarbonate", file: "rimowa-com-2026-09-26-4 (7).csv" },
  { name: "Aluminium", file: "rimowa-com-2026-09-26-4 (8).csv" },
];

let totalValid = 0;
let matchedExisting = 0;
let newItems = 0;
const newNames = new Set();

for (const tf of targetFiles) {
  const p = path.join("C:/Users/Adarsh/Downloads", tf.file);
  const rows = parseCSV(fs.readFileSync(p, "utf8")).filter(r => r.name);
  totalValid += rows.length;
  for (const r of rows) {
    const imgBase = path.basename(r.image).toLowerCase();
    if (existingLuggageImages.has(imgBase)) {
      matchedExisting++;
    } else {
      newItems++;
      newNames.add(r.name);
    }
  }
}

console.log({ totalValid, matchedExisting, newItems, distinctNewNames: newNames.size });
console.log("Distinct new item names:", Array.from(newNames));
