import fs from "fs";
import path from "path";
import { luggageProducts as existingLuggage } from "../src/lib/luggage-collection.ts";

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
  if (priceStr.includes(".00")) {
    return parseInt(digits, 10);
  } else {
    return parseInt(digits, 10) * 100;
  }
}

function formatINR(paise) {
  if (!paise) return "₹ 1,68,000.00";
  const rupees = Math.round(paise / 100);
  const s = rupees.toString();
  let lastThree = s.substring(s.length - 3);
  const otherNumbers = s.substring(0, s.length - 3);
  if (otherNumbers !== "") {
    lastThree = "," + lastThree;
  }
  const res = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree;
  return `₹ ${res}.00`;
}

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
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
  return "Specialties";
}

function detectMaterial(name) {
  if (name.includes("Leather")) return "Leather";
  if (name.includes("Distinct")) return "Leather";
  if (name.includes("Nylon") || name.includes("Canvas")) return "Canvas";
  if (name.includes("Polycarbonate") || name.includes("Essential")) return "Polycarbonate";
  return "Aluminium";
}

function detectCategory(name) {
  const n = name.toLowerCase();
  if (n.includes("trunk")) return "Trunk";
  if (n.includes("check-in")) return "Check-In";
  if (n.includes("cabin") || n.includes("compact") || n.includes("pilot")) return "Cabin";
  if (n.includes("backpack")) return "Backpacks";
  if (n.includes("duffle")) return "Duffle Bags";
  if (n.includes("briefcase") || n.includes("attaché")) return "Briefcases";
  if (n.includes("cross-body")) return "Crossbodies";
  if (n.includes("tote") || n.includes("shopping") || n.includes("hobo")) return "Totes";
  if (n.includes("case") && (n.includes("watch") || n.includes("bottle") || n.includes("jewellery") || n.includes("artist") || n.includes("trumpet") || n.includes("violin") || n.includes("chess") || n.includes("mahjong") || n.includes("poker") || n.includes("dartboard") || n.includes("vanity"))) return "Specialties";
  if (n.includes("iphone") || n.includes("sunglasses") || n.includes("pouch") || n.includes("packing") || n.includes("holder") || n.includes("garment") || n.includes("carrier") || n.includes("tag") || n.includes("belt") || n.includes("wheel") || n.includes("sticker") || n.includes("hat")) return "Accessories";
  return "Cabin";
}

function detectSpecs(name) {
  const n = name.toLowerCase();
  if (n.includes("trunk xl")) return { dim: "80 × 44 × 43 cm", cap: "130 L", wt: "6.8 kg" };
  if (n.includes("trunk plus")) return { dim: "80 × 37 × 41 cm", cap: "105 L", wt: "6.4 kg" };
  if (n.includes("trunk s")) return { dim: "65 × 39 × 34 cm", cap: "66 L", wt: "5.3 kg" };
  if (n.includes("trunk")) return { dim: "73 × 44 × 36.5 cm", cap: "90 L", wt: "6.0 kg" };
  if (n.includes("check-in l")) return { dim: "79 × 53 × 28 cm", cap: "86 L", wt: "6.2 kg" };
  if (n.includes("check-in m")) return { dim: "69 × 44 × 27.5 cm", cap: "60 L", wt: "5.4 kg" };
  if (n.includes("cabin plus")) return { dim: "57 × 44 × 25.5 cm", cap: "49 L", wt: "4.7 kg" };
  if (n.includes("cabin s")) return { dim: "55 × 38 × 20 cm", cap: "31 L", wt: "4.2 kg" };
  if (n.includes("cabin u")) return { dim: "50 × 35 × 20 cm", cap: "28 L", wt: "2.1 kg" };
  if (n.includes("cabin")) return { dim: "55 × 40 × 23 cm", cap: "35 L", wt: "4.3 kg" };
  if (n.includes("compact")) return { dim: "41.5 × 40 × 23 cm", cap: "29 L", wt: "3.9 kg" };
  if (n.includes("pilot")) return { dim: "42 × 50 × 23 cm", cap: "34 L", wt: "4.9 kg" };
  if (n.includes("briefcase")) return { dim: "35 × 41.5 × 11 cm", cap: "16 L", wt: "2.8 kg" };
  if (n.includes("backpack")) return { dim: "44 × 37 × 16 cm", cap: "19.5 L", wt: "1.4 kg" };
  if (n.includes("duffle")) return { dim: "32 × 55 × 23 cm", cap: "38 L", wt: "1.6 kg" };
  if (n.includes("cross-body")) return { dim: "13 × 21.5 × 7 cm", cap: "1.8 L", wt: "0.6 kg" };
  if (n.includes("tote")) return { dim: "39 × 42 × 13 cm", cap: "18 L", wt: "1.1 kg" };
  if (n.includes("watch case")) return { dim: "11.2 × 26.7 × 8.5 cm", cap: "3 Watches", wt: "1.2 kg" };
  if (n.includes("bottle case")) return { dim: "41.5 × 61.5 × 34 cm", cap: "12 Bottles", wt: "9.2 kg" };
  if (n.includes("chess")) return { dim: "35 × 41.5 × 11 cm", cap: "Chess Set", wt: "4.9 kg" };
  if (n.includes("mahjong")) return { dim: "38 × 44 × 12 cm", cap: "Mahjong Set", wt: "5.6 kg" };
  if (n.includes("vanity")) return { dim: "25 × 35 × 22 cm", cap: "18 L", wt: "2.7 kg" };
  return { dim: "55 × 40 × 23 cm", cap: "35 L", wt: "4.3 kg" };
}

