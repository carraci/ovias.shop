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
    if (row.name) rows.push(row);
  }
  return rows;
}

function cleanBrand(name) {
  return name.replace(/\bRIMOWA\b/gi, "OVIA").trim();
}

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function parsePriceToMinor(priceStr, defaultPrice) {
  if (!priceStr || !priceStr.trim()) return defaultPrice * 100;
  const digits = priceStr.replace(/[^0-9.]/g, "");
  const val = parseFloat(digits);
  if (isNaN(val) || val <= 0) return defaultPrice * 100;
  return Math.round(val * 100);
}

function localImg(url) {
  if (!url) return "";
  const fn = path.basename(new URL(url).pathname);
  return `/media/accessories/${fn}`;
}

const tagColorMap = {
  "51400041": { name: "Mineral Blue", hex: "#466987" },
  "51400040": { name: "Ruby Red", hex: "#9b1b30" },
  "51400039": { name: "Clementine Orange", hex: "#e05328" },
  "51400042": { name: "Emerald Green", hex: "#1e5945" },
  "51400043": { name: "Azure Blue", hex: "#1f4a7c" },
  "51400044": { name: "Honey Yellow", hex: "#e6ab32" },
  "51400037": { name: "Slate Grey", hex: "#7a7f85" },
  "51400035": { name: "Cognac Brown", hex: "#834827" },
  "51400036": { name: "Matte Black", hex: "#1c1c1c" },
  "51400034": { name: "Flame Red", hex: "#c8252b" },
  "51400038": { name: "Cactus Green", hex: "#4f634f" },
  "51400045": { name: "Desert Sand", hex: "#c2ab90" },
  "51400046": { name: "Lavender Lilac", hex: "#9d8ba1" },
};

const wheelColorMap = {
  "51500039": { name: "Mineral Blue", hex: "#466987" },
  "51500023": { name: "Clementine Orange", hex: "#e05328" },
  "51500024": { name: "Honey Yellow", hex: "#e6ab32" },
  "51500037": { name: "Emerald Green", hex: "#1e5945" },
  "51500022": { name: "Ruby Red", hex: "#9b1b30" },
  "51500004": { name: "Classic Black", hex: "#1c1c1c" },
  "51500005": { name: "Paprika Red", hex: "#b22222" },
  "51500015": { name: "Ocean Blue", hex: "#1f4a7c" },
  "51500008": { name: "Silver Grey", hex: "#bec1bd" },
  "51500016": { name: "Cactus Green", hex: "#4f634f" },
  "51500012": { name: "Desert Sand", hex: "#c2ab90" },
  "51500025": { name: "Quartz Pink", hex: "#d8a1a8" },
};

const strapMap = {
  "53000017": { name: "Customisation - Bags Adjustable Shoulder Strap - Matte Black", color: "Matte Black", hex: "#222324", price: 22000 },
  "53000018": { name: "Customisation - Bags Adjustable Shoulder Strap - Khaki Olive", color: "Khaki Olive", hex: "#556b2f", price: 22000 },
  "53000015": { name: "Customisation - Bags Cross-Body Shoulder Strap - Khaki Green", color: "Khaki Green", hex: "#4b5320", price: 25500 },
  "53000014": { name: "Customisation - Bags Cross-Body Shoulder Strap - Matte Black", color: "Matte Black", hex: "#1c1c1c", price: 25500 },
  "53000016": { name: "Customisation - Bags Cross-Body Shoulder Strap - Slate Grey", color: "Slate Grey", hex: "#708090", price: 25500 },
};

console.log("Color maps defined successfully.");
