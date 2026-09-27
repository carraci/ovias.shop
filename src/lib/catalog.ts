import { newProducts } from './new-collection';
import { bagsProducts } from './bags-collection';
import { luggageProducts } from './luggage-collection';
import { accessoriesProducts } from './accessories-collection';
export type Department = "luggage" | "bags" | "accessories";
export type Variant = {
  sku: string;
  color: string;
  hex: string;
  price: number;
  stock: number;
  image?: string;
  size?: string;
};
export type Product = {
  id: string;
  slug: string;
  name: string;
  collection: string;
  department: Department;
  category: string;
  material: string;
  description: string;
  dimensions: string;
  capacity: string;
  weight: string;
  tags: string[];
  variants: Variant[];
  image: string;
  imageKind: "illustration" | "photograph";
  featured: boolean;
  // Extended fields populated by the importer (optional for static catalog)
  gallery?: string[];
  images?: {
    main?: string;
    gallery?: string[];
    swatches?: string[];
    // Optional roles on the existing image object; legacy galleries still work.
    thumbnails?: string[];
    editorial?: string[];
    details?: string[];
    dimensions?: string[];
    materials?: string[];
    craftsmanship?: string[];
  };
  sourceId?: string;
  sourceUrl?: string;
  subcategory?: string;
  collections?: string[];
  price?: number;
  currency?: string;
  materials?: string[];
  colors?: string[];
  sizes?: string[];
  specifications?: Record<string, string>;
  features?: string[];
  availability?: string;
  stock?: number;
  createdAt?: string;
  updatedAt?: string;
};
export const colors = [
  { color: "Graphite", hex: "#464744" },
  { color: "Dune", hex: "#b5a58b" },
  { color: "Forest", hex: "#596450" },
  { color: "Silver", hex: "#bec1bd" },
  { color: "Midnight Blue", hex: "#384c5c" },
];
export const groups: Record<Department, [string, number][]> = {
  luggage: [
    ["Cabin", 62],
    ["Check-In", 32],
    ["Trunk", 29],
    ["Emblematic pieces", 117],
  ],
  bags: [
    ["Backpacks", 11],
    ["Duffle Bags", 4],
    ["Briefcases", 2],
    ["Crossbodies", 8],
    ["Totes", 2],
    ["Shoulder Bags", 6],
    ["Hand Carry", 8],
  ],
  accessories: [
    ["iPhone Cases", 12],
    ["Phone Cases", 3],
    ["Hats", 3],
    ["Sunglasses", 14],
    ["Belts", 4],
    ["Card Holders", 3],
    ["Address Tags", 13],
    ["Wheels", 12],
    ["Stickers", 38],
    ["Bag Straps", 5],
    ["Organisers", 2],
    ["Pet Carrier Bag", 1],
    ["Foldable Bags", 1],
    ["Garment Bags", 1],
    ["Care Products", 1],
  ],
};
export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const collections = ["Meridian", "Passage", "Forma", "Interval"];
export const products: Product[] = [
  ...Object.entries(groups).flatMap(([department, categories]) => {
    if (department === "bags") {
      return bagsProducts;
    }
    if (department === "luggage") {
      return luggageProducts;
    }
    if (department === "accessories") {
      return accessoriesProducts;
    }
    return categories.flatMap(([category, count]) =>
      Array.from({ length: count }, (_, i) => {
        const collection = collections[i % 4];
        const suffix =
          i >= 4 ? ` ${["", "Plus", "Edition"][Math.floor(i / 4)]}` : "";
        const singular: Record<string, string> = {
          Backpacks: "Backpack",
          "Duffle Bags": "Weekender",
          Sunglasses: "Sunglasses",
          Crossbodies: "Crossbody",
          Accessories: "Accessory",
        };
        const name = `${collection} ${singular[category] || category.replace(/s$/, "")}${suffix}`;
        const slug = slugify(name);
        const index = i + category.length;
        const material =
          department === "luggage"
            ? ["Polycarbonate", "Aluminium", "Polycarbonate", "Leather"][i % 4]
            : ["Nylon", "Leather", "Aluminium"][i % 3];
        const base =
          department === "luggage"
            ? (category === "Cabin"
                ? 24500
                : category === "Check-In"
                  ? 32500
                  : 42500) +
              i * 1500
            : 1200 + i * 650;
        return {
          id: slug,
          slug,
          name,
          collection,
          department: department as Department,
          category,
          material,
          description:
            department === "luggage"
              ? "An understated companion for the road ahead. A considered interior, a balanced silhouette, and space for the things that matter."
              : "A small detail that makes the journey your own. Considered proportions, quiet character, and an easy place in your daily routine.",
          dimensions:
            department === "luggage"
              ? category === "Cabin"
                ? "55 × 38 × 23 cm"
                : category === "Check-In"
                  ? "70 × 46 × 28 cm"
                  : "80 × 44 × 36 cm"
              : "See product notes",
          capacity:
            department === "luggage"
              ? category === "Cabin"
                ? "38 L"
                : category === "Check-In"
                  ? "70 L"
                  : "100 L"
              : "—",
          weight:
            department === "luggage"
              ? "3.4 kg"
              : "—",
          tags: [
            category === "Cabin" ? "short-trips" : "long-haul",
            ...(i % 3 === 0 ? ["gifts", "signature-pieces"] : []),
          ],
          variants: colors
            .slice(0, 2)
            .map((c, j) => ({
              ...c,
              sku: `OV-${slug.toUpperCase()}-${j}`,
              price: (base + j * 500) * 100,
              stock: i === 9 && j === 0 ? 0 : 12,
            })),
          image: `/media/${department}.svg`,
          imageKind: "illustration" as const,
          featured: index % 3 === 0,
        };
      }),
    );
  }),
  ...newProducts,
];
export const money = (minor: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(minor / 100);
export type Filters = {
  department?: string;
  category?: string;
  subCategory?: string;
  subcategory?: string;
  q?: string;
  material?: string;
  color?: string;
  collection?: string;
  sort?: string;
  page?: string;
  limit?: string;
  tag?: string;
  use?: string;
};
export function filterProducts(catalog: Product[], f: Filters) {
  const subcat = (f.subcategory || f.subCategory || "").toLowerCase();
  let result = catalog.filter(
    (p) => {
      // Department filter
      if (f.department && p.department !== f.department) return false;

      // Category filter
      if (f.category) {
        const cat = f.category.toLowerCase();
        const pCat = p.category.toLowerCase();
        const isTrunk = (cat === "trunk" || cat === "trunks" || cat === "large-luggage" || cat === "large") && (pCat.includes("trunk") || p.tags.includes("trunk"));
        const isCabin = cat === "cabin" && (pCat === "cabin" || p.tags.includes("cabin"));
        const isCheckIn = (cat === "check-in" || cat === "checkin") && (pCat.includes("check") || p.tags.includes("check-in"));
        const isEmblematic = cat === "emblematic-pieces" && (p.tags.includes("emblematic") || p.tags.includes("best-sellers"));
        const isPhoneCase = (cat === "iphone-cases" || cat === "phone-cases") && (pCat.includes("phone") || p.subcategory === "iphone-cases" || p.tags.includes("iphone-cases"));
        const isHat = (cat === "hats" || cat === "hat") && (pCat.includes("hat") || p.tags.includes("hats"));
        const isGlasses = (cat === "sunglasses" || cat === "eyewear") && (pCat.includes("sunglass") || p.tags.includes("sunglasses"));
        const isBelt = (cat === "belts" || cat === "belt") && (pCat.includes("belt") || p.tags.includes("belts"));
        const isCardHolder = (cat === "card-holders" || cat === "card-holder") && (pCat.includes("card") || p.tags.includes("card-holders"));
        const isAddressTag = (cat === "address-tags" || cat === "address-tag" || cat === "leather-luggage-tags") && (pCat.includes("tag") || p.tags.includes("address-tags"));
        const isStickers = (cat === "stickers" || cat === "sticker" || cat === "all-stickers" || cat === "city-stickers") && (pCat.includes("sticker") || p.tags.includes("stickers"));
        const isBagStrap = (cat === "bag-straps" || cat === "bag-strap" || cat === "bags-straps" || cat === "straps") && (pCat.includes("strap") || p.tags.includes("bag-straps"));
        const isWheels = (cat === "wheels" || cat === "wheel" || cat === "classic-wheels") && (pCat.includes("wheel") || p.tags.includes("wheels"));
        const isCustomisation = (cat === "customisation" || cat === "customization") && (p.tags.includes("customisation") || p.tags.includes("customization") || isAddressTag || isStickers || isBagStrap || isWheels);
        const matchesCat = isTrunk || isCabin || isCheckIn || isEmblematic || isPhoneCase || isHat || isGlasses || isBelt || isCardHolder || isAddressTag || isStickers || isBagStrap || isWheels || isCustomisation ||
          slugify(p.category) === cat ||
          p.tags.includes(cat) ||
          p.name.toLowerCase().includes(cat);
        if (!matchesCat) return false;
      }

      // Subcategory filter
      if (subcat) {
        const isTrunkSub = (subcat === "trunk" || subcat === "trunks" || subcat === "large-luggage" || subcat === "large") && (p.category.toLowerCase().includes("trunk") || p.tags.includes("trunk"));
        const isCabinSub = subcat === "cabin" && (p.category.toLowerCase() === "cabin" || p.tags.includes("cabin"));
        const isCheckInSub = (subcat === "check-in" || subcat === "checkin") && (p.category.toLowerCase().includes("check") || p.tags.includes("check-in"));
        const isBestSellers = subcat === "best-sellers" && (p.tags.includes("best-sellers") || p.tags.includes("emblematic"));
        const isNewArrivals = subcat === "new-arrivals" && p.tags.includes("new-arrivals");
        const isShortTrips = (subcat === "short-trips" || subcat === "short-trip") && (p.tags.includes("short-trips") || p.tags.includes("cabin"));
        const isLongJourneys = (subcat === "long-journeys" || subcat === "long-haul") && (p.tags.includes("long-haul") || p.tags.includes("long-journeys") || p.category.toLowerCase().includes("check") || p.category.toLowerCase().includes("trunk"));
        const isBusiness = (subcat === "business-selection" || subcat === "business") && (p.tags.includes("business-selection") || p.tags.includes("business-bags"));
        const isCustomisationSub = (subcat === "customisation" || subcat === "customization") && (p.tags.includes("customisation") || p.tags.includes("customization"));
        const isAddressTagSub = (subcat === "address-tags" || subcat === "address-tag") && (p.category.toLowerCase().includes("tag") || p.tags.includes("address-tags"));
        const isStickersSub = (subcat === "stickers" || subcat === "all-stickers") && (p.category.toLowerCase().includes("sticker") || p.tags.includes("stickers"));
        const isBagStrapSub = (subcat === "bag-straps" || subcat === "bag-strap") && (p.category.toLowerCase().includes("strap") || p.tags.includes("bag-straps"));
        const isWheelsSub = (subcat === "wheels" || subcat === "wheel") && (p.category.toLowerCase().includes("wheel") || p.tags.includes("wheels"));
        const matchesSubcat = isTrunkSub || isCabinSub || isCheckInSub || isBestSellers || isNewArrivals || isShortTrips || isLongJourneys || isBusiness ||
          isCustomisationSub || isAddressTagSub || isStickersSub || isBagStrapSub || isWheelsSub ||
          p.name.toLowerCase().includes(subcat) ||
          p.tags.includes(slugify(subcat)) ||
          (p.subcategory && p.subcategory.toLowerCase() === subcat);
        if (!matchesSubcat) return false;
      }

      // Search query
      if (f.q && !`${p.name} ${p.material} ${p.category} ${p.description}`.toLowerCase().includes(f.q.toLowerCase().slice(0, 100))) {
        return false;
      }

      // Material
      if (f.material) {
        const mat = f.material.toLowerCase();
        const pMat = p.material.toLowerCase();
        if (pMat !== mat && !pMat.includes(mat) && !p.tags.includes(mat) && !(p.materials && p.materials.some(m => m.toLowerCase().includes(mat)))) {
          return false;
        }
      }

      // Color
      if (f.color) {
        const fc = f.color.toLowerCase();
        const hasColor = p.variants.some((v) => {
          const vc = v.color.toLowerCase();
          if (vc === fc || vc.includes(fc)) return true;
          if (fc === "black" && (vc.includes("black") || vc.includes("graphite"))) return true;
          if (fc === "grey" && (vc.includes("grey") || vc.includes("graphite") || vc.includes("titanium"))) return true;
          if (fc === "silver" && vc.includes("silver")) return true;
          if ((fc === "blue" || fc === "midnight blue") && (vc.includes("blue") || vc.includes("midnight") || vc.includes("indigo") || vc.includes("navy"))) return true;
          if (fc === "green" && vc.includes("green")) return true;
          if (fc === "white" && vc.includes("white")) return true;
          if (fc === "brown" && (vc.includes("brown") || vc.includes("dune") || vc.includes("clay") || vc.includes("cognac"))) return true;
          return false;
        }) || (p.colors && p.colors.some(c => c.toLowerCase().includes(fc))) ||
          (p.tags && ((fc === "blue" || fc === "midnight blue") ? (p.tags.includes("blue") || p.tags.includes("midnight-blue")) : p.tags.includes(fc)));
        if (!hasColor) return false;
      }

      // Collection
      if (f.collection) {
        const col = f.collection.toLowerCase();
        const pCol = p.collection.toLowerCase();
        const matchesCol = pCol === col || (col === "emblematic" && (p.tags.includes("emblematic") || p.tags.includes("best-sellers"))) || (p.collections && p.collections.some(c => c.toLowerCase() === col));
        if (!matchesCol) return false;
      }

      // Tag
      if (f.tag) {
        const t = f.tag.toLowerCase();
        const matchesTag = p.tags.includes(t) ||
          (t === "emblematic" && (p.tags.includes("emblematic") || p.tags.includes("best-sellers") || p.tags.includes("signature-pieces"))) ||
          ((t === "long-journeys" || t === "long-haul") && (p.tags.includes("long-haul") || p.tags.includes("long-journeys") || p.category.toLowerCase().includes("check") || p.category.toLowerCase().includes("trunk"))) ||
          (t === "short-trips" && (p.tags.includes("short-trips") || p.tags.includes("cabin"))) ||
          ((t === "business-selection" || t === "business") && (p.tags.includes("business-selection") || p.tags.includes("business-bags"))) ||
          (t === "gifts" && p.tags.includes("gifts"));
        if (!matchesTag) return false;
      }

      // Use
      if (f.use) {
        if (f.use === "business" && !(p.tags.includes("business-bags") || p.tags.includes("business-selection"))) return false;
        if (f.use === "travel" && !p.tags.includes("travel-bags")) return false;
      }

      return true;
    }
  );

  if (f.sort === "price-asc")
    result = result.sort((a, b) => (a.variants[0]?.price || 0) - (b.variants[0]?.price || 0));
  if (f.sort === "price-desc")
    result = result.sort((a, b) => (b.variants[0]?.price || 0) - (a.variants[0]?.price || 0));
  if (f.sort === "name")
    result = result.sort((a, b) => a.name.localeCompare(b.name));

  const total = result.length;
  const pageSize = f.limit ? Math.max(1, Number(f.limit) || 24) : 36;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(
    pages,
    Math.max(1, Number.parseInt(f.page || "1") || 1),
  );
  return {
    items: result.slice((page - 1) * pageSize, page * pageSize),
    total,
    page,
    limit: pageSize,
    pages,
  };
}
