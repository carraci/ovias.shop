import test from "node:test";
import assert from "node:assert/strict";
import { orderWorkflow } from "../src/lib/order-workflow";
import type { Order } from "../src/lib/types";
const order = { status: "paid", refunds: [] } as unknown as Order;
test("paid order offers pack and cancellation", () => {
  const state = orderWorkflow(order);
  assert.ok(state.canPack);
  assert.ok(state.canCancel);
  assert.ok(!state.canRequestReturn);
});
test("unpaid order cannot book courier", () =>
  assert.ok(!orderWorkflow({ ...order, status: "pending" }).canPack));
test("cancelled and refunded orders cannot pack or cancel again", () => {
  assert.ok(!orderWorkflow({ ...order, status: "cancelled" }).canPack);
  assert.ok(
    !orderWorkflow({ ...order, refunds: [{ status: "Refunded" } as any] })
      .canCancel,
  );
});
test("after pickup cancellation becomes return request", () => {
  const state = orderWorkflow({
    ...order,
    shipping: { status: "PICKED_UP" } as any,
  });
  assert.ok(!state.canCancel);
  assert.ok(state.canRequestReturn);
  assert.ok(!state.canPack);
});
test("delivered and returned orders hide cancellation and return request", () => {
  for (const status of ["DELIVERED", "RETURNED"]) {
    const state = orderWorkflow({ ...order, shipping: { status } as any });
    assert.ok(!state.canCancel);
    assert.ok(!state.canRequestReturn);
  }
});

test("stored cancellation deadlines are enforced without inventing a default window", () => {
  assert.equal(
    orderWorkflow({ ...order, cancellationDeadline: "2000-01-01T00:00:00Z" })
      .canCancel,
    false,
  );
  assert.equal(
    orderWorkflow({ ...order, cancellationDeadline: "invalid" }).canCancel,
    false,
  );
  assert.equal(
    orderWorkflow({ ...order, cancellationDeadline: "2099-01-01T00:00:00Z" })
      .canCancel,
    true,
  );
});
