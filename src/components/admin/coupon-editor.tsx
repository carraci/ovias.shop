"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Check } from "lucide-react";

export type CouponData = {
  id?: string;
  code: string;
  description?: string;
  discountType: "percentage" | "fixed" | "free_shipping";
  value: number;
  usageLimit?: number | null;
  onlyRegistered?: boolean;
  status: "Active" | "Inactive" | "Enabled" | "Disabled";
  startDate?: string;
  endDate?: string;
};

interface CouponEditorProps {
  couponId?: string;
  initialCoupon?: CouponData | null;
  onSaved?: (coupon: any) => void;
  onDeleted?: (id: string) => void;
  onCancel?: () => void;
}

export function CouponEditor({
  couponId,
  initialCoupon,
  onSaved,
  onDeleted,
  onCancel,
}: CouponEditorProps) {
  const router = useRouter();
  const isNew = !couponId || couponId === "new";

  const [loading, setLoading] = useState(Boolean(couponId && !initialCoupon && !isNew));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Form State
  const [code, setCode] = useState(initialCoupon?.code || "");
  const [type, setType] = useState<"percentage" | "fixed" | "free_shipping">(
    initialCoupon?.discountType === "free_shipping"
      ? "free_shipping"
      : initialCoupon?.discountType === "fixed"
      ? "fixed"
      : "percentage"
  );
  const [discountValue, setDiscountValue] = useState<string>(
    initialCoupon?.value !== undefined ? String(initialCoupon.value) : "10"
  );
  const [usageLimit, setUsageLimit] = useState<string>(
    initialCoupon?.usageLimit ? String(initialCoupon.usageLimit) : ""
  );
  const [onlyRegistered, setOnlyRegistered] = useState<boolean>(
    initialCoupon?.onlyRegistered || false
  );
  const [status, setStatus] = useState<"Enabled" | "Disabled">(
    initialCoupon?.status === "Inactive" || initialCoupon?.status === "Disabled"
      ? "Disabled"
      : "Enabled"
  );
  const [startDate, setStartDate] = useState<string>(
    initialCoupon?.startDate || new Date().toISOString().slice(0, 10)
  );
  const [endDate, setEndDate] = useState<string>(initialCoupon?.endDate || "");

  useEffect(() => {
    if (couponId && !initialCoupon && !isNew) {
      setLoading(true);
      fetch(`/api/admin/coupons/${encodeURIComponent(couponId)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.coupon) {
            const c = data.coupon;
            setCode(c.code || "");
            setType(
              c.discountType === "free_shipping"
                ? "free_shipping"
                : c.discountType === "fixed"
                ? "fixed"
                : "percentage"
            );
            setDiscountValue(c.value !== undefined ? String(c.value) : "10");
            setUsageLimit(c.usageLimit ? String(c.usageLimit) : "");
            setOnlyRegistered(Boolean(c.onlyRegistered));
            setStatus(c.status === "Inactive" || c.status === "Disabled" ? "Disabled" : "Enabled");
            setStartDate(c.startDate || "");
            setEndDate(c.endDate || "");
          } else {
            setError(data.error || "Failed to load coupon details.");
          }
        })
        .catch((err) => setError(err.message || "Network error loading coupon."))
        .finally(() => setLoading(false));
    }
  }, [couponId, initialCoupon, isNew]);

  async function handleSave(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const cleanCode = code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
    if (!cleanCode) {
      alert("Please enter a coupon code.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = {
        code: cleanCode,
        discountType: type,
        value: type === "free_shipping" ? 0 : Number(discountValue) || 0,
        usageLimit: usageLimit ? Number(usageLimit) : undefined,
        onlyRegistered,
        status: status === "Enabled" ? "Active" : "Inactive",
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };

      let res: Response;
      if (isNew) {
        res = await fetch("/api/admin/coupons", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`/api/admin/coupons/${encodeURIComponent(couponId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to save coupon.");
      }

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);

      if (onSaved) {
        onSaved(json.coupon);
      } else {
        router.push("/admin/coupons");
      }
    } catch (err: any) {
      alert(err.message || "Failed to save coupon.");
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!couponId || isNew) return;
    if (!confirm(`Are you sure you want to permanently delete coupon "${code}"?`)) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/coupons/${encodeURIComponent(couponId)}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to delete coupon.");
      }

      if (onDeleted) {
        onDeleted(couponId);
      } else {
        router.push("/admin/coupons");
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete coupon.");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center", color: "#6b7280" }}>
        <Loader2 size={24} className="animate-spin" style={{ display: "inline-block", marginRight: 8 }} />
        Loading coupon details...
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 1200, margin: "0 auto" }}>
      {/* Breadcrumb & Navigation */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ fontSize: 13, color: "#6b7280", display: "flex", alignItems: "center", gap: 6 }}>
          <Link href="/admin" style={{ color: "#6b7280", textDecoration: "none" }}>
            Dashboard
          </Link>
          <span>/</span>
          <Link href="/admin/coupons" style={{ color: "#6b7280", textDecoration: "none" }}>
            Coupons
          </Link>
          <span>/</span>
          <span style={{ color: "#111827", fontWeight: 500 }}>
            {isNew ? "New Coupon" : "Edit Coupon"}
          </span>
        </div>

        {/* Page Title & Action Buttons matching Image 2 */}
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
            {isNew ? "New Coupon" : "Edit Coupon"}
          </h1>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {!isNew && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  padding: "8px 20px",
                  backgroundColor: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 4,
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#374151",
                  cursor: deleting ? "not-allowed" : "pointer",
                  transition: "all 0.15s ease",
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#fee2e2")}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#ffffff")}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: "8px 24px",
                backgroundColor: "#ffd333",
                border: "none",
                borderRadius: 4,
                fontSize: 13,
                fontWeight: 600,
                color: "#111827",
                cursor: saving ? "not-allowed" : "pointer",
                transition: "background-color 0.15s ease",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#facc15")}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#ffd333")}
            >
              {saving ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Saving...
                </>
              ) : savedSuccess ? (
                <>
                  <Check size={14} /> Saved
                </>
              ) : isNew ? (
                "Save"
              ) : (
                "Edit"
              )}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: "12px 16px",
            backgroundColor: "#fee2e2",
            border: "1px solid #fca5a5",
            borderRadius: 4,
            color: "#b91c1c",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {/* Main 2-Column Grid matching Image 2 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 340px",
          gap: 24,
          alignItems: "start",
        }}
      >
        {/* ================= LEFT COLUMN: Basic Information ================= */}
        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 4,
            padding: "24px 28px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
          }}
        >
          <h2
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: "#111827",
              margin: "0 0 20px 0",
            }}
          >
            Basic information
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* Code */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#374151",
                  marginBottom: 6,
                }}
              >
                Code
              </label>
              <input
                type="text"
                required
                value={code}
                placeholder="QWERTY12"
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  border: "1px solid #e5e7eb",
                  borderRadius: 4,
                  fontSize: 13,
                  color: "#111827",
                  outline: "none",
                  backgroundColor: "#ffffff",
                  fontFamily: "monospace",
                  fontWeight: 600,
                  letterSpacing: "0.05em",
                }}
              />
            </div>

            {/* Type */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#374151",
                  marginBottom: 8,
                }}
              >
                Type
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 13,
                    color: "#374151",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="radio"
                    name="discountType"
                    checked={type === "percentage"}
                    onChange={() => setType("percentage")}
                    style={{ accentColor: "#ffd333", cursor: "pointer" }}
                  />
                  <span>Percentage</span>
                </label>

                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 13,
                    color: "#374151",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="radio"
                    name="discountType"
                    checked={type === "fixed"}
                    onChange={() => setType("fixed")}
                    style={{ accentColor: "#ffd333", cursor: "pointer" }}
                  />
                  <span>Fixed amount</span>
                </label>

                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 13,
                    color: "#374151",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="radio"
                    name="discountType"
                    checked={type === "free_shipping"}
                    onChange={() => setType("free_shipping")}
                    style={{ accentColor: "#ffd333", cursor: "pointer" }}
                  />
                  <span>Free shipping</span>
                </label>
              </div>
            </div>

            {/* Discount value */}
            {type !== "free_shipping" && (
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#374151",
                    marginBottom: 6,
                  }}
                >
                  Discount value
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={type === "percentage" ? 100 : undefined}
                  value={discountValue}
                  placeholder={type === "percentage" ? "10" : "10.00"}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    border: "1px solid #e5e7eb",
                    borderRadius: 4,
                    fontSize: 13,
                    color: "#111827",
                    outline: "none",
                    backgroundColor: "#ffffff",
                  }}
                />
              </div>
            )}

            {/* Usage limit */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#374151",
                  marginBottom: 6,
                }}
              >
                Usage limit
              </label>
              <input
                type="number"
                min="1"
                value={usageLimit}
                placeholder="100"
                onChange={(e) => setUsageLimit(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  border: "1px solid #e5e7eb",
                  borderRadius: 4,
                  fontSize: 13,
                  color: "#111827",
                  outline: "none",
                  backgroundColor: "#ffffff",
                }}
              />
            </div>

            {/* Only for registered customers */}
            <div style={{ paddingTop: 4 }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 13,
                  color: "#374151",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={onlyRegistered}
                  onChange={(e) => setOnlyRegistered(e.target.checked)}
                  style={{ accentColor: "#ffd333", cursor: "pointer" }}
                />
                <span>Only for registered customers</span>
              </label>
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: Status & Schedule ================= */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Status Card */}
          <div
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: 4,
              padding: "20px 24px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
            }}
          >
            <h2
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: "#111827",
                margin: "0 0 16px 0",
              }}
            >
              Status
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 13,
                  color: "#374151",
                  cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  name="couponStatus"
                  checked={status === "Enabled"}
                  onChange={() => setStatus("Enabled")}
                  style={{ accentColor: "#ffd333", cursor: "pointer" }}
                />
                <span>Enabled</span>
              </label>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 13,
                  color: "#374151",
                  cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  name="couponStatus"
                  checked={status === "Disabled"}
                  onChange={() => setStatus("Disabled")}
                  style={{ accentColor: "#ffd333", cursor: "pointer" }}
                />
                <span>Disabled</span>
              </label>
            </div>
          </div>

          {/* Schedule Card */}
          <div
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: 4,
              padding: "20px 24px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
            }}
          >
            <h2
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: "#111827",
                margin: "0 0 6px 0",
              }}
            >
              Schedule
            </h2>
            <p
              style={{
                fontSize: 13,
                color: "#6b7280",
                margin: "0 0 16px 0",
                lineHeight: 1.4,
              }}
            >
              Use these settings to limit the coupon expiration date.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#374151",
                    marginBottom: 6,
                  }}
                >
                  Start date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #e5e7eb",
                    borderRadius: 4,
                    fontSize: 13,
                    color: "#111827",
                    outline: "none",
                    backgroundColor: "#ffffff",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#374151",
                    marginBottom: 6,
                  }}
                >
                  End date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #e5e7eb",
                    borderRadius: 4,
                    fontSize: 13,
                    color: "#111827",
                    outline: "none",
                    backgroundColor: "#ffffff",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
