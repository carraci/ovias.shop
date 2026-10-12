"use client";
import { useLiveAdminRefresh } from "@/components/admin/use-live-admin-refresh";

import Link from "next/link";
import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  FolderTree,
  Edit,
  Trash2,
  RefreshCw,
  Folder,
  ArrowRight,
} from "lucide-react";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editCat, setEditCat] = useState<any | null>(null);
  const [newCatName, setNewCatName] = useState("");
  const [newCatParent, setNewCatParent] = useState("None");

  async function fetchCategories(silent = false) {
    try {
      const res = await fetch("/api/admin/categories", {cache:"no-store"});
      const json = await res.json();
      if (json.success) {
        setCategories(json.categories);
      }
    } catch (err) {
      console.error("Failed to load categories:", err);
    } finally {
      setLoading(false);
    }
  }

  useLiveAdminRefresh(() => fetchCategories(true));

  useEffect(() => {
    fetchCategories();
  }, []);

  function notifyCategoryUpdate() {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("ovia_category_updated"));
      try {
        localStorage.setItem("ovia_category_updated", Date.now().toString());
      } catch {}
    }
  }

  async function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCatName.trim(),
          parent: newCatParent === "None" ? null : newCatParent,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setCategories([...categories, json.category]);
        setShowModal(false);
        setNewCatName("");
        notifyCategoryUpdate();
      }
    } catch (err) {
      alert("Failed to create category.");
    }
  }

  async function handleDelete(cat: any) {
    if (cat.productCount > 0) {
      alert(
        `Cannot delete category "${cat.name}". It currently contains ${cat.productCount} products. Please reassign products to another category before deleting.`
      );
      return;
    }
    if (!confirm(`Delete category "${cat.name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/categories/${cat.id}`, { method: "DELETE" });
      if (res.ok) {
        setCategories((prev) => prev.filter((c) => c.id !== cat.id));
        notifyCategoryUpdate();
      } else {
        alert("Failed to delete category.");
      }
    } catch {
      alert("Network error deleting category.");
    }
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editCat) return;
    try {
      const res = await fetch(`/api/admin/categories/${editCat.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editCat.name,
          parent: editCat.parent === "None" ? null : editCat.parent,
          status: editCat.status,
        }),
      });
      if (res.ok) {
        setCategories((prev) =>
          prev.map((c) => (c.id === editCat.id ? { ...c, ...editCat, parent: editCat.parent === "None" ? null : editCat.parent } : c))
        );
        setEditCat(null);
        notifyCategoryUpdate();
      } else {
        alert("Failed to update category.");
      }
    } catch {
      alert("Network error updating category.");
    }
  }

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="admin-categories-list" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <small><Link href="/admin">Dashboard</Link> / Categories</small>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: "#111111", margin: "0 0 4px" }}>
            Categories
          </h1>
          <p style={{ fontSize: 13, color: "#6B6B6B", margin: 0 }}>
            Organize collections, nested luggage suites, and navigation hierarchies.
          </p>
        </div>
      </div>

      {/* Search Bar */}
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
            placeholder="Search categories..."
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
      </div>

      {/* Categories Table matching Image 2 Panel 6 */}
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
              <th style={{ padding: "12px 18px", fontWeight: 500 }}>Name</th>
              <th style={{ padding: "12px 18px", fontWeight: 500 }}>Image</th>
              <th style={{ padding: "12px 18px", fontWeight: 500 }}>Parent Category</th>
              <th style={{ padding: "12px 18px", fontWeight: 500 }}>Products</th>
              <th style={{ padding: "12px 18px", fontWeight: 500 }}>Status</th>
              <th style={{ padding: "12px 18px", fontWeight: 500, textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: 40, textAlign: "center", color: "#6B6B6B" }}>
                  <RefreshCw size={20} className="animate-spin" style={{ display: "inline", marginRight: 8 }} />
                  Loading categories...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 40, textAlign: "center", color: "#6B6B6B" }}>
                  No categories found.
                </td>
              </tr>
            ) : (
              filtered.map((cat) => (
                <tr
                  key={cat.id}
                  style={{
                    borderBottom: "1px solid #F0F0F0",
                    transition: "background 0.1s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#FAFAF9")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#FFFFFF")}
                >
                  <td style={{ padding: "14px 18px", fontWeight: 600, color: "#111111" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Folder size={15} color="#8E693E" />
                      <span>{cat.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: "14px 18px" }}>
                    {cat.image ? <img
                      src={cat.image}
                      alt={cat.name}
                      style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 4, backgroundColor: "#F7F7F5", border: "1px solid #E5E7EB" }}
                    /> : <span style={{color:"#9CA3AF"}}>—</span>}
                  </td>
                  <td style={{ padding: "14px 18px", color: cat.parent ? "#374151" : "#9CA3AF" }}>
                    {cat.parent || "—"}
                  </td>
                  <td style={{ padding: "14px 18px", fontWeight: 600, color: "#111111" }}>
                    {cat.productCount}
                  </td>
                  <td style={{ padding: "14px 18px" }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "3px 9px",
                        borderRadius: 12,
                        backgroundColor: "#E7F7ED",
                        color: "#16A34A",
                      }}
                    >
                      {cat.status}
                    </span>
                  </td>
                  <td style={{ padding: "14px 18px", textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: 10 }}>
                      <button
                        onClick={() => {window.location.href=`/admin/categories/${encodeURIComponent(cat.id)}/edit`;}}
                        style={{ background: "none", border: "none", color: "#2563EB", cursor: "pointer", fontSize: 12, fontWeight: 500 }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(cat)}
                        style={{ background: "none", border: "none", color: "#DC2626", cursor: "pointer", fontSize: 12 }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Category Modal */}
      {showModal && (
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
              width: 420,
              backgroundColor: "#FFFFFF",
              borderRadius: 6,
              padding: "24px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "#111111", margin: "0 0 16px" }}>
              Add New Category
            </h2>

            <form onSubmit={handleCreateCategory} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#374151", marginBottom: 6 }}>
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Leather Briefcases"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #E5E5E5", borderRadius: 4, outline: "none", fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#374151", marginBottom: 6 }}>
                  Parent Category
                </label>
                <select
                  value={newCatParent}
                  onChange={(e) => setNewCatParent(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #E5E5E5", borderRadius: 4, outline: "none", fontSize: 13 }}
                >
                  <option value="None">None (Root Category)</option>
                  <option value="Luggage">Luggage</option>
                  <option value="Bags">Bags</option>
                  <option value="Accessories">Accessories</option>
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {editCat && (
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
              width: 420,
              backgroundColor: "#FFFFFF",
              borderRadius: 6,
              padding: "24px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "#111111", margin: "0 0 16px" }}>
              Edit Category
            </h2>

            <form onSubmit={handleSaveEdit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#374151", marginBottom: 6 }}>
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={editCat.name}
                  onChange={(e) => setEditCat({ ...editCat, name: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #E5E5E5", borderRadius: 4, outline: "none", fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#374151", marginBottom: 6 }}>
                  Parent Category
                </label>
                <select
                  value={editCat.parent || "None"}
                  onChange={(e) => setEditCat({ ...editCat, parent: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #E5E5E5", borderRadius: 4, outline: "none", fontSize: 13 }}
                >
                  <option value="None">None (Root Category)</option>
                  <option value="Luggage">Luggage</option>
                  <option value="Bags">Bags</option>
                  <option value="Accessories">Accessories</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#374151", marginBottom: 6 }}>
                  Status
                </label>
                <select
                  value={editCat.status || "Active"}
                  onChange={(e) => setEditCat({ ...editCat, status: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #E5E5E5", borderRadius: 4, outline: "none", fontSize: 13 }}
                >
                  <option value="Active">Active</option>
                  <option value="In Stock">In Stock</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setEditCat(null)}
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
                  style={{
                    padding: "8px 18px",
                    backgroundColor: "#8E693E",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
