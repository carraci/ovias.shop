import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminApi } from "@/server/admin-auth";
import {
  getAdminProductById,
  updateAdminProduct,
  deleteAdminProduct,
} from "@/server/admin-service";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeAdminApi(req);
  if (!auth.authorized) {
    return auth.response;
  }

  const { id } = await ctx.params;
  const product = await getAdminProductById(id);

  if (!product) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  return NextResponse.json({ success: true, product });
}

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

    const product = await updateAdminProduct(id, body, auth.user.email);

    return NextResponse.json({
      success: true,
      message: "Product updated successfully.",
      product,
    });
  } catch (err: any) {
    console.error("[PATCH /api/admin/products/[id] error]:", err);
    return NextResponse.json(
      { error: err.message || "Failed to update product." },
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
    await deleteAdminProduct(id, auth.user.email);

    return NextResponse.json({
      success: true,
      message: `Product ${id} deleted successfully.`,
    });
  } catch (err: any) {
    console.error("[DELETE /api/admin/products/[id] error]:", err);
    return NextResponse.json(
      { error: err.message || "Failed to delete product." },
      { status: 500 }
    );
  }
}
