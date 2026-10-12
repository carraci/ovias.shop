import test from "node:test";
import assert from "node:assert/strict";
import { installMongoFixture } from "./helpers/mongo-fixture";
import { transaction } from "../src/server/db";
import { recordPaidCouponUsage } from "../src/server/checkout-pricing";
import type { Order } from "../src/lib/types";

test("coupon usage belongs to verified settlement and retries record it once", async () => {
  const database = installMongoFixture([]);
  const coupon = { id: "coupon-fixture", code: "SAVE", usedCount: 0, usedBy: [] };
  const order = {
    id: "order-fixture", provider: "razorpay", status: "pending",
    checkoutQuote: { promoCode: "SAVE" }, address: { email: "Customer@example.test" },
  } as Order;
  try {
    await transaction(repo => repo.put("coupons", coupon));
    for (const status of ["pending", "payment_pending", "payment_failed", "cancelled", "expired", "refund_required", "demo"] as const) {
      await transaction(repo => recordPaidCouponUsage(repo, { ...order, status }));
    }
    assert.equal(database.snapshot().coupons[0].usedCount, 0);
    const paid = { ...order, status: "paid" } as Order;
    await Promise.all([
      transaction(repo => recordPaidCouponUsage(repo, paid)),
      transaction(repo => recordPaidCouponUsage(repo, paid)),
    ]);
    await transaction(repo => recordPaidCouponUsage(repo, paid));
    assert.equal(database.snapshot().coupons[0].usedCount, 1);
    assert.deepEqual(database.snapshot().coupons[0].usedBy, ["customer@example.test"]);
    assert.equal(database.snapshot().events.length, 1);
    await transaction(repo => recordPaidCouponUsage(repo, { ...paid, id: "demo-paid", provider: "demo" }));
    assert.equal(database.snapshot().coupons[0].usedCount, 1);
  } finally {
    database.restore();
  }
});
