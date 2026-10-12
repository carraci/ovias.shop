import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID, createHmac } from "node:crypto";
import { NextRequest } from "next/server";
import type { Order } from "../src/lib/types";
import type { Repository } from "../src/server/db";
import {
  makeRefundService,
  refundInput,
  refundGateway,
  issueRazorpayRefund,
} from "../src/server/razorpay-refunds";
import { verifyRazorpayWebhookSignature } from "../src/server/razorpay-webhook-signature";
import { POST as paymentPOST } from "../src/app/api/admin/payments/route";
import { POST as webhookPOST } from "../src/app/api/webhooks/[provider]/route";

function fixture() {
  const order = {
    id: randomUUID(),
    provider: "razorpay",
    providerId: "order_fixture1",
    captureId: "pay_fixture1",
    status: "paid",
    total: 100000,
    createdAt: new Date().toISOString(),
    address: { name: "Fixture Customer" },
  } as Order;
  const state = new Map<string, Map<string, any>>([
    ["orders", new Map([[order.id, structuredClone(order)]])],
  ]);
  let queue: Promise<unknown> = Promise.resolve();
  function run<T>(fn: (repo: Repository) => Promise<T>): Promise<T> {
    const work = queue.then(async () => {
      const staged = structuredClone(state);
      const collection = (name: string) => {
        if (!staged.has(name)) staged.set(name, new Map());
        return staged.get(name)!;
      };
      const repo: Repository = {
        get: async (c, id) => structuredClone(collection(c).get(id)),
        find: async (c, q = {}) =>
          [...collection(c).values()]
            .filter((value) =>
              Object.entries(q).every(([k, v]) => value[k] === v),
            )
            .map((v) => structuredClone(v)),
        put: async (c, v) => {
          collection(c).set(v.id, structuredClone(v));
        },
        remove: async (c, id) => {
          collection(c).delete(id);
        },
      };
      const value = await fn(repo);
      state.clear();
      for (const [k, v] of staged) state.set(k, v);
      return value;
    });
    queue = work.catch(() => {});
    return work;
  }
  const requests: { path: string; data: any; key?: string }[] = [];
  const effects = new Map<string, any>();
  let outcome = "pending",
    loseResponse = false,
    refunded = 0;
  async function gateway<T>(
    path: string,
    data?: unknown,
    key?: string,
  ): Promise<T> {
    requests.push({ path, data, key });
    if (data === undefined)
      return {
        id: "pay_fixture1",
        order_id: "order_fixture1",
        amount: order.total,
        currency: "INR",
        captured: true,
        status: "captured",
        amount_refunded: refunded,
      } as T;
    assert.ok(key);
    const input = data as any;
    let remote = effects.get(key!);
    if (!remote) {
      remote = {
        id: `rfnd_fixture${effects.size + 1}`,
        payment_id: "pay_fixture1",
        amount: input.amount,
        currency: "INR",
        status: outcome,
        notes: input.notes,
      };
      effects.set(key!, remote);
      if (outcome === "processed") refunded += input.amount;
    }
    if (loseResponse) {
      loseResponse = false;
      throw new Error("Response lost after provider accepted refund");
    }
    return structuredClone(remote);
  }
  const service = makeRefundService(run, gateway);
  const input = (amountPaise?: number) =>
    refundInput.parse({
      orderId: order.id,
      idempotencyKey: randomUUID(),
      confirmed: true,
      ...(amountPaise === undefined ? {} : { amountPaise }),
    });
  return {
    order,
    state,
    run,
    gateway,
    service,
    input,
    requests,
    effects,
    setOutcome: (value: string) => {
      outcome = value;
    },
    loseNext: () => {
      loseResponse = true;
    },
  };
}

test("refund schema requires confirmation and rejects bank/UPI details, decimals and bad amounts", () => {
  const f = fixture();
  assert.doesNotThrow(() => f.input());
  for (const extra of [
    { confirmed: false },
    { amountPaise: 0 },
    { amountPaise: 99 },
    { amountPaise: 100.5 },
    { amountPaise: NaN },
    { bankAccount: "123" },
    { upiId: "customer@upi" },
    { paymentId: "pay_other" },
  ])
    assert.throws(() => refundInput.parse({ ...f.input(), ...extra }));
});

