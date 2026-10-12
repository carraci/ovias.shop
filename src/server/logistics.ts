import { applyCourierEvent } from "../lib/shipping/courier-events";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { Order, LogisticsOperation, OrderRefund } from "../lib/types";
import type {
  ShippingProvider,
  InternalShippingStatus,
} from "../lib/shipping/types";
import { DelhiveryShippingProvider } from "../lib/shipping/delhivery";
import { transaction, type Repository } from "./db";
import { ApiError } from "./http";
import { issueRazorpayRefund, refundGateway } from "./razorpay-refunds";
import { queueShippingNotification, deliverShippingNotification } from "./mail";

export const logisticsInput = z
  .object({
    orderId: z.uuid(),
    action: z.enum(["approve", "cancel", "reconcile"]),
    confirmed: z.literal(true),
    package: z
      .object({
        weightGrams: z.number().int().min(1).max(100000),
        length: z.number().positive().max(300),
        width: z.number().positive().max(300),
        height: z.number().positive().max(300),
      })
      .strict()
      .optional(),
    reason: z.string().trim().min(1).max(200).optional(),
  })
  .strict();
type Input = z.infer<typeof logisticsInput>;
type Run = <T>(fn: (repo: Repository) => Promise<T>) => Promise<T>;
type Dependencies = {
  run: Run;
  provider: () => ShippingProvider;
  validate: () => void;
  verifyPaid: (order: Order) => Promise<void>;
  refund: (input: unknown, actor: string) => Promise<OrderRefund>;
  queue: (
    repo: Repository,
    order: Order,
    status: string,
    awb?: string,
  ) => Promise<void>;
  notify: (id: string, status: string) => Promise<void>;
};
const now = () => new Date().toISOString();
export function verifiedShipment(order: Order) {
  return (
    order.shipping?.verified === true &&
    order.shipping.provider === "delhivery" &&
    order.shipping.environment === "production" &&
    /^\d{8,30}$/.test(order.shipping.awb || "") &&
    !(order.shipping.events || []).some((e) => e.isSimulated)
  );
}
const blockedCancellation = (order: Order) =>
  [
    "PICKED_UP",
    "IN_TRANSIT",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "RTO",
    "RETURNED",
    "NDR",
  ].includes(order.shipping?.status || "");

