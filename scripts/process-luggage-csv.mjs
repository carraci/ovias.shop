import fs from "fs";
import path from "path";

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
const byFile = {};
for (const f of files) {
  const p = path.join("C:/Users/Adarsh/Downloads", f.file);
  const content = fs.readFileSync(p, "utf8");
  const rows = parseCSV(content).filter(r => r.name);
  byFile[f.name] = rows.length;
  allRows = allRows.concat(rows.map(r => ({ ...r, sourceCategory: f.category })));
}

console.log("Counts per file:", byFile);
console.log("Total products with names:", allRows.length);

const uniqueImages = new Set();
allRows.forEach(r => {
  if (r.image) uniqueImages.add(r.image);
  if (r.image2) uniqueImages.add(r.image2);
});
console.log("Unique product images:", uniqueImages.size);

// Check sample product
console.log("Sample product:", allRows[0]);
