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
  { name: "Long haul / Long journeys", file: "rimowa-com-2026-09-26-4 (4).csv", tag: "long-haul" },
  { name: "Short trips", file: "rimowa-com-2026-09-26-4 (5).csv", tag: "short-trips" },
  { name: "Polycarbonate", file: "rimowa-com-2026-09-26-4 (7).csv", material: "Polycarbonate" },
  { name: "Aluminium", file: "rimowa-com-2026-09-26-4 (8).csv", material: "Aluminium" },
  { name: "Leather", file: "rimowa-com-2026-09-26-4 (9).csv", material: "Leather" },
  { name: "Silver", file: "rimowa-com-2026-09-26-4 (10).csv", color: "Silver" },
  { name: "Black", file: "rimowa-com-2026-09-26-4 (11).csv", color: "Black" },
  { name: "Blue", file: "rimowa-com-2026-09-26-4 (12).csv", color: "Midnight Blue" },
  { name: "Gifts", file: "rimowa-com-2026-09-26-4 (13).csv", tag: "gifts" },
];

let totalRows = 0;
for (const f of files) {
  const p = path.join("C:/Users/Adarsh/Downloads", f.file);
  if (fs.existsSync(p)) {
    const content = fs.readFileSync(p, "utf8");
    const rows = parseCSV(content).filter(r => r.name);
    console.log(`${f.name} (${f.file}): ${rows.length} valid product rows`);
    totalRows += rows.length;
  } else {
    console.log(`Missing file: ${f.file}`);
  }
}
console.log("Total valid rows across new CSVs:", totalRows);
