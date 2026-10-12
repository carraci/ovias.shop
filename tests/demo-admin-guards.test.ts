import { test } from "node:test";
import assert from "node:assert/strict";
import { inventoryStatus, lowStockThreshold } from "../src/lib/inventory-stock";
import { activeSalePrice } from "../src/lib/product-sale";
import { isOwnerRole, authorizeAdminApi } from "../src/server/admin-auth";
import { adjustInventoryStock, canTransitionOrder } from "../src/server/admin-service";

test("only owner and admin roles can enter owner administration", () => {
  for (const role of ["OWNER", "owner", "ADMIN", "admin"]) assert.equal(isOwnerRole(role), true);
  for (const role of ["CUSTOMER", "customer", "guest", "support", undefined]) assert.equal(isOwnerRole(role), false);
});
test("admin API requests without a session receive no store records", async () => {
  const result = await authorizeAdminApi(new Request("http://localhost:3000/api/admin/orders"));
  assert.equal(result.authorized, false);
  if (!result.authorized) {
    assert.equal(result.response.status, 401);
    const body = await result.response.json();
    assert.equal(body.orders, undefined);
    assert.equal(body.customers, undefined);
  }
});
test("zero, fractional and nonfinite inventory adjustments are rejected before database writes", async () => {
  for (const adjustment of [0, 0.5, NaN, Infinity]) {
    await assert.rejects(adjustInventoryStock({ sku: "isolated", adjustment, reason: "RESTOCK", actor: "owner@example.test" }), /nonzero whole quantity/);
  }
});
test("inventory badges honor the configured threshold and zero inventory", () => {
  assert.equal(inventoryStatus(0, 4), "Out of Stock");
  assert.equal(inventoryStatus(4, 4), "Low Stock");
  assert.equal(inventoryStatus(5, 4), "In Stock");
  assert.equal(inventoryStatus(1, 0), "In Stock");
});
test("invalid inventory thresholds fall back to the default rather than negative or fractional limits", () => {
  for (const value of [-1, "invalid", 1.5]) assert.equal(lowStockThreshold(value), 5);
  assert.equal(lowStockThreshold("4"), 4);
});
test("terminal delivered, cancelled and refunded orders cannot be moved backwards", () => {
  assert.equal(canTransitionOrder("Delivered", "Processing"), false);
  assert.equal(canTransitionOrder("Cancelled", "Shipped"), false);
  assert.equal(canTransitionOrder("Refunded", "Confirmed"), false);
  assert.equal(canTransitionOrder("Delivered", "Return Requested"), true);
  assert.equal(canTransitionOrder("Shipped", "Out for Delivery"), true);
});
test("scheduled sale prices use Indian start and end day boundaries", () => {
  const sale = { enabled: true, price: 400000, startDate: "2026-10-12", endDate: "2026-10-12" };
  assert.equal(activeSalePrice(sale, 500000, new Date("2026-10-11T23:59:59+05:30")), 500000);
  assert.equal(activeSalePrice(sale, 500000, new Date("2026-10-12T00:00:00+05:30")), 400000);
  assert.equal(activeSalePrice(sale, 500000, new Date("2026-10-12T23:59:59+05:30")), 400000);
  assert.equal(activeSalePrice(sale, 500000, new Date("2026-10-13T00:00:00+05:30")), 500000);
});
