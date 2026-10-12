"use client";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import type { Order } from "@/lib/types";
import { orderPaymentStatus } from "@/lib/order-document";
import { orderWorkflow } from "@/lib/order-workflow";
import { request } from "./store-provider";
import styles from "./account-order-details.module.css";
import { SupportAttachmentPicker } from "./support-attachment-picker";
import type { Product, Variant } from "@/lib/catalog";
const money = (value: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    value / 100,
  );
const label = (value: string) => value.replaceAll("_", " ").toLowerCase();
export function AccountOrderDetails({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<Order | null>(null),
    [tab, setTab] = useState("My Order"),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [form, setForm] = useState<"cancel" | "return" | "support" | null>(null),
    [supportMessage, setSupportMessage] = useState(""),
    [reason, setReason] = useState("Customer requested"),
    [exchange, setExchange] = useState(false),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState("");
  const requestKey = useRef<string | null>(null);
  const [items, setItems] = useState<Record<string, number>>({});
  const [attachments, setAttachments] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [details, setDetails] = useState("");
  const [replacements, setReplacements] = useState<Variant[]>([]);
  const [replacementSku, setReplacementSku] = useState("");
  const [replacementError, setReplacementError] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [pickupPhone, setPickupPhone] = useState("");
  const selected =
    order?.lines.filter((line) => (items[line.sku] || 0) > 0) || [];
  const replacementSlug = selected.length === 1 ? selected[0].slug : "";
  useEffect(() => {
    setReplacements([]);
    setReplacementSku("");
    setReplacementError("");
    if (!exchange || !replacementSlug || form !== "return") return;
    let active = true;
    request<Product>(`products/${encodeURIComponent(replacementSlug)}`)
      .then((product) => {
        if (active)
          setReplacements(
            product.variants.filter((variant) => variant.stock > 0),
          );
      })
      .catch((cause) => {
        if (active)
          setReplacementError(
            cause instanceof Error
              ? cause.message
              : "Unable to load replacements.",
          );
      });
    return () => {
      active = false;
    };
  }, [exchange, replacementSlug, form]);
  useEffect(() => {
    const section = new URLSearchParams(window.location.search).get("section");
    if (section === "help") setTab("Help");
    if (section === "payment") setTab("Payment & Refund");
  }, [orderId]);
  const refreshing = useRef(false);
  async function refreshProviders() {
    if (!order || refreshing.current) return;
    refreshing.current = true;
    try {
      const result = await request<{
        results: { source: string; confirmed: boolean; message: string }[];
      }>(`orders/${order.id}/refresh`, "POST", {});
      setOrder(await request<Order>(`orders/${order.id}`));
      setNotice(
        result.results.length
          ? result.results
              .map((item) => `${item.source}: ${item.message}`)
              .join(" ")
          : "No provider booking or payment reference is recorded yet.",
      );
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      refreshing.current = false;
    }
  }
  useEffect(() => {
    if (!order?.id) return;
    void refreshProviders();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void refreshProviders();
    }, 60000);
    return () => clearInterval(timer);
  }, [order?.id]);
  useEffect(() => {
    let active = true,
      running = false;
    const controller = new AbortController();
    async function load() {
      if (running) return;
      running = true;
      try {
        const response = await fetch(
          `/api/v1/orders/${encodeURIComponent(orderId)}`,
          {
            cache: "no-store",
            signal: AbortSignal.any([
              controller.signal,
              AbortSignal.timeout(30000),
            ]),
          },
        );
        const json = await response.json();
        if (!response.ok)
          throw new Error(json.error?.message || "Could not load this order.");
        if (active) {
          setOrder(json.data);
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
      controller.abort();
      clearInterval(timer);
    };
  }, [orderId]);
  async function submit() {
    if (!order || busy) return;
    setBusy(true);
    setError("");
    try {
      if (form === "cancel") {
        const result = await request<Order>(
          `orders/${order.id}/cancel`,
          "POST",
          { reason, confirmed: true },
        );
        setOrder(result);
        setNotice(
          result.status === "cancelled"
            ? "Cancellation confirmed."
            : result.logisticsOperations?.cancel?.message ||
                "Cancellation is pending confirmation.",
        );
      } else if (form === "support") {
        requestKey.current ??= crypto.randomUUID();
        const ticket = await request<{ id: string; status: string }>(
          "care/tickets",
          "POST",
          {
            category: "Order issue",
            subject: `Order help · ${order.orderNumber || order.id}`,
            message: supportMessage,
            orderId: order.id,
            idempotencyKey: requestKey.current,
            attachments,
          },
        );
        setNotice(
          `Support request saved. Reference ${ticket.id}. Status: ${ticket.status}.`,
        );
        requestKey.current = null;
      } else {
        requestKey.current ??= crypto.randomUUID();
        const ticket = await request<{
          id: string;
          ticketNumber?: string;
          status: string;
        }>(`orders/${order.id}/return`, "POST", {
          exchange,
          reason,
          details,
          pickupAddress:
            pickupAddress ||
            [
              order.address.line1,
              order.address.line2,
              order.address.city,
              order.address.region,
              order.address.postalCode,
            ]
              .filter(Boolean)
              .join(", "),
          pickupPhone: pickupPhone || order.address.phone || "",
          attachments,
          items: Object.entries(items)
            .filter(([, quantity]) => quantity > 0)
            .map(([sku, quantity]) => ({ sku, quantity })),
          ...(exchange ? { replacementSku } : {}),
          idempotencyKey: requestKey.current,
        });
        setNotice(
          `Request saved for OVIA review. Reference ${ticket.ticketNumber || ticket.id}. Status: ${ticket.status}. No refund or exchange has been confirmed.`,
        );
        requestKey.current = null;
      }
      setAttachments([]);
      setForm(null);
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (loading)
    return <main className={styles.journey}>Loading your order…</main>;
  if (!order)
    return (
      <main className={styles.journey}>
        <p role="alert">{error || "Order not found."}</p>
        <Link href="/account/orders">Back to My Orders</Link>
      </main>
    );
  const flow = orderWorkflow(order),
    payment = orderPaymentStatus(order),
    paid = payment === "Payment received",
    events = order.shipping?.events || [],
    quote = order.checkoutQuote;
  const headline = flow.delivered
    ? "Your order has arrived."
    : order.status === "cancelled"
      ? "Your order was cancelled."
      : order.status === "expired"
        ? "Your checkout expired."
        : flow.dispatched
          ? "Your order is on the way."
          : paid
            ? "We’re preparing your order."
            : "Your payment is not confirmed.";
  const stages: [string, boolean][] = [
    ["Order confirmed", paid],
    ["Preparing", order.logisticsOperations?.approve?.status === "Confirmed"],
    [
      "Shipped",
      events.some((e) => e.status === "PICKED_UP") ||
        order.shipping?.status === "PICKED_UP",
    ],
    [
      "On the way",
      events.some((e) => e.status === "IN_TRANSIT") ||
        order.shipping?.status === "IN_TRANSIT",
    ],
    [
      "Out for delivery",
      events.some((e) => e.status === "OUT_FOR_DELIVERY") ||
        order.shipping?.status === "OUT_FOR_DELIVERY",
    ],
    ["Delivered", flow.delivered],
  ];
  return (
    <main className={styles.journey}>
      <header className={styles.journeyHeader}>
        <div className={styles.journeyRow}>
          <strong>OVIA</strong>
          <Link href="/account/orders">MY ACCOUNT / ORDERS</Link>
        </div>
        <div className={styles.journeyRow}>
          <small>ORDER #{order.orderNumber || order.id}</small>
          <span>{label(flow.stage)}</span>
        </div>
        <h1>{headline}</h1>
        <p>
          {flow.delivered ? "We hope you enjoy your OVIA pieces." : payment}
        </p>
      </header>
      <div className={styles.journeyBody}>
        <nav className={styles.journeyTabs} aria-label="Order sections">
          {["My Order", "Delivery", "Payment & Refund", "Help"].map((name) => (
            <button
              key={name}
              type="button"
              aria-pressed={tab === name}
              onClick={() => setTab(name)}
            >
              {name}
            </button>
          ))}
        </nav>
        {error && <p role="alert">{error}</p>}
        {notice && <p role="status">{notice}</p>}
        {tab === "My Order" && (
          <section>
            {order.lines.map((line) => (
              <div className={styles.journeyProduct} key={line.sku}>
                {line.image && <img src={line.image} alt={line.name} />}
                <div>
                  <h3>{line.name}</h3>
                  <p>
                    {line.color} · Qty {line.quantity}
                  </p>
                  <p>{money(line.price * line.quantity)}</p>
                  <small>{money(line.price)} each</small>
                </div>
              </div>
            ))}
            <div className={styles.journeyRow}>
              <span>Subtotal</span>
              <span>
                {money(
                  quote?.subtotal ??
                    order.lines.reduce(
                      (sum, line) => sum + line.price * line.quantity,
                      0,
                    ),
                )}
              </span>
            </div>
            {quote && (
              <>
                <div className={styles.journeyRow}>
                  <span>Discount</span>
                  <span>−{money(quote.discount)}</span>
                </div>
                <div className={styles.journeyRow}>
                  <span>Shipping</span>
                  <span>{money(quote.shipping)}</span>
                </div>
                <div className={styles.journeyRow}>
                  <span>{quote.taxIncluded ? "Tax included" : "Tax"}</span>
                  <span>{money(quote.tax)}</span>
                </div>
              </>
            )}
            <div className={styles.journeyRow}>
              <strong>{paid ? "Total paid" : "Order total"}</strong>
              <strong>{money(order.total)}</strong>
            </div>
            <h3>Delivery address</h3>
            <p>
              {[
                order.address.name,
                order.address.line1,
                order.address.line2,
                order.address.city,
                order.address.region,
                order.address.postalCode,
              ]
                .filter(Boolean)
                .join(", ")}
            </p>
            <p>{order.address.phone}</p>
          </section>
        )}
        {tab === "Delivery" && (
          <section>
            <h3>Your delivery</h3>
            <ul className={styles.journeySteps}>
              {stages.map(([name, done]) => (
                <li key={name}>
                  <span
                    className={
                      done ? styles.journeyDone : styles.journeyWaiting
                    }
                  >
                    {done ? "✓" : "●"}
                  </span>
                  {name}
                </li>
              ))}
            </ul>
            <div className={styles.journeyRow}>
              <span>Courier</span>
              <span>{order.shipping?.courier || "Not assigned"}</span>
            </div>
            <div className={styles.journeyRow}>
              <span>Tracking number</span>
              <span>{order.shipping?.awb || "Not assigned"}</span>
            </div>
            <p>
              Estimated delivery:{" "}
              {order.shipping?.estimatedDelivery
                ? new Date(order.shipping.estimatedDelivery).toLocaleDateString(
                    "en-IN",
                  )
                : "Not confirmed by courier"}
            </p>
            {order.shipping?.awb && (
              <Link href={`/account/orders/${order.id}/tracking`}>
                Track shipment →
              </Link>
            )}
          </section>
        )}
        {tab === "Payment & Refund" && (
          <section>
            <h3>Payment details</h3>
            <div className={styles.journeyRow}>
              <span>Gateway</span>
              <span>{order.provider}</span>
            </div>
            <div className={styles.journeyRow}>
              <span>Payment</span>
              <span>{payment}</span>
            </div>
            {paid && (
              <div className={styles.journeyRow}>
                <span>Paid amount</span>
                <span>{money(order.total)}</span>
              </div>
            )}
            {order.captureId && <p>Payment reference: {order.captureId}</p>}
            <h3>Refund details</h3>
            {order.refunds?.length ? (
              order.refunds.map((refund) => (
                <div className={styles.journeyRow} key={refund.id} id={`refund-${refund.id}`}>
                  <span>
                    {refund.status}
                    {refund.remoteId ? ` · ${refund.remoteId}` : ""}
                  </span>
                  <span>{money(refund.amount)}</span>
                </div>
              ))
            ) : (
              <p>No refund recorded</p>
            )}
          </section>
        )}
        {tab === "Help" && (
          <section>
            <h3>How can we help?</h3>
            <button
              className={styles.journeySecondary}
              onClick={() => setTab("Delivery")}
            >
              Where is my order? →
            </button>
            <button
              className={styles.journeySecondary}
              onClick={() => setForm("support")}
            >
              Report a delivery problem →
            </button>
            {flow.delivered &&
              paid &&
              order.status === "paid" &&
              !order.refunds?.some((refund) => refund.status !== "Failed") && (
                <button
                  className={styles.journeySecondary}
                  onClick={() => setForm("return")}
                >
                  Request a return or exchange →
                </button>
              )}
            <button
              className={styles.journeySecondary}
              onClick={() => setTab("Payment & Refund")}
            >
              Payment and refund help →
            </button>
          </section>
        )}
        {flow.canCancel && (
          <button
            className={styles.journeySecondary}
            onClick={() => setForm("cancel")}
          >
            Cancel Order
          </button>
        )}
        {flow.delivered &&
          paid &&
          order.status === "paid" &&
          !order.refunds?.some((refund) => refund.status !== "Failed") && (
            <button
              className={styles.journeyPrimary}
              onClick={() => setForm("return")}
            >
              Return or Exchange →
            </button>
          )}
        <div className={styles.journeyRow}>
          <a
            href={`/api/v1/orders/${order.id}/document`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Download order summary
          </a>
          <button
            className={styles.journeySecondary}
            onClick={() => setForm("support")}
          >
            Need Help
          </button>
        </div>
        {tab === "Payment & Refund" && (
          <section>
            <button
              className={styles.journeySecondary}
              disabled
              title="Verified invoice records are missing"
            >
              Invoice unavailable
            </button>
            <p>
              Tax invoice unavailable until verified seller details, invoice
              number and tax breakdown are recorded.
            </p>
          </section>
        )}
        <button
          className={styles.journeySecondary}
          disabled={busy}
          onClick={() => void refreshProviders()}
        >
          Check payment, refund & delivery updates
        </button>
        {form && (
          <section className={styles.journeyForm}>
            <h3>
              {form === "support"
                ? "Order help"
                : form === "cancel"
                  ? "Cancel Order"
                  : "Return or Exchange"}
            </h3>
            <p>
              {form === "support"
                ? "Send your issue to OVIA support. Your request will be saved with this order."
                : form === "cancel"
                  ? "Cancellation will be checked against the current shipment status."
                  : "OVIA will review your request before arranging a return, exchange or refund."}
            </p>
            {form === "return" && (
              <>
                <fieldset>
                  <legend>Choose products and quantities</legend>
                  {order.lines.map((line) => (
                    <label key={line.sku}>
                      {line.name} · {line.color}
                      <input
                        type="number"
                        min={0}
                        max={line.quantity}
                        value={items[line.sku] || 0}
                        onChange={(event) =>
                          setItems((current) => ({
                            ...current,
                            [line.sku]: Number(event.target.value),
                          }))
                        }
                      />
                    </label>
                  ))}
                </fieldset>
                <label>
                  <input
                    type="radio"
                    checked={!exchange}
                    onChange={() => setExchange(false)}
                  />{" "}
                  Return for refund
                </label>
                <label>
                  <input
                    type="radio"
                    checked={exchange}
                    onChange={() => setExchange(true)}
                  />{" "}
                  Exchange product
                </label>
              </>
            )}
            {form === "support" ? (
              <label>
                Describe the issue
                <textarea
                  value={supportMessage}
                  onChange={(event) => setSupportMessage(event.target.value)}
                  minLength={10}
                  maxLength={3000}
                />
              </label>
            ) : (
              <label>
                Reason
                <select
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                >
                  {[
                    "Customer requested",
                    "Changed my mind",
                    "Ordered by mistake",
                    "Damaged product",
                    "Wrong product received",
                    "Missing item",
                    "Delivery delay",
                    "Wrong address",
                    "Out of stock",
                    "Other",
                  ].map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </label>
            )}
            {form === "return" && (
              <label>
                Additional details (include your preferred replacement for an
                exchange)
                <textarea
                  maxLength={2000}
                  value={details}
                  onChange={(event) => setDetails(event.target.value)}
                />
              </label>
            )}
            {form === "return" && (
              <>
                <label>
                  Pickup address
                  <textarea
                    maxLength={600}
                    value={
                      pickupAddress ||
                      [
                        order.address.line1,
                        order.address.line2,
                        order.address.city,
                        order.address.region,
                        order.address.postalCode,
                      ]
                        .filter(Boolean)
                        .join(", ")
                    }
                    onChange={(event) => setPickupAddress(event.target.value)}
                  />
                </label>
                <label>
                  Pickup contact number
                  <input
                    type="tel"
                    maxLength={30}
                    value={pickupPhone || order.address.phone || ""}
                    onChange={(event) => setPickupPhone(event.target.value)}
                  />
                </label>
                <p>
                  Selected products:{" "}
                  {money(
                    order.lines.reduce(
                      (sum, line) => sum + line.price * (items[line.sku] || 0),
                      0,
                    ),
                  )}
                  . Refund amount will be reviewed against discounts and the
                  verified payment.
                </p>
              </>
            )}
            {form === "return" && exchange && (
              <>
                {selected.length !== 1 ? (
                  <p>Select one product to choose its replacement.</p>
                ) : (
                  <label>
                    Available replacement
                    <select
                      value={replacementSku}
                      onChange={(event) =>
                        setReplacementSku(event.target.value)
                      }
                    >
                      <option value="">Choose a replacement</option>
                      {replacements
                        .filter(
                          (variant) =>
                            variant.stock >= (items[selected[0].sku] || 1),
                        )
                        .map((variant) => (
                          <option key={variant.sku} value={variant.sku}>
                            {variant.color}
                            {variant.size ? ` · ${variant.size}` : ""} ·{" "}
                            {money(variant.price)}
                          </option>
                        ))}
                    </select>
                  </label>
                )}
                {replacementError && <p role="alert">{replacementError}</p>}
                {replacementSku && selected.length === 1 && (
                  <p>
                    Price difference for review:{" "}
                    {money(
                      ((replacements.find(
                        (variant) => variant.sku === replacementSku,
                      )?.price || 0) -
                        selected[0].price) *
                        items[selected[0].sku],
                    )}
                    . Availability and any payment adjustment require
                    confirmation before exchange.
                  </p>
                )}
              </>
            )}
            {form !== "cancel" && (
              <SupportAttachmentPicker
                value={attachments}
                onChange={setAttachments}
                disabled={busy}
                onBusyChange={setUploading}
              />
            )}
            {form === "cancel" && (
              <p>
                This cancellation applies to the entire order. Order total:{" "}
                {money(order.total)}. Any refund depends on the verified payment
                and provider confirmation.
              </p>
            )}
            {form === "return" && (
              <Link href="/account/returns">
                View previous return and exchange requests →
              </Link>
            )}
            <div className={styles.journeyRow}>
              <button
                disabled={busy}
                className={styles.journeySecondary}
                onClick={() => setForm(null)}
              >
                Back
              </button>
              <button
                disabled={
                  busy ||
                  uploading ||
                  (form === "support" && supportMessage.trim().length < 10) ||
                  (form === "return" &&
                    (!Object.values(items).some((quantity) => quantity > 0) ||
                      (exchange && !replacementSku)))
                }
                className={styles.journeyPrimary}
                onClick={() => void submit()}
              >
                {busy
                  ? "Submitting…"
                  : form === "cancel"
                    ? "Confirm"
                    : "Submit Request"}
              </button>
            </div>
          </section>
        )}
        <section className={styles.journeyActivity}>
          <h3>Order activity</h3>
          {[...events]
            .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
            .map((event, index) => (
              <p key={`${event.timestamp}-${index}`}>
                {event.description}
                <br />
                <small>
                  {new Date(event.timestamp).toLocaleString("en-IN")}{" "}
                  {event.location}
                </small>
              </p>
            ))}
          {!events.length && <p>No courier updates recorded.</p>}
          <small>
            Order placed {new Date(order.createdAt).toLocaleString("en-IN")}.
            Updates refresh every 10 seconds.
          </small>
        </section>
      </div>
    </main>
  );
}
