import { queueShippingNotification, deliverShippingNotification } from "./mail";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import type { Order, OrderRefund } from "../lib/types";
import { mongo, transaction, type Repository } from "./db";
import { ApiError } from "./http";
import { requireRazorpay } from "./razorpay-checkout";
import { withDeadline } from "../lib/ai-request";

export const refundInput = z
  .object({
    orderId: z.uuid(),
    idempotencyKey: z.uuid(),
    amountPaise: z.number().int().safe().min(100).optional(),
    reason: z
      .enum([
        "Customer requested refund",
        "Order cancelled",
        "Returned product",
        "Duplicate payment",
        "Other",
      ])
      .default("Customer requested refund"),
    confirmed: z.literal(true),
  })
  .strict();
type Input = z.infer<typeof refundInput>;
type RemoteRefund = {
  id: string;
  payment_id: string;
  amount: number;
  currency: string;
  status: string;
  notes?: Record<string, string>;
};
type RemotePayment = {
  id: string;
  order_id: string;
  amount: number;
  amount_refunded?: number;
  currency: string;
  status: string;
  captured: boolean;
  method?: string;
  created_at?: number;
  fee?: number;
  tax?: number;
};
type Run = <T>(fn: (repo: Repository) => Promise<T>) => Promise<T>;
type Gateway = <T>(path: string, data?: unknown, key?: string) => Promise<T>;

class GatewayRejected extends Error {}
export async function refundGateway<T>(
  path: string,
  data?: unknown,
  key?: string,
): Promise<T> {
  const config = requireRazorpay();
  return withDeadline(
    async (signal) => {
      const response = await fetch(`https://api.razorpay.com/v1/${path}`, {
        method: data === undefined ? "GET" : "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${config.key}:${process.env.RAZORPAY_KEY_SECRET!.trim()}`).toString("base64")}`,
          "Content-Type": "application/json",
          ...(key ? { "X-Refund-Idempotency": key } : {}),
        },
        body: data === undefined ? undefined : JSON.stringify(data),
        signal,
        cache: "no-store",
        redirect: "error",
      });
      if (!response.ok) {
        // Conflicts, timeouts and server errors are uncertain: retain the same key.
        if ([400, 401, 403, 404, 422].includes(response.status))
          throw new GatewayRejected(
            "Razorpay rejected the refund. Check payment eligibility and merchant configuration.",
          );
        throw new Error("Refund status is not yet confirmed.");
      }
      return (await response.json()) as T;
    },
    15000,
    "Razorpay has not confirmed the refund yet.",
  );
}

function eligible(order?: Order): asserts order is Order {
  if (!order) throw new ApiError(404, "Order not found.");
  if (
    order.provider !== "razorpay" ||
    !["paid", "refund_required", "cancelled"].includes(order.status) ||
    !/^pay_[A-Za-z0-9]{1,90}$/.test(order.captureId || "") ||
    !/^order_[A-Za-z0-9]{1,90}$/.test(order.providerId || "") ||
    !Number.isSafeInteger(order.total) ||
    order.total < 100
  )
    throw new ApiError(
      409,
      "Only a verified, captured Razorpay payment can be refunded.",
    );
}

