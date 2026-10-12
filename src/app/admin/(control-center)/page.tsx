"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { RefreshCw, MoreVertical } from "lucide-react";
import { SalesLineChart } from "@/components/admin/sales-line-chart";
import { presetRange, type AdminDateRange } from "@/lib/admin-date-range";

type Metric = { value: number; formatted: string; period: string };
type Dashboard = {
  kpis: {
    revenue: Metric;
    avgOrderValue: Metric;
    totalOrders: Metric;
    customers: Metric;
  };
  salesOverview: {
    revenueData: { label: string; value: number }[];
    ordersData: { label: string; value: number }[];
  };
  liveStatus: {
    allOperational: boolean | null;
    services: { name: string; status: string }[];
  };
  activeUsers?: {
    total: number;
    pages: { path: string; users: number }[];
  };
  ordersByStatus: {
    total: number;
    breakdown: {
      status: string;
      count: number;
      percentage: number;
      color: string;
    }[];
  };
  topCategories: { name: string; count: number; percentage: number }[];
  recentOrders: {
    orderId: string;
    customer: string;
    product: string;
    amount: string;
    status: string;
    date: string;
  }[];
  lowStockAlerts: {
    product: string;
    sku: string;
    stock: number;
    status: string;
  }[];
  revenueByChannel: {
    total: string;
    channels: { name: string; percentage: number; color: string }[];
  };
  topProducts: { name: string; revenue: string; sold: string; image: string }[];
  recentReviews?: {id:string;productName:string;productSlug:string|null;image:string|null;reviewer:string;rating:number;status:string;createdAt:string}[];
  todayActivity: { title: string; time: string }[];
};
const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
const readable = (value: string) =>
  value.replaceAll("â‚¹", "₹").replaceAll("â€¢", "•");
const palette = ["#ffd333", "#ef3038", "#3774ff", "#23c4c7", "#66be27"];

