import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminApi } from "@/server/admin-auth";
import { mongo } from "@/server/db";
import { buildProductTaxonomy, type SavedCategory, type CategorizedProduct } from "@/server/product-taxonomy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function GET(req: NextRequest) {
  const auth = await authorizeAdminApi(req);
  if (!auth.authorized) return auth.response;
  try {
    const db = (await mongo()).db(process.env.MONGODB_DB || "ovia");
    const [saved, products] = await Promise.all([
      db
        .collection<SavedCategory>("categories")
        .find(
          {},
          {
            projection: {
              _id: 0,
              id: 1,
              name: 1,
              slug: 1,
              parent: 1,
              status: 1,
            },
          },
        )
        .toArray(),
      db
        .collection<CategorizedProduct>("products")
        .find(
          {},
          {
            projection: {
              _id: 0,
              department: 1,
              category: 1,
              subcategory: 1,
              catalogCategories: 1,
            },
          },
        )
        .toArray(),
    ]);
    return NextResponse.json(
      { success: true, categories: buildProductTaxonomy(saved, products) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to load live product categories." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
