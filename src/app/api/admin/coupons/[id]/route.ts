import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminApi } from "@/server/admin-auth";
import { deleteAdminCoupon, updateAdminCoupon, getAdminCouponById } from "@/server/admin-service";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, context: Context) {
  const auth = await authorizeAdminApi(req);
  if (!auth.authorized) {
    return auth.response;
  }

  const { id } = await context.params;
  try {
    const coupon = await getAdminCouponById(id);
    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, coupon });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load coupon" }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest, context: Context) {
  const auth = await authorizeAdminApi(req);
  if (!auth.authorized) {
    return auth.response;
  }

  const { id } = await context.params;
  try {
    const body = await req.json();
    const updated = await updateAdminCoupon(id, body, auth.user.email);
    return NextResponse.json({ success: true, coupon: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update coupon" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, context: Context) {
  const auth = await authorizeAdminApi(req);
  if (!auth.authorized) {
    return auth.response;
  }

  const { id } = await context.params;
  try {
    await deleteAdminCoupon(id, auth.user.email);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete coupon" }, { status: 400 });
  }
}
