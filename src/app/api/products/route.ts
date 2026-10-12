import { NextRequest, NextResponse } from "next/server";
import { filterProducts, type Filters } from "@/lib/catalog";
import { storefrontCatalog as catalog } from "@/server/storefront-catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const category = searchParams.get("category") || undefined;
    const subcategory = searchParams.get("subcategory") || searchParams.get("subCategory") || undefined;
    const department = searchParams.get("department") || (category === "luggage" || category === "bags" || category === "accessories" ? category : undefined);
    const material = searchParams.get("material") || undefined;
    const color = searchParams.get("color") || undefined;
    const collection = searchParams.get("collection") || undefined;
    const sort = searchParams.get("sort") || undefined;
    const q = searchParams.get("q") || searchParams.get("search") || undefined;
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "24";
    const tag = searchParams.get("tag") || undefined;
    const use = searchParams.get("use") || undefined;

    const filters: Filters = {
      department,
      category: category && (searchParams.has("department") || category !== "luggage") ? category : undefined,
      subcategory,
      material,
      color,
      collection,
      sort,
      q,
      page,
      limit,
      tag,
      use,
    };

    const allProducts = await catalog();
    const result = filterProducts(allProducts, filters);
    const sanitizedItems = result.items.map((item) => {
      const clone = { ...(item as unknown as Record<string, unknown>) };
      delete clone.sourceUrl;
      delete clone.source_url;
      delete clone.sourceId;
      delete clone.source_id;
      delete clone.originalUrl;
      delete clone.original_url;
      delete clone.brand_url;
      delete clone.brandUrl;
      delete clone.external_product_url;
      delete clone.externalProductUrl;
      return clone;
    });

    return NextResponse.json(
      { ...result, items: sanitizedItems },
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
}
