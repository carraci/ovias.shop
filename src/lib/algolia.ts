import { algoliasearch } from "algoliasearch";

export const ALGOLIA_APP_ID =
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || "";
export const ALGOLIA_SEARCH_KEY =
  process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY || "";
export const ALGOLIA_INDEX_NAME =
  process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME || "ovia_products";

export interface AlgoliaProductHit {
  objectID: string;
  id: string;
  name: string;
  slug: string;
  sku: string;
  department?: string;
  category: string;
  subcategory?: string;
  material?: string;
  color?: string;
  price: number;
  image: string;
  images?: string[];
  description?: string;
  dimensions?: string;
  volume?: string;
  weight?: string;
  tags?: string[];
  _highlightResult?: Record<string, { value: string; matchLevel: string }>;
}

let searchClientInstance: ReturnType<typeof algoliasearch> | null = null;

export function getAlgoliaSearchClient() {
  if (!ALGOLIA_APP_ID || !ALGOLIA_SEARCH_KEY) throw new Error("Algolia search is not configured.");
  if (!searchClientInstance) {
    searchClientInstance = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_SEARCH_KEY);
  }
  return searchClientInstance;
}

export async function searchAlgoliaProducts(
  query: string,
  options?: {
    hitsPerPage?: number;
    page?: number;
    filters?: string;
  }
): Promise<{
  hits: AlgoliaProductHit[];
  nbHits: number;
  page: number;
  nbPages: number;
}> {
  const client = getAlgoliaSearchClient();
  const searchParams = {
    query: query || "",
    hitsPerPage: options?.hitsPerPage ?? 12,
    page: options?.page ?? 0,
    ...(options?.filters ? { filters: options.filters } : {}),
  };

  try {
    const response = (await client.searchSingleIndex({
      indexName: ALGOLIA_INDEX_NAME,
      searchParams,
    })) as unknown as {
      hits: AlgoliaProductHit[];
      nbHits: number;
      page: number;
      nbPages: number;
    };

    return {
      hits: response.hits || [],
      nbHits: response.nbHits || 0,
      page: response.page || 0,
      nbPages: response.nbPages || 0,
    };
  } catch (error) {
    throw error;
  }
}

export async function saveAlgoliaProduct(p: any) {
  const writeKey = process.env.ALGOLIA_WRITE_KEY;
  if (!writeKey) return;
  try {
    const client = algoliasearch(ALGOLIA_APP_ID, writeKey);
    const objectID = String(p.id || p.sku || p.slug);
    const record = {
      objectID,
      id: String(p.id || p.sku || p.slug),
      name: p.name,
      slug: p.slug,
      sku: p.sku || p.variants?.[0]?.sku || "",
      department: p.department || (p.category === "luggage" ? "luggage" : "bags"),
      category: p.category,
      subcategory: p.subcategory || p.subCategory,
      material: p.material,
      color: p.color || p.variants?.[0]?.color,
      price: typeof p.price === "number" ? p.price : (p.variants?.[0]?.price ?? 0),
      image: p.image || (Array.isArray(p.images) ? p.images[0] : "/media/pdp/hero_main.png"),
      images: Array.isArray(p.images) ? p.images.slice(0, 4) : undefined,
      description: p.description || p.summary || "",
      dimensions: p.dimensions,
      volume: p.volume,
      weight: p.weight,
      tags: Array.isArray(p.tags) ? p.tags : [],
    };
    await client.saveObjects({
      indexName: ALGOLIA_INDEX_NAME,
      objects: [record],
    });
  } catch (err) {
    console.warn("[Algolia save error, non-blocking]:", err);
  }
}

export async function deleteAlgoliaProduct(productId: string) {
  const writeKey = process.env.ALGOLIA_WRITE_KEY;
  if (!writeKey) return;
  try {
    const client = algoliasearch(ALGOLIA_APP_ID, writeKey);
    await client.deleteObjects({
      indexName: ALGOLIA_INDEX_NAME,
      objectIDs: [String(productId)],
    });
  } catch (err) {
    console.warn("[Algolia delete error, non-blocking]:", err);
  }
}
