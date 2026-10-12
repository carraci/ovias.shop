"use client";
import { useRef, useState } from "react";
import type { Order } from "@/lib/types";
import type { CareTicket } from "@/lib/care";
import { request } from "./store-provider";
import { SupportAttachmentPicker } from "./support-attachment-picker";
import styles from "./customer-account-center.module.css";

export function RefundRequestForm({ orders, onSaved }: { orders: Order[]; onSaved: (ticket: CareTicket) => void }) {
  const [attachments, setAttachments] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const attempt = useRef<string | null>(null);
  return <form className={styles.refundForm} onSubmit={async (event) => {
    event.preventDefault();
    if (busy || uploading) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const orderNumber = String(data.get("orderNumber") || "").trim().replace(/^#/, "");
    const order = orders.find((item) => (item.orderNumber || item.id).toLowerCase() === orderNumber.toLowerCase());
    setError(""); setNotice("");
    if (!order) { setError("Enter an order number from your account."); return; }
    setBusy(true);
    attempt.current ??= crypto.randomUUID();
    try {
      const ticket = await request<CareTicket>("care/tickets", "POST", {
        category: "Refund", orderId: order.id,
        subject: `Refund request · ${order.orderNumber || order.id}`.slice(0, 150),
        message: [
          `Contact name: ${data.get("firstName")} ${data.get("lastName")}`,
          `Contact email: ${data.get("contactEmail")}`,
          `Product: ${data.get("productName")}`,
          `Purchase date supplied: ${data.get("purchaseDate")}`,
          `Reason: ${data.get("reason")}`,
        ].join("\n"),
        attachments, idempotencyKey: attempt.current,
      });
      onSaved(ticket); attempt.current = null; form.reset(); setAttachments([]);
      setNotice(`Refund request saved: ${ticket.ticketNumber || ticket.id}. OVIA will review eligibility and the refund amount.`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to save your refund request."); }
    finally { setBusy(false); }
  }}>
    <header><h2>E-Commerce Refund Form</h2><p>Please fill out this form to request a refund for your purchase.</p></header>
    <fieldset disabled={busy}>
      <legend>Purchase details</legend>
      <div className={styles.nameFields}>
        <label>First name<input name="firstName" autoComplete="given-name" required maxLength={80} /></label>
        <label>Last name<input name="lastName" autoComplete="family-name" maxLength={80} /></label>
      </div>
      <label>Email address<input type="email" name="contactEmail" required maxLength={254} placeholder="example@example.com" /></label>
      <label>Order number<input name="orderNumber" required maxLength={100} list="refund-order-numbers" /></label>
      <datalist id="refund-order-numbers">{orders.map((order) => <option key={order.id} value={order.orderNumber || order.id} />)}</datalist>
      <label>Product name<input name="productName" required maxLength={150} /></label>
      <label>Reason for refund<textarea name="reason" required minLength={10} maxLength={2000} rows={5} /></label>
      <label>Date of purchase<input type="date" name="purchaseDate" required max={new Date().toLocaleDateString("en-CA")} /></label>
      <div className={styles.proof}><p>Upload proof of purchase (optional)</p><SupportAttachmentPicker value={attachments} onChange={setAttachments} disabled={busy} onBusyChange={setUploading} /></div>
    </fieldset>
    {error && <p role="alert">{error}</p>}
    {notice && <p role="status">{notice}</p>}
    <footer><p>Requests are reviewed before any refund is approved.</p><button disabled={busy || uploading}>{busy ? "Submitting…" : "Submit request"}</button></footer>
  </form>;
}