function generateDescription(name, collection, material) {
  const n = name.toLowerCase();
  if (n.includes("trunk")) {
    return `Iconic silhouette with expansive depth, inspired by classic travel trunks. Engineered in ${material.toLowerCase()} with reinforced high-gloss corner guards, heavy-duty TSA combination locks, and smooth dual ball-bearing wheels for effortless extended journeys.`;
  }
  if (n.includes("check-in")) {
    return `Engineered volume and refined resilience for extended stays and long-haul travel. Features ${material.toLowerCase()} construction, precision flex divider interior, and silent multi-wheel technology.`;
  }
  if (n.includes("cabin")) {
    return `Compact proportions engineered for effortless overhead carry and short trips. Crafted from premium ${material.toLowerCase()} with iconic grooved contours, ergonomic telescopic handle, and TSA-approved locks.`;
  }
  if (n.includes("sleeve")) {
    return `Engineered for modern business travel. Features an accessible front padded sleeve tailored for laptops up to 16 inches and vital travel documents.`;
  }
  if (n.includes("pilot")) {
    return `Designed for aviation professionals and frequent business travellers. Top-opening compartment for fast in-flight access to electronics and flight documents.`;
  }
  if (n.includes("briefcase") || n.includes("attaché")) {
    return `An enduring symbol of executive distinction. Precision-machined aluminium casing with bespoke leather handle and dual code combination locks.`;
  }
  if (n.includes("backpack")) {
    return `Modern mobility meets utilitarian luxury. Expertly tailored compartments for electronics, travel essentials, and ergonomic padded straps.`;
  }
  if (n.includes("address tag")) {
    return `Crafted in fine European full-grain leather. Finished with signature embossed monogramming and precision stitching to personalise your luggage.`;
  }
  if (n.includes("wheels set")) {
    return `Engineered custom ball-bearing multiwheel system designed for silent, effortless 360-degree rotation across airport terminals and city avenues.`;
  }
  if (n.includes("belt")) {
    return `Reversible full-grain leather belt featuring a custom precision-machined buckle inspired by iconic grooved aluminium hardware.`;
  }
  if (n.includes("sticker")) {
    return `Collectable travel memorabilia designed to celebrate iconic destinations. High-gloss durable vinyl print crafted for personalising grooved luggage.`;
  }
  return `A distinctive expression of German luxury engineering. Crafted in premium ${material.toLowerCase()} with iconic grooves, reinforced hardware, and timeless elegance.`;
}

function detectColorHex(urlOrName) {
  const s = urlOrName.toLowerCase();
  if (s.includes("black") || s.includes("matte_black")) return { color: "Black", hex: "#1a1a1a" };
  if (s.includes("titanium")) return { color: "Titanium", hex: "#a69f93" };
  if (s.includes("silver")) return { color: "Silver", hex: "#bec1bd" };
  if (s.includes("white")) return { color: "Gloss White", hex: "#f0f0f0" };
  if (s.includes("green") || s.includes("jade") || s.includes("eucalyptus")) return { color: "Emerald Green", hex: "#1e3d34" };
  if (s.includes("orange") || s.includes("papaya")) return { color: "Papaya Orange", hex: "#e86130" };
  if (s.includes("blue") || s.includes("denim") || s.includes("navy") || s.includes("indigo")) return { color: "Midnight Blue", hex: "#263f59" };
  if (s.includes("red")) return { color: "Gloss Red", hex: "#aa1923" };
  if (s.includes("grey") || s.includes("graphite") || s.includes("slate")) return { color: "Slate Grey", hex: "#5a6368" };
  if (s.includes("ivory") || s.includes("clay") || s.includes("beige") || s.includes("cognac")) return { color: "Clay Beige", hex: "#c2b49d" };
  if (s.includes("purple") || s.includes("magenta")) return { color: "Magenta Purple", hex: "#7a2a52" };
  return { color: "Silver", hex: "#bec1bd" };
}

