import type { Product } from "./catalog";

export type WishlistItem = {
  sku: string;
  name: string;
  color: string;
  slug: string;
  image: string;
  price: number;
  available: boolean;
};

export function wishlistImage(source: string | undefined): string {
  if (!source) return "";
  if (source.startsWith("/media/") && !source.includes("\\") && !/(?:^|\/)\.\.(?:\/|$)/.test(source)) return source;
  try {
    const url = new URL(source);
    if (url.protocol === "https:" && !url.username && !url.password && ["res.cloudinary.com", "www.rimowa.com"].includes(url.hostname)) return url.href;
  } catch { /* A missing image is displayed honestly. */ }
  return "";
}

export function resolveWishlistItems(skus: string[], products: Product[]): WishlistItem[] {
  const items: WishlistItem[] = [];
  for (const raw of skus) {
    if (!raw) continue;
    let product = products.find((piece) => piece.variants.some((variant) => variant.sku === raw));
    let variant = product?.variants.find((option) => option.sku === raw);
    if (!product) {
      product = products.find((piece) => piece.slug === raw || piece.id === raw);
      variant = product?.variants?.[0];
    }
    if (!product || !variant) continue;
    items.push({
      sku: variant.sku,
      name: product.name,
      color: variant.color || "Classic",
      slug: product.slug,
      image: wishlistImage(variant.image || product.images?.main || product.image) || "/media/account/order-meridian.png",
      price: variant.price,
      available: variant.stock > 0,
    });
  }
  return items;
}
