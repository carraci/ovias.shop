"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Search,
  MoreVertical,
  Plus,
  X,
  RefreshCw,
  Trash2,
  Eye,
  ArrowUpDown,
} from "lucide-react";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  ordersCount: number;
  totalSpent: number;
  joined: string;
  registered?: string;
  country?: string;
  group?: string;
  status?: string;
  avatar?: string;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Sorting state
  const [sortField, setSortField] = useState<keyof Customer>("registered");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // New Customer Modal
  const [showNewModal, setShowNewModal] = useState(false);
  const [savingNew, setSavingNew] = useState(false);
  const [newForm, setNewForm] = useState({
    name: "",
    email: "",
    phone: "",
    country: "India",
    group: "Default",
    address: "",
  });

  // Delete confirm
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetching = useRef(false);
  const [error, setError] = useState("");
  async function fetchCustomers(initial = true) {
    if (fetching.current) return;
    fetching.current = true;
    if (initial) setLoading(true);
    try {
      const res = await fetch("/api/admin/customers", { cache: "no-store", signal: AbortSignal.timeout(60000) });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Customer data is unavailable.");
      if (Array.isArray(json.customers)) {
        setError("");
        setCustomers(json.customers);
      }
    } catch (err) {
      setError(err instanceof Error && err.name === "TimeoutError" ? "Customer refresh took too long. Retrying automatically; the last loaded data is shown." : err instanceof Error ? err.message : "Customer data is unavailable.");
    } finally {
      fetching.current = false;
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchCustomers();
    const refresh = () => { if (document.visibilityState === "visible") void fetchCustomers(false); };
    const timer = setInterval(refresh, 5000);
    window.addEventListener("focus", refresh);
    return () => { clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, []);

  // Close popup menus on outside click
  useEffect(() => {
    function handleOutsideClick() {
      setActiveMenuId(null);
    }
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  function handleSort(field: keyof Customer) {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  }

  const filtered = customers
    .filter((c) => {
      const q = search.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q)) ||
        (c.country && c.country.toLowerCase().includes(q)) ||
        (c.group && c.group.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (typeof aVal === "string") aVal = (aVal as string).toLowerCase();
      if (typeof bVal === "string") bVal = (bVal as string).toLowerCase();

      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

  const allSelected =
    filtered.length > 0 && selectedIds.length === filtered.length;

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((c) => c.id));
    }
  }

  function toggleSelectRow(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  async function handleCreateCustomer(e: React.FormEvent) {
    e.preventDefault();
    if (!newForm.name.trim() || !newForm.email.trim()) {
      alert("Name and email are required.");
      return;
    }
    setSavingNew(true);
    try {
      const res = await fetch("/api/admin/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newForm),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowNewModal(false);
        setNewForm({
          name: "",
          email: "",
          phone: "",
          country: "India",
          group: "Default",
          address: "",
        });
        await fetchCustomers();
      } else {
        alert(data.error || "Failed to create customer");
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error creating customer");
    } finally {
      setSavingNew(false);
    }
  }

  async function handleDeleteCustomer(id: string) {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/customers/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setCustomerToDelete(null);
        await fetchCustomers();
      } else {
        alert("Failed to delete customer");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting customer");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div style={{ paddingBottom: 60 }}>
      {/* 1. Breadcrumbs matching Reference */}
      <nav className="admin-breadcrumb">
        <Link href="/admin">Dashboard</Link>
        <span className="sep">/</span>
        <span className="current">Customers</span>
      </nav>

      {/* 2. Page Header Row matching Reference */}
      <div className="admin-page-header">
        <h1 className="admin-page-title">Customers</h1>

      </div>

      {error && <p role="alert">{error}</p>}
      {/* 3. Main Customer Table Card matching Reference */}
      <div className="admin-customer-table-card">
        {/* Card Header Search Bar */}
        <div className="admin-customer-search-bar">
          <Search size={16} color="#9ca3af" />
          <input
            type="text"
            placeholder="Start typing to search for customers"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table className="admin-customer-table">
            <thead>
              <tr>
                <th style={{ width: 44, textAlign: "center" }}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    style={{
                      width: 16,
                      height: 16,
                      cursor: "pointer",
                      accentColor: "#ffd333",
                    }}
                  />
                </th>
                <th
                  onClick={() => handleSort("name")}
                  style={{ cursor: "pointer" }}
                >
                  Name
                  <span className="sort-icon">
                    <ArrowUpDown size={12} style={{ display: "inline" }} />
                  </span>
                </th>
                <th
                  onClick={() => handleSort("registered")}
                  style={{ cursor: "pointer" }}
                >
                  Registered
                  <span className="sort-icon">
                    <ArrowUpDown size={12} style={{ display: "inline" }} />
                  </span>
                </th>
                <th
                  onClick={() => handleSort("country")}
                  style={{ cursor: "pointer" }}
                >
                  Country
                  <span className="sort-icon">
                    <ArrowUpDown size={12} style={{ display: "inline" }} />
                  </span>
                </th>
                <th
                  onClick={() => handleSort("group")}
                  style={{ cursor: "pointer" }}
                >
                  Group
                  <span className="sort-icon">
                    <ArrowUpDown size={12} style={{ display: "inline" }} />
                  </span>
                </th>
                <th
                  onClick={() => handleSort("totalSpent")}
                  style={{ cursor: "pointer" }}
                >
                  Spent
                  <span className="sort-icon">
                    <ArrowUpDown size={12} style={{ display: "inline" }} />
                  </span>
                </th>
                <th style={{ width: 48, textAlign: "right" }}></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: 48, textAlign: "center", color: "#6b7280" }}>
                    <RefreshCw
                      size={20}
                      className="animate-spin"
                      style={{ display: "inline", marginRight: 8 }}
                    />
                    Loading customer directory...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 48, textAlign: "center", color: "#6b7280" }}>
                    No customer records found.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                  const isSelected = selectedIds.includes(c.id);
                  const isMenuOpen = activeMenuId === c.id;

                  return (
                    <tr key={c.id}>
                      {/* Checkbox */}
                      <td style={{ textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(c.id)}
                          style={{
                            width: 16,
                            height: 16,
                            cursor: "pointer",
                            accentColor: "#ffd333",
                          }}
                        />
                      </td>

                      {/* Name + Avatar */}
                      <td>
                        <div className="admin-customer-cell">
                          {c.avatar ? (
                            <img
                              src={c.avatar}
                              alt={c.name}
                              className="admin-customer-avatar-img"
                            />
                          ) : (
                            <div className="admin-customer-avatar-initial">
                              {c.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <Link
                              href={`/admin/customers/${c.id}`}
                              className="admin-customer-name-link"
                            >
                              {c.name}
                            </Link>
                            <span className="admin-customer-email-sub">
                              {c.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Registered */}
                      <td style={{ color: "#282d31" }}>
                        {c.registered || c.joined || "—"}
                      </td>

                      {/* Country */}
                      <td style={{ color: "#282d31" }}>
                        {c.country || "India"}
                      </td>

                      {/* Group */}
                      <td style={{ color: "#282d31" }}>
                        {c.group || "Default"}
                      </td>

                      {/* Spent */}
                      <td style={{ color: "#282d31", fontWeight: 500 }}>
                        {c.totalSpent.toLocaleString("en-IN", { style: "currency", currency: "INR" })}
                      </td>

                      {/* 3 Dots Actions Menu */}
                      <td style={{ textAlign: "right", position: "relative" }}>
                        <button
                          type="button"
                          className="admin-customer-action-btn"
                          aria-label={`Actions for ${c.name}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(isMenuOpen ? null : c.id);
                          }}
                        >
                          <MoreVertical size={16} />
                        </button>

                        {isMenuOpen && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              position: "absolute",
                              right: 20,
                              top: 40,
                              backgroundColor: "#ffffff",
                              border: "1px solid #e5e8eb",
                              borderRadius: 4,
                              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                              zIndex: 30,
                              minWidth: 150,
                              textAlign: "left",
                              padding: "4px 0",
                            }}
                          >
                            <Link
                              href={`/admin/customers/${c.id}`}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                padding: "8px 16px",
                                fontSize: 13,
                                color: "#282d31",
                                textDecoration: "none",
                              }}
                              onMouseOver={(e) =>
                                (e.currentTarget.style.backgroundColor = "#f7f9fa")
                              }
                              onMouseOut={(e) =>
                                (e.currentTarget.style.backgroundColor = "transparent")
                              }
                            >
                              <Eye size={14} color="#74818c" /> View Profile
                            </Link>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                setCustomerToDelete(c);
                              }}
                              style={{
                                width: "100%",
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                padding: "8px 16px",
                                fontSize: 13,
                                color: "#dc2626",
                                border: "none",
                                background: "none",
                                cursor: "pointer",
                                textAlign: "left",
                              }}
                              onMouseOver={(e) =>
                                (e.currentTarget.style.backgroundColor = "#fee2e2")
                              }
                              onMouseOut={(e) =>
                                (e.currentTarget.style.backgroundColor = "transparent")
                              }
                            >
                              <Trash2 size={14} color="#dc2626" /> Delete
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
        </div>
      </div>

      {/* ================= NEW CUSTOMER MODAL ================= */}
      {showNewModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: 16,
          }}
          onClick={() => setShowNewModal(false)}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: 4,
              border: "1px solid #e5e8eb",
              width: "100%",
              maxWidth: 520,
              padding: 28,
              boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#282d31", margin: 0 }}>
                New Customer
              </h2>
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer}>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jessica Moore"
                    value={newForm.name}
                    onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: 2,
                      fontSize: 14,
                      color: "#111827",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="jessica-moore@example.com"
                    value={newForm.email}
                    onChange={(e) => setNewForm({ ...newForm, email: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: 2,
                      fontSize: 14,
                      color: "#111827",
                    }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>
                      Phone
                    </label>
                    <input
                      type="text"
                      placeholder="+1 (555) 000-0000"
                      value={newForm.phone}
                      onChange={(e) => setNewForm({ ...newForm, phone: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        border: "1px solid #d1d5db",
                        borderRadius: 2,
                        fontSize: 14,
                        color: "#111827",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>
                      Country
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Russia, USA, India"
                      value={newForm.country}
                      onChange={(e) => setNewForm({ ...newForm, country: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        border: "1px solid #d1d5db",
                        borderRadius: 2,
                        fontSize: 14,
                        color: "#111827",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>
                    Customer Group
                  </label>
                  <select
                    value={newForm.group}
                    onChange={(e) => setNewForm({ ...newForm, group: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: 2,
                      fontSize: 14,
                      color: "#111827",
                      backgroundColor: "#ffffff",
                    }}
                  >
                    <option value="Default">Default</option>
                    <option value="Wholesaler">Wholesaler</option>
                    <option value="VIP">VIP</option>
                    <option value="Owner">Owner</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>
                    Street Address (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Enter customer shipping address..."
                    value={newForm.address}
                    onChange={(e) => setNewForm({ ...newForm, address: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: 2,
                      fontSize: 14,
                      color: "#111827",
                      resize: "vertical",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 }}>
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="admin-btn-stroyka-default"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingNew}
                  className="admin-btn-stroyka-yellow"
                >
                  {savingNew ? "Creating..." : "Create customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= DELETE CONFIRM MODAL ================= */}
      {customerToDelete && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: 16,
          }}
          onClick={() => setCustomerToDelete(null)}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: 4,
              border: "1px solid #e5e8eb",
              width: "100%",
              maxWidth: 440,
              padding: 24,
              boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 17, fontWeight: 700, color: "#111827", margin: "0 0 10px" }}>
              Delete Customer
            </h2>
            <p style={{ fontSize: 14, color: "#4b5563", margin: "0 0 20px", lineHeight: 1.5 }}>
              Are you sure you want to delete{" "}
              <strong>{customerToDelete.name}</strong> ({customerToDelete.email})?
              This action cannot be undone.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                type="button"
                onClick={() => setCustomerToDelete(null)}
                className="admin-btn-stroyka-default"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => handleDeleteCustomer(customerToDelete.id)}
                style={{
                  padding: "8px 18px",
                  backgroundColor: "#dc2626",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: 2,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
