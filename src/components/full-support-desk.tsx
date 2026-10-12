"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { request, useStore } from "./store-provider";
import { SupportAttachmentPicker } from "./support-attachment-picker";
import { useSupportRealtime } from "./use-support-realtime";
import { supportCategories } from "@/lib/care";
import type { Order } from "@/lib/types";
import styles from "./full-support-desk.module.css";
type Conversation = {
  id: string;
  ticketNumber: string;
  subject: string;
  category: string;
  status: string;
  updatedAt?: string;
  messages: {
    id?: string;
    sender: string;
    text: string;
    time: string;
    attachments?: string[];
  }[];
};
export function FullSupportDesk() {
  const { user } = useStore();
  const [tickets, setTickets] = useState<Conversation[]>([]),
    [orders, setOrders] = useState<Order[]>([]),
    [activeId, setActiveId] = useState<string | null>(null);
  const [notice, setNotice] = useState(""),
    [showRequests, setShowRequests] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [uploading, setUploading] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]),
    [replyAttachments, setReplyAttachments] = useState<string[]>([]),
    [reply, setReply] = useState("");
  const key = useRef<string | null>(null),
    replyKey = useRef<{ id: string; text: string; ticketId: string } | null>(
      null,
    ),
    inflight = useRef(false);
  const refresh = useCallback(async () => {
    if (!user || inflight.current) return;
    inflight.current = true;
    try {
      const result = await request<Conversation[]>("support/conversations");
      setTickets(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load requests.");
    } finally {
      inflight.current = false;
    }
  }, [user?.id]);
  useSupportRealtime(() => void refresh(), !!user);
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("request");
    if (requested) { setActiveId(requested); setShowRequests(true); }
  }, []);
  useEffect(() => {
    if (!user) return;
    void refresh();
    void request<Order[]>("account/orders")
      .then(setOrders)
      .catch(() => {});
    const timer = setInterval(() => {
      if (!document.hidden) void refresh();
    }, 5000);
    return () => clearInterval(timer);
  }, [user?.id, refresh]);
  const active = tickets.find((t) => t.id === activeId);
  return (
    <section className={styles.page}>
      <p className={styles.eyebrow}>MY OVIA / HELP & SUPPORT</p>
      <h1>How can we help?</h1>
      <p>
        Send us a message. We're here to assist you.
      </p>
      {!user ? (
        <div className="empty-state">
          <p>Sign in to create a request and view your conversation history.</p>
          <Link href="/account/sign-in" className="button dark">
            Sign in
          </Link>
        </div>
      ) : (
        <>
          <div className={styles.layout}>
            <form
              className={styles.form}
              onSubmit={async (e) => {
                e.preventDefault();
                if (busy || uploading) return;
                setBusy(true);
                setError("");
                setNotice("");
                const form = e.currentTarget,
                  data = new FormData(form);
                key.current ??= crypto.randomUUID();
                try {
                  const result = await request<{ id: string }>(
                    "care/tickets",
                    "POST",
                    {
                      category: data.get("category"),
                      orderId: data.get("orderId"),
                      subject: data.get("category"),
                      message: data.get("message"),
                      idempotencyKey: key.current,
                      attachments,
                    },
                  );
                  key.current = null;
                  form.reset();
                  setAttachments([]);
                  await refresh();
                  setActiveId("tickets:" + result.id);
                  setShowRequests(true);
                  setNotice(
                    "Your request is saved. You can continue the conversation below.",
                  );
                } catch (e) {
                  setError(
                    e instanceof Error
                      ? e.message
                      : "Request could not be saved.",
                  );
                } finally {
                  setBusy(false);
                }
              }}
            >
              <h2>Contact us</h2>
              <label>
                What is your issue?
                <select name="category" aria-label="Category">
                  {supportCategories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <details className={styles.optional}>
                <summary>Related order and attachments (optional)</summary>
                <label>
                Related order
                <select name="orderId" aria-label="Related order">
                  <option value="">No related order</option>
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.orderNumber || o.id.slice(0, 8)} · {o.status}
                    </option>
                  ))}
                </select>
              </label>
                <SupportAttachmentPicker value={attachments} onChange={setAttachments} disabled={busy} onBusyChange={setUploading} />
              </details>
              <label>
                Your message
                <textarea
                  name="message"
                  minLength={10}
                  maxLength={3000}
                  rows={6}
                  placeholder="Tell us how we can help…"
                  required
                />
              </label>
              <button className={styles.send} disabled={busy || uploading}>
                {busy ? "Saving…" : "Send request →"}
              </button>
            </form>
            <div className={styles.requestsHeading}>
              <div><h2>My support requests</h2><p>View previous requests and replies</p></div>
              <button onClick={() => setShowRequests((value) => !value)} aria-expanded={showRequests} aria-controls="support-requests">{showRequests ? "Hide requests" : "View requests"} ›</button>
            </div>
            {showRequests && <aside id="support-requests" className={styles.requests}>
              {!tickets.length && <p>No requests yet.</p>}
              {tickets.map((t) => (
                <button
                  key={t.id}
                  className={styles.ticket}
                  aria-pressed={activeId === t.id}
                  onClick={() => {
                    setActiveId(t.id);
                    setReply("");
                    setReplyAttachments([]);
                  }}
                >
                  <span>{t.subject}</span>
                  <small>
                    {t.status} · {t.ticketNumber}
                  </small>
                  <small>
                    {t.updatedAt ? new Date(t.updatedAt).toLocaleString() : ""}
                  </small>
                </button>
              ))}
            </aside>}
          </div>
          {showRequests && active && (
            <section className={styles.conversation}>
              <h2>{active.subject}</h2>
              <p>
                {active.status} · {active.ticketNumber}
              </p>
              {active.messages.map((m, i) => (
                <article
                  className={`${styles.message} ${m.sender === "support" ? styles.support : styles.customer}`}
                  key={m.id || m.time + "-" + i}
                >
                  <strong>
                    {m.sender === "support" ? "OVIA Client Services" : "You"}
                  </strong>
                  <p style={{ whiteSpace: "pre-wrap" }}>{m.text}</p>
                  <small>{new Date(m.time).toLocaleString()}</small>
                  {m.attachments?.map((id, i) => (
                    <p key={id}>
                      <a
                        href={
                          "/api/support/attachments/" + encodeURIComponent(id)
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Download attachment {i + 1}
                      </a>
                    </p>
                  ))}
                </article>
              ))}
              {active.status !== "Closed" && (
                <form
                  className={styles.form}
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (busy || uploading) return;
                    setBusy(true);
                    setError("");
                    if (
                      !replyKey.current ||
                      replyKey.current.text !==
                        JSON.stringify([reply, replyAttachments]) ||
                      replyKey.current.ticketId !== active.id
                    )
                      replyKey.current = {
                        id: crypto.randomUUID(),
                        text: JSON.stringify([reply, replyAttachments]),
                        ticketId: active.id,
                      };
                    try {
                      const result = await request<Conversation[]>(
                        "support/conversations",
                        "POST",
                        {
                          ticketId: active.id,
                          text: reply,
                          requestId: replyKey.current.id,
                          attachments: replyAttachments,
                        },
                      );
                      setTickets(result);
                      setReply("");
                      setReplyAttachments([]);
                      replyKey.current = null;
                      setNotice("Reply saved and OVIA notified.");
                    } catch (e) {
                      setError(
                        e instanceof Error
                          ? e.message
                          : "Reply could not be saved.",
                      );
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  <label>
                    Reply
                    <textarea
                      aria-label="Reply to OVIA"
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      maxLength={4000}
                      required
                    />
                  </label>
                  <SupportAttachmentPicker
                    value={replyAttachments}
                    onChange={setReplyAttachments}
                    disabled={busy}
                    onBusyChange={setUploading}
                  />
                  <button
                    className={styles.send}
                    disabled={busy || uploading || !reply.trim()}
                  >
                    Send reply
                  </button>
                </form>
              )}
            </section>
          )}
        </>
      )}
      {error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
      <Link className="text-link" href="/help">
        Explore help & FAQs
      </Link>
    </section>
  );
}
