import { groups, slugify } from "./catalog-helpers";
export { groups, slugify, money } from "./catalog-helpers";
export { filterProducts, type Filters } from "./catalog-filter";
import { newProducts } from './new-collection';
import { importedProducts } from './imported-products';
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
  catalogOrder?: number;
  publishAt?:string|null;
  shortDescription?:string;
  oldPrice?:number;
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
  ogImage?: string;
  ogTitle?: string;
  ogDescription?: string;
  metaTitle?: string;
  metaDescription?: string;
  primarySearchPhrase?: string;
  searchTags?: string;
  canonicalUrl?: string;
  indexing?: string;
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
  catalogCategories?: string[];
  travelTypes?: string[];
  priceOnRequest?: boolean;
  slugAliases?: string[];
  importSources?: { file: string; row: string; category: string }[];
  collections?: string[];
  price?: number;
  sale?: import('./product-sale').ProductSale;
  currency?: string;
  materials?: string[];
  colors?: string[];
  sizes?: string[];
  specifications?: Record<string, string>;
  features?: string[];
  availability?: string;
  maintenanceCare?: string;
  sustainability?: string;
  productAdvisory?: Record<string, string>;
  returnPolicy?: string;
  deliveryTime?: string;
  freeShipping?: boolean;
  shippingClass?: string;
  status?: string;
  storefrontPublished?: boolean;
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
const collections = ["Meridian", "Passage", "Forma", "Interval"];
const rawProducts: Product[] = [
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
              price: 100,
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

// Imported source feeds overlap in a few places. Keep the first canonical
// record for a repeated product URL, then give every remaining purchasable
// variant a stable, unambiguous checkout SKU.
const canonicalProducts = rawProducts.filter(
  (product, index, all) =>
    all.findIndex((candidate) => candidate.slug === product.slug) === index,
);
const usedSkus = new Set<string>();
// The replacement catalog contains only products supplied in the new CSVs.
// Legacy records remain in source/history but are no longer offered for browsing.
export const products: Product[] = canonicalProducts.map((product) => ({
  ...product,
  price: product.variants[0]?.price ?? 100,
  currency: "INR",
  variants: product.variants.map((variant, index) => {
    const sku = usedSkus.has(variant.sku)
      ? `${variant.sku}-${product.slug}-${index + 1}`
      : variant.sku;
    usedSkus.add(sku);
    return { ...variant, sku };
  }),
}));
