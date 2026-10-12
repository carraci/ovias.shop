import type { Product } from "./catalog";
import { filterProducts, type Filters } from "./catalog-filter";
import { catalogFacets } from "./catalog-facets";

export type ListingQuery = Record<string, string | string[] | undefined>;
export type PreparedListing = {
  pagination: { total: number; page: number; pages: number };
  facets: ReturnType<typeof catalogFacets>;
};

export function prepareListing(products: Product[], base: Filters, query: ListingQuery) {
  const values = Object.fromEntries(Object.entries(query).map(([key, value]) => [key, Array.isArray(value) ? value.at(-1) : value]));
  const fixed = Object.fromEntries(Object.entries(base).filter(([, value]) => value !== undefined));
  const filters: Filters = { ...values, ...fixed, limit: base.limit || values.limit || "12" };
  const scoped = products.filter(product => !base.department || product.department === base.department);
  const result = filterProducts(scoped, filters);
  return {
    products: result.items.map(listingProduct),
    prepared: {
      pagination: { total: result.total, page: result.page, pages: result.pages },
      facets: catalogFacets(scoped, base, filters),
    } satisfies PreparedListing,
  };
}

// Listing pages need card and filter data; galleries and admin metadata stay on the server.
export function listingProduct(product: Product): Product {
  const image = [product.image, product.images?.main, ...(product.images?.gallery || []), ...(product.gallery || []), ...product.variants.map(v => v.image)]
    .find(source => source?.startsWith("/media/imported/") || source?.startsWith("/media/uploads/")) || product.image;
  return {
    id: product.id, catalogOrder: product.catalogOrder, slug: product.slug, name: product.name, collection: product.collection,
    department: product.department, category: product.category, material: product.material,
    description: product.description, dimensions: product.dimensions, capacity: product.capacity, weight: product.weight,
    tags: product.tags, variants: product.variants, image, imageKind: product.imageKind, featured: product.featured,
    subcategory: product.subcategory, catalogCategories: product.catalogCategories,
    travelTypes: product.travelTypes, materials: product.materials, colors: product.colors,
    collections: product.collections, priceOnRequest: product.priceOnRequest,
  };
}
