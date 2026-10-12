import { z } from "zod";
import { catalog, transaction } from "./db";
import { ApiError } from "./http";
import { resolveWishlistItems } from "@/lib/account-wishlist";
import type { User } from "@/lib/types";

type WishlistUser = User & { accountWishlist?: string[] };
const wishlistInput = z.object({
  sku: z.string().trim().min(1).max(180).regex(/^[A-Za-z0-9._-]+$/, "Choose a valid OVIA piece."),
}).strict();

function savedSkus(user: WishlistUser): string[] {
  return [...new Set((Array.isArray(user.accountWishlist) ? user.accountWishlist : []).filter((value): value is string => typeof value === "string"))].slice(0, 50);
}

export async function readAccountWishlist(userId: string) {
  const products = await catalog();
  return transaction(async (repo) => {
    const user = await repo.get<WishlistUser>("users", userId);
    if (!user) throw new ApiError(401, "Please sign in.");
    return resolveWishlistItems(savedSkus(user), products);
  });
}

export async function changeAccountWishlist(userId: string, input: unknown, mode: "save" | "remove") {
  const { sku } = wishlistInput.parse(input);
  const products = await catalog();
  const matchedProduct = products.find(
    (p) => p.variants.some((v) => v.sku === sku) || p.slug === sku || p.id === sku,
  );
  if (mode === "save" && !matchedProduct) {
    throw new ApiError(404, "This OVIA piece is no longer available.");
  }
  const resolvedSku =
    matchedProduct?.variants.find((v) => v.sku === sku)?.sku ||
    matchedProduct?.variants[0]?.sku ||
    sku;

  return transaction(async (repo) => {
    // Read the current record in this transaction so profile changes are retained.
    const user = await repo.get<WishlistUser>("users", userId);
    if (!user) throw new ApiError(401, "Please sign in.");
    const skus = savedSkus(user);
    if (mode === "save" && !skus.includes(resolvedSku) && skus.length >= 50) {
      throw new ApiError(409, "You can save up to 50 pieces to your wishlist.");
    }
    const next =
      mode === "save"
        ? [...new Set([...skus, resolvedSku])]
        : skus.filter((saved) => saved !== resolvedSku && saved !== sku);
    await repo.put("users", { ...user, accountWishlist: next });
    return resolveWishlistItems(next, products);
  });
}
