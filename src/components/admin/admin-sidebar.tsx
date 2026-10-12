"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  FolderTree,
  Boxes,
  Users,
  Megaphone,
  Ticket,
  Sparkles,
  RotateCcw,
  CreditCard,
  Truck,
  Headphones,
  FileText,
  Mail,
  BarChart3,
  Layers,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  LogOut,
  ExternalLink,
} from "lucide-react";

interface SidebarProps {
  ownerName?: string;
  ownerEmail?: string;
}

export function AdminSidebar({
  ownerName = "Adarsh Shukla",
  ownerEmail,
}: SidebarProps) {
  const pathname = usePathname();
  const [catalogOpen, setCatalogOpen] = React.useState(
    pathname.startsWith("/admin/products") ||
      pathname.startsWith("/admin/categories"),
  );
  const [orderCount, setOrderCount] = React.useState<number | null>(null);

  React.useEffect(() => {
    let mounted = true;
    let pending = false;
    const controller = new AbortController();
    async function fetchCounts() {
      if (pending || controller.signal.aborted) return;
      pending = true;
      try {
        const res = await fetch("/api/admin/dashboard", { cache: "no-store", signal: controller.signal });
        if (res.ok) {
          const data = await res.json();
          const payload = data.data || data;
          if (mounted && payload.kpis?.totalOrders?.value !== undefined) {
            setOrderCount(payload.kpis.totalOrders.value);
          }
        }
      } catch {
        // Keep the last verified counts if a refresh fails.
      } finally {
        pending = false;
      }
    }
    fetchCounts();
    const interval = setInterval(fetchCounts, 5000);
    return () => {
      mounted = false;
      controller.abort();
      clearInterval(interval);
    };
  }, []);

  const navItems = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    {
      label: "Orders",
      href: "/admin/orders",
      icon: ShoppingBag,
      badge: orderCount && orderCount > 0 ? orderCount : undefined,
      subItems: [
        { label: "All Orders", href: "/admin/orders" },
        { label: "Return & Refund", href: "/admin/returns" },
        { label: "Abandoned cart", href: "/admin/orders/abandoned-cart" },
        { label: "Transactions", href: "/admin/orders/transactions" },
      ],
    },
    {
      label: "Products",
      href: "/admin/products",
      icon: Package,
      subItems: [
        { label: "Products List", href: "/admin/products" },
        { label: "New Product", href: "/admin/products/new" },
        { label: "Categories List", href: "/admin/categories" },
        { label: "New Category", href: "/admin/categories/new" },
      ],
    },
    { label: "Customers", href: "/admin/customers", icon: Users },
    { label: "Shipping & Logistics", href: "/admin/shipping", icon: Truck },
    { label: "Payments", href: "/admin/payments", icon: CreditCard },
    { label: "Returns & Refunds", href: "/admin/returns", icon: RotateCcw },
    {
      label: "Content",
      href: "/admin/content",
      icon: FileText,
      subItems: [
        { label: "Blog & Events", href: "/admin/content/blog-events" },
        { label: "FAQ / Help", href: "/admin/content/faq" },
      ],
    },
    { label: "Reports", href: "/admin/reports", icon: BarChart3 },
    { label: "Support", href: "/admin/support", icon: Headphones },
    { label: "Inventory", href: "/admin/inventory", icon: Boxes },
    { label: "Coupons", href: "/admin/coupons", icon: Ticket },
  ];

  async function handleLogout() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  return (
    <aside
      className="admin-sidebar"
      style={{
        width: 240,
        minWidth: 240,
        height: "100vh",
        backgroundColor: "#FFFFFF",
        color: "#18181B",
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid #F1F1F4",
        position: "sticky",
        top: 0,
        userSelect: "none",
        fontFamily: "var(--sans)",
        zIndex: 50,
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          padding: "20px 20px 16px",
          borderBottom: "1px solid #F1F1F4",
          display: "flex",
          alignItems: "center",
        }}
      >
        <Link
          href="/admin"
          style={{
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <div
            style={{
              fontFamily:
                "var(--font-cormorant), var(--font-playfair), 'Playfair Display', Georgia, serif",
              fontSize: 26,
              fontWeight: 500,
              letterSpacing: "0.06em",
              color: "#18181B",
            }}
          >
            OVIA
          </div>
        </Link>
      </div>

      {/* Navigation Links with custom scrollbar */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "18px 8px",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <span className="admin-navigation-caption">APPLICATION</span>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href) ||
                (item.href === "/admin/settings" && pathname.startsWith("/admin/integrations")) ||
                Boolean(item.subItems?.some((sub) => pathname === sub.href || pathname.startsWith(sub.href)));

          if (item.label === "Products" || item.label === "Catalog")
            return (
              <React.Fragment key={item.label}>
                <button
                  type="button"
                  className="admin-nav-item admin-catalog-toggle"
                  aria-expanded={catalogOpen}
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => setCatalogOpen((value) => !value)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 14px",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? "#18181B" : "#52525B",
                    backgroundColor: isActive ? "#ECE9E2" : "transparent",
                    border: "none",
                    width: "100%",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.15s ease",
                  }}
                >
                  <Package
                    size={18}
                    strokeWidth={isActive ? 2 : 1.5}
                    color={isActive ? "#18181B" : "#71717A"}
                  />
                  <span style={{ flex: 1, textAlign: "left" }}>{item.label}</span>
                  <ChevronDown
                    size={14}
                    style={{
                      transform: catalogOpen ? "none" : "rotate(-90deg)",
                      transition: "transform 0.2s ease",
                      color: isActive ? "#18181B" : "#71717A",
                    }}
                  />
                </button>
                {catalogOpen && (
                  <div
                    className="admin-catalog-links"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                      paddingLeft: 28,
                      marginTop: 2,
                      marginBottom: 4,
                    }}
                  >
                    {item.subItems!.map((sub) => {
                      const isSubActive = pathname === sub.href;
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className="admin-sub-item"
                          aria-current={
                            isSubActive ? "page" : undefined
                          }
                          style={{
                            display: "block",
                            padding: "6px 12px",
                            borderRadius: 6,
                            textDecoration: "none",
                            fontSize: 13,
                            color: isSubActive ? "#18181B" : "#52525B",
                            backgroundColor: isSubActive
                              ? "#ECE9E2"
                              : "transparent",
                            fontWeight: isSubActive ? 600 : 500,
                            transition: "all 0.15s ease",
                          }}
                        >
                          {sub.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </React.Fragment>
            );
          return (
            <React.Fragment key={item.href}>
              <Link
                href={item.href}
                className="admin-nav-item"
                aria-current={isActive ? "page" : undefined}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 14px",
                  borderRadius: 8,
                  textDecoration: "none",
                  fontSize: 14,
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? "#18181B" : "#52525B",
                  backgroundColor: isActive ? "#ECE9E2" : "transparent",
                  border: "none",
                  transition: "all 0.15s ease",
                }}
              >
                <Icon
                  size={18}
                  strokeWidth={isActive ? 2 : 1.5}
                  color={isActive ? "#18181B" : "#71717A"}
                />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.subItems && (
                  <ChevronDown
                    size={14}
                    style={{
                      transform: isActive ? "rotate(0deg)" : "rotate(-90deg)",
                      transition: "transform 0.2s ease",
                      color: isActive ? "#18181B" : "#71717A",
                    }}
                  />
                )}
                {item.badge !== undefined && (
                  <span
                    style={{
                      backgroundColor: "#F4F4F5",
                      color: "#18181B",
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "2px 7px",
                      borderRadius: 9999,
                      minWidth: 18,
                      textAlign: "center",
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>

              {item.subItems && isActive && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    paddingLeft: 28,
                    marginTop: 2,
                    marginBottom: 4,
                  }}
                >
                  {item.subItems.map((sub) => {
                    const isSubActive =
                      pathname === sub.href ||
                      (sub.href === "/admin/settings/integrations" && pathname === "/admin/integrations");
                    return (
                      <Link
                        key={sub.label}
                        href={sub.href}
                        className="admin-sub-item"
                        aria-current={isSubActive ? "page" : undefined}
                        style={{
                          display: "block",
                          padding: "6px 12px",
                          borderRadius: 6,
                          textDecoration: "none",
                          fontSize: 13,
                          color: isSubActive ? "#18181B" : "#52525B",
                          backgroundColor: isSubActive
                            ? "#ECE9E2"
                            : "transparent",
                          fontWeight: isSubActive ? 600 : 500,
                          transition: "all 0.15s ease",
                        }}
                      >
                        {sub.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Switch to Storefront Button */}
      <div style={{ padding: "0 10px 10px" }}>
        <Link
          href="/"
          className="admin-button"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "9px 12px",
            backgroundColor: "#4b565e",
            border: "1px solid #56616a",
            borderRadius: 4,
            color: "#ffda38",
            textDecoration: "none",
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: "0.04em",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#56616a";
            e.currentTarget.style.borderColor = "#ffda38";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#4b565e";
            e.currentTarget.style.borderColor = "#56616a";
          }}
        >
          <ExternalLink size={13} />
          <span>Switch to Public Shop</span>
        </Link>
      </div>

      {/* Bottom Footer */}
      <div
        style={{
          padding: "14px 16px",
          borderTop: "1px solid #F1F1F4",
          backgroundColor: "#FFFFFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            minWidth: 0,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              backgroundColor: "#9E9689",
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {ownerName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase() || "AS"}
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#18181B",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {ownerName}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "#71717A",
                lineHeight: 1.2,
              }}
            >
              Owner
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          title="Sign out of Admin Control Center"
          style={{
            background: "none",
            border: "none",
            padding: 6,
            color: "#6B7280",
            cursor: "pointer",
            borderRadius: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "color 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#EF4444")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#6B7280")}
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
