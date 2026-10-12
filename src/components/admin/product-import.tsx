"use client";
import { useState } from "react";
export function ProductImport({ onComplete }: { onComplete: () => void }) {
  const [open, setOpen] = useState(false),
    [rows, setRows] = useState<any[]>([]),
    [error, setError] = useState(""),
    [running, setRunning] = useState(false),
    [completed, setCompleted] = useState(0);
  async function read(file?: File) {
    if (!file) return;
    setError("");
    setRows([]);
    setCompleted(0);
    try {
      const value = JSON.parse(await file.text());
      const items = Array.isArray(value) ? value : value.products;
      if (!Array.isArray(items) || !items.length || items.length > 100)
        throw new Error("Provide a JSON array of 1–100 products.");
      for (const item of items) {
        if (
          !item.name?.trim() ||
          !item.sku?.trim() ||
          !item.category?.trim() ||
          !Number.isFinite(item.price) ||
          item.price < 0 ||
          !Number.isInteger(item.stock) ||
          item.stock < 0
        )
          throw new Error(
            "Every product requires name, SKU, category, price in rupees, and whole-number stock.",
          );
      }
      if (new Set(items.map((item) => item.sku)).size !== items.length)
        throw new Error("Product SKUs must be unique in the file.");
      setRows(items);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Invalid product file");
    }
  }
  async function save() {
    setRunning(true);
    setError("");
    try {
      for (let index = completed; index < rows.length; index++) {
        const response = await fetch("/api/admin/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...rows[index],
            status: "Draft",
            publishAt: null,
          }),
        });
        const data = await response.json();
        if (!response.ok)
          throw new Error(
            `Product ${index + 1}: ${data.error || "Could not import"}`,
          );
        setCompleted(index + 1);
      }
      onComplete();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Import failed");
    } finally {
      setRunning(false);
    }
  }
  return (
    <>
      <button
        type="button"
        className="admin-import-button"
        onClick={() => setOpen(true)}
      >
        Import
      </button>
      {open && (
        <div className="admin-import-backdrop">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-import-heading"
          >
            <h2 id="product-import-heading">Import products</h2>
            <p>
              Upload a JSON array of your products. Required fields: name, SKU
              (sku), category, price in rupees, stock. Imported products are
              saved as hidden drafts for review.
            </p>
            <input
              aria-label="Product import file"
              type="file"
              accept="application/json,.json"
              disabled={running}
              onChange={(event) => void read(event.target.files?.[0])}
            />
            {rows.length > 0 && (
              <p>
                {rows.length} products loaded · {completed} saved
              </p>
            )}
            {error && <p role="alert">{error}</p>}
            <div>
              <button
                type="button"
                disabled={running}
                onClick={() => setOpen(false)}
              >
                Close
              </button>
              <button
                type="button"
                disabled={running || !rows.length || completed === rows.length}
                onClick={() => void save()}
              >
                {running ? "Importing…" : "Import hidden drafts"}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
