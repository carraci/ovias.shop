"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Package,
  MapPin,
  Heart,
  User,
  CreditCard,
  Star,
  Headphones,
  LogOut,
  ShieldCheck,
  Lock,
  Landmark,
  Wallet,
  HelpCircle,
} from "lucide-react";
import { request, useStore } from "./store-provider";
import styles from "./account-payments.module.css";

const subnavItems = [
  { label: "Overview", href: "/account" },
  { label: "My Profile", href: "/account/details" },
  { label: "My Orders", href: "/account/orders" },
  { label: "My Wishlist", href: "/account/wishlist" },
  { label: "My Appointments", href: "/account/appointments" },
  { label: "Address Book", href: "/account/addresses" },
  { label: "Payment Methods", href: "/account/payments", active: true },
  { label: "Account Security", href: "/account/security" },
];

export function AccountPayments() {
  const router = useRouter();
  const { user, refresh } = useStore();
  const [signingOut, setSigningOut] = useState(false);

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

  return (
    <div className={styles.portalWrapper}>
      <div className={styles.portalContainer}>
        {/* Left Sidebar matching Image 2 & 3 */}
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
              <Link href="/account/details" className={styles.navItem}>
                <span className={styles.navIcon}>
                  <User size={18} />
                </span>
                Account Details
              </Link>
            </li>
            <li>
              <Link
                href="/account/payments"
                className={`${styles.navItem} ${styles.navItemActive}`}
              >
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
              <Link href="/account/support" className={styles.navItem}>
                <span className={styles.navIcon}>
                  <Headphones size={18} />
                </span>
                Support
              </Link>
            </li>
            <li>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                className={styles.navItem}
                style={{ marginTop: "12px", borderTop: "1px solid #f3f4f6", paddingTop: "14px" }}
              >
                <span className={styles.navIcon}>
                  <LogOut size={18} />
                </span>
                {signingOut ? "Signing Out…" : "Logout"}
              </button>
            </li>
          </ul>
        </aside>

        {/* Main Content Area */}
        <main className={styles.mainContent}>
          {/* Top Subnav Breadcrumbs */}
          <nav className={styles.subnav} aria-label="Account Subnav">
            {subnavItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`${styles.subnavLink} ${item.active ? styles.subnavLinkActive : ""}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Header Title & Subtitle */}
          <header className={styles.headerSection}>
            <h1 className={styles.pageTitle}>Payment Methods</h1>
            <p className={styles.pageSubtitle}>
              Manage your payment methods and choose how you would like to pay at checkout.
            </p>
          </header>

          {/* Box 1: No Saved Payment Methods */}
          <section className={styles.emptyCard} aria-label="Saved Payment Methods">
            <div className={styles.cardIconBox} aria-hidden="true">
              <div className={styles.cardIconLine} />
              <div className={styles.cardIconPlus}>+</div>
            </div>
            <h2 className={styles.emptyTitle}>No saved payment methods</h2>
            <p className={styles.emptyDesc}>
              You haven&apos;t saved any cards or UPI accounts yet. Payment options will be available securely during checkout.
            </p>
            <Link href="/cart" className={styles.ctaButton}>
              Go to Checkout →
            </Link>
          </section>

          {/* Box 2: Accepted at Checkout powered by Razorpay */}
          <section className={styles.acceptedSection} aria-label="Accepted Payment Methods">
            <div className={styles.acceptedHeader}>
              <div>
                <h2 className={styles.acceptedTitle}>Accepted at checkout</h2>
                <p className={styles.acceptedSubtitle}>
                  We offer secure and multiple payment options powered by Razorpay.
                </p>
              </div>

              <div className={styles.razorpayBadge}>
                <Lock size={13} color="#0c2340" />
                <span>Secure payments by</span>
                <span className={styles.razorpayLogo}>Razorpay</span>
              </div>
            </div>

            <div className={styles.methodsGrid}>
              {/* Tile 1: UPI */}
              <div className={styles.methodTile}>
                <div className={styles.methodTop}>
                  <svg width="40" height="18" viewBox="0 0 54 20" fill="none" aria-label="UPI">
                    <path d="M0 0h14.5l-4.2 18H0z" fill="#097939"/>
                    <path d="M12.5 0h14.5l-4.2 18H12.5z" fill="#E86C24"/>
                    <path d="M30 4h5v10h-5z" fill="#111827"/>
                    <text x="37" y="14" fill="#111827" fontSize="12" fontWeight="bold" fontFamily="sans-serif">UPI</text>
                  </svg>
                  <span style={{ fontSize: "11px", color: "#16a34a", fontWeight: 600 }}>Instant</span>
                </div>
                <div>
                  <div className={styles.methodName}>UPI</div>
                  <p className={styles.methodDesc}>Pay with any UPI app</p>
                </div>
              </div>

              {/* Tile 2: Cards */}
              <div className={styles.methodTile}>
                <div className={styles.methodTop}>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    {/* Visa & Mastercard pill */}
                    <span style={{ fontSize: "11px", fontWeight: "bold", color: "#1a1f71", letterSpacing: "0.5px" }}>VISA</span>
                    <span style={{ display: "inline-flex", width: "18px", height: "12px", position: "relative" }}>
                      <span style={{ width: "11px", height: "11px", borderRadius: "50%", background: "#EB001B", position: "absolute", left: 0 }} />
                      <span style={{ width: "11px", height: "11px", borderRadius: "50%", background: "#F79E1B", opacity: 0.85, position: "absolute", right: 0 }} />
                    </span>
                  </div>
                  <CreditCard size={16} color="#6b7280" />
                </div>
                <div>
                  <div className={styles.methodName}>Cards</div>
                  <p className={styles.methodDesc}>Debit & Credit Cards</p>
                </div>
              </div>

              {/* Tile 3: Net Banking */}
              <div className={styles.methodTile}>
                <div className={styles.methodTop}>
                  <Landmark size={20} color="#374151" />
                  <span style={{ fontSize: "10.5px", color: "#6b7280" }}>50+ Banks</span>
                </div>
                <div>
                  <div className={styles.methodName}>Net Banking</div>
                  <p className={styles.methodDesc}>All major banks</p>
                </div>
              </div>

              {/* Tile 4: Wallets */}
              <div className={styles.methodTile}>
                <div className={styles.methodTop}>
                  <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                    <span style={{ fontSize: "10px", background: "#5f259f", color: "#fff", padding: "1px 5px", borderRadius: "3px", fontWeight: 600 }}>PhonePe</span>
                    <span style={{ fontSize: "10px", background: "#4285f4", color: "#fff", padding: "1px 5px", borderRadius: "3px", fontWeight: 600 }}>GPay</span>
                  </div>
                  <Wallet size={16} color="#6b7280" />
                </div>
                <div>
                  <div className={styles.methodName}>Wallets</div>
                  <p className={styles.methodDesc}>PhonePe, Google Pay & more</p>
                </div>
              </div>
            </div>
          </section>

          {/* Box 3: Security & Encryption Banner */}
          <section className={styles.securityBanner} aria-label="Security guarantee">
            <ShieldCheck size={26} className={styles.securityIcon} strokeWidth={1.7} />
            <div>
              <h3 className={styles.securityHeading}>Your payment information is safe</h3>
              <p className={styles.securityText}>
                All payments are securely processed by Razorpay. OVIA does not store your full card details or UPI credentials.
              </p>
            </div>
          </section>

          {/* Need help footer */}
          <div className={styles.helpLinkRow}>
            <HelpCircle size={15} color="#6b7280" />
            <span>Need help with payments?</span>
            <Link href="/account/support?view=payments" className={styles.helpLink}>
              Visit Help & Support →
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
