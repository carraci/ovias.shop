"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useCallback, type FormEvent } from "react";
import { Package, RefreshCw, Truck } from "lucide-react";
import { money } from "@/lib/catalog-helpers";
import type { CareOrderAction, CareTicket } from "@/lib/care";
import type { Order } from "@/lib/types";
import { ProductPhoto } from "./product-photo";
import { request } from "./store-provider";
import styles from "./account-orders-returns.module.css";

type Action = CareOrderAction["type"];
type Filter = "all" | "shipping" | "cancellation" | "returns";
const filters: { value: Filter; label: string }[] = [
  { value: "all", label: "All orders" },
  { value: "shipping", label: "Shipping" },
  { value: "cancellation", label: "Cancellations" },
  { value: "returns", label: "Returns & refunds" },
];
const actionNames = { cancellation: "Cancellation", return: "Return", refund: "Refund" };
const categories = { cancellation: "Order issue", return: "Return", refund: "Refund" };
const activeStatuses = new Set<CareTicket["status"]>(["Open", "In Review", "Waiting for Customer"]);
const paymentLabels: Record<Order["status"], string> = {
  demo: "Order confirmed",
  pending: "Awaiting payment",
  payment_pending: "Payment verification pending",
  paid: "Payment received",
  expired: "Payment expired",
  cancelled: "Order cancelled",
  payment_failed: "Payment failed",
  refund_required: "Payment needs review",
};
const shippingLabels: Record<string, string> = {
  ORDER_CONFIRMED: "Order confirmed",
  PACKED: "Packed",
  SHIPMENT_CREATED: "Shipment created",
  PICKED_UP: "Picked up by courier",
  IN_TRANSIT: "In transit",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  DELIVERY_FAILED: "Delivery attempt failed",
  CANCELLED: "Shipment cancelled",
  RTO: "Returning to sender",
  RETURNED: "Returned to sender",
};

function canRequest(order: Order, type: Action) {
  if (["expired", "payment_failed"].includes(order.status)) return false;
  if (type === "cancellation") {
    if (order.status === "cancelled") return false;
    return ["paid", "demo", "pending", "payment_pending"].includes(order.status);
  }
  return ["paid", "refund_required", "demo"].includes(order.status);
}

function requestType(ticket: CareTicket): Action | undefined {
  return ticket.orderAction?.type || (ticket.category === "Return" ? "return" : ticket.category === "Refund" ? "refund" : undefined);
}

