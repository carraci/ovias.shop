import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { ApiError } from "./http";
import { transaction } from "./db";
import {
  addressSchema,
  createOrder,
  expireOrders,
  finalizePayment,
} from "./commerce";
import { quoteInput } from "./checkout-pricing";
import type { Address, Order, Cart } from "@/lib/types";

export const razorpayCheckoutInput = quoteInput
  .extend({
    address: addressSchema
      .extend({
        phone: z
          .string()
          .trim()
          .regex(
            /^(?:\+91[ -]?)?[6-9][0-9]{9}$/,
            "Enter a valid Indian mobile number.",
          ),
      })
      .strict(),
    quoteId: z.string().regex(/^[a-f0-9]{64}$/),
    idempotencyKey: z.uuid(),
    market: z.literal("IN").default("IN"),
  })
  .strict();
export const razorpayVerificationInput = z
  .object({
    localOrderId: z.uuid(),
    razorpay_order_id: z.string().regex(/^order_[A-Za-z0-9]{1,90}$/),
    razorpay_payment_id: z.string().regex(/^pay_[A-Za-z0-9]{1,90}$/),
    razorpay_signature: z.string().regex(/^[a-fA-F0-9]{64}$/),
  })
  .strict();

type RemoteOrder = {
  id: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  status: string;
  receipt?: string;
  notes?: Record<string, string>;
};
type RemotePayment = {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
  captured?: boolean;
  amount_refunded?: number;
};
export type RazorpaySession = {
  id: string;
  orderNumber: string;
  status: Order["status"];
  provider: "razorpay";
  orderId?: string;
  key: string;
  amount: number;
  total: number;
  currency: "INR";
  quote?: Order["checkoutQuote"];
  address: Address;
  setupPending: boolean;
};

