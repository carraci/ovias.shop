"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Home,
  Package,
  Heart,
  UserRound,
  MapPin,
  CreditCard,
  FileCheck,
  HelpCircle,
  LogOut,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  Mail,
  Phone,
  Calendar,
  Plus,
  Check,
  X,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";

import { request, useStore } from "@/components/store-provider";
import { money } from "@/lib/catalog";
import type { Order } from "@/lib/types";
import { AuthExperience } from "@/components/auth-experience";

interface WishlistItem {
  id: string;
  name: string;
  price: string;
  image: string;
  slug: string;
  liked: boolean;
}

const initialWishlist: WishlistItem[] = [
  {
    id: "wish-1",
    name: "Voyage Duffel",
    price: "₹28,000.00",
    image: "/media/account/wishlist-voyage-duffel.png",
    slug: "meridian-duffle-bag",
    liked: true,
  },
  {
    id: "wish-2",
    name: "Signature Tote",
    price: "₹31,500.00",
    image: "/media/account/wishlist-signature-tote.png",
    slug: "forma-cabin",
    liked: true,
  },
  {
    id: "wish-3",
    name: "City Crossbody",
    price: "₹18,000.00",
    image: "/media/account/wishlist-city-crossbody.png",
    slug: "passage-organisers",
    liked: true,
  },
  {
    id: "wish-4",
    name: "Horizon Cabin",
    price: "₹22,500.00",
    image: "/media/cart/rec-horizon-cabin.png",
    slug: "forma-cabin",
    liked: true,
  },
  {
    id: "wish-5",
    name: "Packing Case",
    price: "₹9,500.00",
    image: "/media/cart/rec-packing-case.png",
    slug: "passage-organisers",
    liked: true,
  },
];

