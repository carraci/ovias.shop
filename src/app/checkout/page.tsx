"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type InputHTMLAttributes,
} from "react";
import {
  Lock,
  ArrowRight,
  ArrowLeft,
  Search,
  User,
  Heart,
  Truck,
  FileText,
  Eye,
  EyeOff,
  Tag,
  Check,
  X,
} from "lucide-react";
import {
  openRazorpay,
  PaymentDismissed,
  type RazorpaySession,
} from "@/lib/razorpay-browser";
import { ProductPhoto } from "@/components/product-photo";
import { request, useStore } from "@/components/store-provider";
import { money } from "@/lib/catalog-helpers";
import type { Address } from "@/lib/types";
import type {
  CheckoutQuote,
  PaymentSession,
  ShippingMethod,
} from "@/lib/checkout";
import styles from "./checkout.module.css";

const draftKey = "ovia-checkout-draft-v2";
const sessionKey = "ovia-checkout-payment-v2";

type Draft = {
  civility: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  region: string;
  postalCode: string;
};

const blank: Draft = {
  civility: "Mr",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  region: "Maharashtra",
  postalCode: "",
};

const states = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Chandigarh",
  "Jammu and Kashmir",
  "Ladakh",
  "Puducherry",
  "Andaman and Nicobar Islands",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Lakshadweep",
];

function Field({
  label,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className={styles.field} htmlFor={props.id}>
      <span>
        {label}
        {props.required && <span aria-hidden="true"> *</span>}
      </span>
      <input {...props} />
    </label>
  );
}

function addressView(address: Address & { civility?: string }) {
  const prefix = address.civility ? `${address.civility} ` : "";
  return (
    <>
      <strong>
        {prefix}
        {address.name}
      </strong>
      <p>
        {address.line1}
        {address.line2 && (
          <>
            <br />
            {address.line2}
          </>
        )}
        <br />
        {address.city}, {address.region} {address.postalCode}
        <br />
        India
      </p>
    </>
  );
}