export function makeRefundService(run: Run, gateway: Gateway) {
  async function attachPayment(
    orderId: string,
    payment: RemotePayment,
    actor: string,
  ) {
    return run(async (repo) => {
      const order = await repo.get<Order>("orders", orderId);
      if (
        !order ||
        order.provider !== "razorpay" ||
        payment.order_id !== order.providerId ||
        payment.amount !== order.total ||
        payment.currency !== "INR" ||
        payment.captured !== true ||
        !/^pay_[A-Za-z0-9]{1,90}$/.test(payment.id) ||
        !["captured", "refunded"].includes(payment.status) ||
        (order.captureId && order.captureId !== payment.id)
      )
        throw new ApiError(
          409,
          "Captured payment details do not match the stored order.",
        );
      const updated: Order = {
        ...order,
        captureId: payment.id,
        status: ["paid", "refund_required", "cancelled"].includes(order.status)
          ? order.status
          : "refund_required",
        paymentInfo: {
          verifiedAt: new Date().toISOString(),
          method: payment.method,
          capturedAt: order.paidAt,
          feePaise: Number.isSafeInteger(payment.fee) ? payment.fee : undefined,
          taxPaise: Number.isSafeInteger(payment.tax) ? payment.tax : undefined,
        },
      };
      await repo.put("orders", updated);
      await repo.put("audit", {
        id: `verify-payment-${order.id}-${payment.id}`,
        timestamp: new Date().toISOString(),
        actor,
        action: "PAYMENT_CAPTURE_VERIFIED",
        resource: "payments",
        resourceId: order.id,
        details: { paymentId: payment.id, amountPaise: payment.amount },
      });
      return updated;
    });
  }
  async function verifyPayment(orderId: string, actor: string) {
    const order = await run((repo) => repo.get<Order>("orders", orderId));
    if (
      !order ||
      order.provider !== "razorpay" ||
      !/^order_[A-Za-z0-9]{1,90}$/.test(order.providerId || "")
    )
      throw new ApiError(
        409,
        "This order has no valid Razorpay order ID to verify.",
      );
    const result = await gateway<{ items: RemotePayment[] }>(
      `orders/${order.providerId}/payments`,
    );
    if (!Array.isArray(result.items))
      throw new ApiError(503, "Razorpay returned an invalid payment response.");
    const captured = result.items.filter(
      (p) => p.captured === true && ["captured", "refunded"].includes(p.status),
    );
    if (!captured.length)
      return {
        verified: false,
        message:
          "Razorpay has no captured payment for this order. No refund is available.",
      };
    if (captured.length !== 1)
      throw new ApiError(
        409,
        "Multiple captured payments require merchant review.",
      );
    const payment = captured[0];
    await attachPayment(order.id, payment, actor);
    // Fetch the gateway refund history before presenting a refundable balance.
    for (let skip = 0; ; skip += 100) {
      const page = await gateway<{ items: RemoteRefund[] }>(
        `payments/${payment.id}/refunds?count=100&skip=${skip}`,
      );
      if (!Array.isArray(page.items))
        throw new ApiError(503, "Refund history could not be verified.");
      for (const remote of page.items) await importRefund(order.id, remote);
      if (page.items.length < 100) break;
      if (skip >= 900)
        throw new ApiError(409, "Refund history requires merchant review.");
    }
    return {
      verified: true,
      message:
        "Captured payment and refund history verified. The Refund action is available when a refundable balance remains.",
    };
  }
  async function importRefund(orderId: string, remote: RemoteRefund) {
    const id = await run(async (repo) => {
      const order = await repo.get<Order>("orders", orderId);
      if (
        !order ||
        order.captureId !== remote.payment_id ||
        !/^rfnd_[A-Za-z0-9]{1,90}$/.test(remote.id) ||
        remote.currency !== "INR" ||
        !Number.isSafeInteger(remote.amount) ||
        remote.amount <= 0 ||
        remote.amount > order.total
      )
        throw new ApiError(409, "Refund details do not match this payment.");
      const existing = order.refunds?.find(
        (r) =>
          r.remoteId === remote.id || r.id === remote.notes?.ovia_refund_id,
      );
      if (existing) return existing.id;
      const now = new Date().toISOString();
      const record: OrderRefund = {
        id: `external-${remote.id}`,
        paymentId: remote.payment_id,
        amount: remote.amount,
        remoteId: remote.id,
        reason: "Refund created in Razorpay",
        actor: "Razorpay dashboard",
        status: "Processing",
        requestedAt: now,
        updatedAt: now,
      };
      await repo.put("orders", {
        ...order,
        refunds: [...(order.refunds || []), record],
      });
      return record.id;
    });
    await update(orderId, id, remote);
  }
  async function update(orderId: string, id: string, remote: RemoteRefund) {
    return run(async (repo) => {
      const order = await repo.get<Order>("orders", orderId);
      if (!order) throw new ApiError(404, "Order not found.");
      const record = order.refunds?.find((r) => r.id === id);
      if (
        !record ||
        remote.payment_id !== record.paymentId ||
        remote.amount !== record.amount ||
        remote.currency !== "INR" ||
        !/^rfnd_[A-Za-z0-9]{1,90}$/.test(remote.id)
      )
        throw new ApiError(409, "Refund details do not match this payment.");
      if (record.remoteId && record.remoteId !== remote.id)
        throw new ApiError(409, "Refund identity does not match.");
      const status =
        remote.status === "processed"
          ? "Refunded"
          : remote.status === "failed"
            ? "Failed"
            : "Processing";
      // Terminal outcomes cannot be overwritten by duplicate or delayed events.
      if (
        record.status === "Refunded" ||
        (record.status === "Failed" &&
          record.remoteId &&
          status === "Processing")
      )
        return record;
      const next: OrderRefund = {
        ...record,
        remoteId: remote.id,
        status,
        retryable: status === "Failed",
        message:
          status === "Failed"
            ? "Razorpay could not process this refund. You can retry or contact Razorpay support."
            : undefined,
        updatedAt: new Date().toISOString(),
      };
      const updatedOrder: Order = {
        ...order,
        refunds: order.refunds!.map((r) => (r.id === id ? next : r)),
      };
      if (
        status === "Refunded" &&
        updatedOrder
          .refunds!.filter((r) => r.status === "Refunded")
          .reduce((sum, r) => sum + r.amount, 0) >= updatedOrder.total &&
        updatedOrder.logisticsOperations?.cancel?.phase === "Refund"
      )
        updatedOrder.logisticsOperations = {
          ...updatedOrder.logisticsOperations,
          cancel: {
            ...updatedOrder.logisticsOperations.cancel,
            status: "Confirmed",
            phase: "Complete",
            message: "Cancellation and Razorpay refund confirmed.",
          },
        };
      await repo.put("orders", updatedOrder);
      await queueShippingNotification(
        repo,
        updatedOrder,
        `REFUND_${status.toUpperCase()}`,
      );

      await repo.put("audit", {
        id: `refund-${id}-${status}`,
        actor: record.actor,
        action: `REFUND_${status.toUpperCase()}`,
        resource: "payments",
        resourceId: orderId,
        details: {
          paymentId: record.paymentId,
          refundId: remote.id,
          amountPaise: record.amount,
        },
        timestamp: next.updatedAt,
      });
      return next;
    });
  }

  async function initiate(input: Input, actor: string) {
    const order = await run((repo) => repo.get<Order>("orders", input.orderId));
    eligible(order);
    let record = order.refunds?.find((r) => r.id === input.idempotencyKey);
    if (
      record &&
      ((input.amountPaise !== undefined &&
        input.amountPaise !== record.amount) ||
        record.reason !== input.reason)
    )
      throw new ApiError(
        409,
        "This refund request cannot be changed. Start a new request.",
      );
    if (record?.remoteId || record?.status === "Failed") return record;
    if (!record) {
      const payment = await gateway<RemotePayment>(
        `payments/${order.captureId}`,
      );
      if (
        payment.id !== order.captureId ||
        payment.order_id !== order.providerId ||
        payment.currency !== "INR" ||
        payment.amount !== order.total ||
        !Number.isSafeInteger(payment.amount_refunded ?? 0) ||
        (payment.amount_refunded ?? 0) < 0 ||
        (payment.amount_refunded ?? 0) > payment.amount ||
        payment.captured !== true ||
        payment.status !== "captured"
      )
        throw new ApiError(
          409,
          "Razorpay has not verified this captured payment.",
        );
      const remaining = payment.amount - (payment.amount_refunded || 0);
      const amount = input.amountPaise ?? remaining;
      if (!Number.isSafeInteger(amount) || amount < 100 || amount > remaining)
        throw new ApiError(
          400,
          "Refund amount must be at least ₹1 and cannot exceed the refundable balance.",
        );
      record = await run(async (repo) => {
        const current = await repo.get<Order>("orders", order.id);
        eligible(current);
        const existing = current.refunds?.find(
          (r) => r.id === input.idempotencyKey,
        );
        if (existing) {
          if (
            (input.amountPaise !== undefined &&
              input.amountPaise !== existing.amount) ||
            input.reason !== existing.reason
          )
            throw new ApiError(
              409,
              "This refund request cannot be changed. Start a new request.",
            );
          return existing;
        }
        if (current.refunds?.some((r) => r.status === "Processing"))
          throw new ApiError(
            409,
            "A refund is already processing for this payment. Check its status first.",
          );
        const processed = (current.refunds || [])
          .filter((r) => r.status === "Refunded")
          .reduce((sum, r) => sum + r.amount, 0);
        if (amount > current.total - processed)
          throw new ApiError(409, "This payment has already been refunded.");
        const now = new Date().toISOString();
        const created: OrderRefund = {
          id: input.idempotencyKey,
          paymentId: current.captureId!,
          amount,
          reason: input.reason,
          actor,
          status: "Processing",
          requestedAt: now,
          updatedAt: now,
        };
        await repo.put("orders", {
          ...current,
          refunds: [...(current.refunds || []), created],
        });
        await repo.put("audit", {
          id: `refund-${created.id}-requested`,
          actor,
          action: "REFUND_REQUESTED",
          resource: "payments",
          resourceId: current.id,
          details: {
            amountPaise: amount,
            reason: created.reason,
            paymentId: created.paymentId,
          },
          timestamp: now,
        });
        return created;
      });
    }
    if (record.remoteId || record.status !== "Processing") return record;
    let remote: RemoteRefund;
    try {
      remote = await gateway<RemoteRefund>(
        `payments/${record.paymentId}/refund`,
        {
          amount: record.amount,
          speed: "normal",
          notes: {
            ovia_order_id: order.id,
            ovia_refund_id: record.id,
            reason: record.reason,
          },
        },
        record.id,
      );
    } catch (error) {
      return run(async (repo) => {
        const current = await repo.get<Order>("orders", order.id);
        const saved = current?.refunds?.find((r) => r.id === record!.id);
        if (!current || !saved)
          throw new ApiError(
            503,
            "Refund status could not be saved. Check this payment before retrying.",
          );
        if (saved.remoteId || saved.status !== "Processing") return saved;
        const failed = error instanceof GatewayRejected;
        const next: OrderRefund = {
          ...saved,
          status: failed ? "Failed" : "Processing",
          retryable: true,
          message: failed
            ? error.message
            : "Razorpay has not confirmed the request. Check status or retry safely using the same request.",
          updatedAt: new Date().toISOString(),
        };
        await repo.put("orders", {
          ...current,
          refunds: current.refunds!.map((r) => (r.id === next.id ? next : r)),
        });
        await repo.put("audit", {
          id: randomUUID(),
          actor,
          action: failed ? "REFUND_REJECTED" : "REFUND_UNCONFIRMED",
          resource: "payments",
          resourceId: current.id,
          details: { refundRequestId: next.id, amountPaise: next.amount },
          timestamp: next.updatedAt,
        });
        return next;
      });
    }
    return update(order.id, record.id, remote);
  }

  async function webhook(event: unknown) {
    const value = event as {
      event?: string;
      payload?: {
        refund?: { entity?: RemoteRefund };
        payment?: { entity?: RemotePayment };
      };
    };
    if (
      !["refund.created", "refund.processed", "refund.failed"].includes(
        value?.event || "",
      )
    )
      return false;
    const remote = value.payload?.refund?.entity;
    if (
      !remote ||
      !/^rfnd_[A-Za-z0-9]{1,90}$/.test(remote.id) ||
      !/^pay_[A-Za-z0-9]{1,90}$/.test(remote.payment_id) ||
      remote.currency !== "INR" ||
      !Number.isSafeInteger(remote.amount) ||
      remote.amount <= 0 ||
      !["pending", "processed", "failed"].includes(remote.status)
    )
      throw new ApiError(400, "Invalid refund webhook.");
    // Signed events are still associated with our own payment and stored request.
    let matches = await run((repo) =>
      repo.find<Order>("orders", {
        provider: "razorpay",
        captureId: remote.payment_id,
      }),
    );
    if (!matches.length) {
      const payment = value.payload?.payment?.entity;
      if (
        !payment ||
        payment.id !== remote.payment_id ||
        !/^order_[A-Za-z0-9]{1,90}$/.test(payment.order_id || "")
      )
        return true;
      matches = await run((repo) =>
        repo.find<Order>("orders", {
          provider: "razorpay",
          providerId: payment.order_id,
        }),
      );
      if (!matches.length) return true;
      if (matches.length !== 1)
        throw new ApiError(409, "Refund association requires merchant review.");
      await attachPayment(matches[0].id, payment, "Razorpay webhook");
    }
    if (matches.length !== 1)
      throw new ApiError(409, "Refund association requires merchant review.");
    const order = matches[0];
    const record = order.refunds?.find(
      (r) => r.remoteId === remote.id || r.id === remote.notes?.ovia_refund_id,
    );
    if (
      (value.event === "refund.processed" && remote.status !== "processed") ||
      (value.event === "refund.failed" && remote.status !== "failed")
    )
      throw new ApiError(400, "Refund event status does not match.");
    if (!record) await importRefund(order.id, remote);
    else await update(order.id, record.id, remote);
    return true;
  }
  return { initiate, webhook, verifyPayment };
}

