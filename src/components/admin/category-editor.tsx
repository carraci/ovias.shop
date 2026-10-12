"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
export function CategoryEditor({ id }: { id?: string }) {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    parent: "",
    image: "",
    status: "Active",
    metaTitle: "",
    metaDescription: "",
  });
  const [loading, setLoading] = useState(!!id),
    [saving, setSaving] = useState(false),
    [uploading, setUploading] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    fetch("/api/admin/categories", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || "Could not load categories");
        if (!active) return;
        setCategories(data.categories);
        if (id) {
          const item = data.categories.find((item: any) => item.id === id);
          if (!item) throw new Error("Category not found");
          setForm((previous) => ({
            ...previous,
            ...item,
            parent: item.parent || "",
            image: item.image || "",
          }));
        }
      })
      .catch((error) => active && setError(error.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id]);
  const field = (key: keyof typeof form, value: string) =>
    setForm((previous) => ({ ...previous, [key]: value }));
  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch(
        id
          ? `/api/admin/categories/${encodeURIComponent(id)}`
          : "/api/admin/categories",
        {
          method: id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, parent: form.parent || null }),
        },
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Could not save category");
      window.dispatchEvent(new Event("ovia_category_updated"));
      router.push("/admin/categories");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not save category",
      );
    } finally {
      setSaving(false);
    }
  }
  async function upload(file?: File) {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body,
      });
      const result = await response.json();
      if (!response.ok || !result.url)
        throw new Error(result.error || "Upload failed");
      field("image", result.url);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }
  if (loading) return <p>Loading category…</p>;
  return (
    <form onSubmit={save} className="admin-category-editor">
      <header className="admin-catalog-page-heading">
        <div>
          <small>
            <Link href="/admin">Dashboard</Link> /{" "}
            <Link href="/admin/categories">Categories</Link> /{" "}
            {id ? "Edit" : "New"} Category
          </small>
          <h1>{id ? "Edit Category" : "New Category"}</h1>
        </div>
        <div>
          <Link href="/admin/categories">Cancel</Link>
          <button disabled={saving || (!!error && !form.name)} type="submit">
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </header>
      {error && <p role="alert">{error}</p>}
      <div className="admin-category-editor-grid">
        <div>
          <section>
            <h2>Basic information</h2>
            <label>
              Name
              <input
                required
                value={form.name}
                onChange={(event) => field("name", event.target.value)}
              />
            </label>
            <label>
              Slug
              <input
                value={form.slug}
                placeholder="Generated from the name"
                onChange={(event) => field("slug", event.target.value)}
              />
            </label>
            <label>
              Description
              <textarea
                aria-label="Description"
                rows={10}
                value={form.description}
                onChange={(event) => field("description", event.target.value)}
              />
            </label>
          </section>
          <section>
            <h2>Search engine optimization</h2>
            <p>Provide a page title and description for this category.</p>
            <label>
              Page title
              <input
                value={form.metaTitle}
                onChange={(event) => field("metaTitle", event.target.value)}
              />
            </label>
            <label>
              Meta description
              <textarea
                rows={3}
                value={form.metaDescription}
                onChange={(event) =>
                  field("metaDescription", event.target.value)
                }
              />
            </label>
          </section>
        </div>
        <aside>
          <section>
            <h2>Visibility</h2>
            {[
              ["Active", "Published"],
              ["Draft", "Hidden"],
            ].map(([value, label]) => (
              <label className="admin-radio-label" key={value}>
                <input
                  type="radio"
                  name="visibility"
                  checked={form.status === value}
                  onChange={() => field("status", value)}
                />
                {label}
              </label>
            ))}
          </section>
          <section>
            <h2>Parent category</h2>
            <label>
              Parent
              <select
                value={form.parent}
                onChange={(event) => field("parent", event.target.value)}
              >
                <option value="">None (root category)</option>
                {categories
                  .filter((item) => item.id !== id)
                  .map((item) => (
                    <option key={item.id} value={item.name}>
                      {item.name}
                    </option>
                  ))}
              </select>
            </label>
          </section>
          <section>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <h2 style={{ margin: 0 }}>Category Banner Image</h2>
              {form.image && (
                <button
                  type="button"
                  onClick={() => field("image", "")}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#ef4444",
                    fontSize: "12px",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  Remove
                </button>
              )}
            </div>

            {/* Live Storefront Hero Preview */}
            <div
              style={{
                position: "relative",
                width: "100%",
                height: "170px",
                borderRadius: "8px",
                overflow: "hidden",
                marginBottom: "12px",
                backgroundColor: "#141517",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                border: "1px solid #e5e8eb",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              }}
            >
              {form.image ? (
                <>
                  <img
                    src={form.image}
                    alt={form.name || "Category Banner"}
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      filter: "brightness(0.85)",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.6) 100%)",
                    }}
                  />
                  <div style={{ position: "relative", zIndex: 2, padding: "0 16px" }}>
                    <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "1px", color: "rgba(255,255,255,0.7)", marginBottom: "4px" }}>
                      Storefront Preview
                    </div>
                    <h3 style={{ color: "#ffffff", fontSize: "20px", fontWeight: 400, margin: "0 0 6px", textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>
                      {form.name || "Category Title"}
                    </h3>
                    <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "11px", margin: 0, maxWidth: "260px", lineHeight: 1.35, textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}>
                      {form.description || "Available in a variety of shapes and styles designed for routines or travel."}
                    </p>
                  </div>
                </>
              ) : (
                <div style={{ padding: "16px", color: "#6b7280", textAlign: "center" }}>
                  <div style={{ fontSize: "24px", marginBottom: "6px" }}>🖼️</div>
                  <div style={{ fontSize: "13px", fontWeight: 500, color: "#374151" }}>No banner image uploaded</div>
                  <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "4px" }}>
                    Upload an image or pick a preset below to set the category header banner.
                  </div>
                </div>
              )}
            </div>

            {/* Quick Luxury Presets */}
            <div style={{ marginBottom: "12px" }}>
              <span style={{ display: "block", fontSize: "11px", color: "#6b7280", marginBottom: "6px", fontWeight: 500 }}>
                Quick Luxury Presets:
              </span>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {[
                  { name: "Backpacks", url: "/media/banner-backpacks.jpg" },
                  { name: "Editorial Bags", url: "/media/editorial-bags.jpg" },
                  { name: "Luxury Luggage", url: "/media/category-luggage.jpg" },
                  { name: "Check-In 16K", url: "/media/banner-checkin-16k.jpg" },
                  { name: "Accessories", url: "/media/category-accessories.jpg" },
                ].map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => field("image", preset.url)}
                    style={{
                      background: form.image === preset.url ? "#111827" : "#f3f4f6",
                      color: form.image === preset.url ? "#ffffff" : "#374151",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px",
                      padding: "4px 8px",
                      fontSize: "11px",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Image URL input */}
            <label>
              Image URL
              <input
                value={form.image}
                placeholder="/media/banner-backpacks.jpg or https://..."
                onChange={(event) => field("image", event.target.value)}
              />
            </label>

            {/* File Upload with status */}
            <label>
              Upload image {uploading && <span style={{ color: "#2563eb", fontSize: "12px" }}>(Uploading...)</span>}
              <input
                type="file"
                accept="image/*"
                disabled={uploading}
                onChange={(event) => void upload(event.target.files?.[0])}
              />
            </label>
          </section>
        </aside>
      </div>
    </form>
  );
}
