import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminApi } from "@/server/admin-auth";
import { getAdminOrderById } from "@/server/admin-service";
import {readRepository} from "@/server/db";
import type {Order} from "@/lib/types";
import {verifiedShipment} from "@/server/logistics";
import {orderWorkflow} from "@/lib/order-workflow";
import {orderPaymentStatus} from "@/lib/order-document";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeAdminApi(req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const params = await ctx.params;
    const order = await getAdminOrderById(params.id);
    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }
    const raw = await readRepository(repo=>repo.get<Order>("orders",order.rawId));
    const verified = raw ? {...raw,shipping:verifiedShipment(raw)?raw.shipping:undefined} : null;

    return NextResponse.json({
      success: true,
      order,
      workflow: verified ? {...orderWorkflow(verified),payment:orderPaymentStatus(verified),refunds:(verified.refunds||[]).map(refund=>({status:refund.status,amount:refund.amount})),operation:verified.logisticsOperations?.cancel || verified.logisticsOperations?.approve,shipment:verified.shipping,returnRequest:await readRepository(repo=>repo.get<{id:string;status:string}>("order_return_requests",verified.id))} : null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch order details." },
      { status: 500 }
    );
  }
}
