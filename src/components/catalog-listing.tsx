import type { ComponentProps } from "react";
import { CatalogView } from "./catalog-view";
import { listingProduct, prepareListing, type ListingQuery } from "@/lib/catalog-listing";

export function CatalogListing({ products, query, ...props }: ComponentProps<typeof CatalogView> & { query?: ListingQuery }) {
  if (query) return <CatalogView {...props} {...prepareListing(products, props.base || {}, query)} />;
  const department = props.base?.department;
  return <CatalogView {...props} products={products
    .filter(product => !department || product.department === department)
    .map(listingProduct)} />;
}
