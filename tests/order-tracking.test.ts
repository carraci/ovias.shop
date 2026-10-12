import { test } from "node:test";
import assert from "node:assert/strict";
import {
  TRACKING_STAGES,
  trackingStatusRank,
  shipmentUnavailable,
} from "../src/lib/order-tracking";

test("assigning an AWB does not mark an order shipped before courier pickup", () => {
  const createdRank = trackingStatusRank("SHIPMENT_CREATED");
  const shipped = TRACKING_STAGES.find((stage) => stage.key === "PICKED_UP")!;
  assert.equal(
    TRACKING_STAGES.find((stage) => stage.orderRank === createdRank)?.label,
    "Ready to Ship",
  );
  assert.equal(createdRank >= shipped.orderRank, false);
  assert.equal(trackingStatusRank("PICKED_UP"), shipped.orderRank);
  assert.equal(trackingStatusRank("DELIVERED"), TRACKING_STAGES.length);
});

test("missing, failed, cancelled and returned tracking does not claim delivery progress", () => {
  assert.equal(trackingStatusRank(undefined), 0);
  for (const status of [
    "CANCELLED",
    "DELIVERY_FAILED",
    "RTO",
    "RETURNED",
  ] as const)
    assert.equal(trackingStatusRank(status), -1);
});

test("no-shipment messages distinguish verified payment, unverified checkout and terminal order states", () => {
  assert.equal(shipmentUnavailable("paid").title, "Awaiting dispatch");
  assert.match(shipmentUnavailable("paid").message, /payment is confirmed/);
  assert.equal(
    shipmentUnavailable("payment_pending").title,
    "Awaiting payment confirmation",
  );
  assert.equal(
    shipmentUnavailable("pending").title,
    "Awaiting payment confirmation",
  );
  assert.equal(shipmentUnavailable("cancelled").title, "Order cancelled");
  assert.equal(shipmentUnavailable("expired").title, "Checkout expired");
  assert.equal(
    shipmentUnavailable("payment_failed").title,
    "Payment unsuccessful",
  );
  assert.equal(
    shipmentUnavailable("refund_required").title,
    "Payment requires review",
  );
  assert.match(
    shipmentUnavailable("demo").message,
    /No real payment or shipment/,
  );
  assert.equal(shipmentUnavailable("unknown").title, "Tracking not available");
});
