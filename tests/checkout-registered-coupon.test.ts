import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { products } from "../src/lib/catalog";
import { installMongoFixture } from "./helpers/mongo-fixture";
import { transaction } from "../src/server/db";
import { changeCart, createOrder } from "../src/server/commerce";
import { checkoutQuote, recordPaidCouponUsage } from "../src/server/checkout-pricing";
import type { Order } from "../src/lib/types";

test("registered coupon rejects a guest with a known email and accepts authenticated customer context", async () => {
  const database = installMongoFixture();
  const customer = { id: "registered-fixture", email: "registered@example.test" };
  const address = { name: "Fixture Customer", email: "gift@example.test", phone: "9876543210", line1: "123 Fixture Street", city: "Mumbai", region: "Maharashtra", postalCode: "400001", country: "IN" as const };
  const input = { shippingMethod: "standard" as const, promoCode: "MEMBER", customerEmail: customer.email };
  try {
    await transaction(async repo => {
      await repo.put("users", customer);
      await repo.put("coupons", { id: "member-coupon", code: "MEMBER", status: "Active", discountType: "percentage", value: 10, onlyRegistered: true, usedCount: 0, usedBy: [] });
    });
    const sku = products[0].variants[0].sku;
    await changeCart("guest-fixture", sku, 1, "add");
    await assert.rejects(checkoutQuote("guest-fixture", input, customer.email), /Sign in/);
    await assert.rejects(checkoutQuote("guest-fixture", input, customer.email, "missing-user"), /Sign in/);
    await changeCart(customer.id, sku, 1, "add");
    const quote = await checkoutQuote(customer.id, input, address.email, customer.id);
    assert.equal(quote.discount, Math.round(quote.subtotal * 0.1));
    const pending = await createOrder(customer.id, customer.id, address, randomUUID(), "razorpay", { quoteId: quote.id, shippingMethod: "standard", promoCode: "MEMBER" });
    assert.equal(pending.status, "pending");
    assert.equal(database.snapshot().coupons[0].usedCount, 0);
    await transaction(repo => recordPaidCouponUsage(repo, { ...pending, status: "paid" } as Order));
    assert.deepEqual(database.snapshot().coupons[0].usedBy, [customer.email]);
    await assert.rejects(checkoutQuote(customer.id, input, "another-gift@example.test", customer.id), /already used/);
  } finally {
    database.restore();
  }
});
