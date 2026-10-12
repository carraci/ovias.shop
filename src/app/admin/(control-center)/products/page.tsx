"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./products.module.css";
import { ProductImport } from "@/components/admin/product-import";
import { Search, Plus, Edit, Trash2, RefreshCw, Download } from "lucide-react";

export default function AdminProductsPage() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [status, setStatus] = useState("All Status");

  const [collection, setCollection] = useState("");
  const [minPrice, setMinPrice] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState("All");
  const [maxPrice, setMaxPrice] = useState("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [dbCategories, setDbCategories] = useState<string[]>([]);

  const categories = Array.from(
    new Set(
      products
        .map((p) => p.category?.trim())
        .filter((cat): cat is string => Boolean(cat) && !/^(1+|a+|abcd|test|demo)$/i.test(cat))
    )
  ).sort((a, b) => a.localeCompare(b));
  const collections = Array.from(
    new Set(products.map((p) => p.collection).filter(Boolean)),
  ).sort();
  const brands = Array.from(
    new Set(
      products
        .map((product) => product.brand?.trim())
        .filter((b): b is string => Boolean(b) && !/^(1+|a+|abcd|test|demo)$/i.test(b))
    ),
  ).sort((a, b) => a.localeCompare(b));
  const priceCeiling = Math.max(
    1,
    ...products.map((product) => Number(product.price) || 0),
  );
  const filtered = products.filter(
    (p) =>
      (!search ||
        [p.name, p.sku, p.category, p.brand, p.collection].some((v) =>
          String(v || "")
            .toLowerCase()
            .includes(search.toLowerCase()),
        )) &&
      (category === "All Categories" || p.category === category) &&
      (status === "All Status" || p.status === status) &&
      (!collection || p.collection === collection) &&
      (!maxPrice || Number(p.price) <= Number(maxPrice)) &&
      Number(p.price) >= minPrice &&
      (!selectedCategories.length || selectedCategories.includes(p.category)) &&
      (!selectedBrands.length || selectedBrands.includes(p.brand)) &&
      (typeFilter === "All" ||
        (typeFilter === "Digital"
          ? p.productType === "Digital Product"
          : typeFilter === "Variable"
            ? p.variantCount > 1
            : p.productType !== "Digital Product" && !(p.variantCount > 1))),
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / 10));
  const currentPage = Math.min(page, pageCount);
  const displayed = filtered.slice((currentPage - 1) * 10, currentPage * 10);
  async function fetchProducts() {
    setLoading(true);
    try {
      const [res, catRes] = await Promise.all([
        fetch("/api/admin/products", { cache: "no-store" }),
        fetch("/api/admin/categories", { cache: "no-store" }).catch(() => null),
      ]);
      const json = await res.json();
      if (json.success) {
        setProducts(json.products);
        setError("");
      } else {
        setError(json.error || "Unable to load catalog");
      }
      if (catRes) {
        const catJson = await catRes.json().catch(() => null);
        if (catJson?.success && Array.isArray(catJson.categories)) {
          setDbCategories(
            catJson.categories.map((c: any) => c.name).filter(Boolean)
          );
        }
      }
    } catch (err) {
      if (err instanceof Error && (err.name === "AbortError" || err.message.toLowerCase().includes("abort"))) {
        return;
      }
      setError("Unable to load catalog. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchProducts();
    const timer = setInterval(fetchProducts, 4000);
    const handleUpdate = () => void fetchProducts();
    window.addEventListener("ovia_category_updated", handleUpdate);
    window.addEventListener("storage", (e) => {
      if (e.key === "ovia_category_updated") void fetchProducts();
    });
    return () => {
      clearInterval(timer);
      window.removeEventListener("ovia_category_updated", handleUpdate);
    };
  }, []);
  useEffect(() => setPage(1), [search, category, status, collection]);

  async function handleDelete(id: string, name: string) {
    if (
      !confirm(
        `Are you sure you want to permanently delete "${name}"? This action is recorded in the shop owner audit log.`,
      )
    ) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (err) {
      alert("Failed to delete product.");
    }
  }

  function generateProductsCSV() {
    const headers = [
      "Product ID",
      "SKU",
      "Product Name",
      "Category",
      "Subcategory",
      "Brand / Collection",
      "Price (INR)",
      "MRP (INR)",
      "Stock (Units)",
      "Status",
      "Color Variants",
      "Slug / Link",
    ];

    const escapeCSV = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = (
      selectedIds.length
        ? products.filter((product) => selectedIds.includes(product.id))
        : products
    ).map((p) => {
      const colors =
        (p.variants || [])
          .map((v: any) => v.color)
          .filter(Boolean)
          .join("; ") || "Standard";
      return [
        escapeCSV(p.id),
        escapeCSV(p.sku),
        escapeCSV(p.name),
        escapeCSV(p.category),
        escapeCSV(p.subcategory || ""),
        escapeCSV(p.brand || "OVIA"),
        escapeCSV(p.price),
        escapeCSV(p.mrp ?? ""),
        escapeCSV(p.stock),
        escapeCSV(p.status || "Active"),
        escapeCSV(colors),
        escapeCSV(`https://ovias.shop/products/${p.slug}`),
      ];
    });

    return (
      "\uFEFF" +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n")
    );
  }

  function handleExportCSV() {
    if (!products || products.length === 0) {
      alert("No products available to export.");
      return;
    }
    const csvContent = generateProductsCSV();
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const filename = `OVIA_Products_Catalog_${new Date().toISOString().split("T")[0]}.csv`;

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <small>
            <Link href="/admin">Dashboard</Link> / Products
          </small>
          <h1>Products</h1>
          <p>Manage your product catalog ({products.length} products)</p>
        </div>
        <div className={styles.actions}>
          <ProductImport onComplete={() => void fetchProducts()} />
          <button onClick={handleExportCSV}>
            <Download size={14} /> Export CSV
          </button>
          <Link href="/admin/products/new">
            <Plus size={16} /> New product
          </Link>
        </div>
      </header>
      <div className="admin-catalog-workspace">
        <aside className="admin-catalog-filters">
          <h2>Filters</h2>
          <label>
            Price range (₹)
            <input
              type="range"
              aria-label="Minimum price"
              min="0"
              max={priceCeiling}
              value={minPrice}
              onChange={(event) => {
                setMinPrice(Number(event.target.value));
                setPage(1);
              }}
            />
            <input
              type="range"
              aria-label="Maximum price slider"
              min="0"
              max={priceCeiling}
              value={maxPrice || priceCeiling}
              onChange={(event) => {
                setMaxPrice(event.target.value);
                setPage(1);
              }}
            />
            <small>
              ₹{minPrice.toLocaleString("en-IN")} – ₹
              {Number(maxPrice || priceCeiling).toLocaleString("en-IN")}
            </small>
            Maximum price
            <input
              aria-label="Maximum price"
              type="number"
              min="0"
              placeholder="Any price"
              value={maxPrice}
              onChange={(event) => {
                setMaxPrice(event.target.value);
                setPage(1);
              }}
            />
          </label>
          <div className="admin-reference-filter-group">
            <h3>Categories</h3>
            {categories.map((value) => (
              <label className="admin-filter-check" key={value}>
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(value)}
                  onChange={(event) => {
                    setSelectedCategories((previous) =>
                      event.target.checked
                        ? [...previous, value]
                        : previous.filter((item) => item !== value),
                    );
                    setPage(1);
                  }}
                />
                {value}
              </label>
            ))}
          </div>
          <div className="admin-reference-filter-group">
            <h3>Product type</h3>
            {["All", "Simple", "Variable", "Digital"].map((value) => (
              <label className="admin-filter-check" key={value}>
                <input
                  type="radio"
                  name="product-type-filter"
                  checked={typeFilter === value}
                  onChange={() => {
                    setTypeFilter(value);
                    setPage(1);
                  }}
                />
                {value}
              </label>
            ))}
          </div>
          {brands.length > 0 && (
            <div className="admin-reference-filter-group">
              <h3>Brands</h3>
              {brands.map((value) => (
                <label className="admin-filter-check" key={value}>
                  <input
                    type="checkbox"
                    checked={selectedBrands.includes(value)}
                    onChange={(event) => {
                      setSelectedBrands((previous) =>
                        event.target.checked
                          ? [...previous, value]
                          : previous.filter((item) => item !== value),
                      );
                      setPage(1);
                    }}
                  />
                  {value}
                </label>
              ))}
            </div>
          )}
          <label>
            Visibility
            <select
              aria-label="Status filter"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
            >
              {["All Status", "Active", "Draft", "Archived"].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <label>
            Collections
            <select
              aria-label="Collection filter"
              value={collection}
              onChange={(event) => {
                setCollection(event.target.value);
                setPage(1);
              }}
            >
              <option value="">All Collections</option>
              {collections.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <button
            onClick={() => {
              setCategory("All Categories");
              setStatus("All Status");
              setCollection("");
              setMaxPrice("");
              setMinPrice(0);
              setSelectedCategories([]);
              setSelectedBrands([]);
              setTypeFilter("All");
              setSearch("");
            }}
          >
            Clear filters
          </button>
        </aside>
        <div className="admin-catalog-results">
          <div className={styles.filters}>
            <label className={styles.search}>
              <Search size={16} />
              <input
                aria-label="Search products"
                placeholder="Search by name, SKU, category…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <button aria-label="Refresh catalog" onClick={fetchProducts}>
              <RefreshCw size={16} />
            </button>
          </div>
          {error && <p role="alert">{error}</p>}
          <div className={styles.table}>
            <table>
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      aria-label="Select all displayed products"
                      checked={
                        displayed.length > 0 &&
                        displayed.every((product) =>
                          selectedIds.includes(product.id),
                        )
                      }
                      onChange={(event) =>
                        setSelectedIds((previous) =>
                          event.target.checked
                            ? Array.from(
                                new Set([
                                  ...previous,
                                  ...displayed.map((product) => product.id),
                                ]),
                              )
                            : previous.filter(
                                (id) =>
                                  !displayed.some(
                                    (product) => product.id === id,
                                  ),
                              ),
                        )
                      }
                    />
                  </th>
                  {[
                    "Product",
                    "Category",
                    "Stock",
                    "Price",
                    "Status",
                    "Actions",
                  ].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayed.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <input
                        type="checkbox"
                        aria-label={`Select ${p.name}`}
                        checked={selectedIds.includes(p.id)}
                        onChange={(event) =>
                          setSelectedIds((previous) =>
                            event.target.checked
                              ? [...previous, p.id]
                              : previous.filter((id) => id !== p.id),
                          )
                        }
                      />
                    </td>
                    <td>
                      <div className="admin-catalog-product">
                        {p.image ? (
                          <img src={p.image} alt="" />
                        ) : (
                          <span>No image</span>
                        )}
                        <div>
                          <Link
                            href={`/admin/products/${p.id}/edit`}
                            className={styles.name}
                          >
                            {p.name}
                          </Link>
                          <small>
                            ID: {p.id} · SKU: {p.sku || "Not recorded"}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td>{p.category || "Uncategorized"}</td>
                    <td>
                      <span
                        className="admin-stock-label"
                        data-empty={Number(p.stock) === 0}
                      >
                        {Number(p.stock) === 0
                          ? "Out of Stock"
                          : `${p.stock} in Stock`}
                      </span>
                    </td>
                    <td>₹{Number(p.price).toLocaleString("en-IN")}</td>
                    <td>
                      <span className={styles.badge} data-status={p.status}>
                        {p.status}
                      </span>
                    </td>
                    <td>
                      <details className="admin-product-row-menu">
                        <summary aria-label={`Actions for ${p.name}`}>
                          ⋮
                        </summary>
                        <div>
                          {" "}
                          <Link
                            href={`/admin/products/${p.id}/edit`}
                            aria-label={`Edit ${p.name}`}
                          >
                            <Edit size={15} />
                          </Link>
                          <button
                            title="Delete product"
                            onClick={() => handleDelete(p.id, p.name)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!displayed.length && (
              <p className={styles.empty}>
                {loading
                  ? "Loading catalog…"
                  : "No products match these filters."}
              </p>
            )}
          </div>
          <footer className={styles.pagination}>
            <span>
              Showing {filtered.length ? (currentPage - 1) * 10 + 1 : 0}–
              {Math.min(currentPage * 10, filtered.length)} of {filtered.length}{" "}
              products
            </span>
            <button
              disabled={currentPage === 1}
              onClick={() => setPage(currentPage - 1)}
            >
              Previous
            </button>
            <span>
              {currentPage} / {pageCount}
            </span>
            <button
              disabled={currentPage === pageCount}
              onClick={() => setPage(currentPage + 1)}
            >
              Next
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}
