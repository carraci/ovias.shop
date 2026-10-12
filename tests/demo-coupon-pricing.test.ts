import { test } from "node:test";
import assert from "node:assert/strict";
import { priceLines } from "../src/server/checkout-pricing";
import type { Repository } from "../src/server/db";

// Isolated calculation tests: the explicit repository never contacts MongoDB,
// payments, mail, or any existing customer records.
process.env.MONGODB_URI = "";
process.env.PAYMENT_PROVIDER = "razorpay";
process.env.CHECKOUT_TAX_BPS = "0";
process.env.CHECKOUT_TAX_INCLUSIVE = "true";
process.env.CHECKOUT_STANDARD_SHIPPING_PAISE = "0";
process.env.CHECKOUT_EXPRESS_ENABLED = "false";

const activeCoupon = {
  id: "isolated-coupon", code: "DEMO10", status: "Active",
  discountType: "percentage", value: 10, startDate: "2000-01-01",
  endDate: "2099-12-31", usedBy: [],
};
async function quote(patch: Record<string, unknown> = {}, subtotal = 400000, legacy = false) {
  const coupon = legacy ? { id: "isolated-promo", code: "DEMO10", active: true, type: "percent", value: 1000, ...patch } : { ...activeCoupon, ...patch };
  const repo = {
    get: async () => undefined,
    find: async (collection: string) => collection === "coupons"
      ? (patch.missing || legacy ? [] : [coupon])
      : collection === "checkoutPromos" && legacy ? [coupon]
      : collection === "products" ? [{ id: "isolated-product", freeShipping: false, variants: [{ sku: "DEMO-SKU" }] }] : [],
  } as unknown as Repository;
  return priceLines([{ sku: "DEMO-SKU", name: "Isolated case", color: "Black", price: subtotal, quantity: 1, image: "", slug: "isolated-case" }], 1,
    { shippingMethod: "standard", promoCode: "DEMO10", customerEmail: "demo@example.test" }, repo);
}

test("percentage coupon subtracts from the merchandise subtotal and preserves delivery fees", async () => {
  const result = await quote();
  assert.equal(result.discount, 40000);
  assert.equal(result.shipping, 19900);
  assert.equal(result.total, 379900);
});
test("fixed coupons use the rupee amount stored by the admin editor", async () => {
  assert.equal((await quote({ discountType: "fixed", value: 500 })).discount, 50000);
});
test("free shipping coupon removes the shipping fee without discounting merchandise", async () => {
  const result = await quote({ discountType: "free_shipping", value: 0 });
  assert.equal(result.shipping, 0);
  assert.equal(result.discount, 0);
  assert.equal(result.total, 400000);
});
test("percentage discount obeys its admin maximum discount cap", async () => {
  assert.equal((await quote({ maxDiscount: 100 })).discount, 10000);
});
test("coupon minimum subtotal rejects an underpriced order", async () => {
  await assert.rejects(quote({ minOrder: 5000 }), /Minimum order amount/);
});
test("paused coupons cannot reduce an order total", async () => {
  await assert.rejects(quote({ status: "Paused" }), /currently paused/);
});
test("future coupons cannot be used before their start date", async () => {
  await assert.rejects(quote({ startDate: "2099-01-01" }), /not active yet/);
});
test("expired coupons cannot reduce an order total", async () => {
  await assert.rejects(quote({ endDate: "2000-01-01" }), /expired/);
});
test("a fully consumed coupon is rejected at the usage limit", async () => {
  await assert.rejects(quote({ usageLimit: 2, usedCount: 2 }), /maximum usage limit/);
});
test("one-time coupon use recognizes the same customer email across casing", async () => {
  await assert.rejects(quote({ oneTimePerUser: true, usedBy: ["DEMO@EXAMPLE.TEST"] }), /already used/);
});
test("unknown coupon codes fail rather than granting an unverified discount", async () => {
  await assert.rejects(quote({ missing: true }), /does not exist|not found|invalid|not valid/i);
});
test("large fixed rupee discounts retain their unit instead of becoming paise", async () => {
  assert.equal((await quote({ discountType: "fixed", value: 60000 }, 10000000)).discount, 6000000);
});
test("large minimum-order rupee values remain enforceable", async () => {
  await assert.rejects(quote({ minOrder: 20000 }, 1500000), /Minimum order amount/);
});
test("large maximum-discount rupee values cap the percentage correctly", async () => {
  assert.equal((await quote({ value: 50, maxDiscount: 60000 }, 20000000)).discount, 6000000);
});
test("legacy checkout percentage promos retain basis-point units", async () => {
  assert.equal((await quote({ type: "percent", value: 1000 }, 400000, true)).discount, 40000);
});
test("legacy fixed checkout promos retain their paise units", async () => {
  assert.equal((await quote({ type: "fixed", value: 50000 }, 400000, true)).discount, 50000);
});
test("legacy minimum subtotal requirements retain their paise units", async () => {
  await assert.rejects(quote({ minimum: 500000 }, 400000, true), /Minimum order amount/);
});
test("date-only expiry remains valid through the final Indian calendar day", async () => {
  const originalNow = Date.now;
  try {
    Date.now = () => Date.parse("2026-12-31T23:58:00+05:30");
    assert.equal((await quote({ endDate: "2026-12-31" })).discount, 40000);
    Date.now = () => Date.parse("2027-01-01T00:00:00+05:30");
    await assert.rejects(quote({ endDate: "2026-12-31" }), /expired/);
  } finally { Date.now = originalNow; }
});
