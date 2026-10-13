"use client";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { Check, ShieldCheck } from "lucide-react";
import { request } from "@/components/store-provider";
import { money } from "@/lib/catalog-helpers";
import type { Order } from "@/lib/types";
import styles from "./confirmation.module.css";
export default function Confirmation({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    let polls = 0;
    async function load() {
      try {
        let value = await request<Order>(`orders/${id}`);
        if (
          ["paypal", "razorpay"].includes(value.provider) &&
          ["pending", "payment_pending"].includes(value.status)
        ) {
          await request(
            value.provider === "razorpay"
              ? `payments/razorpay/sessions/${id}`
              : `checkout/session/${id}`,
          );
          value = await request<Order>(`orders/${id}`);
        }
        if (!cancelled) {
          setOrder(value);
          setError("");
          if (
            ["pending", "payment_pending"].includes(value.status) &&
            polls++ < 12
          )
            timer = setTimeout(load, 5000);
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    }
    void load();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [id, retry]);
  const paid = order?.status === "paid";
  const demo = order?.status === "demo";
  const pending =
    !!order && ["pending", "payment_pending"].includes(order.status);
  return (
    <section className={styles.page} aria-label="Order confirmation">
      <Link href="/" className={styles.wordmark}>
        OVIA
      </Link>
      <div className={styles.content} aria-live="polite">
        {error ? (
          <>
            <h1>We couldn’t load your order.</h1>
            <p role="alert">{error}</p>
            <button onClick={() => setRetry((v) => v + 1)}>Try again</button>
          </>
        ) : !order ? (
          <h1>Loading your order…</h1>
        ) : (
          <>
            {paid && <Check size={28} aria-hidden="true" />}
            <p className={styles.label}>
              {paid
                ? "ORDER CONFIRMED"
                : demo
                  ? "DEMO ORDER SAVED"
                  : order.status.replaceAll("_", " ").toUpperCase()}
            </p>
            <h1>
              {paid
                ? "Thank you for choosing OVIA."
                : demo
                  ? "Demo order saved."
                  : pending
                  ? "Confirming your payment."
                  : order.status === "refund_required"
                    ? "Your payment needs attention."
                    : "This payment attempt is closed."}
            </h1>
            <p>
              {paid
                ? `${order.provider === "paypal" ? "Your PayPal payment" : order.provider === "razorpay" ? "Your Razorpay payment" : "Your payment"} is verified. Order updates will be sent to ${order.address.email}.`
                : demo
                  ? "This sample order was saved. No payment was taken."
                  : pending
                  ? "We’re waiting for verified payment status. You can safely return to this page. Please do not pay again."
                  : order.status === "refund_required"
                    ? "Payment requires merchant review. Contact support with the order reference below; do not pay again."
                    : "Your bag is available to review before starting a new checkout."}
            </p>
            <div className={styles.reference}>
              <span>Order reference</span>
              <strong>{order.orderNumber || order.id.slice(0, 8)}</strong>
            </div>
            <div className={styles.columns}>
              <section>
                <h2>Your selection</h2>
                {order.lines.map((line) => (
                  <div className={styles.line} key={line.sku}>
                    <div>
                      <strong>{line.name}</strong>
                      <p>
                        {line.color} · Qty {line.quantity}
                      </p>
                    </div>
                    <span>{money(line.price * line.quantity)}</span>
                  </div>
                ))}
                {order.checkoutQuote && (
                  <dl>
                    {[
                      ["Subtotal", money(order.checkoutQuote.subtotal)],
                      [
                        "Shipping",
                        order.checkoutQuote.shipping
                          ? money(order.checkoutQuote.shipping)
                          : "Complimentary",
                      ],
                      ["Discount", money(order.checkoutQuote.discount)],
                      [
                        order.checkoutQuote.taxIncluded
                          ? "Tax included"
                          : "Tax",
                        money(order.checkoutQuote.tax),
                      ],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <dt>{label}</dt>
                        <dd>{value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                <div className={styles.total}>
                  <span>Total</span>
                  <strong>{money(order.total)}</strong>
                </div>
                {order.provider === "paypal" &&
                  order.checkoutQuote?.payment && (
                    <p>
                      PayPal sandbox ·{" "}
                      {(order.checkoutQuote.payment.amount / 100).toFixed(2)}{" "}
                      {order.checkoutQuote.payment.currency}
                    </p>
                  )}
              </section>
              <section>
                <h2>Delivery details</h2>
                <strong>{order.address.name}</strong>
                <p>
                  {order.address.line1}
                  <br />
                  {order.address.line2 && (
                    <>
                      {order.address.line2}
                      <br />
                    </>
                  )}
                  {order.address.city}, {order.address.region}{" "}
                  {order.address.postalCode}
                  <br />
                  India
                </p>
                <p>
                  {order.checkoutQuote?.shippingLabel || "Standard Delivery"}
                  <br />
                  {order.checkoutQuote?.estimate || "3–7 business days"}
                </p>
                {pending && (
                  <button onClick={() => setRetry((v) => v + 1)}>
                    Check payment status
                  </button>
                )}
              </section>
            </div>
            {paid && (
              <p className={styles.note}>
                <ShieldCheck size={16} aria-hidden="true" />
                Verified server-side payment
              </p>
            )}
          </>
        )}
        <nav>
          <Link href="/bags">Continue exploring</Link>
          <Link href="/account/orders">Your orders</Link>
          {order && !paid && <Link href="/checkout">Return to checkout</Link>}
        </nav>
      </div>
    </section>
  );
}
