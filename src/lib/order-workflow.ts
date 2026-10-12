import type { Order } from "./types";
export function orderWorkflow(order: Order) {
  const status = order.shipping?.status || "";
  const delivered = status === "DELIVERED";
  const dispatched = [
    "PICKED_UP",
    "IN_TRANSIT",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "NDR",
    "DELIVERY_FAILED",
    "RTO",
    "RETURNED",
  ].includes(status);
  const stopped =
    [
      "cancelled",
      "expired",
      "payment_failed",
      "demo",
      "refund_required",
    ].includes(order.status) ||
    (order.refunds || []).some((refund) => refund.status !== "Failed") ||
    !!order.logisticsOperations?.cancel;
  return {
    delivered,
    dispatched,
    canCancel:
      !delivered &&
      !dispatched &&
      !stopped &&
      (!order.cancellationDeadline ||
        Date.parse(order.cancellationDeadline) > Date.now()),
    canRequestReturn:
      dispatched && !delivered && !["RTO", "RETURNED"].includes(status),
    canPack:
      order.status === "paid" &&
      !stopped &&
      !dispatched &&
      !order.shipping?.awb,
    stage:
      status ||
      (order.status === "paid" ? "PROCESSING" : order.status.toUpperCase()),
  };
}
