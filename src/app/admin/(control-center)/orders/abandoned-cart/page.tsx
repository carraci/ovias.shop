"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useLiveAdminRefresh } from "@/components/admin/use-live-admin-refresh";
import {
  Search,
  Download,
  X,
  RefreshCw,
  Eye,
  Mail,
  ShoppingCart,
  Send,
  Package,
} from "lucide-react";

interface AbandonedCartItem {
  id: string;
  cartId: string;
  customer: string;
  email: string;
  itemsCount: number;
  itemsText: string;
  lines: Array<{
    name?: string;
    sku: string;
    quantity: number;
    price?: number;
    image?: string;
  }>;
  amount: number;
  date: string;
  rawDate: string;
  paymentStatus: string;
  receivedStatus: string;
}

export default function AdminAbandonedCartPage() {
  const [carts, setCarts] = useState<AbandonedCartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCart, setSelectedCart] = useState<AbandonedCartItem | null>(null);

  // Filters matching Sellzy
  const [search, setSearch] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [receivedStatusFilter, setReceivedStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  async function fetchAbandonedCarts(silent = false) {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/admin/abandoned-carts", { cache: "no-store" });
      const json = await res.json();
      if (json.success && Array.isArray(json.abandonedCarts)) {
        setCarts(json.abandonedCarts);
      }
    } catch (err) {
      console.error("Failed to load abandoned carts:", err);
    } finally {
      setLoading(false);
    }
  }

  useLiveAdminRefresh(() => fetchAbandonedCarts(true));

  useEffect(() => {
    fetchAbandonedCarts();
  }, []);

  const filteredCarts = useMemo(() => {
    return carts.filter((item) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchId = (item.id || "").toLowerCase().includes(q);
        const matchCustomer = (item.customer || "").toLowerCase().includes(q);
        const matchEmail = (item.email || "").toLowerCase().includes(q);
        if (!matchId && !matchCustomer && !matchEmail) return false;
      }
      if (paymentStatusFilter !== "all") {
        if (item.paymentStatus.toLowerCase() !== paymentStatusFilter.toLowerCase()) return false;
      }
      if (receivedStatusFilter !== "all") {
        if (item.receivedStatus.toLowerCase() !== receivedStatusFilter.toLowerCase()) return false;
      }
      return true;
    });
  }, [carts, search, paymentStatusFilter, receivedStatusFilter, dateFilter]);

  const isAllSelected =
    filteredCarts.length > 0 &&
    filteredCarts.every((r) => selectedIds.has(r.id));

  function toggleSelectAll() {
    if (isAllSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredCarts.map((r) => r.id)));
  }

  function toggleSelectRow(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleExportCSV() {
    if (!filteredCarts.length) {
      alert("No abandoned carts available to export.");
      return;
    }
    const headers = ["ID", "Customer", "Items", "Amount", "Email", "Date", "Status"];
    const rows = filteredCarts.map((c) => [
      c.id,
      `"${c.customer}"`,
      c.itemsText,
      c.amount,
      c.email,
      c.date,
      c.receivedStatus,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `ovia_abandoned_carts_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, padding: "4px 0" }}>
      {/* Header matching Sellzy */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#1E293B",
              margin: "0 0 4px",
              letterSpacing: "-0.01em",
            }}
          >
            Abandoned cart
          </h1>
          <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>
            Real-time live cart recovery opportunities, guest checkout bags, and itemized summaries.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            backgroundColor: "#0D9488",
            color: "#FFFFFF",
            padding: "9px 20px",
            borderRadius: 8,
            border: "none",
            fontWeight: 600,
            fontSize: 13,
            cursor: "pointer",
            boxShadow: "0 1px 2px rgba(13, 148, 136, 0.2)",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#0F766E")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#0D9488")}
        >
          <Download size={15} />
          Export
        </button>
      </div>

      {/* Main Card */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid #E2E8F0",
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
        }}
      >
        {/* Filters bar */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #F1F5F9",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              backgroundColor: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: 8,
              padding: "7px 14px",
              width: 320,
              maxWidth: "100%",
            }}
          >
            <Search size={16} color="#94A3B8" />
            <input
              type="text"
              placeholder="Search.."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                border: "none",
                background: "transparent",
                outline: "none",
                fontSize: 13,
                color: "#1E293B",
                width: "100%",
              }}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", padding: 0 }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              style={{
                backgroundColor: "#F8FAFC",
                border: "1px solid #E2E8F0",
                borderRadius: 8,
                padding: "8px 14px",
                fontSize: 13,
                color: "#475569",
                outline: "none",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              <option value="all">Payment status</option>
              <option value="Pending">Pending</option>
              <option value="Unpaid">Unpaid</option>
            </select>

            <select
              value={receivedStatusFilter}
              onChange={(e) => setReceivedStatusFilter(e.target.value)}
              style={{
                backgroundColor: "#F8FAFC",
                border: "1px solid #E2E8F0",
                borderRadius: 8,
                padding: "8px 14px",
                fontSize: 13,
                color: "#475569",
                outline: "none",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              <option value="all">Received status</option>
              <option value="Abandoned">Abandoned</option>
              <option value="Unreceived">Unreceived</option>
            </select>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{
                backgroundColor: "#F8FAFC",
                border: "1px solid #E2E8F0",
                borderRadius: 8,
                padding: "8px 14px",
                fontSize: 13,
                color: "#475569",
                outline: "none",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              <option value="all">Date</option>
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 13,
              textAlign: "left",
            }}
          >
            <thead>
              <tr
                style={{
                  backgroundColor: "#F8FAFC",
                  borderBottom: "1px solid #E2E8F0",
                  color: "#64748B",
                  fontWeight: 600,
                  fontSize: 12,
                }}
              >
                <th style={{ width: 44, padding: "14px 16px" }}>
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    style={{ cursor: "pointer", accentColor: "#0D9488", width: 15, height: 15 }}
                  />
                </th>
                <th style={{ padding: "14px 16px" }}>ID</th>
                <th style={{ padding: "14px 16px" }}>Customer</th>
                <th style={{ padding: "14px 16px" }}>Items</th>
                <th style={{ padding: "14px 16px" }}>Amount</th>
                <th style={{ padding: "14px 16px" }}>Date</th>
                <th style={{ padding: "14px 16px", textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: "48px 0", textAlign: "center", color: "#64748B" }}>
                    <RefreshCw size={20} className="animate-spin" style={{ display: "inline", marginRight: 8 }} />
                    Loading real-time abandoned carts...
                  </td>
                </tr>
              ) : filteredCarts.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "48px 0", textAlign: "center", color: "#94A3B8" }}>
                    No abandoned carts recorded.
                  </td>
                </tr>
              ) : (
                filteredCarts.map((c) => {
                  const isChecked = selectedIds.has(c.id);

                  return (
                    <tr
                      key={c.id}
                      style={{
                        borderBottom: "1px solid #F1F5F9",
                        backgroundColor: isChecked ? "#F0FDFA" : "#FFFFFF",
                        transition: "background-color 0.1s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (!isChecked) e.currentTarget.style.backgroundColor = "#F8FAFC";
                      }}
                      onMouseLeave={(e) => {
                        if (!isChecked) e.currentTarget.style.backgroundColor = "#FFFFFF";
                      }}
                    >
                      <td style={{ padding: "14px 16px" }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectRow(c.id)}
                          style={{ cursor: "pointer", accentColor: "#0D9488", width: 15, height: 15 }}
                        />
                      </td>

                      <td style={{ padding: "14px 16px", fontWeight: 600, color: "#1E293B" }}>
                        {c.id}
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: 600, color: "#1E293B" }}>{c.customer}</div>
                        <div style={{ fontSize: 11, color: "#94A3B8" }}>{c.email}</div>
                      </td>

                      <td style={{ padding: "14px 16px", color: "#475569" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "3px 9px",
                            borderRadius: 12,
                            backgroundColor: "#F1F5F9",
                            fontSize: 12,
                            fontWeight: 500,
                          }}
                        >
                          {c.itemsText}
                        </span>
                      </td>

                      <td style={{ padding: "14px 16px", fontWeight: 600, color: "#1E293B" }}>
                        ₹{Number(c.amount).toLocaleString("en-IN")}
                      </td>

                      <td style={{ padding: "14px 16px", color: "#64748B", whiteSpace: "nowrap" }}>
                        {c.date}
                      </td>

                      <td style={{ padding: "14px 16px", textAlign: "right" }}>
                        <button
                          onClick={() => setSelectedCart(c)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#64748B",
                            cursor: "pointer",
                            padding: 6,
                            borderRadius: 6,
                            transition: "all 0.15s ease",
                          }}
                          title="View Bag Items"
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = "#0D9488";
                            e.currentTarget.style.backgroundColor = "#F0FDFA";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = "#64748B";
                            e.currentTarget.style.backgroundColor = "transparent";
                          }}
                        >
                          <Eye size={17} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cart Details Modal */}
      {selectedCart && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.45)",
            backdropFilter: "blur(2px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
            padding: 16,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedCart(null);
          }}
        >
          <div
            style={{
              width: 500,
              maxWidth: "100%",
              backgroundColor: "#FFFFFF",
              borderRadius: 12,
              padding: "24px 28px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              border: "1px solid #E2E8F0",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1E293B", margin: "0 0 4px" }}>
                  Abandoned Cart {selectedCart.id}
                </h2>
                <div style={{ fontSize: 13, color: "#64748B" }}>
                  {selectedCart.customer} • {selectedCart.email}
                </div>
              </div>
              <button
                onClick={() => setSelectedCart(null)}
                style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", padding: 4 }}
              >
                <X size={20} />
              </button>
            </div>

            <div
              style={{
                backgroundColor: "#F8FAFC",
                border: "1px solid #E2E8F0",
                borderRadius: 8,
                padding: "16px",
                marginBottom: 20,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 600, color: "#64748B", textTransform: "uppercase", marginBottom: 10 }}>
                Bag Line Items ({selectedCart.lines.length})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {selectedCart.lines.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: 13,
                      borderBottom: idx < selectedCart.lines.length - 1 ? "1px solid #F1F5F9" : "none",
                      paddingBottom: 8,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 6,
                          backgroundColor: "#E2E8F0",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Package size={16} color="#64748B" />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: "#1E293B" }}>{item.name || item.sku}</div>
                        <div style={{ fontSize: 11, color: "#94A3B8" }}>SKU: {item.sku}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 600, color: "#1E293B" }}>Qty: {item.quantity || 1}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderTop: "1px solid #E2E8F0",
                  marginTop: 12,
                  paddingTop: 10,
                  fontSize: 14,
                }}
              >
                <span style={{ fontWeight: 600, color: "#475569" }}>Total Estimated Value:</span>
                <span style={{ fontWeight: 700, color: "#0F766E", fontSize: 16 }}>
                  ₹{Number(selectedCart.amount).toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button
                type="button"
                onClick={() => setSelectedCart(null)}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#F1F5F9",
                  border: "1px solid #E2E8F0",
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#475569",
                  cursor: "pointer",
                }}
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => {
                  alert(`Recovery email queued for ${selectedCart.email}!`);
                  setSelectedCart(null);
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 18px",
                  backgroundColor: "#0D9488",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <Send size={14} />
                Send Recovery Reminder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
