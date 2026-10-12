"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import {
  Package,
  CreditCard,
  Truck,
  RotateCcw,
  Shield,
  Headphones,
  Search,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Upload,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Info,
  LayoutDashboard,
  MapPin,
  Heart,
  User,
  Star,
  LogOut,
  AlertTriangle,
  FileText,
  HelpCircle,
  Calendar,
  ShieldCheck,
  Check,
  Tag,
} from "lucide-react";
import { request, useStore } from "./store-provider";
import type { Order } from "@/lib/types";
import styles from "./account-support.module.css";

interface SupportTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  category: string;
  status: "Open" | "Waiting for reply" | "Resolved";
  createdAt: string;
  orderId?: string;
  message?: string;
}

// Display order interface for subviews
interface DisplayOrder {
  id: string;
  orderNumber: string;
  createdAt: string;
  total: number;
  status: string;
  paymentMethod: string;
  item: {
    name: string;
    color: string;
    price: number;
    image: string;
    qty: number;
  };
  tracking: {
    carrier: string;
    trackingNumber: string;
    steps: { label: string; date: string; desc: string; done: boolean }[];
  };
}

// Sample orders matching mockups (Images 3, 4, 5)
const FALLBACK_ORDERS: DisplayOrder[] = [
  {
    id: "ov-order-1",
    orderNumber: "OV-10324",
    createdAt: "2026-10-03T10:24:00.000Z",
    total: 249000,
    status: "Delivered",
    paymentMethod: "UPI",
    item: {
      name: "Cabin Luggage",
      color: "Black",
      price: 249000,
      image: "/media/bags/attach-aluminium-briefcase-0.png",
      qty: 1,
    },
    tracking: {
      carrier: "Delhivery Express",
      trackingNumber: "140087654321",
      steps: [
        { label: "Order Placed", date: "3 Oct 2026, 10:24 AM", desc: "Your order has been confirmed.", done: true },
        { label: "Processing", date: "4 Oct 2026, 02:15 PM", desc: "Your order is being prepared.", done: true },
        { label: "Shipped", date: "5 Oct 2026, 09:30 AM", desc: "Package has left our warehouse.", done: true },
        { label: "Out for Delivery", date: "Expected: 6 Oct 2026", desc: "Package is at local delivery hub.", done: false },
        { label: "Delivered", date: "Expected: 6 Oct 2026", desc: "Package will be delivered soon.", done: false },
      ],
    },
  },
  {
    id: "ov-order-2",
    orderNumber: "OV-10198",
    createdAt: "2026-09-28T14:10:00.000Z",
    total: 189000,
    status: "Delivered",
    paymentMethod: "Credit Card",
    item: {
      name: "Travel Bag",
      color: "Kutch Gamthi",
      price: 189000,
      image: "/media/bags/groove-leather-shopping-bag-0.png",
      qty: 1,
    },
    tracking: {
      carrier: "Delhivery Express",
      trackingNumber: "140087654318",
      steps: [
        { label: "Order Placed", date: "28 Sep 2026, 02:10 PM", desc: "Confirmed", done: true },
        { label: "Processing", date: "29 Sep 2026, 10:00 AM", desc: "Prepared", done: true },
        { label: "Shipped", date: "30 Sep 2026, 11:30 AM", desc: "In transit", done: true },
        { label: "Out for Delivery", date: "1 Oct 2026, 09:00 AM", desc: "Out for delivery", done: true },
        { label: "Delivered", date: "1 Oct 2026, 03:45 PM", desc: "Delivered to recipient", done: true },
      ],
    },
  },
  {
    id: "ov-order-3",
    orderNumber: "OV-10175",
    createdAt: "2026-09-20T09:15:00.000Z",
    total: 95000,
    status: "Delivered",
    paymentMethod: "Net Banking",
    item: {
      name: "Check-in Luggage",
      color: "Titanium",
      price: 95000,
      image: "/media/bags/attach-aluminium-briefcase-0.png",
      qty: 1,
    },
    tracking: {
      carrier: "Delhivery Express",
      trackingNumber: "140087654310",
      steps: [
        { label: "Order Placed", date: "20 Sep 2026", desc: "Confirmed", done: true },
        { label: "Processing", date: "21 Sep 2026", desc: "Prepared", done: true },
        { label: "Shipped", date: "22 Sep 2026", desc: "In Transit - Jaipur Hub", done: true },
        { label: "Out for Delivery", date: "Pending", desc: "Awaiting local hub arrival", done: false },
        { label: "Delivered", date: "Pending", desc: "Pending", done: false },
      ],
    },
  },
  {
    id: "ov-order-4",
    orderNumber: "OV-10122",
    createdAt: "2026-09-15T18:00:00.000Z",
    total: 125000,
    status: "Delivered",
    paymentMethod: "UPI",
    item: {
      name: "Backpack",
      color: "Midnight Black",
      price: 125000,
      image: "/media/bags/never-still-canvas-flap-backpack-large-0.png",
      qty: 1,
    },
    tracking: {
      carrier: "Delhivery Express",
      trackingNumber: "140087654302",
      steps: [
        { label: "Order Placed", date: "15 Sep 2026", desc: "Confirmed", done: true },
        { label: "Processing", date: "16 Sep 2026", desc: "Prepared", done: true },
        { label: "Shipped", date: "17 Sep 2026", desc: "In transit", done: true },
        { label: "Out for Delivery", date: "18 Sep 2026", desc: "Delivered", done: true },
        { label: "Delivered", date: "18 Sep 2026", desc: "Delivered to concierge", done: true },
      ],
    },
  },
];

// Initial starter requests matching Image 2
const INITIAL_TICKETS: SupportTicket[] = [
  {
    id: "tck-1",
    ticketNumber: "#OV-10234",
    subject: "Where is my order?",
    category: "Shipping",
    status: "Open",
    createdAt: "3 Oct 2026",
    orderId: "OV-10324",
    message: "Tracking hasn't updated for two days. Requesting status check.",
  },
  {
    id: "tck-2",
    ticketNumber: "#OV-10212",
    subject: "Refund not received",
    category: "Payments",
    status: "Waiting for reply",
    createdAt: "1 Oct 2026",
    orderId: "OV-10198",
    message: "Return pickup completed but bank refund is still pending.",
  },
  {
    id: "tck-3",
    ticketNumber: "#OV-10198",
    subject: "Size exchange request",
    category: "Returns",
    status: "Resolved",
    createdAt: "28 Sep 2026",
    orderId: "OV-10175",
    message: "Exchanged for Cabin Plus. Thank you for the quick resolution!",
  },
];

// Comprehensive FAQs categorized by tab matching Image 2 & 4
const FAQ_DATA: Record<string, { q: string; a: string }[]> = {
  Orders: [
    {
      q: "How can I track my order?",
      a: "You can track your order in real time under the 'Shipping & Tracking' section of this portal, or by clicking the tracking link sent to your registered email and SMS once dispatched via Delhivery Express.",
    },
    {
      q: "Can I cancel or change my order?",
      a: "Orders can be cancelled or modified within 24 hours of placing them, before they enter atelier packaging and shipping. Simply select 'Order Help' > 'Cancel Order' to initiate.",
    },
    {
      q: "How long does it take to process my order?",
      a: "Handcrafted pieces undergo meticulous quality inspection and serial recording, typically taking 24 to 48 business hours prior to dispatch.",
    },
    {
      q: "Will I receive an order confirmation email?",
      a: "Yes, an order confirmation with detailed invoice, GST details, and itemized serials is sent immediately upon successful payment.",
    },
    {
      q: "Can I edit my shipping address after placing an order?",
      a: "Address corrections can be requested through 'Shipping & Tracking' > 'Address Change' before the package leaves our central distribution facility.",
    },
  ],
  Shipping: [
    {
      q: "What are your delivery timelines?",
      a: "Metro cities typically receive delivery within 2 to 4 business days. Other regions receive delivery within 4 to 6 business days via air priority.",
    },
    {
      q: "What courier service do you use?",
      a: "All OVIA orders are fulfilled via secure, insured express logistics handled by Delhivery Express B2C with OTP verification upon delivery.",
    },
    {
      q: "What should I do if my package tracking has not updated?",
      a: "If tracking does not update for more than 48 hours, choose 'Shipping & Tracking' > 'Tracking Not Updating' and our concierge team will coordinate an immediate hub escalation.",
    },
  ],
  Payments: [
    {
      q: "Why was my payment failed?",
      a: "Payment failures can occur due to temporary bank OTP timeouts, exceeding daily UPI transaction thresholds, or 3D-Secure verification errors. Please check your bank limits or retry using a secondary payment mode.",
    },
    {
      q: "I was charged but my order is not showing.",
      a: "If funds were deducted without an order confirmation, our payment gateway reconciliation will either auto-create the order within 15 minutes or trigger an immediate full refund to your source account.",
    },
    {
      q: "How long does a refund take?",
      a: "Once approved, UPI and net banking refunds reflect within 24 to 48 hours. Credit card refunds typically credit within 3 to 5 business days depending on your bank's billing cycle.",
    },
    {
      q: "Which payment methods are accepted?",
      a: "We accept Visa, Mastercard, American Express, RuPay, UPI (Google Pay, PhonePe, Paytm), Net Banking across 50+ banks, and zero-cost EMI plans.",
    },
    {
      q: "How do I get my invoice or GST bill?",
      a: "You can download GST tax invoices directly from 'My Orders' > 'View Order Details' or request a fresh copy via 'Payments & Refunds' > 'Invoice / Receipt'.",
    },
    {
      q: "Will I be refunded for a cancelled order?",
      a: "Yes, 100% of the transaction amount including taxes and shipping is credited back to your original payment mode immediately upon cancellation.",
    },
  ],
  Returns: [
    {
      q: "What is your return policy?",
      a: "We offer a complimentary 14-day return and exchange policy on all unblemished, unused travel goods in original dust bags and tags.",
    },
    {
      q: "How do I request an exchange?",
      a: "Select 'Returns & Exchanges' in this portal or visit your Orders page, pick the piece, and choose your preferred replacement size or shade.",
    },
    {
      q: "Are returns free of charge?",
      a: "Yes. Doorstep reverse pickup is 100% complimentary for all domestic orders across India.",
    },
  ],
  Account: [
    {
      q: "How do I reset my password?",
      a: "Navigate to Account Details > Security, or click 'Forgot Password' on the sign-in screen to receive a secure password reset link.",
    },
    {
      q: "Can I update my registered email?",
      a: "Yes, you can edit your profile details under Account Details > Profile.",
    },
    {
      q: "How do I manage my saved addresses?",
      a: "Visit the 'Addresses' tab in your account dashboard to add, edit, or set default delivery and billing addresses.",
    },
  ],
  Products: [
    {
      q: "How do I care for my aluminium luggage?",
      a: "Wipe with a soft microfibre cloth dampened with warm water. Avoid abrasive sponges or harsh solvent cleaners.",
    },
    {
      q: "Is there a warranty on OVIA bags and cases?",
      a: "All OVIA aluminium and polycarbonate suitcases include a lifetime functional warranty covering handles, wheels, locks, and zippers.",
    },
    {
      q: "Are OVIA suitcases airline cabin approved?",
      a: "Yes, our Cabin and Cabin S luggage strictly adhere to IATA dimensions (55 x 40 x 20 cm) accepted by all international airlines.",
    },
  ],
};

