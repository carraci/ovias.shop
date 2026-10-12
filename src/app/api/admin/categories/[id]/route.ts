import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminApi } from "@/server/admin-auth";
import { updateAdminCategory, deleteAdminCategory } from "@/server/admin-service";

export const runtime = "nodejs";

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeAdminApi(req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const { id } = await ctx.params;
    const body = await req.json();

    await updateAdminCategory(id, body, auth.user.email);

    return NextResponse.json({
      success: true,
      message: "Category updated successfully.",
    });
  } catch (err: any) {
    console.error("[PATCH /api/admin/categories/[id] error]:", err);
    return NextResponse.json(
      { error: err.message || "Failed to update category." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeAdminApi(req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const { id } = await ctx.params;
    await deleteAdminCategory(id, auth.user.email);

    return NextResponse.json({
      success: true,
      message: `Category ${id} deleted successfully.`,
    });
  } catch (err: any) {
    console.error("[DELETE /api/admin/categories/[id] error]:", err);
    return NextResponse.json(
      { error: err.message || "Failed to delete category." },
      { status: 500 }
    );
  }
}
