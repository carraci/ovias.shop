"use client";

import { useEffect, useState, useCallback, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Lock,
  KeyRound,
  Smartphone,
  Laptop,
  Tablet,
  CheckCircle2,
  AlertCircle,
  MapPin,
  CreditCard,
  Package,
  HelpCircle,
  LogOut,
  Globe,
  Clock,
} from "lucide-react";
import { SocialSignInButtons } from "./social-sign-in-buttons";
import { request, useStore } from "./store-provider";
import styles from "./account-security.module.css";

const navigation = [
  { section: "overview", label: "Overview", href: "/account" },
  { section: "details", label: "My Profile", href: "/account/details" },
  { section: "orders", label: "My Orders", href: "/account/orders" },
  { section: "wishlist", label: "My Wishlist", href: "/account/wishlist" },
  {
    section: "appointments",
    label: "My Appointments",
    href: "/account/appointments",
  },
  {
    section: "reviews",
    label: "My Reviews",
    href: "/account/reviews",
  },
];

export type DeviceSession = {
  id: string;
  device: string;
  browser: string;
  os: string;
  deviceType: "desktop" | "mobile" | "tablet";
  location: string;
  ip: string;
  isCurrent: boolean;
  createdAt: string;
  lastActiveAt?: string;
};

type SecurityState = {
  verified: boolean;
  activeSessions: number;
  sessions?: DeviceSession[];
  termsVersion: string;
  passwordChangedAt?: string;
};