test("captured full refund creates audited processing record and uses original payment only", async () => {
  const f = fixture(),
    input = f.input();
  const record = await f.service.initiate(input, "owner@example.test");
  assert.equal(record.amount, 100000);
  assert.equal(record.status, "Processing");
  assert.equal(record.remoteId, "rfnd_fixture1");
  const request = f.requests.find((r) => r.data)!;
  assert.equal(request.path, "payments/pay_fixture1/refund");
  assert.equal(request.key, input.idempotencyKey);
  assert.deepEqual(Object.keys(request.data).sort(), [
    "amount",
    "notes",
    "speed",
  ]);
  assert.equal(f.state.get("audit")!.size, 2);
});

test("duplicate clicks and concurrent requests reuse one refund identity", async () => {
  const f = fixture(),
    input = f.input();
  const results = await Promise.all([
    f.service.initiate(input, "owner"),
    f.service.initiate(input, "owner"),
  ]);
  assert.equal(f.effects.size, 1);
  assert.equal(results[0].id, results[1].id);
  await f.service.initiate(input, "owner");
  assert.equal(f.effects.size, 1);
  await assert.rejects(
    f.service.initiate(f.input(), "owner"),
    /already processing/,
  );
  await assert.rejects(
    f.service.initiate({ ...input, amountPaise: 20000 }, "owner"),
    /cannot be changed/,
  );
});

test("ambiguous network failure preserves Processing and retries with unchanged body/key", async () => {
  const f = fixture(),
    input = f.input(20000);
  f.loseNext();
  const first = await f.service.initiate(input, "owner");
  assert.equal(first.status, "Processing");
  assert.equal(first.remoteId, undefined);
  const next = await f.service.initiate(input, "owner");
  assert.equal(next.remoteId, "rfnd_fixture1");
  assert.equal(f.effects.size, 1);
  const creates = f.requests.filter((r) => r.data);
  assert.equal(creates.length, 2);
  assert.deepEqual(creates[0], creates[1]);
});

test("signed processed webhook resolves lost responses and duplicate/out-of-order events cannot regress", async () => {
  const f = fixture(),
    input = f.input();
  f.loseNext();
  await f.service.initiate(input, "owner");
  const remote = {
    ...f.effects.get(input.idempotencyKey),
    status: "processed",
  };
  const raw = JSON.stringify({
    event: "refund.processed",
    payload: { refund: { entity: remote } },
  });
  const signature = createHmac("sha256", "fixture-secret")
    .update(raw)
    .digest("hex");
  verifyRazorpayWebhookSignature(raw, signature, "fixture-secret");
  await f.service.webhook(JSON.parse(raw));
  await f.service.webhook(JSON.parse(raw));
  await f.service.webhook({
    event: "refund.created",
    payload: { refund: { entity: { ...remote, status: "pending" } } },
  });
  await f.service.webhook({
    event: "refund.failed",
    payload: { refund: { entity: { ...remote, status: "failed" } } },
  });
  const saved = f.state.get("orders")!.get(f.order.id).refunds[0];
  assert.equal(saved.status, "Refunded");
  assert.equal(saved.remoteId, remote.id);
  assert.equal(
    f.state.get("audit")!.has(`refund-${input.idempotencyKey}-Refunded`),
    true,
  );
});

test("failed webhook records failure and permits a new confirmed refund attempt", async () => {
  const f = fixture(),
    input = f.input();
  await f.service.initiate(input, "owner");
  const remote = { ...f.effects.get(input.idempotencyKey), status: "failed" };
  await f.service.webhook({
    event: "refund.failed",
    payload: { refund: { entity: remote } },
  });
  assert.equal(
    f.state.get("orders")!.get(f.order.id).refunds[0].status,
    "Failed",
  );
  await f.service.webhook({
    event: "refund.created",
    payload: { refund: { entity: { ...remote, status: "pending" } } },
  });
  assert.equal(
    f.state.get("orders")!.get(f.order.id).refunds[0].status,
    "Failed",
  );
  f.setOutcome("processed");
  const next = await f.service.initiate(f.input(), "owner");
  assert.equal(next.status, "Refunded");
  assert.notEqual(next.id, input.idempotencyKey);
});

test("partial refunds use paise and prevent refunding above the remaining balance", async () => {
  const f = fixture();
  f.setOutcome("processed");
  const first = await f.service.initiate(f.input(25000), "owner");
  assert.equal(first.amount, 25000);
  await assert.rejects(
    f.service.initiate(f.input(80000), "owner"),
    /refundable balance/,
  );
  const second = await f.service.initiate(f.input(), "owner");
  assert.equal(second.amount, 75000);
  await assert.rejects(
    f.service.initiate(f.input(), "owner"),
    /captured payment|refundable balance/,
  );
});

