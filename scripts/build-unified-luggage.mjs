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
  if (!priceStr) return 16800000; // default ₹1,68,000
  const digits = priceStr.replace(/[^\d]/g, "");
  if (!digits) return 16800000;
  if (priceStr.includes(".00")) {
    return parseInt(digits, 10);
  } else {
    return parseInt(digits, 10) * 100;
  }
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
  if (name.includes("Nylon")) return "Nylon";
  if (name.includes("Polycarbonate") || name.includes("Essential")) return "Polycarbonate";
  return "Aluminium";
}

function detectSpecs(name, cat) {
  const n = name.toLowerCase();
  if (n.includes("trunk xl")) {
    return { dim: "80 × 44 × 43 cm", cap: "130 L", wt: "6.8 kg" };
  }
  if (n.includes("trunk plus")) {
    return { dim: "80 × 37 × 41 cm", cap: "105 L", wt: "6.4 kg" };
  }
  if (n.includes("trunk s")) {
    return { dim: "65 × 39 × 34 cm", cap: "66 L", wt: "5.3 kg" };
  }
  if (n.includes("trunk")) {
    return { dim: "73 × 44 × 36.5 cm", cap: "90 L", wt: "6.0 kg" };
  }
  if (n.includes("check-in l")) {
    return { dim: "79 × 53 × 28 cm", cap: "86 L", wt: "6.2 kg" };
  }
  if (n.includes("check-in m")) {
    return { dim: "69 × 44 × 27.5 cm", cap: "60 L", wt: "5.4 kg" };
  }
  if (n.includes("cabin plus")) {
    return { dim: "57 × 44 × 25.5 cm", cap: "49 L", wt: "4.7 kg" };
  }
  if (n.includes("cabin s")) {
    return { dim: "55 × 38 × 20 cm", cap: "31 L", wt: "4.2 kg" };
  }
  if (n.includes("cabin u")) {
    return { dim: "50 × 35 × 20 cm", cap: "28 L", wt: "2.1 kg" };
  }
  if (n.includes("cabin")) {
    return { dim: "55 × 40 × 23 cm", cap: "35 L", wt: "4.3 kg" };
  }
  if (n.includes("bottle case")) {
    return { dim: "41.5 × 61.5 × 34 cm", cap: "12 Bottles", wt: "9.2 kg" };
  }
  if (n.includes("watch case")) {
    return { dim: "11.2 × 26.7 × 8.5 cm", cap: "3 Watches", wt: "1.2 kg" };
  }
  if (n.includes("chess")) {
    return { dim: "35 × 41.5 × 11 cm", cap: "Chess Set", wt: "4.9 kg" };
  }
  if (n.includes("mahjong")) {
    return { dim: "38 × 44 × 12 cm", cap: "Mahjong Set", wt: "5.6 kg" };
  }
  if (n.includes("briefcase")) {
    return { dim: "35 × 41.5 × 11 cm", cap: "16 L", wt: "2.8 kg" };
  }
  if (n.includes("vanity")) {
    return { dim: "25 × 35 × 22 cm", cap: "18 L", wt: "2.7 kg" };
  }
  if (n.includes("trumpet")) {
    return { dim: "58 × 31 × 20 cm", cap: "Trumpet", wt: "3.8 kg" };
  }
  if (n.includes("violin")) {
    return { dim: "81 × 26 × 15 cm", cap: "Violin", wt: "3.2 kg" };
  }
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
  if (n.includes("chess") || n.includes("mahjong")) {
    return `A rare collector's edition encased in precision-machined anodised aluminium. Finished with a bespoke velvet-lined wooden interior, magnetic game pieces, and custom handcrafted latches.`;
  }
  if (n.includes("trumpet") || n.includes("violin") || n.includes("bottle") || n.includes("watch") || n.includes("vanity")) {
    return `A masterwork of protective luxury engineered in partnership with world-renowned specialists. Anodised grooved aluminium shell with custom-moulded shock-absorbing interior.`;
  }
  return `A distinctive expression of German luxury engineering. Crafted in premium ${material.toLowerCase()} with iconic grooves, reinforced hardware, and timeless elegance.`;
}

// 1. Upgrade existing products in luggageProducts to HD
const upgradedExisting = luggageProducts.map(p => ({
  ...p,
  image: toHD(p.image),
  variants: p.variants.map(v => ({
    ...v,
    image: toHD(v.image),
  })),
}));

console.log("Upgraded existing products to HD:", upgradedExisting.length);

// 2. Load all 5 CSVs
const fileConfigs = [
  { category: "Trunk", file: "rimowa-com-2026-09-26-3.csv" },
  { category: "Check-In", file: "rimowa-com-2026-09-26-4.csv" },
  { category: "Cabin", file: "rimowa-com-2026-09-26-4 (1).csv" },
  { category: "Emblematic pieces", file: "rimowa-com-2026-09-26-4 (2).csv" },
  { category: "All Luggage", file: "rimowa-com-2026-09-26-4 (3).csv" },
];

const existingSlugs = new Set(upgradedExisting.map(p => p.slug));
const existingImageBases = new Set(
  upgradedExisting.map(p => path.basename(p.image).toLowerCase())
);

const newProductsToAdd = [];

