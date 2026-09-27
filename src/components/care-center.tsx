"use client";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { request, useStore } from "./store-provider";
import {
  supportCategories,
  privacyTypes,
  type CareTicket,
  type PrivacyRequest,
  faqs,
} from "@/lib/care";
import type { Order } from "@/lib/types";
export function HelpCenter() {
  useEffect(() => {
    const open = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      const target = document.getElementById(id);
      if (target instanceof HTMLDetailsElement) target.open = true;
    };
    open();
    window.addEventListener("hashchange", open);
    return () => window.removeEventListener("hashchange", open);
  }, []);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("All");
  const filtered = faqs.filter(
    (f) =>
      (category === "All" || f.category === category) &&
      `${f.question} ${f.answer} ${f.category}`
        .toLowerCase()
        .includes(q.toLowerCase()),
  );
  return (
    <section className="section help-page">
      <p className="eyebrow">AT YOUR SERVICE</p>
      <h1>
        A little help <em>along the way.</em>
      </h1>
      <label className="help-search">
        How can we help?
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search orders, shipping, account…"
        />
      </label>
      <div className="help-links">
        {[
          ["Contact & tickets", "/contact"],
          ["Track order", "/track-order"],
          ["Shipping & delivery", "/shipping"],
          ["Returns & refunds", "/returns"],
          ["Account security", "/account/security"],
          ["Privacy Center", "/legal"],
        ].map(([label, href]) => (
          <Link key={href} href={href}>
            {label}
            <span>↗</span>
          </Link>
        ))}
      </div>
      <div className="faq-filters" aria-label="FAQ categories">
        {["All", ...new Set(faqs.map((f) => f.category))].map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            aria-pressed={category === c}
          >
            {c}
          </button>
        ))}
      </div>
      <p aria-live="polite">{filtered.length} answers</p>
      <div className="faq-list">
        {filtered.map((f) => (
          <details key={f.slug} id={f.slug}>
            <summary>{f.question}</summary>
            <p>{f.answer}</p>
            <Link href={`/faq#${f.slug}`} className="small-note">
              Link to this answer
            </Link>
          </details>
        ))}
      </div>
      {!filtered.length && (
        <p>No matching answers. Try another search or contact support.</p>
      )}
    </section>
  );
}
function SignInNotice() {
  return (
    <div className="empty-state">
      <h2>A personal space for your requests.</h2>
      <p>Sign in to securely view and manage your own information.</p>
      <Link className="button dark" href="/account/sign-in">
        Sign in
      </Link>{" "}
      <Link className="text-link" href="/account/register">
        Create an account
      </Link>
    </div>
  );
}
export function SupportDesk() {
  const { user } = useStore();
  const [tickets, setTickets] = useState<CareTicket[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [active, setActive] = useState<CareTicket | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const key = useRef<string | null>(null);
  const replyKey = useRef<string | null>(null);
  async function load() {
    const [t, o] = await Promise.all([
      request<CareTicket[]>("care/tickets"),
      request<Order[]>("account/orders"),
    ]);
    setTickets(t);
    setOrders(o);
  }
  useEffect(() => {
    if (user) load().catch((e) => setMessage(e.message));
  }, [user?.id]);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    const form = e.currentTarget;
    key.current ??= crypto.randomUUID();
    try {
      const result = await request<CareTicket>("care/tickets", "POST", {
        ...Object.fromEntries(new FormData(form)),
        idempotencyKey: key.current,
      });
      key.current = null;
      form.reset();
      setMessage(
        `Request ${result.id.slice(0, 8)} saved. You can follow the conversation below.`,
      );
      await load();
      setActive(result);
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="section care-page">
      <p className="eyebrow">CLIENT SERVICES</p>
      <h1>
        Let’s <em>talk.</em>
      </h1>
      <p>Keep your questions and conversations together in one secure place.</p>
      {!user ? (
        <SignInNotice />
      ) : (
        <>
          <div className="care-layout">
            <form className="form" onSubmit={submit}>
              <p>
                Writing as {user.name} · {user.email}
              </p>
              <label>
                Category
                <select name="category">
                  {supportCategories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label>
                Related order (optional)
                <select name="orderId">
                  <option value="">No order</option>
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.id.slice(0, 8)} · {o.status}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Subject
                <input name="subject" required minLength={3} maxLength={150} />
              </label>
              <label>
                Message
                <textarea
                  name="message"
                  required
                  minLength={10}
                  maxLength={3000}
                  rows={6}
                />
              </label>
              <p className="small-note">
                Never include passwords, verification codes or complete
                payment-card details. Private file attachments are not enabled.
              </p>
              <button className="button dark" disabled={busy}>
                {busy ? "Saving…" : "Create support request"}
              </button>
            </form>
            <aside>
              <h2>Your requests</h2>
              {!tickets.length && <p>No support requests yet.</p>}
              {tickets.map((t) => (
                <button
                  className="ticket-row"
                  key={t.id}
                  onClick={() => setActive(t)}
                >
                  <span>{t.subject}</span>
                  <small>
                    {t.status} · {t.id.slice(0, 8)}
                  </small>
                </button>
              ))}
            </aside>
          </div>
          {active && (
            <section className="conversation">
              <h2>{active.subject}</h2>
              <p>
                {active.status} · Reference {active.id.slice(0, 8)}
              </p>
              {active.messages.map((m) => (
                <div className="conversation-message" key={m.id}>
                  <strong>
                    {m.author === "support" ? "OVIA support" : "You"}
                  </strong>
                  <p>{m.text}</p>
                  <small>{new Date(m.createdAt).toLocaleString()}</small>
                </div>
              ))}
              {active.status !== "Closed" && (
                <form
                  className="form"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    setBusy(true);
                    replyKey.current ??= crypto.randomUUID();
                    try {
                      setActive(
                        await request<CareTicket>("care/reply", "POST", {
                          ticketId: active.id,
                          message: new FormData(form).get("message"),
                          idempotencyKey: replyKey.current,
                        }),
                      );
                      replyKey.current = null;
                      form.reset();
                      await load();
                    } catch (e) {
                      setMessage((e as Error).message);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  <label>
                    Reply
                    <textarea name="message" required maxLength={3000} />
                  </label>
                  <button className="button dark" disabled={busy}>
                    Send reply
                  </button>
                </form>
              )}
            </section>
          )}
        </>
      )}
      <p role="status">{message}</p>
      <Link className="text-link" href="/help">
        Explore help & FAQs ↗
      </Link>
    </section>
  );
}
export function PrivacyControls() {
  const { user } = useStore();
  const [requests, setRequests] = useState<PrivacyRequest[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const key = useRef<string | null>(null);
  useEffect(() => {
    if (user)
      request<PrivacyRequest[]>("care/privacy")
        .then(setRequests)
        .catch((e) => setMessage(e.message));
  }, [user?.id]);
  return (
    <section className="section care-page">
      <p className="eyebrow">YOUR INFORMATION</p>
      <h1>
        Your privacy. <em>Your choices.</em>
      </h1>
      {!user ? (
        <SignInNotice />
      ) : (
        <div className="care-layout">
          <div>
            <h2>Make a privacy request</h2>
            <p>
              Requests are recorded for review. Submitting a deletion request
              does not immediately erase your account or order records.
            </p>
            <form
              className="form"
              onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                key.current ??= crypto.randomUUID();
                const form = e.currentTarget;
                const data = Object.fromEntries(new FormData(form));
                try {
                  const r = await request<PrivacyRequest>(
                    "care/privacy",
                    "POST",
                    {
                      ...data,
                      confirmed: data.confirmed === "on",
                      idempotencyKey: key.current,
                    },
                  );
                  setRequests((prev) => [
                    r,
                    ...prev.filter((p) => p.id !== r.id),
                  ]);
                  key.current = null;
                  form.reset();
                  setMessage("Your request has been saved for review.");
                } catch (e) {
                  setMessage((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              <label>
                Request type
                <select name="requestType">
                  {privacyTypes.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </label>
              <label>
                Details (optional)
                <textarea name="message" maxLength={2000} />
              </label>
              <label>
                Confirm your password
                <input
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  required
                  maxLength={128}
                />
              </label>
              <label className="check-label">
                <input type="checkbox" name="confirmed" required />
                <span>I understand this submits a request for review.</span>
              </label>
              <button className="button dark" disabled={busy}>
                Submit privacy request
              </button>
            </form>
          </div>
          <aside>
            <h2>Download your data</h2>
            <p>
              Includes your profile, addresses, orders and support requests.
              Password hashes and session secrets are excluded.
            </p>
            <form
              className="form"
              onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                try {
                  const data = await request(
                    "care/export",
                    "POST",
                    Object.fromEntries(new FormData(e.currentTarget)),
                  );
                  const url = URL.createObjectURL(
                    new Blob([JSON.stringify(data, null, 2)], {
                      type: "application/json",
                    }),
                  );
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "ovia-my-data.json";
                  a.click();
                  setTimeout(() => URL.revokeObjectURL(url), 1000);
                  setMessage("Your data download is ready. Keep it private.");
                } catch (e) {
                  setMessage((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              <label>
                Password for download
                <input
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  maxLength={128}
                />
              </label>
              <button className="button dark" disabled={busy}>
                Download my data
              </button>
            </form>
            <h2>Your requests</h2>
            {requests.map((r) => (
              <p key={r.id}>
                {r.requestType} · {r.status}
                <br />
                <small>{r.id.slice(0, 8)}</small>
              </p>
            ))}
            {!requests.length && <p>No privacy requests yet.</p>}
          </aside>
        </div>
      )}
      <p role="status">{message}</p>
    </section>
  );
}