export function razorpayConfiguration() {
  const rawKey =
    process.env.RAZORPAY_KEY_ID?.trim() || "rzp_live_TiifioF81855BT";
  const key = rawKey.replace(/^["']|["']$/g, "").trim();
  const rawSecret =
    process.env.RAZORPAY_KEY_SECRET?.trim() || "4b7u5AiEUXUakU0aMDeEOPC1";
  const secret = rawSecret.replace(/^["']|["']$/g, "").trim();
  const valid =
    !!key &&
    /^rzp_(?:live|test)_[A-Za-z0-9]{6,64}$/.test(key) &&
    !!secret;
  const mode = key.startsWith("rzp_live_")
    ? ("live" as const)
    : ("test" as const);
  const ready = valid;
  return {
    provider: "razorpay" as const,
    ready,
    key: ready ? key : undefined,
    mode: ready ? mode : undefined,
  };
}
export function requireRazorpay() {
  const config = razorpayConfiguration();
  const rawSecret =
    process.env.RAZORPAY_KEY_SECRET?.trim() || "4b7u5AiEUXUakU0aMDeEOPC1";
  const secret = rawSecret.replace(/^["']|["']$/g, "").trim();
  if (!config.ready || !config.key)
    throw new ApiError(
      503,
      "Razorpay checkout is not configured. Live checkout also requires MongoDB.",
    );
  return { key: config.key, secret, mode: config.mode! };
}
async function providerRequest<T>(path: string, input?: unknown): Promise<T> {
  const { key, secret } = requireRazorpay();
  let response: Response;
  try {
    response = await fetch(`https://api.razorpay.com/v1/${path}`, {
      method: input === undefined ? "GET" : "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: input === undefined ? undefined : JSON.stringify(input),
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });
  } catch {
    throw new ApiError(
      503,
      "Payment status could not be confirmed. Retry checking this order before starting another payment.",
    );
  }
  if (!response.ok)
    throw new ApiError(
      503,
      "Razorpay could not complete this request. Please retry checking your payment status.",
    );
  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiError(
      503,
      "Razorpay returned an invalid response. Please check payment status before retrying.",
    );
  }
}
export async function ownedRazorpayOrder(owner: string, id: string) {
  const order = await transaction((repo) => repo.get<Order>("orders", id));
  if (!order || order.owner !== owner || order.provider !== "razorpay")
    throw new ApiError(404, "Checkout session not found.");
  return order;
}
export function razorpaySession(order: Order): RazorpaySession {
  const { key } = requireRazorpay();
  return {
    id: order.id,
    orderNumber: order.orderNumber || order.id.slice(0, 8),
    status: order.status,
    provider: "razorpay",
    orderId: order.providerId,
    key,
    amount: order.total,
    total: order.total,
    currency: "INR",
    quote: order.checkoutQuote,
    address: order.address,
    setupPending: !!order.providerCreating && !order.providerId,
  };
}
function verifyRemoteOrder(order: Order, remote: RemoteOrder) {
  if (
    !remote ||
    !/^order_[A-Za-z0-9]{1,90}$/.test(remote.id) ||
    (order.providerId && remote.id !== order.providerId) ||
    remote.amount !== order.total ||
    remote.currency !== "INR" ||
    remote.notes?.orderId !== order.id ||
    remote.receipt !== order.id ||
    !["created", "attempted", "paid"].includes(remote.status)
  )
    throw new ApiError(409, "Payment details do not match the OVIA order.");
}
function verifyRemotePayment(order: Order, payment: RemotePayment) {
  if (
    !payment ||
    !/^pay_[A-Za-z0-9]{1,90}$/.test(payment.id) ||
    payment.order_id !== order.providerId ||
    payment.currency !== "INR" ||
    payment.amount !== order.total
  )
    throw new ApiError(409, "Payment details do not match the OVIA order.");
}
async function reconcilePayment(
  order: Order,
  remote: RemoteOrder,
  payment: RemotePayment,
) {
  verifyRemoteOrder(order, remote);
  verifyRemotePayment(order, payment);
  if (payment.status === "refunded" || (payment.amount_refunded || 0) > 0) {
    if (order.status === "paid") {
      return transaction(async (repo) => {
        const current = await repo.get<Order>("orders", order.id);
        if (!current) throw new ApiError(404, "Checkout session not found.");
        const updated: Order = { ...current, status: "refund_required" };
        await repo.put("orders", updated);
        return updated;
      });
    }
    throw new ApiError(
      409,
      "This payment requires merchant review. Please contact OVIA support.",
    );
  }
  // Persist the authorisation so refresh/retry cannot open another payment while settlement is uncertain.
  if (payment.status === "authorized") {
    return transaction(async (repo) => {
      const current = await repo.get<Order>("orders", order.id);
      if (!current) throw new ApiError(404, "Checkout session not found.");
      if (
        !["pending", "payment_pending"].includes(current.status) ||
        current.inventoryReleased ||
        Date.parse(current.expiresAt) <= Date.now()
      )
        return current;
      const updated: Order = { ...current, status: "payment_pending" };
      await repo.put("orders", updated);
      return updated;
    });
  }
  if (payment.status !== "captured") return order;
  if (payment.captured !== true)
    throw new ApiError(409, "Payment capture could not be verified.");
  if (
    remote.status !== "paid" ||
    remote.amount_paid !== order.total ||
    remote.amount_due !== 0
  )
    throw new ApiError(
      409,
      "The captured payment total could not be verified.",
    );
  return finalizePayment(
    order.id,
    remote.id,
    order.total,
    `rzp:${remote.id}`,
    payment.id,
  );
}
export async function verifyRazorpayCheckout(owner: string, id: string) {
  requireRazorpay();
  await expireOrders();
  const order = await ownedRazorpayOrder(owner, id);
  if (!order.providerId) return razorpaySession(order);
  const remote = await providerRequest<RemoteOrder>(
    `orders/${encodeURIComponent(order.providerId)}`,
  );
  verifyRemoteOrder(order, remote);
  if (remote.status === "created") return razorpaySession(order);
  const payments = await providerRequest<{ items: RemotePayment[] }>(
    `orders/${encodeURIComponent(remote.id)}/payments`,
  );
  if (!Array.isArray(payments.items))
    throw new ApiError(409, "Payment status could not be verified.");
  if (remote.status === "attempted") {
    const authorized = payments.items.filter(
      (payment) => payment.status === "authorized",
    );
    if (authorized.length > 1)
      throw new ApiError(
        409,
        "Payment settlement requires merchant review. Please contact OVIA support.",
      );
    return razorpaySession(
      authorized.length
        ? await reconcilePayment(order, remote, authorized[0])
        : order,
    );
  }
  const captured = payments.items.filter(
    (payment) => payment.status === "captured" && payment.captured === true,
  );
  if (captured.length !== 1)
    throw new ApiError(
      409,
      "Payment settlement requires merchant review. Please contact OVIA support.",
    );
  return razorpaySession(await reconcilePayment(order, remote, captured[0]));
}
export async function activeRazorpayCheckout(owner: string) {
  requireRazorpay();
  await expireOrders();
  const record = await transaction((repo) =>
    repo.get<{ id: string; orderId: string }>("checkoutSessions", owner),
  );
  if (!record) return null;
  const order = await transaction((repo) =>
    repo.get<Order>("orders", record.orderId),
  );
  if (
    !order ||
    ["cancelled", "expired", "payment_failed"].includes(order.status)
  )
    return null;
  if (order.status === "paid") {
    const newCart = await transaction(async (repo) => {
      const cart = await repo.get<Cart>("carts", owner);
      const current = await repo.get<{ id: string; orderId: string }>(
        "checkoutSessions",
        owner,
      );
      if (!cart?.lines.length || current?.orderId !== order.id) return false;
      await repo.remove("checkoutSessions", owner);
      return true;
    });
    if (newCart) return null;
  }
  if (order.provider !== "razorpay")
    throw new ApiError(
      409,
      "An existing payment uses another provider. Please review its status with OVIA support before paying again.",
    );
  return verifyRazorpayCheckout(owner, order.id);
}
export async function beginRazorpayCheckout(
  owner: string,
  userId: string | undefined,
  raw: z.input<typeof razorpayCheckoutInput>,
) {
  requireRazorpay();
  const input = razorpayCheckoutInput.parse(raw);
  await expireOrders();
  const order = await createOrder(
    owner,
    userId,
    input.address,
    input.idempotencyKey,
    "razorpay",
    input,
  );
  if (order.status === "paid" || order.status === "refund_required")
    return razorpaySession(order);
  if (!["pending", "payment_pending"].includes(order.status))
    throw new ApiError(
      409,
      "This payment attempt is closed. Please start a new checkout.",
    );
  if (order.providerId) return verifyRazorpayCheckout(owner, order.id);
  const claim = await transaction(async (repo) => {
    const current = await repo.get<Order>("orders", order.id);
    if (!current) throw new ApiError(404, "Checkout session not found.");
    if (current.providerId) return current;
    if (current.providerCreating)
      throw new ApiError(
        409,
        "Payment setup may already exist. Please contact OVIA support to reconcile this order before retrying.",
      );
    const updated = { ...current, providerCreating: true };
    await repo.put("orders", updated);
    return updated;
  });
  if (claim.providerId) return verifyRazorpayCheckout(owner, order.id);
  // Orders API has no merchant idempotency key. Keep the claim after an uncertain response.
  const remote = await providerRequest<RemoteOrder>("orders", {
    amount: order.total,
    currency: "INR",
    receipt: order.id,
    notes: { orderId: order.id },
  });
  verifyRemoteOrder(order, remote);
  const attached = await transaction(async (repo) => {
    const current = await repo.get<Order>("orders", order.id);
    if (!current || (current.providerId && current.providerId !== remote.id))
      throw new ApiError(
        409,
        "Payment setup changed. Please verify its status before retrying.",
      );
    const updated = {
      ...current,
      providerId: remote.id,
      providerCreating: false,
    };
    await repo.put("orders", updated);
    return updated;
  });
  return razorpaySession(attached);
}
export async function verifyRazorpayPayment(
  owner: string,
  raw: z.input<typeof razorpayVerificationInput>,
) {
  const { secret } = requireRazorpay();
  const input = razorpayVerificationInput.parse(raw);
  const order = await ownedRazorpayOrder(owner, input.localOrderId);
  if (!order.providerId || input.razorpay_order_id !== order.providerId)
    throw new ApiError(409, "Payment details do not match the OVIA order.");
  const expected = createHmac("sha256", secret)
    .update(`${order.providerId}|${input.razorpay_payment_id}`)
    .digest();
  const actual = Buffer.from(input.razorpay_signature, "hex");
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual))
    throw new ApiError(400, "Payment signature could not be verified.");
  const [remote, payment] = await Promise.all([
    providerRequest<RemoteOrder>(
      `orders/${encodeURIComponent(order.providerId)}`,
    ),
    providerRequest<RemotePayment>(
      `payments/${encodeURIComponent(input.razorpay_payment_id)}`,
    ),
  ]);
  if (payment.id !== input.razorpay_payment_id)
    throw new ApiError(409, "Payment identity could not be verified.");
  return razorpaySession(await reconcilePayment(order, remote, payment));
}
// Called only after the route verifies the raw payload with the distinct webhook secret.
export async function processRazorpayWebhook(event: unknown) {
  const value = event as {
    event?: string;
    payload?: {
      order?: { entity?: RemoteOrder };
      payment?: { entity?: RemotePayment };
    };
  };
  if (
    !value ||
    !["order.paid", "payment.captured", "payment.refunded"].includes(
      value.event || "",
    )
  )
    return;
  const remoteId =
    value.event === "order.paid"
      ? value.payload?.order?.entity?.id
      : value.payload?.payment?.entity?.order_id;
  if (!remoteId || !/^order_[A-Za-z0-9]{1,90}$/.test(remoteId))
    throw new ApiError(400, "Invalid Razorpay webhook body.");
  const matches = await transaction((repo) =>
    repo.find<Order>("orders", { provider: "razorpay", providerId: remoteId }),
  );
  if (!matches.length) return; // This merchant account may serve other applications.
  if (matches.length !== 1)
    throw new ApiError(409, "Payment association requires merchant review.");
  const order = matches[0];
  if (value.event === "payment.refunded") {
    const paymentId = value.payload?.payment?.entity?.id;
    if (!paymentId || !/^pay_[A-Za-z0-9]{1,90}$/.test(paymentId))
      throw new ApiError(400, "Invalid Razorpay webhook body.");
    const [remote, payment] = await Promise.all([
      providerRequest<RemoteOrder>(`orders/${encodeURIComponent(remoteId)}`),
      providerRequest<RemotePayment>(
        `payments/${encodeURIComponent(paymentId)}`,
      ),
    ]);
    if (payment.id !== paymentId)
      throw new ApiError(409, "Payment identity could not be verified.");
    await reconcilePayment(order, remote, payment);

    // Completion is tracked per refund by the signed refund.* events.
    // payment.refunded is an aggregate payment event, not a refund receipt.
  } else await verifyRazorpayCheckout(order.owner, order.id);
}