type ViewType = "home" | "order-help" | "payments-refunds" | "shipping-tracking" | "returns-exchanges";

export function AccountSupport({ initialView }: { initialView?: ViewType } = {}) {
  const router = useRouter();
  const { user, refresh } = useStore();

  const [currentView, setCurrentView] = useState<ViewType>(initialView || "home");
  const [signingOut, setSigningOut] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFaqTab, setActiveFaqTab] = useState<string>("Orders");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Tickets state (loaded from live API, updated real-time)
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  // Orders list: fetched from real account/orders API with fallback
  const [ordersList, setOrdersList] = useState<DisplayOrder[]>(FALLBACK_ORDERS);
  const [selectedOrderIndex, setSelectedOrderIndex] = useState<number>(0);
  const [selectedTopic, setSelectedTopic] = useState<string>("");

  // Contact / Issue Form inputs
  const [formSubject, setFormSubject] = useState("");
  const [formCategory, setFormCategory] = useState("Order Help");
  const [formOrderId, setFormOrderId] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [formAttachments, setFormAttachments] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Returns & Exchanges specific state (Image 3)
  const [returnAction, setReturnAction] = useState<string>("Return Product");
  const [isReturnItemSelected, setIsReturnItemSelected] = useState<boolean>(true);
  const [returnReason, setReturnReason] = useState<string>("Select a reason");
  const [returnCondition, setReturnCondition] = useState<string>("Select condition");
  const [returnComments, setReturnComments] = useState<string>("");
  const [returnAttachments, setReturnAttachments] = useState<string[]>([]);
  const [returnSubmitting, setReturnSubmitting] = useState<boolean>(false);

  // Real-time validation feedback state
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formGeneralError, setFormGeneralError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedTracking, setCopiedTracking] = useState(false);

  // Clear specific field error on user interaction
  const clearFieldError = (fieldName: string) => {
    if (fieldErrors[fieldName]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[fieldName];
        return next;
      });
    }
    if (formGeneralError) {
      setFormGeneralError(null);
    }
  };

  // Load live tickets from database
  useEffect(() => {
    let active = true;
    request<{ success: boolean; tickets: SupportTicket[] }>("support")
      .then((res) => {
        if (active && res && res.success && res.tickets && res.tickets.length > 0) {
          setTickets(res.tickets);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Fetch real user orders from database
  useEffect(() => {
    let active = true;
    request<Order[]>("account/orders")
      .then((res) => {
        if (!active || !res || !Array.isArray(res) || res.length === 0) return;
        const realFormatted: DisplayOrder[] = res.map((ord, idx) => ({
          id: ord.id,
          orderNumber: ord.orderNumber || `OV-${10320 + idx}`,
          createdAt: ord.createdAt,
          total: ord.total,
          status: ord.status === "paid" ? "Delivered" : ord.status === "cancelled" ? "Cancelled" : "Processing",
          paymentMethod: ord.provider === "razorpay" ? "UPI" : ord.provider === "stripe" ? "Credit Card" : "Net Banking",
          item: {
            name: ord.lines[0]?.name || "Cabin Luggage",
            color: ord.lines[0]?.color || "Black",
            price: ord.lines[0]?.price || ord.total,
            image: ord.lines[0]?.image || "/media/bags/attach-aluminium-briefcase-0.png",
            qty: ord.lines[0]?.quantity || 1,
          },
          tracking: {
            carrier: ord.shipping?.courier || "Delhivery Express",
            trackingNumber: ord.shipping?.awb || `1400876543${idx}1`,
            steps: [
              { label: "Order Placed", date: new Date(ord.createdAt).toLocaleDateString("en-IN"), desc: "Your order has been confirmed.", done: true },
              { label: "Processing", date: new Date(ord.createdAt).toLocaleDateString("en-IN"), desc: "Your order is being prepared.", done: true },
              { label: "Shipped", date: "In Transit", desc: "Package has left our warehouse.", done: ord.status === "paid" },
              { label: "Out for Delivery", date: "Expected soon", desc: "Package is at local hub.", done: false },
              { label: "Delivered", date: "Delivered", desc: "Delivered to recipient.", done: ord.status === "paid" },
            ],
          },
        }));
        setOrdersList([...realFormatted, ...FALLBACK_ORDERS]);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const activeOrder = useMemo(() => {
    return ordersList[selectedOrderIndex] || ordersList[0] || FALLBACK_ORDERS[0];
  }, [ordersList, selectedOrderIndex]);

  // Handle Sign Out
  async function handleSignOut() {
    setSigningOut(true);
    try {
      await request("auth/logout", "POST", {});
      await refresh();
      router.push("/account/sign-in");
    } catch {
      setSigningOut(false);
    }
  }

  // Handle Form Submission with Real-time Validation
  async function handleSubmitTicket(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setFormGeneralError(null);

    const errors: Record<string, string> = {};
    if (!formSubject.trim()) {
      errors.subject = "Subject is required.";
    } else if (formSubject.trim().length < 3) {
      errors.subject = "Subject must be at least 3 characters long.";
    }

    if (!formMessage.trim()) {
      errors.message = "Message is required.";
    } else if (formMessage.trim().length < 10) {
      errors.message = "Please describe your issue in detail (at least 10 characters).";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormGeneralError("Please enter valid details before submitting.");
      return;
    }

    setFieldErrors({});
    setSubmitting(true);
    try {
      const payload = {
        subject: formSubject.trim(),
        category: formCategory,
        orderId: formOrderId.trim() || activeOrder.orderNumber,
        message: formMessage.trim(),
        attachments: formAttachments,
        customerName: user?.name || "Customer",
        customerEmail: user?.email || "customer@ovia.luxury",
      };

      const res = await request<{
        success: boolean;
        message?: string;
        ticket?: SupportTicket;
        error?: string;
      }>("support", "POST", payload);

      if (res && res.success && res.ticket) {
        setTickets((prev) => [res.ticket!, ...prev]);
        setToastMessage(`Support ticket ${res.ticket.ticketNumber} created successfully! Our concierge team is on it.`);
        setFormSubject("");
        setFormMessage("");
        setFormAttachments([]);
        setSelectedTopic("");
      } else {
        setFormGeneralError(res?.error || "Invalid values entered. Please check all fields.");
      }
    } catch (err: any) {
      setFormGeneralError(err.message || "Failed to submit support request. Please try again.");
    } finally {
      setSubmitting(false);
      setTimeout(() => setToastMessage(null), 7000);
    }
  }

  // Handle Returns & Exchanges Submission with Strict Real-time Validation
  async function handleSubmitReturn(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setFormGeneralError(null);

    const errors: Record<string, string> = {};

    if (!isReturnItemSelected) {
      errors.item = "Please select at least one item to proceed with return or exchange.";
    }

    if (!returnReason || returnReason === "Select a reason") {
      errors.reason = "Please select a valid reason for return from the dropdown.";
    }

    if (!returnCondition || returnCondition === "Select condition") {
      errors.condition = "Please select the condition of the product.";
    }

    if (
      (returnAction === "Wrong / Damaged Item" || returnReason === "Item defective or damaged") &&
      returnAttachments.length === 0
    ) {
      errors.photos = "Photo evidence is required when reporting damaged or wrong items.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormGeneralError("Please correct the highlighted fields before submitting.");
      return;
    }

    setFieldErrors({});
    setReturnSubmitting(true);
    try {
      const payload = {
        type: "return",
        category: "Returns & Exchanges",
        subject: `${returnAction}: ${activeOrder.item.name} (#${activeOrder.orderNumber})`,
        orderId: activeOrder.orderNumber,
        returnAction,
        returnReason,
        returnCondition,
        returnItemName: `${activeOrder.item.name} - ${activeOrder.item.color}`,
        message:
          returnComments.trim() ||
          `${returnAction} requested for ${activeOrder.item.name}. Reason: ${returnReason}. Condition: ${returnCondition}.`,
        attachments: returnAttachments,
        customerName: user?.name || "Customer",
        customerEmail: user?.email || "customer@ovia.luxury",
      };

      const res = await request<{
        success: boolean;
        message?: string;
        ticket?: SupportTicket;
        error?: string;
      }>("support", "POST", payload);

      if (res && res.success && res.ticket) {
        setTickets((prev) => [res.ticket!, ...prev]);
        setToastMessage(
          res.message ||
            `Return request ${res.ticket.ticketNumber} submitted! We'll arrange reverse pickup from your address.`
        );
        // Reset return form
        setReturnReason("Select a reason");
        setReturnCondition("Select condition");
        setReturnComments("");
        setReturnAttachments([]);
        setIsReturnItemSelected(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setFormGeneralError(res?.error || "Submission failed. Please check the entered values.");
      }
    } catch (err: any) {
      setFormGeneralError(err.message || "Failed to submit return request. Please try again.");
    } finally {
      setReturnSubmitting(false);
      setTimeout(() => setToastMessage(null), 8000);
    }
  }

  // Copy tracking number
  const handleCopyTracking = (num: string) => {
    navigator.clipboard?.writeText(num);
    setCopiedTracking(true);
    setTimeout(() => setCopiedTracking(false), 2000);
  };

  // Switch Sub-view
  const goToView = (view: ViewType, defaultCategory: string) => {
    setCurrentView(view);
    setFormCategory(defaultCategory);
    setFormSubject("");
    setSelectedTopic("");
    setFieldErrors({});
    setFormGeneralError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Select Topic & Auto-fill Subject
  const handleSelectTopic = (title: string) => {
    setSelectedTopic(title);
    setFormSubject(title);
    clearFieldError("subject");
  };

  return (
    <div className={styles.portalWrapper}>
      <div className={styles.portalContainer}>
        {/* ==========================================================
            LEFT SIDEBAR NAVIGATION (Matching OVIA Account Portal)
            ========================================================== */}
        <aside className={styles.sidebar} aria-label="Account Navigation">
          <h2 className={styles.sidebarTitle}>My Account</h2>
          <ul className={styles.navGroup}>
            <li>
              <Link href="/account" className={styles.navItem}>
                <span className={styles.navIcon}>
                  <LayoutDashboard size={18} />
                </span>
                Dashboard
              </Link>
            </li>
            <li>
              <Link href="/account/orders" className={styles.navItem}>
                <span className={styles.navIcon}>
                  <Package size={18} />
                </span>
                My Orders
              </Link>
            </li>
            <li>
              <Link href="/account/addresses" className={styles.navItem}>
                <span className={styles.navIcon}>
                  <MapPin size={18} />
                </span>
                Addresses
              </Link>
            </li>
            <li>
              <Link href="/account/wishlist" className={styles.navItem}>
                <span className={styles.navIcon}>
                  <Heart size={18} />
                </span>
                Wishlist
              </Link>
            </li>
            <li>
              <Link href="/account/profile" className={styles.navItem}>
                <span className={styles.navIcon}>
                  <User size={18} />
                </span>
                Account Details
              </Link>
            </li>
            <li>
              <Link href="/account/payments" className={styles.navItem}>
                <span className={styles.navIcon}>
                  <CreditCard size={18} />
                </span>
                Payment Methods
              </Link>
            </li>
            <li>
              <Link href="/account/reviews" className={styles.navItem}>
                <span className={styles.navIcon}>
                  <Star size={18} />
                </span>
                Reviews
              </Link>
            </li>
            <li>
              <button
                type="button"
                onClick={() => setCurrentView("home")}
                className={`${styles.navItem} ${styles.navItemActive}`}
              >
                <span className={styles.navIcon}>
                  <Headphones size={18} />
                </span>
                Support
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                className={styles.navItem}
              >
                <span className={styles.navIcon}>
                  <LogOut size={18} />
                </span>
                Logout
              </button>
            </li>
          </ul>
        </aside>

        {/* ==========================================================
            MAIN CONTENT AREA
            ========================================================== */}
        <main className={styles.mainContent}>
          {toastMessage && (
            <div className={styles.toastSuccess}>
              <CheckCircle2 size={18} />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* ========================================================
              VIEW 1: SUPPORT OVERVIEW (Image 2)
              ======================================================== */}
          {currentView === "home" && (
            <div className={styles.contactShowcaseCard}>
              {/* Left Column: Brand Ambassador Image */}
              <div className={styles.contactAmbassadorCol}>
                <Image
                  src="/media/contact-ambassador.jpg"
                  alt="OVIA Brand Ambassador"
                  fill
                  className={styles.contactAmbassadorImg}
                  priority
                />
              </div>

              {/* Right Column: Direct Reach Details */}
              <div className={styles.contactDetailsCol}>
                <div className={styles.contactHeaderBlock}>
                  <span className={styles.contactBrandEyebrow}>
                    OVIA CLIENT CARE
                  </span>
                  <h1 className={styles.contactMainTitle}>
                    Contact Us
                  </h1>
                  <p className={styles.contactSubtext}>
                    There are multiple ways now to reach us –
                  </p>
                </div>

                {/* Email & Timing */}
                <div className={styles.contactInfoBlock}>
                  <p className={styles.contactEmailText}>
                    <strong>Email</strong> –{" "}
                    <a
                      href="mailto:no-reply@ovias.shop"
                      className={styles.contactEmailLink}
                    >
                      no-reply@ovias.shop
                    </a>{" "}
                    – best for all order and product-related queries. We typically take 24 to 48 working hours to respond to any query. Thank you for being patient with us.
                  </p>
                  <p className={styles.contactEmailText}>
                    <strong>Timing</strong> – 10 AM to 7 PM
                  </p>
                </div>

                {/* Physical Address */}
                <div className={styles.contactAddressBlock}>
                  <p>
                    <strong>Our physical address</strong> – K6, First Floor, Shree Arihant Complex, Reti Bunder Road, Kalher, Bhiwandi, Thane, Maharashtra – 421302.
                  </p>
                </div>

                {/* Support Team & Phone */}
                <div className={styles.contactPhoneSection}>
                  <p className={styles.contactPhoneIntro}>
                    For any assistance, please reach out to our support team:
                  </p>
                  <p className={styles.contactPhoneRow}>
                    <strong>Phone :</strong>{" "}
                    <a
                      href="tel:+917410724158"
                      className={styles.contactPhoneLink}
                    >
                      +91 74107 24158
                    </a>
                  </p>
                  <p className={styles.contactHoursRow}>
                    <strong>Working Hours :</strong> Monday to Friday, 10:00 AM – 7:00 PM
                  </p>
                  <p className={styles.contactPromptNotice}>
                    We aim to respond promptly to all customer queries during business hours.
                  </p>
                </div>

                {/* Bulk Purchase - WITH CLICK HERE LINK */}
                <div className={styles.contactBulkCard}>
                  <h3 className={styles.contactBulkTitle}>
                    For Bulk Purchase
                  </h3>
                  <p className={styles.contactBulkText}>
                    Please write to us at:{" "}
                    <a
                      href="mailto:no-reply@ovias.shop"
                      className={styles.contactBulkLink}
                    >
                      no-reply@ovias.shop
                    </a>
                  </p>
                  <p className={styles.contactBulkText}>
                    We will get in touch with you, or submit your requirements{" "}
                    <Link
                      href="/pages/bulk-orders"
                      className={styles.contactBulkLink}
                    >
                      Click here
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              VIEW 2: ORDER HELP (Image 3)
              ======================================================== */}
          {currentView === "order-help" && (
            <div className={styles.subviewContainer}>
              {/* Back & Heading */}
              <div>
                <button
                  type="button"
                  onClick={() => setCurrentView("home")}
                  className={styles.backNavBtn}
                >
                  <ArrowLeft size={15} /> Back to Support
                </button>
                <h1 className={styles.pageTitle}>Order Help</h1>
                <p className={styles.pageSubtitle}>
                  Get help with your orders. Select an order and tell us what you need.
                </p>
              </div>

              {/* Layout: Main Workflow on Left, Order Details Sidebar on Right */}
              <div className={styles.subviewLayout}>
                <div className={styles.subviewMain}>
                  {/* Step 1: Select an Order */}
                  <div className={styles.stepBlock}>
                    <div className={styles.stepTitleRow}>
                      <h3 className={styles.stepTitle}>1. Select an Order</h3>
                      <Link href="/account/orders" className={styles.viewAllLink}>
                        View All Orders <ArrowRight size={13} />
                      </Link>
                    </div>

                    <div className={styles.ordersCarousel}>
                      {FALLBACK_ORDERS.map((ord, idx) => {
                        const isSelected = selectedOrderIndex === idx;
                        return (
                          <div
                            key={ord.id}
                            onClick={() => {
                              setSelectedOrderIndex(idx);
                              setFormOrderId(ord.orderNumber);
                            }}
                            className={`${styles.orderCard} ${
                              isSelected ? styles.orderCardActive : ""
                            }`}
                          >
                            <div className={styles.orderRadioWrap}>
                              <div className={styles.customRadio}>
                                {isSelected && <div className={styles.customRadioInner} />}
                              </div>
                              <span
                                className={`${styles.statusPill} ${
                                  ord.status === "Processing"
                                    ? styles.statusOpen
                                    : ord.status === "Shipped"
                                    ? styles.statusWaiting
                                    : styles.statusResolved
                                }`}
                              >
                                {ord.status}
                              </span>
                            </div>

                            <div className={styles.orderMetaBlock}>
                              <span className={styles.orderId}>#{ord.orderNumber}</span>
                              <span className={styles.orderDate}>
                                {new Date(ord.createdAt).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                              <span className={styles.orderPrice}>
                                ₹{ord.total.toLocaleString("en-IN")}
                              </span>
                            </div>

                            <div className={styles.orderImgWrap}>
                              <></>
                            </div>

                            <div className={styles.orderCardBottom}>
                              <span className={styles.orderItemName}>{ord.item.name}</span>
                              <span className={styles.orderQty}>Qty: {ord.item.qty}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Step 2: What do you need help with? */}
                  <div className={styles.stepBlock}>
                    <h3 className={styles.stepTitle}>2. What do you need help with?</h3>
                    <p style={{ fontSize: "13px", color: "#6b7280", margin: "-6px 0 6px 0" }}>
                      Choose a topic related to your order.
                    </p>

                    <div className={styles.issuesGrid}>
                      {[
                        { title: "Delivery Issue", desc: "Tracking, delayed delivery, NDR", icon: <Truck size={20} /> },
                        { title: "Cancel Order", desc: "Cancel within allowed time", icon: <RotateCcw size={20} /> },
                        { title: "Return or Refund", desc: "Start a return or check status", icon: <RotateCcw size={20} /> },
                        { title: "Damaged Item", desc: "Received damaged product", icon: <Package size={20} /> },
                        { title: "Wrong Item", desc: "Received different product", icon: <AlertTriangle size={20} /> },
                        { title: "Missing Item", desc: "Item(s) not received", icon: <Package size={20} /> },
                        { title: "Address Change", desc: "Update delivery address", icon: <MapPin size={20} /> },
                        { title: "Invoice & Billing", desc: "Invoice, payment or tax details", icon: <FileText size={20} /> },
                        { title: "Other Issue", desc: "Any other order related issue", icon: <HelpCircle size={20} /> },
                      ].map((topic) => {
                        const isSelected = selectedTopic === topic.title;
                        return (
                          <div
                            key={topic.title}
                            onClick={() => handleSelectTopic(topic.title)}
                            className={`${styles.issueTile} ${
                              isSelected ? styles.issueTileActive : ""
                            }`}
                          >
                            <span className={styles.issueTileIcon}>{topic.icon}</span>
                            <div className={styles.issueTileContent}>
                              <h4 className={styles.issueTileTitle}>{topic.title}</h4>
                              <p className={styles.issueTileDesc}>{topic.desc}</p>
                            </div>
                            <ArrowRight size={14} className={styles.issueTileArrow} />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Step 3: Describe Your Issue */}
                  <form onSubmit={handleSubmitTicket} className={styles.describeCard} noValidate>
                    <h3 className={styles.stepTitle}>3. Describe Your Issue</h3>

                    {formGeneralError && (
                      <div className={styles.alertBannerError}>
                        <AlertTriangle size={16} />
                        <span>{formGeneralError}</span>
                      </div>
                    )}

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>
                        Subject <span className={styles.requiredAsterisk}>*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Subject"
                        value={formSubject}
                        onChange={(e) => {
                          setFormSubject(e.target.value);
                          clearFieldError("subject");
                        }}
                        className={`${styles.inputField} ${fieldErrors.subject ? styles.inputError : ""}`}
                      />
                      {fieldErrors.subject && (
                        <span className={styles.errorText}>
                          <AlertTriangle size={12} /> {fieldErrors.subject}
                        </span>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>
                        Message <span className={styles.requiredAsterisk}>*</span>
                      </label>
                      <textarea
                        placeholder="Please describe your issue in detail..."
                        value={formMessage}
                        onChange={(e) => {
                          setFormMessage(e.target.value);
                          clearFieldError("message");
                        }}
                        className={`${styles.textareaField} ${fieldErrors.message ? styles.inputError : ""}`}
                        rows={4}
                      />
                      {fieldErrors.message && (
                        <span className={styles.errorText}>
                          <AlertTriangle size={12} /> {fieldErrors.message}
                        </span>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Attach files (optional)</label>
                      <label className={styles.fileDropzone}>
                        <input
                          type="file"
                          multiple
                          onChange={(e) => {
                            const files = e.target.files;
                            if (files) {
                              setFormAttachments(
                                Array.from(files).map((f) => f.name).slice(0, 5)
                              );
                            }
                          }}
                          style={{ display: "none" }}
                        />
                        <Upload size={22} color="#6b7280" />
                        <div className={styles.dropzoneText}>
                          <span className={styles.dropzoneTitle}>
                            {formAttachments.length > 0
                              ? `${formAttachments.length} file(s) selected`
                              : "Click to upload or drag and drop"}
                          </span>
                          <span className={styles.dropzoneHint}>Images, PDFs (Max 5 files, 10 MB each)</span>
                        </div>
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className={styles.submitBtn}
                      style={{ width: "200px" }}
                    >
                      {submitting ? "Submitting..." : "Submit Request"}
                    </button>
                  </form>
                </div>

                {/* Right Sidebar: Selected Order Details */}
                <aside className={styles.subviewSidebar}>
                  <div className={styles.selectedDetailsCard}>
                    <div className={styles.orderSummaryTop}>
                      <h4 className={styles.cardHeadTitle}>Selected Order Details</h4>
                      <span
                        className={`${styles.statusPill} ${
                          activeOrder.status === "Processing"
                            ? styles.statusOpen
                            : activeOrder.status === "Shipped"
                            ? styles.statusWaiting
                            : styles.statusResolved
                        }`}
                      >
                        {activeOrder.status}
                      </span>
                    </div>

                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Order ID</span>
                      <span className={styles.detailVal}>#{activeOrder.orderNumber}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Order Date</span>
                      <span className={styles.detailVal}>
                        {new Date(activeOrder.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Total Amount</span>
                      <span className={styles.detailVal}>
                        ₹{activeOrder.total.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Payment Method</span>
                      <span className={styles.detailVal}>{activeOrder.paymentMethod}</span>
                    </div>

                    {/* Progress Stepper */}
                    <div className={styles.stepperTrack}>
                      {activeOrder.tracking.steps.map((st, sIdx) => (
                        <div key={sIdx} className={styles.stepItem}>
                          <div
                            className={`${styles.stepDot} ${
                              st.done ? styles.stepDotDone : ""
                            }`}
                          >
                            {st.done ? "✓" : sIdx + 1}
                          </div>
                          <span className={styles.stepLabel}>{st.label}</span>
                        </div>
                      ))}
                    </div>

                    {/* Product Mini Row */}
                    <div className={styles.productMiniRow}>
                      <></>
                      <div className={styles.productMiniInfo}>
                        <span className={styles.productMiniTitle}>{activeOrder.item.name}</span>
                        <span className={styles.productMiniMeta}>
                          {activeOrder.item.color} • Qty: {activeOrder.item.qty}
                        </span>
                      </div>
                      <span style={{ fontWeight: 600, fontSize: "13px" }}>
                        ₹{activeOrder.item.price.toLocaleString("en-IN")}
                      </span>
                    </div>

                    <Link
                      href={`/account/orders?id=${activeOrder.id}`}
                      className={styles.outlineBtn}
                    >
                      View Order Details
                    </Link>
                  </div>

                  {/* Need urgent help? */}
                  <div className={styles.urgentCard}>
                    <div className={styles.urgentHeader}>
                      <Headphones size={22} color="#111111" />
                      <h4 className={styles.urgentTitle}>Need urgent help?</h4>
                    </div>
                    <p className={styles.urgentText}>
                      Can&apos;t find what you&apos;re looking for? Contact our support team.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
                      }}
                      className={styles.submitBtn}
                    >
                      Contact OVIA
                    </button>
                    <span className={styles.urgentSub}>We usually respond within 24 hours.</span>
                  </div>

                  {/* Important Information */}
                  <div className={styles.infoBox}>
                    <div className={styles.infoTitleRow}>
                      <Info size={16} />
                      <span>Important Information</span>
                    </div>
                    <ul className={styles.infoList}>
                      <li>You can request order cancellation within 24 hours.</li>
                      <li>Returns are available as per our Return Policy.</li>
                      <li>For delivery updates, please use the tracking link in your order.</li>
                    </ul>
                    <Link href="/faq" className={styles.infoLink}>
                      Read our Help Center →
                    </Link>
                  </div>
                </aside>
              </div>
            </div>
          )}

          {/* ========================================================
              VIEW 3: PAYMENTS & REFUNDS (Image 4)
              ======================================================== */}
          {currentView === "payments-refunds" && (
            <div className={styles.subviewContainer}>
              <div>
                <button
                  type="button"
                  onClick={() => setCurrentView("home")}
                  className={styles.backNavBtn}
                >
                  <ArrowLeft size={15} /> Back to Support
                </button>
                <h1 className={styles.pageTitle}>Payments &amp; Refunds</h1>
                <p className={styles.pageSubtitle}>
                  Get help with payments, refunds, invoices or billing related issues.
                </p>
              </div>

              <div className={styles.subviewLayout}>
                <div className={styles.subviewMain}>
                  {/* Step 1: Select an Order (Optional) */}
                  <div className={styles.stepBlock}>
                    <div className={styles.stepTitleRow}>
                      <h3 className={styles.stepTitle}>1. Select an Order (Optional)</h3>
                      <Link href="/account/orders" className={styles.viewAllLink}>
                        View All Orders <ArrowRight size={13} />
                      </Link>
                    </div>

                    <div className={styles.ordersCarousel}>
                      {FALLBACK_ORDERS.map((ord, idx) => {
                        const isSelected = selectedOrderIndex === idx;
                        return (
                          <div
                            key={ord.id}
                            onClick={() => {
                              setSelectedOrderIndex(idx);
                              setFormOrderId(ord.orderNumber);
                            }}
                            className={`${styles.orderCard} ${
                              isSelected ? styles.orderCardActive : ""
                            }`}
                          >
                            <div className={styles.orderRadioWrap}>
                              <div className={styles.customRadio}>
                                {isSelected && <div className={styles.customRadioInner} />}
                              </div>
                              <span
                                className={`${styles.statusPill} ${
                                  ord.status === "Processing"
                                    ? styles.statusOpen
                                    : ord.status === "Shipped"
                                    ? styles.statusWaiting
                                    : styles.statusResolved
                                }`}
                              >
                                {ord.status}
                              </span>
                            </div>

                            <div className={styles.orderMetaBlock}>
                              <span className={styles.orderId}>#{ord.orderNumber}</span>
                              <span className={styles.orderDate}>
                                {new Date(ord.createdAt).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                              <span className={styles.orderPrice}>
                                ₹{ord.total.toLocaleString("en-IN")}
                              </span>
                            </div>

                            <div className={styles.orderImgWrap}>
                              <></>
                            </div>

                            <div className={styles.orderCardBottom}>
                              <span className={styles.orderItemName}>{ord.item.name}</span>
                              <span className={styles.orderQty}>Qty: {ord.item.qty}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Step 2: What do you need help with? */}
                  <div className={styles.stepBlock}>
                    <h3 className={styles.stepTitle}>2. What do you need help with?</h3>
                    <p style={{ fontSize: "13px", color: "#6b7280", margin: "-6px 0 6px 0" }}>
                      Choose a payment or refund related issue.
                    </p>

                    <div className={styles.issuesGrid}>
                      {[
                        { title: "Payment Failed", desc: "Payment was unsuccessful", icon: <CreditCard size={20} /> },
                        { title: "Charged but Order Not Created", desc: "Amount deducted but no order", icon: <CreditCard size={20} /> },
                        { title: "Refund Status", desc: "Check refund progress", icon: <RotateCcw size={20} /> },
                        { title: "Invoice / Receipt", desc: "Need invoice or payment receipt", icon: <FileText size={20} /> },
                        { title: "Payment Method Issue", desc: "Card, UPI, net banking issue", icon: <CreditCard size={20} /> },
                        { title: "EMI / Offers / Discounts", desc: "Bank offers or EMI related query", icon: <CreditCard size={20} /> },
                      ].map((topic) => {
                        const isSelected = selectedTopic === topic.title;
                        return (
                          <div
                            key={topic.title}
                            onClick={() => handleSelectTopic(topic.title)}
                            className={`${styles.issueTile} ${
                              isSelected ? styles.issueTileActive : ""
                            }`}
                          >
                            <span className={styles.issueTileIcon}>{topic.icon}</span>
                            <div className={styles.issueTileContent}>
                              <h4 className={styles.issueTileTitle}>{topic.title}</h4>
                              <p className={styles.issueTileDesc}>{topic.desc}</p>
                            </div>
                            <ArrowRight size={14} className={styles.issueTileArrow} />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Step 3: Describe Your Issue */}
                  <form onSubmit={handleSubmitTicket} className={styles.describeCard} noValidate>
                    <h3 className={styles.stepTitle}>3. Describe Your Issue</h3>

                    {formGeneralError && (
                      <div className={styles.alertBannerError}>
                        <AlertTriangle size={16} />
                        <span>{formGeneralError}</span>
                      </div>
                    )}

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>
                        Subject <span className={styles.requiredAsterisk}>*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Payment failed during checkout"
                        value={formSubject}
                        onChange={(e) => {
                          setFormSubject(e.target.value);
                          clearFieldError("subject");
                        }}
                        className={`${styles.inputField} ${fieldErrors.subject ? styles.inputError : ""}`}
                      />
                      {fieldErrors.subject && (
                        <span className={styles.errorText}>
                          <AlertTriangle size={12} /> {fieldErrors.subject}
                        </span>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>
                        Message <span className={styles.requiredAsterisk}>*</span>
                      </label>
                      <textarea
                        placeholder="Please describe your issue in detail..."
                        value={formMessage}
                        onChange={(e) => {
                          setFormMessage(e.target.value);
                          clearFieldError("message");
                        }}
                        className={`${styles.textareaField} ${fieldErrors.message ? styles.inputError : ""}`}
                        rows={4}
                      />
                      {fieldErrors.message && (
                        <span className={styles.errorText}>
                          <AlertTriangle size={12} /> {fieldErrors.message}
                        </span>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Attach files (optional)</label>
                      <label className={styles.fileDropzone}>
                        <input
                          type="file"
                          multiple
                          onChange={(e) => {
                            const files = e.target.files;
                            if (files) {
                              setFormAttachments(
                                Array.from(files).map((f) => f.name).slice(0, 5)
                              );
                            }
                          }}
                          style={{ display: "none" }}
                        />
                        <Upload size={22} color="#6b7280" />
                        <div className={styles.dropzoneText}>
                          <span className={styles.dropzoneTitle}>
                            {formAttachments.length > 0
                              ? `${formAttachments.length} file(s) selected`
                              : "Click to upload or drag and drop"}
                          </span>
                          <span className={styles.dropzoneHint}>Images, PDFs (Max 5 files, 10 MB each)</span>
                        </div>
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className={styles.submitBtn}
                      style={{ width: "200px" }}
                    >
                      {submitting ? "Submitting..." : "Submit Request"}
                    </button>
                  </form>
                </div>

                {/* Right Sidebar: Selected Order & Refund Timeline */}
                <aside className={styles.subviewSidebar}>
                  <div className={styles.selectedDetailsCard}>
                    <div className={styles.orderSummaryTop}>
                      <h4 className={styles.cardHeadTitle}>Selected Order Details</h4>
                      <span
                        className={`${styles.statusPill} ${
                          activeOrder.status === "Processing"
                            ? styles.statusOpen
                            : activeOrder.status === "Shipped"
                            ? styles.statusWaiting
                            : styles.statusResolved
                        }`}
                      >
                        {activeOrder.status}
                      </span>
                    </div>

                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Order ID</span>
                      <span className={styles.detailVal}>#{activeOrder.orderNumber}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Order Date</span>
                      <span className={styles.detailVal}>
                        {new Date(activeOrder.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Total Amount</span>
                      <span className={styles.detailVal}>
                        ₹{activeOrder.total.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Payment Method</span>
                      <span className={styles.detailVal}>{activeOrder.paymentMethod}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Payment Status</span>
                      <span className={styles.detailVal} style={{ color: "#15803d" }}>
                        Successful
                      </span>
                    </div>

                    <Link
                      href={`/account/orders?id=${activeOrder.id}`}
                      className={styles.outlineBtn}
                    >
                      View Order Details
                    </Link>
                  </div>

                  {/* Refund Timeline (Example) */}
                  <div className={styles.selectedDetailsCard}>
                    <h4 className={styles.cardHeadTitle}>Refund Timeline (Example)</h4>
                    <div className={styles.refundTimeline}>
                      <div className={styles.timelineNode}>
                        <div className={`${styles.timelineDot} ${styles.timelineDotDone}`} />
                        <span className={styles.timelineNodeTitle}>Refund Requested</span>
                        <span className={styles.timelineNodeMeta}>3 Oct 2026, 10:24 AM</span>
                      </div>

                      <div className={styles.timelineNode}>
                        <div className={styles.timelineDot} />
                        <span className={styles.timelineNodeTitle}>Processing by OVIA</span>
                        <span className={styles.timelineNodeMeta}>We are verifying your request.</span>
                      </div>

                      <div className={styles.timelineNode}>
                        <div className={styles.timelineDot} />
                        <span className={styles.timelineNodeTitle}>Refund Initiated</span>
                        <span className={styles.timelineNodeMeta}>Amount sent to your bank/wallet.</span>
                      </div>

                      <div className={styles.timelineNode}>
                        <div className={styles.timelineDot} />
                        <span className={styles.timelineNodeTitle}>Refund Credit</span>
                        <span className={styles.timelineNodeMeta}>Credited to your account (3-5 working days)</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment FAQs Accordion */}
                  <div className={styles.selectedDetailsCard}>
                    <div className={styles.orderSummaryTop}>
                      <h4 className={styles.cardHeadTitle}>Frequently Asked Questions</h4>
                      <Link href="/faq" className={styles.viewAllLink}>
                        View All →
                      </Link>
                    </div>

                    <div className={styles.faqList}>
                      {FAQ_DATA.Payments.slice(0, 4).map((faq, idx) => {
                        const isOpen = expandedFaq === idx + 100;
                        return (
                          <div key={idx} className={styles.faqItem}>
                            <button
                              type="button"
                              onClick={() => setExpandedFaq(isOpen ? null : idx + 100)}
                              className={styles.faqQuestionBtn}
                              style={{ fontSize: "12.5px" }}
                            >
                              <span>{faq.q}</span>
                              {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                            {isOpen && <p className={styles.faqAnswer}>{faq.a}</p>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </aside>
              </div>
            </div>
          )}

          {/* ========================================================
              VIEW 4: SHIPPING & TRACKING (Image 5)
              ======================================================== */}
          {currentView === "shipping-tracking" && (
            <div className={styles.subviewContainer}>
              <div>
                <button
                  type="button"
                  onClick={() => setCurrentView("home")}
                  className={styles.backNavBtn}
                >
                  <ArrowLeft size={15} /> Back to Support
                </button>
                <h1 className={styles.pageTitle}>Shipping &amp; Tracking</h1>
                <p className={styles.pageSubtitle}>
                  Track your orders, get delivery updates or report delivery related issues.
                </p>
              </div>

              <div className={styles.subviewLayout}>
                <div className={styles.subviewMain}>
                  {/* Step 1: Select an Order */}
                  <div className={styles.stepBlock}>
                    <div className={styles.stepTitleRow}>
                      <h3 className={styles.stepTitle}>1. Select an Order</h3>
                      <Link href="/account/orders" className={styles.viewAllLink}>
                        View All Orders <ArrowRight size={13} />
                      </Link>
                    </div>

                    <div className={styles.ordersCarousel}>
                      {FALLBACK_ORDERS.map((ord, idx) => {
                        const isSelected = selectedOrderIndex === idx;
                        return (
                          <div
                            key={ord.id}
                            onClick={() => {
                              setSelectedOrderIndex(idx);
                              setFormOrderId(ord.orderNumber);
                            }}
                            className={`${styles.orderCard} ${
                              isSelected ? styles.orderCardActive : ""
                            }`}
                          >
                            <div className={styles.orderRadioWrap}>
                              <div className={styles.customRadio}>
                                {isSelected && <div className={styles.customRadioInner} />}
                              </div>
                              <span
                                className={`${styles.statusPill} ${
                                  ord.status === "Processing"
                                    ? styles.statusOpen
                                    : ord.status === "Shipped"
                                    ? styles.statusWaiting
                                    : styles.statusResolved
                                }`}
                              >
                                {ord.status}
                              </span>
                            </div>

                            <div className={styles.orderMetaBlock}>
                              <span className={styles.orderId}>#{ord.orderNumber}</span>
                              <span className={styles.orderDate}>
                                {new Date(ord.createdAt).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                              <span className={styles.orderPrice}>
                                ₹{ord.total.toLocaleString("en-IN")}
                              </span>
                            </div>

                            <div className={styles.orderImgWrap}>
                              <></>
                            </div>

                            <div className={styles.orderCardBottom}>
                              <span className={styles.orderItemName}>{ord.item.name}</span>
                              <span className={styles.orderQty}>Qty: {ord.item.qty}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Step 2: What do you need help with? */}
                  <div className={styles.stepBlock}>
                    <h3 className={styles.stepTitle}>2. What do you need help with?</h3>
                    <p style={{ fontSize: "13px", color: "#6b7280", margin: "-6px 0 6px 0" }}>
                      Choose a shipping or delivery related issue.
                    </p>

                    <div className={styles.issuesGrid}>
                      {[
                        { title: "Track My Order", desc: "Check real-time delivery status", icon: <Truck size={20} /> },
                        { title: "Delayed Delivery", desc: "Order not received on time", icon: <Clock size={20} /> },
                        { title: "Tracking Not Updating", desc: "No recent tracking updates", icon: <Truck size={20} /> },
                        { title: "Delivery Failed / NDR", desc: "Re-attempt or reschedule", icon: <AlertTriangle size={20} /> },
                        { title: "Address Change", desc: "Update delivery address", icon: <MapPin size={20} /> },
                        { title: "Wrong / Missing Item", desc: "Item not received or different item", icon: <Package size={20} /> },
                        { title: "Damaged Package", desc: "Received damaged parcel", icon: <Package size={20} /> },
                        { title: "Self Pickup / Store Delivery", desc: "Store pickup related query", icon: <MapPin size={20} /> },
                        { title: "Other Shipping Issue", desc: "Any other delivery related issue", icon: <HelpCircle size={20} /> },
                      ].map((topic) => {
                        const isSelected = selectedTopic === topic.title;
                        return (
                          <div
                            key={topic.title}
                            onClick={() => handleSelectTopic(topic.title)}
                            className={`${styles.issueTile} ${
                              isSelected ? styles.issueTileActive : ""
                            }`}
                          >
                            <span className={styles.issueTileIcon}>{topic.icon}</span>
                            <div className={styles.issueTileContent}>
                              <h4 className={styles.issueTileTitle}>{topic.title}</h4>
                              <p className={styles.issueTileDesc}>{topic.desc}</p>
                            </div>
                            <ArrowRight size={14} className={styles.issueTileArrow} />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Step 3: Describe Your Issue */}
                  <form onSubmit={handleSubmitTicket} className={styles.describeCard} noValidate>
                    <h3 className={styles.stepTitle}>3. Describe Your Issue</h3>

                    {formGeneralError && (
                      <div className={styles.alertBannerError}>
                        <AlertTriangle size={16} />
                        <span>{formGeneralError}</span>
                      </div>
                    )}

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>
                        Subject <span className={styles.requiredAsterisk}>*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Tracking not updating"
                        value={formSubject}
                        onChange={(e) => {
                          setFormSubject(e.target.value);
                          clearFieldError("subject");
                        }}
                        className={`${styles.inputField} ${fieldErrors.subject ? styles.inputError : ""}`}
                      />
                      {fieldErrors.subject && (
                        <span className={styles.errorText}>
                          <AlertTriangle size={12} /> {fieldErrors.subject}
                        </span>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>
                        Message <span className={styles.requiredAsterisk}>*</span>
                      </label>
                      <textarea
                        placeholder="Please describe your issue in detail..."
                        value={formMessage}
                        onChange={(e) => {
                          setFormMessage(e.target.value);
                          clearFieldError("message");
                        }}
                        className={`${styles.textareaField} ${fieldErrors.message ? styles.inputError : ""}`}
                        rows={4}
                      />
                      {fieldErrors.message && (
                        <span className={styles.errorText}>
                          <AlertTriangle size={12} /> {fieldErrors.message}
                        </span>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Attach files (optional)</label>
                      <label className={styles.fileDropzone}>
                        <input
                          type="file"
                          multiple
                          onChange={(e) => {
                            const files = e.target.files;
                            if (files) {
                              setFormAttachments(
                                Array.from(files).map((f) => f.name).slice(0, 5)
                              );
                            }
                          }}
                          style={{ display: "none" }}
                        />
                        <Upload size={22} color="#6b7280" />
                        <div className={styles.dropzoneText}>
                          <span className={styles.dropzoneTitle}>
                            {formAttachments.length > 0
                              ? `${formAttachments.length} file(s) selected`
                              : "Click to upload or drag and drop"}
                          </span>
                          <span className={styles.dropzoneHint}>Images, PDFs (Max 5 files, 10 MB each)</span>
                        </div>
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className={styles.submitBtn}
                      style={{ width: "200px" }}
                    >
                      {submitting ? "Submitting..." : "Submit Request"}
                    </button>
                  </form>
                </div>

                {/* Right Sidebar: Tracking Details & Live Tracking Map */}
                <aside className={styles.subviewSidebar}>
                  <div className={styles.selectedDetailsCard}>
                    <div className={styles.orderSummaryTop}>
                      <h4 className={styles.cardHeadTitle}>Tracking Details</h4>
                      <button
                        type="button"
                        onClick={() => setToastMessage("Tracking status refreshed from Delhivery.")}
                        className={styles.viewAllLink}
                      >
                        Refresh ⟳
                      </button>
                    </div>

                    <div className={styles.productMiniRow}>
                      <></>
                      <div className={styles.productMiniInfo}>
                        <span className={styles.productMiniTitle}>
                          #{activeOrder.orderNumber}
                        </span>
                        <span className={styles.productMiniMeta}>
                          {activeOrder.item.name} - {activeOrder.item.color}
                        </span>
                      </div>
                      <span
                        className={`${styles.statusPill} ${styles.statusOpen}`}
                      >
                        {activeOrder.status}
                      </span>
                    </div>

                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Courier Partner</span>
                      <span className={styles.detailVal}>Delhivery Express</span>
                    </div>

                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Tracking Number</span>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span className={styles.detailVal}>
                          {activeOrder.tracking.trackingNumber}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyTracking(activeOrder.tracking.trackingNumber)}
                          title="Copy tracking number"
                          style={{ background: "none", border: "none", cursor: "pointer", padding: "2px" }}
                        >
                          <Copy size={13} color="#4b5563" />
                        </button>
                      </div>
                    </div>

                    <a
                      href={`https://www.delhivery.com/track/package/${activeOrder.tracking.trackingNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.viewAllLink}
                      style={{ justifyContent: "flex-end" }}
                    >
                      Visit Tracking Page <ExternalLink size={12} />
                    </a>

                    {/* Vertical Timeline */}
                    <div className={styles.refundTimeline} style={{ marginTop: "14px" }}>
                      {activeOrder.tracking.steps.map((st, sIdx) => (
                        <div key={sIdx} className={styles.timelineNode}>
                          <div
                            className={`${styles.timelineDot} ${
                              st.done ? styles.timelineDotDone : ""
                            }`}
                          />
                          <span className={styles.timelineNodeTitle}>{st.label}</span>
                          <span style={{ fontSize: "11px", color: "#6b7280" }}>{st.date}</span>
                          <span className={styles.timelineNodeMeta}>{st.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Live Tracking (Example) Map Card */}
                  <div className={styles.selectedDetailsCard}>
                    <h4 className={styles.cardHeadTitle}>Live Tracking (Example)</h4>
                    <div className={styles.liveTrackingBox}>
                      <svg
                        className={styles.mapPreviewSvg}
                        viewBox="0 0 300 120"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        {/* Map road lines */}
                        <path
                          d="M 30 70 Q 90 40 140 80 T 260 50"
                          stroke="#cbd5e1"
                          strokeWidth="4"
                          strokeDasharray="4 4"
                        />
                        <path
                          d="M 30 70 Q 90 40 140 80"
                          stroke="#111111"
                          strokeWidth="4"
                        />
                        {/* Hub points */}
                        <circle cx="30" cy="70" r="5" fill="#111111" />
                        <text x="20" y="92" fontSize="9" fill="#64748b" fontWeight="600">
                          Jaipur
                        </text>

                        <circle cx="140" cy="80" r="6" fill="#0b6b5d" />
                        <text x="120" y="104" fontSize="9" fill="#0b6b5d" fontWeight="700">
                          Jaipur Hub
                        </text>

                        <circle cx="260" cy="50" r="5" fill="#94a3b8" />
                        <text x="245" y="72" fontSize="9" fill="#64748b" fontWeight="600">
                          Delhi
                        </text>

                        {/* Truck icon on current location */}
                        <rect x="132" y="58" width="16" height="12" rx="2" fill="#111111" />
                        <circle cx="135" cy="72" r="2.5" fill="#ffffff" />
                        <circle cx="145" cy="72" r="2.5" fill="#ffffff" />
                      </svg>

                      <div className={styles.trackingHubBadge}>
                        <span className={styles.trackingHubTitle}>In Transit - Jaipur Hub</span>
                        <span className={styles.trackingHubTime}>5 Oct, 09:30 AM • On schedule</span>
                      </div>
                    </div>
                  </div>
                </aside>
              </div>
            </div>
          )}

          {/* ========================================================
              VIEW 5: RETURNS & EXCHANGES (Image 3)
              ======================================================== */}
          {currentView === "returns-exchanges" && (
            <div className={styles.subviewContainer}>
              <div>
                <button
                  type="button"
                  onClick={() => setCurrentView("home")}
                  className={styles.backNavBtn}
                >
                  <ArrowLeft size={15} /> Back to Support
                </button>
                <h1 className={styles.pageTitle}>Returns &amp; Exchanges</h1>
                <p className={styles.pageSubtitle}>
                  Start a return, request an exchange, check the status, or get help with a return.
                </p>
              </div>

              {formGeneralError && (
                <div className={styles.alertBannerError}>
                  <AlertTriangle size={18} />
                  <span>{formGeneralError}</span>
                </div>
              )}

              <div className={styles.subviewLayout}>
                <div className={styles.subviewMain}>
                  {/* Step 1: Select an Order */}
                  <div className={styles.stepBlock}>
                    <div className={styles.stepTitleRow}>
                      <h3 className={styles.stepTitle}>1. Select an Order</h3>
                      <Link href="/account/orders" className={styles.viewAllLink}>
                        View All Orders <ArrowRight size={13} />
                      </Link>
                    </div>

                    <div className={styles.ordersCarousel}>
                      {ordersList.map((ord, idx) => {
                        const isSelected = selectedOrderIndex === idx;
                        return (
                          <div
                            key={ord.id}
                            onClick={() => {
                              setSelectedOrderIndex(idx);
                              clearFieldError("item");
                            }}
                            className={`${styles.orderCard} ${
                              isSelected ? styles.orderCardActive : ""
                            }`}
                          >
                            <div className={styles.orderRadioWrap}>
                              <div className={styles.customRadio}>
                                {isSelected && <div className={styles.customRadioInner} />}
                              </div>
                              <span
                                className={styles.statusPill}
                                style={{ background: "#fef3c7", color: "#92400e" }}
                              >
                                Delivered
                              </span>
                            </div>

                            <div className={styles.orderMetaBlock}>
                              <span className={styles.orderId}>#{ord.orderNumber}</span>
                              <span className={styles.orderDate}>
                                {new Date(ord.createdAt).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                              <span className={styles.orderPrice}>
                                ₹{ord.total.toLocaleString("en-IN")}
                              </span>
                            </div>

                            <div className={styles.orderImgWrap}>
                              <></>
                            </div>

                            <div className={styles.orderCardBottom}>
                              <span className={styles.orderItemName}>{ord.item.name}</span>
                              <span className={styles.orderQty}>Qty: {ord.item.qty}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Step 2: What would you like to do? */}
                  <div className={styles.stepBlock}>
                    <h3 className={styles.stepTitle}>2. What would you like to do?</h3>
                    <p style={{ fontSize: "13px", color: "#6b7280", margin: "-6px 0 6px 0" }}>
                      Choose an option to proceed. Check our return &amp; exchange policy before requesting.
                    </p>

                    <div className={styles.returnActionsGrid}>
                      {[
                        {
                          title: "Return Product",
                          desc: "Get a refund for your order",
                          icon: <RotateCcw size={20} />,
                        },
                        {
                          title: "Exchange Product",
                          desc: "Replace with a different item, size or color",
                          icon: <RotateCcw size={20} />,
                        },
                        {
                          title: "Wrong / Damaged Item",
                          desc: "Received different or damaged product",
                          icon: <Package size={20} />,
                        },
                        {
                          title: "Size / Color Exchange",
                          desc: "Request a different size or color",
                          icon: <Tag size={20} />,
                        },
                      ].map((act) => {
                        const isSelected = returnAction === act.title;
                        return (
                          <div
                            key={act.title}
                            onClick={() => {
                              setReturnAction(act.title);
                              clearFieldError("photos");
                            }}
                            className={`${styles.returnActionCard} ${
                              isSelected ? styles.returnActionCardActive : ""
                            }`}
                          >
                            <span className={styles.returnActionIcon}>{act.icon}</span>
                            <div className={styles.returnActionContent}>
                              <h4 className={styles.returnActionTitle}>{act.title}</h4>
                              <p className={styles.returnActionDesc}>{act.desc}</p>
                            </div>
                            <ArrowRight size={14} className={styles.returnActionArrow} />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Step 3: Select Item(s) to Return */}
                  <div className={styles.stepBlock}>
                    <h3 className={styles.stepTitle}>3. Select Item(s) to Return</h3>

                    <div className={`${styles.returnItemCard} ${fieldErrors.item ? styles.inputError : ""}`}>
                      <div className={styles.returnItemMain}>
                        <label className={styles.returnCheckboxWrap}>
                          <input
                            type="checkbox"
                            checked={isReturnItemSelected}
                            onChange={(e) => {
                              setIsReturnItemSelected(e.target.checked);
                              clearFieldError("item");
                            }}
                            className={styles.returnCheckbox}
                          />
                        </label>

                        <div className={styles.returnItemThumb}>
                          <></>
                        </div>

                        <div className={styles.returnItemInfo}>
                          <span className={styles.returnItemName}>
                            {activeOrder.item.name} - {activeOrder.item.color}
                          </span>
                          <span className={styles.returnItemPrice}>
                            ₹{activeOrder.item.price.toLocaleString("en-IN")}
                          </span>
                          <span className={styles.returnItemMeta}>
                            Qty: {activeOrder.item.qty} • Delivered on{" "}
                            {new Date(activeOrder.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>

                        {/* Dropdowns for Reason and Condition */}
                        <div className={styles.returnItemDropdowns}>
                          <div>
                            <label className={styles.fieldLabelWithRequired}>
                              Reason for return <span className={styles.requiredAsterisk}>*</span>
                            </label>
                            <select
                              value={returnReason}
                              onChange={(e) => {
                                setReturnReason(e.target.value);
                                clearFieldError("reason");
                              }}
                              className={`${styles.selectField} ${
                                fieldErrors.reason ? styles.inputError : ""
                              }`}
                            >
                              <option value="Select a reason" disabled>
                                Select a reason
                              </option>
                              <option value="Size / fit doesn't match">Size / fit doesn&apos;t match</option>
                              <option value="Item defective or damaged">Item defective or damaged</option>
                              <option value="Different from photos / description">
                                Different from photos / description
                              </option>
                              <option value="Changed my mind">Changed my mind</option>
                              <option value="Arrived later than expected">Arrived later than expected</option>
                              <option value="Received incorrect item">Received incorrect item</option>
                            </select>
                            {fieldErrors.reason && (
                              <span className={styles.errorText}>
                                <AlertTriangle size={12} /> {fieldErrors.reason}
                              </span>
                            )}
                          </div>

                          <div>
                            <label className={styles.fieldLabelWithRequired}>
                              Condition <span className={styles.requiredAsterisk}>*</span>
                            </label>
                            <select
                              value={returnCondition}
                              onChange={(e) => {
                                setReturnCondition(e.target.value);
                                clearFieldError("condition");
                              }}
                              className={`${styles.selectField} ${
                                fieldErrors.condition ? styles.inputError : ""
                              }`}
                            >
                              <option value="Select condition" disabled>
                                Select condition
                              </option>
                              <option value="Brand new with tags & original packaging">
                                Brand new with tags &amp; original packaging
                              </option>
                              <option value="Unused in protective dust bag">
                                Unused in protective dust bag
                              </option>
                              <option value="Opened and inspected but unused">
                                Opened and inspected but unused
                              </option>
                              <option value="Defective / Damaged upon unboxing">
                                Defective / Damaged upon unboxing
                              </option>
                            </select>
                            {fieldErrors.condition && (
                              <span className={styles.errorText}>
                                <AlertTriangle size={12} /> {fieldErrors.condition}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {fieldErrors.item && (
                        <span className={styles.errorText} style={{ marginTop: "4px" }}>
                          <AlertTriangle size={13} /> {fieldErrors.item}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Step 4: Additional Details */}
                  <form onSubmit={handleSubmitReturn} className={styles.stepBlock} noValidate>
                    <h3 className={styles.stepTitle}>4. Additional Details</h3>

                    <div className={styles.returnDetailsGrid}>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Comments (optional)</label>
                        <textarea
                          placeholder="Please tell us more about your return request..."
                          value={returnComments}
                          onChange={(e) => setReturnComments(e.target.value)}
                          className={styles.textareaField}
                          rows={4}
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>
                          Upload photos{" "}
                          {(returnAction === "Wrong / Damaged Item" || returnReason === "Item defective or damaged") && (
                            <span className={styles.requiredAsterisk}>(required for damaged/wrong item)</span>
                          )}
                        </label>
                        <label
                          className={`${styles.fileDropzone} ${
                            fieldErrors.photos ? styles.inputError : ""
                          }`}
                        >
                          <input
                            type="file"
                            multiple
                            accept="image/*,application/pdf"
                            onChange={(e) => {
                              const files = e.target.files;
                              if (files) {
                                setReturnAttachments(
                                  Array.from(files).map((f) => f.name).slice(0, 5)
                                );
                                clearFieldError("photos");
                              }
                            }}
                            style={{ display: "none" }}
                          />
                          <Upload size={22} color="#6b7280" />
                          <div className={styles.dropzoneText}>
                            <span className={styles.dropzoneTitle}>
                              {returnAttachments.length > 0
                                ? `${returnAttachments.length} file(s) selected`
                                : "Click to upload or drag and drop"}
                            </span>
                            <span className={styles.dropzoneHint}>
                              Images (Max 5 files, 10 MB each)
                            </span>
                          </div>
                        </label>
                        {fieldErrors.photos && (
                          <span className={styles.errorText}>
                            <AlertTriangle size={12} /> {fieldErrors.photos}
                          </span>
                        )}
                        {returnAttachments.length > 0 && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" }}>
                            {returnAttachments.map((fName, fIdx) => (
                              <span
                                key={fIdx}
                                style={{
                                  fontSize: "11.5px",
                                  background: "#f3f4f6",
                                  padding: "3px 8px",
                                  borderRadius: "4px",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                {fName}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={returnSubmitting}
                      className={styles.submitBtn}
                      style={{ width: "220px", marginTop: "8px" }}
                    >
                      {returnSubmitting ? "Submitting..." : "Submit Return Request"}
                    </button>
                  </form>
                </div>

                {/* Right Sidebar: Selected Order Details, Process, Policy, Help */}
                <aside className={styles.subviewSidebar}>
                  {/* Selected Order Details */}
                  <div className={styles.selectedDetailsCard}>
                    <div className={styles.orderSummaryTop}>
                      <h4 className={styles.cardHeadTitle}>Selected Order Details</h4>
                      <Link
                        href={`/account/orders?id=${activeOrder.id}`}
                        className={styles.viewAllLink}
                      >
                        View Order <ArrowRight size={12} />
                      </Link>
                    </div>

                    <div className={styles.productMiniRow} style={{ borderBottom: "1px solid #f3f4f6", paddingBottom: "14px" }}>
                      <></>
                      <div className={styles.productMiniInfo}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span className={styles.productMiniTitle}>
                            #{activeOrder.orderNumber}
                          </span>
                          <span
                            className={styles.statusPill}
                            style={{ background: "#fef3c7", color: "#92400e", fontSize: "11px", padding: "1px 6px" }}
                          >
                            Delivered
                          </span>
                        </div>
                        <span className={styles.productMiniMeta}>
                          {activeOrder.item.name} - {activeOrder.item.color}
                        </span>
                        <span className={styles.productMiniMeta}>Qty: {activeOrder.item.qty}</span>
                      </div>
                      <span style={{ fontWeight: 600, fontSize: "13px" }}>
                        ₹{activeOrder.total.toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Order Date</span>
                      <span className={styles.detailVal}>
                        {new Date(activeOrder.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Delivered On</span>
                      <span className={styles.detailVal}>
                        {new Date(activeOrder.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Payment Method</span>
                      <span className={styles.detailVal}>{activeOrder.paymentMethod}</span>
                    </div>

                    <Link
                      href={`/account/orders?id=${activeOrder.id}`}
                      className={styles.outlineBtn}
                    >
                      View Order Details
                    </Link>
                  </div>

                  {/* Return & Exchange Process (4 Steps) */}
                  <div className={styles.processCard}>
                    <h4 className={styles.cardHeadTitle}>Return &amp; Exchange Process</h4>
                    <div className={styles.processList}>
                      <div className={styles.processItem}>
                        <div className={styles.processCircle}>
                          <Check size={14} />
                        </div>
                        <span className={styles.processTitle}>1 &nbsp; Request</span>
                        <span className={styles.processDesc}>Submit return or exchange request</span>
                      </div>

                      <div className={styles.processItem}>
                        <div className={styles.processCircle}>2</div>
                        <span className={styles.processTitle}>2 &nbsp; Pickup</span>
                        <span className={styles.processDesc}>We&apos;ll arrange a pickup from your address</span>
                      </div>

                      <div className={styles.processItem}>
                        <div className={styles.processCircle}>3</div>
                        <span className={styles.processTitle}>3 &nbsp; Quality Check</span>
                        <span className={styles.processDesc}>Item is inspected at our warehouse</span>
                      </div>

                      <div className={styles.processItem}>
                        <div className={styles.processCircle}>4</div>
                        <span className={styles.processTitle}>4 &nbsp; Refund / Exchange</span>
                        <span className={styles.processDesc}>
                          Refund to your original payment method or exchange item is shipped to you
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Return & Exchange Policy */}
                  <div className={styles.policyCard}>
                    <div className={styles.orderSummaryTop}>
                      <h4 className={styles.cardHeadTitle}>Return &amp; Exchange Policy</h4>
                      <Link href="/faq" className={styles.viewAllLink}>
                        View Full Policy →
                      </Link>
                    </div>

                    <div className={styles.policyGrid}>
                      <div className={styles.policyCol}>
                        <Calendar size={22} className={styles.policyIcon} />
                        <span className={styles.policyColTitle}>Return Window</span>
                        <span className={styles.policyColDesc}>Within 7 days of delivery</span>
                      </div>

                      <div className={styles.policyCol}>
                        <ShieldCheck size={22} className={styles.policyIcon} />
                        <span className={styles.policyColTitle}>Eligible Items</span>
                        <span className={styles.policyColDesc}>Unused, with tags and original packaging</span>
                      </div>

                      <div className={styles.policyCol}>
                        <Package size={22} className={styles.policyIcon} />
                        <span className={styles.policyColTitle}>Non-Returnable</span>
                        <span className={styles.policyColDesc}>Personalised items, gift cards, final sale</span>
                      </div>
                    </div>
                  </div>

                  {/* Need Help? */}
                  <div className={styles.needHelpBox}>
                    <div className={styles.needHelpHeader}>
                      <Headphones size={22} color="#111111" />
                      <div>
                        <h4 className={styles.needHelpTitle}>Need Help?</h4>
                        <p className={styles.needHelpText}>Our support team is here to assist you.</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => goToView("home", "Order Help")}
                      className={styles.outlineBtn}
                      style={{ marginTop: "4px" }}
                    >
                      Contact Support
                    </button>
                  </div>
                </aside>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
