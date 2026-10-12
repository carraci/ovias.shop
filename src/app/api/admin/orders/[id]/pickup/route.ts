import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminApi, recordAuditEvent } from "@/server/admin-auth";
import { requestOrderPickup } from "@/lib/shipping/service";

export const runtime = "nodejs";

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
    const body = await req.json().catch(() => ({}));
    const { pickupDate, pickupTime, pickupLocation, expectedCount } = body;

    const shipping = await requestOrderPickup(id, {
      pickupDate,
      pickupTime,
      pickupLocation,
      expectedCount: expectedCount ? Number(expectedCount) : 1,
    });

    await recordAuditEvent({
      actor: auth.user.email,
      action: "PICKUP_SCHEDULED",
      resource: "shipping",
      resourceId: id,
      details: {
        awb: shipping.awb,
        pickupId: shipping.pickup?.pickupId,
        date: pickupDate,
        time: pickupTime,
      },
    });

    return NextResponse.json({
      success: true,
      shipping,
      message: shipping.pickup?.message || "Delhivery pickup scheduled successfully.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to schedule pickup with Delhivery." },
      { status: err.status || 500 },
    );
  }
}
