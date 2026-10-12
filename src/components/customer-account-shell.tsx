"use client";
import "@/components/page-styles/account.css";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  Package,
  Heart,
  MapPin,
  RotateCcw,
  Headphones,
  User,
  ShieldCheck,
  Star,
  LogOut,
  Menu,
  ArrowRight,
  Truck,
  CreditCard,
} from "lucide-react";
import { request, useStore } from "./store-provider";
import type { Order } from "@/lib/types";
import { money } from "@/lib/catalog-helpers";
import styles from "./customer-account-shell.module.css";
const modules = [
  { label: "Payment methods", href: "/account/payments", icon: CreditCard },
  { label: "Returns & exchanges", href: "/account/returns", icon: RotateCcw },
  { label: "Refunds", href: "/account/refunds", icon: RotateCcw },
  { label: "Account activity", href: "/account/notifications", icon: LayoutDashboard },
  { label: "Wishlist", href: "/account/wishlist", icon: Heart },
  { label: "Saved addresses", href: "/account/addresses", icon: MapPin },
  { label: "Help & support", href: "/account/support", icon: Headphones },
  { label: "Reviews", href: "/account/reviews", icon: Star },
  { label: "Profile", href: "/account/details", icon: User },
  { label: "Account security", href: "/account/security", icon: ShieldCheck },
];
export function CustomerAccountShell({ children }: { children: ReactNode }) {
  const { user, refresh } = useStore();
  const pathname = usePathname();
  const router = useRouter();
  const [expanded, setExpanded] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  useEffect(() => setExpanded(false), [pathname]);
  async function logout() {
    setBusy(true);
    setError("");
    try {
      await request("auth/logout", "POST", {});
      await refresh();
      router.push("/account/sign-in");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to sign out.");
      setBusy(false);
    }
  }
  return (
    <div className={styles.shell}>
      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <Link className={styles.brand} href="/account">
            My OVIA<span>Your personal travel companion</span>
          </Link>
          <button
            className={styles.mobileMenu}
            aria-expanded={expanded}
            aria-controls="customer-account-menu"
            onClick={() => setExpanded(!expanded)}
          >
            <Menu size={18} /> Account menu
          </button>
          <nav
            id="customer-account-menu"
            aria-label="Customer dashboard"
            className={expanded ? styles.expanded : styles.navigation}
          >
            {modules.map(({ label, href, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                aria-current={pathname === href ? "page" : undefined}
              >
                <Icon size={18} strokeWidth={1.5} />
                {label}
              </Link>
            ))}
            <button disabled={busy} onClick={logout}>
              <LogOut size={18} strokeWidth={1.5} />
              {busy ? "Signing out…" : "Sign out"}
            </button>
          </nav>
          {error && <p role="alert">{error}</p>}
          <div className={styles.identity}>
            <span>{user?.name}</span>
            <small>{user?.email}</small>
          </div>
        </aside>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
export function CustomerAccountOverview() {
  const { user, wishlist } = useStore();
  const [data, setData] = useState<{
    owner: string;
    orders: Order[];
    support: number;
    loading: boolean;
    error: string;
  }>({ owner: "", orders: [], support: 0, loading: true, error: "" });
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!user) return;
    let alive = true;
    const owner = user.id;
    setData({ owner, orders: [], support: 0, loading: true, error: "" });
    async function load() {
      try {
        const [orders, tickets] = await Promise.all([
          request<Order[]>("account/orders"),
          request<{ status: string }[]>("support/conversations"),
        ]);
        if (alive)
          setData({
            owner,
            orders,
            support: tickets.filter(
              (t) => !["Resolved", "Closed"].includes(t.status),
            ).length,
            loading: false,
            error: "",
          });
      } catch (e) {
        if (alive)
          setData((prev) => ({
            ...prev,
            loading: false,
            error:
              e instanceof Error ? e.message : "Unable to load your account.",
          }));
      }
    }
    void load();
    const interval = setInterval(() => void load(), 5000);
    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, [user?.id, retry]);
  const current =
    data.owner === user?.id
      ? data
      : { orders: [], support: 0, loading: true, error: "" };
  const active = current.orders.filter(
    (o) =>
      o.shipping?.status &&
      !["DELIVERED", "CANCELLED", "RTO_DELIVERED"].includes(o.shipping.status),
  ).length;
  return (
    <div className={styles.overview}>
      <header className={styles.welcome}>
        <div>
          <p>YOUR PERSONAL WORLD OF OVIA</p>
          <h1>Welcome back, {user?.name?.split(" ")[0]}.</h1>
          <span>Everything for your journey, in one place.</span>
        </div>
        <Link className={styles.primary} href="/new">
          Continue shopping <ArrowRight size={16} />
        </Link>
      </header>
      {current.error && (
        <div className={styles.error} role="alert">
          {current.error}{" "}
          <button onClick={() => setRetry((v) => v + 1)}>Try again</button>
        </div>
      )}
      <section className={styles.stats} aria-label="Account summary">
        {[
          {
            label: "Orders",
            value: current.orders.length,
            href: "/account/orders",
            icon: Package,
          },
          {
            label: "Active shipments",
            value: active,
            href: "/account/orders",
            icon: Truck,
          },
          {
            label: "Wishlist",
            value: wishlist.length,
            href: "/account/wishlist",
            icon: Heart,
          },
          {
            label: "Open requests",
            value: current.support,
            href: "/account/support",
            icon: Headphones,
          },
        ].map(({ label, value, href, icon: Icon }) => (
          <Link href={href} key={label}>
            <Icon size={20} strokeWidth={1.5} />
            <span>{label}</span>
            <strong>{current.loading || current.error ? "—" : value}</strong>
          </Link>
        ))}
      </section>
      <section className={styles.card}>
        <header>
          <h2>Recent orders</h2>
          <Link href="/account/orders">
            View all orders <ArrowRight size={15} />
          </Link>
        </header>
        {current.loading ? (
          <p role="status">Loading your orders…</p>
        ) : current.error ? (
          <p>Your orders could not be loaded. Please retry above.</p>
        ) : !current.orders.length ? (
          <p>You haven’t placed an order yet. Your next journey starts here.</p>
        ) : (
          current.orders.slice(0, 3).map((order) => (
            <Link
              className={styles.order}
              key={order.id}
              href="/account/orders"
            >
              <div>
                <strong>{order.orderNumber || order.id}</strong>
                <small>
                  {new Date(order.createdAt).toLocaleDateString("en-IN")} ·{" "}
                  {order.lines.length} item(s)
                </small>
              </div>
              <span className={styles.status}>
                {(order.shipping?.status || order.status).replaceAll("_", " ")}
              </span>
              <strong>{money(order.total)}</strong>
              <ArrowRight size={16} />
            </Link>
          ))
        )}
      </section>
      <section className={styles.modules} aria-label="Manage your account">
        {modules.slice(2).map(({ label, href, icon: Icon }) => (
          <Link href={href} key={href}>
            <Icon size={22} strokeWidth={1.5} />
            <h2>{label}</h2>
            <span>
              View and manage <ArrowRight size={15} />
            </span>
          </Link>
        ))}
      </section>
    </div>
  );
}

