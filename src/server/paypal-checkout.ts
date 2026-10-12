import { transaction } from "./db";
import { createOrder, expireOrders } from "./commerce";
import { checkoutQuote, recordPaidCouponUsage } from "./checkout-pricing";
import { ApiError } from "./http";
import {
  createPayPalOrder,
  capturePayPalOrder,
  getPayPalOrder,
  approvalUrl,
  requirePayPal,
  type PayPalOrder,
} from "./paypal";
import { queueOrderConfirmation, deliverOrderConfirmation } from "./mail";
import type { Address, Order, Cart } from "@/lib/types";
import type { PaymentSession, ShippingMethod } from "@/lib/checkout";

export async function ownedCheckoutOrder(owner: string, id: string) {
  const order = await transaction((repo) => repo.get<Order>("orders", id));
  if (!order || order.owner !== owner || order.provider !== "paypal")
    throw new ApiError(404, "Checkout session not found.");
  return order;
}
export function session(order: Order): PaymentSession {
  return {
    id: order.id,
    orderNumber: order.orderNumber || order.id.slice(0, 8),
    status: order.status,
    provider: order.provider,
    approvalUrl: order.approvalUrl,
    total: order.total,
    payment: order.checkoutQuote?.payment,
    quote: order.checkoutQuote,
    address: order.address,
  };
}
export async function activeCheckout(owner: string) {
  await expireOrders();
  const record = await transaction((repo) =>
    repo.get<{ id: string; orderId: string }>("checkoutSessions", owner),
  );
  return record
    ? session(await ownedCheckoutOrder(owner, record.orderId))
    : null;
}
export async function beginPayPalCheckout(
  owner: string,
  userId: string | undefined,
  input: {
    address: Address;
    quoteId: string;
    shippingMethod: ShippingMethod;
    promoCode?: string;
    idempotencyKey: string;
  },
) {
  requirePayPal();
  const active = await activeCheckout(owner);
  if (!active) {
    const quote = await checkoutQuote(owner, input, input.address.email, userId);
    if (!quote.payment)
      throw new ApiError(
        503,
        "PayPal currency conversion is not configured. Please contact OVIA support.",
      );
    if (quote.id !== input.quoteId)
      throw new ApiError(
        409,
        "Your bag or pricing changed. Review your updated total.",
      );
  }
  const order = await createOrder(
    owner,
    userId,
    input.address,
    input.idempotencyKey,
    "paypal",
    input,
  );
  if (order.status === "paid") return session(order);
  if (
    ["cancelled", "expired", "payment_failed", "refund_required"].includes(
      order.status,
    )
  )
    throw new ApiError(
      409,
      "This payment attempt is closed. Please start a new checkout.",
    );
  if (order.providerId && order.approvalUrl) return session(order);
  const remote = await createPayPalOrder(order);
  if (!remote.id)
    throw new ApiError(503, "Payment approval is unavailable. Please retry.");
  const link = approvalUrl(remote);
  if (!link)
    throw new ApiError(503, "Payment approval is unavailable. Please retry.");
  const updated = await transaction(async (repo) => {
    const current = await repo.get<Order>("orders", order.id);
    if (!current) throw new ApiError(404, "Checkout session not found.");
    if (current.providerId && current.providerId !== remote.id)
      throw new ApiError(
        409,
        "Payment session changed. Please verify its status.",
      );
    const value = { ...current, providerId: remote.id, approvalUrl: link };
    await repo.put("orders", value);
    return value;
  });
  return session(updated);
}
function cents(value: string) {
  if (!/^\d+\.\d{2}$/.test(value))
    throw new ApiError(409, "Payment amount could not be verified.");
  const result = Number(value.replace(".", ""));
  if (!Number.isSafeInteger(result))
    throw new ApiError(409, "Payment amount could not be verified.");
  return result;
}
export async function reconcilePayPal(order: Order, remote: PayPalOrder) {
  if (
    !order.providerId ||
    remote.id !== order.providerId ||
    remote.purchase_units?.length !== 1
  )
    throw new ApiError(409, "Payment details could not be verified.");
  const unit = remote.purchase_units[0];
  const expected = order.checkoutQuote?.payment;
  if (
    !expected ||
    unit.custom_id !== order.id ||
    unit.amount?.currency_code !== expected.currency ||
    cents(unit.amount.value) !== expected.amount
  )
    throw new ApiError(409, "Payment details could not be verified.");
  const captures = unit.payments?.captures || [];
  if (!captures.length) return order;
  if (
    captures.length !== 1 ||
    captures[0].amount.currency_code !== expected.currency ||
    cents(captures[0].amount.value) !== expected.amount
  )
    throw new ApiError(409, "Payment details could not be verified.");
  const capture = captures[0];
  const paid =
    capture.status === "COMPLETED" &&
    capture.final_capture === true &&
    remote.status === "COMPLETED";
  const updated = await transaction(async (repo) => {
    const current = await repo.get<Order>("orders", order.id);
    if (!current) throw new ApiError(404, "Checkout session not found.");
    if (current.status === "paid" && ["REFUNDED", "PARTIALLY_REFUNDED"].includes(capture.status)) {
      const reviewed: Order = { ...current, status: "refund_required" };
      await repo.put("orders", reviewed); return reviewed;
    }
    if (current.status === "paid" || current.status === "refund_required")
      return current;
    if (!paid) {
      const value = {
        ...current,
        status:
          capture.status === "PENDING"
            ? ("payment_pending" as const)
            : ("payment_failed" as const),
        captureId: capture.id,
        captureLockUntil: 0,
      };
      if (capture.status === "PENDING") {
        await repo.put("orders", value);
        return value;
      }
      if (!["DECLINED", "DENIED", "FAILED"].includes(capture.status))
        throw new ApiError(
          409,
          "Payment needs merchant review. Please contact OVIA support.",
        );
      if (!current.inventoryReleased)
        for (const line of current.lines) {
          const stock = await repo.get<{ id: string; available: number }>(
            "inventory",
            line.sku,
          );
          if (stock)
            await repo.put("inventory", {
              ...stock,
              available: stock.available + line.quantity,
            });
        }
      const failed = { ...value, inventoryReleased: true };
      await repo.put("orders", failed);
      const active = await repo.get<{ id: string; orderId: string }>(
        "checkoutSessions",
        current.owner,
      );
      if (active?.orderId === current.id)
        await repo.remove("checkoutSessions", current.owner);
      return failed;
    }
    const late =
      current.inventoryReleased ||
      current.status === "expired" ||
      current.status === "cancelled";
    const value: Order = {
      ...current,
      status: late ? "refund_required" : "paid",
      captureId: capture.id,
      paidAt: new Date().toISOString(),
      captureLockUntil: 0,
    };
    await repo.put("orders", value);
    await repo.put("events", {
      id: `paypal-capture-${capture.id}`,
      createdAt: new Date().toISOString(),
    });
    if (!late) {
      const cart = await repo.get<Cart>("carts", current.owner);
      if (cart)
        await repo.put("carts", {
          ...cart,
          version: cart.version + 1,
          lines: cart.lines
            .map((line) => ({
              ...line,
              quantity: Math.max(
                0,
                line.quantity -
                  (current.lines.find((item) => item.sku === line.sku)
                    ?.quantity || 0),
              ),
            }))
            .filter((line) => line.quantity > 0),
        });
      await recordPaidCouponUsage(repo, value);
      await queueOrderConfirmation(repo, value);
      const active = await repo.get<{ id: string; orderId: string }>(
        "checkoutSessions",
        current.owner,
      );
      if (active?.orderId === order.id)
        await repo.remove("checkoutSessions", current.owner);
    }
    return value;
  });
  if (updated.status === "paid") {
    await deliverOrderConfirmation(updated.id);
    try {
      const { createOrderShipment } = await import("@/lib/shipping/service");
      await createOrderShipment(updated.id);
    } catch (err) {
      console.warn("[Auto-shipping creation]", (err as Error).message);
    }
  }
  return updated;
}
export async function verifyCheckout(owner: string, id: string) {
  const order = await ownedCheckoutOrder(owner, id);
  if (
    !order.providerId ||
    order.status === "paid" ||
    order.status === "refund_required"
  )
    return session(order);
  return session(
    await reconcilePayPal(order, await getPayPalOrder(order.providerId)),
  );
}
export async function captureCheckout(owner: string, id: string) {
  let order = await ownedCheckoutOrder(owner, id);
  if (order.status === "paid") return session(order);
  if (!order.providerId)
    throw new ApiError(409, "Payment approval has not started.");
  const providerId = order.providerId;
  const remote = await getPayPalOrder(providerId);
  order = await reconcilePayPal(order, remote);
  if (
    order.status === "paid" ||
    order.status === "payment_pending" ||
    order.status === "refund_required"
  )
    return session(order);
  if (remote.status !== "APPROVED")
    throw new ApiError(409, "Approve your PayPal payment before continuing.");
  await transaction(async (repo) => {
    const current = await repo.get<Order>("orders", id);
    if (
      !current ||
      current.status !== "pending" ||
      current.inventoryReleased ||
      Date.parse(current.expiresAt) <= Date.now()
    )
      throw new ApiError(
        409,
        "This checkout has expired or was cancelled. Review your bag before starting again.",
      );
    if ((current.captureLockUntil || 0) > Date.now())
      throw new ApiError(
        409,
        "Payment verification is already in progress. Please wait and retry verification.",
      );
    await repo.put("orders", {
      ...current,
      captureLockUntil: Date.now() + 60000,
    });
  });
  try {
    await capturePayPalOrder(providerId, id);
  } catch (e) {
    // Capture may have succeeded before the connection failed. GET first, never re-create.
    try {
      const checked = await reconcilePayPal(
        order,
        await getPayPalOrder(providerId),
      );
      if (["paid", "payment_pending"].includes(checked.status))
        return session(checked);
    } catch {
      /* Keep reservation and lease for safe reconciliation. */
    }
    throw e;
  }
  return session(
    await reconcilePayPal(order, await getPayPalOrder(providerId)),
  );
}
export async function cancelCheckout(owner: string, id: string) {
  const order = await ownedCheckoutOrder(owner, id);
  if (order.providerId) {
    const checked = await reconcilePayPal(
      order,
      await getPayPalOrder(order.providerId),
    );
    if (["paid", "payment_pending", "refund_required"].includes(checked.status))
      return session(checked);
  }
  const updated = await transaction(async (repo) => {
    const current = await repo.get<Order>("orders", id);
    if (!current) throw new ApiError(404, "Checkout session not found.");
    if ((current.captureLockUntil || 0) > Date.now())
      throw new ApiError(
        409,
        "Payment status is still being verified. Please wait before cancelling.",
      );
    if (current.status !== "pending") return current;
    if (!current.inventoryReleased)
      for (const line of current.lines) {
        const stock = await repo.get<{ id: string; available: number }>(
          "inventory",
          line.sku,
        );
        if (stock)
          await repo.put("inventory", {
            ...stock,
            available: stock.available + line.quantity,
          });
      }
    const value: Order = {
      ...current,
      status: "cancelled",
      inventoryReleased: true,
    };
    await repo.put("orders", value);
    const active = await repo.get<{ id: string; orderId: string }>(
      "checkoutSessions",
      owner,
    );
    if (active?.orderId === id) await repo.remove("checkoutSessions", owner);
    return value;
  });
  return session(updated);
}
export async function processPayPalEvent(event: {
  id: string;
  event_type: string;
  resource?: {
    id?: string;
    supplementary_data?: { related_ids?: { order_id?: string } };
  };
}) {
  const known = await transaction((repo) =>
    repo.get("events", `paypal-webhook-${event.id}`),
  );
  if (known) return;
  const providerId =
    event.event_type === "CHECKOUT.ORDER.APPROVED"
      ? event.resource?.id
      : event.resource?.supplementary_data?.related_ids?.order_id;
  if (providerId) {
    const order = await transaction(
      async (repo) =>
        (
          await repo.find<Order>("orders", { provider: "paypal", providerId })
        )[0],
    );
    if (!order)
      throw new ApiError(
        503,
        "Payment session is not ready. Retry notification.",
      );
    if (
      event.event_type === "CHECKOUT.ORDER.APPROVED" &&
      ["pending", "payment_pending", "paid"].includes(order.status)
    )
      await captureCheckout(order.owner, order.id);
    else if (event.event_type.startsWith("PAYMENT.CAPTURE."))
      await reconcilePayPal(order, await getPayPalOrder(providerId));
  }
  await transaction((repo) =>
    repo.put("events", {
      id: `paypal-webhook-${event.id}`,
      createdAt: new Date().toISOString(),
    }),
  );
}