// 1. Build known price lookup map from all available rows
const knownPriceMap = new Map();
const allDownloadFiles = [
  "rimowa-com-2026-09-26-3.csv",
  "rimowa-com-2026-09-26-4.csv",
  "rimowa-com-2026-09-26-4 (1).csv",
  "rimowa-com-2026-09-26-4 (2).csv",
  "rimowa-com-2026-09-26-4 (3).csv",
  "rimowa-com-2026-09-26-4 (4).csv",
  "rimowa-com-2026-09-26-4 (5).csv",
  "rimowa-com-2026-09-26-4 (7).csv",
  "rimowa-com-2026-09-26-4 (8).csv",
  "rimowa-com-2026-09-26-4 (9).csv",
  "rimowa-com-2026-09-26-4 (10).csv",
  "rimowa-com-2026-09-26-4 (11).csv",
  "rimowa-com-2026-09-26-4 (12).csv",
  "rimowa-com-2026-09-26-4 (13).csv",
];

for (const fn of allDownloadFiles) {
  const fp = path.join("C:/Users/Adarsh/Downloads", fn);
  if (fs.existsSync(fp)) {
    const rows = parseCSV(fs.readFileSync(fp, "utf8"));
    for (const r of rows) {
      if (r.name && r.price) {
        const pPaise = parsePricePaise(r.price);
        if (pPaise > 0) {
          knownPriceMap.set(r.name.toLowerCase().trim(), pPaise);
        }
      }
    }
  }
}

function getFallbackPrice(name) {
  const n = name.toLowerCase().trim();
  if (knownPriceMap.has(n)) return knownPriceMap.get(n);
  if (n.includes("hybrid trunk plus")) return 19900000;
  if (n.includes("hybrid check-in l")) return 16100000;
  if (n.includes("hybrid cabin")) return 12900000;
  if (n.includes("distinct cabin")) return 39800000;
  if (n.includes("classic grid trunk")) return 28500000;
  if (n.includes("classic grid cabin")) return 19500000;
  if (n.includes("classic grid hand-carry")) return 18500000;
  if (n.includes("leather duffle bag large")) return 21500000;
  if (n.includes("leather duffle bag medium")) return 19500000;
  if (n.includes("leather flap backpack small")) return 22500000;
  if (n.includes("leather flap backpack large")) return 25750000;
  if (n.includes("leather zipped tote")) return 21000000;
  if (n.includes("leather cross-body")) return 13300000;
  if (n.includes("leather zipped pouch")) return 6500000;
  if (n.includes("sunglasses")) return 3800000;
  if (n.includes("iphone")) return 1950000;
  if (n.includes("poker")) return 45000000;
  if (n.includes("mahjong")) return 48000000;
  if (n.includes("dartboard")) return 32000000;
  if (n.includes("cocktail")) return 35000000;
  if (n.includes("trumpet")) return 28000000;
  if (n.includes("violin")) return 32000000;
  if (n.includes("artist case")) return 39000000;
  if (n.includes("garment bag")) return 7350000;
  if (n.includes("pet carrier")) return 9400000;
  if (n.includes("packing cube")) return 1700000;
  if (n.includes("address tag")) return 1050000;
  if (n.includes("wheels set")) return 1900000;
  if (n.includes("belt")) return 3500000;
  if (n.includes("sticker")) return 100000;
  if (n.includes("trunk plus") || n.includes("trunk xl")) return 27200000;
  if (n.includes("trunk")) return 25800000;
  if (n.includes("check-in l")) return 21000000;
  if (n.includes("check-in m")) return 19600000;
  if (n.includes("cabin plus")) return 18200000;
  if (n.includes("cabin")) return 16800000;
  return 16800000;
}

// 2. Start from existing luggage products (already in productsMap)
const productsMap = new Map();
for (const p of existingLuggage) {
  p.image = toHD(p.image);
  p.variants.forEach(v => {
    v.image = toHD(v.image);
  });
  productsMap.set(p.slug, p);
}

