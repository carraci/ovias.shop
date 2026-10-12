import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { products } from "../src/lib/catalog";
import { changeCart, readCart, expireOrders } from "../src/server/commerce";
import { transaction } from "../src/server/db";
import {
  checkoutQuote,
  paypalConversion,
} from "../src/server/checkout-pricing";
import {
  beginPayPalCheckout,
  captureCheckout,
  cancelCheckout,
  verifyCheckout,
  ownedCheckoutOrder,
  activeCheckout,
  processPayPalEvent,
  reconcilePayPal,
} from "../src/server/paypal-checkout";
import {
  verifyPayPalWebhook,
  requirePayPal,
  type PayPalOrder,
} from "../src/server/paypal";
import type { Order } from "../src/lib/types";
import { installMongoFixture } from "./helpers/mongo-fixture";
import { queueShippingNotification, deliverShippingNotification } from "../src/server/mail";

test("PayPal checkout uses trusted pricing, recoverable capture and atomic order effects", async (t) => {
  const cwd = process.cwd();
  const directory = await mkdtemp(path.join(tmpdir(), "ovia-paypal-test-"));
  const env = { ...process.env };
  const originalFetch = globalThis.fetch;
  const remote = new Map<string, PayPalOrder>();
  const creates = new Map<string, string>();
  const mailRequests = new Map<string, number>();
  const rejectedMail: string[] = [];
  let createCalls = 0,
    captureCalls = 0,
    breakCreate = false,
    breakCapture = false;
  let captureState = "COMPLETED",
    signature = "SUCCESS";
  const sku = products[0].variants[0].sku;
  const address = {
    name: "Fixture Customer",
    email: "fixture@example.test",
    phone: "9876543210",
    line1: "123 Fixture Road",
    city: "Mumbai",
    region: "Maharashtra",
    postalCode: "400001",
    country: "IN" as const,
  };
  const json = (value: unknown) => Response.json(value);
  process.chdir(directory);
  const database = installMongoFixture();
  Object.assign(process.env, {
    ALLOW_DEMO_CHECKOUT: "true",
    PAYPAL_ENV: "sandbox",
    PAYPAL_CLIENT_ID: "fixture-client",
    PAYPAL_CLIENT_SECRET: "fixture-secret",
    PAYPAL_WEBHOOK_ID: "fixture-webhook",
    PAYPAL_CURRENCY: "USD",
    PAYPAL_INR_PER_UNIT: "80",
    CHECKOUT_TAX_BPS: "1800",
    CHECKOUT_TAX_INCLUSIVE: "false",
    CHECKOUT_EXPRESS_ENABLED: "true",
    CHECKOUT_EXPRESS_SHIPPING_PAISE: "49900",
    EMAIL_API_KEY: "test-only-provider-key",
    EMAIL_FROM: "OVIA <fixture@example.test>",
    STORE_OWNER_EMAIL: "owner@example.test",
    DELIVERY_PERSONNEL_EMAIL: "dispatch@example.test",
    APP_ORIGIN: "http://localhost:3000",
  });
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    const headers = new Headers(init?.headers);
    if (url.endsWith("/oauth2/token")) {
      assert.match(headers.get("Authorization") || "", /^Basic /);
      return json({ access_token: "fixture-token" });
    }
    if (url === "https://api.resend.com/emails") {
      const key = headers.get("Idempotency-Key") || "";
      const notification = key.match(
        /^(order-confirmation|owner-order-confirmation|shipping-shipment_created|owner-shipping-shipment_created|rider-dispatch-shipment_created)-([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/,
      );
      if (!notification) rejectedMail.push(key);
      assert.ok(notification, `Unexpected notification type: ${key}`);
      const payload = JSON.parse(String(init?.body));
      const expectedRecipient = notification[1].startsWith("owner-")
        ? "owner@example.test"
        : notification[1].startsWith("rider-")
          ? "dispatch@example.test"
          : address.email;
      assert.deepEqual(payload.to, [expectedRecipient]);
      assert.equal(typeof payload.text, "string");
      assert.ok(payload.text.includes("OVIA"));
      mailRequests.set(key, (mailRequests.get(key) || 0) + 1);
      return json({ id: "fixture-email" });
    }
    assert.match(url, /^https:\/\/api-m.sandbox.paypal.com\//);
    assert.equal(headers.get("Authorization"), "Bearer fixture-token");
    if (url.endsWith("verify-webhook-signature"))
      return json({ verification_status: signature });
    if (url.endsWith("/v2/checkout/orders")) {
      createCalls++;
      const key = headers.get("PayPal-Request-Id")!;
      const body = JSON.parse(String(init?.body));
      let id = creates.get(key);
      if (!id) {
        id = `fixture-${remote.size + 1}`;
        creates.set(key, id);
        remote.set(id, {
          id,
          status: "CREATED",
          purchase_units: body.purchase_units,
          links: [
            {
              rel: "payer-action",
              href: `https://www.sandbox.paypal.com/checkoutnow?token=${id}`,
            },
          ],
        });
      }
      if (breakCreate) {
        breakCreate = false;
        throw new Error("fixture connection lost after create");
      }
      return json(remote.get(id));
    }
    const match = url.match(/\/v2\/checkout\/orders\/([^/]+)(\/capture)?$/);
    assert.ok(match);
    const order = remote.get(match[1]);
    assert.ok(order);
    if (match[2]) {
      captureCalls++;
      assert.match(headers.get("PayPal-Request-Id") || "", /^capture-/);
      order.status = captureState === "COMPLETED" ? "COMPLETED" : "APPROVED";
      order.purchase_units![0].payments = {
        captures: [
          {
            id: `capture-${order.id}`,
            status: captureState,
            final_capture: true,
            amount: order.purchase_units![0].amount!,
          },
        ],
      };
      if (breakCapture) {
        breakCapture = false;
        throw new Error("fixture response lost after capture");
      }
      // Minimal capture representation: implementation must GET the authoritative order.
      return json({ id: order.id, status: order.status });
    }
    return json(order);
  };
  async function begin(
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
    };
    return {
      quote,
      input,
      value: await beginPayPalCheckout(owner, undefined, input),
    };
  }
  const stock = () =>
    transaction((repo) =>
      repo.get<{ id: string; available: number }>("inventory", sku),
    );
  try {
    await t.test(
      "pricing combines catalog, shipping, promo and tax with explicit conversion",
      async () => {
        await transaction((repo) =>
          repo.put("checkoutPromos", {
            id: "fixture-promo",
            code: "FIXTURE10",
            active: true,
            type: "percent",
            value: 1000,
          }),
        );
        await changeCart("pricing", sku, 1, "add");
        const q = await checkoutQuote("pricing", {
          shippingMethod: "express",
          promoCode: "FIXTURE10",
        });
        assert.equal(q.discount, Math.floor(q.subtotal / 10));
        assert.equal(q.shipping, 49900);
        assert.equal(
          q.tax,
          Math.round((q.subtotal - q.discount + q.shipping) * 0.18),
        );
        assert.equal(q.total, q.subtotal - q.discount + q.shipping + q.tax);
        assert.equal(q.payment?.amount, Math.round(q.total / 80));
        await assert.rejects(
          checkoutQuote("pricing", {
            shippingMethod: "standard",
            promoCode: "FAKE",
          }),
          /does not exist/,
        );
        const rate = process.env.PAYPAL_INR_PER_UNIT;
        delete process.env.PAYPAL_INR_PER_UNIT;
        assert.equal(paypalConversion(10000), undefined);
        process.env.PAYPAL_INR_PER_UNIT = rate;
        process.env.CHECKOUT_TAX_INCLUSIVE = "true";
        const inclusive = await checkoutQuote("pricing", {
          shippingMethod: "standard",
        });
        assert.equal(inclusive.total, inclusive.subtotal + inclusive.shipping);
        assert.equal(
          inclusive.tax,
          Math.round((inclusive.total * 1800) / 11800),
        );
        process.env.CHECKOUT_TAX_INCLUSIVE = "false";
      },
    );
    await t.test(
      "stale quote and ownership tampering fail before payment",
      async () => {
        await changeCart("tamper", sku, 1, "add");
        const q = await checkoutQuote("tamper", { shippingMethod: "standard" });
        await changeCart("tamper", sku, 1, "add");
        const before = createCalls;
        await assert.rejects(
          beginPayPalCheckout("tamper", undefined, {
            address,
            quoteId: q.id,
            shippingMethod: "standard",
            idempotencyKey: randomUUID(),
          }),
          /pricing changed/,
        );
        assert.equal(createCalls, before);
        const flow = await begin("owner");
        await assert.rejects(
          ownedCheckoutOrder("stranger", flow.value.id),
          /not found/,
        );
        await cancelCheckout("owner", flow.value.id);
      },
    );
    await t.test(
      "lost create response retries the identical reserved order",
      async () => {
        await changeCart("create-retry", sku, 1, "add");
        const q = await checkoutQuote("create-retry", {
          shippingMethod: "standard",
        });
        const input = {
          address,
          quoteId: q.id,
          shippingMethod: "standard" as const,
          idempotencyKey: randomUUID(),
        };
        const before = (await stock())!.available;
        breakCreate = true;
        await assert.rejects(
          beginPayPalCheckout("create-retry", undefined, input),
          /confirm payment status/,
        );
        const active = await activeCheckout("create-retry");
        assert.ok(active);
        assert.equal(active.approvalUrl, undefined);
        const retry = await beginPayPalCheckout("create-retry", undefined, {
          ...input,
          idempotencyKey: randomUUID(),
        });
        assert.equal(retry.id, active.id);
        assert.equal((await stock())!.available, before - 1);
        await cancelCheckout("create-retry", retry.id);
        assert.equal((await stock())!.available, before);
      },
    );
    await t.test(
      "approved capture survives response loss and duplicate callback without duplicate effects",
      async () => {
        const flow = await begin("paid");
        const order = await ownedCheckoutOrder("paid", flow.value.id);
        remote.get(order.providerId!)!.status = "APPROVED";
        const captures = captureCalls;
        const customerMail = `order-confirmation-${order.id}`;
        const ownerMail = `owner-order-confirmation-${order.id}`;
        assert.equal(mailRequests.get(customerMail) || 0, 0);
        assert.equal(mailRequests.get(ownerMail) || 0, 0);
        breakCapture = true;
        const paid = await captureCheckout("paid", order.id);
        assert.equal(paid.status, "paid");
        assert.equal(captureCalls, captures + 1);
        assert.equal(mailRequests.get(customerMail), 1);
        assert.equal(mailRequests.get(ownerMail), 1);
        assert.equal((await readCart("paid")).lines.length, 0);
        const again = await captureCheckout("paid", order.id);
        assert.equal(again.status, "paid");
        assert.equal(captureCalls, captures + 1);
        assert.equal(mailRequests.get(customerMail), 1);
        assert.equal(mailRequests.get(ownerMail), 1);
        const event = {
          id: "fixture-event",
          event_type: "PAYMENT.CAPTURE.COMPLETED",
          resource: {
            supplementary_data: { related_ids: { order_id: order.providerId } },
          },
        };
        await processPayPalEvent(event);
        await processPayPalEvent(event);
        assert.equal(mailRequests.get(customerMail), 1);
        assert.equal(mailRequests.get(ownerMail), 1);
        const outbox = await transaction((repo) =>
          repo.find<{ id: string; status: string }>("outbox"),
        );
        assert.equal(
          outbox.filter((m) => m.id === `order-confirmation-${order.id}`)
            .length,
          1,
        );
        assert.equal(
          outbox.find((m) => m.id === `order-confirmation-${order.id}`)?.status,
          "sent",
        );
        assert.equal(outbox.filter((mail) => mail.id === ownerMail).length, 1);
        assert.equal(
          outbox.find((mail) => mail.id === ownerMail)?.status,
          "sent",
        );
      },
    );
    await t.test(
      "unapproved and altered payments cannot confirm an order",
      async () => {
        const flow = await begin("bad-payment");
        const order = await ownedCheckoutOrder("bad-payment", flow.value.id);
        await assert.rejects(
          captureCheckout("bad-payment", order.id),
          /Approve/,
        );
        const wrong = structuredClone(remote.get(order.providerId!)!);
        wrong.purchase_units![0].amount!.value = "0.01";
        await assert.rejects(
          reconcilePayPal(order, wrong),
          /could not be verified/,
        );
        await cancelCheckout("bad-payment", order.id);
      },
    );
    await t.test(
      "cancellation and duplicate cancellation release inventory once",
      async () => {
        const flow = await begin("cancel");
        const reserved = (await stock())!.available;
        assert.equal(
          (await cancelCheckout("cancel", flow.value.id)).status,
          "cancelled",
        );
        await cancelCheckout("cancel", flow.value.id);
        assert.equal((await stock())!.available, reserved + 1);
        assert.equal((await readCart("cancel")).lines.length, 1);
        assert.equal(await activeCheckout("cancel"), null);
      },
    );
    await t.test(
      "pending capture stays reserved until verified completion",
      async () => {
        const flow = await begin("pending");
        const order = await ownedCheckoutOrder("pending", flow.value.id);
        remote.get(order.providerId!)!.status = "APPROVED";
        captureState = "PENDING";
        const reserved = (await stock())!.available;
        assert.equal(
          (await captureCheckout("pending", order.id)).status,
          "payment_pending",
        );
        assert.equal(
          (await cancelCheckout("pending", order.id)).status,
          "payment_pending",
        );
        assert.equal((await stock())!.available, reserved);
        const r = remote.get(order.providerId!)!;
        r.status = "COMPLETED";
        r.purchase_units![0].payments!.captures![0].status = "COMPLETED";
        assert.equal(
          (await verifyCheckout("pending", order.id)).status,
          "paid",
        );
        captureState = "COMPLETED";
      },
    );
    await t.test(
      "declined capture closes the attempt and releases stock only once",
      async () => {
        const flow = await begin("decline");
        const order = await ownedCheckoutOrder("decline", flow.value.id);
        remote.get(order.providerId!)!.status = "APPROVED";
        captureState = "DENIED";
        const reserved = (await stock())!.available;
        assert.equal(
          (await captureCheckout("decline", order.id)).status,
          "payment_failed",
        );
        await verifyCheckout("decline", order.id);
        assert.equal((await stock())!.available, reserved + 1);
        assert.equal(await activeCheckout("decline"), null);
        captureState = "COMPLETED";
      },
    );
    await t.test(
      "expired reservation cannot capture; late payment requires merchant review",
      async () => {
        const flow = await begin("expired");
        const order = await ownedCheckoutOrder("expired", flow.value.id);
        await transaction((repo) =>
          repo.put("orders", {
            ...order,
            expiresAt: new Date(0).toISOString(),
          }),
        );
        await expireOrders();
        const released = (await stock())!.available;
        const r = remote.get(order.providerId!)!;
        r.status = "APPROVED";
        await assert.rejects(
          captureCheckout("expired", order.id),
          /expired or was cancelled/,
        );
        r.status = "COMPLETED";
        r.purchase_units![0].payments = {
          captures: [
            {
              id: "late-capture",
              status: "COMPLETED",
              final_capture: true,
              amount: r.purchase_units![0].amount!,
            },
          ],
        };
        assert.equal(
          (await verifyCheckout("expired", order.id)).status,
          "refund_required",
        );
        assert.equal((await stock())!.available, released);
        assert.equal((await readCart("expired")).lines.length, 1);
      },
    );
    await t.test(
      "webhook verification rejects missing, forged and untrusted signatures",
      async () => {
        await assert.rejects(
          verifyPayPalWebhook(new Headers(), { id: "fake" }),
          /Invalid webhook signature/,
        );
        const h = new Headers({
          "paypal-auth-algo": "SHA256withRSA",
          "paypal-cert-url":
            "https://api.sandbox.paypal.com/v1/notifications/certs/fixture",
          "paypal-transmission-id": "fixture",
          "paypal-transmission-sig": "fixture-signature",
          "paypal-transmission-time": new Date().toISOString(),
        });
        signature = "FAILURE";
        await assert.rejects(
          verifyPayPalWebhook(h, { id: "fake" }),
          /Invalid webhook signature/,
        );
        signature = "SUCCESS";
        await verifyPayPalWebhook(h, { id: "fixture" });
        h.set("paypal-cert-url", "https://attacker.example/cert");
        await assert.rejects(
          verifyPayPalWebhook(h, { id: "fake" }),
          /Invalid webhook certificate/,
        );
      },
    );
    await t.test(
      "verified refunded capture moves a paid order to merchant review without restocking",
      async () => {
        const flow = await begin("refunded");
        const order = await ownedCheckoutOrder("refunded", flow.value.id);
        const r = remote.get(order.providerId!)!;
        r.status = "APPROVED";
        await captureCheckout("refunded", order.id);
        const reserved = (await stock())!.available;
        r.purchase_units![0].payments!.captures![0].status = "REFUNDED";
        await processPayPalEvent({
          id: "fixture-refund-event",
          event_type: "PAYMENT.CAPTURE.REFUNDED",
          resource: {
            supplementary_data: { related_ids: { order_id: order.providerId } },
          },
        });
        assert.equal(
          (await ownedCheckoutOrder("refunded", order.id)).status,
          "refund_required",
        );
        assert.equal((await stock())!.available, reserved);
      },
    );
    await t.test(
      "production blocks local persistence and live payment switches",
      () => {
        Object.assign(process.env, { NODE_ENV: "production" });
        const fixtureUri = process.env.MONGODB_URI;
        delete process.env.MONGODB_URI;
        assert.throws(requirePayPal, /durable MongoDB/);
        process.env.MONGODB_URI = fixtureUri;
        Object.assign(process.env, { NODE_ENV: env.NODE_ENV });
        process.env.PAYPAL_ENV = "live";
        assert.throws(requirePayPal, /Live payments are disabled/);
        process.env.PAYPAL_ENV = "sandbox";
      },
    );
    await t.test(
      "known owner and shipping notifications deliver once and unknown mail is rejected",
      async () => {
        const order = await transaction(async repo => (await repo.find<Order>("orders", { owner: "paid" }))[0]);
        assert.ok(order);
        const shipment = { ...order, shipping: { awb: "TEST-AWB", courier: "Fixture Courier", status: "SHIPMENT_CREATED" } } as Order;
        await transaction(repo => queueShippingNotification(repo, shipment, "SHIPMENT_CREATED", "TEST-AWB"));
        await deliverShippingNotification(order.id, "SHIPMENT_CREATED");
        await deliverShippingNotification(order.id, "SHIPMENT_CREATED");
        // Shipment notifications are delivered asynchronously by the existing shipping service.
        for (let attempt = 0; attempt < 30; attempt++) {
          const pending = await transaction((repo) =>
            repo.find<{ id: string; status: string }>("outbox", {
              status: "pending",
            }),
          );
          if (!pending.length) break;
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
        assert.deepEqual(rejectedMail, []);
        const outbox = await transaction((repo) =>
          repo.find<{ id: string; status: string }>("outbox"),
        );
        assert.ok(
          outbox.some((mail) =>
            mail.id.startsWith("shipping-shipment_created-"),
          ),
        );
        for (const mail of outbox) {
          assert.equal(
            mail.status,
            "sent",
            `Notification was not delivered: ${mail.id}`,
          );
          assert.equal(
            mailRequests.get(mail.id),
            1,
            `Notification delivery repeated or missing: ${mail.id}`,
          );
        }
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
