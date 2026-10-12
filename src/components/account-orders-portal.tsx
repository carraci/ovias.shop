"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Order } from "@/lib/types";
import { orderPaymentStatus } from "@/lib/order-document";
import { orderWorkflow } from "@/lib/order-workflow";
import { request } from "./store-provider";
import styles from "./account-orders-portal.module.css";
const money = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    amount / 100,
  );
function group(order: Order) {
  if (order.shipping?.status === "RETURNED") return "Returned";
  if (order.shipping?.status === "DELIVERED") return "Delivered";
  if (["cancelled", "expired", "payment_failed"].includes(order.status))
    return "Cancelled";
  return "Active";
}
export function AccountOrdersPortal() {
  const [orders, setOrders] = useState<Order[]>([]),
    [tab, setTab] = useState("Active"),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true,
      running = false;
    async function load() {
      if (running) return;
      running = true;
      try {
        const data = await request<Order[]>(
          "account/orders",
          "GET",
          undefined,
          AbortSignal.timeout(30000),
        );
        if (active) {
          setOrders(data);
          setError("");
        }
      } catch (cause) {
        if (active) setError((cause as Error).message);
      } finally {
        running = false;
        if (active) setLoading(false);
      }
    }
    void load();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 10000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);
  const visible = orders.filter(
    (order) => tab === "All Orders" || group(order) === tab,
  );
  return (
    <main className={styles.ordersPanel}>
      <header className={styles.brand}>
        <strong>OVIA</strong>
        <Link href="/account">My Account →</Link>
      </header>
      <nav className={styles.accountLinks} aria-label="Account">
        <span aria-current="page">My Orders</span>
        <Link href="/account/support">Help & Support</Link>
      </nav>
      <div className={styles.content}>
        <small>MY ACCOUNT / ORDERS</small>
        <h1>My Orders</h1>
        <p>View your purchases and manage each order from one place.</p>
        <div className={styles.filters} aria-label="Filter orders">
          {["All Orders", "Active", "Delivered", "Cancelled", "Returned"].map(
            (name) => (
              <button
                type="button"
                key={name}
                aria-pressed={tab === name}
                onClick={() => setTab(name)}
              >
                {name} (
                {name === "All Orders"
                  ? orders.length
                  : orders.filter((order) => group(order) === name).length}
                )
              </button>
            ),
          )}
        </div>
        {error && <p role="alert">{error}</p>}
        {loading ? (
          <p>Loading your orders…</p>
        ) : visible.length === 0 ? (
          <div className={styles.empty}>
            <p>
              {tab === "All Orders"
                ? "No orders found."
                : `You have no ${tab.toLowerCase()} orders.`}
            </p>
            <p>Your purchases will appear here once you place an order.</p>
            <Link href="/new">Continue Shopping →</Link>
          </div>
        ) : (
          visible.map((order) => {
            const state = orderWorkflow(order);
            return (
              <article className={styles.card} key={order.id}>
                <header className={styles.cardHeader}>
                  <div>
                    <h2>Order #{order.orderNumber || order.id}</h2>
                    <p>
                      Placed{" "}
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <span
                    className={`${styles.badge} ${group(order) === "Delivered" ? styles.delivered : group(order) === "Active" ? styles.active : ""}`}
                  >
                    {state.stage.replaceAll("_", " ").toLowerCase()}
                  </span>
                </header>
                {order.lines.map((line) => (
                  <div className={styles.product} key={line.sku}>
                    {line.image ? (
                      <img src={line.image} alt={line.name} />
                    ) : (
                      <div
                        className={styles.placeholder}
                        aria-label="Product image unavailable"
                      />
                    )}
                    <div>
                      <h3>{line.name}</h3>
                      <p>
                        {line.color} · Quantity {line.quantity}
                      </p>
                      <strong>{money(line.price * line.quantity)}</strong>
                    </div>
                  </div>
                ))}
                <div className={styles.payment}>
                  <strong>
                    {orderPaymentStatus(order) === "Payment received"
                      ? "Total Paid"
                      : "Order Total"}{" "}
                    {money(order.total)}
                  </strong>
                  <span>
                    {orderPaymentStatus(order)}
                    {order.paymentInfo?.method
                      ? ` · ${order.paymentInfo.method}`
                      : ""}
                  </span>
                </div>
                <Link
                  className={styles.details}
                  href={`/account/orders/${order.id}`}
                >
                  View order details →
                </Link>
                <div className={styles.footer}>
                  {order.shipping?.awb && (
                    <Link href={`/account/orders/${order.id}/tracking`}>
                      Track Order →
                    </Link>
                  )}
                  <Link href={`/account/orders/${order.id}?section=help`}>
                    Get Help →
                  </Link>
                </div>
              </article>
            );
          })
        )}
        <footer className={styles.footer}>
          <small>OVIA CUSTOMER ACCOUNT</small>
          <Link href="/account/support">Help & Support</Link>
        </footer>
      </div>
    </main>
  );
}
