"use client";

import { useLiveAdminRefresh } from "@/components/admin/use-live-admin-refresh";
import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  MoreVertical,
  ChevronDown,
  RefreshCw,
  Copy,
  Edit2,
  Trash2,
  Power,
  ArrowUpDown,
} from "lucide-react";

export default function AdminCouponsPage() {
  const router = useRouter();
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  // Sorting
  const [sortField, setSortField] = useState<string>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const menuRef = useRef<HTMLDivElement | null>(null);

  async function fetchCoupons(silent = false) {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/admin/coupons", { cache: "no-store" });
      const json = await res.json();
      if (json.success) {
        setCoupons(json.coupons || []);
      }
    } catch (err) {
      console.error("Failed to load coupons:", err);
    } finally {
      setLoading(false);
    }
  }

  useLiveAdminRefresh(() => fetchCoupons(true));

  useEffect(() => {
    fetchCoupons();
  }, []);

  // Close actions menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSort(field: string) {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  }

  // Derive status badge for a coupon matching Image 1
  function getCouponStatus(c: any): { label: string; bg: string; color: string } {
    const today = new Date().toISOString().slice(0, 10);
    const isInactive = c.status === "Inactive" || c.status === "Disabled";

    if (isInactive) {
      return { label: "Disabled", bg: "#f3f4f6", color: "#6b7280" };
    }

    if (c.endDate && c.endDate < today) {
      return { label: "Finished", bg: "#e0f2fe", color: "#0369a1" };
    }

    if (c.startDate && c.startDate > today) {
      return { label: "Planned", bg: "#dbeafe", color: "#1d4ed8" };
    }

    return { label: "Enabled", bg: "#dcfce7", color: "#15803d" };
  }

  // Format type string matching Image 1
  function formatCouponType(c: any): string {
    const t = String(c.discountType || "").toLowerCase();
    if (t.includes("shipping")) return "Free shipping";
    if (t === "fixed") return "Fixed amount";
    return "Percentage";
  }

  // Format discount string matching Image 1
  function formatDiscountValue(c: any): string {
    const t = String(c.discountType || "").toLowerCase();
    if (t.includes("shipping")) return "Free shipping";
    if (t === "fixed") return `₹${Number(c.value || 0).toLocaleString("en-IN")}`;
    return `${c.value}%`;
  }

  // Filtered & sorted coupons
  const filteredCoupons = useMemo(() => {
    let list = [...coupons];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.code?.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q) ||
          formatCouponType(c).toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === "status") {
        aVal = getCouponStatus(a).label;
        bVal = getCouponStatus(b).label;
      } else if (sortField === "discount") {
        aVal = Number(a.value || 0);
        bVal = Number(b.value || 0);
      } else if (sortField === "type") {
        aVal = formatCouponType(a);
        bVal = formatCouponType(b);
      }

      if (aVal === bVal) return 0;
      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;

      const compare = aVal < bVal ? -1 : 1;
      return sortDirection === "asc" ? compare : -compare;
    });

    return list;
  }, [coupons, search, sortField, sortDirection]);

  // Pagination slice
  const totalItems = filteredCoupons.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));
  const validPage = Math.min(currentPage, totalPages);
  const startIndex = (validPage - 1) * rowsPerPage;
  const paginatedCoupons = filteredCoupons.slice(startIndex, startIndex + rowsPerPage);

  function handleSelectAll(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.checked) {
      const allCodesOnPage = paginatedCoupons.map((c) => c.code);
      setSelectedCodes(Array.from(new Set([...selectedCodes, ...allCodesOnPage])));
    } else {
      const pageCodes = new Set(paginatedCoupons.map((c) => c.code));
      setSelectedCodes(selectedCodes.filter((code) => !pageCodes.has(code)));
    }
  }

  function handleToggleSelect(code: string) {
    if (selectedCodes.includes(code)) {
      setSelectedCodes(selectedCodes.filter((c) => c !== code));
    } else {
      setSelectedCodes([...selectedCodes, code]);
    }
  }

  async function handleToggleStatus(c: any) {
    const nextStatus = c.status === "Active" ? "Inactive" : "Active";
    try {
      const res = await fetch(`/api/admin/coupons/${encodeURIComponent(c.id || c.code)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const json = await res.json();
      if (json.success) {
        setCoupons((prev) =>
          prev.map((item) =>
            item.id === c.id || item.code === c.code ? { ...item, status: nextStatus } : item
          )
        );
        setActiveMenu(null);
      }
    } catch {
      alert("Failed to update status.");
    }
  }

  async function handleDelete(c: any) {
    if (!confirm(`Are you sure you want to permanently delete coupon "${c.code}"?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/coupons/${encodeURIComponent(c.id || c.code)}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        setCoupons((prev) => prev.filter((item) => item.id !== c.id && item.code !== c.code));
        setActiveMenu(null);
      } else {
        alert(json.error || "Failed to delete.");
      }
    } catch {
      alert("Failed to delete coupon.");
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Breadcrumb & Navigation */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ fontSize: 13, color: "#6b7280", display: "flex", alignItems: "center", gap: 6 }}>
          <Link href="/admin" style={{ color: "#6b7280", textDecoration: "none" }}>
            Dashboard
          </Link>
          <span>/</span>
          <span style={{ color: "#111827", fontWeight: 500 }}>Coupons</span>
        </div>

        {/* Page Title & "New coupon" Button matching Image 1 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#111827",
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            Coupons
          </h1>

          <Link
            href="/admin/coupons/new"
            style={{
              padding: "9px 20px",
              backgroundColor: "#ffd333",
              border: "none",
              borderRadius: 4,
              fontSize: 13,
              fontWeight: 600,
              color: "#28313a",
              cursor: "pointer",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              transition: "background-color 0.15s ease",
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#facc15")}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#ffd333")}
          >
            New coupon
          </Link>
        </div>
      </div>

      {/* Search Input matching Image 1 */}
      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: 4,
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
        }}
      >
        <Search size={16} color="#9ca3af" />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          placeholder="Start typing to search for coupons"
          style={{
            width: "100%",
            border: "none",
            outline: "none",
            fontSize: 13,
            color: "#111827",
            backgroundColor: "transparent",
          }}
        />
      </div>

      {/* Coupons Table Card matching Image 1 */}
      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: 4,
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr
              style={{
                backgroundColor: "#ffffff",
                borderBottom: "1px solid #e5e7eb",
                color: "#374151",
                textAlign: "left",
                fontSize: 13,
              }}
            >
              {/* Checkbox Header */}
              <th style={{ padding: "12px 16px", width: 40 }}>
                <input
                  type="checkbox"
                  checked={
                    paginatedCoupons.length > 0 &&
                    paginatedCoupons.every((c) => selectedCodes.includes(c.code))
                  }
                  onChange={handleSelectAll}
                  style={{ cursor: "pointer", accentColor: "#ffd333" }}
                />
              </th>

              {/* Code */}
              <th
                onClick={() => handleSort("code")}
                style={{ padding: "12px 16px", fontWeight: 600, cursor: "pointer", userSelect: "none" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span>Code</span>
                  <ArrowUpDown size={12} color="#9ca3af" />
                </div>
              </th>

              {/* Type */}
              <th
                onClick={() => handleSort("type")}
                style={{ padding: "12px 16px", fontWeight: 600, cursor: "pointer", userSelect: "none" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span>Type</span>
                  <ArrowUpDown size={12} color="#9ca3af" />
                </div>
              </th>

              {/* Discount */}
              <th
                onClick={() => handleSort("discount")}
                style={{ padding: "12px 16px", fontWeight: 600, cursor: "pointer", userSelect: "none" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span>Discount</span>
                  <ArrowUpDown size={12} color="#9ca3af" />
                </div>
              </th>

              {/* Status */}
              <th
                onClick={() => handleSort("status")}
                style={{ padding: "12px 16px", fontWeight: 600, cursor: "pointer", userSelect: "none" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span>Status</span>
                  <ArrowUpDown size={12} color="#9ca3af" />
                </div>
              </th>

              {/* Start Date */}
              <th
                onClick={() => handleSort("startDate")}
                style={{ padding: "12px 16px", fontWeight: 600, cursor: "pointer", userSelect: "none" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span>Start date</span>
                  <ArrowUpDown size={12} color="#9ca3af" />
                </div>
              </th>

              {/* End Date */}
              <th
                onClick={() => handleSort("endDate")}
                style={{ padding: "12px 16px", fontWeight: 600, cursor: "pointer", userSelect: "none" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span>End date</span>
                  <ArrowUpDown size={12} color="#9ca3af" />
                </div>
              </th>

              {/* Actions */}
              <th style={{ padding: "12px 16px", width: 44, textAlign: "right" }}></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>
                  <RefreshCw size={18} className="animate-spin" style={{ display: "inline-block", marginRight: 8 }} />
                  Loading coupons...
                </td>
              </tr>
            ) : paginatedCoupons.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>
                  No coupons found. Click &quot;New coupon&quot; to add one.
                </td>
              </tr>
            ) : (
              paginatedCoupons.map((c) => {
                const statusInfo = getCouponStatus(c);
                const isSelected = selectedCodes.includes(c.code);

                return (
                  <tr
                    key={c.id || c.code}
                    style={{
                      borderBottom: "1px solid #f3f4f6",
                      backgroundColor: isSelected ? "#f9fafb" : "#ffffff",
                      transition: "background-color 0.1s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = "#fafafa";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = "#ffffff";
                    }}
                  >
                    {/* Checkbox */}
                    <td style={{ padding: "14px 16px" }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(c.code)}
                        style={{ cursor: "pointer", accentColor: "#ffd333" }}
                      />
                    </td>

                    {/* Code (Link to Edit) */}
                    <td style={{ padding: "14px 16px" }}>
                      <Link
                        href={`/admin/coupons/${encodeURIComponent(c.id || c.code)}`}
                        style={{
                          fontWeight: 600,
                          color: "#111827",
                          textDecoration: "none",
                          fontFamily: "monospace",
                          letterSpacing: "0.03em",
                        }}
                      >
                        {c.code}
                      </Link>
                    </td>

                    {/* Type */}
                    <td style={{ padding: "14px 16px", color: "#374151" }}>
                      {formatCouponType(c)}
                    </td>

                    {/* Discount */}
                    <td style={{ padding: "14px 16px", color: "#111827", fontWeight: 500 }}>
                      {formatDiscountValue(c)}
                    </td>

                    {/* Status Badge */}
                    <td style={{ padding: "14px 16px" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "3px 10px",
                          borderRadius: 12,
                          fontSize: 11,
                          fontWeight: 600,
                          backgroundColor: statusInfo.bg,
                          color: statusInfo.color,
                        }}
                      >
                        {statusInfo.label}
                      </span>
                    </td>

                    {/* Start Date */}
                    <td style={{ padding: "14px 16px", color: "#6b7280", fontSize: 12 }}>
                      {c.startDate ? `${c.startDate} 00:00` : "—"}
                    </td>

                    {/* End Date */}
                    <td style={{ padding: "14px 16px", color: "#6b7280", fontSize: 12 }}>
                      {c.endDate ? `${c.endDate} 00:00` : "—"}
                    </td>

                    {/* Actions Menu (⋮) */}
                    <td style={{ padding: "14px 16px", textAlign: "right", position: "relative" }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenu(activeMenu === c.code ? null : c.code);
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#9ca3af",
                          padding: "4px",
                          borderRadius: 4,
                        }}
                        title="Actions"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {/* Dropdown Popover */}
                      {activeMenu === c.code && (
                        <div
                          ref={menuRef}
                          style={{
                            position: "absolute",
                            right: 16,
                            top: 42,
                            backgroundColor: "#ffffff",
                            border: "1px solid #e5e7eb",
                            borderRadius: 6,
                            boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)",
                            zIndex: 50,
                            minWidth: 140,
                            display: "flex",
                            flexDirection: "column",
                            padding: "4px 0",
                            textAlign: "left",
                          }}
                        >
                          <Link
                            href={`/admin/coupons/${encodeURIComponent(c.id || c.code)}`}
                            style={{
                              padding: "8px 14px",
                              fontSize: 12,
                              color: "#374151",
                              textDecoration: "none",
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f3f4f6")}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                          >
                            <Edit2 size={13} /> Edit
                          </Link>

                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(c.code);
                              alert(`Copied coupon code ${c.code} to clipboard!`);
                              setActiveMenu(null);
                            }}
                            style={{
                              padding: "8px 14px",
                              fontSize: 12,
                              color: "#374151",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              width: "100%",
                              textAlign: "left",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f3f4f6")}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                          >
                            <Copy size={13} /> Copy code
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleStatus(c)}
                            style={{
                              padding: "8px 14px",
                              fontSize: 12,
                              color: c.status === "Active" ? "#b45309" : "#15803d",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              width: "100%",
                              textAlign: "left",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f3f4f6")}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                          >
                            <Power size={13} /> {c.status === "Active" ? "Disable" : "Enable"}
                          </button>

                          <div style={{ height: 1, backgroundColor: "#f3f4f6", margin: "4px 0" }} />

                          <button
                            type="button"
                            onClick={() => handleDelete(c)}
                            style={{
                              padding: "8px 14px",
                              fontSize: 12,
                              color: "#dc2626",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              width: "100%",
                              textAlign: "left",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#fee2e2")}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination Toolbar matching Image 1 */}
        <div
          style={{
            padding: "12px 18px",
            borderTop: "1px solid #e5e7eb",
            backgroundColor: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
            fontSize: 13,
            color: "#6b7280",
          }}
        >
          {/* Left: Previous, Page Buttons, Next */}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button
              type="button"
              disabled={validPage <= 1}
              onClick={() => setCurrentPage(validPage - 1)}
              style={{
                padding: "6px 12px",
                backgroundColor: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: 4,
                fontSize: 12,
                color: validPage <= 1 ? "#9ca3af" : "#374151",
                cursor: validPage <= 1 ? "not-allowed" : "pointer",
              }}
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setCurrentPage(p)}
                style={{
                  padding: "6px 12px",
                  backgroundColor: p === validPage ? "#ffd333" : "#ffffff",
                  border: p === validPage ? "none" : "1px solid #e5e7eb",
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: p === validPage ? 600 : 400,
                  color: p === validPage ? "#111827" : "#374151",
                  cursor: "pointer",
                }}
              >
                {p}
              </button>
            ))}

            <button
              type="button"
              disabled={validPage >= totalPages}
              onClick={() => setCurrentPage(validPage + 1)}
              style={{
                padding: "6px 12px",
                backgroundColor: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: 4,
                fontSize: 12,
                color: validPage >= totalPages ? "#9ca3af" : "#374151",
                cursor: validPage >= totalPages ? "not-allowed" : "pointer",
              }}
            >
              Next
            </button>
          </div>

          {/* Right: Showing text & Rows per page */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span>
              Showing {totalItems === 0 ? 0 : startIndex + 1} to{" "}
              {Math.min(startIndex + rowsPerPage, totalItems)} of {totalItems}
            </span>

            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span>Rows per page:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                style={{
                  padding: "4px 8px",
                  borderRadius: 4,
                  border: "1px solid #e5e7eb",
                  fontSize: 12,
                  color: "#374151",
                  outline: "none",
                  cursor: "pointer",
                  backgroundColor: "#ffffff",
                }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
