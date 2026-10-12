"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useLiveAdminRefresh } from "@/components/admin/use-live-admin-refresh";
import {
  Search,
  Download,
  Check,
  X,
  Eye,
  RefreshCw,
  Truck,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpDown,
  Filter,
} from "lucide-react";

interface ReturnItem {
  id: string;
  orderId: string;
  orderRawId?: string;
  customer: string;
  email: string;
  amount: number;
  paymentMethod: string;
  reason: string;
  status: "Pending" | "Approved" | "Refunded" | "Rejected" | "Processing";
  date: string;
  product?: string;
  pickupCourier?: string;
  inspectionNote?: string;
}

export default function AdminReturnsPage() {
  const [returns, setReturns] = useState<ReturnItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReturn, setSelectedReturn] = useState<ReturnItem | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Filters matching Sellzy
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [loadError, setLoadError] = useState("");
  const fetching = useRef(false);
  async function fetchReturns(silent = false) {
    if (fetching.current) return;
    fetching.current = true;
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/admin/returns", { cache: "no-store", signal: AbortSignal.timeout(60000) });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Unable to load return requests.");
      setLoadError("");
      if (Array.isArray(json.returns)) {
        setReturns(json.returns);
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Return data could not be loaded.");
    } finally {
      fetching.current = false;
      setLoading(false);
    }
  }

  useLiveAdminRefresh(() => fetchReturns(true));

  useEffect(() => {
    fetchReturns();
  }, []);

  async function handleStatusUpdate(returnId: string, nextStatus: string, note?: string) {
    setProcessingId(returnId);
    try {
      const res = await fetch("/api/admin/returns", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          returnId,
          status: nextStatus,
          reason: note || actionReason || `Status set to ${nextStatus} by shop manager`,
        }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || "Could not update request.");
      if (result.success) {
        setReturns((prev) =>
          prev.map((r) =>
            r.id === returnId
              ? {
                  ...r,
                  status: nextStatus as any,
                  inspectionNote: note || actionReason || r.inspectionNote,
                }
              : r
          )
        );
        if (selectedReturn?.id === returnId) {
          setSelectedReturn((prev) =>
            prev ? { ...prev, status: nextStatus as any } : null
          );
        }
        setActionReason("");
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update status. Please try again.");
    } finally {
      setProcessingId(null);
    }
  }

  // Filtered dataset
  const filteredReturns = useMemo(() => {
    return returns.filter((item) => {
      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchId = (item.id || "").toLowerCase().includes(q);
        const matchOrder = (item.orderId || "").toLowerCase().includes(q);
        const matchCust = (item.customer || "").toLowerCase().includes(q);
        const matchMail = (item.email || "").toLowerCase().includes(q);
        const matchReason = (item.reason || "").toLowerCase().includes(q);
        if (!matchId && !matchOrder && !matchCust && !matchMail && !matchReason) {
          return false;
        }
      }

      // Payment method
      if (paymentFilter !== "all") {
        if ((item.paymentMethod || "").toLowerCase() !== paymentFilter.toLowerCase()) {
          return false;
        }
      }

      // Status
      if (statusFilter !== "all") {
        if ((item.status || "").toLowerCase() !== statusFilter.toLowerCase()) {
          return false;
        }
      }

      return true;
    });
  }, [returns, search, paymentFilter, statusFilter, dateFilter]);

  // Select all toggle
  const isAllSelected =
    filteredReturns.length > 0 &&
    filteredReturns.every((r) => selectedIds.has(r.id));

  function toggleSelectAll() {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredReturns.map((r) => r.id)));
    }
  }

  function toggleSelectRow(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Export to CSV
  function handleExportCSV() {
    if (!filteredReturns.length) {
      alert("No returns available to export.");
      return;
    }
    const headers = [
      "Return ID",
      "Order ID",
      "Customer",
      "Email",
      "Amount",
      "Payment Method",
      "Reason",
      "Status",
      "Date",
    ];
    const rows = filteredReturns.map((r) => [
      `#${r.id}`,
      `#${r.orderId}`,
      `"${r.customer}"`,
      r.email,
      r.amount,
      r.paymentMethod,
      `"${(r.reason || "").replace(/"/g, '""')}"`,
      r.status,
      r.date,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `ovia_refunds_export_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, padding: "4px 0" }}>
      {/* Top Header matching Sellzy */}
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
            Refunds
          </h1>
          <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>
            Customer return requests and provider-confirmed refunds. Review payments before issuing money.
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

      {/* Main Card with Filters and Table */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid #E2E8F0",
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
        }}
      >
        {/* Sellzy Filter Bar */}
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
          {/* Search Box */}
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
                style={{
                  background: "none",
                  border: "none",
                  color: "#94A3B8",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Dropdown Filters */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {/* Payment Method */}
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
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
              <option value="all">Payment Method</option>
              <option value="Razorpay">Razorpay</option>
              <option value="PayPal">PayPal</option>
              <option value="Wallet">Wallet</option>
              <option value="COD">Cash on Delivery</option>
            </select>

            {/* Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
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
              <option value="all">Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Refunded">Refunded</option>
              <option value="Rejected">Rejected</option>
            </select>

            {/* Date */}
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

        {/* Sellzy Table */}
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
                <th style={{ padding: "14px 16px" }}>Order ID</th>
                <th style={{ padding: "14px 16px" }}>Customer</th>
                <th style={{ padding: "14px 16px" }}>Amount</th>
                <th style={{ padding: "14px 16px" }}>Payment Method</th>
                <th style={{ padding: "14px 16px" }}>Reason</th>
                <th style={{ padding: "14px 16px" }}>Status</th>
                <th style={{ padding: "14px 16px" }}>Date</th>
                <th style={{ padding: "14px 16px", textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} style={{ padding: "48px 0", textAlign: "center", color: "#64748B" }}>
                    <RefreshCw size={20} className="animate-spin" style={{ display: "inline", marginRight: 8 }} />
                    Loading real-time return data...
                  </td>
                </tr>
              ) : filteredReturns.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ padding: "48px 0", textAlign: "center", color: "#94A3B8" }}>
                    {loadError ? <span role="alert">{loadError} <button type="button" onClick={() => fetchReturns()}>Retry</button></span> : returns.length === 0 ? "No customer return requests or payment refunds have been recorded." : "No return claims match your filter criteria."}
                  </td>
                </tr>
              ) : (
                filteredReturns.map((r) => {
                  const isChecked = selectedIds.has(r.id);
                  const isBusy = processingId === r.id;

                  // Sellzy style badge colors
                  const isPending = r.status === "Pending";
                  const isApproved = r.status === "Approved";
                  const isRefunded = r.status === "Refunded";
                  const isRejected = r.status === "Rejected";

                  const badgeBg = isPending
                    ? "#CCFBF1" // soft mint teal
                    : isApproved
                    ? "#E0F2FE" // soft sky blue
                    : isRefunded
                    ? "#DCFCE7" // light green
                    : "#FEE2E2"; // soft red

                  const badgeText = isPending
                    ? "#0F766E"
                    : isApproved
                    ? "#0284C7"
                    : isRefunded
                    ? "#16A34A"
                    : "#DC2626";

                  return (
                    <tr
                      key={r.id}
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
                          onChange={() => toggleSelectRow(r.id)}
                          style={{ cursor: "pointer", accentColor: "#0D9488", width: 15, height: 15 }}
                        />
                      </td>

                      {/* Return ID */}
                      <td style={{ padding: "14px 16px", fontWeight: 600, color: "#1E293B" }}>
                        #{r.id}
                      </td>

                      {/* Order ID */}
                      <td style={{ padding: "14px 16px", color: "#0F766E", fontWeight: 500 }}>
                        #{r.orderId}
                      </td>

                      {/* Customer */}
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: 600, color: "#1E293B" }}>{r.customer}</div>
                        <div style={{ fontSize: 11, color: "#94A3B8" }}>{r.email}</div>
                      </td>

                      {/* Amount */}
                      <td style={{ padding: "14px 16px", fontWeight: 600, color: "#1E293B" }}>
                        ₹{Number(r.amount).toLocaleString("en-IN")}
                      </td>

                      {/* Payment Method */}
                      <td style={{ padding: "14px 16px", color: "#475569" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "3px 8px",
                            borderRadius: 6,
                            backgroundColor: "#F1F5F9",
                            fontSize: 12,
                            fontWeight: 500,
                          }}
                        >
                          {r.paymentMethod}
                        </span>
                      </td>

                      {/* Reason */}
                      <td
                        style={{
                          padding: "14px 16px",
                          color: "#64748B",
                          maxWidth: 200,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                        title={r.reason}
                      >
                        {r.reason || "-"}
                      </td>

                      {/* Status */}
                      <td style={{ padding: "14px 16px" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "4px 12px",
                            borderRadius: 20,
                            backgroundColor: badgeBg,
                            color: badgeText,
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          {r.status}
                        </span>
                      </td>

                      {/* Date */}
                      <td style={{ padding: "14px 16px", color: "#64748B", whiteSpace: "nowrap" }}>
                        {r.date}
                      </td>

                      {/* Action buttons matching Sellzy */}
                      <td style={{ padding: "14px 16px", textAlign: "right", whiteSpace: "nowrap" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                          {/* Approve Button */}
                          {r.status !== "Approved" && r.status !== "Refunded" && r.status !== "Processing" && (
                            <button
                              disabled={isBusy}
                              onClick={() => handleStatusUpdate(r.id, "Approved")}
                              style={{
                                padding: "6px 14px",
                                borderRadius: 6,
                                backgroundColor: "#0D9488",
                                color: "#FFFFFF",
                                border: "none",
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: isBusy ? "not-allowed" : "pointer",
                                opacity: isBusy ? 0.6 : 1,
                                transition: "background-color 0.15s ease",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#0F766E")}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#0D9488")}
                            >
                              Approve
                            </button>
                          )}

                          {/* Reject Button */}
                          {r.status === "Pending" && (
                            <button
                              disabled={isBusy}
                              onClick={() => handleStatusUpdate(r.id, "Rejected")}
                              style={{
                                padding: "5px 12px",
                                borderRadius: 6,
                                backgroundColor: "transparent",
                                color: "#DC2626",
                                border: "1px solid #FECACA",
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: isBusy ? "not-allowed" : "pointer",
                                opacity: isBusy ? 0.6 : 1,
                                transition: "all 0.15s ease",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = "#FEF2F2";
                                e.currentTarget.style.borderColor = "#F87171";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "transparent";
                                e.currentTarget.style.borderColor = "#FECACA";
                              }}
                            >
                              Reject
                            </button>
                          )}

                          {/* Disburse Refund if Approved */}
                          {r.status === "Approved" && (
                            <button
                              disabled={isBusy}
                              onClick={() => { window.location.href = "/admin/payments"; }}
                              style={{
                                padding: "6px 14px",
                                borderRadius: 6,
                                backgroundColor: "#16A34A",
                                color: "#FFFFFF",
                                border: "none",
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: isBusy ? "not-allowed" : "pointer",
                              }}
                            >
                              Review payment
                            </button>
                          )}

                          {/* View Details Button */}
                          <button
                            onClick={() => setSelectedReturn(r)}
                            style={{
                              padding: "5px 12px",
                              borderRadius: 6,
                              backgroundColor: "#FFFFFF",
                              color: "#475569",
                              border: "1px solid #E2E8F0",
                              fontSize: 12,
                              fontWeight: 500,
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = "#F8FAFC";
                              e.currentTarget.style.borderColor = "#CBD5E1";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = "#FFFFFF";
                              e.currentTarget.style.borderColor = "#E2E8F0";
                            }}
                          >
                            View Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Details & Review Modal */}
      {selectedReturn && (
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
            if (e.target === e.currentTarget) setSelectedReturn(null);
          }}
        >
          <div
            style={{
              width: 520,
              maxWidth: "100%",
              backgroundColor: "#FFFFFF",
              borderRadius: 12,
              padding: "24px 28px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              border: "1px solid #E2E8F0",
              animation: "fadeIn 0.15s ease-out",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1E293B", margin: "0 0 4px" }}>
                  Return Claim #{selectedReturn.id}
                </h2>
                <div style={{ fontSize: 13, color: "#64748B" }}>
                  Linked Order #{selectedReturn.orderId} • {selectedReturn.customer}
                </div>
              </div>
              <button
                onClick={() => setSelectedReturn(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#94A3B8",
                  cursor: "pointer",
                  padding: 4,
                }}
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
                <span style={{ color: "#64748B" }}>Product:</span>
                <span style={{ fontWeight: 600, color: "#1E293B" }}>
                  {selectedReturn.product || "Executive Travel Luggage"}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748B" }}>Refund Amount:</span>
                <span style={{ fontWeight: 700, color: "#0F766E", fontSize: 15 }}>
                  ₹{Number(selectedReturn.amount).toLocaleString("en-IN")}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748B" }}>Payment Method:</span>
                <span style={{ fontWeight: 600, color: "#1E293B" }}>{selectedReturn.paymentMethod}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748B" }}>Claim Date:</span>
                <span style={{ color: "#1E293B" }}>{selectedReturn.date}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748B" }}>Courier Pickup:</span>
                <span style={{ color: "#1E293B", display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <Truck size={14} color="#0D9488" />
                  {selectedReturn.pickupCourier || "Delhivery Express Doorstep Pickup"}
                </span>
              </div>
              <div style={{ borderTop: "1px solid #E2E8F0", paddingTop: 8 }}>
                <span style={{ color: "#64748B", display: "block", marginBottom: 2 }}>Client Reason:</span>
                <span style={{ color: "#1E293B", fontWeight: 500 }}>
                  {selectedReturn.reason || "None specified"}
                </span>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>
                Inspection Note / Management Reason
              </label>
              <input
                type="text"
                placeholder="Optional inspection notes..."
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 14px",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #CBD5E1",
                  borderRadius: 6,
                  outline: "none",
                  fontSize: 13,
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <button
                type="button"
                onClick={() => setSelectedReturn(null)}
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

              <div style={{ display: "flex", gap: 8 }}>
                {selectedReturn.status === "Pending" && (
                  <>
                    <button
                      onClick={() => handleStatusUpdate(selectedReturn.id, "Rejected")}
                      style={{
                        padding: "8px 16px",
                        backgroundColor: "#FEF2F2",
                        color: "#DC2626",
                        border: "1px solid #FECACA",
                        borderRadius: 6,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Reject Return
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(selectedReturn.id, "Approved")}
                      style={{
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
                      Approve & Schedule Pickup
                    </button>
                  </>
                )}

                {selectedReturn.status === "Approved" && (
                  <button
                    onClick={() => { window.location.href = "/admin/payments"; }}
                    style={{
                      padding: "8px 18px",
                      backgroundColor: "#16A34A",
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Review provider refund
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
