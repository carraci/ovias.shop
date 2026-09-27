"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { request } from "./store-provider";
export function AccountSecurity() {
  const [state, setState] = useState<{
    verified: boolean;
    activeSessions: number;
    termsVersion: string;
  } | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    request<typeof state>("care/security")
      .then(setState)
      .catch((e) => setMessage(e.message));
  }, []);
  return (
    <section className="section content-page">
      <p className="eyebrow">YOUR OVIA</p>
      <h1>
        Account <em>security.</em>
      </h1>
      {state && (
        <>
          <p>Email: {state.verified ? "Verified" : "Not verified"}</p>
          <p>Active sessions: {state.activeSessions}</p>
          <p className="small-note">Accepted terms: {state.termsVersion}</p>
          {!state.verified && (
            <button
              className="text-link"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  const r = await request<{ message: string }>(
                    "auth/resend-verification",
                    "POST",
                    {},
                  );
                  setMessage(r.message);
                } catch (e) {
                  setMessage((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              Resend verification email
            </button>
          )}
          <h2>Sign out all devices</h2>
          <p>This also signs you out of this browser.</p>
          <form
            className="form"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              try {
                await request(
                  "care/revoke-sessions",
                  "POST",
                  Object.fromEntries(new FormData(e.currentTarget)),
                );
                window.location.assign("/account/sign-in");
              } catch (e) {
                setMessage((e as Error).message);
                setBusy(false);
              }
            }}
          >
            <label>
              Confirm password
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
              />
            </label>
            <button className="button dark" disabled={busy}>
              Sign out all devices
            </button>
          </form>
        </>
      )}
      <p role="status">{message}</p>
      <Link href="/account/forgot-password" className="text-link">
        Reset password
      </Link>
    </section>
  );
}
