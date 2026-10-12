import { verifiedShipment } from "@/server/logistics";
import { NextRequest } from "next/server";
import { transaction } from "@/server/db";
import { api, ApiError } from "@/server/http";
import { currentUser, cartOwner } from "@/server/auth";
import type { Order } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ orderId: string }> },
) {
  return api(async () => {
    const { orderId } = await ctx.params;
    const user = await currentUser();
    const guestOwner = await cartOwner();

    return transaction(async (repo) => {
      const order = await repo.get<Order>("orders", orderId);
      if (!order) {
        throw new ApiError(404, "Order not found.");
      }

      const isOwner =
        order.owner === (user?.id || guestOwner) ||
        (user && order.userId === user.id);
      const isStaff = user?.role === "admin" || user?.role === "support";

      if (!isOwner && !isStaff) {
        throw new ApiError(
          403,
          "Access denied. You can only view tracking for your own orders.",
        );
      }

      return {
        id: order.id,
        orderNumber:
          order.orderNumber || `OVIA-${order.id.slice(0, 8).toUpperCase()}`,
        createdAt: order.createdAt,
        status: order.status,
        shipping: verifiedShipment(order) ? order.shipping : null,
        address: {
          name: order.address.name,
          city: order.address.city,
          region: order.address.region,
          postalCode: order.address.postalCode,
          country: order.address.country,
          line1: order.address.line1,
          line2: order.address.line2,
        },
        lines: order.lines.map((l) => ({
          sku: l.sku,
          name: l.name,
          color: l.color,
          price: l.price,
          quantity: l.quantity,
          image: l.image,
          slug: l.slug,
        })),
        total: order.total,
      };
    });
  });
}
