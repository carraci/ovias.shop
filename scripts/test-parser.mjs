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

function toHD(url) {
  if (!url) return "";
  return url.replace("/images/medium/", "/images/large/");
}

function parsePricePaise(priceStr) {
  if (!priceStr) return 0;
  const digits = priceStr.replace(/[^\d]/g, "");
  if (!digits) return 0;
  // e.g. "26500000" if "₹ 2,65,000.00" -> digits has "26500000" (including the two decimal zeros)
  // Let's verify: "₹ 2,65,000.00" has digits "26500000" which IS already in paise!
  // If price has ".00", digits ends with "00".
  if (priceStr.includes(".00")) {
    return parseInt(digits, 10);
  } else {
    return parseInt(digits, 10) * 100;
  }
}

function detectCollection(name) {
  if (name.includes("Classic")) return "Classic";
  if (name.includes("Original")) return "Original";
  if (name.includes("Distinct")) return "Distinct";
  if (name.includes("Essential Lite")) return "Essential Lite";
  if (name.includes("Essential Sleeve")) return "Essential Sleeve";
  if (name.includes("Essential")) return "Essential";
  if (name.includes("Hybrid")) return "Hybrid";
  if (name.includes("Attaché")) return "Attaché";
  if (name.includes("Never Still")) return "Never Still";
  if (name.includes("Groove")) return "Groove";
  if (name.includes("Personal")) return "Personal";
  if (name.includes("Customisation")) return "Specialties";
  if (name.includes("Specialty") || name.includes("Specialties")) return "Specialties";
  return "Original";
}

function detectMaterial(name) {
  if (name.includes("Leather")) return "Leather";
  if (name.includes("Polycarbonate") || name.includes("Essential")) return "Polycarbonate";
  if (name.includes("Aluminium") || name.includes("Original") || name.includes("Classic") || name.includes("Attaché")) return "Aluminium";
  return "Aluminium";
}

function detectCategory(name, sourceCat) {
  const n = name.toLowerCase();
  if (sourceCat === "Trunk" || n.includes("trunk")) return "Trunk";
  if (sourceCat === "Check-In" || n.includes("check-in")) return "Check-In";
  if (sourceCat === "Cabin" || n.includes("cabin") || n.includes("pilot") || n.includes("compact")) return "Cabin";
  if (sourceCat === "Emblematic pieces") return "Emblematic pieces";
  return "Cabin";
}

const fileConfigs = [
  { category: "Trunk", file: "rimowa-com-2026-09-26-3.csv" },
  { category: "Check-In", file: "rimowa-com-2026-09-26-4.csv" },
  { category: "Cabin", file: "rimowa-com-2026-09-26-4 (1).csv" },
  { category: "Emblematic pieces", file: "rimowa-com-2026-09-26-4 (2).csv" },
  { category: "All Luggage", file: "rimowa-com-2026-09-26-4 (3).csv" },
];

const allCsvRows = [];
for (const cfg of fileConfigs) {
  const p = path.join("C:/Users/Adarsh/Downloads", cfg.file);
  const content = fs.readFileSync(p, "utf8");
  const rows = parseCSV(content).filter(r => r.name);
  rows.forEach(r => allCsvRows.push({ ...r, sourceCat: cfg.category }));
}

console.log("Loaded CSV rows:", allCsvRows.length);
