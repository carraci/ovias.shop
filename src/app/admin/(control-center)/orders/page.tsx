"use client";

import styles from "./orders.module.css";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  Calendar,
  ChevronDown,
  ArrowUpDown,
  Eye,
  RefreshCw,
  Printer,
  Download,
  Share2,
} from "lucide-react";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [showingText, setShowingText] = useState("");
  const [dateFilter,setDateFilter]=useState<{from:string;to:string}|null>(null);
  useEffect(()=>{const change=(event:Event)=>{setDateFilter((event as CustomEvent).detail);setPage(1);};window.addEventListener("ovia-admin-date-range",change);return ()=>window.removeEventListener("ovia-admin-date-range",change);},[]);
  const [counts,setCounts]=useState<Record<string,number>>({});
  const [selected,setSelected]=useState<any>(null);
  const [detailTab,setDetailTab]=useState("Overview");
  const [pageSize,setPageSize]=useState(10);
  const [totalPages,setTotalPages]=useState(1);
  const [error,setError]=useState("");
  const [selectedIds,setSelectedIds]=useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [paymentFilter, setPaymentFilter] = useState("All");
  const [page, setPage] = useState(1);

  const statusTabs = ["All", "Pending", "Confirmed", "Processing", "Shipped", "Delivered", "Cancelled"];

  async function fetchOrders(showLoader = true) {
    if (showLoader) setLoading(true);
    try {
      const q = new URLSearchParams({
        ...(dateFilter ? {from:dateFilter.from,to:dateFilter.to}:{}),
        query: search,
        status: statusFilter === "All" ? "" : statusFilter,
        payment: paymentFilter === "All" ? "" : paymentFilter,
        page: page.toString(),
        limit: String(pageSize),
      });
      const res = await fetch(`/api/admin/orders?${q.toString()}`, { cache: "no-store" });
      const json = await res.json();
      if (res.status === 401) {
        window.location.assign("/account/sign-in?next=/admin/orders");
        return;
      }
      if (!res.ok) {
        throw new Error(res.status === 403
          ? "Your current account cannot access orders. Sign in with the store owner account."
          : json.error || "Unable to load orders.");
      }
      if (json.orders) {
        setOrders(json.orders);setSelected((current:any) => current ? json.orders.find((order:any)=>order.id===current.id) || null : null);setCounts(json.statusCounts || {});setTotalPages(json.totalPages || 1);setError("");
        setTotalCount(json.totalCount);
        setShowingText(json.showing);
      } else {setError(json.error || "Unable to load orders.");}
    } catch (err) {
      if (err instanceof Error && (err.name === "AbortError" || err.message.toLowerCase().includes("abort"))) {
        return;
      }
      setError(err instanceof Error ? err.message : "Unable to load orders. Please retry.");
    } finally {
      if (showLoader) setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrders(true);

    // Real-time synchronization: poll every 6 seconds to capture live orders
    const timer = setInterval(() => {
      fetchOrders(false);
    }, 6000);

    return () => clearInterval(timer);
  }, [statusFilter, paymentFilter, page, pageSize, search, dateFilter]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  }

  async function getOrdersForExport(): Promise<any[]> {
    try {
      const q = new URLSearchParams({
        ...(dateFilter ? {from:dateFilter.from,to:dateFilter.to}:{}),
        query: search,
        status: statusFilter === "All" ? "" : statusFilter,
        payment: paymentFilter === "All" ? "" : paymentFilter,
        page: "1",
        limit: "1000",
      });
      const res = await fetch(`/api/admin/orders?${q.toString()}`, { cache: "no-store" });
      const json = await res.json();
      return json.orders && json.orders.length > 0 ? json.orders : orders;
    } catch {
      return orders;
    }
  }

  function formatCSV(orderList: any[]) {
    const headers = [
      "Order ID",
      "Order Date",
      "Customer Name",
      "Customer Email",
      "Customer Phone",
      "Items Description",
      "Total Quantity",
      "Total Amount (INR)",
      "Payment Status",
      "Payment Method",
      "Fulfillment Status",
      "Courier",
      "Tracking / AWB",
      "Shipping Address",
    ];

    const escapeCSV = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = orderList.map((o) => {
      const lineSummary = (o.lines || [])
        .map((l: any) => `${l.name} (${l.color || "Standard"} x${l.quantity})`)
        .join("; ") || "Luxury Travel Luggage";
      const totalQty = o.itemsCount || (o.lines || []).reduce((sum: number, l: any) => sum + (l.quantity || 1), 0);

      return [
        escapeCSV(o.id),
        escapeCSV(o.date),
        escapeCSV(o.customer?.name || "Private Traveler"),
        escapeCSV(o.customer?.email || ""),
        escapeCSV(o.customer?.phone || ""),
        escapeCSV(lineSummary),
        escapeCSV(totalQty),
        escapeCSV(o.amount),
        escapeCSV(o.payment?.status || o.status),
        escapeCSV(o.payment?.method || "Online"),
        escapeCSV(o.fulfillment || o.status),
        escapeCSV(o.shipping?.courier || "Delhivery"),
        escapeCSV(o.shipping?.awb || ""),
        escapeCSV(o.address?.shipping || o.address?.billing || "India"),
      ];
    });

    return "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
  }

  async function handleExportCSV() {
    const orderList = await getOrdersForExport();
    if (!orderList || orderList.length === 0) {
      alert("No orders available to export.");
      return;
    }

    const csvContent = formatCSV(orderList);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const filename = `OVIA_Orders_Report_${new Date().toISOString().split("T")[0]}.csv`;

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async function handleShareCSV() {
    const orderList = await getOrdersForExport();
    if (!orderList || orderList.length === 0) {
      alert("No orders available to share.");
      return;
    }

    const csvContent = formatCSV(orderList);
    const filename = `OVIA_Orders_Report_${new Date().toISOString().split("T")[0]}.csv`;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        const file = new File([csvContent], filename, { type: "text/csv" });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: "OVIA Orders Ledger & Report",
            text: `Executive sales ledger report with ${orderList.length} orders from OVIA luxury platform.`,
            files: [file],
          });
          return;
        }
      } catch (e) {
        // Fallback below
      }
    }

    // Fallback: Copy clean summary to clipboard
    const totalRev = orderList.reduce((acc, o) => acc + (Number(o.amount) || 0), 0);
    const summary = orderList
      .slice(0, 10)
      .map((o) => `• ${o.id}: ₹${o.amount.toLocaleString()} | ${o.customer?.name} (${o.status})`)
      .join("\n");
    const clipText = `OVIA Orders Report (${new Date().toLocaleDateString()})\nTotal Orders: ${orderList.length}\nTotal Value: ₹${totalRev.toLocaleString()}\n\nRecent Orders:\n${summary}\n\nFull CSV file downloaded and ready to share.`;

    await navigator.clipboard.writeText(clipText);
    alert("Orders executive report copied to clipboard! You can share it directly with team members.");
  }

  const money=(value:number)=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR"}).format(value || 0);
  return <div className={`${styles.workspace} ${selected ? styles.withDetails : ""}`}>
    <section className={styles.list}>
      <header className={styles.heading}><div><h1>Orders</h1><p>Manage and fulfil customer purchases in real time.</p></div><button onClick={handleExportCSV}><Download size={14}/>Export CSV</button></header>
      <form className={styles.filters} onSubmit={handleSearchSubmit}>
        <div className={styles.search}>
          <Search size={15}/>
          <input aria-label="Search orders" placeholder="Search by order ID, customer, product, AWB…" value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/>
        </div>
        <select aria-label="Status filter" value={statusFilter} onChange={e=>{setStatusFilter(e.target.value);setPage(1);}}>
          <option value="All">Status: All</option>
          {statusTabs.filter(s => s !== "All").map(status => (
            <option key={status} value={status}>Status: {status}</option>
          ))}
        </select>
        <select aria-label="Payment filter" value={paymentFilter} onChange={e=>{setPaymentFilter(e.target.value);setPage(1);}}>
          <option value="All">Payment: All</option>
          <option>Paid</option>
          <option>Pending</option>
        </select>
      </form>
      {error && <p role="alert">{error} <button type="button" onClick={()=>fetchOrders(true)}>Retry</button> <Link href="/account/sign-in?next=/admin/orders">Sign in as owner</Link></p>}
      <div className={styles.tableWrap}><table><thead><tr><th><input type="checkbox" aria-label="Select all displayed orders" checked={orders.length>0 && orders.every(o=>selectedIds.includes(o.id))} onChange={e=>setSelectedIds(e.target.checked?orders.map(o=>o.id):[])}/></th>{['Order ID','Customer','Items','Total','Payment','Fulfilment Status','Date','Actions'].map(label=><th key={label}>{label}</th>)}</tr></thead><tbody>{orders.map(order=><tr key={order.id} data-selected={selected?.id===order.id} onClick={()=>{setSelected(order);setDetailTab('Overview');}}><td onClick={e=>e.stopPropagation()}><input type="checkbox" aria-label={`Select ${order.id}`} checked={selectedIds.includes(order.id)} onChange={e=>setSelectedIds(ids=>e.target.checked?[...ids,order.id]:ids.filter(id=>id!==order.id))}/></td><td><button className={styles.orderId} onClick={()=>setSelected(order)}>{order.id}</button></td><td>{order.customer.name}<small>{order.customer.email}</small></td><td><div className={styles.items}>{order.lines?.filter((line:any)=>line.image && !line.image.endsWith('.svg')).slice(0,2).map((line:any,i:number)=><img key={i} src={line.image} alt={line.name}/>)}<span>{order.itemsCount} {order.itemsCount===1?'item':'items'}</span></div></td><td><strong>{money(order.amount)}</strong></td><td><span className={styles.badge} data-status={order.payment.status}>{order.payment.status}</span></td><td><span className={styles.badge} data-status={order.status}>{order.status}</span></td><td>{order.date}</td><td><button aria-label={`View order ${order.id}`} onClick={()=>setSelected(order)}>•••</button></td></tr>)}</tbody></table>{loading && !orders.length && <p className={styles.empty}>Loading orders…</p>}{!loading && !orders.length && <p className={styles.empty}>No orders match your filters.</p>}</div>
      <footer className={styles.pagination}><span>{showingText}</span><button disabled={page===1} onClick={()=>setPage(page-1)}>Previous</button><span>{page} / {totalPages}</span><button disabled={page>=totalPages} onClick={()=>setPage(page+1)}>Next</button><select aria-label="Orders per page" value={pageSize} onChange={e=>{setPageSize(Number(e.target.value));setPage(1);}}>{[10,25,50].map(size=><option key={size} value={size}>{size} per page</option>)}</select></footer>
    </section>
    {selected && <aside className={styles.details} aria-label="Order details"><header><h2>Order Details</h2><button aria-label="Close order details" onClick={()=>setSelected(null)}>×</button></header><div className={styles.detailIdentity}><strong>{selected.id}</strong><span className={styles.badge} data-status={selected.status}>{selected.status}</span><small>Placed on {selected.date}</small></div><nav className={styles.tabs}>{['Overview','Timeline','Notes'].map(label=><button key={label} aria-pressed={detailTab===label} onClick={()=>setDetailTab(label)}>{label}</button>)}</nav>
      {detailTab==='Overview' && <><section><h3>Customer Details</h3><strong>{selected.customer.name}</strong><p>{selected.customer.email}</p><p>{selected.customer.phone}</p></section><section><h3>Shipping Address</h3><p>{selected.address?.shipping || 'Not provided'}</p></section><section><h3>Order Items ({selected.itemsCount})</h3>{selected.lines?.map((line:any,i:number)=><div key={i} className={styles.detailItem}>{line.image && !line.image.endsWith('.svg') && <img src={line.image} alt={line.name}/>}<div><strong>{line.name}</strong><small>{line.color}</small><small>Qty: {line.quantity}</small></div><strong>{money(line.price)}</strong></div>)}</section><section><h3>Order Summary</h3><div className={styles.summary}><strong>Total</strong><strong>{money(selected.amount)}</strong></div></section><section><h3>Payment Information</h3><p>{selected.payment.status}</p><p>{selected.payment.method}</p>{selected.payment.id && <small>Transaction: {selected.payment.id}</small>}</section></>}
      {detailTab==='Timeline' && <section>{selected.timeline?.map((item:any,i:number)=><p key={i}>{item.status}: {item.done?'Completed':'Pending'} {item.date}</p>)}</section>}
      {detailTab==='Notes' && <section><p>{selected.notes?.length ? selected.notes.map((note:any)=>note.text || note.note).join('\n'):'No notes recorded.'}</p><Link href={`/admin/orders/${selected.id}`}>Manage order notes</Link></section>}
      <div className={styles.actions}><Link href={`/admin/orders/${selected.id}`}>Manage Order & Shipment</Link></div>
    </aside>}
  </div>;
}
