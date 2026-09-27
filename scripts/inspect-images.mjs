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
  "rimowa-com-2026-09-26-4 (4).csv",
  "rimowa-com-2026-09-26-4 (5).csv",
  "rimowa-com-2026-09-26-4 (7).csv",
  "rimowa-com-2026-09-26-4 (8).csv",
];

for (const file of files) {
  const content = fs.readFileSync(path.join("C:/Users/Adarsh/Downloads", file), "utf8");
  const rows = parseCSV(content).filter(r => r.name);
  console.log(`\n--- ${file} (${rows.length} rows) ---`);
  rows.slice(0, 3).forEach(r => {
    console.log("Name:", r.name, "| Price:", r.price);
    console.log("  Medium:", r.image);
    console.log("  Large HD:", r.image ? r.image.replace("/images/medium/", "/images/large/") : "None");
  });
}
