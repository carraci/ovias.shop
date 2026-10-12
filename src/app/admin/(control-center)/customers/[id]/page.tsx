"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  RefreshCw,
  Edit2,
  Trash2,
  MoreVertical,
  X,
} from "lucide-react";

export default function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Note editing state
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  // Edit Customer Modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    emailMarketing: "Subscribed",
    avatar: "",
    status: "Active",
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Add Address Modal state
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressForm, setAddressForm] = useState({
    name: "",
    address: "",
  });
  const [savingAddress, setSavingAddress] = useState(false);

  // Active address menu
  const [activeAddressMenu, setActiveAddressMenu] = useState<string | null>(null);

  // Delete Customer confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Show all orders toggle
  const [showAllOrders, setShowAllOrders] = useState(false);

  async function loadCustomer() {
    try {
      const res = await fetch(`/api/admin/customers/${id}`, { cache: "no-store" });
      const json = await res.json();
      if (json.success && json.customer) {
        setCustomer(json.customer);
        setNoteText(json.customer.latestNote || "");
        setEditForm({
          name: json.customer.name || "",
          phone: json.customer.phone || "",
          emailMarketing: json.customer.emailMarketing || "Subscribed",
          avatar: json.customer.avatar || "",
          status: json.customer.status || "Active",
        });
        setAddressForm({
          name: json.customer.name || "",
          address: "",
        });
      }
    } catch (err) {
      console.error("Failed to load customer profile:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomer();
  }, [id]);

  // Handle saving customer note
  async function handleSaveNote() {
    setSavingNote(true);
    try {
      const res = await fetch(`/api/admin/customers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: noteText }),
      });
      if (res.ok) {
        setIsEditingNote(false);
        await loadCustomer();
      }
    } catch (err) {
      console.error("Failed to save note:", err);
    } finally {
      setSavingNote(false);
    }
  }

  // Handle saving customer profile edit
  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetch(`/api/admin/customers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        setShowEditModal(false);
        await loadCustomer();
      }
    } catch (err) {
      console.error("Failed to update customer:", err);
    } finally {
      setSavingProfile(false);
    }
  }

  // Handle adding new address
  async function handleAddAddress(e: React.FormEvent) {
    e.preventDefault();
    if (!addressForm.address.trim()) return;
    setSavingAddress(true);
    try {
      const res = await fetch(`/api/admin/customers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newAddress: {
            name: addressForm.name.trim() || customer.name,
            address: addressForm.address.trim(),
          },
        }),
      });
      if (res.ok) {
        setShowAddressModal(false);
        setAddressForm({
          name: customer.name || "",
          address: "",
        });
        await loadCustomer();
      }
    } catch (err) {
      console.error("Failed to add address:", err);
    } finally {
      setSavingAddress(false);
    }
  }

  // Handle deleting an address
  async function handleDeleteAddress(addressId: string) {
    try {
      const res = await fetch(`/api/admin/customers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deleteAddressId: addressId }),
      });
      if (res.ok) {
        setActiveAddressMenu(null);
        await loadCustomer();
      }
    } catch (err) {
      console.error("Failed to delete address:", err);
    }
  }

  // Handle deleting customer
  async function handleDeleteCustomer() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/customers/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/admin/customers");
      }
    } catch (err) {
      console.error("Failed to delete customer:", err);
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: "center", color: "#6b7280" }}>
        <RefreshCw size={24} className="animate-spin" style={{ display: "inline", marginBottom: 12 }} />
        <div style={{ fontSize: 14 }}>Retrieving customer profile...</div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div style={{ padding: 60, textAlign: "center", color: "#6b7280" }}>
        <h3>Customer profile not found</h3>
        <Link href="/admin/customers" style={{ color: "#3677f5", marginTop: 8, display: "inline-block" }}>
          &larr; Back to all customers
        </Link>
      </div>
    );
  }

  const allOrdersList = customer.orders || [];
  const displayedOrders = showAllOrders
    ? allOrdersList
    : allOrdersList.slice(0, 4);

  return (
    <div style={{ paddingBottom: 60 }}>
      {/* 1. Breadcrumb matching Screenshot 2: Dashboard / Customers / Jessica Moore */}
      <nav className="admin-breadcrumb">
        <Link href="/admin">Dashboard</Link>
        <span className="sep">/</span>
        <Link href="/admin/customers">Customers</Link>
        <span className="sep">/</span>
        <span className="current">{customer.name}</span>
      </nav>

      {/* 2. Top Header Row: Customer Name on left, Delete and Yellow Edit buttons on right */}
      <div className="admin-page-header">
        <h1 className="admin-page-title">{customer.name}</h1>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="admin-btn-stroyka-default"
          >
            Delete
          </button>
        </div>
      </div>

      {/* 3. Main 2-Column Grid matching Screenshot 2 */}
      <div className="admin-customer-detail-grid">
        {/* ================= LEFT COLUMN: Customer Profile Card ================= */}
        <div className="admin-card-base">
          {/* Circular Avatar */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: "50%",
                overflow: "hidden",
                border: "2px solid #e5e8eb",
                position: "relative",
                backgroundColor: "#f3f4f6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {customer.avatar ? (
                <img
                  src={customer.avatar}
                  alt={customer.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <div
                  style={{
                    fontSize: 34,
                    fontWeight: 600,
                    color: "#4b5563",
                    textTransform: "uppercase",
                  }}
                >
                  {customer.name?.charAt(0) || "U"}
                </div>
              )}
            </div>
          </div>

          {/* Name, Email, Phone */}
          <h2
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#282d31",
              margin: "0 0 4px",
              textAlign: "center",
            }}
          >
            {customer.name}
          </h2>
          <a
            href={`mailto:${customer.email}`}
            style={{
              fontSize: 13,
              color: "#3677f5",
              textAlign: "center",
              display: "block",
              textDecoration: "none",
              marginBottom: 4,
            }}
          >
            {customer.email}
          </a>
          <div
            style={{
              fontSize: 13,
              color: "#74818c",
              textAlign: "center",
              marginBottom: 20,
            }}
          >
            {customer.phone || "+1 (555) 000-0000"}
          </div>

          {/* Horizontal Divider */}
          <hr className="admin-card-divider" />

          {/* Key Attributes List matching Screenshot 2 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Last Order */}
            <div>
              <div style={{ fontSize: 13, color: "#74818c", marginBottom: 2 }}>
                Last Order
              </div>
              <div style={{ fontSize: 14, color: "#282d31" }}>
                {customer.lastOrder ? (
                  <>
                    {customer.lastOrder.relative || "Recent"} –{" "}
                    <Link
                      href={`/admin/orders/${customer.lastOrder.id.replace("#", "")}`}
                      style={{ color: "#3677f5", textDecoration: "none", fontWeight: 500 }}
                    >
                      {customer.lastOrder.id.startsWith("#")
                        ? customer.lastOrder.id
                        : `#${customer.lastOrder.id}`}
                    </Link>
                  </>
                ) : (
                  "No orders yet"
                )}
              </div>
            </div>

            {/* Average Order Value */}
            <div>
              <div style={{ fontSize: 13, color: "#74818c", marginBottom: 2 }}>
                Average Order Value
              </div>
              <div style={{ fontSize: 14, color: "#282d31", fontWeight: 500 }}>
                ${(customer.averageOrderValue || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            {/* Registered */}
            <div>
              <div style={{ fontSize: 13, color: "#74818c", marginBottom: 2 }}>
                Registered
              </div>
              <div style={{ fontSize: 14, color: "#282d31" }}>
                {customer.registered || customer.joined || "2 months ago"}
              </div>
            </div>

            {/* Email Marketing */}
            <div>
              <div style={{ fontSize: 13, color: "#74818c", marginBottom: 2 }}>
                Email Marketing
              </div>
              <div style={{ fontSize: 14, color: "#282d31" }}>
                {customer.emailMarketing || "Subscribed"}
              </div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: 3 Stacked Cards matching Screenshot 2 ================= */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Card 1: Notes about customer */}
          <div className="admin-card-base">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: isEditingNote ? 12 : 8,
              }}
            >
              <div style={{ fontSize: 14, color: "#74818c", fontWeight: 500 }}>
                Notes about customer
              </div>
              <button
                type="button"
                onClick={() => setIsEditingNote(!isEditingNote)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#9ca3af",
                  cursor: "pointer",
                  padding: 4,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                title="Edit note"
              >
                <Edit2 size={16} />
              </button>
            </div>

            {isEditingNote ? (
              <div>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Enter notes about this customer..."
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: 2,
                    fontSize: 13,
                    color: "#282d31",
                    fontFamily: "inherit",
                    resize: "vertical",
                  }}
                />
                <div style={{ display: "flex", gap: 8, marginTop: 10, justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    onClick={() => setIsEditingNote(false)}
                    className="admin-btn-stroyka-default"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveNote}
                    disabled={savingNote}
                    className="admin-btn-stroyka-yellow"
                  >
                    {savingNote ? "Saving..." : "Save Note"}
                  </button>
                </div>
              </div>
            ) : (
              <div
                style={{
                  fontSize: 14,
                  color: noteText ? "#282d31" : "#9ca3af",
                  lineHeight: 1.5,
                  minHeight: 24,
                  whiteSpace: "pre-wrap",
                }}
              >
                {noteText || "No notes about this customer yet."}
              </div>
            )}
          </div>

          {/* Card 2: Orders matching Screenshot 2 */}
          <div className="admin-card-base">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#282d31", margin: 0 }}>
                Orders
              </h2>
              <div style={{ fontSize: 13, color: "#74818c" }}>
                Total spent ${customer.totalSpent.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} on{" "}
                {customer.ordersCount || allOrdersList.length} orders
              </div>
            </div>

            {allOrdersList.length > 0 ? (
              <div>
                <table className="admin-customer-orders-table">
                  <tbody>
                    {displayedOrders.map((o: any, idx: number) => {
                      const orderIdStr = o.id.startsWith("#") ? o.id : `#${o.id}`;
                      return (
                        <tr key={idx}>
                          {/* Order link in blue */}
                          <td style={{ fontWeight: 500 }}>
                            <Link
                              href={`/admin/orders/${o.id.replace("#", "")}`}
                              style={{ color: "#3677f5", textDecoration: "none" }}
                            >
                              {orderIdStr}
                            </Link>
                          </td>
                          {/* Date */}
                          <td style={{ color: "#74818c" }}>
                            {o.date}
                          </td>
                          {/* Status */}
                          <td style={{ color: "#282d31" }}>
                            {o.status}
                          </td>
                          {/* Items count */}
                          <td style={{ color: "#282d31" }}>
                            {o.items} items
                          </td>
                          {/* Amount */}
                          <td>
                            ${(o.rawAmount || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || o.amount}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Footer link: View all orders */}
                {allOrdersList.length > 0 && (
                  <div style={{ textAlign: "center", marginTop: 18, paddingTop: 10 }}>
                    <button
                      type="button"
                      onClick={() => setShowAllOrders(!showAllOrders)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#3677f5",
                        fontSize: 14,
                        fontWeight: 500,
                        cursor: "pointer",
                      }}
                    >
                      {showAllOrders
                        ? "Show fewer orders"
                        : `View all ${allOrdersList.length} orders`}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: "24px 0", textAlign: "center", color: "#9ca3af", fontSize: 14 }}>
                No order records available for this customer.
              </div>
            )}
          </div>

          {/* Card 3: Addresses matching Screenshot 2 */}
          <div className="admin-card-base">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#282d31", margin: 0 }}>
                Addresses
              </h2>
              <button
                type="button"
                onClick={() => setShowAddressModal(true)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#3677f5",
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                New address
              </button>
            </div>

            {customer.addresses && customer.addresses.length > 0 ? (
              <div>
                {customer.addresses.map((addr: any, idx: number) => {
                  const isMenuOpen = activeAddressMenu === addr.id;
                  return (
                    <div
                      key={addr.id || idx}
                      className="admin-customer-address-item"
                    >
                      <div>
                        <div className="admin-address-name">
                          {addr.name || customer.name}
                        </div>
                        <div className="admin-address-line">
                          {addr.address}
                        </div>
                      </div>

                      <div style={{ position: "relative" }}>
                        <button
                          type="button"
                          className="admin-customer-action-btn"
                          aria-label={`Options for address`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveAddressMenu(isMenuOpen ? null : addr.id);
                          }}
                        >
                          <MoreVertical size={16} />
                        </button>

                        {isMenuOpen && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              position: "absolute",
                              right: 0,
                              top: 28,
                              backgroundColor: "#ffffff",
                              border: "1px solid #e5e8eb",
                              borderRadius: 4,
                              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                              zIndex: 20,
                              minWidth: 120,
                              padding: "4px 0",
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => handleDeleteAddress(addr.id)}
                              style={{
                                width: "100%",
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "8px 12px",
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
                              <Trash2 size={13} color="#dc2626" /> Remove
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: "16px 0", textAlign: "center", color: "#9ca3af", fontSize: 14 }}>
                No addresses recorded yet. Click "New address" to add one.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================= EDIT CUSTOMER MODAL ================= */}
      {showEditModal && (
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
          onClick={() => setShowEditModal(false)}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: 4,
              border: "1px solid #e5e8eb",
              width: "100%",
              maxWidth: 480,
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
                Edit Customer
              </h2>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile}>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
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
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
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
                    Email Marketing
                  </label>
                  <select
                    value={editForm.emailMarketing}
                    onChange={(e) => setEditForm({ ...editForm, emailMarketing: e.target.value })}
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
                    <option value="Subscribed">Subscribed</option>
                    <option value="Unsubscribed">Unsubscribed</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>
                    Avatar Image URL
                  </label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={editForm.avatar}
                    onChange={(e) => setEditForm({ ...editForm, avatar: e.target.value })}
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

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 }}>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="admin-btn-stroyka-default"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="admin-btn-stroyka-yellow"
                >
                  {savingProfile ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= ADD ADDRESS MODAL ================= */}
      {showAddressModal && (
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
          onClick={() => setShowAddressModal(false)}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: 4,
              border: "1px solid #e5e8eb",
              width: "100%",
              maxWidth: 480,
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
                Add New Address
              </h2>
              <button
                type="button"
                onClick={() => setShowAddressModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddAddress}>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>
                    Recipient Name
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.name}
                    onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
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
                    Full Address Line
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="e.g. Random Federation 115302, Moscow ul. Varshavskaya, 15-2-178"
                    value={addressForm.address}
                    onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
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
                  onClick={() => setShowAddressModal(false)}
                  className="admin-btn-stroyka-default"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAddress}
                  className="admin-btn-stroyka-yellow"
                >
                  {savingAddress ? "Adding..." : "Add address"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= DELETE CONFIRM MODAL ================= */}
      {showDeleteConfirm && (
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
          onClick={() => setShowDeleteConfirm(false)}
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
              Delete Customer Profile
            </h2>
            <p style={{ fontSize: 14, color: "#4b5563", margin: "0 0 20px", lineHeight: 1.5 }}>
              Are you sure you want to permanently delete <strong>{customer.name}</strong>?
              This customer and their records will be removed.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="admin-btn-stroyka-default"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteCustomer}
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