export default function Checkout() {
  const { cart, user, refresh } = useStore();
  const router = useRouter();
  const heading = useRef<HTMLHeadingElement>(null);
  const [draft, setDraft] = useState<Draft>(blank);
  const [step, setStep] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [shippingMethod, setShippingMethod] =
    useState<ShippingMethod>("standard");
  const [quote, setQuote] = useState<CheckoutQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState("");
  const [quoteRetry, setQuoteRetry] = useState(0);
  const [session, setSession] = useState<PaymentSession | null>(null);
  const [busy, setBusy] = useState(false);
  const [recovering, setRecovering] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [promoDraft, setPromoDraft] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promoError, setPromoError] = useState("");
  const [promoSuccessMsg, setPromoSuccessMsg] = useState("");
  const [promoApplying, setPromoApplying] = useState(false);
  const [saveAddress, setSaveAddress] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<
    (Address & { id: string })[] | null
  >(null);
  const [addressLoading, setAddressLoading] = useState(false);

  // Accordion UI state matching Screenshots
  const [emailConfirmed, setEmailConfirmed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordDraft, setPasswordDraft] = useState("");
  const [manualAddress, setManualAddress] = useState(true);
  const [sameBilling, setSameBilling] = useState(true);

  const [paymentOption, setPaymentOption] = useState<
    "upi" | "card" | "netbanking"
  >("upi");
  const [providerReady, setProviderReady] = useState(false);
  const [pincodeChecking, setPincodeChecking] = useState(false);
  const [serviceability, setServiceability] = useState<{
    checked: boolean;
    serviceable: boolean;
    city?: string;
    state?: string;
    prepaidAvailable?: boolean;
    codAvailable?: boolean;
  } | null>(null);

  useEffect(() => {
    const pin = draft.postalCode.trim();
    if (!/^[1-9][0-9]{5}$/.test(pin)) {
      setServiceability(null);
      return;
    }

    let active = true;
    setPincodeChecking(true);

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/v1/shipping/serviceability?pincode=${encodeURIComponent(pin)}`);
        const payload = await res.json();
        const data = payload.data ?? payload;
        if (active) {
          if (res.ok && data && data.serviceable) {
            setServiceability({
              checked: true,
              serviceable: true,
              city: data.city,
              state: data.state,
              prepaidAvailable: data.prepaidAvailable,
              codAvailable: data.codAvailable,
            });
            if (data.city && !draft.city.trim()) {
              setDraft((prev) => ({ ...prev, city: data.city }));
            }
          } else {
            setServiceability({
              checked: true,
              serviceable: false,
            });
          }
        }
      } catch {
        if (active) {
          setServiceability({
            checked: true,
            serviceable: false,
          });
        }
      } finally {
        if (active) setPincodeChecking(false);
      }
    }, 400);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [draft.postalCode]);

  const operation = useRef(false);
  const idempotency = useRef("");
  const addressSaved = useRef("");
  const activeQuote = session?.quote || quote;
  const lines = activeQuote?.lines || cart.lines;
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);
  const locked =
    !!session &&
    !["cancelled", "expired", "payment_failed"].includes(session.status);

  const address: Address = {
    name: `${draft.firstName.trim()} ${draft.lastName.trim()}`.trim(),
    email: draft.email.trim(),
    phone: draft.phone.trim(),
    line1: draft.line1.trim(),
    line2: draft.line2.trim() || undefined,
    city: draft.city.trim(),
    region: draft.region,
    postalCode: draft.postalCode.trim(),
    country: "IN",
  };
  const displayedAddress = session?.address || address;

  function storeSession(value: PaymentSession | null) {
    setSession(value);
    try {
      if (value) sessionStorage.setItem(sessionKey, value.id);
      else sessionStorage.removeItem(sessionKey);
    } catch {
      /* Server recovery works without browser storage. */
    }
  }

  function finish(value: PaymentSession) {
    storeSession(value);
    if (value.status === "paid") {
      try {
        sessionStorage.removeItem(draftKey);
        sessionStorage.removeItem(sessionKey);
      } catch {
        /* Storage is optional. */
      }
      void refresh();
      router.replace(`/orders/${value.id}/confirmation`);
      return;
    }
    if (["cancelled", "expired", "payment_failed"].includes(value.status)) {
      storeSession(null);
      idempotency.current = crypto.randomUUID();
      setNotice(
        value.status === "cancelled"
          ? "Payment cancelled. Your information is saved and your bag has not been charged."
          : "This attempt is closed. Please review your bag before retrying.",
      );
      setQuoteRetry((v) => v + 1);
    } else if (value.status === "refund_required")
      setError(
        "Your payment needs a review by OVIA. Please contact support with your order number; do not pay again.",
      );
    else if (value.status === "payment_pending")
      setNotice(
        "Your payment is pending. We’ll confirm the order only after Razorpay confirms capture. Do not start another payment.",
      );
  }

  useEffect(() => {
    try {
      const stored = JSON.parse(sessionStorage.getItem(draftKey) || "null");
      if (stored && Date.now() - stored.savedAt < 86400000) {
        const values = { ...blank };
        for (const key of Object.keys(blank) as (keyof Draft)[])
          if (
            typeof stored.draft?.[key] === "string" &&
            stored.draft[key].length <= 200
          )
            values[key] = stored.draft[key];
        setDraft(values);
        if (values.email) setEmailConfirmed(true);
        setStep(Math.max(0, Math.min(3, Number(stored.step) || 0)));
        if (stored.shippingMethod === "express") setShippingMethod("express");
        if (
          typeof stored.promoCode === "string" &&
          stored.promoCode.length <= 40
        ) {
          setPromoCode(stored.promoCode);
          setPromoDraft(stored.promoCode);
        }
        idempotency.current = /^[0-9a-f-]{36}$/i.test(stored.key || "")
          ? stored.key
          : crypto.randomUUID();
      }
    } catch {
      /* Malformed storage must not break checkout. */
    }
    idempotency.current ||= crypto.randomUUID();
    setHydrated(true);
    let cancelled = false;

    async function recover() {
      try {
        const params = new URLSearchParams(window.location.search);
        let storedId: string | null = null;
        try {
          storedId = sessionStorage.getItem(sessionKey);
        } catch {
          /* Use server session. */
        }
        const id = params.get("order") || storedId;
        const config = await request<{ ready: boolean }>(
          "payments/razorpay/config",
        );
        if (cancelled) return;
        setProviderReady(config.ready);
        if (!config.ready && !params.has("paypal")) {
          setError(
            "Secure payments are temporarily unavailable. Please try again later.",
          );
          return;
        }
        const legacy = params.has("paypal");
        const sessionPath = legacy
          ? "checkout/session"
          : "payments/razorpay/sessions";
        let current = await request<PaymentSession | null>(
          id ? `${sessionPath}/${encodeURIComponent(id)}` : sessionPath,
        );
        if (cancelled) return;
        if (current) {
          setStep(3);
          storeSession(current);
          if (params.get("paypal") === "cancel")
            current = await request<PaymentSession>(
              `checkout/cancel/${current.id}`,
              "POST",
            );
          else if (
            params.get("paypal") === "return" &&
            current.status !== "paid"
          )
            current = await request<PaymentSession>(
              `checkout/capture/${current.id}`,
              "POST",
            );
          if (!cancelled) finish(current);
          if (current.status === "paid") return;
        }
        if (params.has("paypal"))
          window.history.replaceState(null, "", "/checkout");
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setRecovering(false);
      }
    }
    void recover();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!user || !hydrated) return;
    setDraft((value) => {
      const parts = user.name.split(" ");
      return {
        ...value,
        firstName: value.firstName || parts[0],
        lastName: value.lastName || parts.slice(1).join(" "),
        email: value.email || user.email,
      };
    });
    setEmailConfirmed(true);
  }, [user, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(
        draftKey,
        JSON.stringify({
          draft,
          step,
          shippingMethod,
          promoCode,
          key: idempotency.current,
          savedAt: Date.now(),
        }),
      );
    } catch {
      /* Storage is optional. */
    }
  }, [draft, step, shippingMethod, promoCode, hydrated]);

  useEffect(() => {
    if (!hydrated || locked || !cart.lines.length) {
      setQuoteLoading(false);
      if (locked) setQuoteError("");
      if (!cart.lines.length && !locked) setQuote(null);
      return;
    }
    let cancelled = false;
    setQuoteLoading(true);
    setQuoteError("");
    setQuote(null);
    request<CheckoutQuote>("checkout/quote", "POST", {
      shippingMethod,
      ...(promoCode ? { promoCode } : {}),
      customerEmail: draft.email || user?.email || undefined,
    })
      .then((value) => {
        if (!cancelled) setQuote(value);
      })
      .catch((e) => {
        if (!cancelled) {
          setQuoteError((e as Error).message);
          if (promoCode) {
            setPromoError((e as Error).message);
          }
        }
      })
      .finally(() => {
        if (!cancelled) setQuoteLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [
    cart.version,
    cart.lines.length,
    shippingMethod,
    promoCode,
    draft.email,
    user?.email,
    hydrated,
    locked,
    quoteRetry,
  ]);

  async function handleApplyCoupon() {
    const code = promoDraft.trim().toUpperCase();
    if (!code) return;
    setPromoError("");
    setPromoSuccessMsg("");
    setPromoApplying(true);
    try {
      const email = draft.email || user?.email || undefined;
      const res = await request<CheckoutQuote>("checkout/quote", "POST", {
        shippingMethod,
        promoCode: code,
        customerEmail: email,
      });
      setPromoCode(code);
      setQuote(res);
      setQuoteError("");
      setPromoSuccessMsg(`Coupon "${code}" applied successfully!`);
    } catch (e: any) {
      setPromoError(e.message || "Failed to apply coupon.");
    } finally {
      setPromoApplying(false);
    }
  }

  function handleRemoveCoupon() {
    setPromoCode("");
    setPromoDraft("");
    setPromoError("");
    setPromoSuccessMsg("");
    setQuoteRetry((v) => v + 1);
  }

  function update(key: keyof Draft, value: string) {
    setDraft((previous) => ({ ...previous, [key]: value }));
  }

  function go(next: number) {
    setStep(next);
    setError("");
    requestAnimationFrame(() => heading.current?.focus());
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  async function saved() {
    if (!user) {
      router.push("/account/sign-in?next=/checkout");
      return;
    }
    setAddressLoading(true);
    setError("");
    try {
      setSavedAddresses(
        await request<(Address & { id: string })[]>("account/addresses"),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setAddressLoading(false);
    }
  }

  async function checkPayment() {
    if (!session || operation.current) return;
    operation.current = true;
    setBusy(true);
    setError("");
    try {
      const path =
        session.provider === "razorpay"
          ? "payments/razorpay/sessions"
          : "checkout/session";
      const result = await request<PaymentSession>(`${path}/${session.id}`);
      finish(result);
      if (result.status === "pending")
        setNotice(
          "Payment is not yet confirmed. You can retry securely with this order.",
        );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      operation.current = false;
      setBusy(false);
    }
  }

  async function executeOrder() {
    if (!activeQuote || (!providerReady && activeQuote.total > 0) || operation.current) return;
    operation.current = true;
    setBusy(true);
    setError("");
    setNotice(activeQuote.total === 0 ? "Confirming your free order…" : "Opening secure Razorpay checkout…");
    try {
      if (session && session.provider !== "razorpay")
        throw new Error(
          "Please check your existing payment status before starting another payment.",
        );
      const signature = JSON.stringify(address);
      if (
        !session &&
        saveAddress &&
        user &&
        addressSaved.current !== signature
      ) {
        await request("account/addresses", "POST", address);
        addressSaved.current = signature;
      }
      const current = session
        ? await request<RazorpaySession>(
            `payments/razorpay/sessions/${session.id}`,
          )
        : await request<RazorpaySession>("payments/razorpay/sessions", "POST", {
            address,
            idempotencyKey: idempotency.current,
            quoteId: activeQuote.id,
            shippingMethod,
            ...(promoCode ? { promoCode } : {}),
            market: "IN",
          });
      storeSession(current);
      if (current.status !== "pending") {
        finish(current);
        return;
      }
      if (!current.orderId || current.setupPending)
        throw new Error(
          "Payment setup requires a status check. Please contact OVIA support before paying.",
        );
      setNotice("Complete your payment in the secure Razorpay window.");
      const result = await openRazorpay(current, paymentOption);
      setNotice("Verifying your payment…");
      const verified = await request<PaymentSession>(
        "payments/razorpay/verify",
        "POST",
        {
          localOrderId: current.id,
          razorpay_order_id: result.razorpay_order_id,
          razorpay_payment_id: result.razorpay_payment_id,
          razorpay_signature: result.razorpay_signature,
        },
      );
      setNotice("");
      finish(verified);
      if (verified.status === "pending")
        setNotice(
          "Your payment is awaiting capture. Check payment status before retrying.",
        );
    } catch (e) {
      setNotice("");
      if (e instanceof PaymentDismissed) setNotice(e.message);
      else
        setError(
          (e as Error).message ||
            "Payment could not be confirmed. Please check payment status before retrying.",
        );
    } finally {
      operation.current = false;
      setBusy(false);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (operation.current || recovering || !activeQuote) return;

    // Step 0: Contact and Shipping address
    // Step 1: Delivery
    if (step < 2) {
      if (step === 0) {
        if (!emailConfirmed) {
          if (!draft.email || !draft.email.includes("@")) {
            setError("Please enter a valid email address.");
            const input = document.getElementById(
              "emailAddress",
            ) as HTMLInputElement;
            input?.focus();
            return;
          }
          setEmailConfirmed(true);
          return;
        }

        // Validate required address fields
        if (!draft.firstName.trim()) {
          setError("Please enter your first name.");
          const input = document.getElementById(
            "firstName",
          ) as HTMLInputElement;
          input?.focus();
          return;
        }
        if (!draft.lastName.trim()) {
          setError("Please enter your last name.");
          const input = document.getElementById("lastName") as HTMLInputElement;
          input?.focus();
          return;
        }
        if (!draft.line1.trim() || draft.line1.trim().length < 5) {
          setError("Please enter your street address.");
          const input = document.getElementById(
            "streetAddress",
          ) as HTMLInputElement;
          input?.focus();
          return;
        }
        if (
          !draft.postalCode.trim() ||
          !/^[1-9][0-9]{5}$/.test(draft.postalCode.trim())
        ) {
          setError(
            "Please enter a valid 6-digit Indian PIN code (e.g. 400001).",
          );
          const input = document.getElementById("pinCode") as HTMLInputElement;
          input?.focus();
          return;
        }
        if (!draft.city.trim()) {
          setError("Please enter your city.");
          const input = document.getElementById("city") as HTMLInputElement;
          input?.focus();
          return;
        }
        if (!draft.phone.trim() || draft.phone.replace(/\D/g, "").length < 10) {
          setError("Please enter a valid 10-digit Indian mobile number.");
          const input = document.getElementById(
            "phoneNumber",
          ) as HTMLInputElement;
          input?.focus();
          return;
        }
      }

      go(step + 1);
      return;
    }

    if (step === 2) {
      go(3);
      return;
    }
    await executeOrder();
  }

  const title = [
    "Your information",
    "Shipping",
    "Payment",
    "Review your order",
  ][step];
  const disabled =
    busy || recovering || quoteLoading || !activeQuote || !lines.length;

  return (
    <div className={styles.checkoutContainer}>
      {/* Top Luxury Header */}
      <header className={styles.topHeader}>
        <div className={styles.headerLeft}>
          <Link href="/cart" className={styles.returnToBagLink}>
            Return to bag
          </Link>
        </div>
        <Link href="/" className={styles.brandLogo} aria-label="OVIA Home">
          OVIA
        </Link>
        <div className={styles.headerRight}>
          <div className={styles.searchBar}>
            <Search size={14} className={styles.searchIcon} />
            <span>Search</span>
          </div>
          <Link
            href="/account"
            className={styles.headerIconBtn}
            aria-label="Account"
          >
            <User size={18} strokeWidth={1.5} />
          </Link>
          <Link
            href="/account/wishlist"
            className={styles.headerIconBtn}
            aria-label="Wishlist"
          >
            <Heart size={18} strokeWidth={1.5} />
          </Link>
        </div>
      </header>

      {/* Prominent CHECKOUT Title Header (matching ASCII diagram: ┌── CHECKOUT ──┐) */}
      <div className={styles.checkoutPageHeading}>
        <span>CHECKOUT</span>
        <span className={styles.checkoutPageSubtitle}>
          <Lock
            size={12}
            style={{
              display: "inline",
              verticalAlign: "middle",
              marginRight: 5,
            }}
          />
          256-Bit SSL Encrypted
        </span>
      </div>

      {/* Main Accessible Heading for Tests */}
      <h1 className={styles.srHeading} ref={heading} tabIndex={-1}>
        {title}
      </h1>

      <div className={styles.mainLayout}>
        <section className={styles.formCol} aria-label="Checkout details">
          {recovering && <p role="status">Recovering your checkout…</p>}
          {error && (
            <div className={styles.error} role="alert">
              {error}
            </div>
          )}
          {notice && (
            <p className={styles.notice} role="status">
              {notice}
            </p>
          )}
          {quoteError && (
            <div className={styles.error} role="alert">
              {quoteError}
              <button
                type="button"
                className={styles.changeBtn}
                onClick={() => {
                  if (promoCode) setPromoCode("");
                  else setQuoteRetry((v) => v + 1);
                }}
              >
                Refresh pricing{promoCode ? " without this promo" : ""}
              </button>
            </div>
          )}

          <form id="checkout-form" onSubmit={submit} aria-busy={busy}>
            <fieldset disabled={busy || locked} className={styles.formFieldset}>
              {/* 1. CONTACT */}
              <div className={styles.stepAccordion}>
                <div className={styles.stepTitleRow}>
                  <span
                    className={`${styles.stepNumCircle} ${step === 0 && !emailConfirmed ? styles.stepNumActive : ""}`}
                  >
                    1
                  </span>
                  <h2 className={styles.stepHeading}>Contact</h2>
                </div>

                {step > 0 || (step === 0 && emailConfirmed) ? (
                  <div className={styles.stepCompletedBox}>
                    <div className={styles.completedRow}>
                      <span className={styles.completedTitle}>
                        {user ? "Account details" : "Guest details"}
                      </span>
                      <button
                        type="button"
                        className={styles.editBtn}
                        onClick={() => {
                          setEmailConfirmed(false);
                          go(0);
                        }}
                      >
                        Edit
                      </button>
                    </div>
                    <p className={styles.completedText}>
                      You are now continuing with:{" "}
                      {draft.email || "guest@ovias.shop"}
                    </p>
                  </div>
                ) : (
                  <div>
                    <h3 className={styles.subheading} style={{ marginTop: 0 }}>
                      Email Address
                    </h3>
                    <p className={styles.stepSubtitle}>
                      If you have an account, you will be asked to sign in.
                      Otherwise, you can continue as guest or create an account.
                    </p>

                    <Field
                      label="Email Address"
                      id="emailAddress"
                      type="email"
                      autoComplete="email"
                      required
                      maxLength={200}
                      value={draft.email}
                      onChange={(e) => update("email", e.target.value)}
                    />

                    {draft.email.includes("@") && draft.email.length > 5 && (
                      <div style={{ marginTop: 12 }}>
                        <label
                          className={styles.field}
                          htmlFor="accountPassword"
                        >
                          <span>
                            Password (optional if continuing as guest)
                          </span>
                          <div className={styles.passwordWrap}>
                            <input
                              id="accountPassword"
                              type={showPassword ? "text" : "password"}
                              className={styles.passwordInput}
                              placeholder="Enter password to sign in"
                              value={passwordDraft}
                              onChange={(e) => setPasswordDraft(e.target.value)}
                            />
                            <button
                              type="button"
                              className={styles.eyeToggle}
                              onClick={() => setShowPassword(!showPassword)}
                              aria-label="Toggle password visibility"
                            >
                              {showPassword ? (
                                <EyeOff size={16} />
                              ) : (
                                <Eye size={16} />
                              )}
                            </button>
                          </div>
                        </label>
                      </div>
                    )}

                    <button
                      type="button"
                      className={styles.primaryBlueBtn}
                      onClick={() => {
                        if (!draft.email || !draft.email.includes("@")) {
                          const input = document.getElementById(
                            "emailAddress",
                          ) as HTMLInputElement;
                          input?.focus();
                          return;
                        }
                        setEmailConfirmed(true);
                      }}
                    >
                      Next Step
                    </button>
                  </div>
                )}
              </div>

              {/* 2. SHIPPING ADDRESS */}
              <div className={styles.stepAccordion}>
                <div className={styles.stepTitleRow}>
                  <span
                    className={`${styles.stepNumCircle} ${step === 0 && emailConfirmed ? styles.stepNumActive : ""}`}
                  >
                    2
                  </span>
                  <h2 className={styles.stepHeading}>Shipping Address</h2>
                </div>

                {step > 0 ? (
                  <div className={styles.stepCompletedBox}>
                    <div className={styles.completedRow}>
                      <span className={styles.completedTitle}>
                        Delivery Address
                      </span>
                      <button
                        type="button"
                        className={styles.editBtn}
                        onClick={() => go(0)}
                      >
                        Edit
                      </button>
                    </div>
                    <p className={styles.completedText}>
                      {draft.civility} {draft.firstName} {draft.lastName}
                      <br />
                      {draft.line1}
                      {draft.line2 ? `, ${draft.line2}` : ""},{" "}
                      {draft.postalCode}, {draft.city}, {draft.region}, India
                      <br />
                      {draft.phone}
                    </p>
                  </div>
                ) : (
                  <div
                    style={{
                      display: emailConfirmed ? "block" : "none",
                    }}
                  >
                    <p className={styles.deliveryCountryNote}>
                      Your delivery address is currently in India.
                      <button
                        type="button"
                        className={styles.changeBtn}
                        onClick={() =>
                          alert(
                            "Deliveries are currently supported throughout India.",
                          )
                        }
                      >
                        Change
                      </button>
                    </p>

                    <h3 className={styles.subheading}>
                      Enter your delivery address:
                    </h3>

                    {/* Civility Dropdown */}
                    <label className={styles.field} htmlFor="civility">
                      <span>Civility *</span>
                      <select
                        id="civility"
                        value={draft.civility}
                        onChange={(e) => update("civility", e.target.value)}
                      >
                        <option value="Mr">Mr</option>
                        <option value="Mrs">Mrs</option>
                        <option value="Ms">Ms</option>
                        <option value="Dr">Dr</option>
                      </select>
                    </label>

                    {/* First & Last Name */}
                    <div className={styles.grid2}>
                      <Field
                        label="First Name"
                        id="firstName"
                        autoComplete="given-name"
                        required
                        maxLength={50}
                        value={draft.firstName}
                        onChange={(e) => update("firstName", e.target.value)}
                      />
                      <Field
                        label="Last Name"
                        id="lastName"
                        autoComplete="family-name"
                        required
                        maxLength={49}
                        value={draft.lastName}
                        onChange={(e) => update("lastName", e.target.value)}
                      />
                    </div>

                    {/* Street Address */}
                    <label className={styles.field} htmlFor="streetAddress">
                      <span>Street Address *</span>
                      <div className={styles.searchAddressWrap}>
                        <Search
                          size={15}
                          className={styles.searchAddressIcon}
                        />
                        <input
                          id="streetAddress"
                          autoComplete="address-line1"
                          required
                          minLength={5}
                          maxLength={200}
                          placeholder="Search for an address"
                          className={styles.searchAddressInput}
                          value={draft.line1}
                          onChange={(e) => update("line1", e.target.value)}
                        />
                      </div>
                    </label>

                    {/* Apartment / Suite */}
                    {manualAddress && (
                      <Field
                        label="Apt, Suite, Building (optional)"
                        id="addressLine2"
                        autoComplete="address-line2"
                        maxLength={200}
                        value={draft.line2}
                        onChange={(e) => update("line2", e.target.value)}
                      />
                    )}

                    {/* PIN Code & City */}
                    <div className={styles.grid2}>
                      <Field
                        label="PIN Code"
                        id="pinCode"
                        autoComplete="postal-code"
                        required
                        pattern="[1-9][0-9]{5}"
                        title="Enter a valid six-digit Indian PIN code"
                        maxLength={6}
                        inputMode="numeric"
                        value={draft.postalCode}
                        onChange={(e) => update("postalCode", e.target.value)}
                      />
                      <Field
                        label="City"
                        id="city"
                        autoComplete="address-level2"
                        required
                        minLength={2}
                        maxLength={100}
                        value={draft.city}
                        onChange={(e) => update("city", e.target.value)}
                      />
                    </div>

                    {/* PIN Code Serviceability Live Feedback */}
                    {pincodeChecking && (
                      <div style={{ fontSize: 12, color: "#6B6B6B", margin: "-6px 0 10px", display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", backgroundColor: "#3B82F6" }} />
                        Checking delivery serviceability for PIN {draft.postalCode}...
                      </div>
                    )}
                    {!pincodeChecking && serviceability && serviceability.serviceable && (
                      <div style={{ fontSize: 12, color: "#15803D", margin: "-6px 0 10px", display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ color: "#16A34A", fontWeight: 700 }}>✓</span>
                        Delhivery Express Delivery Available {serviceability.city ? `(${serviceability.city})` : ""}
                      </div>
                    )}
                    {!pincodeChecking && serviceability && !serviceability.serviceable && (
                      <div style={{ fontSize: 12, color: "#DC2626", margin: "-6px 0 10px", display: "flex", alignItems: "center", gap: 6 }}>
                        <span>⚠</span>
                        Delhivery courier service is currently restricted for PIN {draft.postalCode}.
                      </div>
                    )}

                    {/* State Dropdown */}
                    <label className={styles.field} htmlFor="state">
                      <span>State *</span>
                      <select
                        id="state"
                        required
                        autoComplete="address-level1"
                        value={draft.region}
                        onChange={(e) => update("region", e.target.value)}
                      >
                        {states.map((value) => (
                          <option key={value}>{value}</option>
                        ))}
                      </select>
                    </label>

                    {/* Country / Region */}
                    <label className={styles.field} htmlFor="country">
                      <span>Country / Region</span>
                      <select
                        id="country"
                        autoComplete="country"
                        defaultValue="IN"
                        disabled
                      >
                        <option value="IN">India</option>
                      </select>
                    </label>

                    {/* Phone Number */}
                    <Field
                      label="Phone *"
                      id="phoneNumber"
                      type="tel"
                      autoComplete="tel"
                      required
                      pattern={"(?:\\+91[ \\-]?)?[6-9][0-9]{9}"}
                      title="Enter a 10-digit Indian mobile number, optionally prefixed with +91"
                      value={draft.phone}
                      onChange={(e) => update("phone", e.target.value)}
                    />

                    {/* Billing address checkbox */}
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={sameBilling}
                        onChange={(e) => setSameBilling(e.target.checked)}
                      />
                      <span>Billing address: Same as delivery address</span>
                    </label>

                    {/* Next step button */}
                    <button
                      type="submit"
                      className={styles.primaryBlueBtn}
                      disabled={disabled}
                      aria-label="Continue to Shipping"
                    >
                      Next Step
                    </button>
                  </div>
                )}
              </div>

              {/* 3. DELIVERY */}
              <div className={styles.stepAccordion}>
                <div className={styles.stepTitleRow}>
                  <span
                    className={`${styles.stepNumCircle} ${step === 1 ? styles.stepNumActive : ""}`}
                  >
                    3
                  </span>
                  <h2 className={styles.stepHeading}>Delivery</h2>
                </div>

                {step > 1 ? (
                  <div className={styles.stepCompletedBox}>
                    <div className={styles.completedRow}>
                      <span className={styles.completedTitle}>
                        Delivery Method
                      </span>
                      <button
                        type="button"
                        className={styles.editBtn}
                        onClick={() => go(1)}
                      >
                        Edit
                      </button>
                    </div>
                    <p className={styles.completedText}>
                      {activeQuote?.shippingLabel} · {activeQuote?.estimate}
                    </p>
                  </div>
                ) : step === 1 ? (
                  <div>
                    <h3 className={styles.subheading} style={{ marginTop: 0 }}>
                      Select a delivery method
                    </h3>
                    <div
                      className={styles.deliveryMethodsList}
                      role="radiogroup"
                      aria-label="Shipping method"
                    >
                      {activeQuote?.shippingOptions.map((option) => (
                        <label
                          className={styles.deliveryMethodCard}
                          key={option.id}
                        >
                          <input
                            type="radio"
                            name="shipping"
                            checked={shippingMethod === option.id}
                            onChange={() => setShippingMethod(option.id)}
                          />
                          <div className={styles.methodDetails}>
                            <div className={styles.methodHeader}>
                              <span>{option.label}</span>
                              <span className={styles.methodCost}>
                                {option.cost ? money(option.cost) : "Free"}
                              </span>
                            </div>
                            <p className={styles.methodEstimate}>
                              {option.estimate}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>

                    <button
                      type="submit"
                      className={styles.primaryBlueBtn}
                      disabled={disabled}
                      aria-label="Continue to Payment"
                    >
                      Next Step
                    </button>
                  </div>
                ) : null}
              </div>

              <div className={styles.stepAccordion}>
                <div className={styles.stepTitleRow}>
                  <span
                    className={`${styles.stepNumCircle} ${step === 2 ? styles.stepNumActive : ""}`}
                  >
                    4
                  </span>
                  <h2 className={styles.stepHeading}>Payment</h2>
                </div>
                {step === 2 && (
                  <div>
                    <div
                      className={styles.paymentOptionsList}
                      role="radiogroup"
                      aria-label="Payment method"
                    >
                      {(
                        [
                          [
                            "upi",
                            "UPI",
                            "Use your preferred UPI app or scan a secure payment QR.",
                          ],
                          [
                            "card",
                            "Credit / Debit Card",
                            "Enter your card details in Razorpay’s secure checkout.",
                          ],
                          [
                            "netbanking",
                            "Net Banking",
                            "Authorise payment directly with your bank.",
                          ],
                        ] as const
                      ).map(([value, label, description]) => (
                        <label
                          key={value}
                          className={`${styles.deliveryMethodCard} ${paymentOption === value ? styles.paymentOptionCardSelected : ""}`}
                        >
                          <input
                            type="radio"
                            name="payment"
                            value={value}
                            checked={paymentOption === value}
                            onChange={() => setPaymentOption(value)}
                          />
                          <div>
                            <strong>{label}</strong>
                            <p className={styles.methodEstimate}>
                              {description}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                    <p className={styles.stepSubtitle}>
                      Payment details are entered securely with Razorpay after
                      you review your order. Available methods depend on your
                      Razorpay checkout.
                    </p>
                    <button
                      type="button"
                      className={styles.paySecurelyBtn}
                      disabled={busy}
                      onClick={() => go(3)}
                    >
                      Continue to Review <ArrowRight size={16} />
                    </button>
                  </div>
                )}
                {step === 3 && (
                  <p className={styles.completedText}>
                    {paymentOption === "upi"
                      ? "UPI"
                      : paymentOption === "card"
                        ? "Credit / Debit Card"
                        : "Net Banking"}{" "}
                    · Secure Razorpay checkout
                  </p>
                )}
              </div>
            </fieldset>
            {step === 3 && (
              <section
                className={styles.stepAccordion}
                aria-label="Order review"
              >
                <h2 className={styles.subheading}>Review your order</h2>
                <div className={styles.stepCompletedBox}>
                  <strong>Contact</strong>
                  <p>{displayedAddress.email}</p>
                </div>
                <div className={styles.stepCompletedBox}>
                  <strong>Delivery address</strong>
                  <div>{addressView(displayedAddress)}</div>
                </div>
                <div className={styles.stepCompletedBox}>
                  <strong>Shipping</strong>
                  <p>
                    {activeQuote?.shippingLabel} · {activeQuote?.estimate}
                  </p>
                </div>
                <div className={styles.stepCompletedBox}>
                  <strong>Total</strong>
                  <p>
                    {activeQuote ? money(activeQuote.total) : "Calculating…"}
                  </p>
                </div>
                <p className={styles.stepSubtitle}>
                  Your order is confirmed after Razorpay verifies that payment
                  has been captured.
                </p>
                <button
                  type="submit"
                  className={styles.paySecurelyBtn}
                  disabled={
                    disabled ||
                    (!providerReady && (activeQuote?.total ?? 1) > 0) ||
                    (!!session &&
                      (session.provider !== "razorpay" ||
                        session.status !== "pending"))
                  }
                >
                  <Lock size={16} />
                  {busy ? "Processing…" : activeQuote?.total === 0 ? "Place Free Order" : "Place Order"}
                </button>
                {session && (
                  <button
                    type="button"
                    className={styles.editBtn}
                    onClick={checkPayment}
                    disabled={busy}
                  >
                    Check payment status
                  </button>
                )}
                <p className={styles.stepSubtitle}>
                  By placing an order, you agree to OVIA’s{" "}
                  <Link href="/terms">Terms</Link> and{" "}
                  <Link href="/privacy">Privacy Policy</Link>.
                </p>
              </section>
            )}
          </form>

          {step > 0 && !locked && (
            <div style={{ marginTop: 20 }}>
              <button
                type="button"
                className={styles.editBtn}
                disabled={busy}
                onClick={() => go(step - 1)}
              >
                <ArrowLeft size={13} style={{ verticalAlign: "middle" }} />{" "}
                Return to{" "}
                {["", "Contact", "Shipping Address", "Delivery"][step]}
              </button>
            </div>
          )}
        </section>

        {/* RIGHT COLUMN: Order Summary Box (Matching Diagram) */}
        <aside className={styles.summaryAside} aria-label="Order Summary">
          <h2 className={styles.summaryTitle}>Order Summary</h2>

          <div id="checkout-summary" className={styles.orderCardBox}>
            <div className={styles.summaryItemsList}>
              {lines.map((line) => (
                <div className={styles.orderItemRow} key={line.sku}>
                  <div className={styles.itemThumb}>
                    <ProductPhoto
                      src={line.image}
                      alt={line.name}
                      fill
                      sizes="80px"
                      style={{ objectFit: "contain" }}
                    />
                  </div>
                  <div className={styles.itemMeta}>
                    <p className={styles.itemEyebrow}>CLASSIC</p>
                    <h4 className={styles.itemName}>{line.name}</h4>
                    <p className={styles.itemColor}>{line.color || "Silver"}</p>
                    <p className={styles.itemStockBadge}>LIMITED STOCK</p>
                    <p className={styles.itemQty}>Qty: {line.quantity}</p>
                  </div>
                  <div className={styles.itemPriceCol}>
                    {money(line.price * line.quantity)}
                  </div>
                </div>
              ))}
            </div>

            {/* PROMOTIONAL COUPON SECTION */}
            <div className={styles.couponBox}>
              <div className={styles.couponHeading}>
                <Tag size={13} color="#8E693E" />
                <span>Promotional Privilege / Coupon</span>
              </div>
              {!promoCode ? (
                <div className={styles.couponForm}>
                  <input
                    type="text"
                    placeholder="Enter coupon code"
                    value={promoDraft}
                    onChange={(e) => {
                      setPromoDraft(e.target.value.toUpperCase());
                      setPromoError("");
                      setPromoSuccessMsg("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleApplyCoupon();
                      }
                    }}
                    className={styles.couponInput}
                    aria-label="Promotional Coupon Code"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={!promoDraft.trim() || promoApplying}
                    className={styles.couponApplyBtn}
                  >
                    {promoApplying ? "Applying…" : "Apply"}
                  </button>
                </div>
              ) : (
                <div className={styles.couponActiveTag}>
                  <div className={styles.couponActiveInfo}>
                    <Check size={14} color="#16A34A" />
                    <span className={styles.couponActiveCode}>{promoCode}</span>
                    <span style={{ fontSize: 11, color: "#166534" }}>Applied</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className={styles.couponRemoveBtn}
                  >
                    Remove
                  </button>
                </div>
              )}
              {promoError && (
                <div className={styles.couponErrorMsg} role="alert">
                  {promoError}
                </div>
              )}
              {promoSuccessMsg && (
                <div className={styles.couponSuccessMsg} role="status">
                  {promoSuccessMsg}
                </div>
              )}
            </div>

            <div className={styles.breakdownSection}>
              <div className={styles.breakdownRow}>
                <span>Subtotal</span>
                <span>
                  {activeQuote
                    ? money(activeQuote.subtotal)
                    : money(cart.total)}
                </span>
              </div>
              <div className={styles.breakdownRow}>
                <span>Shipping</span>
                <span>
                  {activeQuote
                    ? activeQuote.shipping
                      ? money(activeQuote.shipping)
                      : "Free"
                    : "Calculating…"}
                </span>
              </div>
              <div className={styles.breakdownRow}>
                <span>Tax</span>
                <span>
                  {activeQuote ? money(activeQuote.tax) : "Calculating…"}
                </span>
              </div>
              {!!activeQuote?.discount && (
                <div className={styles.breakdownRow}>
                  <span>
                    Discount
                    {activeQuote.promoCode ? ` (${activeQuote.promoCode})` : ""}
                  </span>
                  <span>−{money(activeQuote.discount)}</span>
                </div>
              )}

              {/* User Diagram Divider: ───────────────────── */}
              <div className={styles.summaryDashedLine} />

              <div className={styles.breakdownTotalRow}>
                <span>Total</span>
                <span>
                  {activeQuote ? (activeQuote.total === 0 ? "Free (₹0)" : money(activeQuote.total)) : money(cart.total)}
                </span>
              </div>
              <div className={styles.salesTaxNote}>
                {activeQuote?.taxIncluded
                  ? "Inclusive of applicable taxes"
                  : "Includes calculated tax"}
              </div>
            </div>
          </div>

          {/* Delivery & Ethos Trust Information */}
          <div className={styles.trustList}>
            <div className={styles.trustItem}>
              <Truck size={17} strokeWidth={1.5} className={styles.trustIcon} />
              <p className={styles.trustText}>
                Please enjoy express deliveries on all orders
              </p>
            </div>
            <div className={styles.trustItem}>
              <FileText
                size={17}
                strokeWidth={1.5}
                className={styles.trustIcon}
              />
              <p className={styles.trustText}>
                All purchases/orders are solely processed and fulfilled by OVIA
                authorized partner Ethos, registered in India. OVIA does not
                process, fulfill or assume any responsibility or liability for
                such transactions.
              </p>
            </div>
          </div>

          {/* Accepted payment methods */}
          <div className={styles.acceptedSection}>
            <p className={styles.acceptedTitle}>Accepted payment methods</p>
            <div className={styles.badgesRow}>
              <span className={styles.paymentBadge}>Razorpay</span>
              <span className={styles.paymentBadge}>UPI</span>
              <span className={styles.paymentBadge}>Cards</span>
              <span className={styles.paymentBadge}>NetBanking</span>
            </div>
          </div>
        </aside>
      </div>

      {/* LUXURY 3-COLUMN FOOTER (Screenshots 1 & 2) */}
      <footer className={styles.checkoutFooter}>
        <div className={styles.footerInner}>
          <div className={styles.footerCol}>
            <h4>WE ACCEPT</h4>
            <p>Purchase with the payment method that best suits you.</p>
            <div className={styles.footerPayBadges}>
              <span className={styles.paymentBadge}>Razorpay</span>
              <span className={styles.paymentBadge}>UPI</span>
              <span className={styles.paymentBadge}>Cards</span>
            </div>
          </div>
          <div className={styles.footerCol}>
            <h4>COMPLIMENTARY RETURNS</h4>
            <p>
              We’re confident you’ll love your new OVIA. But if you’re not
              entirely happy, you can return it free of charge.
            </p>
          </div>
          <div className={styles.footerCol}>
            <h4>CAN WE HELP?</h4>
            <p>
              For inquiries or assistance do not hesitate to{" "}
              <Link href="/contact-us">contact us</Link> or call us{" "}
              <a href="tel:+918796813891">+918796813891</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