export function makeLogisticsService(deps: Dependencies) {
  const { run } = deps;
  async function read(id: string) {
    const order = await run((repo) => repo.get<Order>("orders", id));
    if (!order) throw new ApiError(404, "Order not found.");
    return order;
  }
  async function saveOperation(
    id: string,
    op: LogisticsOperation,
    patch: Partial<Order> = {},
  ) {
    return run(async (repo) => {
      const order = await repo.get<Order>("orders", id);
      if (!order) throw new ApiError(404, "Order not found.");
      const current = order.logisticsOperations?.[op.action];
      if (current?.id !== op.id)
        throw new ApiError(
          409,
          "Operation ownership changed. Refresh the order.",
        );
      const next = {
        ...order,
        ...patch,
        logisticsOperations: {
          ...order.logisticsOperations,
          [op.action]: { ...op, updatedAt: now() },
        },
      };
      await repo.put("orders", next);
      if (op.action === "approve" && op.status === "Confirmed")
        await deps.queue(repo, next, "READY_TO_SHIP", next.shipping?.awb);
      return next;
    });
  }
  async function reconcile(orderId: string) {
    const snapshot = await read(orderId),
      provider = deps.provider();
    const result = await provider.trackShipment(
      verifiedShipment(snapshot) ? snapshot.shipping!.awb! : snapshot.orderNumber || snapshot.id,
    );
    if (!result.success || !/^\d{8,30}$/.test(result.awb || ""))
      throw new ApiError(
        409,
        "Courier has not confirmed a shipment for this exact order reference. No replacement shipment was created.",
      );
    return run(async (repo) => {
      const current = await repo.get<Order>("orders", orderId);
      if (!current) throw new ApiError(404, "Order not found.");
      if (current.shipping?.verified && current.shipping.awb !== result.awb)
        throw new ApiError(409, "Courier AWB mismatch requires review.");
      const prior = current.logisticsOperations?.approve;
      if (prior?.leaseUntil && prior.leaseUntil > Date.now())
        throw new ApiError(
          409,
          "Shipment request is still running. Wait for it to complete.",
        );
      let updated: Order = {
        ...current,
        shipping: current.shipping?.verified
          ? current.shipping
          : {
              provider: "delhivery",
              environment:
                process.env.DELHIVERY_ENV === "staging"
                  ? "staging"
                  : "production",
              verified: true,
              awb: result.awb,
              courier: result.courier,
              status: "READY_TO_SHIP",
              events: [],
              lastUpdatedAt: now(),
            },
      };
      for (const event of result.events)
        updated = applyCourierEvent(updated, result.awb!, event);
      updated = {
        ...updated,
        shipping: {
          ...updated.shipping!,
          courier: result.courier || updated.shipping!.courier,
          estimatedDelivery: result.estimatedDelivery || updated.shipping!.estimatedDelivery,
          lastUpdatedAt: now(),
        },
        fulfillmentStatus:
          updated.shipping!.status === "PICKUP_SCHEDULED"
            ? "READY_TO_SHIP"
            : updated.shipping!.status,
      };
      if (prior?.phase === "Shipment")
        updated.logisticsOperations = {
          ...updated.logisticsOperations,
          approve: {
            ...prior,
            phase: "Pickup",
            status: "Failed",
            ambiguous: false,
            leaseUntil: 0,
            message:
              "Existing courier AWB verified. Resume approval to schedule pickup.",
          },
        };
      await repo.put("orders", updated);
      return updated;
    });
  }
  async function execute(raw: unknown, actor: string) {
    const input = logisticsInput.parse(raw),
      initial = await read(input.orderId);
    if (input.action === "reconcile") return reconcile(input.orderId);
    if (input.action === "approve") {
      deps.validate();
      if (
        initial.status !== "paid" ||
        initial.logisticsOperations?.cancel ||
        initial.refunds?.some((r) => r.status !== "Failed")
      )
        throw new ApiError(
          409,
          "Only paid, unrefunded orders can be approved for shipping.",
        );
      if (initial.shipping?.awb && !verifiedShipment(initial))
        throw new ApiError(
          409,
          "Existing shipment is unverified. Reconcile it with Delhivery before creating another.",
        );
      if (!input.package && !initial.logisticsOperations?.approve?.package)
        throw new ApiError(
          400,
          "Enter the actual packed weight and dimensions.",
        );
    } else {
      if (initial.provider === "demo")
        throw new ApiError(
          409,
          "Demo records cannot trigger live courier, refund or inventory operations.",
        );
      if (blockedCancellation(initial))
        throw new ApiError(
          409,
          "This package has left the warehouse. Use the courier return/RTO process; stock cannot be restored before return.",
        );
      if (initial.shipping?.awb && !verifiedShipment(initial))
        throw new ApiError(
          409,
          "Verify the existing courier shipment before cancellation.",
        );
    }
    const reservation = await run(async (repo) => {
      const order = await repo.get<Order>("orders", input.orderId);
      if (!order) throw new ApiError(404, "Order not found.");
      const other =
        order.logisticsOperations?.[
          input.action === "approve" ? "cancel" : "approve"
        ];
      if (other?.status === "Processing")
        throw new ApiError(
          409,
          "Another logistics operation is processing. Refresh before retrying.",
        );
      const existing =
        order.logisticsOperations?.[input.action as "approve" | "cancel"];
      if (
        (existing?.status === "Confirmed" &&
          !(input.action === "cancel" && order.status === "refund_required")) ||
        (existing?.status === "Processing" &&
          (existing.ambiguous || (existing.leaseUntil || 0) > Date.now()))
      )
        return { order, op: existing, claimed: false };
      // A crashed worker may have sent the request. Do not blindly replay courier writes.
      if (
        existing?.status === "Processing" &&
        ["Shipment", "Pickup"].includes(existing.phase)
      )
        return { order, op: existing, claimed: false };
      if (input.action === "approve" && order.status !== "paid")
        throw new ApiError(409, "Payment is no longer eligible for shipping.");
      const op: LogisticsOperation = {
        ...existing,
        id: existing?.id || randomUUID(),
        action: input.action as "approve" | "cancel",
        status: "Processing",
        phase:
          existing?.phase ||
          (input.action === "approve" ? "Shipment" : "Courier cancellation"),
        updatedAt: now(),
        leaseUntil: Date.now() + 90000,
        ambiguous: false,
        package: existing?.package || input.package,
        refundKey:
          existing?.refundKey &&
          !order.refunds?.some(
            (r) =>
              r.id === existing.refundKey &&
              r.status === "Failed" &&
              r.retryable,
          )
            ? existing.refundKey
            : randomUUID(),
        message: "Processing the confirmed request.",
      };
      const updated = {
        ...order,
        logisticsOperations: {
          ...order.logisticsOperations,
          [input.action]: op,
        },
      };
      await repo.put("orders", updated);
      await repo.put("audit", {
        id: `logistics-${op.id}-requested`,
        timestamp: now(),
        actor,
        action:
          input.action === "approve"
            ? "SHIPMENT_APPROVED"
            : "ORDER_CANCELLATION_REQUESTED",
        resource: "orders",
        resourceId: order.id,
        details: { reason: input.reason, operationId: op.id },
      });
      return { order: updated, op, claimed: true };
    });
    if (!reservation.claimed) return reservation.order;
    let { order, op } = reservation;
    const provider = deps.provider();
    let courierWriteAttempted = false;
    async function failed(message: string, ambiguous = false) {
      op = {
        ...op,
        status: ambiguous ? "Processing" : "Failed",
        ambiguous,
        message,
        leaseUntil: 0,
      };
      return saveOperation(order.id, op);
    }
    try {
      if (input.action === "approve") {
        if (!verifiedShipment(order)) {
          await deps.verifyPaid(order);
          const coverage = await provider.checkServiceability({
            pincode: order.address.postalCode,
          });
          if (!coverage.serviceable || !coverage.prepaidAvailable)
            throw new ApiError(
              409,
              "Courier has not confirmed prepaid serviceability for this delivery postcode.",
            );
          const pkg = op.package!;
          courierWriteAttempted = true;
          const result = await provider.createShipment({
            orderId: order.id,
            orderNumber: order.orderNumber || order.id,
            totalAmount: order.total,
            customer: {
              name: order.address.name,
              email: order.address.email,
              phone: order.address.phone,
              addressLine1: order.address.line1,
              addressLine2: order.address.line2,
              city: order.address.city,
              state: order.address.region,
              postalCode: order.address.postalCode,
              country: "India",
            },
            items: order.lines.map((l) => ({
              name: l.name,
              sku: l.sku,
              quantity: l.quantity,
              price: l.price,
            })),
            weightGrams: pkg.weightGrams,
            dimensionsCm: {
              length: pkg.length,
              width: pkg.width,
              height: pkg.height,
            },
          });
          if (!result.success || !/^\d{8,30}$/.test(result.awb || ""))
            return failed(
              result.error || "Courier did not confirm a valid AWB.",
              result.uncertain === true || result.success,
            );
          op = {
            ...op,
            phase: "Pickup",
            message: "Shipment confirmed; scheduling pickup.",
          };
          order = await saveOperation(order.id, op, {
            fulfillmentStatus: "READY_TO_SHIP",
            shipping: {
              provider: "delhivery",
              environment:
                process.env.DELHIVERY_ENV === "staging"
                  ? "staging"
                  : "production",
              verified: true,
              awb: result.awb,
              shipmentId: result.shipmentId,
              courier: result.courier,
              status: "READY_TO_SHIP",
              lastUpdatedAt: now(),
              labelUrl: result.labelUrl,
              trackingUrl: `/account/orders/${order.id}/tracking`,
              events: [
                {
                  status: "READY_TO_SHIP",
                  description: "Courier confirmed shipment and assigned AWB.",
                  timestamp: now(),
                },
              ],
            },
          });
        }
        if (!order.shipping?.pickup?.pickupId) {
          const tomorrow = new Date(Date.now() + 86400000).toLocaleDateString(
            "en-CA",
            { timeZone: "Asia/Kolkata" },
          );
          op = {
            ...op,
            phase: "Pickup",
            pickupDate: op.pickupDate || tomorrow,
          };
          order = await saveOperation(order.id, op);
          courierWriteAttempted = true;
          const pickup = await provider.requestPickup({
            pickupDate: op.pickupDate!,
            pickupTime: "14:00:00",
            expectedPackageCount: 1,
          });
          if (!pickup.success || !pickup.pickupId)
            return failed(
              pickup.error || "Courier has not confirmed pickup.",
              pickup.uncertain === true || pickup.success,
            );
          order = await saveOperation(order.id, op, {
            shipping: {
              ...order.shipping!,
              status: "PICKUP_SCHEDULED",
              lastUpdatedAt: now(),
              pickup: {
                pickupId: pickup.pickupId,
                status: "SCHEDULED",
                date: op.pickupDate,
                time: "14:00:00",
                location: pickup.pickupLocation,
                message: pickup.message,
              },
              events: [
                ...order.shipping!.events,
                {
                  status: "PICKUP_SCHEDULED",
                  description:
                    "Courier confirmed the pickup request; package has not been picked up yet.",
                  timestamp: now(),
                },
              ],
            },
          });
        }
        op = {
          ...op,
          status: "Confirmed",
          phase: "Complete",
          leaseUntil: 0,
          message: "Shipment and pickup confirmed by the courier.",
        };
        order = await saveOperation(order.id, op, {
          fulfillmentStatus: "READY_TO_SHIP",
        });
        await run((repo) =>
          deps.queue(repo, order, "READY_TO_SHIP", order.shipping?.awb),
        );
        await deps.notify(order.id, "READY_TO_SHIP").catch(() => {});
        return read(order.id);
      }
      // Courier cancellation is confirmed before inventory or order state is changed.
      if (order.shipping?.awb && order.shipping.status !== "CANCELLED") {
        courierWriteAttempted = true;
        const cancelled = await provider.cancelShipment(order.shipping.awb);
        if (!cancelled.success)
          return failed(
            cancelled.error || "Courier has not confirmed cancellation.",
            cancelled.uncertain,
          );
        order = await saveOperation(order.id, op, {
          shipping: {
            ...order.shipping,
            status: "CANCELLED",
            lastUpdatedAt: now(),
            pickup: order.shipping.pickup
              ? {
                  ...order.shipping.pickup,
                  status: "SHIPMENT_WITHDRAWN",
                  message:
                    "Shipment cancelled. Warehouse pickup requests may cover other packages; no pickup cancellation is claimed.",
                }
              : undefined,
            events: [
              ...order.shipping.events,
              {
                status: "CANCELLED",
                description: "Courier accepted shipment cancellation.",
                timestamp: now(),
              },
            ],
          },
        });
      }
      op = {
        ...op,
        phase: "Refund",
        message: "Courier cancellation confirmed; reconciling payment refund.",
      };
      order = await saveOperation(order.id, op);
      let refundError: string | undefined;
      if (
        ["paid", "refund_required", "cancelled"].includes(order.status) &&
        (order.paidAt ||
          order.captureId ||
          order.status === "paid" ||
          order.status === "refund_required")
      ) {
        if (
          order.provider !== "razorpay" ||
          !/^pay_[A-Za-z0-9]+$/.test(order.captureId || "")
        )
          refundError =
            "Refund failed: this payment has no verified Razorpay capture. Merchant reconciliation is required.";
        else if (
          (order.refunds || [])
            .filter((r) => r.status === "Refunded")
            .reduce((sum, r) => sum + r.amount, 0) < order.total
        ) {
          try {
            const refund = await deps.refund(
              {
                orderId: order.id,
                idempotencyKey: op.refundKey,
                reason: "Order cancelled",
                confirmed: true,
              },
              actor,
            );
            if (refund.status === "Failed")
              refundError =
                refund.message || "Refund failed. Review payment details.";
          } catch {
            refundError =
              "Refund could not be confirmed. Check payment details before retrying.";
          }
        }
      }
      order = await run(async (repo) => {
        const current = await repo.get<Order>("orders", order.id);
        if (!current) throw new ApiError(404, "Order not found.");
        if (!current.inventoryReleased) {
          for (const line of current.lines) {
            const stock = await repo.get<{ id: string; available: number }>(
              "inventory",
              line.sku,
            );
            if (!stock)
              throw new ApiError(
                409,
                "Inventory record is missing; cancellation requires review.",
              );
            await repo.put("inventory", {
              ...stock,
              available: stock.available + line.quantity,
            });
          }
        }
        op = {
          ...op,
          status: refundError ? "Failed" : "Confirmed",
          phase: refundError ? "Refund" : "Complete",
          leaseUntil: 0,
          message:
            refundError ||
            "Order cancelled. Any refund remains tracked by Razorpay.",
        };
        const next: Order = {
          ...current,
          status: "cancelled",
          fulfillmentStatus: "CANCELLED",
          inventoryReleased: true,
          logisticsOperations: { ...current.logisticsOperations, cancel: op },
        };
        await repo.put("orders", next);
        await deps.queue(repo, next, "CANCELLED", next.shipping?.awb);
        await repo.put("audit", {
          id: `logistics-${op.id}-cancelled`,
          timestamp: now(),
          actor,
          action: "ORDER_CANCELLED",
          resource: "orders",
          resourceId: next.id,
          details: { inventoryReleased: true, refundRequestId: op.refundKey },
        });
        return next;
      });
      await deps.notify(order.id, "CANCELLED").catch(() => {});
      return read(order.id);
    } catch (error) {
      return failed(
        error instanceof ApiError
          ? error.message
          : "Operation could not be confirmed. Refresh and reconcile with the provider before retrying.",
        courierWriteAttempted && !(error instanceof ApiError),
      );
    }
  }
  return { execute, read, reconcile };
}
const service = makeLogisticsService({
  run: transaction,
  provider: () => new DelhiveryShippingProvider(),
  validate: () => {
    if (
      !process.env.DELHIVERY_API_TOKEN ||
      !process.env.DELHIVERY_PICKUP_LOCATION ||
      !process.env.DELHIVERY_WEBHOOK_SECRET
    )
      throw new ApiError(
        503,
        "Configure the courier token, registered warehouse and authenticated webhook before approving shipments.",
      );
  },
  verifyPaid: async (order) => {
    if (
      order.provider !== "razorpay" ||
      !/^pay_[A-Za-z0-9]+$/.test(order.captureId || "")
    )
      throw new ApiError(
        409,
        "A verified captured Razorpay payment is required before shipping.",
      );
    const payment = await refundGateway<any>(`payments/${order.captureId}`);
    if (
      payment.id !== order.captureId ||
      payment.order_id !== order.providerId ||
      payment.amount !== order.total ||
      payment.currency !== "INR" ||
      payment.captured !== true ||
      payment.status !== "captured" ||
      payment.amount_refunded !== 0
    )
      throw new ApiError(
        409,
        "Razorpay has not confirmed a captured, unrefunded payment matching this order.",
      );
  },
  refund: issueRazorpayRefund,
  queue: queueShippingNotification,
  notify: deliverShippingNotification,
});
export const executeLogistics = service.execute;
