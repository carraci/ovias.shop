import { NextRequest, NextResponse } from "next/server";
import { storefrontCatalog as catalog } from "@/server/storefront-catalog";

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

    return NextResponse.json(product, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
}
