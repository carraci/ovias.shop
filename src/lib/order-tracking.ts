import type { InternalShippingStatus } from "./shipping/types";

export const TRACKING_STAGES: {
  key: InternalShippingStatus;
  label: string;
  orderRank: number;
}[] = [
  { key: "ORDER_CONFIRMED", label: "Order Confirmed", orderRank: 1 },
  { key: "PACKED", label: "Packed", orderRank: 2 },
  { key: "READY_TO_SHIP", label: "Ready to Ship", orderRank: 3 },
  { key: "PICKUP_SCHEDULED", label: "Pickup Scheduled", orderRank: 4 },
  { key: "PICKED_UP", label: "Picked Up", orderRank: 5 },
  { key: "IN_TRANSIT", label: "In Transit", orderRank: 6 },
  { key: "OUT_FOR_DELIVERY", label: "Out for Delivery", orderRank: 7 },
  { key: "DELIVERED", label: "Delivered", orderRank: 8 },
];

export function trackingStatusRank(status?: InternalShippingStatus): number {
  if (
    ["CANCELLED", "DELIVERY_FAILED", "NDR", "RTO", "RETURNED"].includes(
      status || "",
    )
  )
    return -1;
  if (status === "SHIPMENT_CREATED") return 3;
  return TRACKING_STAGES.find((stage) => stage.key === status)?.orderRank || 0;
}

export function shipmentUnavailable(status:string){
 switch(status){
 case "paid":return {title:"Awaiting dispatch",message:"Your payment is confirmed. Shipment creation and courier pickup have not been confirmed yet."};
 case "demo":return {title:"Demo order",message:"No real payment or shipment has been confirmed for this demo order."};
 case "pending":case "payment_pending":return {title:"Awaiting payment confirmation",message:"Payment has not been confirmed. Shipping will follow verified payment and owner approval."};
 case "cancelled":return {title:"Order cancelled",message:"This order is cancelled. Any refund is tracked separately by the payment provider."};
 case "expired":return {title:"Checkout expired",message:"This checkout expired before payment confirmation."};
 case "payment_failed":return {title:"Payment unsuccessful",message:"Payment failed. No courier shipment has been confirmed."};
 case "refund_required":return {title:"Payment requires review",message:"This payment requires reconciliation. No dispatch is confirmed."};
 default:return {title:"Tracking not available",message:"No verified courier tracking number is recorded for this order."};
 }
}