// 3. Define the new category files and their mappings
const categoryFiles = [
  {
    category: "Leather",
    page_url: "http://localhost:3000/luggage?material=Leather",
    file: "rimowa-com-2026-09-26-4 (9).csv",
    tagsToAdd: ["leather"],
    forceMaterial: "Leather",
  },
  {
    category: "Silver luggage",
    page_url: "http://localhost:3000/luggage?color=Silver",
    file: "rimowa-com-2026-09-26-4 (10).csv",
    tagsToAdd: ["silver"],
    forceColor: "Silver",
  },
  {
    category: "Black luggage",
    page_url: "http://localhost:3000/luggage?color=Black",
    file: "rimowa-com-2026-09-26-4 (11).csv",
    tagsToAdd: ["black"],
    forceColor: "Black",
  },
  {
    category: "Blue luggage",
    page_url: "http://localhost:3000/luggage?color=Midnight+Blue",
    file: "rimowa-com-2026-09-26-4 (12).csv",
    tagsToAdd: ["blue", "midnight-blue"],
    forceColor: "Midnight Blue",
  },
  {
    category: "All gifts",
    page_url: "http://localhost:3000/collections/gifts",
    file: "rimowa-com-2026-09-26-4 (13).csv",
    tagsToAdd: ["gifts"],
  },
];

// Helper to check if a product is part of Business Selection
function isBusinessItem(name) {
  const n = name.toLowerCase();
  return (
    n.includes("sleeve") ||
    n.includes("pilot") ||
    n.includes("compact") ||
    n.includes("attaché") ||
    n.includes("briefcase") ||
    n.includes("card holder") ||
    n.includes("toiletry") ||
    n.includes("backpack") ||
    n.includes("pouch")
  );
}

// Read existing master CSV lines
const existingMasterCsv = fs.readFileSync("data/luggage-master.csv", "utf8");
const existingMasterRows = parseCSV(existingMasterCsv);
console.log("Existing master CSV rows:", existingMasterRows.length);
const masterCsvRows = [...existingMasterRows];