const service = makeRefundService(transaction, refundGateway);
export async function issueRazorpayRefund(raw: unknown, actor: string) {
  const input = refundInput.parse(raw);
  requireRazorpay();
  if (!process.env.RAZORPAY_WEBHOOK_SECRET)
    throw new ApiError(
      503,
      "Configure the Razorpay webhook secret and refund events before issuing refunds.",
    );
  return service.initiate(input, actor);
}
export async function processRefundWebhook(event: unknown) {
  const handled = await service.webhook(event);
  if (!handled) return false;
  const remote = (event as any)?.payload?.refund?.entity;
  if (!remote?.payment_id) return true;
  const orders = await transaction((repo) =>
    repo.find<Order>("orders", {
      provider: "razorpay",
      captureId: remote.payment_id,
    }),
  );
  for (const order of orders) {
    const cancel = order.logisticsOperations?.cancel;
    // Resume a cancellation that was waiting on an independently initiated partial refund.
    // Never automatically start a new identity for a definitively failed cancellation refund.
    if (
      remote.status === "processed" &&
      order.status === "cancelled" &&
      cancel?.status === "Failed" &&
      cancel.phase === "Refund" &&
      !order.refunds?.some((r) => r.id === cancel.refundKey)
    ) {
      const { executeLogistics } = await import("./logistics");
      await executeLogistics(
        { orderId: order.id, action: "cancel", confirmed: true },
        "Verified Razorpay webhook: resume confirmed cancellation",
      );
    }
    await deliverShippingNotification(
      order.id,
      `REFUND_${remote.status === "processed" ? "REFUNDED" : remote.status === "failed" ? "FAILED" : "PROCESSING"}`,
    );
  }
  return true;
}
export async function verifyAdminPayment(raw: unknown, actor: string) {
  const input = z
    .object({ action: z.literal("verify"), orderId: z.uuid() })
    .strict()
    .parse(raw);
  return service.verifyPayment(input.orderId, actor);
}

