"use client";

import { usePreferences } from "@/components/preferences";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, useMemo } from "react";
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
  Check,
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
  const [deliveryOption, setDeliveryOption] = useState<"standard" | "express" | "pickup">("standard");

  // Payment method: 'upi' | 'card' | 'netbanking' | 'wallets' | 'emi'
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "card" | "netbanking" | "wallets" | "emi">("upi");

  // Promo code toggle & state
  const [promoOpen, setPromoOpen] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);

  // Form values state for shipping
  const [fullName, setFullName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateVal, setStateVal] = useState("Maharashtra");
  const [pinCode, setPinCode] = useState("");
  const [saveAddress, setSaveAddress] = useState(true);

  // UPI ID state
  const [upiId, setUpiId] = useState("");

  // Determine line items: if cart has items, use cart lines; otherwise default to a showcase luxury bag item
  const hasCartItems = cart.lines.length > 0;

  const displayItems = useMemo(() => {
    if (hasCartItems) {
      return cart.lines;
    }
    // Default luxury crossbody bag matching the screenshot if navigated directly or via single buy
    return [
      {
        sku: "crossbody-ivory-std",
        name: "Signature Crossbody",
        color: "Ivory",
        price: 189000,
        quantity: 1,
        image: "/media/checkout-crossbody-thumb.svg",
        slug: "signature-crossbody",
      },
    ];
  }, [hasCartItems, cart.lines]);

  const subtotal = useMemo(() => {
    return displayItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }, [displayItems]);

  const deliveryCost = deliveryOption === "express" ? 300 : 0;
  const estimatedTax = 0; // Inclusive of taxes
  const total = subtotal + deliveryCost;

  async function handleQtyChange(sku: string, currentQty: number, delta: number) {
    const next = currentQty + delta;
    if (next < 1) return;
    if (hasCartItems) {
      try {
        await setQuantity(sku, next);
      } catch (e) {
        setError((e as Error).message);
      }
    }
  }

  async function submit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setError("");
    setBusy(true);
    key.current ??= crypto.randomUUID();

    try {
      const payloadAddress = {
        name: fullName || "Valued Client",
        email: email || "client@ovia.com",
        line1: address || "Oberoi Grand Promenade 10",
        city: city || "Mumbai",
        region: stateVal || "Maharashtra",
        postalCode: pinCode || "400001",
        country: "IN" as const,
      };

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
          prefill: { name: payloadAddress.name, email: payloadAddress.email },
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
      <main className={styles.mainLayout}>
        {/* Left Column: Architectural Editorial Banner */}
        <aside className={styles.leftEditorialCol} aria-label="Editorial Brand Banner">
          <div className={styles.editorialImageWrap}>
            <Image
              src="/media/checkout-editorial-banner.svg"
              alt="OVIA Architectural Editorial Crossbody"
              fill
              priority
              style={{ objectFit: "cover" }}
            />
          </div>
        </aside>

        {/* Center Column: Form & Selection Steps */}
        <div className={styles.centerFormCol}>
          {error && (
            <div className={styles.errorBanner} role="alert">
              {error}
            </div>
          )}

          <form onSubmit={submit}>
            {/* Step 1: Shipping Information */}
            <section className={styles.sectionBlock} aria-labelledby="shipping-heading">
              <div className={styles.sectionHeaderRow}>
                <h1 id="shipping-heading" className={styles.sectionHeading}>
                  1. Shipping Information
                </h1>
                <span className={styles.loginPrompt}>
                  Already have an account? <Link href="/login">Login</Link>
                </span>
              </div>
              <p className={styles.sectionSubtitle}>Where should we deliver your order?</p>

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
                      <span className={styles.flagIcon} style={{ background: "linear-gradient(to bottom, #FF9933 33%, #FFFFFF 33%, #FFFFFF 66%, #138808 66%)" }} />
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
                  checked={saveAddress}
                  onChange={(e) => setSaveAddress(e.target.checked)}
                  className={styles.checkboxInput}
                />
                <span>Save this address for future orders</span>
              </label>
            </section>

            {/* Step 2: Delivery Options */}
            <section className={styles.sectionBlock} aria-labelledby="delivery-heading">
              <h2 id="delivery-heading" className={styles.sectionHeading}>
                2. Delivery Options
              </h2>
              <p className={styles.sectionSubtitle}>Choose a delivery option for your order</p>

              <div className={styles.deliveryOptionsGrid}>
                {/* Standard Delivery */}
                <div
                  className={`${styles.deliveryCard} ${deliveryOption === "standard" ? styles.deliveryCardActive : ""}`}
                  onClick={() => setDeliveryOption("standard")}
                  role="radio"
                  aria-checked={deliveryOption === "standard"}
                  tabIndex={0}
                >
                  <div className={styles.deliveryCardTop}>
                    <div className={`${styles.radioCircle} ${deliveryOption === "standard" ? styles.radioCircleActive : ""}`}>
                      {deliveryOption === "standard" && <div className={styles.radioDot} />}
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
                  onClick={() => setDeliveryOption("express")}
                  role="radio"
                  aria-checked={deliveryOption === "express"}
                  tabIndex={0}
                >
                  <div className={styles.deliveryCardTop}>
                    <div className={`${styles.radioCircle} ${deliveryOption === "express" ? styles.radioCircleActive : ""}`}>
                      {deliveryOption === "express" && <div className={styles.radioDot} />}
                    </div>
                    <div className={styles.deliveryIconWrap}>
                      <Package size={18} strokeWidth={1.5} />
                    </div>
                    <span className={styles.deliveryPrice}>₹ 300</span>
                  </div>
                  <div>
                    <h3 className={styles.deliveryTitle}>Express Delivery</h3>
                    <p className={styles.deliverySub}>1–2 business days</p>
                  </div>
                </div>

                {/* Store Pickup */}
                <div
                  className={`${styles.deliveryCard} ${deliveryOption === "pickup" ? styles.deliveryCardActive : ""}`}
                  onClick={() => setDeliveryOption("pickup")}
                  role="radio"
                  aria-checked={deliveryOption === "pickup"}
                  tabIndex={0}
                >
                  <div className={styles.deliveryCardTop}>
                    <div className={`${styles.radioCircle} ${deliveryOption === "pickup" ? styles.radioCircleActive : ""}`}>
                      {deliveryOption === "pickup" && <div className={styles.radioDot} />}
                    </div>
                    <div className={styles.deliveryIconWrap}>
                      <Store size={18} strokeWidth={1.5} />
                    </div>
                    <span className={styles.deliveryPrice}>Free</span>
                  </div>
                  <div>
                    <h3 className={styles.deliveryTitle}>Store Pickup</h3>
                    <p className={styles.deliverySub}>Pick up from an OVIA store</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Step 3: Payment Method */}
            <section className={styles.sectionBlock} aria-labelledby="payment-heading">
              <h2 id="payment-heading" className={styles.sectionHeading}>
                3. Payment Method
              </h2>
              <p className={styles.sectionSubtitle}>Choose your preferred payment method</p>

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
                    <div className={`${styles.radioCircle} ${paymentMethod === "upi" ? styles.radioCircleActive : ""}`}>
                      {paymentMethod === "upi" && <div className={styles.radioDot} />}
                    </div>
                    <div>
                      <span>UPI</span>
                      <span className={styles.paymentTabSub}>Pay using any UPI app</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    role="tab"
                    aria-selected={paymentMethod === "card"}
                    className={`${styles.paymentTabBtn} ${paymentMethod === "card" ? styles.paymentTabBtnActive : ""}`}
                    onClick={() => setPaymentMethod("card")}
                  >
                    <div className={`${styles.radioCircle} ${paymentMethod === "card" ? styles.radioCircleActive : ""}`}>
                      {paymentMethod === "card" && <div className={styles.radioDot} />}
                    </div>
                    <CreditCard size={16} className={styles.paymentTabIcon} />
                    <div>
                      <span>Credit / Debit Card</span>
                      <span className={styles.paymentTabSub}>Visa, Mastercard, Rupay</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    role="tab"
                    aria-selected={paymentMethod === "netbanking"}
                    className={`${styles.paymentTabBtn} ${paymentMethod === "netbanking" ? styles.paymentTabBtnActive : ""}`}
                    onClick={() => setPaymentMethod("netbanking")}
                  >
                    <div className={`${styles.radioCircle} ${paymentMethod === "netbanking" ? styles.radioCircleActive : ""}`}>
                      {paymentMethod === "netbanking" && <div className={styles.radioDot} />}
                    </div>
                    <Building size={16} className={styles.paymentTabIcon} />
                    <div>
                      <span>Net Banking</span>
                      <span className={styles.paymentTabSub}>All major banks</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    role="tab"
                    aria-selected={paymentMethod === "wallets"}
                    className={`${styles.paymentTabBtn} ${paymentMethod === "wallets" ? styles.paymentTabBtnActive : ""}`}
                    onClick={() => setPaymentMethod("wallets")}
                  >
                    <div className={`${styles.radioCircle} ${paymentMethod === "wallets" ? styles.radioCircleActive : ""}`}>
                      {paymentMethod === "wallets" && <div className={styles.radioDot} />}
                    </div>
                    <Wallet size={16} className={styles.paymentTabIcon} />
                    <div>
                      <span>Wallets</span>
                      <span className={styles.paymentTabSub}>Paytm, PhonePe, Amazon Pay</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    role="tab"
                    aria-selected={paymentMethod === "emi"}
                    className={`${styles.paymentTabBtn} ${paymentMethod === "emi" ? styles.paymentTabBtnActive : ""}`}
                    onClick={() => setPaymentMethod("emi")}
                  >
                    <div className={`${styles.radioCircle} ${paymentMethod === "emi" ? styles.radioCircleActive : ""}`}>
                      {paymentMethod === "emi" && <div className={styles.radioDot} />}
                    </div>
                    <CalendarDays size={16} className={styles.paymentTabIcon} />
                    <div>
                      <span>EMI</span>
                      <span className={styles.paymentTabSub}>Easy monthly payments</span>
                    </div>
                  </button>
                </div>

                {/* Sub Panel Content */}
                <div className={styles.paymentPanel} role="tabpanel">
                  {paymentMethod === "upi" ? (
                    <div>
                      <h3 className={styles.panelTitle}>UPI Payment</h3>
                      <p className={styles.panelSub}>Pay securely using your UPI app</p>

                      {/* UPI App Icons Row */}
                      <div className={styles.upiAppsRow}>
                        <div className={styles.upiAppItem}>
                          <div className={styles.upiAppBadge} style={{ color: "#4285F4" }}>
                            GPay
                          </div>
                          <span className={styles.upiAppName}>GPay</span>
                        </div>
                        <div className={styles.upiAppItem}>
                          <div className={styles.upiAppBadge} style={{ color: "#5f259f" }}>
                            पे
                          </div>
                          <span className={styles.upiAppName}>PhonePe</span>
                        </div>
                        <div className={styles.upiAppItem}>
                          <div className={styles.upiAppBadge} style={{ color: "#00b9f5" }}>
                            paytm
                          </div>
                          <span className={styles.upiAppName}>Paytm</span>
                        </div>
                        <div className={styles.upiAppItem}>
                          <div className={styles.upiAppBadge} style={{ color: "#097937" }}>
                            BHIM
                          </div>
                          <span className={styles.upiAppName}>BHIM</span>
                        </div>
                        <div className={styles.upiAppItem}>
                          <div className={styles.upiAppBadge} style={{ color: "#777" }}>
                            •••
                          </div>
                          <span className={styles.upiAppName}>More</span>
                        </div>
                      </div>

                      {/* UPI ID input */}
                      <div className={styles.formField}>
                        <label htmlFor="upiId" className={styles.formLabel}>
                          UPI ID <span className={styles.requiredStar}>*</span>
                        </label>
                        <div className={styles.upiInputWrap}>
                          <input
                            id="upiId"
                            type="text"
                            placeholder="example@upi"
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                            className={styles.textInput}
                          />
                          <span className={styles.upiLogoBadge}>UPI</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => submit()}
                        disabled={busy}
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
                        You will be routed to our high-security sandbox payment terminal.
                      </p>
                      <button
                        type="button"
                        onClick={() => submit()}
                        disabled={busy}
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
              {displayItems.reduce((acc, i) => acc + i.quantity, 0)} item{displayItems.length > 1 ? "s" : ""}
            </span>
          </div>

          {/* Item Card(s) */}
          {displayItems.map((item) => (
            <div key={item.sku} className={styles.orderItemCard}>
              <div className={styles.itemThumb}>
                <Image
                  src={item.image || "/media/checkout-crossbody-thumb.svg"}
                  alt={item.name}
                  fill
                  style={{ objectFit: "cover" }}
                />
              </div>
              <div className={styles.itemInfo}>
                <h3 className={styles.itemName}>{item.name}</h3>
                <p className={styles.itemColorSize}>
                  {item.color}
                  <br />
                  One Size
                </p>
                <div className={styles.itemQtyRow}>
                  <button
                    type="button"
                    className={styles.qtyBtn}
                    onClick={() => handleQtyChange(item.sku, item.quantity, -1)}
                    aria-label="Decrease quantity"
                  >
                    <Minus size={11} />
                  </button>
                  <span className={styles.qtyValue}>{item.quantity}</span>
                  <button
                    type="button"
                    className={styles.qtyBtn}
                    onClick={() => handleQtyChange(item.sku, item.quantity, 1)}
                    aria-label="Increase quantity"
                  >
                    <Plus size={11} />
                  </button>
                </div>
              </div>
              <div className={styles.itemPrice}>{money(item.price * item.quantity)}</div>
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
              <span className={styles.inclusiveTaxText}>Inclusive of all taxes</span>
            </div>
          </div>

          {/* Promo code accordion */}
          <div className={styles.promoAccordion}>
            <button
              type="button"
              className={styles.promoToggle}
              onClick={() => setPromoOpen(!promoOpen)}
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
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className={styles.textInput}
                  style={{ height: "36px", fontSize: "12px" }}
                />
                <button
                  type="button"
                  className={styles.promoApplyBtn}
                  onClick={() => {
                    if (promoCode.trim()) setAppliedPromo(promoCode.trim().toUpperCase());
                  }}
                >
                  {appliedPromo ? <Check size={14} /> : "APPLY"}
                </button>
              </div>
            )}
          </div>

          {/* Pay Primary Button */}
          <button
            type="button"
            onClick={() => submit()}
            disabled={busy}
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
              <RotateCcw size={20} strokeWidth={1.5} className={styles.trustIcon} />
              <div>
                <h4 className={styles.trustTitle}>Easy Returns</h4>
                <p className={styles.trustSub}>Within 14 days</p>
              </div>
            </div>
            <div className={styles.trustItem}>
              <ShieldCheck size={20} strokeWidth={1.5} className={styles.trustIcon} />
              <div>
                <h4 className={styles.trustTitle}>Official Guarantee</h4>
                <p className={styles.trustSub}>A lifetime of travel</p>
              </div>
            </div>
            <div className={styles.trustItem}>
              <Headphones size={20} strokeWidth={1.5} className={styles.trustIcon} />
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
              <h3 className={styles.packagingTitle}>OVIA Signature Packaging</h3>
              <p className={styles.packagingDesc}>
                Your order will arrive in our signature packaging, crafted for a more intentional journey.
              </p>
              <Link href="/services" className={styles.discoverLink}>
                DISCOVER MORE <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
