import { randomUUID } from "node:crypto";
import { z } from "zod";
import { catalog, transaction, type Repository } from "./db";
import { ApiError } from "./http";
import type { Cart, Order, Address, OrderLine } from "@/lib/types";
import { money, type Product } from "@/lib/catalog";
import { queueOrderConfirmation, deliverOrderConfirmation } from "./mail";
import { recordPaidCouponUsage } from "./checkout-pricing";
export const addressSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().max(200),
  line1: z.string().trim().min(5).max(200),
  line2: z.string().trim().max(200).optional(),
  phone: z.string().trim().regex(/^(?:\+91[ -]?)?[6-9][0-9]{9}$/, "Enter a valid Indian mobile number.").optional(),
  city: z.string().trim().min(2).max(100),
  region: z.string().trim().min(2).max(100),
  postalCode: z
    .string()
    .regex(/^[1-9][0-9]{5}$/, "Enter a valid six-digit Indian postal code."),
  country: z.literal("IN"),
});
export function quote(lines: Cart["lines"], products: Product[], allowUnconfirmed = false) {
  return lines.map((line) => {
    const product = products.find((p) =>
      p.variants.some((v) => v.sku === line.sku),
    );
    const v = product?.variants.find((v) => v.sku === line.sku);
    if (!product || !v)
      throw new ApiError(409, "An item is no longer available.");
    if (
      !Number.isInteger(line.quantity) ||
      line.quantity < 1 ||
      line.quantity > 10 ||
      (line.quantity > v.stock && !(allowUnconfirmed && product.availability === "Stock not confirmed"))
    )
      throw new ApiError(409, "Requested quantity is unavailable.");
    return {
      sku: v.sku,
      name: product.name,
      color: v.color,
      price: v.price,
      quantity: line.quantity,
      image: v.image || product.image,
      slug: product.slug,
    };
  });
}
export const total = (lines: OrderLine[]) =>
  lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
