import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createCareTicket } from "../src/server/care-order-requests";
import type { Repository } from "../src/server/db";
import type { CareTicket } from "../src/lib/care";
import type { Order } from "../src/lib/types";

const user = {
  id: "customer-a",
  name: "Customer A",
  email: "customer-a@example.test",
};
const anotherUser = {
  id: "customer-b",
  name: "Customer B",
  email: "customer-b@example.test",
};

function order(overrides: Partial<Order> = {}): Order {
  return {
    id: randomUUID(),
    owner: user.id,
    userId: user.id,
    idempotencyKey: randomUUID(),
    provider: "razorpay",
    providerId: "order_mock",
    captureId: "payment_mock",
    status: "paid",
    total: 300,
    createdAt: "2026-10-01T10:00:00.000Z",
    expiresAt: "2026-10-01T10:35:00.000Z",
    address: {
      name: user.name,
      email: user.email,
      line1: "Test street 123",
      city: "Mumbai",
      region: "Maharashtra",
      postalCode: "400001",
      country: "IN",
    },
    lines: [
      {
        sku: "bag-black",
        name: "OVIA bag",
        color: "Black",
        price: 100,
        quantity: 2,
        image: "/bag.png",
        slug: "bag",
      },
      {
        sku: "case-silver",
        name: "OVIA case",
        color: "Silver",
        price: 100,
        quantity: 1,
        image: "/case.png",
        slug: "case",
      },
    ],
    ...overrides,
  };
}

function repository(initialOrder?: Order) {
  const values = new Map<string, Map<string, { id: string }>>();
  if (initialOrder)
    values.set(
      "orders",
      new Map([[initialOrder.id, structuredClone(initialOrder)]]),
    );
  const repo: Repository = {
    async get<T extends { id: string }>(collection: string, id: string) {
      return structuredClone(values.get(collection)?.get(id)) as T | undefined;
    },
    async find<T extends { id: string }>(
      collection: string,
      query: Partial<T> = {},
    ) {
      return [...(values.get(collection)?.values() || [])]
        .filter((value) =>
          Object.entries(query).every(
            ([key, match]) => (value as Record<string, unknown>)[key] === match,
          ),
        )
        .map((value) => structuredClone(value)) as T[];
    },
    async put<T extends { id: string }>(collection: string, value: T) {
      if (!values.has(collection)) values.set(collection, new Map());
      values.get(collection)!.set(value.id, structuredClone(value));
    },
    async remove(collection: string, id: string) {
      values.get(collection)?.delete(id);
    },
  };
  return repo;
}

function input(
  selectedOrder: Order,
  type: "cancellation" | "return" | "refund",
) {
  return {
    category:
      type === "cancellation"
        ? "Order issue"
        : type === "return"
          ? "Return"
          : "Refund",
    subject: `Request ${type}`,
    message: "Please review this request for my order.",
    orderId: selectedOrder.id,
    idempotencyKey: randomUUID(),
    orderAction:
      type === "cancellation"
        ? { type }
        : { type, items: [{ sku: "bag-black", quantity: 1 }] },
  };
}

test("general support requests and existing retry behavior remain compatible", async () => {
  const repo = repository();
  const payload = {
    category: "Product question",
    subject: "Product materials",
    message: "Can you describe the product materials?",
    orderId: "",
    idempotencyKey: randomUUID(),
  };
  const saved = await createCareTicket(repo, user, payload);
  assert.equal(saved.orderAction, undefined);
  assert.equal(saved.status, "New");
  assert.equal(saved.messages[0].author, "customer");
  assert.deepEqual(await createCareTicket(repo, user, payload), saved);
  assert.equal((await repo.find("tickets")).length, 1);
});

