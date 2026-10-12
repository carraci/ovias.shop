"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import styles from "./auth-social.module.css";

export function SocialSignInButtons({
  linking = false,
}: {
  linking?: boolean;
}) {
  const [providers, setProviders] = useState<{
    google: boolean;
    apple: boolean;
  } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/auth/social", { cache: "no-store", signal: controller.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((r) => setProviders(r.data))
      .catch(() => {
        if (!controller.signal.aborted)
          setError(
            "Sign-in options could not load. Please reload or use email and password.",
          );
      });
    const code = new URLSearchParams(window.location.search).get(
      "social_error",
    );
    const messages: Record<string, string> = {
      cancelled: "Sign-in was cancelled. You can try again.",
      expired: "This sign-in request expired. Please try again.",
      account_link:
        "An OVIA account already uses this email. Sign in with your password, then connect your provider in Account security.",
      linked_elsewhere: "This provider is connected to another OVIA account.",
      failed:
        "We could not complete sign-in. Please try again or use email and password.",
    };
    if (code) setError(messages[code] || messages.failed);
    return () => controller.abort();
  }, []);
  async function start(provider: "google" | "apple") {
    setBusy(provider);
    setError("");
    try {
      const response = await fetch(`/api/auth/social/${provider}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent: linking ? "link" : "signin",
          terms: "on",
        }),
        signal: AbortSignal.timeout(15000),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error?.message || "Please try again.");
      const url = new URL(result.data.url);
      if (
        url.protocol !== "https:" ||
        url.hostname !==
          (provider === "google" ? "accounts.google.com" : "appleid.apple.com")
      )
        throw new Error("Invalid sign-in destination.");
      window.location.assign(url.toString());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
      setBusy(null);
    }
  }
  const availabilityId = useId();
  return (
    <div className={styles.section}>
      {!linking && (
        <div className="ovia-auth-divider">
          <span>or</span>
        </div>
      )}
      <div className={styles.buttons} role="group" aria-label="Social sign-in">
        <button
          type="button"
          disabled={!providers?.google || !!busy}
          aria-describedby={availabilityId}
          onClick={() => start("google")}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.36Z"
            />
            <path
              fill="#34A853"
              d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.24-2.51c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.07v2.59A10 10 0 0 0 12 22Z"
            />
            <path
              fill="#FBBC05"
              d="M6.41 13.92a6 6 0 0 1 0-3.84V7.49H3.07a10 10 0 0 0 0 9.02l3.34-2.59Z"
            />
            <path
              fill="#EA4335"
              d="M12 5.96c1.47 0 2.79.51 3.82 1.51l2.87-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.93 5.49l3.34 2.59C7.2 7.72 9.4 5.96 12 5.96Z"
            />
          </svg>
          <span>
            {busy === "google"
              ? "Connecting…"
              : linking
                ? "Connect Google"
                : "Sign in with Google"}
          </span>
        </button>
        {providers?.apple && (
          <button
            type="button"
            disabled={!providers?.apple || !!busy}
            aria-describedby={availabilityId}
            onClick={() => start("apple")}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.77 3.08.83 1.17-.24 2.29-.96 3.54-.87 1.5.12 2.63.72 3.38 1.8-3.1 1.86-2.36 5.96.48 7.1-.57 1.49-1.3 2.98-2.49 4.12l.01-.01ZM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.28 2.58-2.34 4.5-3.74 4.25Z" />
            </svg>
            <span>
              {busy === "apple"
                ? "Connecting…"
                : linking
                  ? "Connect Apple"
                  : "Sign in with Apple"}
            </span>
          </button>
        )}
      </div>
      <p id={availabilityId} className={styles.note}>
        {!providers
          ? "Checking sign-in options…"
          : !providers.google && !providers.apple
            ? "Please use your email and password to sign in."
            : !providers.apple
              ? "Continue securely with Google."
              : !providers.google
                ? "Continue securely with Apple."
                : "Continue securely with your preferred account."}
      </p>
      <p className={styles.note}>
        By continuing, you agree to our <Link href="/terms">Terms</Link> and{" "}
        <Link href="/privacy">Privacy Policy</Link>.
      </p>
      {error && (
        <p className={styles.note} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