for (const cfg of categoryFiles) {
  const p = path.join("C:/Users/Adarsh/Downloads", cfg.file);
  if (!fs.existsSync(p)) {
    console.log("File not found:", p);
    continue;
  }
  const rows = parseCSV(fs.readFileSync(p, "utf8")).filter(r => r.name);
  console.log(`Processing ${cfg.category}: ${rows.length} rows`);

  for (const r of rows) {
    const hdImg = toHD(r.image);
    const hdImg2 = toHD(r.image2);
    const imgBase = path.basename(hdImg).toLowerCase();
    const pricePaise = parsePricePaise(r.price) || getFallbackPrice(r.name);
    const priceFormatted = r.price || formatINR(pricePaise);

    masterCsvRows.push({
      category: cfg.category,
      page_url: cfg.page_url,
      name: r.name,
      price: priceFormatted,
      badge: r.data || "",
      image_hd: hdImg,
      image2_hd: hdImg2,
      swatch1: r.image3 || "",
      swatch2: r.image4 || "",
      swatch3: r.image5 || "",
      web_scraper_order: r.web_scraper_order || "",
      web_scraper_start_url: r.web_scraper_start_url || "",
    });

    // Update or add into productsMap
    let matched = Array.from(productsMap.values()).find(
      ep => path.basename(ep.image).toLowerCase() === imgBase || ep.variants.some(v => path.basename(v.image).toLowerCase() === imgBase)
    );

    if (!matched) {
      const baseSlug = slugify(r.name);
      let finalSlug = baseSlug;
      let counter = 1;
      while (productsMap.has(finalSlug)) {
        finalSlug = `${baseSlug}-${counter++}`;
      }

      const collection = detectCollection(r.name);
      const material = cfg.forceMaterial || detectMaterial(r.name);
      const category = detectCategory(r.name);
      const specs = detectSpecs(r.name);
      const desc = generateDescription(r.name, collection, material);
      const colorInfo = cfg.forceColor
        ? { color: cfg.forceColor, hex: cfg.forceColor === "Silver" ? "#bec1bd" : cfg.forceColor === "Black" ? "#1a1a1a" : "#263f59" }
        : detectColorHex(hdImg + " " + r.name);

      const tags = [...cfg.tagsToAdd];
      if (material === "Leather" || r.name.includes("Leather") || r.name.includes("Distinct")) {
        if (!tags.includes("leather")) tags.push("leather");
      }
      if (material === "Polycarbonate" || r.name.includes("Hybrid") || r.name.includes("Essential")) {
        if (!tags.includes("polycarbonate")) tags.push("polycarbonate");
      }
      if (material === "Aluminium" || r.name.includes("Original") || r.name.includes("Classic") || r.name.includes("Attaché")) {
        if (!tags.includes("aluminium")) tags.push("aluminium");
      }
      if (category === "Cabin") tags.push("cabin", "short-trips");
      if (category === "Check-In") tags.push("check-in", "long-haul", "long-journeys");
      if (category === "Trunk") tags.push("trunk", "long-haul", "long-journeys");
      if (isBusinessItem(r.name)) tags.push("business-selection", "business-bags");

      const newProd = {
        id: finalSlug,
        slug: finalSlug,
        name: r.name,
        collection,
        department: "luggage",
        category,
        material,
        description: desc,
        dimensions: specs.dim,
        capacity: specs.cap,
        weight: specs.wt,
        tags: Array.from(new Set(tags)),
        variants: [
          {
            sku: `OV-${slugify(r.name).toUpperCase().slice(0, 20)}-${colorInfo.color.toUpperCase().slice(0, 4)}`,
            color: colorInfo.color,
            hex: colorInfo.hex,
            price: pricePaise,
            stock: 12,
            image: hdImg,
          },
        ],
        image: hdImg,
        imageKind: "photograph",
        featured: true,
      };

      if (hdImg2) {
        newProd.variants.push({
          sku: `OV-${slugify(r.name).toUpperCase().slice(0, 20)}-ALT`,
          color: `${colorInfo.color} Detail`,
          hex: colorInfo.hex,
          price: pricePaise,
          stock: 8,
          image: hdImg2,
        });
      }

      productsMap.set(finalSlug, newProd);
    } else {
      // Enrich existing product
      cfg.tagsToAdd.forEach(t => {
        if (!matched.tags.includes(t)) matched.tags.push(t);
      });
      if (cfg.forceMaterial) {
        matched.material = cfg.forceMaterial;
        if (!matched.tags.includes(cfg.forceMaterial.toLowerCase())) {
          matched.tags.push(cfg.forceMaterial.toLowerCase());
        }
      }
      if (cfg.forceColor) {
        if (!matched.colors) matched.colors = [];
        if (!matched.colors.includes(cfg.forceColor)) matched.colors.push(cfg.forceColor);
        // Ensure variant color or alternative variant has this color
        const hasVariant = matched.variants.some(v => v.color.toLowerCase().includes(cfg.forceColor.toLowerCase()));
        if (!hasVariant && hdImg) {
          const colorHex = cfg.forceColor === "Silver" ? "#bec1bd" : cfg.forceColor === "Black" ? "#1a1a1a" : "#263f59";
          matched.variants.push({
            sku: `OV-${slugify(matched.name).toUpperCase().slice(0, 16)}-${cfg.forceColor.toUpperCase().slice(0, 4)}`,
            color: cfg.forceColor,
            hex: colorHex,
            price: pricePaise,
            stock: 10,
            image: hdImg,
          });
        }
      }
      if (pricePaise > 0 && (!matched.variants[0]?.price || matched.variants[0].price === 0)) {
        matched.variants[0].price = pricePaise;
      }
    }
  }
}

console.log("Total products after full ingestion:", productsMap.size);
console.log("Total master CSV rows:", masterCsvRows.length);

// Write master CSV to data/luggage-master.csv and C:/Users/Adarsh/Downloads/rimowa-luggage-master.csv
function formatCSVRow(fields) {
  return fields.map(f => `"${String(f || "").replace(/"/g, '""')}"`).join(",");
}

const csvHeader = [
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

const csvLines = [csvHeader.join(",")];
for (const r of masterCsvRows) {
  csvLines.push(
    formatCSVRow([
      r.category,
      r.page_url,
      r.name,
      r.price,
      r.badge,
      r.image_hd,
      r.image2_hd,
      r.swatch1,
      r.swatch2,
      r.swatch3,
      r.web_scraper_order,
      r.web_scraper_start_url,
    ])
  );
}

const finalCsvContent = csvLines.join("\n");
fs.writeFileSync("data/luggage-master.csv", finalCsvContent, "utf8");
fs.writeFileSync("C:/Users/Adarsh/Downloads/rimowa-luggage-master.csv", finalCsvContent, "utf8");
console.log("Successfully wrote luggage-master.csv to data/ and Downloads!");

// Write luggage-collection.ts
const sortedProducts = Array.from(productsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
const tsContent = `import type { Product } from "./catalog";

export const luggageProducts: Product[] = ${JSON.stringify(sortedProducts, null, 2)};
`;

fs.writeFileSync("src/lib/luggage-collection.ts", tsContent, "utf8");
console.log("Successfully updated src/lib/luggage-collection.ts with", sortedProducts.length, "products!");