function formatSessionDate(dateStr?: string) {
  if (!dateStr) return "Recently";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

export function AccountSecurity() {
  const { user, refresh } = useStore();
  const router = useRouter();
  const [state, setState] = useState<SecurityState | null>(null);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [password, setPassword] = useState("");
  const [showSignoutConfirm, setShowSignoutConfirm] = useState(false);

  const loadSecurityState = useCallback(async () => {
    try {
      const data = await request<SecurityState>("care/security");
      setState(data);
    } catch (e) {
      setErrorMessage((e as Error).message);
    }
  }, []);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).has("social_linked")) {
      setMessage("Your Google sign-in provider is successfully connected.");
    }
    loadSecurityState();
  }, [loadSecurityState]);

  const handleResendVerification = async () => {
    setBusy(true);
    setMessage("");
    setErrorMessage("");
    try {
      const r = await request<{ message: string }>(
        "auth/resend-verification",
        "POST",
        { email: user?.email },
      );
      setMessage(r.message || "A verification email has been sent.");
    } catch (e) {
      setErrorMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleRevokeSingleSession = async (sessionId: string) => {
    setBusy(true);
    setMessage("");
    setErrorMessage("");
    try {
      await request("care/revoke-session", "POST", { sessionId });
      setMessage("Device session signed out successfully.");
      await loadSecurityState();
    } catch (e) {
      setErrorMessage((e as Error).message || "Failed to sign out device.");
    } finally {
      setBusy(false);
    }
  };

  const handleRevokeOtherSessions = async () => {
    setBusy(true);
    setMessage("");
    setErrorMessage("");
    try {
      const res = await request<{ message?: string }>("care/revoke-other-sessions", "POST", {});
      setMessage(res.message || "All other devices have been signed out.");
      await loadSecurityState();
    } catch (e) {
      setErrorMessage((e as Error).message || "Failed to sign out other devices.");
    } finally {
      setBusy(false);
    }
  };

  const handleRevokeAllSessions = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!password) {
      setErrorMessage("Please enter your current password to confirm.");
      return;
    }
    setBusy(true);
    setMessage("");
    setErrorMessage("");
    try {
      await request("care/revoke-sessions", "POST", { password });
      await refresh();
      router.push("/account/sign-in");
    } catch (e) {
      setErrorMessage((e as Error).message || "Password confirmation failed.");
      setBusy(false);
    }
  };

  const sessions = state?.sessions || [];
  const otherSessionsCount = sessions.filter((s) => !s.isCurrent).length;

  return (
    <div className={styles.page}>
      {/* Top Subnavigation */}
      <div className={styles.subnav}>
        <Link href="/account" className={styles.subnavBrand}>
          My <span>OVIA</span>
        </Link>
        <nav className={styles.navLinks} aria-label="Account navigation">
          {navigation.map((item) => (
            <Link
              key={item.section}
              href={item.href}
              className={styles.navLink}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Identity & Header */}
      <div className={styles.identity}>
        <p className={styles.eyebrow}>YOUR PERSONAL WORLD OF OVIA</p>
        <h1 className={styles.customerName}>Account Security</h1>
        <p className={styles.intro}>
          Review authentication credentials, verified devices, and real-time active sessions for your OVIA account.
        </p>
      </div>

      {/* Main Content */}
      <div className={styles.content}>
        {message && (
          <div className={styles.noticeBanner} role="status">
            <span>{message}</span>
            <button
              type="button"
              className={styles.textLink}
              onClick={() => setMessage("")}
            >
              Dismiss
            </button>
          </div>
        )}

        {errorMessage && (
          <div className={styles.errorBanner} role="alert">
            <span>{errorMessage}</span>
          </div>
        )}

        <div className={styles.grid}>
          {/* Card 1: Account Credentials */}
          <section className={styles.card} aria-label="Account Credentials">
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderLeft}>
                <span className={styles.cardIcon}>
                  <ShieldCheck size={22} strokeWidth={1.6} />
                </span>
                <h2 className={styles.cardTitle}>Credentials & Verification</h2>
              </div>
            </div>

            <div className={styles.cardBody}>
              <dl className={styles.detailList}>
                <div className={styles.detailRow}>
                  <dt className={styles.label}>Email Address</dt>
                  <dd className={styles.value}>
                    <span>{user?.email || "—"}</span>
                    {state?.verified ? (
                      <span className={styles.badgeVerified}>
                        <CheckCircle2 size={12} strokeWidth={2.2} /> Verified
                      </span>
                    ) : (
                      <span className={styles.badgePending}>
                        <AlertCircle size={12} strokeWidth={2.2} /> Unverified
                      </span>
                    )}
                  </dd>
                </div>

                <div className={styles.detailRow}>
                  <dt className={styles.label}>Password</dt>
                  <dd className={styles.value}>
                    <span>••••••••••••</span>
                    <Link
                      href="/account/forgot-password"
                      className={styles.textLink}
                      style={{ fontSize: "12px", marginLeft: "8px" }}
                    >
                      Reset password
                    </Link>
                  </dd>
                </div>

                <div className={styles.detailRow}>
                  <dt className={styles.label}>Privacy & Terms</dt>
                  <dd className={styles.value}>
                    <span style={{ fontSize: "13px", color: "#4b5563" }}>
                      Accepted ({state?.termsVersion || "Standard 2026.1"})
                    </span>
                  </dd>
                </div>
              </dl>
            </div>

            {!state?.verified && (
              <div className={styles.cardFooter}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  disabled={busy}
                  onClick={handleResendVerification}
                >
                  {busy ? "Sending…" : "Resend Verification Email"}
                </button>
              </div>
            )}
          </section>

          {/* Card 2: Connected Sign-In Options */}
          <section className={styles.card} aria-label="Connected Sign-In Options">
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderLeft}>
                <span className={styles.cardIcon}>
                  <KeyRound size={22} strokeWidth={1.6} />
                </span>
                <h2 className={styles.cardTitle}>Connected Sign-in Options</h2>
              </div>
            </div>

            <div className={styles.cardBody}>
              <p className={styles.mutedText} style={{ marginBottom: "18px" }}>
                Connect your social provider for fast, single-click authentication across all your devices with biometric and Google key security.
              </p>

              <div className={styles.socialBox}>
                <div className={styles.socialInfo}>
                  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
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
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z"
                    />
                  </svg>
                  <div>
                    <strong style={{ fontSize: "14px", display: "block" }}>
                      Google Account
                    </strong>
                    <span style={{ fontSize: "12px", color: "#6b7280" }}>
                      One-tap sign-in with your Google profile
                    </span>
                  </div>
                </div>

                <SocialSignInButtons linking />
              </div>
            </div>
          </section>

          {/* Card 3: Active Sessions & Real Devices */}
          <section className={`${styles.card} ${styles.fullWidth}`} aria-label="Device Sessions">
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderLeft}>
                <span className={styles.cardIcon}>
                  <Smartphone size={22} strokeWidth={1.6} />
                </span>
                <h2 className={styles.cardTitle}>Where You&apos;re Signed In</h2>
              </div>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                {otherSessionsCount > 0 && (
                  <button
                    type="button"
                    className={styles.revokeOtherBtn}
                    onClick={handleRevokeOtherSessions}
                    disabled={busy}
                    title="Sign out of all other browsers and devices"
                  >
                    Sign out other {otherSessionsCount} {otherSessionsCount === 1 ? "device" : "devices"}
                  </button>
                )}
                <span className={styles.badgeSession}>
                  {sessions.length || 1} Active {sessions.length === 1 ? "Device" : "Devices"}
                </span>
              </div>
            </div>

            <div className={styles.cardBody}>
              <p className={styles.mutedText} style={{ marginBottom: "18px" }}>
                You are currently signed into your OVIA account on these verified devices. If you see an unrecognized device or browser, sign it out immediately.
              </p>

              {/* Real Sessions List */}
              <div className={styles.sessionList}>
                {sessions.map((sess) => {
                  const isCurrent = sess.isCurrent;
                  const Icon =
                    sess.deviceType === "mobile"
                      ? Smartphone
                      : sess.deviceType === "tablet"
                        ? Tablet
                        : Laptop;

                  return (
                    <div
                      key={sess.id}
                      id={`session-${sess.id}`}
                      className={`${styles.sessionItem} ${isCurrent ? styles.sessionItemCurrent : ""}`}
                    >
                      <div className={styles.sessionLeft}>
                        <div className={styles.sessionIconBox}>
                          <Icon size={22} strokeWidth={1.6} />
                        </div>
                        <div className={styles.sessionDetails}>
                          <h3 className={styles.sessionItemTitle}>
                            <span>{sess.device || "Personal Computer"}</span>
                            {isCurrent && (
                              <span className={styles.currentBadge}>
                                <span className={styles.currentDot} /> This Device · Active Now
                              </span>
                            )}
                          </h3>
                          <p className={styles.sessionItemSub}>
                            <span>
                              {sess.browser || "Web Browser"} · {sess.os || "Desktop OS"}
                            </span>
                            <span>•</span>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                              <Globe size={11} /> {sess.location || "Mumbai, India"}
                            </span>
                            {!isCurrent && sess.lastActiveAt && (
                              <>
                                <span>•</span>
                                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                  <Clock size={11} /> Active {formatSessionDate(sess.lastActiveAt)}
                                </span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Right Action */}
                      {!isCurrent && (
                        <button
                          type="button"
                          className={styles.revokeBtn}
                          onClick={() => handleRevokeSingleSession(sess.id)}
                          disabled={busy}
                          title="Sign out this device"
                        >
                          Sign Out Device
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Sign Out Everywhere Section */}
              <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: "20px" }}>
                <h3 style={{ fontSize: "15px", fontWeight: 600, margin: "0 0 6px" }}>
                  Sign out of all devices
                </h3>
                <p className={styles.mutedText} style={{ marginBottom: "18px" }}>
                  Lost a device or want complete security reset? This action revokes all session tokens and signs out of all laptops, phones, and browsers, including this one.
                </p>

                {!showSignoutConfirm ? (
                  <button
                    type="button"
                    className={styles.dangerButton}
                    onClick={() => setShowSignoutConfirm(true)}
                  >
                    <LogOut size={15} style={{ marginRight: "8px" }} />
                    Sign Out All Devices
                  </button>
                ) : (
                  <form onSubmit={handleRevokeAllSessions} className={styles.formGrid} style={{ maxWidth: "460px" }}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel} htmlFor="signout-password">
                        Confirm Password
                      </label>
                      <input
                        id="signout-password"
                        name="password"
                        type="password"
                        className={styles.input}
                        required
                        placeholder="Enter your current password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        disabled={busy}
                      />
                    </div>

                    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                      <button
                        type="submit"
                        className={styles.dangerButton}
                        disabled={busy}
                      >
                        {busy ? "Revoking…" : "Confirm & Sign Out Everywhere"}
                      </button>
                      <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={() => {
                          setShowSignoutConfirm(false);
                          setPassword("");
                        }}
                        disabled={busy}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Bottom Utility Bar */}
        <nav className={styles.utilityLinks} aria-label="Account services">
          <Link href="/account/addresses" className={styles.utilityLink}>
            <MapPin size={16} />
            Address Book
          </Link>
          <Link href="/account/payments" className={styles.utilityLink}>
            <CreditCard size={16} />
            Payment Methods
          </Link>
          <Link
            href="/account/security"
            className={`${styles.utilityLink} ${styles.utilityLinkActive}`}
          >
            <ShieldCheck size={16} />
            Account Security
          </Link>
          <Link href="/account/support" className={styles.utilityLink}>
            <HelpCircle size={16} />
            Help & Support
          </Link>
        </nav>
      </div>
    </div>
  );
}

