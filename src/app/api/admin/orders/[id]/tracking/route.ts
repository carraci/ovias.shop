import { verifiedShipment } from "@/server/logistics";
import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminApi, recordAuditEvent } from "@/server/admin-auth";
import { syncOrderTracking } from "@/lib/shipping/service";
import { transaction } from "@/server/db";
import type { Order } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await authorizeAdminApi(req);
  if (!auth.authorized) {
    return auth.response;
  }

  const { id } = await ctx.params;

  try {
    const order = await transaction(async (repo) => repo.get<Order>("orders", id));
    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      shipping: verifiedShipment(order) ? order.shipping : null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch tracking details." },
      { status: 500 },
    );
  }
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await authorizeAdminApi(req);
  if (!auth.authorized) {
    return auth.response;
  }

  const { id } = await ctx.params;

  try {
    const shipping = await syncOrderTracking(id);
    await recordAuditEvent({
      actor: auth.user.email,
      action: "TRACKING_SYNCED",
      resource: "shipping",
      resourceId: id,
      details: { awb: shipping.awb, status: shipping.status },
    });

    return NextResponse.json({
      success: true,
      shipping,
      message: `Tracking updated from Delhivery: ${shipping.status}`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to refresh tracking from Delhivery." },
      { status: err.status || 500 },
    );
  }
}
