"use client";
import "@/components/page-styles/account.css";


import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUp,
  CalendarDays,
  CreditCard,
  LogOut,
  MapPin,
  Package,
  ShieldCheck,
  Trash2,
  ShoppingBag,
} from "lucide-react";
import { AddressBook } from "./address-book";
import { AccountOrdersReturns } from "./account-orders-returns";
import { AccountOrdersPortal } from "./account-orders-portal";
import { ProductPhoto } from "./product-photo";
import { request, useStore } from "./store-provider";
import { money } from "@/lib/catalog-helpers";
import type { Order } from "@/lib/types";
import styles from "./account-dashboard.module.css";

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

function Card({
  title,
  children,
  footer,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  return (
    <section
      className={`${styles.card} ${wide ? styles.fullWidth : ""}`}
      aria-label={title}
    >
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>{title}</h2>
      </div>
      <div className={styles.cardBody}>{children}</div>
      {footer && <div className={styles.cardFooter}>{footer}</div>}
    </section>
  );
}

function Orders({
  orders,
  loading,
  error,
  retry,
  expanded,
}: {
  orders: Order[];
  loading: boolean;
  error: string;
  retry: () => void;
  expanded: boolean;
}) {
  return (
    <Card
      title="My Orders"
      footer={
        <Link
          href={orders.length && !expanded ? "/account/orders" : "/new"}
          className={styles.primaryButton}
        >
          {orders.length && !expanded ? "View All Orders" : "Start Shopping"}
        </Link>
      }
    >
      {loading ? (
        <p className={styles.loading} role="status">
          Loading your orders…
        </p>
      ) : error ? (
        <div className={styles.error} role="alert">
          <p>{error}</p>
          <button type="button" onClick={retry} className={styles.textLink}>
            Try again
          </button>
        </div>
      ) : orders.length === 0 ? (
        <p className={styles.muted}>You haven’t placed an order yet.</p>
      ) : (
        <div className={styles.orderList}>
          {(expanded ? orders : orders.slice(0, 1)).map((order) => (
            <article className={styles.order} key={order.id}>
              <div className={styles.orderMeta}>
                <div>
                  <p className={styles.orderNumber}>
                    {order.orderNumber || `Order ${order.id.slice(0, 8)}`}
                  </p>
                  <time dateTime={order.createdAt}>
                    {new Date(order.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </time>
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                  <span className={styles.orderStatus}>
                    Payment: {order.status.replaceAll("_", " ")}
                  </span>
                  {order.shipping?.status && (
                    <span
                      className={styles.orderStatus}
                      style={{
                        background: order.shipping.status === "DELIVERED" ? "#234a2c" : "#111111",
                        color: "#ffffff",
                      }}
                    >
                      Shipping: {order.shipping.status.replaceAll("_", " ")}
                    </span>
                  )}
                </div>
              </div>
              {order.lines.map((line) => (
                <div className={styles.orderLine} key={line.sku}>
                  <Link
                    href={`/products/${line.slug}`}
                    className={styles.orderImage}
                    aria-label={`View ${line.name}`}
                  >
                    <></>
                  </Link>
                  <div className={styles.orderDescription}>
                    <Link
                      href={`/products/${line.slug}`}
                      className={styles.orderName}
                    >
                      {line.name}
                    </Link>
                    <p className={styles.muted}>
                      {line.color} · Qty {line.quantity}
                    </p>
                  </div>
                </div>
              ))}
              <div className={styles.orderActions}>
                <p className={styles.orderTotal}>
                  Total <strong>{money(order.total)}</strong>
                </p>
                <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                  <Link
                    href={`/orders/${order.id}/confirmation`}
                    className={styles.textLink}
                  >
                    View order
                  </Link>
                  {(order.shipping?.awb || order.status === "paid" || order.status === "refund_required") && (
                    <Link
                      href={`/account/orders/${order.id}/tracking`}
                      className={styles.textLink}
                      style={{ fontWeight: 600 }}
                    >
                      Track order →
                    </Link>
                  )}
                  <Link
                    href={`/account/orders/${order.id}`}
                    className={styles.textLink}
                  >
                    Manage order
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </Card>
  );
}

function Wishlist() {
  const { wishlist, removeFromWishlist, add, notify, openCartDrawer } = useStore();

  if (!wishlist || wishlist.length === 0) {
    return (
      <Card
        title="My Wishlist"
        footer={
          <Link href="/new" className={styles.primaryButton}>
            Explore the Collection
          </Link>
        }
      >
        <div className={styles.wishlistImage}>
          <Image
            src="/media/account/ovia-tote-editorial.png"
            alt="OVIA leather tote"
            fill
            sizes="(max-width: 760px) 80vw, 420px"
          />
        </div>
        <p className={styles.muted}>
          A little inspiration for your next journey: Explore OVIA bags, luggage and everyday essentials.
        </p>
      </Card>
    );
  }

  return (
    <Card
      title={`My Wishlist (${wishlist.length})`}
      wide
      footer={
        <Link href="/new" className={styles.primaryButton}>
          Explore More Pieces
        </Link>
      }
    >
      <div className={styles.wishlistGrid}>
        {wishlist.map((item) => (
          <div key={item.sku} className={styles.wishlistItem}>
            <button
              type="button"
              className={styles.heartButton}
              onClick={() => removeFromWishlist(item.sku)}
              aria-label="Remove from wishlist"
              title="Remove from wishlist"
            >
              <Trash2 size={16} color="#ef4444" strokeWidth={1.8} />
            </button>
            <Link href={`/products/${item.slug}`} className={styles.wishlistImage}>
              <ProductPhoto
                src={item.image}
                alt={item.name}
                fallbackSources={[
                  item.image,
                  "/media/account/order-meridian.png",
                  "/media/account/ovia-tote-editorial.png",
                ]}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                style={{ objectFit: "contain" }}
              />
            </Link>
            <Link href={`/products/${item.slug}`} className={styles.wishlistName}>
              <strong>{item.name}</strong>
              {item.color && (
                <span style={{ display: "block", fontSize: "11px", color: "#6b7280", marginTop: "2px" }}>
                  {item.color}
                </span>
              )}
            </Link>
            <p className={styles.wishlistPrice}>
              ₹ {item.price ? item.price.toLocaleString("en-IN") : "Price upon request"}
            </p>
            <button
              type="button"
              className={styles.primaryButton}
              style={{ width: "100%", marginTop: "12px", height: "38px", fontSize: "13px" }}
              onClick={async () => {
                await add(item.sku, 1);
                notify("Added to your shopping bag.");
                if (openCartDrawer) openCartDrawer();
              }}
            >
              <ShoppingBag size={14} style={{ marginRight: "6px" }} />
              Add to Bag
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}

function Appointments() {
  return (
    <Card
      title="My Appointments"
      footer={
        <Link href="/contact-us" className={styles.primaryButton}>
          Contact Us
        </Link>
      }
    >
      <div className={styles.featureRow}>
        <CalendarDays
          size={28}
          strokeWidth={1.2}
          className={styles.featureIcon}
        />
        <p className={styles.muted}>
          Enjoy a personal introduction to the OVIA collection. Contact our
          advisors to arrange your next store visit.
        </p>
      </div>
    </Card>
  );
}

export function AccountDashboard({ section }: { section: string }) {
  const { user, refresh } = useStore();
  const router = useRouter();
  const [orderState, setOrderState] = useState<{
    userId: string;
    orders: Order[];
    error: string;
    loading: boolean;
  }>({ userId: "", orders: [], error: "", loading: true });
  const [retry, setRetry] = useState(0);
  const [signingOut, setSigningOut] = useState(false);
  const [actionError, setActionError] = useState("");
  const userId = user?.id;
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setOrderState({ userId, orders: [], error: "", loading: true });
    const loadOrders=()=>request<Order[]>("account/orders")
      .then((orders) => {
        if (!cancelled)
          setOrderState({ userId, orders, error: "", loading: false });
      })
      .catch((error: Error) => {
        if (!cancelled)
          setOrderState({
            userId,
            orders: [],
            error: error.message,
            loading: false,
          });
      });
    void loadOrders();
    const timer=setInterval(()=>{if(document.visibilityState==="visible")void loadOrders();},5000);
    window.addEventListener("focus",loadOrders);
    return () => {
      cancelled = true;
      clearInterval(timer);
      window.removeEventListener("focus",loadOrders);
    };
  }, [userId, retry]);

  async function signOut() {
    setSigningOut(true);
    setActionError("");
    try {
      await request("auth/logout", "POST", {});
      await refresh();
      router.push("/account/sign-in");
    } catch (error) {
      setActionError((error as Error).message);
      setSigningOut(false);
    }
  }

  const initials =
    user?.name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join(".") || "O";
  const state =
    orderState.userId === userId
      ? orderState
      : { orders: [], error: "", loading: true };
  const overview = section === "overview";
  const profile = user ? (
    <Card
      title="My Profile"
      footer={
        <Link href="/account/details" className={styles.primaryButton}>
          Manage My Profile
        </Link>
      }
    >
      <dl className={styles.profileDetails}>
        <div className={styles.detailRow}>
          <dt className={styles.label}>Name</dt>
          <dd className={styles.value}>{user.name}</dd>
        </div>
        <div className={styles.detailRow}>
          <dt className={styles.label}>Login</dt>
          <dd className={styles.value}>{user.email}</dd>
        </div>
      </dl>
    </Card>
  ) : null;

  return (
    <div className={styles.page} id="account-top">
      <div className={styles.subnav}>
        <Link href="/account" className={styles.subnavBrand}>
          My <span>OVIA</span>
        </Link>
        <nav className={styles.navLinks} aria-label="Account navigation">
          {navigation.map((item) => (
            <Link
              key={item.section}
              href={item.href}
              className={`${styles.navLink} ${section === item.section ? styles.activeNav : ""}`}
              aria-current={section === item.section ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      {overview && (
        <div className={styles.hero}>
          <Image
            src="/media/account/ovia-leather-hero.png"
            alt="OVIA engraved gold clasp on black grained leather"
            fill
            sizes="100vw"
            preload
            className={styles.heroImage}
          />
        </div>
      )}
      <div className={styles.identity}>
        {overview && (
          <div className={styles.avatar} aria-hidden="true">
            {initials}
          </div>
        )}
        <p className={styles.eyebrow}>YOUR PERSONAL WORLD OF OVIA</p>
        <h1 className={styles.customerName}>
          {user?.name || "Welcome to My OVIA"}
        </h1>
        {!user && (
          <p className={styles.intro}>
            A place for your journeys, your collection and the details that
            matter.
          </p>
        )}
      </div>
      <div className={styles.content}>
        {!user ? (
          <Card
            title="Your OVIA Account"
            wide
            footer={
              <div className={styles.profileActions}>
                <Link href="/account/sign-in" className={styles.primaryButton}>
                  Sign In
                </Link>
                <Link
                  href="/account/register"
                  className={styles.secondaryButton}
                >
                  Create Account
                </Link>
              </div>
            }
          >
            <p className={styles.muted}>
              Sign in to view your orders, manage saved addresses and access
              your account.
            </p>
          </Card>
        ) : (
          <>
            <div className={styles.grid}>
              {overview ? (
                <>
                  {profile}
                  <Orders
                    {...state}
                    retry={() => setRetry((value) => value + 1)}
                    expanded={false}
                  />
                  <Wishlist />
                  <Appointments />
                </>
              ) : section === "orders" ? (
                <AccountOrdersPortal />
              ) : section === "wishlist" ? (
                <Wishlist />
              ) : section === "appointments" ? (
                <Appointments />
              ) : section === "addresses" ? (
                <Card title="Address Book" wide>
                  <div className={styles.addressPanel}>
                    <AddressBook />
                  </div>
                </Card>
              ) : section === "details" || section === "profile" ? (
                <>
                  <Card
                    title="My Profile"
                    footer={
                      <Link
                        href="/account/security"
                        className={styles.primaryButton}
                      >
                        Account Security
                      </Link>
                    }
                  >
                    <dl className={styles.profileDetails}>
                      <div className={styles.detailRow}>
                        <dt className={styles.label}>Name</dt>
                        <dd className={styles.value}>{user.name}</dd>
                      </div>
                      <div className={styles.detailRow}>
                        <dt className={styles.label}>Login</dt>
                        <dd className={styles.value}>{user.email}</dd>
                      </div>
                    </dl>
                    <p className={styles.muted}>
                      Manage your password, connected sign-in options and active
                      sessions in Account Security.
                    </p>
                  </Card>
                  <Card
                    title="Your Addresses"
                    footer={
                      <Link
                        href="/account/addresses"
                        className={styles.primaryButton}
                      >
                        Manage Address Book
                      </Link>
                    }
                  >
                    <div className={styles.featureRow}>
                      <MapPin
                        size={28}
                        strokeWidth={1.2}
                        className={styles.featureIcon}
                      />
                      <p className={styles.muted}>
                        Keep your delivery details ready for your next journey.
                      </p>
                    </div>
                  </Card>
                </>
              ) : section === "payments" ? (
                <Card
                  title="Payment Methods"
                  footer={
                    <Link href="/cart" className={styles.primaryButton}>
                      View Your Bag
                    </Link>
                  }
                >
                  <div className={styles.featureRow}>
                    <CreditCard
                      size={28}
                      strokeWidth={1.2}
                      className={styles.featureIcon}
                    />
                    <p className={styles.muted}>
                      Choose your payment method securely at checkout. Your card
                      details are handled by the payment provider.
                    </p>
                  </div>
                </Card>
              ) : section === "returns" ? (
                <AccountOrdersReturns
                  key={user.id}
                  {...state}
                  retry={() => setRetry((value) => value + 1)}
                />
              ) : section === "support" ? (
                <Card
                  title="Client Services"
                  footer={
                    <Link href="/contact-us" className={styles.primaryButton}>
                      Contact OVIA
                    </Link>
                  }
                >
                  <p className={styles.muted}>
                    Our advisors can help with your collection, your orders and
                    your next journey.
                  </p>
                  <Link
                    href="/account/support"
                    className={styles.textLink}
                  >
                    Customer Support & Assistance
                  </Link>
                </Card>
              ) : (
                profile
              )}
            </div>
            <nav className={styles.utilityLinks} aria-label="Account services">
              <Link href="/account/addresses" className={styles.utilityLink}>
                <MapPin size={16} />
                Address Book
              </Link>
              <Link href="/account/payments" className={styles.utilityLink}>
                <CreditCard size={16} />
                Payment Methods
              </Link>
              <Link href="/account/security" className={styles.utilityLink}>
                <ShieldCheck size={16} />
                Account Security
              </Link>
              <Link href="/account/support" className={styles.utilityLink}>
                <Package size={16} />
                Help & Support
              </Link>
            </nav>
            {actionError && (
              <p className={styles.error} role="alert">
                {actionError}
              </p>
            )}
            <div className={styles.bottomBar}>
              <button
                type="button"
                className={styles.signOut}
                onClick={signOut}
                disabled={signingOut}
              >
                <LogOut size={16} />
                {signingOut ? "Signing out…" : "Sign Out"}
              </button>
              <a href="#account-top" className={styles.secondaryButton}>
                Back to Top <ArrowUp size={14} />
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

