import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminApi } from "@/server/admin-auth";
import { transaction } from "@/server/db";
import { verifiedShipment } from "@/server/logistics";
import { DelhiveryShippingProvider } from "@/lib/shipping/delhivery";
import type { Order } from "@/lib/types";
export const runtime = "nodejs";
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await authorizeAdminApi(req);
  if (!auth.authorized) return auth.response;
  try {
    const { id } = await ctx.params;
    const order = await transaction((repo) => repo.get<Order>("orders", id));
    if (!order || !verifiedShipment(order))
      return NextResponse.json(
        { error: "A verified courier shipment is required." },
        { status: 409 },
      );
    const label = await new DelhiveryShippingProvider().getShippingLabel(
      order.shipping!.awb!,
    );
    if (!label.success || !label.labelUrl)
      return NextResponse.json(
        { error: "Courier label is not confirmed." },
        { status: 502 },
      );
    const url = new URL(label.labelUrl);
    if (
      !["track.delhivery.com", "staging-express.delhivery.com"].includes(
        url.hostname,
      ) &&
      !url.hostname.endsWith(".delhivery.com")
    )
      return NextResponse.json(
        { error: "Courier label requires review." },
        { status: 502 },
      );
    return NextResponse.redirect(url);
  } catch {
    return NextResponse.json(
      { error: "Courier label is unavailable." },
      { status: 503 },
    );
  }
}
