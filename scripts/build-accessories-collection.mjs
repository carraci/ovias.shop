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

function deriveColor(name, index) {
  const lower = name.toLowerCase();
  if (lower.includes("titanium")) return { color: "Titanium", hex: "#a69f93" };
  if (lower.includes("silver")) return { color: "Silver", hex: "#bec1bd" };
  if (lower.includes("ink blue") || lower.includes("blue")) return { color: "Ink Blue", hex: "#1e3250" };
  if (lower.includes("black")) return { color: "Matte Black", hex: "#222324" };
  if (lower.includes("slate grey") || lower.includes("grey")) return { color: "Slate Grey", hex: "#5a5e62" };
  if (lower.includes("dune") || lower.includes("sand") || lower.includes("beige")) return { color: "Desert Sand", hex: "#b5a58b" };
  if (lower.includes("olive") || lower.includes("green") || lower.includes("khaki")) return { color: "Forest Green", hex: "#435043" };

  const defaults = [
    { color: "Silver", hex: "#bec1bd" },
    { color: "Matte Black", hex: "#222324" },
    { color: "Titanium", hex: "#a69f93" },
    { color: "Midnight Blue", hex: "#1e3250" }
  ];
  return defaults[index % defaults.length];
}

const lifestyleConfigs = [
  {
    category: "iPhone Cases",
    routeSlug: "iphone-cases",
    file: "rimowa-com-2026-09-26-5 (4).csv",
    collection: "Forma",
    defaultMaterial: "Aluminium",
    defaultPrice: 19500,
    dimensions: "16.3 × 8.2 × 1.1 cm",
    weight: "0.06 kg",
    capacity: "—",
    description: "Engineered in Germany with iconic grooved aluminium and shockproof TPU, delivering robust protection and refined tactile poise for your iPhone."
  },
  {
    category: "Hats",
    routeSlug: "hats",
    file: "rimowa-com-2026-09-26-5 (5).csv",
    collection: "Lifestyle",
    defaultMaterial: "Cotton Canvas",
    defaultPrice: 18500,
    dimensions: "58 cm circumference",
    weight: "0.12 kg",
    capacity: "—",
    description: "A reversible bucket hat crafted in resilient cotton canvas with precision tonal stitching and an understated embossed OVIA monogram."
  },
  {
    category: "Sunglasses",
    routeSlug: "sunglasses",
    file: "rimowa-com-2026-09-26-5 (6).csv",
    collection: "Heritage",
    defaultMaterial: "Aluminium & Acetate",
    defaultPrice: 32000,
    dimensions: "Frame width: 142 mm, Temple: 145 mm",
    weight: "0.04 kg",
    capacity: "—",
    description: "Architectural eyewear handcrafted with grooved metal temples, ultra-lightweight frames, and high-definition anti-reflective polarised lenses."
  },
  {
    category: "Belts",
    routeSlug: "belts",
    file: "rimowa-com-2026-09-26-5 (7).csv",
    collection: "Lifestyle",
    defaultMaterial: "Full-Grain Leather",
    defaultPrice: 26000,
    dimensions: "Width: 35 mm, Length: 95–115 cm",
    weight: "0.18 kg",
    capacity: "—",
    description: "Reversible artisanal full-grain calfskin leather belt fitted with a signature brushed palladium buckle inspired by heritage travel cases."
  },
  {
    category: "Card Holders",
    routeSlug: "card-holders",
    file: "rimowa-com-2026-09-26-5 (8).csv",
    collection: "Original",
    defaultMaterial: "Aluminium",
    defaultPrice: 33500,
    dimensions: "10 × 6.5 × 1 cm",
    weight: "0.08 kg",
    capacity: "6 cards",
    description: "The Original aluminium card holder features an ergonomic compartment lined with leather, magnetic snap security, and RFID protective shielding."
  }
];

const allAccessories = [];