test("cancellation records one review request for undispatched valid orders without cancelling or refunding", async () => {
  for (const status of ["pending", "payment_pending", "paid"] as const) {
    const original = order({ status });
    const repo = repository(original);
    const payload = input(original, "cancellation");
    const saved = await createCareTicket(repo, user, payload);
    assert.deepEqual(saved.orderAction, { type: "cancellation" });
    const after = await repo.get<Order>("orders", original.id);
    assert.equal(after?.status, original.status);
    assert.equal(after?.total, original.total);
    assert.equal(after?.captureId, original.captureId);
    assert.equal(after?.shipping, undefined);
    assert.equal((await repo.find("tickets")).length, 1);
  }
});

test("return/refund product quantities are saved as requests without changing payment or shipping", async () => {
  for (const type of ["return", "refund"] as const) {
    for (const status of ["paid", "refund_required"] as const) {
      const original = order({ status });
      const repo = repository(original);
      const saved = await createCareTicket(repo, user, input(original, type));
      assert.deepEqual(saved.orderAction, {
        type,
        items: [{ sku: "bag-black", quantity: 1 }],
      });
      assert.equal(
        (await repo.get<Order>("orders", original.id))?.status,
        status,
      );
      assert.equal(
        (await repo.get<Order>("orders", original.id))?.total,
        original.total,
      );
      assert.equal((await repo.find("events")).length, 0);
      assert.equal((await repo.find("mail")).length, 0);
    }
  }
});

test("customers cannot request actions for someone else's order or reuse their ticket key", async () => {
  const original = order();
  const repo = repository(original);
  const payload = input(original, "refund");
  await assert.rejects(
    createCareTicket(repo, anotherUser, payload),
    /Order not found/,
  );
  const saved = await createCareTicket(repo, user, payload);
  await assert.rejects(
    createCareTicket(repo, anotherUser, payload),
    /Request conflict/,
  );
  assert.equal((await repo.find("tickets")).length, 1);
  assert.equal(saved.userId, user.id);
});

test("demo, expired, cancelled and failed orders cannot create monetary or cancellation requests", async () => {
  for (const status of [
    "demo",
    "expired",
    "cancelled",
    "payment_failed",
  ] as const) {
    for (const type of ["cancellation", "return", "refund"] as const) {
      const original = order({ status });
      const repo = repository(original);
      await assert.rejects(
        createCareTicket(repo, user, input(original, type)),
        /not eligible/,
      );
      assert.equal((await repo.find("tickets")).length, 0);
    }
  }
  const demo = order({ provider: "demo", status: "paid" });
  await assert.rejects(
    createCareTicket(repository(demo), user, input(demo, "refund")),
    /not eligible/,
  );
});

test("unverified payments cannot request return/refund, and captured-payment review cannot request cancellation", async () => {
  for (const status of ["pending", "payment_pending"] as const) {
    for (const type of ["return", "refund"] as const) {
      const original = order({ status });
      await assert.rejects(
        createCareTicket(repository(original), user, input(original, type)),
        /verified payment/,
      );
    }
  }
  const original = order({ status: "refund_required" });
  await assert.rejects(
    createCareTicket(
      repository(original),
      user,
      input(original, "cancellation"),
    ),
    /already been dispatched or needs payment review/,
  );
});

test("cancellation cannot be requested after dispatch or for terminal shipments", async () => {
  for (const status of [
    "PICKED_UP",
    "IN_TRANSIT",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "DELIVERY_FAILED",
    "RTO",
    "RETURNED",
    "CANCELLED",
  ] as const) {
    const original = order({
      shipping: {
        provider: "delhivery",
        environment: "production",
        awb: "MOCK-AWB",
        status,
        events: [],
      },
    });
    await assert.rejects(
      createCareTicket(
        repository(original),
        user,
        input(original, "cancellation"),
      ),
      /already been dispatched/,
    );
  }
  const original = order({
    shipping: {
      provider: "delhivery",
      environment: "production",
      status: "PACKED",
      shippedAt: "2026-10-01T11:00:00.000Z",
      events: [],
    },
  });
  await assert.rejects(
    createCareTicket(
      repository(original),
      user,
      input(original, "cancellation"),
    ),
    /already been dispatched/,
  );
});

