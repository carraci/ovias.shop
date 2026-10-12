"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CreditCard, Smartphone, Landmark, Check } from "lucide-react";
import type { Order } from "@/lib/types";
import { orderPaymentStatus } from "@/lib/order-document";
import { request } from "./store-provider";
import styles from "./customer-payment-methods.module.css";
const options = [
  {
    id: "card",
    label: "Credit / debit card",
    icon: CreditCard,
    description: "Enter your card securely in Razorpay checkout.",
  },
  {
    id: "upi",
    label: "UPI",
    icon: Smartphone,
    description: "Pay through a supported UPI app at checkout.",
  },
  {
    id: "netbanking",
    label: "Netbanking",
    icon: Landmark,
    description: "Choose your bank in Razorpay checkout.",
  },
] as const;
const money = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    amount / 100,
  );
export function CustomerPaymentMethods() {
  const [orders, setOrders] = useState<Order[]>([]),
    [preferred, setPreferred] = useState(""),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [filter, setFilter] = useState("All"),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    Promise.all([
      request<Order[]>(
        "account/orders",
        "GET",
        undefined,
        AbortSignal.timeout(30000),
      ),
      request<{ method: string }>("account/payment-preference"),
    ])
      .then(([list, preference]) => {
        if (active) {
          setOrders(list);
          setPreferred(preference.method);
          setError("");
        }
      })
      .catch((cause) => {
        if (active)
          setError(
            cause instanceof Error ? cause.message : "Unable to load payments.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [retry]);
  const history = orders
    .flatMap((order) => [
      {
        id: order.id,
        kind: "Purchases",
        at: order.paidAt || order.createdAt,
        order,
        amount: order.total,
        status: orderPaymentStatus(order),
        reference: order.captureId || order.orderNumber || order.id,
      },
      ...(order.refunds || []).map((refund) => ({
        id: refund.id,
        kind: "Refunds",
        at: refund.updatedAt,
        order,
        amount: refund.amount,
        status:
          refund.status === "Refunded" ? "Provider processed" : refund.status,
        reference: refund.remoteId || refund.id,
      })),
    ])
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
    .filter((item) => filter === "All" || item.kind === filter);
  return (
    <main className={styles.page}>
      <p className={styles.eyebrow}>MY ACCOUNT / PAYMENT METHODS</p>
      <h1>
        Payment methods<span>.</span>
      </h1>
      {error && (
        <p role="alert">
          {error}{" "}
          <button onClick={() => setRetry((value) => value + 1)}>
            Try again
          </button>
        </p>
      )}
      {loading ? (
        <p role="status">Loading payment details…</p>
      ) : (
        <>
          <div className={styles.grid}>
            {options.map(({ id, label, icon: Icon, description }, index) => (
              <article className={styles.method} key={id}>
                <div
                  className={`${styles.visual} ${index === 1 ? styles.charcoal : index === 2 ? styles.light : ""} ${preferred === id ? styles.selected : ""}`}
                >
                  <div className={styles.cardTop}>
                    <h2>{label}</h2>
                    {preferred === id && <span>Preferred</span>}
                  </div>
                  <Icon size={30} strokeWidth={1.3} />
                  <p>Secure checkout</p>
                  <small>Razorpay</small>
                </div>
                <p className={styles.description}>{description}</p>
                <button
                  className={styles.pill}
                  disabled={busy || preferred === id}
                  onClick={async () => {
                    setBusy(true);
                    setError("");
                    try {
                      await request("account/payment-preference", "PATCH", {
                        method: id,
                      });
                      setPreferred(id);
                      setNotice(
                        "Payment preference saved. Select your payment method in checkout.",
                      );
                    } catch (cause) {
                      setError(
                        cause instanceof Error
                          ? cause.message
                          : "Unable to save preference.",
                      );
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  {preferred === id ? (
                    <>
                      <Check size={12} /> Preferred method
                    </>
                  ) : (
                    "Set preference"
                  )}
                </button>
              </article>
            ))}
          </div>
          <p className={styles.security}>
            Card details are entered in the payment provider’s checkout.
            Saved-card management is not connected to this account page.
          </p>
          {notice && <p role="status">{notice}</p>}
          <section className={styles.history}>
            <header>
              <h2>Payment history</h2>
              <nav aria-label="Payment history filters">
                {["All", "Purchases", "Refunds"].map((value) => (
                  <button
                    key={value}
                    aria-pressed={filter === value}
                    onClick={() => setFilter(value)}
                  >
                    {value}
                  </button>
                ))}
              </nav>
            </header>
            {history.length ? (
              history.map((item) => (
                <article
                  className={styles.transaction}
                  key={item.kind + item.id}
                >
                  <time>
                    {new Date(item.at).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </time>
                  <div>
                    <strong>
                      {item.kind === "Refunds"
                        ? "Order refund"
                        : item.order.lines
                            .map((line) => line.name)
                            .join(", ") || "Order payment"}
                    </strong>
                    <small>{item.reference}</small>
                  </div>
                  <div className={styles.amount}>
                    <span className={styles.badge}>{item.status}</span>
                    <strong>
                      {item.kind === "Refunds" ? "+" : ""}
                      {money(item.amount)}
                    </strong>
                    <Link
                      href={`/api/v1/orders/${item.order.id}/document`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Order summary
                    </Link>
                  </div>
                </article>
              ))
            ) : (
              <p>
                No {filter === "All" ? "payment records" : filter.toLowerCase()}{" "}
                found.
              </p>
            )}
          </section>
        </>
      )}
    </main>
  );
}
