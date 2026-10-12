"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useLiveAdminRefresh } from "@/components/admin/use-live-admin-refresh";
import {
  Search,
  Download,
  X,
  RefreshCw,
  Eye,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import type { OrderRefund } from "@/lib/types";

interface PaymentTransaction {
  id: string;
  trackingNumber: string;
  localOrderId: string;
  orderId: string;
  customer: string;
  email: string;
  image?: string;
  productName?: string;
  provider: string;
  method: string;
  amount: number;
  productPrice: number;
  deliveryFee: number;
  refundablePaise: number;
  refund?: OrderRefund;
  canRefund: boolean;
  status: string;
  date: string;
}

const reasons = [
  "Customer requested refund",
  "Order cancelled",
  "Returned product",
  "Duplicate payment",
  "Other",
];

export default function AdminOrdersTransactionsPage() {
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters matching Image 1
  const [search, setSearch] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [receivedStatusFilter, setReceivedStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Refund dialog state
  const [selected, setSelected] = useState<PaymentTransaction | null>(null);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState(reasons[0]);
  const [dialogError, setDialogError] = useState("");
  const [busy, setBusy] = useState(false);
  const [dialogSuccess, setDialogSuccess] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const refundAttempt = useRef<{orderId:string;idempotencyKey:string;amountPaise:number;reason:string;confirmed:true} | null>(null);

  const fetchPayments = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/admin/payments", { cache: "no-store" });
      const data = await res.json();
      if (data.success && Array.isArray(data.payments)) {
        setPayments(data.payments);
      }
    } catch (err) {
      console.error("Failed to fetch payments:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useLiveAdminRefresh(() => fetchPayments(true));

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const filtered = useMemo(() => {
    return payments.filter((item) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchTracking = (item.trackingNumber || "").toLowerCase().includes(q);
        const matchOrder = (item.orderId || "").toLowerCase().includes(q);
        const matchEmail = (item.email || "").toLowerCase().includes(q);
        const matchCust = (item.customer || "").toLowerCase().includes(q);
        if (!matchTracking && !matchOrder && !matchEmail && !matchCust) return false;
      }
      if (paymentStatusFilter !== "all") {
        if (item.status.toLowerCase() !== paymentStatusFilter.toLowerCase()) return false;
      }
      return true;
    });
  }, [payments, search, paymentStatusFilter, receivedStatusFilter, dateFilter]);

  const isAllSelected =
    filtered.length > 0 && filtered.every((r) => selectedIds.has(r.id));

  function toggleSelectAll() {
    if (isAllSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map((r) => r.id)));
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
    if (!filtered.length) {
      alert("No transactions available to export.");
      return;
    }
    const headers = [
      "Tracking Number",
      "Order ID",
      "Product Price",
      "Delivery Fee",
      "Method",
      "Email",
      "Status",
      "Date",
    ];
    const rows = filtered.map((t) => [
      t.trackingNumber,
      `#${t.orderId}`,
      t.productPrice,
      t.deliveryFee,
      t.method,
      t.email,
      t.status,
      new Date(t.date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `orders_transactions_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function openRefundModal(payment: PaymentTransaction) {
    setSelected(payment);
    setConfirmed(false);
    refundAttempt.current = null;
    setRefundAmount((payment.refundablePaise / 100).toFixed(2));
    setRefundReason(reasons[0]);
    setDialogError("");
    setDialogSuccess("");
  }

  async function handleIssueRefund() {
    if (!selected || !confirmed || busy) return;
    setBusy(true);
    setDialogError("");
    setDialogSuccess("");
    try {
      const parsed = Number(refundAmount) * 100;
      if (!Number.isSafeInteger(parsed) || parsed <= 0 || parsed > selected.refundablePaise) throw new Error("Enter a valid refund amount within the remaining balance.");
      refundAttempt.current ||= { orderId: selected.localOrderId, idempotencyKey: crypto.randomUUID(), amountPaise: parsed, reason: refundReason, confirmed: true };
      const res = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(refundAttempt.current),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Unable to issue refund.");
      }
      const status = data.refund?.status;
      setDialogSuccess(status === "Refunded" ? "Provider confirmed the refund." : status === "Failed" ? "The provider reported a failed refund. Review Payments before retrying." : "Refund processing. Money is not confirmed refunded yet; provider updates will appear in Payments.");
      setSelected(prev => prev ? {...prev, canRefund: false, refund: data.refund} : prev);
      await fetchPayments(true);
    } catch (err: any) {
      setDialogError(err.message || "Failed to process refund.");
    } finally {
      setBusy(false);
    }
  }

  // Method Icon / Logo matching Image 1
  function renderMethodLogo(method: string, idx: number) {
    const m = (method || "").toLowerCase();
    const isWise = m.includes("wise");
    const isPaypal = m.includes("paypal");
    const isStripe = m.includes("stripe");
    const isRazorpay = m.includes("razorpay");
    const isApple = m.includes("apple");
    const isGoogle = m.includes("google");

    let logoBg = "#0C2340";
    let logoText = "R";
    let displayName = "Razorpay";

    if (isWise) {
      logoBg = "#2ED06E";
      logoText = "⇁";
      displayName = "Wise";
    } else if (isPaypal) {
      logoBg = "#003087";
      logoText = "P";
      displayName = "Paypal";
    } else if (isStripe) {
      logoBg = "#635BFF";
      logoText = "S";
      displayName = "Stripe";
    } else if (isApple) {
      logoBg = "#000000";
      logoText = "";
      displayName = "Apple Pay";
    } else if (isGoogle) {
      logoBg = "#4285F4";
      logoText = "G";
      displayName = "Google Pay";
    }

    return (
      <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 6,
            backgroundColor: logoBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#FFFFFF",
            fontSize: 12,
            fontWeight: 800,
            flexShrink: 0,
            boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
          }}
        >
          {logoText}
        </div>
        <span style={{ fontWeight: 500, color: "#1E293B", fontSize: 13 }}>
          {displayName}
        </span>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, padding: "4px 0" }}>
      {/* Header exactly matching Image 1 */}
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
            Orders Transactions
          </h1>
          <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>
            Live settlement transactions, payment gateways, and delivery fee reconciliations.
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
        {/* Filters bar matching Image 1 */}
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
          {/* Search Input */}
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
              placeholder="Search..."
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

          {/* Dropdown Filters matching Image 1 */}
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
              <option value="Delivered">Delivered</option>
              <option value="Pending">Pending</option>
              <option value="Refunded">Refunded</option>
              <option value="Failed">Failed</option>
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
              <option value="Delivered">Delivered</option>
              <option value="In Transit">In Transit</option>
              <option value="Pending">Pending</option>
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

        {/* Table exactly matching Image 1 */}
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
                <th style={{ padding: "14px 16px" }}>Tracking Number</th>
                <th style={{ padding: "14px 16px" }}>Product Price</th>
                <th style={{ padding: "14px 16px" }}>Delivery Fee</th>
                <th style={{ padding: "14px 16px" }}>Method</th>
                <th style={{ padding: "14px 16px" }}>Email</th>
                <th style={{ padding: "14px 16px" }}>Status</th>
                <th style={{ padding: "14px 16px" }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ padding: "48px 0", textAlign: "center", color: "#64748B" }}>
                    <RefreshCw size={20} className="animate-spin" style={{ display: "inline", marginRight: 8 }} />
                    Loading real-time orders transactions...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: "48px 0", textAlign: "center", color: "#94A3B8" }}>
                    No order transactions recorded.
                  </td>
                </tr>
              ) : (
                filtered.map((item, idx) => {
                  const isChecked = selectedIds.has(item.id);
                  const isDelivered = item.status === "Delivered";
                  const isPending = item.status === "Pending";

                  const formattedDate = new Date(item.date).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });

                  return (
                    <tr
                      key={item.id}
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
                      {/* Checkbox */}
                      <td style={{ padding: "14px 16px" }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectRow(item.id)}
                          style={{ cursor: "pointer", accentColor: "#0D9488", width: 15, height: 15 }}
                        />
                      </td>

                      {/* Tracking Number */}
                      <td style={{ padding: "14px 16px" }}>
                        <button
                          onClick={() => openRefundModal(item)}
                          style={{
                            background: "none",
                            border: "none",
                            padding: 0,
                            fontWeight: 600,
                            color: "#1E293B",
                            cursor: "pointer",
                            textAlign: "left",
                          }}
                          title="Click to view payment breakdown / refund"
                        >
                          {item.trackingNumber}
                        </button>
                      </td>

                      {/* Product Price */}
                      <td style={{ padding: "14px 16px", fontWeight: 600, color: "#1E293B" }}>
                        ₹{Number(item.productPrice).toLocaleString("en-IN")}
                      </td>

                      {/* Delivery Fee */}
                      <td style={{ padding: "14px 16px", color: "#64748B" }}>
                        ₹{Number(item.deliveryFee).toLocaleString("en-IN")}
                      </td>

                      {/* Method */}
                      <td style={{ padding: "14px 16px" }}>
                        {renderMethodLogo(item.method, idx)}
                      </td>

                      {/* Email */}
                      <td style={{ padding: "14px 16px", color: "#475569" }}>
                        {item.email}
                      </td>

                      {/* Status pill matching Image 1 */}
                      <td style={{ padding: "14px 16px" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "4px 12px",
                            borderRadius: 20,
                            backgroundColor: isDelivered ? "#DCFCE7" : isPending ? "#FEF3C7" : "#FEE2E2",
                            color: isDelivered ? "#16A34A" : isPending ? "#D97706" : "#DC2626",
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          {item.status}
                        </span>
                      </td>

                      {/* Date */}
                      <td style={{ padding: "14px 16px", color: "#64748B", whiteSpace: "nowrap" }}>
                        {formattedDate}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Details & Refund Dialog */}
      {selected && (
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
            if (e.target === e.currentTarget) setSelected(null);
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
                  Transaction {selected.trackingNumber}
                </h2>
                <div style={{ fontSize: 13, color: "#64748B" }}>
                  Linked Order #{selected.orderId} • {selected.customer}
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
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
                display: "flex",
                flexDirection: "column",
                gap: 10,
                fontSize: 13,
                marginBottom: 20,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748B" }}>Product Price:</span>
                <span style={{ fontWeight: 600, color: "#1E293B" }}>
                  ₹{Number(selected.productPrice).toLocaleString("en-IN")}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748B" }}>Delivery Fee:</span>
                <span style={{ fontWeight: 600, color: "#1E293B" }}>
                  ₹{Number(selected.deliveryFee).toLocaleString("en-IN")}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748B" }}>Total Gross Amount:</span>
                <span style={{ fontWeight: 700, color: "#0F766E", fontSize: 15 }}>
                  ₹{Number(selected.amount).toLocaleString("en-IN")}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748B" }}>Customer Email:</span>
                <span style={{ color: "#1E293B" }}>{selected.email}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748B" }}>Gateway Method:</span>
                <span style={{ fontWeight: 600, color: "#1E293B" }}>{selected.method}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748B" }}>Gateway Payment ID:</span>
                <span style={{ fontFamily: "monospace", fontSize: 12, color: "#475569" }}>{selected.id}</span>
              </div>
            </div>

            {selected.canRefund && (
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "#1E293B", margin: "0 0 10px" }}>
                  Issue Gateway Refund
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#475569", marginBottom: 4 }}>
                      Refund Amount (₹) - Max ₹{(selected.refundablePaise / 100).toLocaleString("en-IN")}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      disabled={busy || !!refundAttempt.current}
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        border: "1px solid #CBD5E1",
                        borderRadius: 6,
                        outline: "none",
                        fontSize: 13,
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#475569", marginBottom: 4 }}>
                      Reason
                    </label>
                    <select
                      disabled={busy || !!refundAttempt.current}
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        border: "1px solid #CBD5E1",
                        borderRadius: 6,
                        outline: "none",
                        fontSize: 13,
                        backgroundColor: "#FFFFFF",
                        boxSizing: "border-box",
                      }}
                    >
                      {reasons.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {selected.canRefund && <label style={{display:"flex",gap:8,marginBottom:16}}><input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} disabled={busy} />I confirm this amount will be refunded to the original payment method.</label>}

            {dialogError && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 6,
                  backgroundColor: "#FEF2F2",
                  color: "#DC2626",
                  fontSize: 13,
                  marginBottom: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <AlertTriangle size={16} />
                {dialogError}
              </div>
            )}

            {dialogSuccess && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 6,
                  backgroundColor: "#DCFCE7",
                  color: "#16A34A",
                  fontSize: 13,
                  marginBottom: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <CheckCircle2 size={16} />
                {dialogSuccess}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button
                type="button"
                onClick={() => setSelected(null)}
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

              {selected.canRefund && (
                <button
                  type="button"
                  disabled={busy || !confirmed}
                  onClick={handleIssueRefund}
                  style={{
                    padding: "8px 18px",
                    backgroundColor: "#DC2626",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: busy ? "not-allowed" : "pointer",
                    opacity: busy ? 0.6 : 1,
                  }}
                >
                  {busy ? "Processing..." : "Disburse Refund"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
