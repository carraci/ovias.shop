import fs from "fs";

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
    if (row.name) rows.push(row);
  }
  return rows;
}

const customFiles = [
  { name: "Address Tags", file: "rimowa-com-2026-09-26-5 (9).csv" },
  { name: "Stickers", file: "rimowa-com-2026-09-26-5 (10).csv" },
  { name: "Bag Straps", file: "rimowa-com-2026-09-26-5 (11).csv" },
  { name: "All Customisation", file: "rimowa-com-2026-09-26-5 (12).csv" },
  { name: "Lifestyle", file: "rimowa-com-2026-09-26-5 (13).csv" },
];

customFiles.forEach(cf => {
  const p = "C:/Users/Adarsh/Downloads/" + cf.file;
  if (!fs.existsSync(p)) return;
  const rows = parseCSV(fs.readFileSync(p, "utf8"));
  console.log(`\n=== File: ${cf.file} (${cf.name}) - Count: ${rows.length} ===`);
  rows.slice(0, 5).forEach((r, idx) => {
    console.log(`  ${idx + 1}. [${r.name}] Price: ${r.price || "N/A"}`);
    console.log(`     Img1: ${r.image}`);
  });
});
