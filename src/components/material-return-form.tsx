"use client";
import { useRef, useState } from "react";
import type { Order } from "@/lib/types";
import type { CareTicket } from "@/lib/care";
import { request } from "./store-provider";
import { SupportAttachmentPicker } from "./support-attachment-picker";
import styles from "./customer-account-center.module.css";

export function MaterialReturnForm({ orders, onSaved }: { orders: Order[]; onSaved: (ticket: CareTicket) => void }) {
  const [attachments, setAttachments] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const attempt = useRef<string | null>(null);
  return <form className={`${styles.refundForm} ${styles.materialForm}`} onSubmit={async (event) => {
    event.preventDefault();
    if (busy || uploading) return;
    setError(""); setNotice("");
    const form = event.currentTarget, data = new FormData(form);
    const number = String(data.get("orderNumber") || "").trim().replace(/^#/, "");
    const order = orders.find((item) => (item.orderNumber || item.id).toLowerCase() === number.toLowerCase());
    if (!order) { setError("Enter an order number from your account."); return; }
    const sku = String(data.get("referenceCode") || "").trim();
    const line = order.lines.find((item) => item.sku === sku);
    const quantity = Number(data.get("quantity"));
    if (!line || !Number.isInteger(quantity) || quantity < 1 || quantity > line.quantity) { setError("Enter a product reference (SKU) from this order and a quantity within the purchased amount."); return; }
    const reasons = data.getAll("reason");
    if (!reasons.length) { setError("Choose at least one reason for return."); return; }
    setBusy(true); attempt.current ??= crypto.randomUUID();
    try {
      const ticket = await request<CareTicket>("care/tickets", "POST", {
        category: "Return", orderId: order.id,
        orderAction: { type: "return", items: [{ sku, quantity }] },
        subject: `Return request · ${order.orderNumber || order.id}`.slice(0, 150),
        message: [
          `Customer: ${data.get("firstName")} ${data.get("lastName")}`,
          `Phone: ${data.get("phone")}`, `Contact email: ${data.get("email")}`,
          `Bill number supplied: ${data.get("billNumber") || "Not supplied"}`,
          `Purchase date supplied: ${data.get("purchaseDate")}`,
          `Product reference: ${sku} · Quantity: ${quantity}`,
          `Description: ${data.get("description")}`,
          `Reasons: ${reasons.join(", ")}`, `Request date: ${data.get("date")}`,
        ].join("\n"), attachments, idempotencyKey: attempt.current,
      });
      onSaved(ticket); attempt.current = null; form.reset(); setAttachments([]);
      setNotice(`Return request saved: ${ticket.ticketNumber || ticket.id}. OVIA will review the request and arrange next steps.`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to save the return request."); }
    finally { setBusy(false); }
  }}>
    <header><h2>Material Return Form</h2></header>
    <fieldset disabled={busy}>
      <legend>Return request details</legend>
      <h3>Customer Information</h3>
      <div className={styles.nameFields}>
        <label>First name<input name="firstName" required maxLength={80} autoComplete="given-name" /></label>
        <label>Last name<input name="lastName" maxLength={80} autoComplete="family-name" /></label>
        <label>Phone number<input name="phone" type="tel" required maxLength={20} pattern="[+0-9 ()-]{6,20}" autoComplete="tel" /></label>
        <label>Email address<input name="email" type="email" required maxLength={254} autoComplete="email" /></label>
      </div>
      <h3>Order Information</h3>
      <div className={styles.nameFields}>
        <label>Order number<input name="orderNumber" required maxLength={100} list="return-order-numbers" /></label>
        <label>Bill number (optional)<input name="billNumber" maxLength={100} /></label>
        <label>Date of purchase<input name="purchaseDate" type="date" required /></label>
      </div>
      <datalist id="return-order-numbers">{orders.map((order) => <option key={order.id} value={order.orderNumber || order.id} />)}</datalist>
      <h3>Material Information</h3>
      <div className={styles.nameFields}>
        <label>Reference code (product SKU)<input name="referenceCode" required maxLength={150} list="return-product-codes" /></label>
        <label>Quantity<input name="quantity" type="number" required min={1} step={1} /></label>
      </div>
      <datalist id="return-product-codes">{orders.flatMap((order) => order.lines.map((line, index) => <option key={`${order.id}-${index}`} value={line.sku}>{line.name}</option>))}</datalist>
      <label>Material name / description<textarea name="description" required maxLength={1500} rows={5} placeholder="Type here…" /></label>
      <div><p>Reason for return</p><div className={styles.reasonChoices}>{["Wrong delivery", "Wrong quantity", "Transport damage", "For inspection", "Other"].map((reason) => <label key={reason}><input name="reason" type="checkbox" value={reason} />{reason}</label>)}</div></div>
      <div className={styles.proof}><p>Upload product images or related documents for material return</p><SupportAttachmentPicker value={attachments} onChange={setAttachments} disabled={busy} onBusyChange={setUploading} /></div>
      <label>Date<input name="date" type="date" required /></label>
    </fieldset>
    {error && <p role="alert">{error}</p>}{notice && <p role="status">{notice}</p>}
    <footer><button disabled={busy || uploading}>{busy ? "Submitting…" : "Submit"}</button></footer>
  </form>;
}
