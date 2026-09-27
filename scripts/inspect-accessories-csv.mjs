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

const map = [
  { cat: "iPhone Cases", file: "rimowa-com-2026-09-26-5 (4).csv" },
  { cat: "Hats", file: "rimowa-com-2026-09-26-5 (5).csv" },
  { cat: "Sunglasses", file: "rimowa-com-2026-09-26-5 (6).csv" },
  { cat: "Belts", file: "rimowa-com-2026-09-26-5 (7).csv" },
  { cat: "Card Holders", file: "rimowa-com-2026-09-26-5 (8).csv" }
];

map.forEach(m => {
  const content = fs.readFileSync("C:/Users/Adarsh/Downloads/" + m.file, "utf8");
  const rows = parseCSV(content);
  console.log(`\n=== ${m.cat} (Count: ${rows.length}) ===`);
  rows.forEach((r, idx) => {
    console.log(`${idx + 1}. [${r.name}] Price: ${r.price || "N/A"}`);
    console.log(`   Img1: ${r.image || "N/A"}`);
    console.log(`   Img2: ${r.image2 || "N/A"}`);
  });
});
