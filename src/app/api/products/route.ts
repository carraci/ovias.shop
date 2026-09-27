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
      category: category && category !== "luggage" ? category : undefined,
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

    return NextResponse.json(result, {
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
