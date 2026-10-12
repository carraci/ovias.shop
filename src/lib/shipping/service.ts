import { applyCourierEvent } from "./courier-events";
import { verifiedShipment } from "@/server/logistics";
import { transaction } from "@/server/db";
import { ApiError } from "@/server/http";
import type { Order } from "@/lib/types";
import { DelhiveryShippingProvider } from "./delhivery";
import {
  standardizeAddress,
  geocodeAddress,
  computeRoute,
} from "./delhivery-maps";
import type {
  ShippingProvider,
  OrderShipping,
  InternalShippingStatus,
  TrackingEvent,
} from "./types";
import {
  queueShippingNotification,
  deliverShippingNotification,
} from "@/server/mail";

// Registry of shipping providers
const providers: Record<string, ShippingProvider> = {
  delhivery: new DelhiveryShippingProvider(),
};

export function getShippingProvider(name = "delhivery"): ShippingProvider {
  const provider =
    name.toLowerCase() === "delhivery"
      ? new DelhiveryShippingProvider()
      : providers[name.toLowerCase()];
  if (!provider) {
    throw new ApiError(400, `Unsupported shipping provider: ${name}`);
  }
  return provider;
}

export function registerShippingProvider(provider: ShippingProvider) {
  providers[provider.name.toLowerCase()] = provider;
}

const STATUS_PROGRESSION: InternalShippingStatus[] = [
  "ORDER_CONFIRMED",
  "PACKED",
  "SHIPMENT_CREATED",
  "PICKED_UP",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

export async function createOrderShipment(
  orderId: string,
  options?: { force?: boolean; providerName?: string },
): Promise<OrderShipping> {
  if (options?.force)
    throw new ApiError(409, "Forced duplicate shipment creation is disabled.");
  const { executeLogistics } = await import("@/server/logistics");
  const order = await executeLogistics(
    { orderId, action: "approve", confirmed: true },
    "Owner shipment request",
  );
  if (!order.shipping)
    throw new ApiError(
      409,
      order.logisticsOperations?.approve?.message ||
        "Shipment is not confirmed.",
    );
  return order.shipping;
}

export async function syncOrderTracking(
  orderId: string,
  providerName = "delhivery",
): Promise<OrderShipping> {
  const snapshot = await transaction((repo) =>
    repo.get<Order>("orders", orderId),
  );
  if (!snapshot || !verifiedShipment(snapshot))
    throw new ApiError(409, "A verified courier shipment is required.");
  const tracking = await getShippingProvider(providerName).trackShipment(
    snapshot.shipping!.awb!,
  );
  if (!tracking.success || tracking.awb !== snapshot.shipping!.awb)
    throw new ApiError(502, "Courier tracking could not be confirmed.");
  let changed: string | undefined;
  const shipping = await transaction(async (repo) => {
    let order = await repo.get<Order>("orders", orderId);
    if (!order?.shipping || order.shipping.awb !== tracking.awb)
      throw new ApiError(409, "Shipment association changed.");
    const before = order.shipping.status;
    for (const event of tracking.events)
      order = applyCourierEvent(order, tracking.awb!, event);
    order = {
      ...order,
      shipping: {
        ...order.shipping!,
        estimatedDelivery:
          tracking.estimatedDelivery || order.shipping!.estimatedDelivery,
      },
    };
    await repo.put("orders", order);
    if (order.shipping!.status !== before) {
      changed = order.shipping!.status;
      await queueShippingNotification(repo, order, changed, tracking.awb);
    }
    return order.shipping!;
  });
  if (changed) await deliverShippingNotification(orderId, changed);
  return shipping;
}

export async function cancelOrderShipment(
  orderId: string,
): Promise<OrderShipping> {
  const { executeLogistics } = await import("@/server/logistics");
  const order = await executeLogistics(
    { orderId, action: "cancel", confirmed: true },
    "Owner cancellation request",
  );
  if (order.status !== "cancelled")
    throw new ApiError(
      409,
      order.logisticsOperations?.cancel?.message ||
        "Cancellation is not confirmed.",
    );
  return (
    order.shipping || {
      provider: "delhivery",
      environment: "production",
      status: "CANCELLED",
      events: [],
    }
  );
}

export async function requestOrderPickup(
  orderId: string,
  options?: {
    pickupDate?: string;
    pickupTime?: string;
    pickupLocation?: string;
    expectedCount?: number;
  },
): Promise<OrderShipping> {
  const { executeLogistics } = await import("@/server/logistics");
  const order = await executeLogistics(
    { orderId, action: "approve", confirmed: true },
    "Owner pickup request",
  );
  if (!order.shipping?.pickup?.pickupId)
    throw new ApiError(409, "Courier pickup is not confirmed.");
  return order.shipping;
}

export async function getOrderShippingLabel(orderId: string) {
  const provider = getShippingProvider("delhivery");

  return transaction(async (repo) => {
    const order = await repo.get<Order>("orders", orderId);
    if (!order) throw new ApiError(404, "Order not found.");
    if (!order.shipping || !order.shipping.awb) {
      throw new ApiError(400, "No shipment created for this order yet.");
    }

    return provider.getShippingLabel(order.shipping.awb);
  });
}

/**
 * Development & Testing Sandbox Simulator.
 * Strictly forbidden in production.
 */
export async function simulateShippingStep(
  orderId: string,
  targetStatus?: InternalShippingStatus,
): Promise<OrderShipping> {
  throw new ApiError(
    403,
    "Simulated shipment and delivery updates are disabled.",
  );
}

export async function processShippingWebhook(payload: unknown): Promise<{
  success: boolean;
  orderId?: string;
  status?: InternalShippingStatus;
}> {
  const parsed = getShippingProvider("delhivery").parseWebhookPayload(payload);
  if (!parsed?.awb) return { success: false };
  const result = await transaction(async (repo) => {
    const matches = (await repo.find<Order>("orders")).filter(
      (order) => order.shipping?.awb === parsed.awb,
    );
    if (matches.length !== 1) return { success: false };
    const order = matches[0],
      updated = applyCourierEvent(order, parsed.awb!, parsed.event);
    if (updated === order)
      return {
        success: true,
        orderId: order.id,
        status: order.shipping!.status,
        changed: false,
      };
    await repo.put("orders", updated);
    await queueShippingNotification(repo, updated, parsed.status, parsed.awb);
    return {
      success: true,
      orderId: order.id,
      status: parsed.status,
      changed: true,
    };
  });
  if (result.success && result.changed && result.orderId && result.status)
    await deliverShippingNotification(result.orderId, result.status);
  return result;
}
