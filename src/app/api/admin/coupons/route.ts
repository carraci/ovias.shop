import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminApi, recordAuditEvent } from "@/server/admin-auth";
import { getAdminCoupons, createAdminCoupon } from "@/server/admin-service";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await authorizeAdminApi(req);
  if (!auth.authorized) {
    return auth.response;
  }

  const coupons = await getAdminCoupons();
  return NextResponse.json({ success: true, coupons });
}

export async function POST(req: NextRequest) {
  const auth = await authorizeAdminApi(req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const body = await req.json();
    const coupon = await createAdminCoupon(body, auth.user.email);
    return NextResponse.json({ success: true, coupon });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create coupon" }, { status: 400 });
  }
}
