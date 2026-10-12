import type { Order } from "../types";
import type { InternalShippingStatus, TrackingEvent } from "./types";
const rank: Partial<Record<InternalShippingStatus, number>> = {
  READY_TO_SHIP: 1,
  SHIPMENT_CREATED: 1,
  PICKUP_SCHEDULED: 2,
  PICKED_UP: 3,
  IN_TRANSIT: 4,
  OUT_FOR_DELIVERY: 5,
  DELIVERED: 6,
};
export function applyCourierEvent(
  order: Order,
  awb: string,
  event: TrackingEvent,
): Order {
  const shipping = order.shipping;
  if (
    !shipping ||
    shipping.verified !== true ||
    shipping.awb !== awb ||
    event.isSimulated
  )
    return order;
  const time = Date.parse(event.timestamp);
  if (!Number.isFinite(time) || time > Date.now() + 300000) return order;
  if (
    shipping.events.some(
      (e) => e.status === event.status && e.timestamp === event.timestamp,
    )
  )
    return order;
  if (["DELIVERED", "CANCELLED", "RETURNED"].includes(shipping.status))
    return order;
  const latest = shipping.events.reduce(
    (value, e) => Math.max(value, Date.parse(e.timestamp) || 0),
    0,
  );
  if (time < latest) return order;
  const previous = rank[shipping.status],
    next = rank[event.status];
  if (previous && next && next < previous) return order;
  return {
    ...order,
    fulfillmentStatus:
      event.status === "PICKUP_SCHEDULED" ? "READY_TO_SHIP" : event.status,
    shipping: {
      ...shipping,
      status: event.status,
      lastUpdatedAt: new Date().toISOString(),
      shippedAt: [
        "PICKED_UP",
        "IN_TRANSIT",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
      ].includes(event.status)
        ? shipping.shippedAt || event.timestamp
        : shipping.shippedAt,
      deliveredAt:
        event.status === "DELIVERED" ? event.timestamp : shipping.deliveredAt,
      events: [...shipping.events, event].sort(
        (a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp),
      ),
    },
  };
}