export async function readCart(owner: string) {
  const products = await catalog();
  return transaction(async (repo) => {
    const cart = (await repo.get<Cart>("carts", owner)) || {
      id: owner,
      lines: [],
      version: 0,
    };
    const validLines = cart.lines.filter((line) =>
      products.some((p) => p.variants.some((v) => v.sku === line.sku)),
    );
    if (validLines.length !== cart.lines.length) {
      cart.lines = validLines;
      cart.version += 1;
      await repo.put("carts", cart);
    }
    const lines = quote(cart.lines, products, true);
    return { ...cart, lines, total: total(lines) };
  });
}
export async function changeCart(
  owner: string,
  sku: string,
  quantity: number,
  mode: "add" | "set",
  version?: number,
) {
  const products = await catalog();
  return transaction(async (repo) => {
    const cart = (await repo.get<Cart>("carts", owner)) || {
      id: owner,
      lines: [],
      version: 0,
    };
    if (version !== undefined && version !== cart.version)
      throw new ApiError(409, "Your bag changed. Refresh and try again.");
    const validCartLines = cart.lines.filter((line) =>
      products.some((p) => p.variants.some((v) => v.sku === line.sku)),
    );
    const existing = validCartLines.find((l) => l.sku === sku);
    const next =
      mode === "add" ? (existing?.quantity || 0) + quantity : quantity;
    const lines = validCartLines.filter((l) => l.sku !== sku);
    if (next > 0) lines.push({ sku, quantity: next });
    const quoted = quote(lines, products, true);
    await repo.put("carts", { ...cart, lines, version: cart.version + 1 });
    return {
      id: owner,
      lines: quoted,
      version: cart.version + 1,
      total: total(quoted),
    };
  });
}
type Inventory = { id: string; available: number };
async function inventory(repo: Repository, sku: string, products: Product[]) {
  return (
    (await repo.get<Inventory>("inventory", sku)) || {
      id: sku,
      available:
        products.flatMap((p) => p.variants).find((v) => v.sku === sku)?.stock ||
        0,
    }
  );
}
export async function createOrder(
  owner: string,
  userId: string | undefined,
  address: Address,
  key: string,
  provider: Order["provider"],
  checkout?: { quoteId: string; shippingMethod: "standard" | "express"; promoCode?: string },
) {
  let campaignId:string|undefined;
  try{const {cookies}=await import("next/headers");const id=(await cookies()).get("ovia-campaign")?.value;if(id && /^[a-zA-Z0-9-]{1,80}$/.test(id))campaignId=id;}catch{}
  const products = await catalog();
  const createdOrder = await transaction(async (repo) => {
    const prior = (
      await repo.find<Order>("orders", { owner, idempotencyKey: key })
    )[0];
    if (prior) {
      if (prior.provider !== provider)
        throw new ApiError(409, "This payment attempt uses another provider. Review its status before retrying.");
      return prior;
    }
    if (provider === "paypal" || provider === "razorpay") {
      const active = await repo.get<{ id: string; orderId: string }>("checkoutSessions", owner);
      if (active) {
        const existing = await repo.get<Order>("orders", active.orderId);
        if (existing && !["cancelled", "expired", "payment_failed"].includes(existing.status)) {
          const newRazorpayPurchase = provider === "razorpay" && existing.status === "paid" &&
            !!(await repo.get<Cart>("carts", owner))?.lines.length;
          if (!newRazorpayPurchase) {
            if (existing.provider !== provider)
              throw new ApiError(409, "An existing payment uses another provider. Review its status before starting a new payment.");
            return existing;
          }
        }
      }
    }
    const cart = await repo.get<Cart>("carts", owner);
    if (!cart?.lines.length) throw new ApiError(400, "Your bag is empty.");
    const lines = quote(cart.lines, products);
    const checkoutQuote = checkout ? await (await import("./checkout-pricing")).priceLines(lines, cart.version, { shippingMethod: checkout.shippingMethod, promoCode: checkout.promoCode, customerEmail: address.email }, repo, address.email, userId) : undefined;
    if (checkoutQuote && checkoutQuote.id !== checkout?.quoteId) throw new ApiError(409, "Your bag or pricing changed. Review the updated total before placing your order.");
    if (provider !== "demo")
      for (const line of lines) {
        const stock = await inventory(repo, line.sku, products);
        if (stock.available < line.quantity)
          throw new ApiError(
            409,
            "An item has just sold out. Update your bag.",
          );
        await repo.put("inventory", {
          ...stock,
          available: stock.available - line.quantity,
        });
      }
    const order: Order = {
      id: randomUUID(),
      owner,
      userId,
      address,
      idempotencyKey: key,
      lines,
      total: checkoutQuote?.total ?? total(lines),
      checkoutQuote,
      orderNumber: `OVIA-${new Date().getUTCFullYear()}-${randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase()}`,
      campaignId: campaignId && await repo.get("campaigns",campaignId) ? campaignId : undefined,
      provider,
      status: provider === "demo" ? "demo" : checkoutQuote?.total === 0 ? "paid" : "pending",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 35 * 60_000).toISOString(),
    };
    await repo.put("orders", order);

    if (order.status === "paid") await recordPaidCouponUsage(repo, order);

    // Payment verification queues the confirmation; pending and demo orders
    // must not tell customers that a purchase has been confirmed.

    if (provider === "paypal" || provider === "razorpay") await repo.put("checkoutSessions", { id: owner, orderId: order.id });
    if (provider === "demo")
      await repo.put("carts", {
        ...cart,
        lines: [],
        version: cart.version + 1,
      });
    return order;
  });


  return createdOrder;
}
export async function attachProvider(id: string, providerId: string) {
  return transaction(async (repo) => {
    const order = await repo.get<Order>("orders", id);
    if (!order) throw new ApiError(404, "Order not found.");
    await repo.put("orders", { ...order, providerId });
  });
}
export async function finalizePayment(
  id: string,
  providerId: string,
  amount: number,
  eventId: string,
  captureId?: string,
) {
  const updated = await transaction(async (repo) => {
    const order = await repo.get<Order>("orders", id);
    if (
      !order ||
      order.provider === "demo" ||
      order.total !== amount ||
      order.providerId !== providerId ||
      (captureId && order.captureId && captureId !== order.captureId)
    )
      throw new ApiError(409, "Payment details do not match.");
    if (await repo.get("events", eventId)) return order;
    let value = order;
    if (order.status !== "paid" && order.status !== "refund_required") {
      const late = order.inventoryReleased === true ||
        !["pending", "payment_pending"].includes(order.status) ||
        Date.parse(order.expiresAt) <= Date.now();
      value = {
        ...order,
        status: late ? "refund_required" : "paid",
        paidAt: new Date().toISOString(),
        captureId: captureId || order.captureId,
      };
      await repo.put("orders", value);
      if (!late) {
        const cart = await repo.get<Cart>("carts", order.owner);
        if (cart) {
          const remaining = cart.lines
            .map((l) => ({
              ...l,
              quantity: Math.max(
                0,
                l.quantity -
                  (order.lines.find((o) => o.sku === l.sku)?.quantity || 0),
              ),
            }))
            .filter((l) => l.quantity > 0);
          await repo.put("carts", {
            ...cart,
            lines: remaining,
            version: cart.version + 1,
          });
        }
        await recordPaidCouponUsage(repo, value);
        await queueOrderConfirmation(repo, value);
      }
    }
    await repo.put("events", { id: eventId, at: new Date().toISOString() });
    return value;
  });
  if (updated.status === "paid") {
    await deliverOrderConfirmation(updated.id);
    // Automatic event-driven notification: Payment Received (Razorpay webhook verified)
    try {
      const { dispatchNotification } = await import("./notification-service");
      dispatchNotification("PAYMENT_RECEIVED", {
        orderId: updated.id,
        orderNumber: updated.orderNumber || updated.id.slice(0, 8),
        customerName: updated.address.name,
        recipientEmail: updated.address.email,
        paymentId: captureId || updated.captureId || `pay_${updated.id}`,
        amountFormatted: money(updated.total),
        method: updated.provider === "razorpay" ? "Razorpay (UPI / NetBanking / Cards)" : updated.provider.toUpperCase(),
        date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
      }, {
        dedupeKey: `notif_PAYMENT_RECEIVED_${updated.id}_${captureId || updated.captureId || "verified"}`,
      }).catch((err) => console.warn("[notification] Payment received email error:", err));
    } catch (err) {
      console.warn("[notification] Could not dispatch payment received notification:", err);
    }


  }
  if(updated.status === "refund_required" && updated.fulfillmentStatus === "CANCELLED") {
   const {executeLogistics}=await import("./logistics");
   await executeLogistics({orderId:updated.id,action:"cancel",confirmed:true},"Verified payment webhook: cancelled order");
  }
  return updated;
}
export async function expireOrders() {
  return transaction(async (repo) => {
    let count = 0;
    for (const order of await repo.find<Order>("orders", {
      status: "pending",
    })) {
      if (Date.parse(order.expiresAt) > Date.now() || (order.captureLockUntil || 0) > Date.now()) continue;
      for (const line of order.lines) {
        const stock = await repo.get<Inventory>("inventory", line.sku);
        if (stock)
          await repo.put("inventory", {
            ...stock,
            available: stock.available + line.quantity,
          });
      }
      await repo.put("orders", { ...order, status: "expired", inventoryReleased: true });
      const active = await repo.get<{ id: string; orderId: string }>("checkoutSessions", order.owner);
      if (active?.orderId === order.id) await repo.remove("checkoutSessions", order.owner);
      count++;
    }
    return { expired: count };
  });
}
