"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LogisticsOperation, OrderRefund } from "@/lib/types";
import { withDeadline } from "@/lib/ai-request";
import styles from "./shipping.module.css";
import {
  Search,
  RefreshCw,
  ChevronDown,
  Check,
  MoreHorizontal,
  X,
  ExternalLink,
  Calendar,
  Truck,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Eye,
  XCircle,
  CheckCircle2,
} from "lucide-react";

type Shipment = {
  orderId: string;
  orderNumber: string;
  customer: string;
  address: { line1: string; city: string; region: string; postalCode: string };
  items: { name: string; quantity: number; image?: string }[];
  amount: number;
  paymentStatus: string;
  awb?: string;
  courier?: string;
  status: string;
  fulfillmentStatus?: string;
  pickup?: { pickupId?: string | number; status?: string; date?: string };
  eta?: string;
  events: { status: string; description: string; timestamp: string }[];
  operation?: LogisticsOperation;
  refund?: OrderRefund;
  notificationStatus?: string;
  inventoryRestored: boolean;
  canReconcile?: boolean;
  canApprove: boolean;
  canCancel: boolean;
};

const money = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

const TABS = [
  { id: "All", label: "All Orders" },
  { id: "Awaiting approval", label: "Awaiting Approval" },
  { id: "PICKUP_SCHEDULED", label: "Pickup Scheduled" },
  { id: "IN_TRANSIT", label: "In Transit" },
  { id: "DELIVERED", label: "Delivered" },
  { id: "Cancelled", label: "Cancelled" },
  { id: "Needs attention", label: "Needs Attention" },
];

