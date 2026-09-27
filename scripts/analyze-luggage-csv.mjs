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

const files = [
  { name: "Trunk", file: "rimowa-com-2026-09-26-3.csv", category: "Trunk" },
  { name: "Check-In", file: "rimowa-com-2026-09-26-4.csv", category: "Check-In" },
  { name: "Cabin", file: "rimowa-com-2026-09-26-4 (1).csv", category: "Cabin" },
  { name: "Emblematic pieces", file: "rimowa-com-2026-09-26-4 (2).csv", category: "Emblematic pieces" },
  { name: "All Luggage", file: "rimowa-com-2026-09-26-4 (3).csv", category: "All Luggage" },
];

let allRows = [];
for (const f of files) {
  const p = path.join("C:/Users/Adarsh/Downloads", f.file);
  const content = fs.readFileSync(p, "utf8");
  const rows = parseCSV(content).filter(r => r.name);
  allRows = allRows.concat(rows.map(r => ({ ...r, category: f.category })));
}

console.log("Total rows from CSVs:", allRows.length);

const existingNames = new Set(luggageProducts.map(p => p.name.toLowerCase()));
const existingImages = new Set(luggageProducts.map(p => p.image.toLowerCase()));

let matched = 0;
let newItems = 0;
const newProductList = [];

for (const r of allRows) {
  const nameMatch = existingNames.has(r.name.toLowerCase());
  const imgMatch = r.image && existingImages.has(r.image.toLowerCase());
  if (nameMatch || imgMatch) {
    matched++;
  } else {
    newItems++;
    newProductList.push({ name: r.name, category: r.category, price: r.price, image: r.image });
  }
}

console.log(`Matched with existing luggageProducts: ${matched}, New items: ${newItems}`);
console.log("Unique new product names:", [...new Set(newProductList.map(p => p.name))]);
