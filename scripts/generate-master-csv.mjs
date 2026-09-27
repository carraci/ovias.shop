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

function toHD(url) {
  if (!url) return "";
  return url.replace("/images/medium/", "/images/large/");
}

const fileConfigs = [
  {
    category: "Trunk",
    pageUrl: "http://localhost:3000/luggage/trunk",
    file: "rimowa-com-2026-09-26-3.csv",
  },
  {
    category: "Check-In",
    pageUrl: "http://localhost:3000/luggage/check-in",
    file: "rimowa-com-2026-09-26-4.csv",
  },
  {
    category: "Cabin",
    pageUrl: "http://localhost:3000/luggage/cabin",
    file: "rimowa-com-2026-09-26-4 (1).csv",
  },
  {
    category: "Emblematic pieces",
    pageUrl: "http://localhost:3000/luggage/emblematic-pieces",
    file: "rimowa-com-2026-09-26-4 (2).csv",
  },
  {
    category: "See all luggage",
    pageUrl: "http://localhost:3000/luggage",
    file: "rimowa-com-2026-09-26-4 (3).csv",
  },
];

const masterRows = [];

for (const cfg of fileConfigs) {
  const p = path.join("C:/Users/Adarsh/Downloads", cfg.file);
  if (!fs.existsSync(p)) {
    console.error("File not found:", p);
    continue;
  }
  const content = fs.readFileSync(p, "utf8");
  const rows = parseCSV(content).filter(r => r.name);

  rows.forEach(r => {
    masterRows.push({
      category: cfg.category,
      page_url: cfg.pageUrl,
      name: r.name,
      price: r.price || "",
      badge: r.data || r.data2 || "",
      image_hd: toHD(r.image),
      image2_hd: toHD(r.image2),
      swatch1: r.image3 || "",
      swatch2: r.image4 || "",
      swatch3: r.image5 || "",
      web_scraper_order: r.web_scraper_order,
      web_scraper_start_url: r.web_scraper_start_url,
    });
  });
}

console.log("Total consolidated rows:", masterRows.length);

// Generate CSV string
const headers = [
  "category",
  "page_url",
  "name",
  "price",
  "badge",
  "image_hd",
  "image2_hd",
  "swatch1",
  "swatch2",
  "swatch3",
  "web_scraper_order",
  "web_scraper_start_url",
];

const escapeCSV = (val) => {
  if (val === undefined || val === null) return '""';
  const str = String(val);
  return `"${str.replace(/"/g, '""')}"`;
};

const csvContent = [
  headers.join(","),
  ...masterRows.map(r => headers.map(h => escapeCSV(r[h])).join(",")),
].join("\n");

fs.mkdirSync("data", { recursive: true });
fs.writeFileSync("data/luggage-master.csv", csvContent, "utf8");
fs.writeFileSync("C:/Users/Adarsh/Downloads/rimowa-luggage-master.csv", csvContent, "utf8");

console.log("Wrote data/luggage-master.csv and C:/Users/Adarsh/Downloads/rimowa-luggage-master.csv successfully!");