export default function AdminShippingPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [error, setError] = useState("");
  const [configured, setConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [dateFilter, setDateFilter] = useState("All");
  const [paymentFilter, setPaymentFilter] = useState("All");
  const [courierFilter, setCourierFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // Dropdown states
  const [openDropdown, setOpenDropdown] = useState<
    "date" | "payment" | "courier" | "status" | null
  >(null);
  const [actionMenuOrderId, setActionMenuOrderId] = useState<string | null>(
    null,
  );

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal / Actions
  const [selected, setSelected] = useState<Shipment | null>(null);
  const [action, setAction] = useState<"approve" | "cancel" | "details" | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [dialogError, setDialogError] = useState("");
  const [reason, setReason] = useState("Customer requested cancellation");
  const [pkg, setPkg] = useState({
    weightGrams: "",
    length: "",
    width: "",
    height: "",
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const linkedOrderOpened = useRef(false);
  const submitting = useRef(false);
  const fetching = useRef(false);

  const load = useCallback(async (isManualRefresh = false) => {
    if (fetching.current) return;
    fetching.current = true;
    if (isManualRefresh) setRefreshing(true);
    try {
      const data = await withDeadline(
        async (signal) => {
          const response = await fetch("/api/admin/shipping", {
            signal,
            cache: "no-store",
          });
          const json = await response.json();
          if (!response.ok || !json.success)
            throw new Error(json.error || "Shipping data is unavailable.");
          return json;
        },
        20000,
        "Shipping took too long to load.",
      );
      setShipments(data.shipments || []);
      setConfigured(data.configured ?? true);
      setError("");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Shipping data is unavailable.",
      );
    } finally {
      fetching.current = false;
      setLoading(false);
      if (isManualRefresh) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 5000);
    return () => clearInterval(timer);
  }, [load]);

  // Keep selected updated if updated in background
  useEffect(() => {
    if (selected && !busy) {
      const latest = shipments.find((s) => s.orderId === selected.orderId);
      if (latest && latest !== selected) setSelected(latest);
    }
  }, [shipments, selected, busy]);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest(`.${styles.dropdownContainer}`)) {
        setOpenDropdown(null);
      }
      if (!target.closest(`.${styles.actionCell}`)) {
        setActionMenuOrderId(null);
      }
    }
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  function openModal(
    row: Shipment,
    nextAction: "approve" | "cancel" | "details",
  ) {
    setSelected(row);
    setAction(nextAction);
    setDialogError("");
    setActionMenuOrderId(null);
    const saved = row.operation?.package;
    setPkg({
      weightGrams: saved ? String(saved.weightGrams) : "",
      length: saved ? String(saved.length) : "",
      width: saved ? String(saved.width) : "",
      height: saved ? String(saved.height) : "",
    });
  }

  function closeModal() {
    if (busy) return;
    setSelected(null);
    setAction(null);
    setDialogError("");
  }

  // Linked order from query params
  useEffect(() => {
    if (linkedOrderOpened.current || !shipments.length) return;
    const id = new URLSearchParams(window.location.search).get("orderId");
    const row = shipments.find((s) => s.orderId === id);
    if (row) {
      linkedOrderOpened.current = true;
      openModal(row, row.canApprove ? "approve" : "details");
    }
  }, [shipments]);

  async function submitAction() {
    if (!selected || !action || action === "details" || submitting.current)
      return;
    const packageData = Object.fromEntries(
      Object.entries(pkg).map(([k, v]) => [k, Number(v)]),
    );
    if (
      action === "approve" &&
      Object.values(packageData).some((v) => !Number.isFinite(v) || v <= 0)
    ) {
      setDialogError(
        "Enter the actual packed weight and all three dimensions.",
      );
      return;
    }
    submitting.current = true;
    setBusy(true);
    setDialogError("");
    try {
      const result = await withDeadline(
        async (signal) => {
          const response = await fetch("/api/admin/shipping", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: selected.orderId,
              action,
              confirmed: true,
              ...(action === "approve" ? { package: packageData } : { reason }),
            }),
            signal,
          });
          const data = await response.json();
          if (!response.ok || !data.success)
            throw new Error(data.error || "Operation has not been confirmed.");
          return data;
        },
        65000,
        "Operation has not been confirmed. Refresh to check its saved status before retrying.",
      );
      setAction(null);
      setSelected(null);
      await load();
      if (result.operation?.status === "Failed")
        setError(result.operation.message || "Operation failed.");
    } catch (e) {
      setDialogError(
        e instanceof Error ? e.message : "Operation has not been confirmed.",
      );
      await load();
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  async function reconcileCourier(row: Shipment) {
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setDialogError("");
    try {
      const response = await fetch("/api/admin/shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: row.orderId,
          action: "reconcile",
          confirmed: true,
        }),
        signal: AbortSignal.timeout(30000),
      });
      const data = await response.json();
      if (!response.ok || !data.success)
        throw new Error(data.error || "Courier verification failed.");
      await load();
    } catch (e) {
      setDialogError(
        e instanceof Error ? e.message : "Courier verification failed.",
      );
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  // Status computation helpers matching Image 1
  function getShippingStatusDisplay(row: Shipment) {
    if (row.fulfillmentStatus === "CANCELLED" || row.status === "CANCELLED") {
      return {
        title: "Not initiated",
        subtitle: "Order cancelled",
      };
    }
    if (row.paymentStatus === "expired" || row.status === "Checkout expired") {
      return {
        title: "Not initiated",
        subtitle: "Checkout expired",
      };
    }
    if (row.status === "Unverified shipment") {
      return {
        title: "Unverified shipment",
        subtitle: "AWB not confirmed",
      };
    }
    if (row.status === "Awaiting approval") {
      return {
        title: "Ready for approval",
        subtitle: "Awaiting shipment",
      };
    }
    if (row.status === "PICKUP_SCHEDULED") {
      return {
        title: "Pickup scheduled",
        subtitle: row.pickup?.date ? `Pickup: ${row.pickup.date}` : "",
      };
    }
    if (row.status === "IN_TRANSIT") {
      return {
        title: "In transit",
        subtitle: row.operation?.message || "",
      };
    }
    if (row.status === "DELIVERED") {
      return {
        title: "Delivered",
        subtitle: "",
      };
    }
    const clean = (row.status || "Not initiated").replaceAll("_", " ");
    return {
      title: clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase(),
      subtitle: row.operation?.message || "",
    };
  }

  function getCourierDisplay(row: Shipment) {
    const courier = row.courier || "Not assigned";
    let awb = "AWB not confirmed";
    if (row.awb) {
      awb = row.awb.startsWith("#") ? row.awb : `#${row.awb}`;
    }
    return { courier, awb };
  }

  function getPaymentDisplay(row: Shipment) {
    const st = (row.paymentStatus || "").toLowerCase();
    if (st === "cancelled")
      return { label: "Cancelled", dotClass: styles.dotCancelled };
    if (st === "expired")
      return { label: "Expired", dotClass: styles.dotExpired };
    if (st === "refund_required" || st === "refund required")
      return { label: "Refund required", dotClass: styles.dotRefund };
    if (st === "paid") return { label: "Paid", dotClass: styles.dotPaid };
    return {
      label: st.charAt(0).toUpperCase() + st.slice(1),
      dotClass: styles.dotExpired,
    };
  }

  function getEtaDisplay(row: Shipment) {
    if (!row.eta) return "—";
    try {
      const d = new Date(row.eta);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      }
    } catch {
      // fallback
    }
    return row.eta || "—";
  }

  // Tab counts
  const tabCounts = useMemo(() => {
    return {
      All: shipments.length,
      "Awaiting approval": shipments.filter(
        (s) => s.status === "Awaiting approval",
      ).length,
      PICKUP_SCHEDULED: shipments.filter((s) => s.status === "PICKUP_SCHEDULED")
        .length,
      IN_TRANSIT: shipments.filter((s) => s.status === "IN_TRANSIT").length,
      DELIVERED: shipments.filter((s) => s.status === "DELIVERED").length,
      Cancelled: shipments.filter(
        (s) =>
          s.fulfillmentStatus === "CANCELLED" ||
          s.paymentStatus === "cancelled" ||
          s.status === "CANCELLED",
      ).length,
      "Needs attention": shipments.filter((s) =>
        [
          "Failed",
          "Processing",
          "Unverified shipment",
          "Payment requires review",
        ].includes(s.status),
      ).length,
    };
  }, [shipments]);

  // Filtering visible records
  const filteredShipments = useMemo(() => {
    return shipments.filter((s) => {
      // 1. Tab filter
      if (activeTab === "Cancelled") {
        if (
          !(
            s.fulfillmentStatus === "CANCELLED" ||
            s.paymentStatus === "cancelled" ||
            s.status === "CANCELLED"
          )
        )
          return false;
      } else if (activeTab === "Needs attention") {
        if (
          ![
            "Failed",
            "Processing",
            "Unverified shipment",
            "Payment requires review",
          ].includes(s.status)
        )
          return false;
      } else if (activeTab !== "All") {
        if (s.status !== activeTab) return false;
      }

      // 2. Payment Dropdown Filter
      if (paymentFilter !== "All") {
        if (s.paymentStatus?.toLowerCase() !== paymentFilter.toLowerCase())
          return false;
      }

      // 3. Courier Dropdown Filter
      if (courierFilter !== "All") {
        if (courierFilter === "Not assigned") {
          if (s.courier && s.courier !== "Not assigned") return false;
        } else {
          if (s.courier?.toLowerCase() !== courierFilter.toLowerCase())
            return false;
        }
      }

      // 4. Status Dropdown Filter
      if (statusFilter !== "All") {
        const { title } = getShippingStatusDisplay(s);
        if (title.toLowerCase() !== statusFilter.toLowerCase()) return false;
      }

      // 5. Search text
      if (search.trim()) {
        const query = search.trim().toLowerCase();
        const haystack =
          `${s.orderId} ${s.orderNumber} ${s.customer} ${s.awb || ""} ${s.courier || ""}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }

      return true;
    });
  }, [
    shipments,
    activeTab,
    paymentFilter,
    courierFilter,
    statusFilter,
    search,
  ]);

  // Pagination slice
  const paginatedShipments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredShipments.slice(start, start + pageSize);
  }, [filteredShipments, currentPage]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredShipments.length / pageSize),
  );

  // Checkbox handlers
  const allCurrentSelected =
    paginatedShipments.length > 0 &&
    paginatedShipments.every((s) => selectedIds.has(s.orderId));

  function toggleSelectAll() {
    if (allCurrentSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedShipments.map((s) => s.orderId)));
    }
  }

  function toggleSelectRow(orderId: string) {
    const next = new Set(selectedIds);
    if (next.has(orderId)) {
      next.delete(orderId);
    } else {
      next.add(orderId);
    }
    setSelectedIds(next);
  }

  return (
    <div className={styles.container}>
      {/* Top Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Shipping &amp; Logistics</h1>
          <p className={styles.subtitle}>
            Manage shipments, track courier confirmations and handle order
            fulfilment.
          </p>
        </div>
        <button
          type="button"
          className={styles.refreshBtn}
          onClick={() => void load(true)}
          disabled={loading || refreshing}
          aria-label="Refresh shipment data"
        >
          <RefreshCw
            size={14}
            className={refreshing ? styles.refreshIconRotating : ""}
          />
          <span>Refresh</span>
        </button>
      </header>


      {!configured && <p role="status">Courier setup is incomplete. Tracking checks run every minute for existing shipments; shipment approval requires the configured warehouse and webhook secret. AWB and delivery estimates appear only after courier confirmation.</p>}
      {error && (
        <div className={styles.alertBox} style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <nav className={styles.tabsRow} aria-label="Shipping status tabs">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const count = tabCounts[tab.id as keyof typeof tabCounts] ?? 0;
          return (
            <button
              key={tab.id}
              type="button"
              className={`${styles.tabBtn} ${isActive ? styles.activeTab : ""}`}
              onClick={() => {
                setActiveTab(tab.id);
                setCurrentPage(1);
              }}
              aria-current={isActive ? "page" : undefined}
            >
              <span>{tab.label}</span>
              <span className={styles.tabBadge}>{count}</span>
            </button>
          );
        })}
      </nav>

      {/* Filter & Search Toolbar */}
      <div className={styles.filterBar}>
        {/* Search Input */}
        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search by order ID, customer or AWB..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        {/* Dropdown Filters */}
        <div className={styles.filterDropdowns}>
          {/* Date Filter */}
          <div className={styles.dropdownContainer}>
            <button
              type="button"
              className={`${styles.dropdownBtn} ${dateFilter !== "All" ? styles.dropdownBtnActive : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                setOpenDropdown(openDropdown === "date" ? null : "date");
              }}
            >
              <Calendar size={14} color="#71717A" />
              <span>{dateFilter === "All" ? "Date" : dateFilter}</span>
              <ChevronDown size={14} color="#71717A" />
            </button>
            {openDropdown === "date" && (
              <div className={styles.dropdownMenu}>
                {[
                  "All dates",
                  "Today",
                  "Last 7 days",
                  "Last 30 days",
                  "This Month",
                ].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    className={`${styles.dropdownItem} ${
                      dateFilter === (opt === "All dates" ? "All" : opt)
                        ? styles.dropdownItemActive
                        : ""
                    }`}
                    onClick={() => {
                      setDateFilter(opt === "All dates" ? "All" : opt);
                      setOpenDropdown(null);
                      setCurrentPage(1);
                    }}
                  >
                    <span>{opt}</span>
                    {dateFilter === (opt === "All dates" ? "All" : opt) && (
                      <Check size={14} />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Payment Filter */}
          <div className={styles.dropdownContainer}>
            <button
              type="button"
              className={`${styles.dropdownBtn} ${paymentFilter !== "All" ? styles.dropdownBtnActive : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                setOpenDropdown(openDropdown === "payment" ? null : "payment");
              }}
            >
              <span>{paymentFilter === "All" ? "Payment" : paymentFilter}</span>
              <ChevronDown size={14} color="#71717A" />
            </button>
            {openDropdown === "payment" && (
              <div className={styles.dropdownMenu}>
                {[
                  "All payments",
                  "Paid",
                  "Cancelled",
                  "Expired",
                  "Refund required",
                ].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    className={`${styles.dropdownItem} ${
                      paymentFilter === (opt === "All payments" ? "All" : opt)
                        ? styles.dropdownItemActive
                        : ""
                    }`}
                    onClick={() => {
                      setPaymentFilter(opt === "All payments" ? "All" : opt);
                      setOpenDropdown(null);
                      setCurrentPage(1);
                    }}
                  >
                    <span>{opt}</span>
                    {paymentFilter ===
                      (opt === "All payments" ? "All" : opt) && (
                      <Check size={14} />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Courier Filter */}
          <div className={styles.dropdownContainer}>
            <button
              type="button"
              className={`${styles.dropdownBtn} ${courierFilter !== "All" ? styles.dropdownBtnActive : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                setOpenDropdown(openDropdown === "courier" ? null : "courier");
              }}
            >
              <span>{courierFilter === "All" ? "Courier" : courierFilter}</span>
              <ChevronDown size={14} color="#71717A" />
            </button>
            {openDropdown === "courier" && (
              <div className={styles.dropdownMenu}>
                {[
                  "All couriers",
                  "Delhivery",
                  "Blue Dart",
                  "Not assigned",
                ].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    className={`${styles.dropdownItem} ${
                      courierFilter === (opt === "All couriers" ? "All" : opt)
                        ? styles.dropdownItemActive
                        : ""
                    }`}
                    onClick={() => {
                      setCourierFilter(opt === "All couriers" ? "All" : opt);
                      setOpenDropdown(null);
                      setCurrentPage(1);
                    }}
                  >
                    <span>{opt}</span>
                    {courierFilter ===
                      (opt === "All couriers" ? "All" : opt) && (
                      <Check size={14} />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Status Filter */}
          <div className={styles.dropdownContainer}>
            <button
              type="button"
              className={`${styles.dropdownBtn} ${statusFilter !== "All" ? styles.dropdownBtnActive : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                setOpenDropdown(openDropdown === "status" ? null : "status");
              }}
            >
              <span>{statusFilter === "All" ? "Status" : statusFilter}</span>
              <ChevronDown size={14} color="#71717A" />
            </button>
            {openDropdown === "status" && (
              <div className={styles.dropdownMenu}>
                {[
                  "All statuses",
                  "Not initiated",
                  "Ready for approval",
                  "Pickup scheduled",
                  "In transit",
                  "Delivered",
                  "Unverified shipment",
                ].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    className={`${styles.dropdownItem} ${
                      statusFilter === (opt === "All statuses" ? "All" : opt)
                        ? styles.dropdownItemActive
                        : ""
                    }`}
                    onClick={() => {
                      setStatusFilter(opt === "All statuses" ? "All" : opt);
                      setOpenDropdown(null);
                      setCurrentPage(1);
                    }}
                  >
                    <span>{opt}</span>
                    {statusFilter === (opt === "All statuses" ? "All" : opt) && (
                      <Check size={14} />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={`${styles.th} ${styles.checkboxCell}`}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={allCurrentSelected}
                  onChange={toggleSelectAll}
                  aria-label="Select all orders"
                />
              </th>
              <th className={styles.th}>ORDER</th>
              <th className={styles.th}>CUSTOMER</th>
              <th className={styles.th}>AMOUNT</th>
              <th className={styles.th}>PAYMENT</th>
              <th className={styles.th}>SHIPPING STATUS</th>
              <th className={styles.th}>COURIER / AWB</th>
              <th className={styles.th}>EST. DELIVERY</th>
              <th className={styles.th} style={{ textAlign: "right" }}>
                ACTIONS
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className={styles.emptyState}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    <RefreshCw
                      size={16}
                      className={styles.refreshIconRotating}
                    />
                    <span>Loading real-time shipments...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedShipments.length === 0 ? (
              <tr>
                <td colSpan={9} className={styles.emptyState}>
                  No orders found matching the selected filters.
                </td>
              </tr>
            ) : (
              paginatedShipments.map((row) => {
                const isSelected = selectedIds.has(row.orderId);
                const payment = getPaymentDisplay(row);
                const shipping = getShippingStatusDisplay(row);
                const courier = getCourierDisplay(row);
                const eta = getEtaDisplay(row);
                const isMenuOpen = actionMenuOrderId === row.orderId;

                return (
                  <tr
                    key={row.orderId}
                    className={`${styles.tr} ${isSelected ? styles.trSelected : ""}`}
                  >
                    <td className={`${styles.td} ${styles.checkboxCell}`}>
                      <input
                        type="checkbox"
                        className={styles.checkbox}
                        checked={isSelected}
                        onChange={() => toggleSelectRow(row.orderId)}
                        aria-label={`Select order ${row.orderNumber}`}
                      />
                    </td>
                    <td className={`${styles.td} ${styles.orderCell}`}>
                      <a
                        href={`/admin/orders/${row.orderId}`}
                        className={styles.orderLink}
                      >
                        {row.orderNumber}
                      </a>
                    </td>
                    <td className={`${styles.td} ${styles.customerCell}`}>
                      {row.customer}
                    </td>
                    <td className={`${styles.td} ${styles.amountCell}`}>
                      {money(row.amount)}
                    </td>
                    <td className={styles.td}>
                      <div className={styles.paymentCell}>
                        <span className={`${styles.dot} ${payment.dotClass}`} />
                        <span>{payment.label}</span>
                      </div>
                    </td>
                    <td className={styles.td}>
                      <div className={styles.twoLineCell}>
                        <span className={styles.primaryText}>
                          {shipping.title}
                        </span>
                        {shipping.subtitle && (
                          <span className={styles.secondaryText}>
                            {shipping.subtitle}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={styles.td}>
                      <div className={styles.twoLineCell}>
                        <span className={styles.primaryText}>
                          {courier.courier}
                        </span>
                        <span className={styles.secondaryText}>
                          {courier.awb}
                        </span>
                      </div>
                    </td>
                    <td className={`${styles.td} ${styles.etaCell}`}>
                      <span className={eta === "—" ? styles.etaEmpty : ""}>
                        {eta}
                      </span>
                    </td>
                    <td className={`${styles.td} ${styles.actionCell}`}>
                      <button
                        type="button"
                        className={styles.actionBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActionMenuOrderId(
                            isMenuOpen ? null : row.orderId,
                          );
                        }}
                        aria-label={`Actions for ${row.orderNumber}`}
                      >
                        <MoreHorizontal size={18} />
                      </button>

                      {isMenuOpen && (
                        <div className={styles.actionMenu}>
                          <button
                            type="button"
                            className={styles.actionMenuItem}
                            onClick={() => openModal(row, "details")}
                          >
                            <Eye size={14} color="#71717A" />
                            <span>View Details</span>
                          </button>

                          {row.canApprove && (
                            <button
                              type="button"
                              className={styles.actionMenuItem}
                              onClick={() => openModal(row, "approve")}
                            >
                              <Truck size={14} color="#10B981" />
                              <span>Approve &amp; Ship</span>
                            </button>
                          )}

                          {row.canCancel && (
                            <button
                              type="button"
                              className={`${styles.actionMenuItem} ${styles.actionMenuItemDanger}`}
                              onClick={() => openModal(row, "cancel")}
                            >
                              <XCircle size={14} />
                              <span>Cancel Order</span>
                            </button>
                          )}

                          {row.canReconcile && (
                            <button
                              type="button"
                              className={styles.actionMenuItem}
                              onClick={() => {
                                setActionMenuOrderId(null);
                                void reconcileCourier(row);
                              }}
                            >
                              <RefreshCw size={14} color="#3B82F6" />
                              <span>Check Courier</span>
                            </button>
                          )}

                          {row.awb && (
                            <a
                              href={`/account/orders/${row.orderId}/tracking`}
                              target="_blank"
                              rel="noreferrer"
                              className={styles.actionMenuItem}
                            >
                              <ExternalLink size={14} color="#71717A" />
                              <span>Track Shipment</span>
                            </a>
                          )}

                          <a
                            href={`/admin/orders/${row.orderId}`}
                            className={styles.actionMenuItem}
                          >
                            <ArrowRight size={14} color="#71717A" />
                            <span>Full Order File</span>
                          </a>
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

      {/* Footer / Pagination */}
      <footer className={styles.footer}>
        <div>
          Showing {paginatedShipments.length} of {filteredShipments.length} orders
          {filteredShipments.length !== shipments.length &&
            ` (filtered from ${shipments.length} total)`}
        </div>
        <div className={styles.pagination}>
          <button
            type="button"
            className={styles.pageBtn}
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            aria-label="Previous page"
          >
            <ChevronLeft size={16} />
          </button>
          {Array.from({ length: totalPages }).map((_, idx) => {
            const pageNum = idx + 1;
            return (
              <button
                key={pageNum}
                type="button"
                className={`${styles.pageBtn} ${
                  currentPage === pageNum ? styles.pageBtnActive : ""
                }`}
                onClick={() => setCurrentPage(pageNum)}
              >
                {pageNum}
              </button>
            );
          })}
          <button
            type="button"
            className={styles.pageBtn}
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            aria-label="Next page"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </footer>

      {/* Modal Dialog */}
      {selected && action && (
        <div className={styles.dialogBackdrop} onClick={closeModal}>
          <div
            className={styles.dialogCard}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className={styles.dialogHeader}>
              <h2 className={styles.dialogTitle}>
                {action === "approve"
                  ? "Approve Shipment"
                  : action === "cancel"
                    ? "Cancel Order & Refund"
                    : `Order Details — ${selected.orderNumber}`}
              </h2>
              <button
                type="button"
                className={styles.dialogCloseBtn}
                onClick={closeModal}
                disabled={busy}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.dialogBody}>
              {dialogError && (
                <div className={styles.alertBox}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <AlertCircle size={16} />
                    <span>{dialogError}</span>
                  </div>
                </div>
              )}

              {/* Order Overview Snippet */}
              <div className={styles.summarySection}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontWeight: 600,
                  }}
                >
                  <span>{selected.customer}</span>
                  <span>{money(selected.amount)}</span>
                </div>
                <div style={{ color: "#71717A", fontSize: 12 }}>
                  {selected.address.line1}, {selected.address.city},{" "}
                  {selected.address.region} {selected.address.postalCode}
                </div>
                <div style={{ marginTop: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 500 }}>
                    Items ({selected.items.length}):{" "}
                  </span>
                  <span style={{ fontSize: 12, color: "#52525B" }}>
                    {selected.items
                      .map((i) => `${i.name} (x${i.quantity})`)
                      .join(", ")}
                  </span>
                </div>
              </div>

              {action === "approve" ? (
                <>
                  <p style={{ fontSize: 13, color: "#52525B", margin: 0 }}>
                    Confirm shipment creation and pickup with Delhivery. Enter
                    the actual packed measurements. Courier tracking is verified
                    and saved in real-time.
                  </p>
                  <div className={styles.formGrid}>
                    <label className={styles.formLabel}>
                      Packed weight (grams) *
                      <input
                        type="number"
                        min="1"
                        className={styles.formInput}
                        placeholder="e.g. 500"
                        value={pkg.weightGrams}
                        disabled={busy}
                        onChange={(e) =>
                          setPkg({ ...pkg, weightGrams: e.target.value })
                        }
                      />
                    </label>
                    <label className={styles.formLabel}>
                      Length (cm) *
                      <input
                        type="number"
                        min="1"
                        className={styles.formInput}
                        placeholder="e.g. 20"
                        value={pkg.length}
                        disabled={busy}
                        onChange={(e) =>
                          setPkg({ ...pkg, length: e.target.value })
                        }
                      />
                    </label>
                    <label className={styles.formLabel}>
                      Width (cm) *
                      <input
                        type="number"
                        min="1"
                        className={styles.formInput}
                        placeholder="e.g. 15"
                        value={pkg.width}
                        disabled={busy}
                        onChange={(e) =>
                          setPkg({ ...pkg, width: e.target.value })
                        }
                      />
                    </label>
                    <label className={styles.formLabel}>
                      Height (cm) *
                      <input
                        type="number"
                        min="1"
                        className={styles.formInput}
                        placeholder="e.g. 10"
                        value={pkg.height}
                        disabled={busy}
                        onChange={(e) =>
                          setPkg({ ...pkg, height: e.target.value })
                        }
                      />
                    </label>
                  </div>
                </>
              ) : action === "cancel" ? (
                <>
                  <p style={{ fontSize: 13, color: "#52525B", margin: 0 }}>
                    This will cancel any scheduled courier shipment, restore
                    reserved inventory in real time, and request the Razorpay
                    refund to the customer&apos;s original payment method.
                  </p>
                  <label className={styles.formLabel}>
                    Reason for cancellation *
                    <input
                      type="text"
                      className={styles.formInput}
                      value={reason}
                      disabled={busy}
                      onChange={(e) => setReason(e.target.value)}
                    />
                  </label>
                </>
              ) : (
                /* Details view */
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    fontSize: 13,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "8px 0",
                      borderBottom: "1px solid #F1F1F4",
                    }}
                  >
                    <span style={{ color: "#71717A" }}>Courier / AWB:</span>
                    <span style={{ fontWeight: 500 }}>
                      {selected.courier || "Not assigned"} —{" "}
                      {selected.awb || "Not confirmed"}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "8px 0",
                      borderBottom: "1px solid #F1F1F4",
                    }}
                  >
                    <span style={{ color: "#71717A" }}>Shipping Status:</span>
                    <span style={{ fontWeight: 500 }}>
                      {selected.status.replaceAll("_", " ")}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "8px 0",
                      borderBottom: "1px solid #F1F1F4",
                    }}
                  >
                    <span style={{ color: "#71717A" }}>Pickup:</span>
                    <span style={{ fontWeight: 500 }}>
                      {selected.pickup?.status || "Not scheduled"}{" "}
                      {selected.pickup?.date ? `(${selected.pickup.date})` : ""}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "8px 0",
                      borderBottom: "1px solid #F1F1F4",
                    }}
                  >
                    <span style={{ color: "#71717A" }}>Inventory:</span>
                    <span style={{ fontWeight: 500 }}>
                      {selected.inventoryRestored
                        ? "Restored"
                        : "Committed / Reserved"}
                    </span>
                  </div>

                  {selected.refund && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "8px 0",
                        borderBottom: "1px solid #F1F1F4",
                      }}
                    >
                      <span style={{ color: "#71717A" }}>Refund Status:</span>
                      <span style={{ fontWeight: 500, color: "#EF4444" }}>
                        {selected.refund.status} ({money(selected.refund.amount / 100)})
                      </span>
                    </div>
                  )}

                  {selected.canReconcile && (
                    <button
                      type="button"
                      className={styles.dialogBtnSecondary}
                      onClick={() => void reconcileCourier(selected)}
                      disabled={busy}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        justifyContent: "center",
                      }}
                    >
                      <RefreshCw size={14} />
                      <span>Re-verify Courier Status with Delhivery</span>
                    </button>
                  )}

                  {selected.events && selected.events.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#18181B" }}>
                        Tracking Timeline:
                      </span>
                      <ol
                        style={{
                          margin: "8px 0 0",
                          paddingLeft: 18,
                          fontSize: 12,
                          color: "#52525B",
                        }}
                      >
                        {selected.events.map((ev, i) => (
                          <li key={i} style={{ marginBottom: 6 }}>
                            <strong>{ev.status}</strong> —{" "}
                            {new Date(ev.timestamp).toLocaleString("en-IN")}
                            <div style={{ color: "#71717A" }}>{ev.description}</div>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className={styles.dialogFooter}>
              {action === "approve" ? (
                <>
                  <button
                    type="button"
                    className={styles.dialogBtnSecondary}
                    onClick={closeModal}
                    disabled={busy}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    className={styles.dialogBtnPrimary}
                    onClick={() => void submitAction()}
                    disabled={busy}
                  >
                    {busy ? "Processing..." : "Confirm & Ship"}
                  </button>
                </>
              ) : action === "cancel" ? (
                <>
                  <button
                    type="button"
                    className={styles.dialogBtnSecondary}
                    onClick={closeModal}
                    disabled={busy}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    className={styles.dialogBtnDanger}
                    onClick={() => void submitAction()}
                    disabled={busy || !reason.trim()}
                  >
                    {busy ? "Processing..." : "Confirm Cancel & Refund"}
                  </button>
                </>
              ) : (
                <>
                  {selected.awb && (
                    <a
                      href={`/account/orders/${selected.orderId}/tracking`}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.dialogBtnSecondary}
                    >
                      View Tracking
                    </a>
                  )}
                  <a
                    href={`/admin/orders/${selected.orderId}`}
                    className={styles.dialogBtnSecondary}
                  >
                    Full Order
                  </a>
                  <button
                    type="button"
                    className={styles.dialogBtnPrimary}
                    onClick={closeModal}
                  >
                    Done
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
