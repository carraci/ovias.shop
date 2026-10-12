"use client";

import { DateRangePicker } from "./date-range-picker";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Menu,
  Search,
  Bell,
  ChevronDown,
  Calendar,
  Package,
  ShoppingBag,
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";

interface HeaderProps {
  ownerName?: string;
  ownerEmail?: string;
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
}

export function AdminHeader({
  ownerName = "Adarsh Shukla",
  ownerEmail = "no-reply@ovias.shop",
  onToggleSidebar,
  sidebarOpen,
}: HeaderProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    let pending = false;
    const controller = new AbortController();
    async function loadNotifications() {
      if (pending || controller.signal.aborted) return;
      pending = true;
      try {
        const res = await fetch("/api/admin/dashboard", { cache: "no-store", signal: controller.signal });
        const json = await res.json();
        if (json.success && json.data?.todayActivity) {
          setNotifications(
            json.data.todayActivity.map((a: any, i: number) => ({
              id: i + 1,
              title: a.title,
              desc: a.time,
              time: a.time,
              type: a.type,
            })),
          );
        }
      } catch {
        // Keep the last verified counts if a refresh fails.
      } finally {
        pending = false;
      }
    }
    loadNotifications();
    const timer=setInterval(()=>{if(document.visibilityState === "visible")void loadNotifications();},5000);
    return()=>{ controller.abort(); clearInterval(timer); };
  }, []);

  const quickSearchResults = [
    {
      type: "Catalog",
      title: "Products",
      sub: "Search and manage your catalog",
      href: "/admin/products",
    },
    {
      type: "Orders",
      title: "Orders",
      sub: "View orders and fulfillment",
      href: "/admin/orders",
    },
    {
      type: "Customers",
      title: "Customers",
      sub: "Manage customer records",
      href: "/admin/customers",
    },
    {
      type: "Inbox",
      title: "Support conversations",
      sub: "Read customer messages and replies",
      href: "/admin/support",
    },
  ].filter((item) =>
    `${item.title} ${item.type} ${item.sub}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase()),
  );

  return (
    <header
      className="admin-toolbar"
      style={{
        height: 54,
        backgroundColor: "#FFFFFF",
        borderBottom: "1px solid #E5E5E5",
        padding: "0 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 40,
        fontFamily: "var(--sans)",
      }}
    >
      <button
        className="admin-menu-toggle"
        aria-label="Toggle admin navigation"
        aria-expanded={sidebarOpen}
        onClick={onToggleSidebar}
      >
        <Menu size={22} />
      </button>
      {/* Global Search Bar */}
      <div style={{ position: "relative", width: 360, maxWidth: "100%" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 14px",
            backgroundColor: "#F7F7F5",
            border: "1px solid #E5E5E5",
            borderRadius: 4,
            cursor: "text",
          }}
          onClick={() => setShowSearchModal(true)}
        >
          <Search size={16} color="#6B6B6B" />
          <input
            type="text"
            placeholder="Search orders, products, customers..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchModal(true);
            }}
            onFocus={() => setShowSearchModal(true)}
            style={{
              border: "none",
              background: "transparent",
              outline: "none",
              fontSize: 13,
              color: "#111111",
              width: "100%",
              fontFamily: "inherit",
            }}
          />
        </div>

        {/* Search Results Dropdown */}
        {showSearchModal && (
          <>
            <div
              style={{ position: "fixed", inset: 0, zIndex: 60 }}
              onClick={() => setShowSearchModal(false)}
            />
            <div
              style={{
                position: "absolute",
                top: 46,
                left: 0,
                width: 440,
                backgroundColor: "#FFFFFF",
                border: "1px solid #E5E5E5",
                borderRadius: 4,
                boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
                padding: "8px 0",
                zIndex: 70,
              }}
            >
              <div
                style={{
                  padding: "6px 14px 4px",
                  fontSize: 10,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "#8E693E",
                  fontWeight: 600,
                }}
              >
                Quick navigation
              </div>
              {quickSearchResults.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setShowSearchModal(false);
                    router.push(item.href);
                  }}
                  style={{
                    padding: "8px 14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    transition: "background 0.1s ease",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "#F7F7F5")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                >
                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: "#111111",
                      }}
                    >
                      {item.title}
                    </div>
                    <div style={{ fontSize: 11, color: "#6B6B6B" }}>
                      {item.sub}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      padding: "2px 6px",
                      borderRadius: 2,
                      backgroundColor: "#F2EFE9",
                      color: "#8E693E",
                      fontWeight: 600,
                    }}
                  >
                    {item.type}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Right Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <DateRangePicker />

        {/* Notifications Icon with Badge */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              backgroundColor: "#F7F7F5",
              border: "1px solid #E5E5E5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              position: "relative",
            }}
          >
            <Bell size={17} color="#111111" />
            {notifications.length > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: -2,
                  right: -2,
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  backgroundColor: "#ffd333",
                  color: "#FFFFFF",
                  fontSize: 10,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px solid #FFFFFF",
                }}
              >
                {notifications.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <>
              <div
                style={{ position: "fixed", inset: 0, zIndex: 60 }}
                onClick={() => setShowNotifications(false)}
              />
              <div
                style={{
                  position: "absolute",
                  top: 44,
                  right: 0,
                  width: 320,
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E5E5E5",
                  borderRadius: 4,
                  boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                  padding: "12px 0",
                  zIndex: 70,
                }}
              >
                <div
                  style={{
                    padding: "0 16px 8px",
                    borderBottom: "1px solid #F0F0F0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{ fontSize: 13, fontWeight: 600, color: "#111111" }}
                  >
                    Notifications
                  </span>
                  {notifications.length > 0 && (
                    <span
                      style={{
                        fontSize: 11,
                        color: "#8E693E",
                        cursor: "pointer",
                      }}
                      onClick={() => setNotifications([])}
                    >
                      Mark all read
                    </span>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div
                    style={{
                      padding: "20px 16px",
                      textAlign: "center",
                      fontSize: 12,
                      color: "#9CA3AF",
                    }}
                  >
                    No new notifications
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      style={{
                        padding: "10px 16px",
                        borderBottom: "1px solid #F9F9F9",
                        cursor: "pointer",
                        transition: "background 0.1s ease",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "#FAFAF9")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "transparent")
                      }
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: 2,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#111111",
                          }}
                        >
                          {n.title}
                        </span>
                        <span style={{ fontSize: 10, color: "#9CA3AF" }}>
                          {n.time}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: "#6B6B6B" }}>
                        {n.desc}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>

        {/* Owner Profile Avatar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            paddingLeft: 12,
            borderLeft: "1px solid #F1F1F4",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              backgroundColor: "#9E9689",
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.02em",
            }}
          >
            {ownerName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase() || "AS"}
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#18181B",
                lineHeight: 1.2,
              }}
            >
              {ownerName}
            </span>
            <span style={{ fontSize: 11, color: "#71717A", lineHeight: 1.2 }}>
              Owner
            </span>
          </div>
          <ChevronDown size={14} color="#71717A" />
        </div>
      </div>
    </header>
  );
}