for (const cfg of fileConfigs) {
  const p = path.join("C:/Users/Adarsh/Downloads", cfg.file);
  const content = fs.readFileSync(p, "utf8");
  const rows = parseCSV(content).filter(r => r.name);

  for (const r of rows) {
    const hdImg = toHD(r.image);
    const imgBase = path.basename(hdImg).toLowerCase();

    // Check if matched existing by image or slug
    const matchedExisting = upgradedExisting.find(
      ep => path.basename(ep.image).toLowerCase() === imgBase
    );

    if (matchedExisting) {
      // Ensure tags include this category
      if (cfg.category === "Trunk" && !matchedExisting.tags.includes("trunk")) {
        matchedExisting.tags.push("trunk");
      }
      if (cfg.category === "Check-In" && !matchedExisting.tags.includes("check-in")) {
        matchedExisting.tags.push("check-in");
      }
      if (cfg.category === "Cabin" && !matchedExisting.tags.includes("cabin")) {
        matchedExisting.tags.push("cabin");
      }
      if (cfg.category === "Emblematic pieces") {
        if (!matchedExisting.tags.includes("emblematic")) matchedExisting.tags.push("emblematic");
        if (!matchedExisting.tags.includes("best-sellers")) matchedExisting.tags.push("best-sellers");
        if (!matchedExisting.tags.includes("signature-pieces")) matchedExisting.tags.push("signature-pieces");
      }
      // Update price if available
      if (r.price) {
        const pPaise = parsePricePaise(r.price);
        if (pPaise > 0 && (!matchedExisting.variants[0]?.price || matchedExisting.variants[0].price === 0)) {
          matchedExisting.variants[0].price = pPaise;
        }
      }
    } else {
      // Check if already in newProductsToAdd
      const alreadyAdded = newProductsToAdd.find(
        np => path.basename(np.image).toLowerCase() === imgBase
      );
      if (alreadyAdded) {
        if (cfg.category === "Trunk" && !alreadyAdded.tags.includes("trunk")) {
          alreadyAdded.tags.push("trunk");
        }
        if (cfg.category === "Check-In" && !alreadyAdded.tags.includes("check-in")) {
          alreadyAdded.tags.push("check-in");
        }
        if (cfg.category === "Cabin" && !alreadyAdded.tags.includes("cabin")) {
          alreadyAdded.tags.push("cabin");
        }
        if (cfg.category === "Emblematic pieces") {
          if (!alreadyAdded.tags.includes("emblematic")) alreadyAdded.tags.push("emblematic");
          if (!alreadyAdded.tags.includes("best-sellers")) alreadyAdded.tags.push("best-sellers");
          if (!alreadyAdded.tags.includes("signature-pieces")) alreadyAdded.tags.push("signature-pieces");
        }
        continue;
      }

      // Create new product
      const collection = detectCollection(r.name);
      const material = detectMaterial(r.name);
      let cat = cfg.category;
      if (cat === "All Luggage") {
        if (r.name.toLowerCase().includes("trunk")) cat = "Trunk";
        else if (r.name.toLowerCase().includes("check")) cat = "Check-In";
        else cat = "Cabin";
      }

      const specs = detectSpecs(r.name, cat);
      const baseSlug = slugify(r.name);
      let uniqueSlug = baseSlug;
      let counter = 1;
      while (existingSlugs.has(uniqueSlug) || newProductsToAdd.some(x => x.slug === uniqueSlug)) {
        counter++;
        uniqueSlug = `${baseSlug}-${counter}`;
      }

      const tags = ["luggage", slugify(collection), slugify(material)];
      if (cat === "Trunk" || r.name.toLowerCase().includes("trunk")) tags.push("trunk", "large-luggage", "long-journeys");
      if (cat === "Check-In" || r.name.toLowerCase().includes("check")) tags.push("check-in", "long-haul", "long-journeys");
      if (cat === "Cabin" || r.name.toLowerCase().includes("cabin") || r.name.toLowerCase().includes("compact") || r.name.toLowerCase().includes("pilot")) {
        tags.push("cabin", "short-trips", "business-selection");
      }
      if (cfg.category === "Emblematic pieces" || r.data === "Limited Edition" || r.data2 === "Limited Edition") {
        tags.push("emblematic", "best-sellers", "signature-pieces");
      }

      const pricePaise = parsePricePaise(r.price);

      newProductsToAdd.push({
        id: uniqueSlug,
        slug: uniqueSlug,
        name: r.name,
        collection,
        department: "luggage",
        category: cat,
        material,
        description: generateDescription(r.name, collection, material),
        dimensions: specs.dim,
        capacity: specs.cap,
        weight: specs.wt,
        tags,
        variants: [
          {
            sku: `OV-${slugify(collection).toUpperCase()}-${counter}`,
            color: "Silver",
            hex: "#bec1bd",
            price: pricePaise,
            stock: 10,
            image: hdImg,
          },
        ],
        image: hdImg,
        imageKind: "photograph",
        featured: r.data === "New" || r.data === "Limited Edition",
      });
    }
  }
}

console.log("New products to add:", newProductsToAdd.length);
const totalCombined = [...upgradedExisting, ...newProductsToAdd];
console.log("Total combined luggage products:", totalCombined.length);

const byFinalCat = {};
totalCombined.forEach(p => {
  byFinalCat[p.category] = (byFinalCat[p.category] || 0) + 1;
});
console.log("Final category counts:", byFinalCat);

const emblematicCount = totalCombined.filter(
  p => p.tags.includes("emblematic") || p.tags.includes("best-sellers") || p.category === "Emblematic pieces"
).length;
console.log("Emblematic pieces count:", emblematicCount);
