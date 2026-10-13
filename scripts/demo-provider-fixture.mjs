// External provider transport for the isolated verification copy only.
// The actual application still validates signatures, ownership and persisted totals.
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
export function startDemoProviders(options = {}) {
  const orders = new Map(), payments = new Map(), refunds = new Map(), emails = [];
  const requests = [];
  const server = createServer(async (req, res) => {
    const chunks = []; for await (const chunk of req) chunks.push(chunk);
    let input = {}; try { input = JSON.parse(Buffer.concat(chunks).toString() || "{}"); } catch {}
    const url = new URL(req.url, "http://fixture.invalid");
    requests.push({ method: req.method, path: url.pathname });
    const send = (data, status = 200) => { res.writeHead(status, { "Content-Type": "application/json" }); res.end(JSON.stringify(data)); };
    if (url.pathname === "/control/reset-limits" && req.method === "POST" && options.resetLimits) { await options.resetLimits(); return send({ ok: true }); }
    if (url.pathname === "/emails" && req.method === "POST") { emails.push(input); return send({ id: `mail_${randomUUID()}` }); }
    if (url.pathname === "/control/capture" && req.method === "POST") {
      const order = orders.get(input.orderId); if (!order) return send({ error: "fixture order missing" }, 404);
      const payment = { id: `pay_${randomUUID().replaceAll("-", "")}`, order_id: order.id, amount: order.amount, currency: "INR", status: "captured", captured: true, amount_refunded: 0, method: "card", created_at: Math.floor(Date.now() / 1000) };
      payments.set(payment.id, payment); Object.assign(order, { status: "paid", amount_paid: order.amount, amount_due: 0 }); return send(payment);
    }
    if (url.pathname === "/control/ledger") return send({ emails, requests, orders: [...orders.values()], payments: [...payments.values()], refunds: [...refunds.values()] });
    if (url.pathname === "/v1/orders" && req.method === "POST") {
      const order = { ...input, id: `order_${randomUUID().replaceAll("-", "")}`, amount_paid: 0, amount_due: input.amount, status: "created" }; orders.set(order.id, order); return send(order);
    }
    const orderMatch = url.pathname.match(/^\/v1\/orders\/([^/]+)(\/payments)?$/);
    if (orderMatch) return send(orderMatch[2] ? { items: [...payments.values()].filter(p => p.order_id === orderMatch[1]) } : orders.get(orderMatch[1]) || { error: "not found" });
    const paymentMatch = url.pathname.match(/^\/v1\/payments\/([^/]+)(\/refunds|\/refund)?$/);
    if (paymentMatch) {
      const payment = payments.get(paymentMatch[1]); if (!payment) return send({ error: "not found" }, 404);
      if (paymentMatch[2] === "/refund" && req.method === "POST") {
        const refund = { ...input, id: `rfnd_${randomUUID().replaceAll("-", "")}`, payment_id: payment.id, currency: "INR", status: "processed" }; refunds.set(refund.id, refund); payment.amount_refunded += input.amount; if (payment.amount_refunded === payment.amount) payment.status = "refunded"; return send(refund);
      }
      if (paymentMatch[2] === "/refunds") return send({ items: [...refunds.values()].filter(r => r.payment_id === payment.id) });
      return send(payment);
    }
    const refundMatch = url.pathname.match(/^\/v1\/refunds\/([^/]+)$/); if (refundMatch) return send(refunds.get(refundMatch[1]) || { error: "not found" });
    return send({ error: `Unimplemented fixture endpoint ${req.method} ${url.pathname}` }, 500);
  });
  return new Promise(resolve => server.listen(0, "127.0.0.1", () => resolve({ server, origin: `http://127.0.0.1:${server.address().port}`, emails, requests })));
}
