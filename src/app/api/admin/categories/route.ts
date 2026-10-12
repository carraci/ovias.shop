import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminApi } from "@/server/admin-auth";
import { getAdminCategories, createAdminCategory } from "@/server/admin-service";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await authorizeAdminApi(req);
  if (!auth.authorized) {
    return auth.response;
  }

  const categories = await getAdminCategories();
  return NextResponse.json({ success: true, categories });
}

export async function POST(req: NextRequest) {
  const auth = await authorizeAdminApi(req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const body = await req.json();
    const category = await createAdminCategory(body, auth.user.email);

    return NextResponse.json({
      success: true,
      category,
    });
  } catch (err: any) {
    console.error("[POST /api/admin/categories error]:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create category." },
      { status: 400 }
    );
  }
}
