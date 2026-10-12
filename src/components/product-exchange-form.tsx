"use client";
import { useRef, useState } from "react";
import type { Order } from "@/lib/types";
import type { CareTicket } from "@/lib/care";
import { request } from "./store-provider";
import { SupportAttachmentPicker } from "./support-attachment-picker";
import styles from "./customer-account-center.module.css";

export function ProductExchangeForm({ orders, onSaved }: { orders: Order[]; onSaved: (ticket: CareTicket) => void }) {
  const [attachments, setAttachments] = useState<string[]>([]);
  const [busy, setBusy] = useState(false), [uploading, setUploading] = useState(false);
  const [error, setError] = useState(""), [notice, setNotice] = useState("");
  const attempt = useRef<string | null>(null);
  return <form className={styles.refundForm} onSubmit={async (event) => {
    event.preventDefault(); if (busy || uploading) return;
    const form = event.currentTarget, data = new FormData(form);
    setError(""); setNotice("");
    const number = String(data.get("orderNumber") || "").trim().replace(/^#/, "");
    const order = orders.find((item) => (item.orderNumber || item.id).toLowerCase() === number.toLowerCase());
    if (!order) { setError("Enter an order number from your account."); return; }
    setBusy(true); attempt.current ??= crypto.randomUUID();
    try {
      const ticket = await request<CareTicket>("care/tickets", "POST", {
        category: "Return", orderId: order.id,
        subject: `Exchange consent · ${order.orderNumber || order.id}`.slice(0, 150),
        message: [
          `Customer: ${data.get("firstName")} ${data.get("lastName")}`,
          `Contact email: ${data.get("email")}`, `Phone: ${data.get("phone")}`,
          `Product: ${data.get("product")}`, `Reason: ${data.get("reason")}`,
          `Preferred resolution: ${data.get("resolution")}`,
          "Consent: Customer agrees to OVIA reviewing this exchange request. Resolution is subject to eligibility and availability.",
        ].join("\n"), attachments, idempotencyKey: attempt.current,
      });
      onSaved(ticket); attempt.current = null; form.reset(); setAttachments([]);
      setNotice(`Exchange consent saved: ${ticket.ticketNumber || ticket.id}. OVIA will review your preferred resolution.`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to save exchange consent."); }
    finally { setBusy(false); }
  }}>
    <header><h2>Product Exchange Consent Form</h2><p>Please fill out this form to provide your consent for product exchange.</p></header>
    <fieldset disabled={busy}>
      <legend>Exchange consent details</legend>
      <div className={styles.nameFields}>
        <label>First name<input name="firstName" required maxLength={80} autoComplete="given-name" /></label>
        <label>Last name<input name="lastName" maxLength={80} autoComplete="family-name" /></label>
      </div>
      <label>Email address<input name="email" type="email" required maxLength={254} autoComplete="email" /></label>
      <label>Phone number<input name="phone" type="tel" required maxLength={20} pattern="[+0-9 ()-]{6,20}" autoComplete="tel" /></label>
      <label>Order number<input name="orderNumber" required maxLength={100} list="exchange-orders" /></label>
      <datalist id="exchange-orders">{orders.map((order) => <option key={order.id} value={order.orderNumber || order.id} />)}</datalist>
      <label>Product name<input name="product" required maxLength={150} /></label>
      <label>Reason for exchange<textarea name="reason" required minLength={10} maxLength={2000} rows={5} /></label>
      <div><p>Preferred resolution</p><div className={styles.resolutionChoices}>{["Exchange for same product", "Exchange for different product", "Refund", "Store credit"].map((value) => <label key={value}><input type="radio" name="resolution" value={value} required />{value}</label>)}</div></div>
      <div className={styles.proof}><p>Upload product images or supporting documents (optional)</p><SupportAttachmentPicker value={attachments} onChange={setAttachments} disabled={busy} onBusyChange={setUploading} /></div>
      <label className={styles.consentChoice}><input type="checkbox" required />I consent to OVIA reviewing my exchange request. My preferred resolution is subject to eligibility and availability.</label>
    </fieldset>
    {error && <p role="alert">{error}</p>}{notice && <p role="status">{notice}</p>}
    <footer><button disabled={busy || uploading}>{busy ? "Submitting…" : "Submit"}</button></footer>
  </form>;
}
