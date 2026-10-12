"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Order } from "@/lib/types";
import type { CareTicket } from "@/lib/care";
import { orderPaymentStatus } from "@/lib/order-document";
import { request, useStore } from "./store-provider";
import styles from "./customer-account-center.module.css";
import {
  LayoutDashboard,
  Package,
  RotateCcw,
  Wallet,
  Headphones,
  Bell,
  CircleUserRound,
} from "lucide-react";
import { orderWorkflow } from "@/lib/order-workflow";
import { RefundRequestForm } from "./refund-request-form";
import { MaterialReturnForm } from "./material-return-form";
import { ProductExchangeForm } from "./product-exchange-form";
import { AccountActivityFeed } from "./account-activity-feed";
type View = "overview" | "payments" | "refunds" | "returns" | "notifications";
const money = (value: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    value / 100,
  );
const date = (value: string) => new Date(value).toLocaleString("en-IN");
const titles: Record<View, string> = {
  overview: "Account overview",
  payments: "Payments",
  refunds: "Refunds",
  returns: "Returns & Exchanges",
  notifications: "Account activity",
};
export function CustomerAccountCenter({ view }: { view: View }) {
  const { user } = useStore();
  const [orders, setOrders] = useState<Order[]>([]),
    [tickets, setTickets] = useState<CareTicket[]>([]),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!user || view === "notifications") return;
    let active = true,
      running = false;
    async function load() {
      if (running) return;
      running = true;
      try {
        const [nextOrders, nextTickets] = await Promise.all([
          request<Order[]>(
            "account/orders",
            "GET",
            undefined,
            AbortSignal.timeout(30000),
          ),
          request<CareTicket[]>(
            "care/tickets",
            "GET",
            undefined,
            AbortSignal.timeout(30000),
          ),
        ]);
        if (active) {
          setOrders(nextOrders);
          setTickets(nextTickets);
          setError("");
        }
      } catch (cause) {
        if (active)
          setError(
            cause instanceof Error
              ? cause.message
              : "Unable to load your account.",
          );
      } finally {
        running = false;
        if (active) setLoading(false);
      }
    }
    void load();
    const timer = setInterval(() => {
      if (!document.hidden) void load();
    }, 10000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [user?.id, retry, view]);
  if (!user)
    return <Link href="/account/sign-in">Sign in to view your account</Link>;
  const refunds = orders.flatMap((order) =>
    (order.refunds || []).map((refund) => ({ order, refund })),
  );
  const returns = tickets.filter(
    (ticket) =>
      ticket.orderAction?.type === "return" ||
      (!ticket.orderAction && ticket.category === "Return"),
  );
  const open = (ticket: CareTicket) =>
    !["Resolved", "Closed"].includes(ticket.status);
  const stats = [
    {
      label: "Active orders",
      count: orders.filter(
        (order) =>
          !["cancelled", "expired", "payment_failed"].includes(order.status) &&
          !["DELIVERED", "RETURNED", "RTO"].includes(
            order.shipping?.status || "",
          ),
      ).length,
      href: "/account/orders/list",
    },
    {
      label: "Delivered orders",
      count: orders.filter((order) => order.shipping?.status === "DELIVERED")
        .length,
      href: "/account/orders/list",
    },
    {
      label: "Cancellation requests",
      count: tickets.filter(
        (ticket) => ticket.orderAction?.type === "cancellation" && open(ticket),
      ).length,
      href: "/account/support",
    },
    {
      label: "Returns & exchanges",
      count: returns.filter(open).length,
      href: "/account/returns",
    },
    {
      label: "Refunds in progress",
      count: refunds.filter(({ refund }) => refund.status === "Processing")
        .length,
      href: "/account/refunds",
    },
    {
      label: "Open support requests",
      count: tickets.filter(open).length,
      href: "/account/support",
    },
  ];
  const events = orders
    .flatMap((order) => [
      {
        id: order.id + "placed",
        at: order.createdAt,
        text: `Order ${order.orderNumber || order.id} placed`,
        href: `/account/orders/${order.id}`,
      },
      ...(order.paidAt
        ? [
            {
              id: order.id + "paid",
              at: order.paidAt,
              text: `Payment recorded · ${order.orderNumber || order.id}`,
              href: `/account/orders/${order.id}?section=payment`,
            },
          ]
        : []),
      ...(order.shipping?.events || [])
        .filter((event) => !event.isSimulated)
        .map((event, index) => ({
          id: order.id + index,
          at: event.timestamp,
          text: `${event.description} · ${order.orderNumber || order.id}`,
          href: `/account/orders/${order.id}`,
        })),
      ...(order.refunds || []).map((refund) => ({
        id: refund.id,
        at: refund.updatedAt,
        text: `Refund ${refund.status.toLowerCase()} · ${money(refund.amount)}`,
        href: "/account/refunds",
      })),
    ])
    .concat(
      tickets.map((ticket) => ({
        id: ticket.id,
        at: ticket.updatedAt,
        text: `${ticket.subject} · ${ticket.status}`,
        href: "/account/support",
      })),
    )
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
  if (view === "notifications") return <AccountActivityFeed />;
  return (
    <section
      className={`${styles.page} ${view === "overview" ? styles.overview : ""}`}
    >
      {view === "overview" && (
        <>
          <header className={styles.brand}>
            <Link href="/account">OVIA</Link>
            <div>
              <Link href="/account/notifications" aria-label="Account activity">
                <Bell size={15} />
              </Link>
              <Link href="/account/details" aria-label="Account profile">
                <CircleUserRound size={15} />
              </Link>
            </div>
          </header>
          <nav className={styles.navigation} aria-label="Account">
            <Link href="/account" aria-current="page">
              <LayoutDashboard size={15} />
              Overview
            </Link>
            <Link href="/account/orders/list">
              <Package size={15} />
              My Orders
            </Link>
            <Link href="/account/returns">
              <RotateCcw size={15} />
              Returns & Exchanges
            </Link>
            <Link href="/account/refunds">
              <Wallet size={15} />
              Refunds & Payments
            </Link>
            <Link href="/account/support">
              <Headphones size={15} />
              Help & Support
            </Link>
          </nav>
        </>
      )}
      <div className={styles.body}>
        <p className={styles.eyebrow}>MY ACCOUNT / {view.toUpperCase()}</p>
        <h1>{titles[view]}</h1>
        {error && (
          <p role="alert">
            {error}{" "}
            <button onClick={() => setRetry((value) => value + 1)}>
              Try again
            </button>
          </p>
        )}
        {loading ? (
          <p role="status">Loading your account…</p>
        ) : (
          <>
            {view === "overview" && (
              <>
                <div className={styles.grid}>
                  {[
                    stats[0],
                    stats[1],
                    { ...stats[4], label: "Refunds" },
                    { ...stats[5], label: "Support tickets" },
                  ].map((stat) => (
                    <Link
                      className={styles.card}
                      key={stat.label}
                      href={stat.href}
                    >
                      <span>{stat.label}</span>
                      <strong>{String(stat.count).padStart(2, "0")}</strong>
                      <span className={styles.arrow} aria-hidden="true">
                        ↗
                      </span>
                    </Link>
                  ))}
                </div>
                <h2 className={styles.recentTitle}>Recent order</h2>
                {orders.length ? (
                  (() => {
                    const recent = [...orders].sort(
                      (a, b) =>
                        Date.parse(b.createdAt) - Date.parse(a.createdAt),
                    )[0];
                    const canTrack = !!recent.shipping?.awb;
                    return (
                      <article className={styles.recent}>
                        <div className={styles.recentHeader}>
                          <strong>#{recent.orderNumber || recent.id}</strong>
                          <span className={styles.status}>
                            {orderWorkflow(recent)
                              .stage.replaceAll("_", " ")
                              .toLowerCase()}
                          </span>
                        </div>
                        <p>
                          {recent.lines.map((line) => line.name).join(", ")} ·{" "}
                          {money(recent.total)}
                        </p>
                        <Link
                          className={styles.primary}
                          href={`/account/orders/${recent.id}${canTrack ? "/tracking" : ""}`}
                        >
                          {canTrack ? "Track order" : "View order details"} →
                        </Link>
                      </article>
                    );
                  })()
                ) : (
                  <article className={styles.recent}>
                    <p>You have no orders yet.</p>
                    <Link href="/new">Continue shopping →</Link>
                  </article>
                )}
              </>
            )}
            {view === "payments" &&
              (orders.length ? (
                orders.map((order) => (
                  <article className={styles.card} key={order.id}>
                    <Link href={`/account/orders/${order.id}?section=payment`}>
                      Order #{order.orderNumber || order.id} →
                    </Link>
                    <strong>{money(order.total)}</strong>
                    <p>
                      {orderPaymentStatus(order)} ·{" "}
                      {order.paymentInfo?.method || order.provider}
                    </p>
                    <p>{date(order.paidAt || order.createdAt)}</p>
                    {order.captureId && (
                      <p>Payment reference: {order.captureId}</p>
                    )}
                    {(order.refunds || []).map((refund) => (
                      <p key={refund.id}>
                        Refund: {money(refund.amount)} · {refund.status}
                      </p>
                    ))}
                    <Link href="/account/support">Report a payment issue</Link>
                  </article>
                ))
              ) : (
                <p>No payments found.</p>
              ))}
            {view === "refunds" && (
              <RefundRequestForm orders={orders} onSaved={(ticket) => setTickets((current) => [ticket, ...current.filter((item) => item.id !== ticket.id)])} />
            )}
            {view === "returns" && (
              <>
              <MaterialReturnForm orders={orders} onSaved={(ticket) => setTickets((current) => [ticket, ...current.filter((item) => item.id !== ticket.id)])} />
              <ProductExchangeForm orders={orders} onSaved={(ticket) => setTickets((current) => [ticket, ...current.filter((item) => item.id !== ticket.id)])} />
              </>
            )}
          </>
        )}
      </div>
      {view === "overview" && (
        <footer className={styles.footer}>
          <small>OVIA CUSTOMER ACCOUNT</small>
          <Link href="/account/support">Help & Support</Link>
        </footer>
      )}
    </section>
  );
}