test("uncaptured, foreign-provider and unverified payments cannot reach the refund API", async () => {
  for (const patch of [
    { status: "pending" },
    { provider: "paypal" },
    { captureId: "legacy-payment" },
    { providerId: "legacy-order" },
  ]) {
    const f = fixture();
    Object.assign(f.state.get("orders")!.get(f.order.id), patch);
    await assert.rejects(
      f.service.initiate(f.input(), "owner"),
      /verified, captured/,
    );
    assert.equal(f.requests.length, 0);
  }
  const f = fixture();
  const service = makeRefundService(
    f.run,
    async <T>() =>
      ({
        id: "pay_other",
        order_id: "order_fixture1",
        amount: 100000,
        currency: "INR",
        captured: true,
        status: "captured",
      }) as T,
  );
  await assert.rejects(
    service.initiate(f.input(), "owner"),
    /has not verified/,
  );
  assert.equal(f.state.get("orders")!.get(f.order.id).refunds, undefined);
});

test("webhooks reject mismatched amount, currency and refund identity", async () => {
  const f = fixture(),
    input = f.input();
  await f.service.initiate(input, "owner");
  const remote = f.effects.get(input.idempotencyKey);
  for (const patch of [
    { amount: 1 },
    { currency: "USD" },
    { id: "rfnd_other" },
  ])
    await assert.rejects(
      f.service.webhook({
        event: "refund.processed",
        payload: {
          refund: { entity: { ...remote, ...patch, status: "processed" } },
        },
      }),
      /match|Invalid refund/,
    );
  assert.equal(
    f.state.get("orders")!.get(f.order.id).refunds[0].status,
    "Processing",
  );
});

test("provider transport uses Basic auth and Razorpay refund idempotency header without destination details", async () => {
  const previous = { ...process.env },
    fetcher = globalThis.fetch;
  Object.assign(process.env, {
    PAYMENT_PROVIDER: "razorpay",
    RAZORPAY_KEY_ID: "rzp_test_fixture1",
    RAZORPAY_KEY_SECRET: "fixture-api-secret",
  });
  globalThis.fetch = async (url, options) => {
    assert.equal(
      String(url),
      "https://api.razorpay.com/v1/payments/pay_fixture1/refund",
    );
    const headers = new Headers(options?.headers);
    assert.equal(
      headers.get("X-Refund-Idempotency"),
      "fixture-refund-idempotency-key",
    );
    assert.equal(
      headers.get("Authorization"),
      `Basic ${Buffer.from("rzp_test_fixture1:fixture-api-secret").toString("base64")}`,
    );
    assert.deepEqual(JSON.parse(String(options?.body)), {
      amount: 10000,
      speed: "normal",
    });
    return Response.json({ id: "rfnd_fixture1" });
  };
  try {
    await refundGateway(
      "payments/pay_fixture1/refund",
      { amount: 10000, speed: "normal" },
      "fixture-refund-idempotency-key",
    );
  } finally {
    globalThis.fetch = fetcher;
    process.env = previous;
  }
});

test("refund endpoint blocks anonymous callers; tampered webhook body is rejected before processing", async () => {
  const previous = { ...process.env },
    fetcher = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    throw new Error("No provider traffic allowed");
  };
  process.env.RAZORPAY_WEBHOOK_SECRET = "fixture-webhook-secret";
  try {
    const result = await paymentPOST(
      new NextRequest("http://localhost:3000/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fixture().input()),
      }),
    );
    assert.equal(result.status, 401);
    const raw = JSON.stringify({ event: "refund.processed", payload: {} });
    const signature = createHmac("sha256", "fixture-webhook-secret")
      .update(raw)
      .digest("hex");
    verifyRazorpayWebhookSignature(raw, signature, "fixture-webhook-secret");
    assert.throws(
      () =>
        verifyRazorpayWebhookSignature(
          raw + " ",
          signature,
          "fixture-webhook-secret",
        ),
      /Invalid signature/,
    );
    const response = await webhookPOST(
      new NextRequest("http://localhost:3000/api/webhooks/razorpay", {
        method: "POST",
        headers: { "x-razorpay-signature": signature },
        body: raw + " ",
      }),
      { params: Promise.resolve({ provider: "razorpay" }) },
    );
    assert.equal(response.status, 400);
    assert.equal(calls, 0);
  } finally {
    process.env = previous;
    globalThis.fetch = fetcher;
  }
});

