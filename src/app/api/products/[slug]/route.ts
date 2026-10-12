import { relatedProductsFor } from "@/lib/related-products";
import { NextRequest, NextResponse } from "next/server";
import { storefrontCatalog as catalog } from "@/server/storefront-catalog";

import { productColorOptions } from "@/lib/product-colors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = {
  params: Promise<{ slug: string }>;
};

export async function GET(_req: NextRequest, ctx: Context) {
  try {
    const { slug } = await ctx.params;
    const allProducts = await catalog();
    const product = allProducts.find((p) => p.slug === slug || p.id === slug);

    if (!product) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 }
      );
    }

    const sanitizedProduct = { ...(product as unknown as Record<string, unknown>) };
    delete sanitizedProduct.sourceUrl;
    delete sanitizedProduct.source_url;
    delete sanitizedProduct.sourceId;
    delete sanitizedProduct.source_id;
    delete sanitizedProduct.originalUrl;
    delete sanitizedProduct.original_url;
    delete sanitizedProduct.brand_url;
    delete sanitizedProduct.brandUrl;
    delete sanitizedProduct.external_product_url;
    delete sanitizedProduct.externalProductUrl;

    if (_req.nextUrl.searchParams.get("includeColors") === "1") sanitizedProduct.colorOptions = productColorOptions(product, allProducts);
    if (_req.nextUrl.searchParams.get("includeRelated") === "1") sanitizedProduct.relatedProducts = relatedProductsFor(product, allProducts).map(p => ({ id:p.id, slug:p.slug, name:p.name, collection:p.collection, department:p.department, category:p.category, image:p.image, priceOnRequest:p.priceOnRequest, variants:p.variants }));
    return NextResponse.json(sanitizedProduct, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
}