// 1. Process Lifestyle categories
for (const cfg of lifestyleConfigs) {
  const p = path.join("C:/Users/Adarsh/Downloads", cfg.file);
  const text = fs.readFileSync(p, "utf8");
  const rows = parseCSV(text);
  console.log(`Processing Lifestyle: ${cfg.category} (${rows.length} rows)`);

  rows.forEach((r, idx) => {
    const rawName = r.name.trim();
    if (!rawName) return;

    let cleanedName = cleanBrand(rawName);
    const id = slugify(`${cleanedName}-${r.web_scraper_order || idx + 1}`);
    const slug = id;

    const mainImg = localImg(r.image);
    const img2 = localImg(r.image2);
    const img3 = localImg(r.image3);
    const img4 = localImg(r.image4);
    const img5 = localImg(r.image5);

    const gallery = [mainImg, img2, img3, img4, img5].filter(img => img && !img.includes("SWATCH_"));
    const swatches = [mainImg, img2, img3, img4, img5].filter(img => img && img.includes("SWATCH_"));

    const priceMinor = parsePriceToMinor(r.price, cfg.defaultPrice);
    const colorInfo = deriveColor(cleanedName, idx);

    let material = cfg.defaultMaterial;
    if (cleanedName.toLowerCase().includes("leather")) material = "Full-Grain Leather";
    else if (cleanedName.toLowerCase().includes("aluminium")) material = "Aluminium";
    else if (cleanedName.toLowerCase().includes("polycarbonate")) material = "Polycarbonate";

    const product = {
      id,
      slug,
      name: cleanedName,
      collection: cfg.collection,
      department: "accessories",
      category: cfg.category,
      subcategory: cfg.routeSlug,
      material,
      description: cfg.description,
      dimensions: cfg.dimensions,
      capacity: cfg.capacity,
      weight: cfg.weight,
      tags: [
        "accessories",
        "lifestyle",
        cfg.routeSlug,
        slugify(cfg.category),
        material.toLowerCase(),
        colorInfo.color.toLowerCase().replace(/\s+/g, "-")
      ],
      variants: [
        {
          sku: `OV-${id.toUpperCase().slice(0, 24)}`,
          color: colorInfo.color,
          hex: colorInfo.hex,
          price: priceMinor,
          stock: 12,
          image: mainImg
        }
      ],
      image: mainImg,
      imageKind: "photograph",
      featured: idx % 3 === 0,
      gallery: gallery.length ? gallery : [mainImg],
      images: {
        main: mainImg,
        gallery: gallery.length ? gallery : [mainImg],
        swatches: swatches.length ? swatches : undefined
      },
      price: priceMinor,
      currency: "INR",
      sourceId: r.web_scraper_order || String(idx + 1),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    allAccessories.push(product);
  });
}

// 2. Process Customisation - Address Tags (CSV 9)
{
  const p = path.join("C:/Users/Adarsh/Downloads", "rimowa-com-2026-09-26-5 (9).csv");
  const rows = parseCSV(fs.readFileSync(p, "utf8"));
  console.log(`Processing Customisation: Address Tags (${rows.length} rows)`);

  rows.forEach((r, idx) => {
    const mainImg = localImg(r.image);
    const imgCode = path.basename(r.image || "").replace(/_\d+\.png$/i, "");
    const colorInfo = tagColorMap[imgCode] || { name: `Accent ${idx + 1}`, hex: "#888888" };
    const cleanedName = `Customisation - Leather Address Tag - ${colorInfo.name}`;
    const id = slugify(`${cleanedName}-${r.web_scraper_order || idx + 1}`);

    const img2 = localImg(r.image2);
    const img3 = localImg(r.image3);
    const img4 = localImg(r.image4);
    const img5 = localImg(r.image5);

    const gallery = [mainImg, img2, img3, img4, img5].filter(img => img && !img.includes("SWATCH_"));
    const swatches = [mainImg, img2, img3, img4, img5].filter(img => img && img.includes("SWATCH_"));
    const priceMinor = parsePriceToMinor(r.price, 10500);

    const product = {
      id,
      slug: id,
      name: cleanedName,
      collection: "Customisation",
      department: "accessories",
      category: "Address Tags",
      subcategory: "address-tags",
      material: "Full-Grain Leather",
      description: "Handcrafted in Europe from supple full-grain Italian leather, this address tag adds a personal accent and distinguished identification to any case.",
      dimensions: "10.5 × 6.8 cm",
      capacity: "Identification card & secure leather strap",
      weight: "0.04 kg",
      tags: [
        "accessories",
        "customisation",
        "address-tags",
        "leather-luggage-tags",
        "leather",
        colorInfo.name.toLowerCase().replace(/\s+/g, "-")
      ],
      variants: [
        {
          sku: `OV-TAG-${imgCode}-${colorInfo.name.toUpperCase().slice(0, 4)}`,
          color: colorInfo.name,
          hex: colorInfo.hex,
          price: priceMinor,
          stock: 15,
          image: mainImg
        }
      ],
      image: mainImg,
      imageKind: "photograph",
      featured: idx % 4 === 0,
      gallery: gallery.length ? gallery : [mainImg],
      images: {
        main: mainImg,
        gallery: gallery.length ? gallery : [mainImg],
        swatches: swatches.length ? swatches : undefined
      },
      price: priceMinor,
      currency: "INR",
      sourceId: r.web_scraper_order || String(idx + 1),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    allAccessories.push(product);
  });
}

// 3. Process Customisation - Bag Straps (CSV 11)
{
  const p = path.join("C:/Users/Adarsh/Downloads", "rimowa-com-2026-09-26-5 (11).csv");
  const rows = parseCSV(fs.readFileSync(p, "utf8"));
  console.log(`Processing Customisation: Bag Straps (${rows.length} rows)`);

  rows.forEach((r, idx) => {
    const mainImg = localImg(r.image);
    const imgCode = path.basename(r.image || "").replace(/_\d+\.png$/i, "");
    const strapInfo = strapMap[imgCode] || {
      name: cleanBrand(r.name),
      color: "Classic",
      hex: "#222324",
      price: 25500
    };
    const id = slugify(`${strapInfo.name}-${r.web_scraper_order || idx + 1}`);

    const img2 = localImg(r.image2);
    const img3 = localImg(r.image3);
    const img4 = localImg(r.image4);
    const img5 = localImg(r.image5);

    const gallery = [mainImg, img2, img3, img4, img5].filter(img => img && !img.includes("SWATCH_"));
    const swatches = [mainImg, img2, img3, img4, img5].filter(img => img && img.includes("SWATCH_"));
    const priceMinor = parsePriceToMinor(r.price, strapInfo.price);

    const product = {
      id,
      slug: id,
      name: strapInfo.name,
      collection: "Lifestyle",
      department: "accessories",
      category: "Bag Straps",
      subcategory: "bag-straps",
      material: "Jacquard Webbing & Leather",
      description: "Jacquard woven strap engineered for exceptional durability and comfort. Features premium leather detailing and solid palladium-finish carabiners for quick attachment.",
      dimensions: "Length: 85–135 cm, Width: 4 cm",
      capacity: "Heavy-duty metal snap hooks",
      weight: "0.15 kg",
      tags: [
        "accessories",
        "customisation",
        "bag-straps",
        "bags-straps",
        "straps",
        strapInfo.color.toLowerCase().replace(/\s+/g, "-")
      ],
      variants: [
        {
          sku: `OV-STRAP-${imgCode}`,
          color: strapInfo.color,
          hex: strapInfo.hex,
          price: priceMinor,
          stock: 10,
          image: mainImg
        }
      ],
      image: mainImg,
      imageKind: "photograph",
      featured: true,
      gallery: gallery.length ? gallery : [mainImg],
      images: {
        main: mainImg,
        gallery: gallery.length ? gallery : [mainImg],
        swatches: swatches.length ? swatches : undefined
      },
      price: priceMinor,
      currency: "INR",
      sourceId: r.web_scraper_order || String(idx + 1),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    allAccessories.push(product);
  });
}

// 4. Process Customisation - Wheels (from CSV 12)
{
  const p = path.join("C:/Users/Adarsh/Downloads", "rimowa-com-2026-09-26-5 (12).csv");
  const rows = parseCSV(fs.readFileSync(p, "utf8"));
  const wheelRows = rows.filter(r => (r.name || "").includes("Wheels"));
  console.log(`Processing Customisation: Wheels (${wheelRows.length} rows)`);

  wheelRows.forEach((r, idx) => {
    const mainImg = localImg(r.image);
    const imgCode = path.basename(r.image || "").replace(/_\d+\.png$/i, "");
    const colorInfo = wheelColorMap[imgCode] || { name: `Colour ${idx + 1}`, hex: "#888888" };
    const cleanedName = `Customisation - Classic Wheels Set - ${colorInfo.name}`;
    const id = slugify(`${cleanedName}-${r.web_scraper_order || idx + 1}`);

    const img2 = localImg(r.image2);
    const img3 = localImg(r.image3);
    const img4 = localImg(r.image4);
    const img5 = localImg(r.image5);

    const gallery = [mainImg, img2, img3, img4, img5].filter(img => img && !img.includes("SWATCH_"));
    const swatches = [mainImg, img2, img3, img4, img5].filter(img => img && img.includes("SWATCH_"));
    const priceMinor = parsePriceToMinor(r.price, 19000);

    const product = {
      id,
      slug: id,
      name: cleanedName,
      collection: "Classic",
      department: "accessories",
      category: "Wheels",
      subcategory: "wheels",
      material: "Polycarbonate & Ball Bearing",
      description: "Anodised hubcap wheels engineered with cushioned dual ball-bearing axles for whisper-quiet 360-degree rotation across airport terminals and cobblestones.",
      dimensions: "Diameter: 50 mm (Set of 4)",
      capacity: "Includes 4 multiwheel units",
      weight: "0.25 kg",
      tags: [
        "accessories",
        "customisation",
        "wheels",
        "classic-wheels",
        colorInfo.name.toLowerCase().replace(/\s+/g, "-")
      ],
      variants: [
        {
          sku: `OV-WHEEL-${imgCode}`,
          color: colorInfo.name,
          hex: colorInfo.hex,
          price: priceMinor,
          stock: 12,
          image: mainImg
        }
      ],
      image: mainImg,
      imageKind: "photograph",
      featured: idx % 3 === 0,
      gallery: gallery.length ? gallery : [mainImg],
      images: {
        main: mainImg,
        gallery: gallery.length ? gallery : [mainImg],
        swatches: swatches.length ? swatches : undefined
      },
      price: priceMinor,
      currency: "INR",
      sourceId: r.web_scraper_order || String(idx + 1),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    allAccessories.push(product);
  });
}

// 5. Process Customisation - Stickers (from CSV 10 and 12, deduplicated by main image)
{
  const seenStickerImages = new Set();
  const stickerItems = [];

  // Source A: CSV 10
  const p10 = path.join("C:/Users/Adarsh/Downloads", "rimowa-com-2026-09-26-5 (10).csv");
  const rows10 = parseCSV(fs.readFileSync(p10, "utf8"));
  rows10.forEach(r => {
    const fn = path.basename(r.image || "");
    if (fn && !seenStickerImages.has(fn)) {
      seenStickerImages.add(fn);
      stickerItems.push(r);
    }
  });

  // Source B: CSV 12 (stickers only)
  const p12 = path.join("C:/Users/Adarsh/Downloads", "rimowa-com-2026-09-26-5 (12).csv");
  const rows12 = parseCSV(fs.readFileSync(p12, "utf8"));
  rows12.filter(r => (r.name || "").includes("Sticker")).forEach(r => {
    const fn = path.basename(r.image || "");
    if (fn && !seenStickerImages.has(fn)) {
      seenStickerImages.add(fn);
      stickerItems.push(r);
    }
  });

  console.log(`Processing Customisation: Stickers (${stickerItems.length} unique items)`);

  stickerItems.forEach((r, idx) => {
    const rawName = cleanBrand(r.name);
    const mainImg = localImg(r.image);
    const img2 = localImg(r.image2);
    const gallery = [mainImg, img2].filter(Boolean);

    let defaultPrice = 1000;
    if (rawName.toLowerCase().includes("book")) defaultPrice = 12000;
    else if (rawName.toLowerCase().includes("pilot set")) defaultPrice = 3500;
    const priceMinor = parsePriceToMinor(r.price, defaultPrice);

    const id = slugify(`${rawName}-${r.web_scraper_order || idx + 1}`);

    const product = {
      id,
      slug: id,
      name: rawName,
      collection: "Customisation",
      department: "accessories",
      category: "Stickers",
      subcategory: "stickers",
      material: "Screenprinted Vinyl",
      description: "High-grade screenprinted vinyl sticker designed to personalize your suitcase shell with indelible memories of travels and cultural milestones.",
      dimensions: rawName.toLowerCase().includes("book") ? "24 × 17 cm (Book)" : "Approx. 10 × 12 cm",
      capacity: "Durable permanent adhesive backing",
      weight: "0.01 kg",
      tags: [
        "accessories",
        "customisation",
        "stickers",
        "city-stickers",
        "all-stickers"
      ],
      variants: [
        {
          sku: `OV-STICKER-${slugify(rawName).slice(0, 16).toUpperCase()}-${idx + 1}`,
          color: "Multi",
          hex: "#ffffff",
          price: priceMinor,
          stock: 30,
          image: mainImg
        }
      ],
      image: mainImg,
      imageKind: "photograph",
      featured: idx % 5 === 0,
      gallery: gallery.length ? gallery : [mainImg],
      images: {
        main: mainImg,
        gallery: gallery.length ? gallery : [mainImg]
      },
      price: priceMinor,
      currency: "INR",
      sourceId: r.web_scraper_order || String(idx + 1),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    allAccessories.push(product);
  });
}

console.log(`\nTOTAL accessories products generated: ${allAccessories.length}`);

// Write to src/lib/accessories-collection.ts
const code = `import type { Product } from "./catalog";

export const accessoriesProducts: Product[] = ${JSON.stringify(allAccessories, null, 2)};
`;

fs.writeFileSync("src/lib/accessories-collection.ts", code);
console.log("Successfully wrote src/lib/accessories-collection.ts");