export default function AccountPage() {
  const { user, refresh, setQuantity } = useStore();
  const router = useRouter();
  const pathname = usePathname();

  // Active section tab
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>(initialWishlist);
  const [wishlistScrollIdx, setWishlistScrollIdx] = useState(0);

  // User profile state
  const [profile, setProfile] = useState({
    name: user?.name || "Adarsh Shukla",
    email: user?.email || "adarsh@gmail.com",
    phone: "+91 98765 43210",
    dob: "14 May 2003",
  });

  // Modal states
  const [editDetailsOpen, setEditDetailsOpen] = useState(false);
  const [addPaymentOpen, setAddPaymentOpen] = useState(false);
  const [notification, setNotification] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Sync user state
  useEffect(() => {
    if (user?.name) {
      setProfile((prev) => ({
        ...prev,
        name: user.name,
        email: user.email,
      }));
    }
  }, [user]);

  // Handle route sections if navigated directly (e.g. /account/orders)
  useEffect(() => {
    const parts = pathname.split("/").filter(Boolean);
    const last = parts[parts.length - 1];
    if (last && ["orders", "wishlist", "details", "addresses", "payments", "registration", "support"].includes(last)) {
      setActiveTab(last);
    } else if (pathname === "/account" || pathname === "/account/") {
      setActiveTab("overview");
    }
  }, [pathname]);

  // Fetch orders if available
  useEffect(() => {
    if (user) {
      request<Order[]>("account/orders")
        .then((res) => setOrders(res))
        .catch(() => {})
        .finally(() => setLoaded(true));
    }
  }, [user?.id]);

  // Auth routing for explicit auth modes
  const recovery = pathname.split("/").at(-1);
  if (
    recovery === "forgot-password" ||
    recovery === "reset-password" ||
    recovery === "verify-email" ||
    recovery === "sign-in" ||
    recovery === "register"
  ) {
    return <AuthExperience initialMode={recovery} />;
  }

  // Handle Sign Out
  const handleSignOut = async () => {
    try {
      await request("auth/logout", "POST", {});
    } catch {
      // Ignore network error on logout
    }
    await refresh();
    router.push("/account/sign-in");
  };

  // Toggle wishlist like
  const toggleWishlist = (id: string) => {
    setWishlistItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, liked: !item.liked } : item
      )
    );
  };

  // Wishlist carousel next/prev
  const handleWishlistNext = () => {
    setWishlistScrollIdx((prev) => (prev + 1) % (wishlistItems.length - 2));
  };

  // Re-buy / add to cart
  const handleBuyAgain = async () => {
    try {
      await setQuantity("OV-MERIDIAN-CABIN-0", 1);
      setNotification("Meridian Cabin added to your bag.");
      setTimeout(() => setNotification(""), 3500);
    } catch {
      setNotification("Added to bag.");
      setTimeout(() => setNotification(""), 3500);
    }
  };

  const displayName = profile.name || "Adarsh Shukla";
  const firstName = displayName.split(" ")[0];
  const initial = firstName.charAt(0).toUpperCase() || "A";

  const visibleWishlist = wishlistItems.slice(wishlistScrollIdx, wishlistScrollIdx + 3);

  return (
    <div className="account-portal-wrap">
      <div className="account-portal-container">
        {/* Toast notification */}
        {notification && (
          <div className="account-toast-notification" role="status">
            <Check size={16} />
            <span>{notification}</span>
          </div>
        )}

        {/* ─── Left Sidebar ─── */}
        <aside className="account-sidebar">
          {/* User Profile Card */}
          <div className="account-user-card">
            <div className="account-avatar-circle" aria-hidden="true">
              <span>{initial}</span>
            </div>
            <div className="account-user-meta">
              <h2 className="account-user-name">{displayName}</h2>
              <p className="account-user-email">{profile.email}</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="account-nav-list" aria-label="Account navigation">
            <button
              type="button"
              className={`account-nav-item ${activeTab === "overview" ? "is-active" : ""}`}
              onClick={() => setActiveTab("overview")}
            >
              <Home size={18} strokeWidth={1.6} />
              <span>Overview</span>
            </button>

            <button
              type="button"
              className={`account-nav-item ${activeTab === "orders" ? "is-active" : ""}`}
              onClick={() => setActiveTab("orders")}
            >
              <Package size={18} strokeWidth={1.6} />
              <span>My Orders</span>
            </button>

            <button
              type="button"
              className={`account-nav-item ${activeTab === "wishlist" ? "is-active" : ""}`}
              onClick={() => setActiveTab("wishlist")}
            >
              <Heart size={18} strokeWidth={1.6} />
              <span>Wishlist</span>
            </button>

            <button
              type="button"
              className={`account-nav-item ${activeTab === "details" ? "is-active" : ""}`}
              onClick={() => setActiveTab("details")}
            >
              <UserRound size={18} strokeWidth={1.6} />
              <span>Personal Details</span>
            </button>

            <button
              type="button"
              className={`account-nav-item ${activeTab === "addresses" ? "is-active" : ""}`}
              onClick={() => setActiveTab("addresses")}
            >
              <MapPin size={18} strokeWidth={1.6} />
              <span>Address Book</span>
            </button>

            <button
              type="button"
              className={`account-nav-item ${activeTab === "payments" ? "is-active" : ""}`}
              onClick={() => setActiveTab("payments")}
            >
              <CreditCard size={18} strokeWidth={1.6} />
              <span>Payment Methods</span>
            </button>

            <button
              type="button"
              className={`account-nav-item ${activeTab === "registration" ? "is-active" : ""}`}
              onClick={() => setActiveTab("registration")}
            >
              <FileCheck size={18} strokeWidth={1.6} />
              <span>Product Registration</span>
            </button>

            <button
              type="button"
              className={`account-nav-item ${activeTab === "support" ? "is-active" : ""}`}
              onClick={() => setActiveTab("support")}
            >
              <HelpCircle size={18} strokeWidth={1.6} />
              <span>Help & Support</span>
            </button>

            <div className="account-nav-divider" />

            <button
              type="button"
              className="account-nav-item sign-out-item"
              onClick={handleSignOut}
            >
              <LogOut size={18} strokeWidth={1.6} />
              <span>Sign Out</span>
            </button>
          </nav>
        </aside>

        {/* ─── Main Content Area ─── */}
        <main className="account-main-content">
          {/* Top Greeting + Concierge Row */}
          <div className="account-hero-row">
            {/* Header Greeting */}
            <div className="account-greeting-block">
              <h1 className="account-brand-title">My OVIA</h1>
              <p className="account-welcome-sub">Welcome back, {firstName}</p>
              <p className="account-welcome-desc">
                Manage your orders, wishlist and account details all in one place.
              </p>
            </div>

            {/* OVIA Concierge Card */}
            <div className="account-concierge-card">
              <div className="concierge-content">
                <span className="concierge-eyebrow">OVIA CONCIERGE</span>
                <h3 className="concierge-title">A more personal travel experience</h3>
                <p className="concierge-desc">
                  Get expert advice, travel recommendations and personalised assistance.
                </p>
                <Link href="/contact-us" className="concierge-link">
                  <span>Contact Concierge</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
              <div className="concierge-image-wrap">
                <Image
                  src="/media/account/concierge-lake.png"
                  alt="OVIA luggage by scenic lake terrace"
                  width={242}
                  height={127}
                  className="concierge-img"
                  priority
                />
              </div>
            </div>
          </div>

          {/* Row 1: Recent Orders & Your Wishlist */}
          <div className="account-two-col-grid">
            {/* Recent Orders */}
            <section className="account-section-card orders-card">
              <div className="account-card-header">
                <h3 className="account-card-title">Recent orders</h3>
                <button
                  type="button"
                  className="account-card-link"
                  onClick={() => setActiveTab("orders")}
                >
                  View all orders →
                </button>
              </div>

              <div className="account-order-item">
                <div className="order-item-img-wrap">
                  <Image
                    src="/media/account/order-meridian.png"
                    alt="Meridian Cabin in Graphite"
                    width={108}
                    height={111}
                    className="order-item-img"
                  />
                </div>

                <div className="order-item-details">
                  <div className="order-meta-line">
                    <span className="order-id">Order #OV241568</span>
                    <span className="order-date">12 Sep 2026</span>
                  </div>

                  <div className="order-title-price-line">
                    <div>
                      <h4 className="order-product-name">Meridian Cabin</h4>
                      <p className="order-product-variant">Graphite</p>
                      <p className="order-product-qty">Qty: 1</p>
                    </div>
                    <span className="order-price">₹24,500.00</span>
                  </div>

                  <div className="order-status-badge">
                    <span className="status-dot" />
                    <span>Delivered</span>
                  </div>

                  <p className="order-status-msg">Your order has been delivered.</p>

                  <div className="order-actions">
                    <Link href="/orders/OV241568/confirmation" className="btn-order-view">
                      View details
                    </Link>
                    <button
                      type="button"
                      className="btn-order-reorder"
                      onClick={handleBuyAgain}
                    >
                      Buy again
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Your Wishlist */}
            <section className="account-section-card wishlist-card">
              <div className="account-card-header">
                <h3 className="account-card-title">Your wishlist</h3>
                <button
                  type="button"
                  className="account-card-link"
                  onClick={() => setActiveTab("wishlist")}
                >
                  View all →
                </button>
              </div>

              <div className="account-wishlist-row">
                <div className="wishlist-items-grid">
                  {visibleWishlist.map((item) => (
                    <article className="wishlist-item-tile" key={item.id}>
                      <div className="wishlist-tile-img-wrap">
                        <Link href={`/products/${item.slug}`}>
                          <Image
                            src={item.image}
                            alt={item.name}
                            width={107}
                            height={92}
                            className="wishlist-tile-img"
                          />
                        </Link>
                        <button
                          type="button"
                          className="wishlist-tile-heart"
                          aria-label={`Remove ${item.name} from wishlist`}
                          onClick={() => toggleWishlist(item.id)}
                        >
                          <Heart
                            size={14}
                            strokeWidth={1.5}
                            fill={item.liked ? "#1f3b25" : "none"}
                            color={item.liked ? "#1f3b25" : "#333"}
                          />
                        </button>
                      </div>
                      <Link href={`/products/${item.slug}`}>
                        <h4 className="wishlist-tile-title">{item.name}</h4>
                      </Link>
                      <span className="wishlist-tile-price">{item.price}</span>
                    </article>
                  ))}
                </div>

                <button
                  type="button"
                  className="wishlist-carousel-arrow"
                  aria-label="Next wishlist item"
                  onClick={handleWishlistNext}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </section>
          </div>

          {/* Row 2: Personal Details, Address Book, Payment Methods */}
          <div className="account-three-col-grid">
            {/* Personal Details */}
            <section className="account-section-card details-card">
              <div className="account-card-header">
                <h3 className="account-card-title">Personal details</h3>
                <button
                  type="button"
                  className="account-card-link"
                  onClick={() => setEditDetailsOpen(true)}
                >
                  Edit →
                </button>
              </div>

              <div className="details-list">
                <div className="detail-entry">
                  <div className="detail-icon-wrap">
                    <UserRound size={16} strokeWidth={1.5} />
                  </div>
                  <div className="detail-data">
                    <span className="detail-label">Name</span>
                    <span className="detail-value">{profile.name}</span>
                  </div>
                </div>

                <div className="detail-entry">
                  <div className="detail-icon-wrap">
                    <Mail size={16} strokeWidth={1.5} />
                  </div>
                  <div className="detail-data">
                    <span className="detail-label">Email</span>
                    <span className="detail-value">{profile.email}</span>
                  </div>
                </div>

                <div className="detail-entry">
                  <div className="detail-icon-wrap">
                    <Phone size={16} strokeWidth={1.5} />
                  </div>
                  <div className="detail-data">
                    <span className="detail-label">Phone</span>
                    <span className="detail-value">{profile.phone}</span>
                  </div>
                </div>

                <div className="detail-entry">
                  <div className="detail-icon-wrap">
                    <Calendar size={16} strokeWidth={1.5} />
                  </div>
                  <div className="detail-data">
                    <span className="detail-label">Date of birth</span>
                    <span className="detail-value">{profile.dob}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Address Book */}
            <section className="account-section-card address-card">
              <div className="account-card-header">
                <h3 className="account-card-title">Address book</h3>
                <button
                  type="button"
                  className="account-card-link"
                  onClick={() => setActiveTab("addresses")}
                >
                  Manage →
                </button>
              </div>

              <div className="address-entry">
                <div className="address-top-row">
                  <MapPin size={16} strokeWidth={1.5} className="address-pin-icon" />
                  <span className="address-type-label">Home</span>
                  <span className="default-pill">Default</span>
                </div>

                <div className="address-body-text">
                  <p>A-101, Shanti Heights,</p>
                  <p>Nalasopara East,</p>
                  <p>Palghar, Maharashtra 401209</p>
                  <p>India</p>
                </div>
              </div>
            </section>

            {/* Payment Methods */}
            <section className="account-section-card payment-card">
              <div className="account-card-header">
                <h3 className="account-card-title">Payment methods</h3>
                <button
                  type="button"
                  className="account-card-link"
                  onClick={() => setActiveTab("payments")}
                >
                  Manage →
                </button>
              </div>

              <div className="payment-entry">
                <div className="payment-method-row">
                  <div className="upi-badge-logo">
                    <span className="upi-text-icon">UPI</span>
                  </div>
                  <span className="payment-handle">adarsh@upi</span>
                  <span className="default-pill">Default</span>
                </div>

                <button
                  type="button"
                  className="btn-add-payment"
                  onClick={() => setAddPaymentOpen(true)}
                >
                  <Plus size={14} />
                  <span>Add a payment method</span>
                </button>
              </div>
            </section>
          </div>

          {/* Row 3: Product Registration Banner */}
          <Link
            href="/care-service"
            className="account-registration-banner"
            aria-label="Register your OVIA product - Uncompromising journeys deserve lasting care"
          >
            <Image
              src="/media/account/product-registration-banner.png"
              alt="Uncompromising journeys deserve lasting care - Register your OVIA product to access exclusive services, warranty support and personalised care."
              width={1002}
              height={75}
              className="reg-banner-full-img"
              priority
            />
          </Link>
        </main>
      </div>

      {/* Edit Personal Details Modal */}
      {editDetailsOpen && (
        <div className="account-modal-overlay" onClick={() => setEditDetailsOpen(false)}>
          <div className="account-modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="account-modal-header">
              <h3>Edit Personal Details</h3>
              <button
                type="button"
                className="account-modal-close"
                onClick={() => setEditDetailsOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <form
              className="account-modal-form"
              onSubmit={(e) => {
                e.preventDefault();
                setEditDetailsOpen(false);
                setNotification("Personal details updated.");
                setTimeout(() => setNotification(""), 3000);
              }}
            >
              <label>
                <span>Full Name</span>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                />
              </label>
              <label>
                <span>Email Address</span>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                />
              </label>
              <label>
                <span>Phone Number</span>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                />
              </label>
              <label>
                <span>Date of Birth</span>
                <input
                  type="text"
                  value={profile.dob}
                  onChange={(e) => setProfile({ ...profile, dob: e.target.value })}
                />
              </label>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setEditDetailsOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-modal-save">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Payment Method Modal */}
      {addPaymentOpen && (
        <div className="account-modal-overlay" onClick={() => setAddPaymentOpen(false)}>
          <div className="account-modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="account-modal-header">
              <h3>Add Payment Method</h3>
              <button
                type="button"
                className="account-modal-close"
                onClick={() => setAddPaymentOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <form
              className="account-modal-form"
              onSubmit={(e) => {
                e.preventDefault();
                setAddPaymentOpen(false);
                setNotification("Payment method saved.");
                setTimeout(() => setNotification(""), 3000);
              }}
            >
              <label>
                <span>UPI ID / VPA</span>
                <input type="text" placeholder="username@upi" required />
              </label>
              <label>
                <span>Cardholder or Account Name</span>
                <input type="text" defaultValue={profile.name} required />
              </label>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setAddPaymentOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-modal-save">
                  Save Method
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
