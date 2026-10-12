import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomUUID, createHmac } from "node:crypto";
import { products } from "../src/lib/catalog";
import {
  changeCart,
  readCart,
  finalizePayment,
  expireOrders,
} from "../src/server/commerce";
import { transaction } from "../src/server/db";
import { checkoutQuote } from "../src/server/checkout-pricing";
import {
  razorpayConfiguration,
  razorpayCheckoutInput,
  razorpayVerificationInput,
  beginRazorpayCheckout,
  verifyRazorpayPayment,
  verifyRazorpayCheckout,
  activeRazorpayCheckout,
  ownedRazorpayOrder,
} from "../src/server/razorpay-checkout";
import type { Order } from "../src/lib/types";
import { installMongoFixture } from "./helpers/mongo-fixture";
import { NextRequest } from "next/server";
import { POST as webhookPOST } from "../src/app/api/webhooks/[provider]/route";
import {
  GET as paymentGET,
  POST as paymentPOST,
} from "../src/app/api/v1/payments/razorpay/[[...action]]/route";

test("Razorpay checkout verifies settlement and preserves safe retries without real provider requests", async (t) => {
  const cwd = process.cwd(),
    env = { ...process.env },
    originalFetch = globalThis.fetch;
  const directory = await mkdtemp(path.join(tmpdir(), "ovia-razorpay-test-"));
  const orders = new Map<string, any>(),
    payments = new Map<string, any>();
  let creates = 0,
    requests = 0,
    loseCreateResponse = false;
  const sku = products[0].variants[0].sku;
  const address = {
    name: "Test Customer",
    email: "fixture@example.test",
    phone: "9876543210",
    line1: "123 Fixture Road",
    city: "Mumbai",
    region: "Maharashtra",
    postalCode: "400001",
    country: "IN" as const,
  };
  process.chdir(directory);
  const database = installMongoFixture();
  delete process.env.EMAIL_API_KEY;
  delete process.env.EMAIL_FROM;
  Object.assign(process.env, {
    PAYMENT_PROVIDER: "razorpay",
    RAZORPAY_KEY_ID: "rzp_test_fixture1",
    RAZORPAY_KEY_SECRET: "fixture-signature-secret",
    ALLOW_DEMO_CHECKOUT: "true",
    CHECKOUT_TAX_BPS: "1800",
    CHECKOUT_TAX_INCLUSIVE: "false",
    CHECKOUT_EXPRESS_ENABLED: "true",
    CHECKOUT_EXPRESS_SHIPPING_PAISE: "49900",
    PAYPAL_INR_PER_UNIT: "80",
    STORE_OWNER_EMAIL: "owner@example.test",
  });
  globalThis.fetch = async (input, init) => {
    requests++;
    const url = String(input);
    assert.match(
      url,
      /^https:\/\/api\.razorpay\.com\/v1\//,
      "All provider traffic is intercepted by this fixture",
    );
    assert.equal(
      new Headers(init?.headers).get("Authorization"),
      `Basic ${Buffer.from("rzp_test_fixture1:fixture-signature-secret").toString("base64")}`,
    );
    if (url.endsWith("/orders") && init?.method === "POST") {
      creates++;
      const body = JSON.parse(String(init.body));
      const id = `order_fixture${creates}`;
      const value = {
        ...body,
        id,
        status: "created",
        amount_paid: 0,
        amount_due: body.amount,
      };
      orders.set(id, value);
      if (loseCreateResponse) {
        loseCreateResponse = false;
        throw new Error("Fixture response lost after provider created order");
      }
      return Response.json(value);
    }
    const orderMatch = url.match(
      /\/orders\/(order_[A-Za-z0-9]+)(\/payments)?$/,
    );
    if (orderMatch) {
      assert.ok(orders.has(orderMatch[1]));
      return Response.json(
        orderMatch[2]
          ? {
              items: [...payments.values()].filter(
                (payment) => payment.order_id === orderMatch[1],
              ),
            }
          : orders.get(orderMatch[1]),
      );
    }
    const paymentMatch = url.match(/\/payments\/(pay_[A-Za-z0-9]+)$/);
    assert.ok(paymentMatch && payments.has(paymentMatch[1]));
    return Response.json(payments.get(paymentMatch[1]));
  };
  async function prepare(
    owner: string,
    shippingMethod: "standard" | "express" = "standard",
    promoCode?: string,
  ) {
    await changeCart(owner, sku, 1, "add");
    const quote = await checkoutQuote(owner, { shippingMethod, promoCode });
    const input = {
      address,
      quoteId: quote.id,
      shippingMethod,
      promoCode,
      idempotencyKey: randomUUID(),
      market: "IN" as const,
    };
    return { quote, input };
  }
  async function begin(
    owner: string,
    shippingMethod: "standard" | "express" = "standard",
    promoCode?: string,
  ) {
    const prepared = await prepare(owner, shippingMethod, promoCode);
    return {
      ...prepared,
      session: await beginRazorpayCheckout(owner, undefined, prepared.input),
    };
  }
  function payment(orderId: string, status = "captured") {
    const remote = orders.get(orderId)!;
    const id = `pay_fixture${payments.size + 1}`;
    const value = {
      id,
      order_id: orderId,
      amount: remote.amount,
      currency: "INR",
      status,
      captured: status === "captured",
      amount_refunded: 0,
    };
    payments.set(id, value);
    if (status === "captured")
      Object.assign(remote, {
        status: "paid",
        amount_paid: remote.amount,
        amount_due: 0,
      });
    else if (status === "authorized")
      Object.assign(remote, { status: "attempted" });
    return value;
  }
  function verification(id: string, remote: any) {
    return {
      localOrderId: id,
      razorpay_order_id: remote.order_id,
      razorpay_payment_id: remote.id,
      razorpay_signature: createHmac("sha256", "fixture-signature-secret")
        .update(`${remote.order_id}|${remote.id}`)
        .digest("hex"),
    };
  }
  const stock = () =>
    transaction((repo) =>
      repo.get<{ id: string; available: number }>("inventory", sku),
    );
  try {
    await t.test(
      "configuration accepts live and test keys, hides secret and requires MongoDB for live",
      async () => {
        assert.equal(razorpayConfiguration().ready, true);
        assert.equal(razorpayConfiguration().mode, "test");
        assert.equal(
          JSON.stringify(razorpayConfiguration()).includes(
            "fixture-signature-secret",
          ),
          false,
        );
        process.env.RAZORPAY_KEY_ID = "rzp_live_fixture1";
        const fixtureUri = process.env.MONGODB_URI;
        delete process.env.MONGODB_URI;
        assert.equal(razorpayConfiguration().ready, false);
        await assert.rejects(
          transaction(async () => "unsafe"),
          /MongoDB is not configured/,
        );
        process.env.MONGODB_URI = "mongodb://configuration-only.invalid/ovia";
        assert.equal(razorpayConfiguration().ready, true);
        assert.equal(razorpayConfiguration().mode, "live");
        process.env.MONGODB_URI = fixtureUri;
        process.env.RAZORPAY_KEY_ID = "rzp_test_fixture1";
      },
    );
    await t.test(
      "request schemas reject frontend amounts, card details and invalid signatures",
      async () => {
        const prepared = await prepare("strict");
        assert.equal(
          razorpayCheckoutInput.safeParse({ ...prepared.input, amount: 1 })
            .success,
          false,
        );
        assert.equal(
          razorpayCheckoutInput.safeParse({
            ...prepared.input,
            paymentDetails: { cardNumber: "secret" },
          }).success,
          false,
        );
        assert.equal(
          razorpayVerificationInput.safeParse({
            localOrderId: randomUUID(),
            razorpay_order_id: "order_fixture1",
            razorpay_payment_id: "pay_fixture1",
            razorpay_signature: "invalid",
          }).success,
          false,
        );
        const badOrigin = await paymentPOST(
          new NextRequest(
            "http://localhost:3000/api/v1/payments/razorpay/sessions",
            {
              method: "POST",
              headers: { origin: "https://untrusted.example" },
              body: JSON.stringify(prepared.input),
            },
          ),
          { params: Promise.resolve({ action: ["sessions"] }) },
        );
        assert.equal(badOrigin.status, 403);
        const config = await paymentGET(
          new NextRequest(
            "http://localhost:3000/api/v1/payments/razorpay/config",
          ),
          { params: Promise.resolve({ action: ["config"] }) },
        );
        assert.equal(config.headers.get("cache-control"), "no-store");
        assert.equal(
          JSON.stringify(await config.json()).includes(
            "fixture-signature-secret",
          ),
          false,
        );
      },
    );
    await t.test(
      "catalog, promo, shipping and tax determine provider amount; retries reserve stock once",
      async () => {
        await transaction((repo) =>
          repo.put("checkoutPromos", {
            id: "promo",
            code: "FIXTURE10",
            active: true,
            type: "percent",
            value: 1000,
          }),
        );
        const beforeCreates = creates;
        const flow = await begin("pricing", "express", "FIXTURE10");
        assert.equal(flow.session.amount, flow.quote.total);
        assert.equal(flow.session.total, flow.quote.total);
        assert.equal(
          orders.get(flow.session.orderId!).amount,
          flow.quote.total,
        );
        assert.equal(flow.quote.shipping, 49900);
        assert.equal(flow.quote.discount, Math.floor(flow.quote.subtotal / 10));
        assert.equal(
          flow.quote.total,
          flow.quote.subtotal -
            flow.quote.discount +
            flow.quote.shipping +
            flow.quote.tax,
        );
        const reserved = (await stock())!.available;
        const retry = await beginRazorpayCheckout("pricing", undefined, {
          ...flow.input,
          idempotencyKey: randomUUID(),
        });
        assert.equal(retry.id, flow.session.id);
        assert.equal((await stock())!.available, reserved);
        assert.equal(creates, beforeCreates + 1);
        assert.equal(
          (await activeRazorpayCheckout("pricing"))!.id,
          flow.session.id,
        );
      },
    );
    await t.test(
      "changed quote and provider-conflicting session cannot create remote orders",
      async () => {
        const prepared = await prepare("stale");
        await changeCart("stale", sku, 1, "add");
        const before = creates;
        await assert.rejects(
          beginRazorpayCheckout("stale", undefined, prepared.input),
          /pricing changed/,
        );
        await transaction(async (repo) => {
          await repo.put("orders", {
            id: "paypal-existing",
            owner: "conflict",
            provider: "paypal",
            status: "pending",
            expiresAt: new Date(Date.now() + 60000).toISOString(),
          });
          await repo.put("checkoutSessions", {
            id: "conflict",
            orderId: "paypal-existing",
          });
        });
        const conflict = await prepare("conflict");
        await assert.rejects(
          beginRazorpayCheckout("conflict", undefined, conflict.input),
          /another provider/,
        );
        await assert.rejects(
          activeRazorpayCheckout("conflict"),
          /another provider/,
        );
        assert.equal(creates, before);
      },
    );
    await t.test(
      "ownership and forged signatures fail before provider verification",
      async () => {
        const flow = await begin("ownership"),
          remote = payment(flow.session.orderId!);
        const before = requests;
        await assert.rejects(
          ownedRazorpayOrder("stranger", flow.session.id),
          /not found/,
        );
        await assert.rejects(
          verifyRazorpayPayment(
            "stranger",
            verification(flow.session.id, remote),
          ),
          /not found/,
        );
        await assert.rejects(
          verifyRazorpayPayment("ownership", {
            ...verification(flow.session.id, remote),
            razorpay_signature: "0".repeat(64),
          }),
          /signature/,
        );
        assert.equal(requests, before);
        assert.equal(
          (await ownedRazorpayOrder("ownership", flow.session.id)).status,
          "pending",
        );
      },
    );
    await t.test(
      "authorised payment stays pending; captured provider payment settles once",
      async () => {
        const flow = await begin("settlement"),
          remote = payment(flow.session.orderId!, "authorized");
        const verified = await verifyRazorpayPayment(
          "settlement",
          verification(flow.session.id, remote),
        );
        assert.equal(verified.status, "payment_pending");
        assert.equal(
          (await ownedRazorpayOrder("settlement", flow.session.id)).status,
          "payment_pending",
        );
        assert.equal(
          (await verifyRazorpayCheckout("settlement", flow.session.id)).status,
          "payment_pending",
        );
        assert.equal((await readCart("settlement")).lines.length, 1);
        Object.assign(remote, { status: "captured", captured: true });
        Object.assign(orders.get(remote.order_id), {
          status: "paid",
          amount_paid: remote.amount,
          amount_due: 0,
        });
        const paid = await verifyRazorpayPayment(
          "settlement",
          verification(flow.session.id, remote),
        );
        assert.equal(paid.status, "paid");
        assert.equal(
          (await ownedRazorpayOrder("settlement", flow.session.id)).captureId,
          remote.id,
        );
        assert.equal((await readCart("settlement")).lines.length, 0);
        assert.equal(
          (await verifyRazorpayCheckout("settlement", flow.session.id)).status,
          "paid",
        );
        await finalizePayment(
          flow.session.id,
          remote.order_id,
          remote.amount,
          "fixture-new-webhook-event",
        );
        const confirmation = await transaction((repo) =>
          repo.find<{ id: string }>("outbox"),
        );
        assert.equal(
          confirmation.filter(
            (mail) => mail.id === `order-confirmation-${paid.id}`,
          ).length,
          1,
        );
        assert.equal(
          confirmation.filter(
            (mail) => mail.id === `owner-order-confirmation-${paid.id}`,
          ).length,
          1,
        );
        assert.equal(
          (await readCart("settlement")).version,
          flow.quote.cartVersion + 1,
        );
      },
    );
    await t.test(
      "provider amount, currency, order identity and capture flags cannot be tampered",
      async () => {
        const flow = await begin("tamper"),
          remote = payment(flow.session.orderId!);
        const input = verification(flow.session.id, remote);
        remote.amount = 1;
        await assert.rejects(
          verifyRazorpayPayment("tamper", input),
          /do not match/,
        );
        remote.amount = flow.session.amount;
        remote.currency = "USD";
        await assert.rejects(
          verifyRazorpayPayment("tamper", input),
          /do not match/,
        );
        remote.currency = "INR";
        remote.order_id = "order_other";
        await assert.rejects(
          verifyRazorpayPayment("tamper", input),
          /do not match/,
        );
        remote.order_id = flow.session.orderId!;
        remote.captured = false;
        await assert.rejects(
          verifyRazorpayPayment("tamper", input),
          /capture could not be verified/,
        );
        assert.equal((await readCart("tamper")).lines.length, 1);
      },
    );
    await t.test(
      "lost provider creation response keeps reconciliation lock and never repeats order creation",
      async () => {
        const prepared = await prepare("uncertain"),
          before = creates;
        loseCreateResponse = true;
        await assert.rejects(
          beginRazorpayCheckout("uncertain", undefined, prepared.input),
          /could not be confirmed/,
        );
        const session = await activeRazorpayCheckout("uncertain");
        assert.equal(session!.setupPending, true);
        assert.equal(session!.orderId, undefined);
        const reserved = (await stock())!.available;
        await assert.rejects(
          beginRazorpayCheckout("uncertain", undefined, {
            ...prepared.input,
            idempotencyKey: randomUUID(),
          }),
          /reconcile/,
        );
        assert.equal(creates, before + 1);
        assert.equal((await stock())!.available, reserved);
      },
    );
    await t.test(
      "webhook signatures use a distinct secret and require server-fetched captured settlement",
      async () => {
        const flow = await begin("webhook"),
          remote = payment(flow.session.orderId!);
        const payload = JSON.stringify({
          event: "order.paid",
          payload: { order: { entity: orders.get(remote.order_id) } },
        });
        const context = { params: Promise.resolve({ provider: "razorpay" }) };
        const makeRequest = (signature: string) =>
          new NextRequest("http://localhost:3000/api/webhooks/razorpay", {
            method: "POST",
            headers: { "x-razorpay-signature": signature },
            body: payload,
          });
        delete process.env.RAZORPAY_WEBHOOK_SECRET;
        assert.equal(
          (await webhookPOST(makeRequest("0".repeat(64)), context)).status,
          503,
        );
        process.env.RAZORPAY_WEBHOOK_SECRET = "fixture-webhook-secret";
        const before = requests;
        const apiKeySignature = createHmac("sha256", "fixture-signature-secret")
          .update(payload)
          .digest("hex");
        assert.equal(
          (await webhookPOST(makeRequest(apiKeySignature), context)).status,
          400,
        );
        assert.equal(requests, before);
        const signature = createHmac("sha256", "fixture-webhook-secret")
          .update(payload)
          .digest("hex");
        assert.equal(
          (await webhookPOST(makeRequest(`${signature}extra`), context)).status,
          400,
        );
        assert.equal(
          (await webhookPOST(makeRequest(signature), context)).status,
          200,
        );
        assert.equal(
          (await ownedRazorpayOrder("webhook", flow.session.id)).status,
          "paid",
        );
        assert.equal(
          (await webhookPOST(makeRequest(signature), context)).status,
          200,
        );
        assert.equal(
          (await readCart("webhook")).version,
          flow.quote.cartVersion + 1,
        );
      },
    );
    await t.test(
      "a new cart can start checkout after a paid order while old retry stays idempotent",
      async () => {
        const flow = await begin("repeat-customer"),
          remote = payment(flow.session.orderId!);
        await verifyRazorpayPayment(
          "repeat-customer",
          verification(flow.session.id, remote),
        );
        assert.equal(
          (await activeRazorpayCheckout("repeat-customer"))!.id,
          flow.session.id,
        );
        await changeCart("repeat-customer", sku, 1, "add");
        assert.equal(await activeRazorpayCheckout("repeat-customer"), null);
        const oldRetry = await beginRazorpayCheckout(
          "repeat-customer",
          undefined,
          flow.input,
        );
        assert.equal(oldRetry.id, flow.session.id);
        const quote = await checkoutQuote("repeat-customer", {
          shippingMethod: "standard",
        });
        const next = await beginRazorpayCheckout("repeat-customer", undefined, {
          ...flow.input,
          quoteId: quote.id,
          idempotencyKey: randomUUID(),
        });
        assert.notEqual(next.id, oldRetry.id);
        assert.equal(next.status, "pending");
      },
    );
    await t.test(
      "expired or cancelled late settlements require refund review without cart clearing or confirmation",
      async () => {
        for (const status of ["expired", "cancelled"] as const) {
          const flow = await begin(`late-${status}`),
            remote = payment(flow.session.orderId!);
          await transaction(async (repo) => {
            const current = await repo.get<Order>("orders", flow.session.id);
            await repo.put("orders", {
              ...current!,
              expiresAt: new Date(Date.now() - 10000).toISOString(),
            });
          });
          await expireOrders();
          const released = (await stock())!.available;
          if (status === "cancelled")
            await transaction(async (repo) => {
              const current = await repo.get<Order>("orders", flow.session.id);
              await repo.put("orders", { ...current!, status });
            });
          const value = await verifyRazorpayPayment(
            `late-${status}`,
            verification(flow.session.id, remote),
          );
          assert.equal(value.status, "refund_required");
          assert.equal((await stock())!.available, released);
          assert.equal((await readCart(`late-${status}`)).lines.length, 1);
          assert.equal(
            await transaction((repo) =>
              repo.get("outbox", `order-confirmation-${value.id}`),
            ),
            undefined,
          );
        }
      },
    );
    await t.test(
      "fixtures contain no real secret and every provider request was mocked",
      async () => {
        const state = JSON.stringify(database.snapshot());
        assert.equal(state.includes("fixture-signature-secret"), false);
        assert.ok(requests > 0);
      },
    );
  } finally {
    database.restore();
    globalThis.fetch = originalFetch;
    process.chdir(cwd);
    for (const key of Object.keys(process.env))
      if (!(key in env)) delete process.env[key];
    Object.assign(process.env, env);
  }
});