test("missing webhook configuration blocks initiation before any customer payment is touched", async () => {
  const previous = { ...process.env };
  Object.assign(process.env, {
    PAYMENT_PROVIDER: "razorpay",
    RAZORPAY_KEY_ID: "rzp_test_fixture1",
    RAZORPAY_KEY_SECRET: "fixture-secret",
  });
  delete process.env.RAZORPAY_WEBHOOK_SECRET;
  try {
    await assert.rejects(
      issueRazorpayRefund(fixture().input(), "owner"),
      /webhook secret/,
    );
  } finally {
    process.env = previous;
  }
});

test("verification without captured attempts leaves the order untouched", async () => {
  const f = fixture();
  const service = makeRefundService(f.run, async <T>() => ({ items: [] }) as T);
  const before = structuredClone(f.state.get("orders")!.get(f.order.id));
  assert.equal(
    (await service.verifyPayment(f.order.id, "owner")).verified,
    false,
  );
  assert.deepEqual(f.state.get("orders")!.get(f.order.id), before);
  assert.equal(f.effects.size, 0);
});

test("verification imports captured payment and dashboard refund history without issuing money", async () => {
  const f = fixture();
  await f.run(async (repo) => {
    await repo.put("orders", {
      ...f.order,
      captureId: undefined,
      status: "expired",
    });
  });
  const payment = {
    id: "pay_fixture1",
    order_id: "order_fixture1",
    amount: 100000,
    currency: "INR",
    captured: true,
    status: "captured",
    method: "upi",
  };
  const remote = {
    id: "rfnd_dashboard1",
    payment_id: payment.id,
    amount: 25000,
    currency: "INR",
    status: "processed",
  };
  const service = makeRefundService(
    f.run,
    async <T>(path: string, data?: unknown) => {
      assert.equal(data, undefined);
      return { items: path.startsWith("orders/") ? [payment] : [remote] } as T;
    },
  );
  await service.verifyPayment(f.order.id, "owner");
  await service.verifyPayment(f.order.id, "owner");
  const order = f.state.get("orders")!.get(f.order.id);
  assert.equal(order.captureId, payment.id);
  assert.equal(order.status, "refund_required");
  assert.equal(order.paymentInfo.method, "upi");
  assert.equal(order.refunds.length, 1);
  assert.equal(order.refunds[0].status, "Refunded");
  assert.equal(order.refunds[0].amount, 25000);
  assert.equal(f.effects.size, 0);
});

test("dashboard webhook associates missing capture only with matching signed payment", async () => {
  const f = fixture();
  await f.run(async (repo) => {
    await repo.put("orders", { ...f.order, captureId: undefined });
  });
  const payment = {
    id: "pay_fixture1",
    order_id: "order_fixture1",
    amount: 100000,
    currency: "INR",
    captured: true,
    status: "captured",
  };
  const event = {
    event: "refund.processed",
    payload: {
      payment: { entity: payment },
      refund: {
        entity: {
          id: "rfnd_dashboard1",
          payment_id: payment.id,
          amount: 100000,
          currency: "INR",
          status: "processed",
        },
      },
    },
  };
  await assert.rejects(
    f.service.webhook({
      ...event,
      payload: {
        ...event.payload,
        payment: { entity: { ...payment, amount: 1 } },
      },
    }),
    /match/,
  );
  assert.equal(f.state.get("orders")!.get(f.order.id).captureId, undefined);
  await f.service.webhook(event);
  await f.service.webhook(event);
  const order = f.state.get("orders")!.get(f.order.id);
  assert.equal(order.captureId, payment.id);
  assert.equal(order.refunds.length, 1);
  assert.equal(order.refunds[0].status, "Refunded");
  assert.equal(f.effects.size, 0);
});

test("a completed partial refund cannot mark a cancellation's full refund requirement complete", async () => {
  const f = fixture(),
    input = f.input(25000);
  await f.service.initiate(input, "owner");
  await f.run(async (repo) => {
    const order = await repo.get<Order>("orders", f.order.id);
    await repo.put("orders", {
      ...order!,
      status: "cancelled",
      logisticsOperations: {
        cancel: {
          id: randomUUID(),
          action: "cancel",
          status: "Failed",
          phase: "Refund",
          refundKey: randomUUID(),
          updatedAt: new Date().toISOString(),
        },
      },
    });
  });
  const remote = f.effects.get(input.idempotencyKey);
  await f.service.webhook({
    event: "refund.processed",
    payload: { refund: { entity: { ...remote, status: "processed" } } },
  });
  const order = f.state.get("orders")!.get(f.order.id);
  assert.equal(order.refunds[0].status, "Refunded");
  assert.equal(order.logisticsOperations.cancel.status, "Failed");
  assert.equal(order.logisticsOperations.cancel.phase, "Refund");
});
