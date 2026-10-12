import { NextRequest } from "next/server";
import { z } from "zod";
import { api, body, originCheck, ApiError } from "@/server/http";
import { customerOrder } from "@/server/customer-order";
import { verifiedShipment } from "@/server/logistics";
import { transaction, catalog } from "@/server/db";
import { createCareTicket } from "@/server/care-order-requests";
const input = z
  .object({
    exchange: z.boolean(),
    reason: z.string().trim().min(1).max(200),
    details: z.string().trim().max(2000).optional(),
    pickupAddress: z.string().trim().min(10).max(600),
    pickupPhone: z.string().trim().min(7).max(30),
    attachments: z.array(z.uuid()).max(5).optional(),
    items: z
      .array(
        z
          .object({
            sku: z.string().min(1).max(150),
            quantity: z.number().int().positive(),
          })
          .strict(),
      )
      .min(1)
      .max(100),
    replacementSku: z.string().trim().min(1).max(150).optional(),
    idempotencyKey: z.uuid(),
  })
  .strict();
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  return api(async () => {
    originCheck(req);
    const { id } = await ctx.params;
    const { user } = await customerOrder(id);
    const data = input.parse(await body(req));
    const products = data.exchange ? await catalog() : [];
    return transaction(async (repo) => {
      const order = await repo.get<import("@/lib/types").Order>("orders", id);
      if (
        order?.returnDeadline &&
        !(Date.parse(order.returnDeadline) > Date.now())
      )
        throw new ApiError(
          409,
          "The return deadline has passed. Contact support.",
        );
      if (
        !order ||
        !verifiedShipment(order) ||
        order.shipping?.status !== "DELIVERED" ||
        order.status !== "paid" ||
        order.refunds?.some((refund) => refund.status !== "Failed")
      )
        throw new ApiError(
          409,
          "A paid, courier-confirmed delivery without an active refund is required. Contact support if you need help.",
        );
      let replacement = "";
      if (data.exchange) {
        if (data.items.length !== 1 || !data.replacementSku)
          throw new ApiError(
            400,
            "Choose one product and an available replacement.",
          );
        const original = order.lines.find(
          (line) => line.sku === data.items[0].sku,
        );
        const product = products.find((value) => value.slug === original?.slug);
        const variant = product?.variants.find(
          (value) => value.sku === data.replacementSku,
        );
        const inventory = variant
          ? await repo.get<{ id: string; available: number }>(
              "inventory",
              variant.sku,
            )
          : undefined;
        if (
          !original ||
          !variant ||
          (inventory?.available ?? variant.stock) < data.items[0].quantity
        )
          throw new ApiError(
            409,
            "This replacement is unavailable. Choose another option or contact support.",
          );
        replacement = `\nRequested replacement: ${variant.sku} · ${variant.color}${variant.size ? ` · ${variant.size}` : ""}. Quantity: ${data.items[0].quantity}. Price difference for review: ${(((variant.price - original.price) * data.items[0].quantity) / 100).toFixed(2)} INR. Stock checked at request time; approval does not reserve stock.`;
      }
      return createCareTicket(repo, user, {
        category: "Return",
        subject: `${data.exchange ? "Exchange" : "Return"} request · ${order.orderNumber || id}`,
        message: `${data.exchange ? "Exchange product" : "Return for refund"}: ${data.reason}${data.details ? `\n${data.details}` : ""}\nRequested pickup address: ${data.pickupAddress}\nPickup contact: ${data.pickupPhone}${replacement}`,
        attachments: data.attachments,
        orderId: id,
        idempotencyKey: data.idempotencyKey,
        orderAction: {
          type: "return",
          items: data.items,
        },
      });
    });
  });
}