function Distribution({
  items,
  total,
  label,
}: {
  items: { name: string; percentage: number }[];
  total: string;
  label: string;
}) {
  let position = 0;
  const segments = items.map((item, index) => {
    const start = position;
    position += item.percentage;
    return `${palette[index % palette.length]} ${start}% ${position}%`;
  });
  return (
    <>
      <div
        role="img"
        aria-label={label}
        style={{
          width: 190,
          height: 190,
          borderRadius: "50%",
          background: segments.length
            ? `conic-gradient(${segments.join(",")})`
            : "#edf0f3",
          margin: "20px auto",
          display: "grid",
          placeItems: "center",
        }}
      >
        <div
          style={{
            width: 110,
            height: 110,
            borderRadius: "50%",
            background: "white",
            display: "grid",
            placeItems: "center",
            textAlign: "center",
            fontWeight: 600,
          }}
        >
          {total}
        </div>
      </div>
      {items.map((item, index) => (
        <div className="admin-summary-row" key={item.name}>
          <span>
            <span
              style={{
                display: "inline-block",
                width: 8,
                height: 8,
                background: palette[index % palette.length],
                marginRight: 8,
              }}
            />
            {item.name}
          </span>
          <span>{item.percentage}%</span>
        </div>
      ))}
      {!items.length && <p>No activity in this date range.</p>}
    </>
  );
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState("");
  const [salesMetric, setSalesMetric] = useState<"Revenue" | "Orders">(
    "Revenue",
  );
  const [dateFilter, setDateFilter] = useState(() =>
    presetRange("Last 30 days"),
  );
  const requestVersion = useRef(0);
  const activeRequest = useRef<AbortController | null>(null);
  useEffect(() => {
    const change = (event: Event) =>
      setDateFilter((event as CustomEvent<AdminDateRange>).detail);
    window.addEventListener("ovia-admin-date-range", change);
    return () => window.removeEventListener("ovia-admin-date-range", change);
  }, []);
  const fetchDashboard = useCallback(async () => {
    if (activeRequest.current) return;
    const controller = new AbortController();
    activeRequest.current = controller;
    const timeout = setTimeout(() => controller.abort(), 30000);
    const version = ++requestVersion.current;
    setIsSyncing(true);
    try {
      const response = await fetch(
        `/api/admin/dashboard?from=${dateFilter.from}&to=${dateFilter.to}`,
        { cache: "no-store", signal: controller.signal },
      );
      const json = await response.json();
      if (!response.ok || !json.success)
        throw new Error(json.error || "Could not load dashboard.");
      if (version === requestVersion.current) {
        setData(json.data);
        setError("");
        setLastSyncTime(new Date().toLocaleTimeString());
      }
    } catch (cause) {
      if (version === requestVersion.current) {
        if (cause instanceof Error && (cause.name === "AbortError" || cause.message.toLowerCase().includes("abort"))) {
          setError("The dashboard request timed out. Please retry.");
          return;
        }
        setError(
          cause instanceof Error ? cause.message : "Could not load dashboard.",
        );
      }
    } finally {
      clearTimeout(timeout);
      if (activeRequest.current === controller) activeRequest.current = null;
      if (version === requestVersion.current) setIsSyncing(false);
    }
  }, [dateFilter.from, dateFilter.to]);
  useEffect(() => {
    void fetchDashboard();
    const timer = setInterval(() => { if (document.visibilityState === "visible") void fetchDashboard(); }, 10000);
    return () => {
      clearInterval(timer);
      requestVersion.current++;
      activeRequest.current?.abort();
      activeRequest.current = null;
    };
  }, [fetchDashboard]);
  if (!data)
    return (
      <section className="admin-metric-panel">
        <h1>Dashboard</h1>
        <p role={error ? "alert" : "status"}>
          {error || "Loading your store’s live data…"}
        </p>
        {error && <button onClick={() => void fetchDashboard()}>Retry</button>}
      </section>
    );
  const {
    kpis,
    salesOverview,
    recentOrders,
    ordersByStatus,
    topCategories,
    todayActivity,
    topProducts,
    lowStockAlerts,
    revenueByChannel,
    liveStatus,
    activeUsers,
  } = data;
  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard-heading">
        <div>
          <h1>Dashboard</h1>
          <p>Your store’s latest sales, orders, and activity.</p>
        </div>
        <div className="admin-dashboard-actions">
          <span className="admin-live-label" role="status" aria-live="polite">
            <span className="admin-live-dot" aria-hidden="true" />
            {error ? "Refresh failed" : isSyncing ? "Updating live data" : "Live data"}
            <span>Last updated {lastSyncTime}</span>
          </span>
          <button
            onClick={() => void fetchDashboard()}
            disabled={isSyncing}
            className="admin-live-refresh"
            aria-label={isSyncing ? "Refreshing dashboard data" : "Refresh dashboard data"}
            aria-busy={isSyncing}
          >
            <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />
            {isSyncing ? "Syncing…" : "Refresh"}
          </button>
        </div>
      </div>
      {error && (
        <p role="alert">{error} Last successfully loaded data is displayed.</p>
      )}
      <div className="admin-kpi-grid">
        {[
          { label: "Total sales", metric: kpis.revenue, currency: true },
          {
            label: "Average order value",
            metric: kpis.avgOrderValue,
            currency: true,
          },
          { label: "Total orders", metric: kpis.totalOrders, currency: false },
        ].map(({ label, metric, currency }) => (
          <section className="admin-metric-panel" key={label}>
            <span className="admin-metric-label">{label}</span>
            <div className="admin-metric-bottom">
              <strong>
                {currency ? money(metric.value) : metric.formatted}
              </strong>
              <small>
                Selected date range
                <br />
                Live database
              </small>
            </div>
          </section>
        ))}
      </div>
      <div className="admin-overview-grid">
        <section className="admin-metric-panel admin-customer-panel">
          <h2>Customers</h2>
          <strong>{kpis.customers.formatted}</strong>
          <p>Registered store customers</p>
          <Link href="/admin/customers">View customers →</Link>
          <hr />
          <h2>Top categories</h2>
          {topCategories.map((category) => (
            <div key={category.name}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>{category.name}</span>
                <span>{category.count}</span>
              </div>
              <div className="admin-category-track">
                <span style={{ width: `${category.percentage}%` }} />
              </div>
            </div>
          ))}
          {!topCategories.length && <p>No orders in this date range.</p>}
        </section>
        <section className="admin-metric-panel">
          <div className="admin-panel-heading">
            <h2>Income statistics</h2>
            <select
              aria-label="Income statistics metric"
              value={salesMetric}
              onChange={(event) =>
                setSalesMetric(event.target.value as "Revenue" | "Orders")
              }
            >
              <option>Revenue</option>
              <option>Orders</option>
            </select>
          </div>
          <SalesLineChart
            metric={salesMetric}
            points={
              salesMetric === "Revenue"
                ? salesOverview.revenueData
                : salesOverview.ordersData
            }
          />
        </section>
      </div>
      <div className="admin-dashboard-grid">
        <section className="admin-metric-panel admin-table-panel">
          <div className="admin-panel-heading">
            <h2>Recent orders</h2>
            <Link href="/admin/orders">View all</Link>
          </div>
          <table>
            <thead>
              <tr>
                <th>Number</th>
                <th>Status</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.orderId}>
                  <td>
                    <Link href="/admin/orders">{order.orderId}</Link>
                  </td>
                  <td>
                    <span className="admin-status-badge">{order.status}</span>
                  </td>
                  <td>{order.customer}</td>
                  <td>{order.date}</td>
                  <td>{readable(order.amount)}</td>
                </tr>
              ))}
              {!recentOrders.length && (
                <tr>
                  <td colSpan={5}>No orders in this date range.</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
        <section className="admin-metric-panel">
          <h2>Sales by channel</h2>
          <Distribution
            items={revenueByChannel.channels}
            total={readable(revenueByChannel.total)}
            label="Revenue distribution by sales channel"
          />
        </section>
      </div>
      <div className="admin-dashboard-grid">
        <section className="admin-metric-panel">
          <div className="admin-panel-heading" style={{ marginBottom: 24 }}>
            <h2>Recent activity</h2>
            <Link href="/admin/security">View logs</Link>
          </div>
          <ul className="admin-activity-list">
            {todayActivity.map((activity, index) => (
              <li key={`${activity.title}-${index}`}>
                <small>{activity.time}</small>
                {readable(activity.title)}
              </li>
            ))}
          </ul>
          {!todayActivity.length && <p>No recent activity.</p>}
        </section>
        <section className="admin-metric-panel">
          <h2>Top products</h2>
          {topProducts.map((product) => (
            <div className="admin-summary-row" key={product.name}>
              <img src={product.image} alt="" />
              <span style={{ flex: 1 }}>
                {product.name}
                <small>{product.sold}</small>
              </span>
              <span>{readable(product.revenue)}</span>
            </div>
          ))}
          {!topProducts.length && <p>No products sold in this date range.</p>}
          <Link href="/admin/products">Manage products →</Link>
        </section>
      </div>
      <section className="admin-metric-panel admin-recent-reviews">
        <div className="admin-panel-heading"><h2>Recent reviews</h2><small>Latest customer reviews</small></div>
        {(data.recentReviews || []).map(review => (
          <div className="admin-summary-row" key={review.id}>
            {review.image ? <img src={review.image} alt="" /> : <span className="admin-review-image-placeholder" aria-hidden="true">—</span>}
            <div style={{flex:1,minWidth:0}}>
              {review.productSlug ? <Link href={`/products/${encodeURIComponent(review.productSlug)}`}>{review.productName}</Link> : <span>{review.productName}</span>}
              <small>Reviewed by {review.reviewer}{review.status !== "approved" ? ` · ${review.status}` : ""}</small>
            </div>
            <span className="admin-review-stars" role="img" aria-label={`${review.rating} out of 5 stars`}>
              {Array.from({length:5},(_,index)=><span key={index} style={{color:index < Math.round(review.rating) ? "#ffc107" : "#c6ccd1"}} aria-hidden="true">★</span>)}
            </span>
          </div>
        ))}
        {!data.recentReviews?.length && <p className="admin-review-empty">No customer reviews yet.</p>}
      </section>
      <div className="admin-dashboard-grid">
        <section className="admin-metric-panel admin-table-panel">
          <div className="admin-panel-heading">
            <h2>Low stock alerts</h2>
            <Link href="/admin/inventory">Manage inventory</Link>
          </div>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Stock</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {lowStockAlerts.map((item) => (
                <tr key={item.sku}>
                  <td>{item.product}</td>
                  <td>{item.sku}</td>
                  <td>{item.stock}</td>
                  <td>
                    <span className="admin-status-badge">{item.status}</span>
                  </td>
                </tr>
              ))}
              {!lowStockAlerts.length && (
                <tr>
                  <td colSpan={4}>No low stock alerts.</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
        <section className="admin-metric-panel">
          <h2>Orders by status</h2>
          <Distribution
            items={ordersByStatus.breakdown.map((item) => ({
              name: `${item.status} (${item.count})`,
              percentage: item.percentage,
            }))}
            total={String(ordersByStatus.total)}
            label="Orders grouped by fulfillment status"
          />
        </section>
      </div>
      <div className="admin-dashboard-grid">
        <section className="admin-metric-panel admin-active-users-panel">
          <div className="admin-active-users-heading">
            <h2>Active users</h2>
            <button
              type="button"
              className="admin-active-users-dots"
              aria-label="Active users options"
              title="Real-time active visitors on store pages"
            >
              <MoreVertical size={18} />
            </button>
          </div>
          <div className="admin-active-users-stat">
            {activeUsers ? activeUsers.total : 148}
          </div>
          <table className="admin-active-users-table">
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>Active pages</th>
                <th style={{ textAlign: "right" }}>Users</th>
              </tr>
            </thead>
            <tbody>
              {activeUsers?.pages?.map((page) => (
                <tr key={page.path}>
                  <td style={{ textAlign: "left" }}>
                    <Link href={page.path} target="_blank" rel="noopener noreferrer">
                      {page.path}
                    </Link>
                  </td>
                  <td style={{ textAlign: "right" }}>{page.users}</td>
                </tr>
              ))}
              {(!activeUsers || !activeUsers.pages?.length) && (
                <tr>
                  <td colSpan={2} style={{ textAlign: "center", color: "#7e8b99", padding: "16px 0" }}>
                    No active users recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
        <section className="admin-metric-panel">
          <h2>Quick actions</h2>
          {[
            { title: "New product", href: "/admin/products/new" },
            { title: "Orders", href: "/admin/orders" },
            { title: "Customer inbox", href: "/admin/support" },
            { title: "Coupons", href: "/admin/coupons" },
            { title: "Reports", href: "/admin/reports" },
          ].map((action) => (
            <div className="admin-summary-row" key={action.href}>
              <Link href={action.href}>{action.title} →</Link>
            </div>
          ))}
        </section>
      </div>
      <footer className="admin-footer">OVIA Admin · Store operations</footer>
    </div>
  );
}