test("order action categories and whole-order cancellation payloads are enforced", async () => {
  const original = order();
  await assert.rejects(
    createCareTicket(repository(original), user, {
      ...input(original, "refund"),
      category: "Return",
    }),
    /category does not match/,
  );
  await assert.rejects(
    createCareTicket(repository(original), user, {
      ...input(original, "refund"),
      orderId: "",
    }),
    /Choose an order/,
  );
  await assert.rejects(
    createCareTicket(repository(original), user, {
      ...input(original, "cancellation"),
      orderAction: {
        type: "cancellation",
        items: [{ sku: "bag-black", quantity: 1 }],
      },
    }),
    /entire order/,
  );
});

test("selected products must belong to the order, with unique positive integral quantities", async () => {
  const original = order();
  const selections = [
    [{ sku: "other-product", quantity: 1 }],
    [{ sku: "bag-black", quantity: 3 }],
    [
      { sku: "bag-black", quantity: 1 },
      { sku: "bag-black", quantity: 1 },
    ],
    [{ sku: "bag-black", quantity: 1.5 }],
    [{ sku: "bag-black", quantity: 0 }],
    [],
  ];
  for (const items of selections) {
    const repo = repository(original);
    await assert.rejects(
      createCareTicket(repo, user, {
        ...input(original, "refund"),
        orderAction: { type: "refund", items },
      }),
    );
    assert.equal((await repo.find("tickets")).length, 0);
  }
  await assert.rejects(
    createCareTicket(repository(original), user, {
      ...input(original, "refund"),
      orderAction: { type: "refund" },
    }),
    /Choose at least one product/,
  );
  await assert.rejects(
    createCareTicket(repository(original), user, {
      ...input(original, "refund"),
      orderAction: {
        type: "refund",
        items: [{ sku: "bag-black", quantity: 1 }],
        amount: 300,
      },
    }),
  );
});

test("identical open requests deduplicate across retry keys and reordered selected items", async () => {
  const original = order();
  const repo = repository(original);
  const first = {
    ...input(original, "refund"),
    orderAction: {
      type: "refund",
      items: [
        { sku: "case-silver", quantity: 1 },
        { sku: "bag-black", quantity: 1 },
      ],
    },
  };
  const saved = await createCareTicket(repo, user, first);
  const retried = await createCareTicket(repo, user, {
    ...first,
    idempotencyKey: randomUUID(),
    orderAction: {
      type: "refund",
      items: [...first.orderAction.items].reverse(),
    },
  });
  assert.deepEqual(retried, saved);
  assert.equal((await repo.find("tickets")).length, 1);
  await repo.put("orders", { ...original, status: "cancelled" });
  assert.deepEqual(await createCareTicket(repo, user, first), saved);
});

test("conflicting active requests are rejected; resolved requests allow a new review", async () => {
  for (const status of ["Open", "In Review", "Waiting for Customer"] as const) {
    const original = order();
    const repo = repository(original);
    const saved = await createCareTicket(repo, user, input(original, "refund"));
    await repo.put("tickets", { ...saved, status });
    await assert.rejects(
      createCareTicket(repo, user, input(original, "return")),
      /already under review/,
    );
    await assert.rejects(
      createCareTicket(repo, user, {
        ...input(original, "refund"),
        orderAction: {
          type: "refund",
          items: [{ sku: "bag-black", quantity: 2 }],
        },
      }),
      /already under review/,
    );
    assert.equal((await repo.find("tickets")).length, 1);
    await repo.put("tickets", { ...saved, status: "Resolved" });
    const next = await createCareTicket(repo, user, input(original, "return"));
    assert.notEqual(next.id, saved.id);
    assert.equal((await repo.find("tickets")).length, 2);
  }
});

test("one idempotency key cannot be reused for a different structured order action", async () => {
  const original = order();
  const repo = repository(original);
  const first = input(original, "refund");
  await createCareTicket(repo, user, first);
  await assert.rejects(
    createCareTicket(repo, user, {
      ...input(original, "return"),
      idempotencyKey: first.idempotencyKey,
    }),
    /Request conflict/,
  );
});
