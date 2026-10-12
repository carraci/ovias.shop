import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID, createHmac } from "node:crypto";
import { NextRequest } from "next/server";
import { makeLogisticsService, logisticsInput } from "../src/server/logistics";
import { verifyCourierWebhook } from "../src/server/courier-webhook-auth";
import { applyCourierEvent } from "../src/lib/shipping/courier-events";
import {
  DelhiveryShippingProvider,
  mapDelhiveryStatus,
} from "../src/lib/shipping/delhivery";
import { POST as webhookPOST } from "../src/app/api/webhooks/delhivery/route";
import { POST as shippingPOST } from "../src/app/api/admin/shipping/route";
import type { Repository } from "../src/server/db";
import type { Order, OrderRefund } from "../src/lib/types";
import type {
  ShippingProvider,
  CreateShipmentResult,
  PickupResult,
  CancelShipmentResult,
} from "../src/lib/shipping/types";

function fixture() {
  const order = {
    id: randomUUID(),
    owner: "fixture-owner",
    idempotencyKey: randomUUID(),
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
    orderNumber: "OVIA-FIXTURE1",
    status: "paid",
    provider: "razorpay",
    providerId: "order_fixture1",
    captureId: "pay_fixture1",
    total: 100000,
    paidAt: new Date().toISOString(),
    address: {
      name: "Customer",
      email: "customer@example.test",
      phone: "9876543210",
      line1: "Actual test street",
      city: "Mumbai",
      region: "Maharashtra",
      postalCode: "400072",
      country: "IN",
    },
    lines: [
      {
        sku: "fixture-sku",
        name: "Bag",
        quantity: 1,
        price: 100000,
        color: "Black",
        image: "",
        slug: "fixture-bag",
      },
    ],
    createdAt: new Date().toISOString(),
  } as Order;
  const state = new Map<string, Map<string, any>>([
    ["orders", new Map([[order.id, structuredClone(order)]])],
    [
      "inventory",
      new Map([["fixture-sku", { id: "fixture-sku", available: 9 }]]),
    ],
  ]);
  let queue = Promise.resolve<unknown>(undefined);
  function run<T>(fn: (repo: Repository) => Promise<T>): Promise<T> {
    const task = queue.then(async () => {
      const staged = structuredClone(state);
      const collection = (c: string) => {
        if (!staged.has(c)) staged.set(c, new Map());
        return staged.get(c)!;
      };
      const repo: Repository = {
        get: async (c, id) => structuredClone(collection(c).get(id)),
        find: async (c, q = {}) =>
          [...collection(c).values()]
            .filter((v) =>
              Object.entries(q).every(([k, value]) => v[k] === value),
            )
            .map((v) => structuredClone(v)),
        put: async (c, v) => {
          collection(c).set(v.id, structuredClone(v));
        },
        remove: async (c, id) => {
          collection(c).delete(id);
        },
      };
      const result = await fn(repo);
      state.clear();
      for (const [c, v] of staged) state.set(c, v);
      return result;
    });
    queue = task.catch(() => {});
    return task;
  }
  const calls = {
    trackingReference: "",
    create: 0,
    pickup: 0,
    cancel: 0,
    refund: 0,
    notify: 0,
    verify: 0,
  };
  let shipment: CreateShipmentResult = {
      success: true,
      awb: "123456789012",
      courier: "Delhivery",
      status: "READY_TO_SHIP",
    },
    pickup: PickupResult = { success: true, pickupId: 1234 },
    cancel: CancelShipmentResult = { success: true },
    refundStatus: OrderRefund["status"] = "Processing";
  const provider = {
    name: "delhivery",
    checkServiceability: async () => ({
      serviceable: true,
      pincode: "400072",
      prepaidAvailable: true,
    }),
    createShipment: async () => {
      calls.create++;
      return shipment;
    },
    requestPickup: async () => {
      calls.pickup++;
      return pickup;
    },
    cancelShipment: async () => {
      calls.cancel++;
      return cancel;
    },
    trackShipment: async (reference: string) => {
      calls.trackingReference = reference;
      return ({
      success: true,
      awb: "123456789012",
      courier: "Delhivery",
      status: "READY_TO_SHIP",
      events: [],
      estimatedDelivery: "2026-10-15T00:00:00.000Z",
    }); },
  } as unknown as ShippingProvider;
  const service = makeLogisticsService({
    run,
    provider: () => provider,
    validate: () => {},
    verifyPaid: async () => {
      calls.verify++;
    },
    refund: async (input: any) => {
      calls.refund++;
      const record: OrderRefund = {
        id: input.idempotencyKey,
        paymentId: order.captureId!,
        remoteId: "rfnd_fixture1",
        amount: order.total,
        reason: input.reason,
        actor: "owner",
        status: refundStatus,
        requestedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await run(async (repo) => {
        const current = await repo.get<Order>("orders", order.id);
        await repo.put("orders", { ...current!, refunds: [record] });
      });
      return record;
    },
    queue: async (repo, order, status) => {
      await repo.put("outbox", {
        id: `notice-${order.id}-${status}`,
        status: "pending",
      });
    },
    notify: async () => {
      calls.notify++;
    },
  });
  const input = (action = "approve") => ({
    orderId: order.id,
    action,
    confirmed: true,
    ...(action === "approve"
      ? { package: { weightGrams: 2500, length: 50, width: 30, height: 20 } }
      : { reason: "Customer request" }),
  });
  return {
    order,
    state,
    run,
    calls,
    service,
    input,
    setShipment: (v: CreateShipmentResult) => (shipment = v),
    setPickup: (v: PickupResult) => (pickup = v),
    setCancel: (v: CancelShipmentResult) => (cancel = v),
    setRefund: (v: OrderRefund["status"]) => (refundStatus = v),
  };
}

test("explicit confirmation and real package measurements are required", () => {
  const f = fixture();
  assert.doesNotThrow(() => logisticsInput.parse(f.input()));
  assert.throws(() => logisticsInput.parse({ ...f.input(), confirmed: false }));
  assert.throws(() =>
    logisticsInput.parse({
      ...f.input(),
      package: { weightGrams: 0, length: 50, width: 30, height: 20 },
    }),
  );
  assert.throws(() => logisticsInput.parse({ ...f.input(), awb: "FAKE" }));
});
test("approval confirms AWB and pickup exactly once under concurrent requests", async () => {
  const f = fixture();
  await Promise.all([
    f.service.execute(f.input(), "owner"),
    f.service.execute(f.input(), "owner"),
  ]);
  await f.service.execute(f.input(), "owner");
  const order = await f.service.read(f.order.id);
  assert.equal(f.calls.create, 1);
  assert.equal(f.calls.pickup, 1);
  assert.equal(order.fulfillmentStatus, "READY_TO_SHIP");
  assert.equal(order.shipping?.status, "PICKUP_SCHEDULED");
  assert.equal(order.shipping?.awb, "123456789012");
  assert.equal(order.shipping?.shippedAt, undefined);
  assert.equal(order.logisticsOperations?.approve?.status, "Confirmed");
  assert.equal(f.calls.refund, 0);
  assert.ok(f.state.get("outbox")?.size);
});
test("missing AWB and ambiguous creation never invent tracking or replay shipment writes", async () => {
  const f = fixture();
  f.setShipment({
    success: true,
    courier: "Delhivery",
    status: "READY_TO_SHIP",
  });
  const result = await f.service.execute(f.input(), "owner");
  assert.equal(result.shipping, undefined);
  assert.equal(result.logisticsOperations?.approve?.status, "Processing");
  await f.service.execute(f.input(), "owner");
  assert.equal(f.calls.create, 1);
  assert.equal(f.calls.pickup, 0);
});
test("pickup rejection retains confirmed shipment and retries only pickup", async () => {
  const f = fixture();
  f.setPickup({ success: false, error: "Pickup rejected" });
  let order = await f.service.execute(f.input(), "owner");
  assert.equal(order.logisticsOperations?.approve?.status, "Failed");
  assert.equal(order.shipping?.status, "READY_TO_SHIP");
  f.setPickup({ success: true, pickupId: 77 });
  order = await f.service.execute(f.input(), "owner");
  assert.equal(f.calls.create, 1);
  assert.equal(f.calls.pickup, 2);
  assert.equal(order.shipping?.status, "PICKUP_SCHEDULED");
});
test("ambiguous pickup stays Processing and is not duplicated", async () => {
  const f = fixture();
  f.setPickup({ success: false, uncertain: true });
  await f.service.execute(f.input(), "owner");
  await f.service.execute(f.input(), "owner");
  assert.equal(f.calls.pickup, 1);
  assert.equal(
    (await f.service.read(f.order.id)).logisticsOperations?.approve?.status,
    "Processing",
  );
});
test("courier cancellation must succeed before refund, inventory restore or cancellation status", async () => {
  const f = fixture();
  await f.service.execute(f.input(), "owner");
  f.setCancel({ success: false, error: "Rejected" });
  const order = await f.service.execute(f.input("cancel"), "owner");
  assert.equal(order.status, "paid");
  assert.equal(order.inventoryReleased, undefined);
  assert.equal(f.state.get("inventory")!.get("fixture-sku").available, 9);
  assert.equal(f.calls.refund, 0);
  assert.equal(order.logisticsOperations?.cancel?.status, "Failed");
});
test("confirmed cancellation restores inventory once and exposes the real Processing refund", async () => {
  const f = fixture();
  await f.service.execute(f.input(), "owner");
  await Promise.all([
    f.service.execute(f.input("cancel"), "owner"),
    f.service.execute(f.input("cancel"), "owner"),
  ]);
  await f.service.execute(f.input("cancel"), "owner");
  const order = await f.service.read(f.order.id);
  assert.equal(order.status, "cancelled");
  assert.equal(order.fulfillmentStatus, "CANCELLED");
  assert.equal(order.refunds?.[0].status, "Processing");
  assert.equal(f.calls.cancel, 1);
  assert.equal(f.calls.refund, 1);
  assert.equal(f.state.get("inventory")!.get("fixture-sku").available, 10);
  assert.equal(order.shipping?.pickup?.status, "SHIPMENT_WITHDRAWN");
});
test("refund failure never becomes Refunded and unpaid cancellations do not call Razorpay", async () => {
  const f = fixture();
  f.setRefund("Failed");
  const order = await f.service.execute(f.input("cancel"), "owner");
  assert.equal(order.status, "cancelled");
  assert.equal(order.logisticsOperations?.cancel?.status, "Failed");
  assert.equal(order.refunds?.[0].status, "Failed");
  const unpaid = fixture();
  await unpaid.run((repo) =>
    repo.put("orders", {
      ...unpaid.order,
      status: "pending",
      paidAt: undefined,
      captureId: undefined,
    }),
  );
  await unpaid.service.execute(unpaid.input("cancel"), "owner");
  assert.equal(unpaid.calls.refund, 0);
  assert.equal(unpaid.calls.cancel, 0);
});
test("shipped packages cannot be cancelled and restored into available inventory", async () => {
  const f = fixture();
  await f.service.execute(f.input(), "owner");
  await f.run(async (repo) => {
    const order = await repo.get<Order>("orders", f.order.id);
    await repo.put("orders", {
      ...order!,
      shipping: { ...order!.shipping!, status: "IN_TRANSIT" },
    });
  });
  await assert.rejects(
    f.service.execute(f.input("cancel"), "owner"),
    /left the warehouse/,
  );
  assert.equal(f.calls.cancel, 0);
  assert.equal(f.calls.refund, 0);
});
test("courier events enforce identity, scan time, deduplication and terminal states", async () => {
  const f = fixture();
  await f.service.execute(f.input(), "owner");
  const order = await f.service.read(f.order.id),
    timestamp = new Date(Date.now() + 1000).toISOString();
  const event = {
    status: "IN_TRANSIT" as const,
    description: "Courier scan",
    timestamp,
  };
  assert.equal(applyCourierEvent(order, "999999999999", event), order);
  const transit = applyCourierEvent(order, order.shipping!.awb!, event);
  assert.equal(transit.fulfillmentStatus, "IN_TRANSIT");
  assert.equal(
    applyCourierEvent(transit, transit.shipping!.awb!, event),
    transit,
  );
  assert.equal(
    applyCourierEvent(transit, transit.shipping!.awb!, {
      ...event,
      status: "PICKED_UP",
      timestamp: new Date(Date.now() + 2000).toISOString(),
    }),
    transit,
  );
  const deliveredTime = new Date(Date.now() + 3000).toISOString();
  const delivered = applyCourierEvent(transit, transit.shipping!.awb!, {
    ...event,
    status: "DELIVERED",
    timestamp: deliveredTime,
  });
  assert.equal(delivered.shipping?.deliveredAt, deliveredTime);
  assert.equal(
    applyCourierEvent(delivered, delivered.shipping!.awb!, {
      ...event,
      timestamp: new Date(Date.now() + 4000).toISOString(),
    }),
    delivered,
  );
});
test("unknown and undelivered courier scans never map to Delivered", () => {
  assert.equal(mapDelhiveryStatus("Undelivered"), "NDR");
  assert.equal(mapDelhiveryStatus("RTO"), "RTO");
  assert.equal(mapDelhiveryStatus("Delivered", "RT"), "RETURNED");
  assert.equal(mapDelhiveryStatus("Mystery status"), "PROCESSING");
  assert.equal(mapDelhiveryStatus("Pickup Scheduled"), "PICKUP_SCHEDULED");
});
test("webhooks require configured credentials and exact raw-body authentication", () => {
  const raw = '{"AWB":"123456789012"}',
    secret = "fixture-secret",
    signature = createHmac("sha256", secret).update(raw).digest("hex");
  assert.throws(
    () => verifyCourierWebhook(raw, new Headers(), ""),
    /not configured/,
  );
  assert.throws(
    () => verifyCourierWebhook(raw, new Headers(), secret),
    /Invalid/,
  );
  assert.doesNotThrow(() =>
    verifyCourierWebhook(
      raw,
      new Headers({ "x-delhivery-signature": signature }),
      secret,
    ),
  );
  assert.throws(
    () =>
      verifyCourierWebhook(
        raw + " ",
        new Headers({ "x-delhivery-signature": signature }),
        secret,
      ),
    /Invalid/,
  );
  assert.doesNotThrow(() =>
    verifyCourierWebhook(
      raw,
      new Headers({ authorization: "Bearer " + secret }),
      secret,
    ),
  );
});
test("anonymous shipping requests and unsigned courier webhooks stop before any provider call", async () => {
  const previous = process.env.DELHIVERY_WEBHOOK_SECRET;
  process.env.DELHIVERY_WEBHOOK_SECRET = "fixture-secret";
  try {
    assert.equal(
      (
        await shippingPOST(
          new NextRequest("http://localhost:3000/api/admin/shipping", {
            method: "POST",
          }),
        )
      ).status,
      401,
    );
    assert.equal(
      (
        await webhookPOST(
          new NextRequest("http://localhost:3000/api/webhooks/delhivery", {
            method: "POST",
            body: "{}",
          }),
        )
      ).status,
      401,
    );
  } finally {
    if (previous === undefined) delete process.env.DELHIVERY_WEBHOOK_SECRET;
    else process.env.DELHIVERY_WEBHOOK_SECRET = previous;
  }
});
test("missing courier credentials do not produce simulated success, AWBs, pickup or labels", async () => {
  const previous = { ...process.env };
  delete process.env.DELHIVERY_API_TOKEN;
  delete process.env.DELHIVERY_TEST_TOKEN;
  try {
    const provider = new DelhiveryShippingProvider();
    assert.equal((await provider.createShipment({} as any)).success, false);
    assert.equal(
      (await provider.requestPickup({ pickupDate: "2026-10-05" })).success,
      false,
    );
    assert.equal(
      (await provider.cancelShipment("123456789012")).success,
      false,
    );
    assert.equal((await provider.trackShipment("123456789012")).success, false);
    assert.equal(
      (await provider.getShippingLabel("123456789012")).success,
      false,
    );
  } finally {
    process.env = previous;
  }
});

test("courier transport uses registered warehouse, actual grams and confirmed response identifiers", async () => {
  const previous = { ...process.env },
    fetcher = globalThis.fetch;
  Object.assign(process.env, {
    DELHIVERY_API_TOKEN: "fixture-token",
    DELHIVERY_PICKUP_LOCATION: "Registered fixture warehouse",
    DELHIVERY_ENV: "staging",
  });
  let response: any = {
    success: true,
    packages: [{ status: "Success", waybill: "123456789012" }],
  };
  globalThis.fetch = async (url, options) => {
    assert.match(String(url), /^https:\/\/staging-express\.delhivery\.com\//);
    assert.equal(
      new Headers(options?.headers).get("Authorization"),
      "Token fixture-token",
    );
    if (String(url).includes("create.json")) {
      const form = new URLSearchParams(String(options?.body)),
        data = JSON.parse(form.get("data")!);
      assert.deepEqual(data.pickup_location, {
        name: "Registered fixture warehouse",
      });
      assert.equal(data.shipments[0].weight, "2500");
      assert.equal(data.shipments[0].shipment_length, 50);
      assert.equal(data.shipments[0].return_add, undefined);
    }
    return Response.json(response);
  };
  try {
    const provider = new DelhiveryShippingProvider(),
      request = {
        orderId: randomUUID(),
        orderNumber: "OVIA-FIXTURE",
        totalAmount: 100000,
        customer: {
          name: "Customer",
          email: "customer@example.test",
          phone: "9876543210",
          addressLine1: "Actual street",
          city: "Mumbai",
          state: "Maharashtra",
          postalCode: "400072",
          country: "India",
        },
        items: [{ name: "Bag", sku: "fixture", quantity: 1, price: 100000 }],
        weightGrams: 2500,
        dimensionsCm: { length: 50, width: 30, height: 20 },
      };
    assert.equal((await provider.createShipment(request)).awb, "123456789012");
    response = { success: true, packages: [{ status: "Success" }] };
    const missing = await provider.createShipment(request);
    assert.equal(missing.success, false);
    assert.equal(missing.uncertain, true);
    assert.equal(missing.awb, undefined);
    response = { success: true };
    assert.equal(
      (await provider.requestPickup({ pickupDate: "2026-10-05" })).success,
      false,
    );
    response = { pickup_id: 77 };
    assert.equal(
      (await provider.requestPickup({ pickupDate: "2026-10-05" })).pickupId,
      77,
    );
    response = {};
    assert.equal(
      (await provider.cancelShipment("123456789012")).success,
      false,
    );
    response = { status: "Success" };
    assert.equal((await provider.cancelShipment("123456789012")).success, true);
  } finally {
    globalThis.fetch = fetcher;
    process.env = previous;
  }
});

test("ambiguous shipment creation reconciles the existing AWB and never manifests a replacement", async () => {
  const f = fixture();
  f.setShipment({
    success: false,
    uncertain: true,
    courier: "Delhivery",
    status: "PROCESSING",
  });
  await f.service.execute(f.input(), "owner");
  const reconciled = await f.service.reconcile(f.order.id);
  assert.equal(reconciled.shipping?.awb, "123456789012");
  assert.equal(reconciled.logisticsOperations?.approve?.phase, "Pickup");
  await f.service.execute(f.input(), "owner");
  assert.equal(f.calls.create, 1);
  assert.equal(f.calls.pickup, 1);
  assert.equal(
    (await f.service.read(f.order.id)).logisticsOperations?.approve?.status,
    "Confirmed",
  );
});

test("late captured payment after cancellation is refunded without restoring stock twice", async () => {
  const f = fixture();
  await f.run((repo) =>
    repo.put("orders", {
      ...f.order,
      status: "pending",
      captureId: undefined,
      paidAt: undefined,
    }),
  );
  const cancelled = await f.service.execute(f.input("cancel"), "owner");
  assert.equal(f.calls.refund, 0);
  await f.run((repo) =>
    repo.put("orders", {
      ...cancelled,
      status: "refund_required",
      captureId: "pay_fixture1",
      paidAt: new Date().toISOString(),
    }),
  );
  const result = await f.service.execute(
    f.input("cancel"),
    "Verified payment webhook",
  );
  assert.equal(f.calls.refund, 1);
  assert.equal(result.status, "cancelled");
  assert.equal(result.refunds?.[0].status, "Processing");
  assert.equal(f.state.get("inventory")!.get("fixture-sku").available, 10);
});


test("reconciliation tracks the verified AWB and saves the courier delivery estimate", async () => {
  const f = fixture();
  await f.service.execute(f.input(), "owner");
  const original = f.service;
  const saved = await original.read(f.order.id);
  const updated = await original.reconcile(f.order.id);
  assert.equal(updated.shipping?.awb, saved.shipping?.awb);
  assert.equal(f.calls.trackingReference, saved.shipping?.awb);
  assert.equal(updated.shipping?.estimatedDelivery, "2026-10-15T00:00:00.000Z");
  assert.equal(f.calls.create, 1);
});
