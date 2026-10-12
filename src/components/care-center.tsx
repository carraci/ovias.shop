"use client";
import "@/components/page-styles/client-services.css";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { request, useStore } from "./store-provider";
import {
  supportCategories,
  privacyTypes,
  type CareTicket,
  type PrivacyRequest,
} from "@/lib/care";
import type { Order } from "@/lib/types";
export { HelpCenter } from "./help-center";
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
export { FullSupportDesk as SupportDesk } from "./full-support-desk";
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