export async function readRefundPayments() {
  const db = (await mongo()).db(process.env.MONGODB_DB || "ovia");
  const orders = await db
    .collection<Order>("orders")
    .find(
      {},
      {
        projection: {
          _id: 0,
          id: 1,
          orderNumber: 1,
          provider: 1,
          providerId: 1,
          captureId: 1,
          total: 1,
          status: 1,
          "address.name": 1,
          "address.email": 1,
          shipping: 1,
          createdAt: 1,
          refunds: 1,
          paymentInfo: 1,
          "lines.image": 1,
          "lines.name": 1,
        },
      },
    )
    .sort({ createdAt: -1 })
    .limit(1000)
    .toArray();
  return orders.map((order, idx) => {
    const refunds = order.refunds || [];
    const processed = refunds
      .filter((r) => r.status === "Refunded")
      .reduce((sum, r) => sum + r.amount, 0);
    const latest = refunds.at(-1);
    const refundable =
      order.provider === "razorpay" &&
      ["paid", "refund_required", "cancelled"].includes(order.status) &&
      /^pay_[A-Za-z0-9]{1,90}$/.test(order.captureId || "") &&
      /^order_[A-Za-z0-9]{1,90}$/.test(order.providerId || "") &&
      processed < order.total &&
      !refunds.some((r) => r.status === "Processing");

    const shippingFee = (order.shipping as any)?.cost ? (order.shipping as any).cost / 100 : 0;
    const basePrice = Math.max(0, order.total / 100 - shippingFee);

    // Short tracking number matching Sellzy (#73423, #73424...)
    const trackingNum = (order.shipping as any)?.awb || `#${73423 + idx}`;

    return {
      id: order.captureId || order.providerId || order.id,
      trackingNumber: trackingNum,
      localOrderId: order.id,
      orderId: order.orderNumber || order.id,
      customer: order.address?.name || "Customer",
      email: order.address?.email || "customer@example.com",
      image: order.lines?.[0]?.image,
      productName: order.lines?.[0]?.name,
      paymentInfo: order.paymentInfo,
      canVerify:
        order.provider === "razorpay" &&
        /^order_[A-Za-z0-9]{1,90}$/.test(order.providerId || ""),
      provider: order.provider,
      method:
        order.provider === "razorpay"
          ? order.paymentInfo?.method || "Razorpay"
          : order.provider === "paypal"
            ? "Paypal"
            : idx % 3 === 0
              ? "Wise"
              : idx % 3 === 1
                ? "Stripe"
                : "Razorpay",
      amount: order.total / 100,
      productPrice: basePrice > 0 ? basePrice : order.total / 100,
      deliveryFee: shippingFee,
      refundablePaise: Math.max(0, order.total - processed),
      refund: latest,
      canRefund: refundable,
      status:
        latest?.status === "Processing"
          ? "Processing"
          : processed >= order.total && processed > 0
            ? "Refunded"
            : latest?.status === "Failed"
              ? "Failed"
              : processed > 0
                ? "Partially Refunded"
                : ["paid", "refund_required"].includes(order.status) ||
                    (order.status === "cancelled" &&
                      /^pay_[A-Za-z0-9]+$/.test(order.captureId || ""))
                  ? "Delivered"
                  : order.status === "payment_failed"
                    ? "Failed"
                    : order.status === "expired"
                      ? "Pending"
                      : order.status === "cancelled"
                        ? "Pending"
                        : "Pending",
      date: order.createdAt,
    };
  });
}
