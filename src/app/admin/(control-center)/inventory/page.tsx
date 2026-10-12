"use client";
import { useLiveAdminRefresh } from "@/components/admin/use-live-admin-refresh";

import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Boxes,
  ArrowUpDown,
  History,
  PlusCircle,
  MinusCircle,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

export default function AdminInventoryPage() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("All Locations");
  const [statusFilter, setStatusFilter] = useState("All");

  // Adjustment Modal
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [adjustQty, setAdjustQty] = useState<number>(10);
  const [adjustReason, setAdjustReason] = useState<string>("RESTOCK");
  const [adjustNotes, setAdjustNotes] = useState("");
  const [adjustLoading, setAdjustLoading] = useState(false);

  async function fetchInventory(silent = false) {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/admin/inventory",{cache:"no-store"});
      const json = await res.json();
      if (json.success) {
        setInventory(json.inventory);
      }
    } catch (err) {
      console.error("Failed to load inventory:", err);
    } finally {
      setLoading(false);
    }
  }

  useLiveAdminRefresh(() => fetchInventory(true));

  useEffect(() => {
    fetchInventory();
  }, []);

  async function handleAdjustSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedItem) return;

    setAdjustLoading(true);
    try {
      const res = await fetch("/api/admin/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku: selectedItem.sku,
          adjustment: adjustReason === "RESTOCK" || adjustReason === "RETURN" || adjustReason === "RELEASE" ? Math.abs(adjustQty) : -Math.abs(adjustQty),
          reason: adjustReason,
          notes: adjustNotes,
        }),
      });

      if (!res.ok) throw new Error("Stock adjustment failed.");

      await fetchInventory();

      setSelectedItem(null);
      setAdjustNotes("");
      alert(`Successfully recorded stock movement for ${selectedItem.sku}!`);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setAdjustLoading(false);
    }
  }

  let filtered = inventory;
  if (search) {
    filtered = filtered.filter(
      (item) =>
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.sku.toLowerCase().includes(search.toLowerCase())
    );
  }
  if (statusFilter !== "All") {
    filtered = filtered.filter((item) => item.status.toLowerCase() === statusFilter.toLowerCase());
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div>
        <h1 className="admin-page-title" style={{ color: "#111111", margin: "0 0 4px" }}>
          Inventory Management
        </h1>
        <p className="admin-meta" style={{ color: "#6B6B6B", margin: 0 }}>
          Real-time warehouse stock tracking, reservations, safety thresholds, and auditable stock movement logs.
        </p>
      </div>

      {/* Filter and Search Bar matching Image 2 Panel 7 */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid #E5E5E5",
          borderRadius: 6,
          padding: "14px 18px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "7px 12px",
            backgroundColor: "#F7F7F5",
            border: "1px solid #E5E5E5",
            borderRadius: 4,
          }}
        >
          <Search size={15} color="#6B6B6B" />
          <input
            type="text"
            placeholder="Search by product name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              border: "none",
              background: "transparent",
              outline: "none",
              fontSize: 13,
              width: "100%",
              color: "#111111",
            }}
          />
        </div>

        <select
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          style={{
            padding: "7px 12px",
            backgroundColor: "#F7F7F5",
            border: "1px solid #E5E5E5",
            borderRadius: 4,
            fontSize: 12,
            color: "#111111",
            outline: "none",
            cursor: "pointer",
          }}
        >
          <option value="All Locations">All Warehouses</option>
          {[...new Set(inventory.map(item=>item.warehouse))].map(warehouse=><option key={warehouse} value={warehouse}>{warehouse}</option>)}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: "7px 12px",
            backgroundColor: "#F7F7F5",
            border: "1px solid #E5E5E5",
            borderRadius: 4,
            fontSize: 12,
            color: "#111111",
            outline: "none",
            cursor: "pointer",
          }}
        >
          <option value="All">All Status</option>
          <option value="In Stock">In Stock</option>
          <option value="Low Stock">Low Stock</option>
          <option value="Out of Stock">Out of Stock</option>
        </select>
      </div>

      {/* Inventory Table matching Image 2 Panel 7 */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid #E5E5E5",
          borderRadius: 6,
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ backgroundColor: "#FAFAF9", borderBottom: "1px solid #E5E5E5", color: "#6B6B6B", textAlign: "left" }}>
              <th style={{ padding: "12px 18px", fontWeight: 500 }}>Product</th>
              <th style={{ padding: "12px 18px", fontWeight: 500 }}>SKU</th>
              <th style={{ padding: "12px 18px", fontWeight: 500 }}>Total Stock</th>
              <th style={{ padding: "12px 18px", fontWeight: 500 }}>Reserved</th>
              <th style={{ padding: "12px 18px", fontWeight: 500 }}>Available</th>
              <th style={{ padding: "12px 18px", fontWeight: 500 }}>Status</th>
              <th style={{ padding: "12px 18px", fontWeight: 500, textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ padding: 40, textAlign: "center", color: "#6B6B6B" }}>
                  <RefreshCw size={20} className="animate-spin" style={{ display: "inline", marginRight: 8 }} />
                  Updating inventory figures...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: 40, textAlign: "center", color: "#6B6B6B" }}>
                  No inventory records match filter.
                </td>
              </tr>
            ) : (
              filtered.map((item) => {
                const statusColor =
                  item.status === "In Stock" ? "#16A34A" : item.status === "Low Stock" ? "#D97706" : "#EF4444";
                const statusBg =
                  item.status === "In Stock" ? "#E7F7ED" : item.status === "Low Stock" ? "#FEF3C7" : "#FEE2E2";

                return (
                  <tr
                    key={item.id}
                    style={{
                      borderBottom: "1px solid #F0F0F0",
                      transition: "background 0.1s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#FAFAF9")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#FFFFFF")}
                  >
                    <td style={{ padding: "14px 18px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <></>
                        <div>
                          <div style={{ fontWeight: 600, color: "#111111" }}>{item.name}</div>
                          <div style={{ fontSize: 11, color: "#9CA3AF" }}>{item.warehouse}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "14px 18px", color: "#6B6B6B", fontFamily: "monospace", fontSize: 12 }}>
                      {item.sku}
                    </td>
                    <td style={{ padding: "14px 18px", fontWeight: 600, color: item.totalStock <= 15 ? "#EF4444" : "#111111" }}>
                      {item.totalStock}
                    </td>
                    <td style={{ padding: "14px 18px", color: "#6B6B6B" }}>
                      {item.reserved}
                    </td>
                    <td style={{ padding: "14px 18px", fontWeight: 600, color: "#111111" }}>
                      {item.available}
                    </td>
                    <td style={{ padding: "14px 18px" }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: "3px 9px",
                          borderRadius: 12,
                          backgroundColor: statusBg,
                          color: statusColor,
                        }}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td style={{ padding: "14px 18px", textAlign: "right" }}>
                      <button
                        onClick={() => setSelectedItem(item)}
                        style={{
                          padding: "5px 12px",
                          borderRadius: 4,
                          border: "1px solid #E5E5E5",
                          backgroundColor: "#F7F7F5",
                          color: "#111111",
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Adjust Stock
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Stock Adjustment Modal */}
      {selectedItem && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          }}
        >
          <div
            style={{
              width: 440,
              backgroundColor: "#FFFFFF",
              borderRadius: 6,
              padding: "24px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "#111111", margin: "0 0 6px" }}>
              Adjust Inventory Stock
            </h2>
            <p style={{ fontSize: 12, color: "#6B6B6B", margin: "0 0 16px" }}>
              {selectedItem.name} ({selectedItem.sku})
            </p>

            <form onSubmit={handleAdjustSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#374151", marginBottom: 6 }}>
                  Adjustment Type
                </label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #E5E5E5", borderRadius: 4, outline: "none", fontSize: 13 }}
                >
                  <option value="RESTOCK">RESTOCK (+ incoming batch)</option>
                  <option value="MANUAL_ADJUSTMENT">MANUAL_ADJUSTMENT (- audit deduction)</option>
                  <option value="RETURN">RETURN (+ returned item restocked)</option>
                  <option value="CANCELLATION">CANCELLATION (+ cancelled order)</option>
                  <option value="RESERVATION">RESERVATION (- locked for VIP)</option>
                  <option value="RELEASE">RELEASE (+ release lock)</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#374151", marginBottom: 6 }}>
                  Quantity Units
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Number(e.target.value))}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #E5E5E5", borderRadius: 4, outline: "none", fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#374151", marginBottom: 6 }}>
                  Audit Reason / Reference
                </label>
                <input
                  type="text"
                  placeholder="e.g. Supplier delivery batch #904"
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #E5E5E5", borderRadius: 4, outline: "none", fontSize: 13 }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#F7F7F5",
                    border: "1px solid #E5E5E5",
                    borderRadius: 4,
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjustLoading}
                  style={{
                    padding: "8px 18px",
                    backgroundColor: "#111111",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {adjustLoading ? "Applying..." : "Commit Stock Adjustment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
