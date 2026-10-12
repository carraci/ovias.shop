import "server-only";
import { products } from "@/lib/catalog";
import type { MegaProductCard } from "@/lib/mega-menu-data";

// Only the displayed menu cards cross the client boundary, not the full catalog.
export const menuProducts: { luggage: MegaProductCard[]; bags: MegaProductCard[] } = {
  luggage: products.filter(product => product.department === "luggage").slice(0, 7).map(product => ({
    name: product.name.split("|")[0], subtitle: product.material || product.category,
    image: product.image, href: `/products/${product.slug}`,
  })),
  bags: products.filter(product => product.department === "bags").slice(0, 7).map(product => ({
    name: product.name.split("|")[0], subtitle: product.material || product.category,
    image: product.image, href: `/products/${product.slug}`,
  })),
};
