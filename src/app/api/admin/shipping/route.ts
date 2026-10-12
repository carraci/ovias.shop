import { mutateShipping } from "@/server/logistics-api";
import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminApi } from "@/server/admin-auth";
import { mongo } from "@/server/db";
import { executeLogistics, verifiedShipment } from "@/server/logistics";
import type { Order } from "@/lib/types";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
const trackingChecks = new Map<string, number>();
const trackingInFlight = new Map<string, Promise<Order>>();
async function refreshTracking(order: Order): Promise<Order> {
  if (!process.env.DELHIVERY_API_TOKEN || !order.shipping?.awb ||
      ["cancelled", "demo", "expired", "payment_failed"].includes(order.status)) return order;
  const pending = trackingInFlight.get(order.id);
  if (pending) return pending;
  if (Date.now() - (trackingChecks.get(order.id) || 0) < 60000) return order;
  trackingChecks.set(order.id, Date.now());
  if (trackingChecks.size > 2000) trackingChecks.delete(trackingChecks.keys().next().value!);
  const task = executeLogistics({orderId: order.id, action: "reconcile", confirmed: true}, "Automatic courier tracking")
    .catch(() => order).finally(() => trackingInFlight.delete(order.id));
  trackingInFlight.set(order.id, task);
  return task;
}
export async function GET(req: NextRequest) {
  const auth = await authorizeAdminApi(req);
  if (!auth.authorized) return auth.response;
  try {
    const client = await mongo();
    let orders: Order[] = await client
      .db(process.env.MONGODB_DB || "ovia")
      .collection<Order>("orders")
      .find(
        { status: { $ne: "demo" }, provider: { $ne: "demo" } },
        {
          projection: {
            _id: 0,
            id: 1,
            orderNumber: 1,
            address: 1,
            lines: 1,
            total: 1,
            status: 1,
            provider: 1,
            captureId: 1,
            shipping: 1,
            refunds: 1,
            logisticsOperations: 1,
            fulfillmentStatus: 1,
            inventoryReleased: 1,
            createdAt: 1,
          },
        },
      )
      .sort({ createdAt: -1 })
      .limit(1000)
      .toArray();
    // Read tracking from the courier; never create a shipment during a page refresh.
    for (let offset = 0; offset < orders.length; offset += 5) {
      const refreshed = await Promise.all(orders.slice(offset, offset + 5).map(refreshTracking));
      orders.splice(offset, refreshed.length, ...refreshed);
    }
    const notices = await client
      .db(process.env.MONGODB_DB || "ovia")
      .collection("outbox")
      .find(
        {
          id: {
            $in: orders.flatMap((order) => [
              `shipping-ready_to_ship-${order.id}`,
              `shipping-cancelled-${order.id}`,
            ]),
          },
        },
        { projection: { _id: 0, id: 1, status: 1 } },
      )
      .toArray();
    const configured = !!(
      process.env.DELHIVERY_API_TOKEN &&
      process.env.DELHIVERY_PICKUP_LOCATION &&
      process.env.DELHIVERY_WEBHOOK_SECRET
    );
    const shipments = orders.map((order) => {
      const verified = verifiedShipment(order),
        operation =
          order.logisticsOperations?.cancel ||
          order.logisticsOperations?.approve;
      return {
        orderId: order.id,
        orderNumber: order.orderNumber || order.id,
        customer: order.address.name,
        address: order.address,
        items: order.lines.map((l) => ({
          name: l.name,
          quantity: l.quantity,
          image: l.image,
        })),
        amount: order.total / 100,
        paymentStatus: order.status,
        awb: verified ? order.shipping?.awb : undefined,
        courier: verified ? order.shipping?.courier : undefined,
        status:
          operation?.status === "Processing"
            ? "Processing"
            : operation?.status === "Failed"
              ? "Failed"
              : order.status === "cancelled"
                ? "CANCELLED"
                : order.shipping?.awb && !verified
                  ? "Unverified shipment"
                  : verified
                    ? order.shipping?.status
                    : order.status === "paid"
                      ? "Awaiting approval"
                      : order.status === "demo"
                        ? "Demo - no real shipment"
                        : order.status === "expired"
                          ? "Checkout expired"
                          : order.status === "refund_required"
                            ? "Payment requires review"
                            : "Payment not confirmed",
        fulfillmentStatus: order.fulfillmentStatus,
        pickup: verified ? order.shipping?.pickup : undefined,
        eta: verified ? order.shipping?.estimatedDelivery : undefined,
        events: verified ? order.shipping?.events : [],
        operation,
        refund: order.refunds?.at(-1),
        inventoryRestored: order.inventoryReleased === true,
        notificationStatus: (() => {
          const record = notices.find(
            (n) =>
              n.id ===
              `shipping-${order.status === "cancelled" ? "cancelled" : "ready_to_ship"}-${order.id}`,
          );
          return record?.status === "sent"
            ? "Sent"
            : record
              ? "Queued"
              : "Not queued";
        })(),
        canReconcile: !!process.env.DELHIVERY_API_TOKEN,
        canApprove:
          configured &&
          order.status === "paid" &&
          order.provider === "razorpay" &&
          /^pay_[A-Za-z0-9]+$/.test(order.captureId || "") &&
          !order.logisticsOperations?.cancel &&
          !order.refunds?.some((r) => r.status !== "Failed") &&
          (!order.shipping?.awb || verified) &&
          operation?.status !== "Processing" &&
          operation?.status !== "Confirmed",
        canCancel:
          !["cancelled", "demo", "expired", "payment_failed"].includes(
            order.status,
          ) &&
          (!order.shipping?.awb || verified) &&
          ![
            "PICKED_UP",
            "IN_TRANSIT",
            "OUT_FOR_DELIVERY",
            "DELIVERED",
            "RTO",
            "RETURNED",
            "NDR",
          ].includes(order.shipping?.status || "") &&
          operation?.status !== "Processing",
      };
    });
    return NextResponse.json(
      {
        success: true,
        shipments,
        configured,
        webhookConfigured: !!process.env.DELHIVERY_WEBHOOK_SECRET,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Shipping data is unavailable. Please refresh.",
      },
      { status: 503 },
    );
  }
}
export async function POST(req: NextRequest) {
  return mutateShipping(req);
}
