"use client";

import { usePreferences } from "@/components/preferences";
import Link from "next/link";
import { ProductPhoto as Image } from "@/components/product-photo";
import { useRouter } from "next/navigation";
import { useRef, useState, useEffect } from "react";
import {
  Lock,
  ArrowRight,
  Truck,
  Package,
  Store,
  CreditCard,
  Building,
  Wallet,
  CalendarDays,
  ShieldCheck,
  RotateCcw,
  Headphones,
  ChevronDown,
  Info,
  Minus,
  Plus,
} from "lucide-react";
import { money } from "@/lib/catalog";
import { request, useStore } from "@/components/store-provider";
import styles from "./checkout.module.css";

type PaymentResponse = {
  provider: string;
  url?: string;
  orderId?: string;
  key?: string;
  amount?: number;
  localOrderId?: string;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
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
  "Delhi",
];

export default function Checkout() {
  const { preferences } = usePreferences();
  const { cart, user, refresh, setQuantity } = useStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const key = useRef<string | null>(null);
  const router = useRouter();

  // Delivery options: 'standard' | 'express' | 'pickup'
  const [deliveryOption, setDeliveryOption] = useState<
    "standard" | "express" | "pickup"
  >("standard");

  // Payment method: 'upi' | 'card' | 'netbanking' | 'wallets' | 'emi'
  const [paymentMethod, setPaymentMethod] = useState<
    "upi" | "card" | "netbanking" | "wallets" | "emi"
  >("upi");

  // Promo code toggle & state
  const [promoOpen, setPromoOpen] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoMessage, setPromoMessage] = useState("");
  const saving = useRef(false);
  const savedAddress = useRef("");
  const [updatingQuantity, setUpdatingQuantity] = useState(false);

  // Form values state for shipping
  const [fullName, setFullName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateVal, setStateVal] = useState("Maharashtra");
  const [pinCode, setPinCode] = useState("");
  const [saveAddress, setSaveAddress] = useState(false);

  // Only server-priced cart lines can become an order.
  const hasCartItems = cart.lines.length > 0;
  const displayItems = cart.lines;
  const subtotal = cart.total;
  const deliveryCost = 0; // The existing API supports standard delivery only.
  const total = subtotal;
  const itemCount = displayItems.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    if (user) {
      setFullName((value) => value || user.name);
      setEmail((value) => value || user.email);
    }
  }, [user]);

  async function handleQtyChange(
    sku: string,
    currentQty: number,
    delta: number,
  ) {
    const next = currentQty + delta;
    if (next < 1 || next > 10 || updatingQuantity || busy) return;
    if (hasCartItems) {
      setUpdatingQuantity(true);
      try {
        await setQuantity(sku, next);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setUpdatingQuantity(false);
      }
    }
  }

  async function submit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (saving.current || updatingQuantity || !hasCartItems) return;
    saving.current = true;
    setError("");
    setBusy(true);
    key.current ??= crypto.randomUUID();

    try {
      const payloadAddress = {
        name: fullName.trim(),
        email: email.trim(),
        line1: address.trim(),
        city: city.trim(),
        region: stateVal,
        postalCode: pinCode.trim(),
        country: "IN" as const,
      };

      if (
        saveAddress &&
        user &&
        savedAddress.current !== JSON.stringify(payloadAddress)
      ) {
        await request("account/addresses", "POST", payloadAddress);
        savedAddress.current = JSON.stringify(payloadAddress);
      }
      const result = await request<PaymentResponse>("checkout", "POST", {
        address: payloadAddress,
        idempotencyKey: key.current,
        market: preferences.country,
      });

      if (result.provider === "razorpay") {
        if (!window.Razorpay) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve();
            script.onerror = () =>
              reject(new Error("Payment gateway could not load. Try again."));
            document.body.appendChild(script);
          });
        }
        const checkout = new window.Razorpay!({
          key: result.key,
          amount: result.amount,
          currency: "INR",
          name: "OVIA · Luxury Atelier",
          order_id: result.orderId,
          prefill: {
            name: payloadAddress.name,
            email: payloadAddress.email,
            contact: phone,
          },
          handler: () =>
            router.push(`/orders/${result.localOrderId}/confirmation`),
          modal: { ondismiss: () => setBusy(false) },
        });
        checkout.open();
      } else if (result.url?.startsWith("/")) {
        await refresh();
        router.push(result.url);
      } else if (
        result.url &&
        new URL(result.url).hostname === "checkout.stripe.com"
      ) {
        window.location.assign(result.url);
      } else {
        throw new Error("Payment session unavailable. Please retry.");
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }

  return (
    <div className={styles.checkoutContainer}>
      {/* 1. Dedicated Top Navigation Bar */}
      <header className={styles.topHeader}>
        <Link href="/" className={styles.brandLogo} aria-label="OVIA Home">
          <span className={styles.brandTitle}>OVIA</span>
        </Link>

        {/* 3-Step Progress Indicator */}
        <nav aria-label="Checkout Progress" className={styles.stepsNav}>
          <div className={`${styles.stepItem} ${styles.stepItemActive}`}>
            <span className={styles.stepCircle}>1</span>
            <span>SHIPPING</span>
          </div>
          <div className={styles.stepConnector} />
          <div className={styles.stepItem}>
            <span className={styles.stepCircle}>2</span>
            <span>PAYMENT</span>
          </div>
          <div className={styles.stepConnector} />
          <div className={styles.stepItem}>
            <span className={styles.stepCircle}>3</span>
            <span>REVIEW</span>
          </div>
        </nav>

        {/* Secure Checkout Trust Lock */}
        <div className={styles.secureBadge}>
          <Lock size={13} strokeWidth={2.5} />
          <span>SECURE CHECKOUT</span>
        </div>
      </header>

      {/* 2. 3-Column Luxury Layout */}
      <div className={styles.mainLayout}>
        {/* Left Column: Architectural Editorial Banner */}
        <aside
          className={styles.leftEditorialCol}
          aria-label="Editorial Brand Banner"
        >
          <div className={styles.editorialImageWrap}>
            <Image
              src={displayItems[0]?.image || ""}
              alt={displayItems[0]?.name || "Your journey with OVIA"}
              sizes="25vw"
              quality={90}
              fill
              priority
              style={{ objectFit: "cover" }}
            />
          </div>
          <div className={styles.editorialCopy}>
            <p>
              A MORE
              <br />
              INTENTIONAL
              <br />
              JOURNEY
            </p>
            <h2>
              Luxury in
              <br />
              every detail
            </h2>
            <span>OVIA</span>
          </div>
        </aside>

        {/* Center Column: Form & Selection Steps */}
        <div className={styles.centerFormCol}>
          {error && (
            <div className={styles.errorBanner} role="alert">
              {error}
            </div>
          )}

          <form id="checkout-form" onSubmit={submit} aria-busy={busy}>
            {/* Step 1: Shipping Information */}
            <section
              className={styles.sectionBlock}
              aria-labelledby="shipping-heading"
            >
              <div className={styles.sectionHeaderRow}>
                <h1 id="shipping-heading" className={styles.sectionHeading}>
                  1. Shipping Information
                </h1>
                <span className={styles.loginPrompt}>
                  Already have an account? <Link href="/login">Login</Link>
                </span>
              </div>
              <p className={styles.sectionSubtitle}>
                Where should we deliver your order?
              </p>

              <div className={styles.inputGrid2}>
                <div className={styles.formField}>
                  <label htmlFor="fullName" className={styles.formLabel}>
                    Full Name <span className={styles.requiredStar}>*</span>
                  </label>
                  <input
                    id="fullName"
                    name="name"
                    type="text"
                    required
                    minLength={2}
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={styles.textInput}
                    autoComplete="name"
                  />
                </div>

                <div className={styles.formField}>
                  <label htmlFor="phoneNumber" className={styles.formLabel}>
                    Phone Number <span className={styles.requiredStar}>*</span>
                  </label>
                  <div className={styles.phoneInputWrap}>
                    <div className={styles.phonePrefix}>
                      <span
                        className={styles.flagIcon}
                        style={{
                          background:
                            "linear-gradient(to bottom, #FF9933 33%, #FFFFFF 33%, #FFFFFF 66%, #138808 66%)",
                        }}
                      />
                      <span>+91</span>
                      <ChevronDown size={11} />
                    </div>
                    <input
                      id="phoneNumber"
                      name="phone"
                      type="tel"
                      required
                      placeholder="Enter phone number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={`${styles.textInput} ${styles.phoneTextInput}`}
                      autoComplete="tel"
                    />
                  </div>
                </div>
              </div>

              <div className={styles.formField}>
                <label htmlFor="emailAddress" className={styles.formLabel}>
                  Email Address <span className={styles.requiredStar}>*</span>
                </label>
                <input
                  id="emailAddress"
                  name="email"
                  type="email"
                  required
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={styles.textInput}
                  autoComplete="email"
                />
              </div>

              <div className={styles.formField}>
                <label htmlFor="streetAddress" className={styles.formLabel}>
                  Address <span className={styles.requiredStar}>*</span>
                </label>
                <input
                  id="streetAddress"
                  name="line1"
                  minLength={5}
                  type="text"
                  required
                  placeholder="House no., building, street name"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className={styles.textInput}
                  autoComplete="street-address"
                />
              </div>

              <div className={styles.inputGrid3}>
                <div className={styles.formField}>
                  <label htmlFor="city" className={styles.formLabel}>
                    City <span className={styles.requiredStar}>*</span>
                  </label>
                  <input
                    id="city"
                    name="city"
                    minLength={2}
                    type="text"
                    required
                    placeholder="Enter city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className={styles.textInput}
                    autoComplete="address-level2"
                  />
                </div>

                <div className={styles.formField}>
                  <label htmlFor="state" className={styles.formLabel}>
                    State <span className={styles.requiredStar}>*</span>
                  </label>
                  <select
                    id="state"
                    name="region"
                    value={stateVal}
                    onChange={(e) => setStateVal(e.target.value)}
                    className={styles.selectInput}
                  >
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formField}>
                  <label htmlFor="pinCode" className={styles.formLabel}>
                    PIN Code <span className={styles.requiredStar}>*</span>
                  </label>
                  <input
                    id="pinCode"
                    name="postalCode"
                    type="text"
                    required
                    maxLength={6}
                    pattern="[1-9][0-9]{5}"
                    inputMode="numeric"
                    placeholder="Enter PIN code"
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    className={styles.textInput}
                    autoComplete="postal-code"
                  />
                </div>
              </div>

              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  disabled={!user}
                  checked={saveAddress}
                  onChange={(e) => setSaveAddress(e.target.checked)}
                  className={styles.checkboxInput}
                />
                <span>
                  {user
                    ? "Save this address for future orders"
                    : "Sign in to save your address for future orders"}
                </span>
              </label>
            </section>

            {/* Step 2: Delivery Options */}
            <section
              className={styles.sectionBlock}
              aria-labelledby="delivery-heading"
            >
              <h2 id="delivery-heading" className={styles.sectionHeading}>
                2. Delivery Options
              </h2>
              <p className={styles.sectionSubtitle}>
                Choose a delivery option for your order
              </p>

              <div className={styles.deliveryOptionsGrid}>
                {/* Standard Delivery */}
                <div
                  className={`${styles.deliveryCard} ${deliveryOption === "standard" ? styles.deliveryCardActive : ""}`}
                  onClick={() => setDeliveryOption("standard")}
                  role="radio"
                  aria-checked={deliveryOption === "standard"}
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === " " || event.key === "Enter") {
                      event.preventDefault();
                      setDeliveryOption("standard");
                    }
                  }}
                >
                  <div className={styles.deliveryCardTop}>
                    <div
                      className={`${styles.radioCircle} ${deliveryOption === "standard" ? styles.radioCircleActive : ""}`}
                    >
                      {deliveryOption === "standard" && (
                        <div className={styles.radioDot} />
                      )}
                    </div>
                    <div className={styles.deliveryIconWrap}>
                      <Truck size={18} strokeWidth={1.5} />
                    </div>
                    <span className={styles.deliveryPrice}>Free</span>
                  </div>
                  <div>
                    <h3 className={styles.deliveryTitle}>Standard Delivery</h3>
                    <p className={styles.deliverySub}>3–5 business days</p>
                  </div>
                </div>

                {/* Express Delivery */}
                <div
                  className={`${styles.deliveryCard} ${deliveryOption === "express" ? styles.deliveryCardActive : ""}`}
                  aria-disabled="true"
                  role="radio"
                  aria-checked={false}
                  tabIndex={-1}
                >
                  <div className={styles.deliveryCardTop}>
                    <div
                      className={`${styles.radioCircle} ${deliveryOption === "express" ? styles.radioCircleActive : ""}`}
                    >
                      {deliveryOption === "express" && (
                        <div className={styles.radioDot} />
                      )}
                    </div>
                    <div className={styles.deliveryIconWrap}>
                      <Package size={18} strokeWidth={1.5} />
                    </div>
                    <span className={styles.deliveryPrice}>Unavailable</span>
                  </div>
                  <div>
                    <h3 className={styles.deliveryTitle}>Express Delivery</h3>
                    <p className={styles.deliverySub}>1–2 business days</p>
                  </div>
                </div>

                {/* Store Pickup */}
                <div
                  className={`${styles.deliveryCard} ${deliveryOption === "pickup" ? styles.deliveryCardActive : ""}`}
                  aria-disabled="true"
                  role="radio"
                  aria-checked={false}
                  tabIndex={-1}
                >
                  <div className={styles.deliveryCardTop}>
                    <div
                      className={`${styles.radioCircle} ${deliveryOption === "pickup" ? styles.radioCircleActive : ""}`}
                    >
                      {deliveryOption === "pickup" && (
                        <div className={styles.radioDot} />
                      )}
                    </div>
                    <div className={styles.deliveryIconWrap}>
                      <Store size={18} strokeWidth={1.5} />
                    </div>
                    <span className={styles.deliveryPrice}>Free</span>
                  </div>
                  <div>
                    <h3 className={styles.deliveryTitle}>Store Pickup</h3>
                    <p className={styles.deliverySub}>Currently unavailable</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Step 3: Payment Method */}
            <section
              className={styles.sectionBlock}
              aria-labelledby="payment-heading"
            >
              <h2 id="payment-heading" className={styles.sectionHeading}>
                3. Payment Method
              </h2>
              <p className={styles.sectionSubtitle}>
                Choose your preferred payment method
              </p>

              <div className={styles.paymentContainer}>
                {/* Method Tabs */}
                <div className={styles.paymentTabsList} role="tablist">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={paymentMethod === "upi"}
                    className={`${styles.paymentTabBtn} ${paymentMethod === "upi" ? styles.paymentTabBtnActive : ""}`}
                    onClick={() => setPaymentMethod("upi")}
                  >
                    <div
                      className={`${styles.radioCircle} ${paymentMethod === "upi" ? styles.radioCircleActive : ""}`}
                    >
                      {paymentMethod === "upi" && (
                        <div className={styles.radioDot} />
                      )}
                    </div>
                    <div>
                      <span>UPI</span>
                      <span className={styles.paymentTabSub}>
                        Pay using any UPI app
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    role="tab"
                    aria-selected={paymentMethod === "card"}
                    className={`${styles.paymentTabBtn} ${paymentMethod === "card" ? styles.paymentTabBtnActive : ""}`}
                    onClick={() => setPaymentMethod("card")}
                  >
                    <div
                      className={`${styles.radioCircle} ${paymentMethod === "card" ? styles.radioCircleActive : ""}`}
                    >
                      {paymentMethod === "card" && (
                        <div className={styles.radioDot} />
                      )}
                    </div>
                    <CreditCard size={16} className={styles.paymentTabIcon} />
                    <div>
                      <span>Credit / Debit Card</span>
                      <span className={styles.paymentTabSub}>
                        Visa, Mastercard, Rupay
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    role="tab"
                    aria-selected={paymentMethod === "netbanking"}
                    className={`${styles.paymentTabBtn} ${paymentMethod === "netbanking" ? styles.paymentTabBtnActive : ""}`}
                    onClick={() => setPaymentMethod("netbanking")}
                  >
                    <div
                      className={`${styles.radioCircle} ${paymentMethod === "netbanking" ? styles.radioCircleActive : ""}`}
                    >
                      {paymentMethod === "netbanking" && (
                        <div className={styles.radioDot} />
                      )}
                    </div>
                    <Building size={16} className={styles.paymentTabIcon} />
                    <div>
                      <span>Net Banking</span>
                      <span className={styles.paymentTabSub}>
                        All major banks
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    role="tab"
                    aria-selected={paymentMethod === "wallets"}
                    className={`${styles.paymentTabBtn} ${paymentMethod === "wallets" ? styles.paymentTabBtnActive : ""}`}
                    onClick={() => setPaymentMethod("wallets")}
                  >
                    <div
                      className={`${styles.radioCircle} ${paymentMethod === "wallets" ? styles.radioCircleActive : ""}`}
                    >
                      {paymentMethod === "wallets" && (
                        <div className={styles.radioDot} />
                      )}
                    </div>
                    <Wallet size={16} className={styles.paymentTabIcon} />
                    <div>
                      <span>Wallets</span>
                      <span className={styles.paymentTabSub}>
                        Paytm, PhonePe, Amazon Pay
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    role="tab"
                    aria-selected={paymentMethod === "emi"}
                    className={`${styles.paymentTabBtn} ${paymentMethod === "emi" ? styles.paymentTabBtnActive : ""}`}
                    onClick={() => setPaymentMethod("emi")}
                  >
                    <div
                      className={`${styles.radioCircle} ${paymentMethod === "emi" ? styles.radioCircleActive : ""}`}
                    >
                      {paymentMethod === "emi" && (
                        <div className={styles.radioDot} />
                      )}
                    </div>
                    <CalendarDays size={16} className={styles.paymentTabIcon} />
                    <div>
                      <span>EMI</span>
                      <span className={styles.paymentTabSub}>
                        Easy monthly payments
                      </span>
                    </div>
                  </button>
                </div>

                {/* Sub Panel Content */}
                <div className={styles.paymentPanel} role="tabpanel">
                  {paymentMethod === "upi" ? (
                    <div>
                      <h3 className={styles.panelTitle}>UPI Payment</h3>
                      <p className={styles.panelSub}>
                        Pay securely using your UPI app
                      </p>

                      {/* UPI App Icons Row */}
                      <div className={styles.upiAppsRow}>
                        <div className={styles.upiAppItem}>
                          <div
                            className={styles.upiAppBadge}
                            style={{ color: "#4285F4" }}
                          >
                            GPay
                          </div>
                          <span className={styles.upiAppName}>GPay</span>
                        </div>
                        <div className={styles.upiAppItem}>
                          <div
                            className={styles.upiAppBadge}
                            style={{ color: "#5f259f" }}
                          >
                            पे
                          </div>
                          <span className={styles.upiAppName}>PhonePe</span>
                        </div>
                        <div className={styles.upiAppItem}>
                          <div
                            className={styles.upiAppBadge}
                            style={{ color: "#00b9f5" }}
                          >
                            paytm
                          </div>
                          <span className={styles.upiAppName}>Paytm</span>
                        </div>
                        <div className={styles.upiAppItem}>
                          <div
                            className={styles.upiAppBadge}
                            style={{ color: "#097937" }}
                          >
                            BHIM
                          </div>
                          <span className={styles.upiAppName}>BHIM</span>
                        </div>
                        <div className={styles.upiAppItem}>
                          <div
                            className={styles.upiAppBadge}
                            style={{ color: "#777" }}
                          >
                            •••
                          </div>
                          <span className={styles.upiAppName}>More</span>
                        </div>
                      </div>

                      <p className={styles.panelSub}>
                        Choose and authorise your payment in the secure gateway.
                        Available methods depend on the payment provider.
                      </p>

                      <button
                        type="submit"
                        disabled={busy || updatingQuantity || !hasCartItems}
                        className={styles.inlinePayButton}
                      >
                        {busy ? "PROCESSING…" : `PAY ${money(total)}`}
                        {!busy && <ArrowRight size={16} />}
                      </button>
                    </div>
                  ) : (
                    <div>
                      <h3 className={styles.panelTitle}>Secure Gateway</h3>
                      <p className={styles.panelSub}>
                        Choose your payment method in the secure gateway.
                        Availability depends on your payment provider.
                      </p>
                      <button
                        type="submit"
                        disabled={busy || updatingQuantity || !hasCartItems}
                        className={styles.inlinePayButton}
                      >
                        {busy ? "PROCESSING…" : `PAY ${money(total)}`}
                        {!busy && <ArrowRight size={16} />}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </form>
        </div>

        {/* Right Column: Order Summary Sidebar */}
        <aside className={styles.rightSummaryCol} aria-label="Order Summary">
          <div className={styles.summaryHeader}>
            <h2 className={styles.summaryTitle}>Order Summary</h2>
            <span className={styles.summaryItemCount}>
              {itemCount} item{itemCount !== 1 ? "s" : ""}
            </span>
          </div>

          {!hasCartItems && (
            <p className={styles.emptyBag}>
              Your bag is empty or could not be loaded.{" "}
              <Link href="/luggage">Continue shopping</Link>
            </p>
          )}
          {/* Item Card(s) */}
          {displayItems.map((item) => (
            <div key={item.sku} className={styles.orderItemCard}>
              <div className={styles.itemThumb}>
                <Image
                  src={item.image}
                  sizes="120px"
                  alt={item.name}
                  fill
                  style={{ objectFit: "cover" }}
                />
              </div>
              <div className={styles.itemInfo}>
                <h3 className={styles.itemName}>{item.name}</h3>
                <p className={styles.itemColorSize}>{item.color}</p>
                <div className={styles.itemQtyRow}>
                  <button
                    type="button"
                    className={styles.qtyBtn}
                    onClick={() => handleQtyChange(item.sku, item.quantity, -1)}
                    disabled={busy || updatingQuantity || item.quantity <= 1}
                    aria-label="Decrease quantity"
                  >
                    <Minus size={11} />
                  </button>
                  <span className={styles.qtyValue}>{item.quantity}</span>
                  <button
                    type="button"
                    className={styles.qtyBtn}
                    onClick={() => handleQtyChange(item.sku, item.quantity, 1)}
                    disabled={busy || updatingQuantity || item.quantity >= 10}
                    aria-label="Increase quantity"
                  >
                    <Plus size={11} />
                  </button>
                </div>
              </div>
              <div className={styles.itemPrice}>
                {money(item.price * item.quantity)}
              </div>
            </div>
          ))}

          {/* Price Breakdown */}
          <div className={styles.priceBreakdown}>
            <div className={styles.priceLine}>
              <span>Subtotal</span>
              <span className={styles.priceLineVal}>{money(subtotal)}</span>
            </div>
            <div className={styles.priceLine}>
              <span>Delivery</span>
              <span className={styles.priceLineVal}>
                {deliveryCost === 0 ? "Free" : money(deliveryCost)}
              </span>
            </div>
            <div className={styles.priceLine}>
              <span>
                Estimated Tax (GST) <Info size={12} strokeWidth={2} />
              </span>
              <span className={styles.priceLineVal}>₹ 0</span>
            </div>
          </div>

          {/* Total Line */}
          <div className={styles.totalLine}>
            <span className={styles.totalLabel}>Total</span>
            <div className={styles.totalAmountWrap}>
              <span className={styles.totalAmount}>{money(total)}</span>
              <span className={styles.inclusiveTaxText}>
                Inclusive of all taxes
              </span>
            </div>
          </div>

          {/* Promo code accordion */}
          <div className={styles.promoAccordion}>
            <button
              type="button"
              className={styles.promoToggle}
              onClick={() => setPromoOpen(!promoOpen)}
              aria-expanded={promoOpen}
            >
              <span>Have a promo code?</span>
              <ChevronDown
                size={14}
                style={{
                  transform: promoOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s ease",
                }}
              />
            </button>
            {promoOpen && (
              <div className={styles.promoInputRow}>
                <input
                  type="text"
                  placeholder="Enter promo code"
                  aria-label="Promo code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className={styles.textInput}
                  style={{ height: "36px", fontSize: "12px" }}
                />
                <button
                  type="button"
                  className={styles.promoApplyBtn}
                  onClick={() => {
                    setPromoMessage(
                      "Promo codes are not supported by the current checkout. No discount has been applied.",
                    );
                  }}
                >
                  APPLY
                </button>
              </div>
            )}
          </div>

          {promoMessage && (
            <p role="status" className={styles.panelSub}>
              {promoMessage}
            </p>
          )}
          {/* Pay Primary Button */}
          <button
            type="submit"
            form="checkout-form"
            disabled={busy || updatingQuantity || !hasCartItems}
            className={styles.primaryPayBtn}
          >
            {busy ? "PREPARING ORDER…" : `PAY ${money(total)}`}
            {!busy && <ArrowRight size={16} />}
          </button>

          {/* Security Sub-note */}
          <div className={styles.securityNote}>
            <Lock size={12} />
            <span>Your payment information is secure and encrypted</span>
          </div>

          {/* Trust Badges Grid */}
          <div className={styles.trustBadgesGrid}>
            <div className={styles.trustItem}>
              <Truck size={20} strokeWidth={1.5} className={styles.trustIcon} />
              <div>
                <h4 className={styles.trustTitle}>Free Delivery</h4>
                <p className={styles.trustSub}>3–5 business days</p>
              </div>
            </div>
            <div className={styles.trustItem}>
              <RotateCcw
                size={20}
                strokeWidth={1.5}
                className={styles.trustIcon}
              />
              <div>
                <h4 className={styles.trustTitle}>Easy Returns</h4>
                <p className={styles.trustSub}>Within 14 days</p>
              </div>
            </div>
            <div className={styles.trustItem}>
              <ShieldCheck
                size={20}
                strokeWidth={1.5}
                className={styles.trustIcon}
              />
              <div>
                <h4 className={styles.trustTitle}>Official Guarantee</h4>
                <p className={styles.trustSub}>A lifetime of travel</p>
              </div>
            </div>
            <div className={styles.trustItem}>
              <Headphones
                size={20}
                strokeWidth={1.5}
                className={styles.trustIcon}
              />
              <div>
                <h4 className={styles.trustTitle}>Client Service</h4>
                <p className={styles.trustSub}>Speak to our team</p>
              </div>
            </div>
          </div>

          {/* OVIA Signature Packaging Card */}
          <div className={styles.packagingCard}>
            <div className={styles.packagingImageWrap}>
              <Image
                src="/media/ovia-signature-packaging.svg"
                alt="OVIA Signature Packaging"
                fill
                style={{ objectFit: "cover" }}
              />
            </div>
            <div className={styles.packagingContent}>
              <h3 className={styles.packagingTitle}>
                OVIA Signature Packaging
              </h3>
              <p className={styles.packagingDesc}>
                Your order will arrive in our signature packaging, crafted for a
                more intentional journey.
              </p>
              <Link href="/services" className={styles.discoverLink}>
                DISCOVER MORE <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
