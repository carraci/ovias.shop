import { createHash } from "node:crypto";
import type { Product } from "./catalog";

export type VendorCsvInput = { file: string; folder: string; path?: string; rows: Record<string, string>[] };
const clean = (value: string = "") => value.replace(/\s+/g, " ").trim();
const slug = (value: string) => clean(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const hash = (value: string) => createHash("sha256").update(value).digest("hex").slice(0, 16);
const categoryOrder = ["Backpacks", "Tote Bags", "Crossbody Bags", "Shoulder Bags", "Duffel Bags", "Briefcases", "Weekend Bags", "Travel Bags"];
const colorHex: Record<string, string> = { black: "#222222", grey: "#777777", silver: "#bfc2c5", blue: "#2451a1", navy: "#152747", green: "#426346", olive: "#6d7242", yellow: "#e3c743", red: "#a32f35", pink: "#d4a5b3", purple: "#7a5a92", orange: "#dc7b30", brown: "#795d42", beige: "#c3b394", white: "#eeeeee", teal: "#347979", maroon: "#762936", anthracite: "#414449", ivory: "#efebdf", marine: "#2451a1" };
const folderNames: Record<string, string> = {
  backpacks: "Backpacks", "tore bags": "Tote Bags", "crossboody bags": "Crossbody Bags",
  "shoulder bags": "Shoulder Bags", "duffle bags": "Duffel Bags", "weekends bakgs": "Weekend Bags", "travel bags": "Travel Bags",
};

export function csvPrice(value: string = "") {
  if (/%/.test(value)) return undefined;
  const number = value.match(/\d[\d,]*(?:\.\d{1,2})?/)?.[0];
  const amount = number ? Number(number.replaceAll(",", "")) : NaN;
  return Number.isFinite(amount) && amount > 0 ? Math.round(amount * 100) : undefined;
}

function imageKey(value: string) {
  const url = new URL(value);
  return url.origin + url.pathname.replace(/_(?:\d+x\d*|\d+x)(?=\.)/g, "");
}
function imageUrls(row: Record<string, string>) {
  const seen = new Set<string>();
  return Object.entries(row).filter(([key]) => /^image\d*$/.test(key)).map(([, value]) => value).filter(value => {
    try {
      const url = new URL(value);
      if (url.protocol !== "https:" || !["wildcraft.com", "safaribags.com", "vipbags.com"].includes(url.hostname)) return false;
      const key = imageKey(value);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    } catch { return false; }
  });
}

export function classifyVendorBag(name: string, row: Record<string, string>, folder: string) {
  if (/rain\s*cheater|\b(?:t-shirt|shirt|raincoat|suit|chalk)\b/i.test(name)) return { excluded: "Non-catalogue clothing or climbing accessory" };
  const type = Object.values(row).find(value => /^(?:BP|DF|HL|SL)$/.test(value.trim()));
  const backpack = /backpack|rucksack|school\s+bag/i.test(name) || type === "BP" || (/overnighter/i.test(name) && folder === "backpacks");
  const duffel = /duff[el]+|\bduf\b/i.test(name) || type === "DF";
  const luggage = !duffel && (/trolley|suitcase|luggage/i.test(name) || type === "HL" || type === "SL");
  const tote = /\btote\b/i.test(name);
  const crossbody = /cross[ -]?body|\bsling\b|messenger/i.test(name);
  const shoulder = /shoulder|\bhobo\b/i.test(name) || crossbody || tote;
  const briefcase = /briefcase/i.test(name);
  const overnight = /weekend|overnight/i.test(name);
  const capacity = Number(name.match(/\b(\d+(?:\.\d+)?)\s*l\b/i)?.[1]);
  const weekend = overnight || (folder === "weekends bakgs" && duffel && !/\blarge\b/i.test(name) && (!capacity || capacity <= 40));
  const values = Object.values(row).map(clean);
  const sizes = [...new Set(values.filter(value => /^(?:Cabin|Small|Medium|Large)$/.test(value)).map(value => value === "Cabin" ? "Small" : value))];
  const titleSize = name.match(/\b(Cabin|Small|Medium|Large)\b/i)?.[1];
  if (titleSize && !sizes.length) sizes.push(/^cabin|small$/i.test(titleSize) ? "Small" : titleSize[0].toUpperCase() + titleSize.slice(1).toLowerCase());
  if (luggage) {
    const categories = ["Luggage", ...(sizes.includes("Small") ? ["Cabin Luggage", "Small Luggage"] : []), ...(sizes.includes("Medium") ? ["Check-in Luggage", "Medium Luggage"] : []), ...(sizes.includes("Large") ? ["Check-in Luggage", "Large Luggage"] : [])];
    return { department: "luggage" as const, category: sizes.length === 1 ? `${sizes[0]} Luggage` : "Luggage", categories, sizes };
  }
  const primary = backpack ? "Backpacks" : tote ? "Tote Bags" : duffel ? "Duffel Bags" : briefcase ? "Briefcases" : crossbody ? "Crossbody Bags" : shoulder ? "Shoulder Bags" : overnight ? "Weekend Bags" : undefined;
  if (!primary) return { excluded: "Product type cannot be verified from name or source type" };
  const categories = new Set([primary]);
  if (!backpack && shoulder) categories.add("Shoulder Bags");
  if (!backpack && crossbody) categories.add("Crossbody Bags");
  if (weekend) categories.add("Weekend Bags");
  if (duffel || overnight || /travel|rucksack/i.test(name) || folder === "travel bags") categories.add("Travel Bags");
  return { department: "bags" as const, category: primary, categories: categoryOrder.filter(value => categories.has(value)), sizes };
}

export function buildVendorCsvCatalog(inputs: VendorCsvInput[]) {
  const products = new Map<string, Product & { vendorImport: { key: string; batch: string; sources: { file: string; folder: string; row: string }[]; capture: number }; imageSources: string[] }>();
  const excluded: { file: string; folder: string; row: string; name: string; reason: string }[] = [];
  const corrections: { file: string; folder: string; name: string; department: string; category: string }[] = [];
  const priceConflicts: { name: string; previous: number; incoming: number }[] = [];
  let rows = 0;
  for (const input of inputs) for (const row of input.rows) {
    rows++;
    const brand = input.file.startsWith("wildcraft") ? "Wildcraft" : input.file.startsWith("safari") ? "Safari" : "Skybags";
    const rawName = clean(row.title || row.data);
    const name = rawName.toLowerCase().startsWith(brand.toLowerCase()) ? rawName : `${brand} ${rawName}`;
    const classification = classifyVendorBag(name, row, input.folder);
    const images = imageUrls(row);
    const prices = [csvPrice(row.price), csvPrice(row.price2)].filter((value): value is number => value !== undefined);
    const reason = !rawName ? "Missing product name" : classification.excluded || (!images.length ? "Missing usable product photograph" : !prices.length ? "Missing source price" : undefined);
    if (reason) { excluded.push({ file: input.file, folder: input.folder, row: row.web_scraper_order, name, reason }); continue; }
    if (!classification.department || !classification.categories || !classification.category) throw new Error("Unclassified product");
    const wildcardPath = brand === "Wildcraft" ? Object.values(row).find(value => /^\/[a-z0-9][a-z0-9/-]+$/i.test(value)) : undefined;
    const identity = `${brand}|${wildcardPath || clean(name).toLowerCase().replace(/\bbags?\b/g, "").replace(/\s+/g, " ").trim() + "|" + imageKey(images[0])}`;
    const key = hash(identity);
    const capture = Number(row.web_scraper_order?.split("-")[0]) || 0;
    const price = Math.min(...prices);
    const oldPrice = Math.max(...prices);
    const colorPattern = /\b(black|grey|gray|silver|blue|navy|green|yellow|red|pink|purple|orange|brown|beige|white|teal|olive|maroon|anthracite|ivory|marine)\b/gi;
    const normalizedColorName = name.replaceAll("_", " ");
    const colorText = normalizedColorName.match(colorPattern)?.length ? normalizedColorName : (wildcardPath || "").replaceAll("-", " ");
    const colorValues = [...new Set((colorText.match(colorPattern) || []).map(value => value.toLowerCase().replace("gray", "grey")))];
    const color = /\bnavy\s+blue\b/i.test(colorText) && colorValues.length === 2 ? "Navy Blue" : colorValues.map(value => value[0].toUpperCase() + value.slice(1)).join(" & ") || Object.values(row).find(value => /^(?:Black|Grey|Silver|Blue|Navy Blue|Green|Red|Pink|Olive|Teal|Yellow|Ivory|Marine)$/i.test(value)) || "As pictured";
    const category = classification.category;
    let product = products.get(key);
    if (!product) {
      const productSlug = `${slug(name).slice(0, 95).replace(/-$/, "")}-${key.slice(0, 8)}`;
      const image = `/media/imported/vendor-bags-${key}-1.webp`;
      const material = /polycarbonate/i.test(name) ? "Polycarbonate" : /polypropylene/i.test(name) ? "Polypropylene" : /polyester/i.test(name) ? "Polyester" : /nylon/i.test(name) ? "Nylon" : /canvas/i.test(name) ? "Canvas" : /leather/i.test(name) ? "Leather" : "";
      product = {
        id: `vendor-bag-${key}`, slug: productSlug, name, collection: brand,
        department: classification.department, category, subcategory: category, catalogCategories: classification.categories,
        material, description: name, dimensions: name.match(/\b\d+(?:\.\d+)?\s*(?:[x×]\s*\d+(?:\.\d+)?\s*){2}cm\b/i)?.[0] || "",
        capacity: name.match(/\b\d+(?:\.\d+)?\s*l\b/i)?.[0] || "", weight: "",
        tags: [classification.department, ...classification.categories.map(slug)], sizes: classification.sizes,
        variants: [{ sku: `VENDOR-BAG-${key.toUpperCase()}`, color, hex: colorHex[colorValues[0] || color.toLowerCase()] || "#888888", price, stock: 0, image, ...(classification.sizes.length === 1 ? { size: classification.sizes[0] } : {}) }],
        colors: [color], image, gallery: [image], imageKind: "photograph", featured: false,
        price, oldPrice: oldPrice > price ? oldPrice : undefined, priceOnRequest: /\bfrom\b/i.test(row.price || ""), currency: "INR",
        status: "Out of Stock", storefrontPublished: true, availability: "Stock not confirmed",
        specifications: { Brand: brand, "Source price label": clean(row.price), ...(classification.sizes.length ? { "Source sizes": classification.sizes.join(", ") } : {}) },
        vendorImport: { key, batch: "bags-2026-10-12", capture, sources: [] }, imageSources: images,
      };
      products.set(key, product);
    } else {
      if (product.price !== price) priceConflicts.push({ name, previous: product.price || 0, incoming: price });
      for (const categoryName of classification.categories) if (!product.catalogCategories?.includes(categoryName)) product.catalogCategories!.push(categoryName);
      for (const source of images) if (!product.imageSources.some(value => imageKey(value) === imageKey(source))) product.imageSources.push(source);
      if (capture >= product.vendorImport.capture) {
        product.price = price; product.oldPrice = oldPrice > price ? oldPrice : undefined;
        product.priceOnRequest = /\bfrom\b/i.test(row.price || "");
        product.specifications!["Source price label"] = clean(row.price);
        product.variants[0].price = price; product.vendorImport.capture = capture;
      }
    }
    product.vendorImport.sources.push({ file: input.file, folder: input.folder, row: row.web_scraper_order });
    product.tags = [...new Set([product.department, ...product.catalogCategories!.map(slug)])];
    if (!classification.categories.includes(folderNames[input.folder])) corrections.push({ file: input.file, folder: input.folder, name, department: classification.department, category });
  }
  const list = [...products.values()].sort((a, b) => {
    if (a.department !== b.department) return a.department === "bags" ? -1 : 1;
    const rank = (value: string) => { const index = categoryOrder.indexOf(value); return index < 0 ? 99 : index; };
    return rank(a.category) - rank(b.category) || a.name.localeCompare(b.name);
  });
  list.forEach((product, index) => { product.catalogOrder = index; });
  return { products: list, report: { files: inputs.length, rows, products: list.length, duplicateRows: rows - excluded.length - list.length, excluded, corrections, priceConflicts, categoryCounts: Object.fromEntries(categoryOrder.map(category => [category, list.filter(product => product.department === "bags" && product.catalogCategories!.includes(category)).length])), luggage: list.filter(product => product.department === "luggage").length } };
}
