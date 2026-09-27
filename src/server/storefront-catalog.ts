import { MongoNetworkError, MongoServerSelectionError } from "mongodb";
import { products, type Product } from "@/lib/catalog";
import { catalog, isDemo } from "./db";

// Browsing serves MongoDB products when available (populated by the importer),
// falling back to the bundled static catalog for zero-downtime dev.
export async function storefrontCatalog(
  load: () => Promise<Product[]> = catalog,
): Promise<Product[]> {
  if (isDemo() && load === catalog) return products;
  try {
    const dbProducts = await load();
    if (load !== catalog) return dbProducts;
    if (dbProducts.length > 0) return dbProducts;
    return products;
  } catch (e) {
    if (
      e instanceof MongoNetworkError ||
      e instanceof MongoServerSelectionError ||
      (e as NodeJS.ErrnoException).code === "ECONNREFUSED"
    ) {
      console.warn("[storefront-catalog] MongoDB unavailable, serving static catalog");
      return products;
    }
    throw e;
  }
}
