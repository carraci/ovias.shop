import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminApi } from "@/server/admin-auth";
import { getAdminProducts, createAdminProduct } from "@/server/admin-service";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await authorizeAdminApi(req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || undefined;
    const category = searchParams.get("category") || undefined;
    const status = searchParams.get("status") || undefined;

    const products = await getAdminProducts({ query, category, status });
    return NextResponse.json({ success: true, products });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to load products." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await authorizeAdminApi(req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const body = await req.json();
    const product = await createAdminProduct(body, auth.user.email);

    return NextResponse.json({
      success: true,
      product,
    });
  } catch (err: any) {
    console.error("[POST /api/admin/products error]:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create product." },
      { status: 400 }
    );
  }
}