function date(value: string) {
  return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function ShippingSummary({ order }: { order: Order }) {
  const shipping = order.shipping;
  if (!shipping) {
    const message = ["paid", "demo"].includes(order.status)
      ? "Shipping updates will appear when your order is prepared for delivery."
      : order.status === "refund_required"
        ? "Payment is under review. Shipping has not been confirmed."
        : order.status === "cancelled"
          ? "This order is cancelled."
          : ["expired", "payment_failed"].includes(order.status)
            ? "Payment was not completed. No shipment is confirmed."
            : "Shipping starts after your payment is confirmed.";
    return <p className={styles.muted}>{message}</p>;
  }
  const latest = shipping.events?.at(-1);
  return (
    <div className={styles.shipping}>
      <p><Truck size={17} aria-hidden="true" /> <strong>{shippingLabels[shipping.status] || shipping.status}</strong></p>
      {(shipping.courier || shipping.awb) && (
        <p className={styles.muted}>
          {shipping.courier || "Delhivery"}
          {shipping.courier && shipping.awb ? " · " : ""}
          {shipping.awb ? `Tracking ${shipping.awb}` : ""}
        </p>
      )}
      {shipping.estimatedDelivery && <p className={styles.muted}>Estimated delivery: {date(shipping.estimatedDelivery)}</p>}
      {latest && <p className={styles.muted}>{latest.description}{latest.location ? ` · ${latest.location}` : ""} · {date(latest.timestamp)}</p>}
      {shipping.lastUpdatedAt && <p className={styles.small}>Last update {date(shipping.lastUpdatedAt)}</p>}
    </div>
  );
}

function RequestHistory({ tickets, order }: { tickets: CareTicket[]; order: Order }) {
  if (!tickets.length) return null;
  return (
    <section className={styles.requests} aria-label="Order requests">
      <h4>Your requests</h4>
      {tickets.map((ticket) => {
        const type = requestType(ticket);
        const reply = ticket.messages.filter((message) => message.author === "support").at(-1);
        return (
          <div key={ticket.id} className={styles.requestRow}>
            <div className={styles.requestHeading}>
              <strong>{type ? `${actionNames[type]} request` : ticket.subject}</strong>
              <span className={styles.badge}>{ticket.status}</span>
            </div>
            <p className={styles.small}>Reference {ticket.id.slice(0, 8)} · Updated {date(ticket.updatedAt)}</p>
            {ticket.orderAction?.items?.map((item) => <p key={item.sku} className={styles.muted}>{order.lines.find((line) => line.sku === item.sku)?.name || item.sku} · Qty {item.quantity}</p>)}
            {reply && <p className={styles.reply}>OVIA support: {reply.text}</p>}
            <Link className={styles.textLink} href={`/contact?ticket=${encodeURIComponent(ticket.id)}`}>View request</Link>
          </div>
        );
      })}
    </section>
  );
}

function RequestForm({ order, type, close, saved }: {
  order: Order; type: Action; close: () => void; saved: (ticket: CareTicket) => void;
}) {
  const [product, setProduct] = useState("all");
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const key = useRef<string | null>(null);
  const submitting = useRef(false);
  const selectedLine = order.lines.find((line) => line.sku === product);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const message = String(new FormData(event.currentTarget).get("reason") || "").trim();
    if (message.length < 10) { setError("Please provide a reason with at least 10 characters."); return; }
    const items = product === "all" ? order.lines.map(({ sku, quantity }) => ({ sku, quantity }))
      : selectedLine ? [{ sku: selectedLine.sku, quantity }] : [];
    if (type !== "cancellation" && (!items.length || !Number.isInteger(quantity) || quantity < 1 || (selectedLine && quantity > selectedLine.quantity))) {
      setError("Choose a product and quantity from this order."); return;
    }
    submitting.current = true;
    setBusy(true);
    setError("");
    key.current ??= crypto.randomUUID();
    try {
      const ticket = await request<CareTicket>("care/tickets", "POST", {
        category: categories[type], subject: `${actionNames[type]} request · ${order.orderNumber || order.id.slice(0, 8)}`,
        message, orderId: order.id, idempotencyKey: key.current,
        orderAction: { type, ...(type === "cancellation" ? {} : { items }) },
      });
      saved(ticket);
    } catch (cause) {
      setError((cause as Error).message || "Your request could not be saved. Please try again.");
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }
  return (
    <form className={styles.form} aria-label={`${actionNames[type]} request`} onSubmit={submit} aria-busy={busy}>
      <h4>{actionNames[type]} request</h4>
      <p className={styles.muted}>OVIA will review your request and reply here. Submitting this form does not cancel your order or process a refund.</p>
      <fieldset disabled={busy}>
        {type !== "cancellation" && (
          <div className={styles.fieldRow}>
            <label htmlFor={`${type}-${order.id}-product`}>Product
              <select id={`${type}-${order.id}-product`} value={product} onChange={(event) => { setProduct(event.target.value); setQuantity(1); key.current = null; }}>
                <option value="all">All products</option>
                {order.lines.map((line) => <option key={line.sku} value={line.sku}>{line.name} · {line.color}</option>)}
              </select>
            </label>
            {selectedLine && <label htmlFor={`${type}-${order.id}-quantity`}>Quantity
              <input id={`${type}-${order.id}-quantity`} aria-label="Quantity" type="number" min={1} max={selectedLine.quantity} step={1} required value={quantity}
                onChange={(event) => { setQuantity(Number(event.target.value)); key.current = null; }} />
            </label>}
          </div>
        )}
        <label htmlFor={`${type}-${order.id}-reason`}>Reason
          <textarea id={`${type}-${order.id}-reason`} name="reason" required minLength={10} maxLength={3000} rows={3} onChange={() => { key.current = null; }} />
        </label>
      </fieldset>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <div className={styles.actions}>
        <button type="submit" className={styles.primaryButton} disabled={busy}>{busy ? "Submitting…" : "Submit request"}</button>
        <button type="button" className={styles.secondaryButton} onClick={close} disabled={busy}>Cancel</button>
      </div>
    </form>
  );
}

export function AccountOrdersReturns({ orders: initialOrders, loading, error, retry }: {
  orders: Order[]; loading: boolean; error: string; retry: () => void;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [orders, setOrders] = useState<Order[]>(initialOrders || []);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [ticketState, setTicketState] = useState<{ tickets: CareTicket[]; loading: boolean; error: string }>({ tickets: [], loading: false, error: "" });
  const [ticketRetry, setTicketRetry] = useState(0);
  const [form, setForm] = useState<{ orderId: string; type: Action } | null>(null);
  const [notice, setNotice] = useState("");
  const formRegion = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (Array.isArray(initialOrders) && initialOrders.length > 0) {
      setOrders(initialOrders);
    }
  }, [initialOrders]);

  const fetchOrdersAndTickets = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/account/orders", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json?.data)) {
          setOrders(json.data);
        }
      }
    } catch (e) {
      console.warn("Failed to fetch fresh orders:", e);
    }

    try {
      const resTickets = await fetch("/api/v1/care/tickets", { cache: "no-store" });
      if (resTickets.ok) {
        const jsonTickets = await resTickets.json();
        if (Array.isArray(jsonTickets?.data)) {
          setTicketState({ tickets: jsonTickets.data, loading: false, error: "" });
        }
      }
    } catch (e) {
      console.warn("Failed to fetch fresh tickets:", e);
    }
  }, []);

  useEffect(() => {
    fetchOrdersAndTickets();
  }, [fetchOrdersAndTickets, ticketRetry]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    setNotice("");
    try {
      await fetchOrdersAndTickets();
      retry();
      setNotice("Updates refreshed successfully.");
      setTimeout(() => setNotice(""), 3500);
    } catch {
      setNotice("Failed to refresh updates. Please try again.");
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (form) formRegion.current?.querySelector<HTMLTextAreaElement>("textarea")?.focus();
  }, [form]);
  useEffect(() => {
    if (loading || error) return;
    const id = new URLSearchParams(window.location.search).get("order");
    if (id) document.getElementById(`order-${id}`)?.scrollIntoView({ block: "center" });
  }, [loading, error]);
  const ticketsFor = (id: string) => ticketState.tickets.filter((ticket) => ticket.orderId === id && requestType(ticket));
  const visible = orders.filter((order) => {
    const tickets = ticketsFor(order.id);
    if (filter === "cancellation") {
      return (
        order.status === "cancelled" ||
        tickets.some((ticket) => requestType(ticket) === "cancellation") ||
        canRequest(order, "cancellation")
      );
    }
    if (filter === "returns") {
      return (
        order.status === "refund_required" ||
        tickets.some((ticket) => ["return", "refund"].includes(requestType(ticket) || "")) ||
        canRequest(order, "return") ||
        canRequest(order, "refund")
      );
    }
    if (filter === "shipping") {
      return !!order.shipping || ["paid", "demo", "pending", "payment_pending"].includes(order.status);
    }
    return true;
  });
  function saved(ticket: CareTicket) {
    setTicketState((state) => ({ ...state, tickets: [ticket, ...state.tickets.filter((existing) => existing.id !== ticket.id)] }));
    setNotice(`${actionNames[ticket.orderAction!.type]} request saved. Status: ${ticket.status}. OVIA will review it before any cancellation, return or refund is processed.`);
    setForm(null);
  }
  return (
    <section className={styles.panel} aria-label="Orders & Returns">
      <header className={styles.header}>
        <div><h2>Orders & Returns</h2><p className={styles.muted}>Follow your delivery and manage cancellation, return or refund requests.</p></div>
        <button
          type="button"
          className={styles.refresh}
          onClick={handleManualRefresh}
          aria-label="Refresh orders and delivery updates"
        >
          <RefreshCw
            size={15}
            aria-hidden="true"
            className={isRefreshing ? styles.spinning : ""}
          />{" "}
          {isRefreshing ? "Refreshing..." : "Refresh updates"}
        </button>
      </header>
      <nav className={styles.filters} aria-label="Order filters">
        {filters.map((item) => <button key={item.value} type="button" aria-pressed={filter === item.value} onClick={() => { setFilter(item.value); setForm(null); }} disabled={!!form && formRegion.current?.querySelector("form")?.getAttribute("aria-busy") === "true"}>{item.label}</button>)}
      </nav>
      <p className={styles.policy}>Requests are reviewed by OVIA support. Eligibility and any refund are confirmed after review. Shipping updates show the latest recorded courier information.</p>
      {notice && <p className={styles.notice} role="status">{notice}</p>}
      {ticketState.error && (
        <div className={styles.error} role="alert"><p>{ticketState.error}</p><button type="button" className={styles.textLink} onClick={() => setTicketRetry((value) => value + 1)}>Retry requests</button></div>
      )}
      {loading ? <p className={styles.empty} role="status">Loading your orders…</p> : error ? (
        <div className={styles.empty} role="alert"><p>{error}</p><button type="button" className={styles.secondaryButton} onClick={retry}>Try again</button></div>
      ) : visible.length === 0 ? (
        <div className={styles.empty}><Package size={28} strokeWidth={1.3} aria-hidden="true" /><h3>{orders.length ? "No orders in this view" : "No orders yet"}</h3><p className={styles.muted}>{orders.length ? "Choose All orders to see your collection." : "Your purchases and delivery updates will appear here."}</p>{!orders.length && <Link href="/new" className={styles.primaryButton}>Start Shopping</Link>}</div>
      ) : (
        <div className={styles.orderList}>
          {visible.map((order) => {
            const tickets = ticketsFor(order.id);
            const activeRequest = tickets.some((ticket) => activeStatuses.has(ticket.status));
            const available = (type: Action) => canRequest(order, type);
            // Orders remain actionable while the request history is loading or
            // temporarily unavailable. The server owns deduplication and
            // eligibility, so a slow support list must not block a customer.
            const requestsUnavailable = activeRequest || !!form;
            return (
              <article key={order.id} id={`order-${order.id}`} aria-label={`Order ${order.orderNumber || order.id.slice(0, 8)}`} className={styles.order}>
                <header className={styles.orderHeading}>
                  <div><h3>{order.orderNumber || `Order ${order.id.slice(0, 8)}`}</h3><time dateTime={order.createdAt} className={styles.small}>{date(order.createdAt)}</time></div>
                  <span className={styles.badge}>{paymentLabels[order.status]}</span>
                </header>
                <div className={styles.orderContent}>
                  <div className={styles.lines}>
                    {order.lines.map((line) => <div className={styles.line} key={line.sku}>
                      <Link href={`/products/${line.slug}`} className={styles.image} aria-label={`View ${line.name}`}><ProductPhoto src={line.image} alt={line.name} fill sizes="72px" /></Link>
                      <div><Link className={styles.productName} href={`/products/${line.slug}`}>{line.name}</Link><p className={styles.muted}>{line.color} · Qty {line.quantity}</p><p className={styles.small}>{money(line.price)} each</p></div>
                    </div>)}
                  </div>
                  <div className={styles.delivery}><h4>Delivery</h4><ShippingSummary order={order} /></div>
                </div>
                <div className={styles.orderFooter}>
                  <p>Order total <strong>{money(order.total)}</strong></p>
                  <div className={styles.actions}>
                    <Link className={styles.textLink} href={`/account/orders/${order.id}/tracking`}>Track order</Link>
                    <Link className={styles.textLink} href={`/orders/${order.id}/confirmation`}>View order</Link>
                    {(["cancellation", "return", "refund"] as Action[]).filter(available).map((type) => <button key={type} className={styles.secondaryButton} type="button" disabled={requestsUnavailable} onClick={() => { setNotice(""); setForm({ orderId: order.id, type }); }}>{`Request ${type}`}</button>)}
                  </div>
                </div>
                {activeRequest && <p className={styles.reviewNote}>A request for this order is under review. Open your request to send OVIA an update.</p>}
                <RequestHistory tickets={tickets} order={order} />
                {form?.orderId === order.id && <div ref={formRegion}><RequestForm key={`${order.id}-${form.type}`} order={order} type={form.type} close={() => setForm(null)} saved={saved} /></div>}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
