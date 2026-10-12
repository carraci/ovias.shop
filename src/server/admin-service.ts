import { isLiveCustomer } from "@/lib/live-customer";
import { storedOrderSummary, buildStoredSalesReport } from "@/lib/admin-live-metrics";
import { verifiedShipment } from "./logistics";
import { catalog, transaction, readRepository, mongo, isDemo } from "./db";
import { products, type Product, type Department } from "@/lib/catalog";
import type { Order, User, ProductReview } from "@/lib/types";
import { recordAuditEvent } from "./admin-auth";
import { saveAlgoliaProduct, deleteAlgoliaProduct } from "@/lib/algolia";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import {inventoryStatus,lowStockThreshold} from "@/lib/inventory-stock";
import { getActiveUsersMetrics } from "./realtime-active-users";

export type OrderStatus =
  | "PLACED"
  | "PAYMENT_CONFIRMED"
  | "CONFIRMED"
  | "PROCESSING"
  | "PACKED"
  | "SHIPPED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURN_REQUESTED"
  | "RETURN_APPROVED"
  | "RETURN_RECEIVED"
  | "REFUNDED";

export const VALID_ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PLACED: ["PAYMENT_CONFIRMED", "CONFIRMED", "CANCELLED"],
  PAYMENT_CONFIRMED: ["CONFIRMED", "PROCESSING", "CANCELLED", "REFUNDED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["PACKED", "CANCELLED"],
  PACKED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["OUT_FOR_DELIVERY", "DELIVERED"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
  DELIVERED: ["RETURN_REQUESTED"],
  RETURN_REQUESTED: ["RETURN_APPROVED", "DELIVERED"],
  RETURN_APPROVED: ["RETURN_RECEIVED"],
  RETURN_RECEIVED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
};

export function canTransitionOrder(current: string, next: string): boolean {
  const normalizedCurrent = (current || "PLACED").toUpperCase().replace(/[\s-]+/g, "_") as OrderStatus;
  const normalizedNext = (next || "PLACED").toUpperCase().replace(/[\s-]+/g, "_") as OrderStatus;
  const allowed = VALID_ORDER_TRANSITIONS[normalizedCurrent] || [];
  return allowed.includes(normalizedNext);
}

export async function getDashboardOverview(range?: {from:string;to:string}) {
  const dashboardDb = (await mongo()).db(process.env.MONGODB_DB || "ovia");
  const [catalogProducts, { orders: storedOrders }, allCustomers, dbAuditLogs, reviews] = await Promise.all([
    catalog(),
    getAdminOrders({ limit: 1000, unpaginated: true }),
    dashboardDb.collection<Parameters<typeof isLiveCustomer>[0]>("users").find({}, { projection: {
      _id: 0, email: 1, isDemo: 1, isTest: 1, source: 1, environment: 1,
    } }).toArray().then(users => users.filter(isLiveCustomer)),
    getAdminAuditLogs(10),
    dashboardDb.collection<ProductReview>("reviews")
      .find({ rating: { $gte: 1, $lte: 5 } }, { projection: {
        _id: 0, id: 1, rating: 1, createdAt: 1, productSlug: 1, productSku: 1,
        productName: 1, productImage: 1, isAnonymous: 1, userName: 1, status: 1,
      } }).sort({ createdAt: -1 }).limit(6).toArray(),
  ]);
  const liveOrders = storedOrders.filter(order => !order.isDemo && (!range || (order.dateKey >= range.from && order.dateKey <= range.to)));
  const recentReviews = reviews.filter(review => Number.isFinite(review.rating) && review.rating >= 1 && review.rating <= 5)
      .sort((a,b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0,6)
      .map(review => {
        const product = catalogProducts.find(item => item.slug === review.productSlug || item.variants.some(variant => variant.sku === review.productSku));
        return {id:review.id,productName:product?.name || review.productName,productSlug:product?.slug || null,
          image:review.productImage || product?.image || null,reviewer:review.isAnonymous ? "Anonymous" : review.userName,
          rating:review.rating,status:review.status || "approved",createdAt:review.createdAt};
      });
  
  // Real live totals computed directly from database
  const totalOrdersCount = liveOrders.length;
  const liveRevenueSum = liveOrders.reduce((sum, o) => {
    return sum + (o.payment.status === "Paid" ? o.amount : 0);
  }, 0);
  const totalRevenueValue = liveRevenueSum;
  const totalCustomersCount = allCustomers.length;
  const avgOrderValue = totalOrdersCount > 0 ? Math.round(totalRevenueValue / totalOrdersCount) : 0;

  // Real low stock alerts based on actual catalog variant stock
  const dynamicLowStock = catalogProducts
    .map((p, idx) => {
      const totalStock = p.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) ?? 0;
      const mainVariant = p.variants?.[0];
      const status = inventoryStatus(totalStock,(p as any).lowStockThreshold);
      return {
        product: p.name,
        sku: mainVariant?.sku || `SKU-00${idx + 1}`,
        stock: totalStock,
        threshold: lowStockThreshold((p as any).lowStockThreshold),
        status,
      };
    })
    .filter((item) => item.status === "Low Stock" || item.status === "Out of Stock")
    .sort((a,b)=>(a.status===b.status ? a.stock-b.stock : a.status==="Low Stock" ? -1 : 1))
    .slice(0, 5);

  // Real activity stream from audit logs & actual recent orders
  const dynamicActivity = [
    ...dbAuditLogs.map((log: any) => ({
      type: log.action.toLowerCase().includes("order") ? "order" : log.action.toLowerCase().includes("inventory") ? "shipping" : "customer",
      title: `${log.action.replace(/_/g, " ")} (${log.resourceId})`,
      time: new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      icon: log.action.toLowerCase().includes("order") ? "cart" : "user",
    })),
    ...liveOrders.slice(0, 4).map((o) => ({
      type: o.status === "Delivered" ? "shipping" : o.payment.status === "Paid" ? "payment" : "order",
      title: `Order ${o.id} â€¢ ${o.customer.name} (â‚¹${o.amount.toLocaleString()})`,
      time: o.date,
      icon: "cart",
    })),
  ].slice(0, 6);

  // Real orders breakdown
  const deliveredCount = liveOrders.filter(o => o.status === "Delivered").length;
  const processingCount = liveOrders.filter(o => o.status === "Processing" || o.status === "Confirmed").length;
  const shippedCount = liveOrders.filter(o => o.status === "Shipped").length;
  const cancelledCount = liveOrders.filter(o => o.status === "Cancelled").length;
  const returnedCount = liveOrders.filter(o => o.status === "Returned" || o.status === "Refunded").length;

  const totalStatusOrders = liveOrders.length;
  const ordersBreakdown = totalStatusOrders === 0 ? [] : [
    { status: "Delivered", count: deliveredCount, percentage: Math.round((deliveredCount / totalStatusOrders) * 100), color: "#16A34A" },
    { status: "Processing", count: processingCount, percentage: Math.round((processingCount / totalStatusOrders) * 100), color: "#2563EB" },
    { status: "Shipped", count: shippedCount, percentage: Math.round((shippedCount / totalStatusOrders) * 100), color: "#06B6D4" },
    { status: "Cancelled", count: cancelledCount, percentage: Math.round((cancelledCount / totalStatusOrders) * 100), color: "#EF4444" },
    { status: "Returned", count: returnedCount, percentage: Math.round((returnedCount / totalStatusOrders) * 100), color: "#6B7280" },
  ].filter(b => b.count > 0);

  // Real Sales Overview: Group real revenue and order counts dynamically by order date
  const dateMap = new Map<string, { revenue: number; orders: number }>();
  for (const o of liveOrders) {
    const d = o.dateKey;
    const current = dateMap.get(d) || { revenue: 0, orders: 0 };
    if (o.payment.status === "Paid") {
      current.revenue += o.amount;
    }
    current.orders += 1;
    dateMap.set(d, current);
  }

  const revenueData = Array.from(dateMap.entries()).sort(([a],[b])=>a.localeCompare(b)).map(([label, val]) => ({
    label,
    value: val.revenue,
  }));
  const ordersData = Array.from(dateMap.entries()).sort(([a],[b])=>a.localeCompare(b)).map(([label, val]) => ({
    label,
    value: val.orders,
  }));

  // Real Top Products dynamically aggregated from actual order lines
  const productAgg = new Map<string, { name: string; revenue: number; quantity: number; image: string }>();
  for (const o of liveOrders) {
    for (const l of o.lines || []) {
      const cur = productAgg.get(l.name) || { name: l.name, revenue: 0, quantity: 0, image: l.image || "/media/luggage.svg" };
      cur.revenue += (l.price || 0) * (l.quantity || 1);
      cur.quantity += l.quantity || 1;
      productAgg.set(l.name, cur);
    }
  }
  const topProducts = Array.from(productAgg.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
    .map(p => ({
      name: p.name,
      revenue: `â‚¹${p.revenue.toLocaleString()}`,
      sold: `${p.quantity} sold`,
      image: p.image,
    }));

  // Real Top Categories
  const categoryAgg = new Map<string, number>();
  const productCategoryBySku = new Map(catalogProducts.flatMap(product => product.variants.map(variant => [variant.sku, product.category || "Uncategorized"] as const)));
  for (const o of liveOrders) {
    for (const l of o.lines || []) {
      const cat = productCategoryBySku.get(l.sku) || "Uncategorized";
      categoryAgg.set(cat, (categoryAgg.get(cat) || 0) + (l.quantity || 1));
    }
  }
  const totalCatCount = Array.from(categoryAgg.values()).reduce((a, b) => a + b, 0);
  const topCategories = Array.from(categoryAgg.entries()).map(([name, count]) => ({
    name,
    count,
    percentage: totalCatCount > 0 ? Math.round((count / totalCatCount) * 100) : 0,
    color: "#8E693E",
  }));

  // Real Revenue by Channel
  const channelMap = new Map<string, number>();
  for (const o of liveOrders) {
    const ch = o.payment.method.includes("Razorpay") ? "Website (Razorpay)" : o.payment.method.includes("PayPal") ? "PayPal Express" : "Website Direct";
    if (o.payment.status === "Paid") {
      channelMap.set(ch, (channelMap.get(ch) || 0) + o.amount);
    }
  }
  const channelTotal = Array.from(channelMap.values()).reduce((a, b) => a + b, 0);
  const revenueByChannel = {
    total: `â‚¹${totalRevenueValue.toLocaleString()}`,
    channels: Array.from(channelMap.entries()).map(([name, amt], idx) => ({
      name,
      percentage: channelTotal > 0 ? Math.round((amt / channelTotal) * 100) : 0,
      color: ["#8E693E", "#A88358", "#C6A47B", "#DEC5A5"][idx % 4],
    })),
  };

  // Sparkline data from real orders
  const sparklineOrders = ordersData.map(d => d.value);
  const sparklineRev = revenueData.map(d => d.value);

  return {
    kpis: {
      totalOrders: {
        value: totalOrdersCount,
        formatted: totalOrdersCount.toLocaleString(),
        changePercent: 0,
        period: "real-time live database",
        sparkline: sparklineOrders.length ? sparklineOrders : [totalOrdersCount],
      },
      revenue: {
        value: totalRevenueValue,
        formatted: `â‚¹${totalRevenueValue.toLocaleString()}`,
        changePercent: 0,
        period: "real-time live database",
        sparkline: sparklineRev.length ? sparklineRev : [totalRevenueValue],
      },
      customers: {
        value: totalCustomersCount,
        formatted: totalCustomersCount.toLocaleString(),
        changePercent: 0,
        period: "real-time live database",
        sparkline: [totalCustomersCount],
      },
      avgOrderValue: {
        value: avgOrderValue,
        formatted: `â‚¹${avgOrderValue.toLocaleString()}`,
        changePercent: 0,
        period: "real-time live database",
        sparkline: [avgOrderValue],
      },
    },
    liveStatus: {
      allOperational: null,
      lastChecked: new Date().toISOString(),
      services: [
        {name:"Store database",status:isDemo() ? "Local storage" : "Read verified"},
        {name:"Payments",status:"Health not checked"},
        {name:"Email",status:"Health not checked"},
        {name:"Shipping",status:"Health not checked"},
      ],
    },
    activeUsers: getActiveUsersMetrics(catalogProducts.map((p) => p.slug)),
    salesOverview: {
      unit: "INR",
      revenueData,
      ordersData,
    },
    ordersByStatus: {
      total: totalOrdersCount,
      breakdown: ordersBreakdown,
    },
    topCategories,
    recentOrders: liveOrders.slice(0, 5).map((o) => ({
      orderId: o.id.startsWith("#") ? o.id : `#${o.id.slice(0, 12)}`,
      customer: o.customer.name,
      product: o.lines[0]?.name || "Executive Travel Luggage",
      amount: `â‚¹${o.amount.toLocaleString()}`,
      status: o.status,
      date: o.date,
    })),
    lowStockAlerts: dynamicLowStock,
    revenueByChannel,
    customerGrowth: [],
    topProducts,
    recentReviews,
    todayActivity: dynamicActivity,
  };
}


export async function getAdminOrders(params: {
  query?: string;
  status?: string;
  payment?: string;
  shipping?: string;
  page?: number;
  limit?: number;
  unpaginated?: boolean;
  from?: string;
  to?: string;
}) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.max(1, Math.min(params.limit || 8, 50));

  // Query 100% real stored orders from database
  const dbOrders = await readRepository(async (repo) => {
    const rawOrders = (await repo.find<Order>("orders")).filter(order=>order.status!=="demo" && order.provider!=="demo");
    return rawOrders.map((stored) => {
      const o={...stored,shipping:verifiedShipment(stored)?stored.shipping:undefined};
      const isPaid = o.status === "paid";
      const isDelivered = o.shipping?.status === "DELIVERED";
      const displayStatus = isDelivered ? "Delivered" : o.status === "cancelled" ? "Cancelled" : ["SHIPPED","IN_TRANSIT","OUT_FOR_DELIVERY"].includes(o.shipping?.status || "") ? "Shipped" : o.status === "paid" ? "Confirmed" : "Pending";
      const totalAmount = o.total / 100;

      return {
        id: o.orderNumber || o.id,
        rawId: o.id,
        ownerId: o.userId || o.owner,
        isDemo: o.status === "demo",
        dateKey: new Date(o.createdAt).toLocaleDateString("en-CA", {timeZone:"Asia/Kolkata"}),
        customer: {
          name: o.address?.name || "Private Traveler",
          email: o.address?.email || "",
          phone: o.address?.phone || "",
          memberSince: new Date(o.createdAt).getFullYear().toString(),
        },
        itemsCount: (o.lines || []).reduce((acc, l) => acc + l.quantity, 0),
        amount: totalAmount,
        payment: {
          method: o.provider === "razorpay" ? "Razorpay" : o.provider === "paypal" ? "PayPal Express" : "Credit Card / UPI",
          status: isPaid ? "Paid" : o.status === "cancelled" ? "Cancelled" : "Pending",
          id: o.providerId || o.id,
          date: new Date(o.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
        },
        fulfillment: isPaid ? "Processing" : "Pending",
        shipping: {
          courier: (o.shipping as any)?.courier || "Not assigned",
          awb: (o.shipping as any)?.awb || "",
          status: (o.shipping as any)?.status || (o.shipping as any)?.statusCode || (isPaid ? "Processing" : "Order Placed"),
          statusCode: (o.shipping as any)?.statusCode || "",
          eta: (o.shipping as any)?.estimatedDelivery ? new Date((o.shipping as any).estimatedDelivery).toLocaleDateString("en-IN") : "Not confirmed",
          pickup: (o.shipping as any)?.pickup,
          labelUrl: (o.shipping as any)?.labelUrl || ((o.shipping as any)?.awb ? `/api/admin/orders/${o.id}/shipping-label` : undefined),
          events: (o.shipping as any)?.events || [],
        },
        status: displayStatus,
        date: new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
        lines: (o.lines || []).map((l) => ({
          name: l.name,
          sku: l.sku,
          color: l.color || "Standard",
          price: l.price / 100,
          quantity: l.quantity,
          image: l.image || "/media/luggage.svg",
        })),
        summary: storedOrderSummary(o),
        address: {
          shipping: o.address ? `${o.address.line1}, ${o.address.city}, ${o.address.region} - ${o.address.postalCode}` : "",
          billing: o.address ? `${o.address.line1}, ${o.address.city}, ${o.address.region} - ${o.address.postalCode}` : "",
        },
        timeline: [
          { status: "Order Placed", date: new Date(o.createdAt).toLocaleString(), done: true },
          { status: "Payment Confirmed", date: new Date(o.createdAt).toLocaleString(), done: isPaid },
          { status: "Shipment Created", date: (o.shipping as any)?.awb ? `AWB: ${(o.shipping as any).awb}` : "Pending", done: Boolean((o.shipping as any)?.awb) },
          { status: "Pickup", date: (o.shipping as any)?.pickup?.status || "Pending", done: Boolean((o.shipping as any)?.pickup) },
          { status: "In Transit", date: "Pending", done: ["IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED"].includes((o.shipping as any)?.status || "") },
          { status: "Delivered", date: "Pending", done: (o.shipping as any)?.status === "DELIVERED" || isDelivered },
        ],
        notes: [] as { author: string; note: string; date: string }[],
      };
    });
  });

  const allOrders = [...dbOrders].reverse();

  let filtered = allOrders;
  if (params.query) {
    const q = params.query.toLowerCase().trim();
    filtered = filtered.filter(
      (o) =>
        o.id.toLowerCase().includes(q) ||
        o.customer.name.toLowerCase().includes(q) ||
        o.customer.email.toLowerCase().includes(q) ||
        o.shipping.awb.toLowerCase().includes(q) ||
        o.lines.some((l) => l.name.toLowerCase().includes(q) || l.sku.toLowerCase().includes(q))
    );
  }

  if (params.status && params.status !== "All") {
    filtered = filtered.filter(
      (o) => o.status.toLowerCase() === params.status?.toLowerCase()
    );
  }

  if (params.payment && params.payment !== "All") {
    filtered = filtered.filter(
      (o) => o.payment.status.toLowerCase() === params.payment?.toLowerCase()
    );
  }

  if(params.from) filtered=filtered.filter(order=>order.dateKey>=params.from!);
  if(params.to) filtered=filtered.filter(order=>order.dateKey<=params.to!);
  const total = filtered.length;
  const startIndex = (page - 1) * limit;
  const paginated = filtered.slice(startIndex, startIndex + limit);

  return {
    statusCounts: dbOrders.reduce((counts, order) => {counts[order.status]=(counts[order.status] || 0)+1;return counts;}, {} as Record<string,number>),
    orders: params.unpaginated ? filtered : paginated,
    totalCount: total,
    filteredCount: filtered.length,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    showing: total === 0 ? "No orders found" : `Showing ${startIndex + 1}-${Math.min(startIndex + paginated.length, total)} of ${total} orders`,
  };
}


export async function getAdminOrderById(orderId: string) {
  const { orders } = await getAdminOrders({ limit: 500, unpaginated:true });
  const found = orders.find(
    (o) =>
      o.id.toLowerCase() === orderId.toLowerCase() ||
      (o as any).rawId?.toLowerCase() === orderId.toLowerCase() ||
      o.id.replace("#", "").toLowerCase() === orderId.toLowerCase()
  );
  if (found) return found;

  return transaction(async (repo) => {
    const raw = await repo.get<Order>("orders", orderId);
    if (!raw) return null;
    if(!verifiedShipment(raw))raw.shipping=undefined;
    const isPaid = raw.status === "paid";
    const totalAmount = raw.total / 100;
    return {
      id: raw.orderNumber || `#OV${raw.id.slice(0, 8).toUpperCase()}`,
      rawId: raw.id,
      customer: {
        name: raw.address?.name || "Customer",
        email: raw.address?.email || "",
        phone: raw.address?.phone || "",
        memberSince: new Date(raw.createdAt).getFullYear().toString(),
      },
      itemsCount: (raw.lines || []).reduce((acc, l) => acc + l.quantity, 0),
      amount: totalAmount,
      payment: {
        method: raw.provider === "razorpay" ? "Razorpay" : raw.provider.toUpperCase(),
        status: isPaid ? "Paid" : "Pending",
        id: raw.providerId || raw.id,
        date: new Date(raw.createdAt).toLocaleString("en-IN"),
      },
      fulfillment: isPaid ? "Processing" : "Pending",
      shipping: {
        courier: raw.shipping?.courier || "Not assigned",
        awb: raw.shipping?.awb || "",
        status: raw.shipping?.status || (isPaid ? "Processing" : "Order Placed"),
        statusCode: raw.shipping?.statusCode || "",
        eta: raw.shipping?.estimatedDelivery ? new Date(raw.shipping.estimatedDelivery).toLocaleDateString("en-IN") : "Not confirmed",
        pickup: raw.shipping?.pickup,
        labelUrl: raw.shipping?.labelUrl || (raw.shipping?.awb ? `/api/admin/orders/${raw.id}/shipping-label` : undefined),
        events: raw.shipping?.events || [],
      },
      status: raw.shipping?.status || raw.status,
      date: new Date(raw.createdAt).toLocaleDateString("en-IN"),
      lines: raw.lines || [],
      summary: storedOrderSummary(raw),
      address: {
        shipping: raw.address ? `${raw.address.line1}, ${raw.address.city}, ${raw.address.region} - ${raw.address.postalCode}` : "",
        billing: raw.address ? `${raw.address.line1}, ${raw.address.city}, ${raw.address.region} - ${raw.address.postalCode}` : "",
      },
      timeline: [
        { status: "Order Placed", date: new Date(raw.createdAt).toLocaleString(), done: true },
        { status: "Payment Confirmed", date: new Date(raw.createdAt).toLocaleString(), done: isPaid },
        { status: "Shipment Created", date: raw.shipping?.awb ? `AWB: ${raw.shipping.awb}` : "Pending", done: Boolean(raw.shipping?.awb) },
        { status: "Pickup", date: raw.shipping?.pickup?.status || "Pending", done: Boolean(raw.shipping?.pickup) },
        { status: "In Transit", date: "Pending", done: ["IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED"].includes(raw.shipping?.status || "") },
        { status: "Delivered", date: "Pending", done: raw.shipping?.status === "DELIVERED" },
      ],
      notes: [],
    };
  });
}

export async function transitionOrderStatus(params: {
  orderId: string;
  nextStatus: OrderStatus;
  actor: string;
  reason?: string;
}) {
  throw new Error("Manual courier and cancellation status changes are disabled. Use Shipping & Logistics for confirmed shipment approval or cancellation.");
}


export function resolveProductBrand(p: any): string {
  if (p.brand && typeof p.brand === "string" && p.brand.trim()) {
    return p.brand.trim();
  }
  const specBrand = p.specifications?.Brand || p.specifications?.brand;
  if (specBrand && typeof specBrand === "string" && specBrand.trim()) {
    return specBrand.trim();
  }
  if (p.collection && typeof p.collection === "string" && p.collection.trim()) {
    const col = p.collection.trim();
    if (!["luggage", "bags", "accessories"].includes(col.toLowerCase())) {
      if (["Safari", "Skybags", "Wildcraft", "OVIA Signature", "Original"].includes(col)) {
        return col;
      }
    }
  }
  return "OVIA";
}

export function normalizeProductCategory(category?: string, department?: string): string {
  const cat = (category || "").trim();
  if (!cat) {
    return department === "luggage" ? "Cabin Bags" : "Leather Bags";
  }
  const lower = cat.toLowerCase();
  if (lower === "duffle bags" || lower === "duffel bags") return "Duffel Bags";
  if (lower === "crossbodies" || lower === "crossbody bags") return "Crossbody Bags";
  if (lower === "totes" || lower === "tote bags") return "Tote Bags";
  return cat;
}

export async function getAdminProducts(params?: {
  query?: string;
  category?: string;
  status?: string;
  stock?: string;
}) {
  const cat = await catalog(true);
  let list = cat.map((p) => {
    const mainVariant = p.variants?.[0] || { price: 0, stock: 0, sku: "" };
    const totalStock = p.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) ?? (p.stock ?? 0);
    const status = totalStock === 0 ? "Out of Stock" : totalStock <= 15 ? "Low Stock" : "Active";
    const priceVal = typeof p.price === "number" ? p.price : mainVariant.price;
    const cleanPrice = typeof priceVal === "number" && !isNaN(priceVal) ? priceVal / 100 : 0;
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      sku: mainVariant.sku || (p as any).sku || `OV-${p.slug.toUpperCase().slice(0, 8)}`,
      category: normalizeProductCategory(p.category, p.department),
      subcategory: (p as any).subcategory || "",
      brand: resolveProductBrand(p),
      productType:(p as any).productType || "Physical Product",variantCount:p.variants.length,
      gender: (p as any).gender || "Unisex",
      price: cleanPrice,
      mrp: ((p as any).mrp ?? 0) / 100,
      cost: ((p as any).cost ?? 0) / 100,
      stock: totalStock,
      status: ["Draft","Archived"].includes((p as any).status) ? (p as any).status : "Active",
      collection: p.collection || "",
      updatedAt: (p as any).updatedAt || "",
      lowStockThreshold: (p as any).lowStockThreshold ?? 5,
      image: p.image || "",
      department: p.department,
      material: p.material,
      dimensions: p.dimensions,
      weight: p.weight,
      description: p.description || "",
          capacity: p.capacity || "",
          bulletPoints: p.features || [],
          deliveryTime: p.deliveryTime || "",
          maintenanceCare: p.maintenanceCare || "",
          sustainability: p.sustainability || "",
          returnPolicy: p.returnPolicy || "",
          productAdvisory: p.productAdvisory || {},
          freeShipping: p.freeShipping === true,
          shippingClass: p.shippingClass || "",
      shortDesc: (p as any).shortDescription || "",
          publishAt:(p as any).publishAt || null,oldPrice:((p as any).oldPrice || 0)/100,
      fullDesc: p.description || "",
      variants: p.variants?.map(v=>({...v,price:v.price/100})),
      gallery: p.gallery || (p.image ? [p.image] : []),
      tags: p.tags || [],
      ogImage: (p as any).ogImage || "",
      barcode: (p as any).barcode || "",
      allowBackorders: (p as any).allowBackorders === true,
      autoRestockOnCancellation: (p as any).autoRestockOnCancellation !== false,
    };
  });

  if (params?.query) {
    const q = params.query.toLowerCase();
    list = list.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
  }
  if (params?.category && params.category !== "All Categories") {
    list = list.filter((p) => p.category.toLowerCase().includes(params.category!.toLowerCase()));
  }
  if (params?.status && params.status !== "All Status") {
    list = list.filter((p) => p.status.toLowerCase() === params.status!.toLowerCase());
  }

  return list;
}

export async function getAdminProductById(id: string) {
  if (!isDemo()) {
    try {
      const client = await mongo();
      const db = client.db(process.env.MONGODB_DB || "ovia");
      const found = await db.collection("products").findOne(
        { $or: [{ id }, { slug: id }, { "variants.sku": id }] },
        { projection: { _id: 0 } }
      );
      if (found) {
        const p = found as unknown as Product;
        const mainVariant = p.variants?.[0] || { price: 0, stock: 0, sku: "" };
        const priceVal = typeof p.price === "number" ? p.price : mainVariant.price;
        const cleanPrice = typeof priceVal === "number" && !isNaN(priceVal) ? priceVal / 100 : 0;
        return {
          id: p.id,
          name: p.name,
          slug: p.slug,
          sku: mainVariant.sku || (p as any).sku || `OV-${p.slug.toUpperCase().slice(0, 8)}`,
          category: normalizeProductCategory(p.category, p.department),
          subcategory: (p as any).subcategory || "",
          brand: resolveProductBrand(p),
          gender: (p as any).gender || "Unisex",
          price: cleanPrice,
          sale: p.sale ? {...p.sale,price:p.sale.price/100} : undefined,
          specifications: p.specifications || {},
          mrp: ((p as any).mrp ?? 0) / 100,
          cost: ((p as any).cost ?? 0) / 100,
          stock: p.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) ?? (p.stock ?? 0),
          status: ["Draft","Archived"].includes((p as any).status) ? (p as any).status : "Active",
          collection: p.collection || "",
          lowStockThreshold: (p as any).lowStockThreshold ?? 5,
          updatedAt: (p as any).updatedAt || "",
          videoUrl: (p as any).videoUrl || "",
          identity: (p as any).identity || {},
          packageDimensions: (p as any).packageDimensions || {},
          image: p.image || "",
          department: p.department || "luggage",
          material: p.material || "",
          dimensions: p.dimensions || "",
          weight: p.weight || "",
          description: p.description || "",
          capacity: p.capacity || "",
          bulletPoints: p.features || [],
          deliveryTime: p.deliveryTime || "",
          maintenanceCare: p.maintenanceCare || "",
          sustainability: p.sustainability || "",
          returnPolicy: p.returnPolicy || "",
          productAdvisory: p.productAdvisory || {},
          freeShipping: p.freeShipping === true,
          shippingClass: p.shippingClass || "",
          shortDesc: (p as any).shortDescription || "",
          publishAt:(p as any).publishAt || null,oldPrice:((p as any).oldPrice || 0)/100,
          fullDesc: p.description || "",
          variants: (p.variants || []).map(v=>({...v,price:v.price/100})),
          gallery: p.gallery || (p.image ? [p.image] : []),
          tags: p.tags || [],
          metaTitle: (p as any).metaTitle || `${p.name} | OVIA Luxury`,
          primarySearchPhrase: (p as any).primarySearchPhrase || "",
          metaDescription: (p as any).metaDescription || (p.description ? p.description.slice(0, 160) : ""),
          searchTags: (p as any).searchTags || "",
          canonicalUrl: (p as any).canonicalUrl || `https://ovias.shop/products/${p.slug}`,
          indexing: (p as any).indexing || "index",
          ogTitle: (p as any).ogTitle || (p as any).metaTitle || `${p.name} | OVIA Luxury`,
          ogDescription: (p as any).ogDescription || (p as any).metaDescription || (p.description ? p.description.slice(0, 160) : ""),
          ogImage: (p as any).ogImage || "",
          imageAltMap: (p as any).imageAltMap || {},
          imageVariantAssignments: (p as any).imageVariantAssignments || {},
          autoSchema: (p as any).autoSchema !== false,
          aiProductSummary: (p as any).aiProductSummary || p.description || "",
          aiKeyFacts: (p as any).aiKeyFacts || "",
          barcode: (p as any).barcode || "",
          allowBackorders: (p as any).allowBackorders === true,
          autoRestockOnCancellation: (p as any).autoRestockOnCancellation !== false,
        };
      }
    } catch (e) {
      console.warn("[getAdminProductById] MongoDB query error:", e);
    }
  }

  const all = await getAdminProducts();
  return all.find((p) => p.id === id || p.slug === id || p.sku === id) || null;
}

export async function createAdminProduct(data: any, actor: string) {
  const name = String(data.name || "New Luxury Product").trim();
  const slugBase = (data.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")) || "luxury-item";
  const uniqueSuffix = Date.now().toString().slice(-4);
  const slug = `${slugBase}-${uniqueSuffix}`;
  const id = data.id || slug;
  const sku = data.sku ? String(data.sku).trim() : `OV-${slug.toUpperCase().slice(0, 12)}`;
  const price = data.price !== undefined && !isNaN(Number(data.price)) ? Math.round(Number(data.price)*100) : 0;
  const stock = data.stock !== undefined && !isNaN(Number(data.stock)) ? Number(data.stock) : 0;
  const category = data.category || "Cabin Bags";
  const catLower = category.toLowerCase();
  const department = (data.department || (catLower.includes("bag") ? "bags" : catLower.includes("access") ? "accessories" : "luggage")) as Department;
  const image = data.image || "";
  const desc = data.fullDesc || data.description || data.shortDesc || "";

  const variantsList = Array.isArray(data.variants) && data.variants.length > 0
      ? data.variants.map((v: any, idx: number) => ({
          sku: v.sku ? String(v.sku).trim() : `${sku}-${idx + 1}`,
          size: v.size || "",
          color: v.color || "Standard",
          hex: v.hex || "#333333",
          price: idx === 0 ? price : (v.price !== undefined && !isNaN(Number(v.price)) ? Math.round(Number(v.price)*100) : price),
          stock: v.stock !== undefined && !isNaN(Number(v.stock)) ? Number(v.stock) : stock,
          image: v.image || image,
        }))
      : [
          {
            sku,
            color: "Standard",
            hex: "#BFC2BE",
            price,
            stock,
            image,
          },
        ];

    const computedStock = variantsList.reduce((sum: number, v: any) => sum + (v.stock || 0), 0);

    const productDoc: any = {
      id,
      slug,
      name,
      collection: data.collection || "",
      videoUrl: data.videoUrl || "",
      identity: data.identity || {},
      packageDimensions: data.packageDimensions || {},
      department,
      category,
      subcategory: data.subcategory || "",
      brand: data.brand || "OVIA",productType:data.productType || "Physical Product",
      gender: data.gender || "Unisex",
      material: data.material || "",
      description: desc,
      features: Array.isArray(data.bulletPoints) ? data.bulletPoints : [],
      deliveryTime: data.deliveryTime || "",
      maintenanceCare: data.maintenanceCare || "",
      sustainability: data.sustainability || "",
      returnPolicy: data.returnPolicy || "",
      productAdvisory: data.productAdvisory || {},
      freeShipping: data.freeShipping === true,
      shippingClass: data.shippingClass || "",
      status: data.status || "Draft",
      storefrontPublished: data.status === "Active" || data.status === "Out of Stock",
      publishAt:data.publishAt || null,shortDescription:data.shortDescription || "",oldPrice:Math.round(Number(data.oldPrice || 0)*100),
      dimensions: data.dimensions || "",
      capacity: data.capacity || "",
      weight: data.weight || "",
      tags: Array.isArray(data.tags) ? data.tags : ["new-arrivals", department],
      variants: variantsList,
      colors: variantsList.map((v: any) => v.color),
      image,
      imageKind: "photograph",
      featured: true,
      gallery: Array.isArray(data.gallery) && data.gallery.length > 0 ? data.gallery : [image],
      price: variantsList[0]?.price || price,
      stock: computedStock,
      mrp: Math.round(Number(data.oldPrice ?? data.mrp ?? 0)*100),
      cost: data.cost ? Math.round(Number(data.cost)*100) : 0,
      // SEO & GEO fields
      metaTitle: data.metaTitle || `${name} | OVIA Luxury`,
      primarySearchPhrase: data.primarySearchPhrase || "",
      metaDescription: data.metaDescription || desc.slice(0, 160),
      searchTags: data.searchTags || "",
      canonicalUrl: data.canonicalUrl || `https://ovias.shop/products/${slug}`,
      indexing: data.indexing || "index",
      ogTitle: data.ogTitle || data.metaTitle || `${name} | OVIA Luxury`,
      ogDescription: data.ogDescription || data.metaDescription || desc.slice(0, 160),
      ogImage: data.ogImage ? String(data.ogImage).trim() : "",
      imageAltMap: data.imageAltMap || {},
      imageVariantAssignments: data.imageVariantAssignments || {},
      sale: data.sale ? {...data.sale,price:Math.round(Number(data.sale.price)*100)} : undefined,
      specifications: data.specifications || {},
      lowStockThreshold: Number(data.lowStockThreshold ?? 5),
      barcode: data.barcode ? String(data.barcode).trim() : "",
      allowBackorders: Boolean(data.allowBackorders),
      autoRestockOnCancellation: data.autoRestockOnCancellation !== false,
      autoSchema: data.autoSchema !== false,
      aiProductSummary: data.aiProductSummary || desc,
      aiKeyFacts: data.aiKeyFacts || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (!isDemo()) {
      const client = await mongo();
      const db = client.db(process.env.MONGODB_DB || "ovia");
      await db.collection("products").replaceOne(
        { id: productDoc.id },
        productDoc,
        { upsert: true }
      );
    } else {
      await transaction(async (repo) => {
        await repo.put("products", productDoc);
      });
    }

    // Sync to Algolia
    await saveAlgoliaProduct(productDoc);

    // Record Audit Event
    await recordAuditEvent({
      actor,
      action: "PRODUCT_CREATED",
      resource: "products",
      resourceId: productDoc.id,
      details: { name: productDoc.name, sku, price, stock: computedStock, category, variantsCount: variantsList.length },
    });

    try {
      revalidatePath("/", "layout");
      revalidatePath("/products");
      revalidatePath("/admin/products");
      revalidatePath("/admin/inventory");
    } catch {}

    return productDoc;
  }

  export async function updateAdminProduct(id: string, data: any, actor: string) {
    let existing: any = null;
    if (!isDemo()) {
      const client = await mongo();
      const db = client.db(process.env.MONGODB_DB || "ovia");
      existing = await db.collection("products").findOne({
        $or: [{ id }, { slug: id }, { "variants.sku": id }],
      });
    }

    if (!existing) {
      const all = await catalog();
      existing = all.find((p) => p.id === id || p.slug === id || p.variants?.some((v) => v.sku === id));
    }

    const updatedDoc: any = {
      ...(existing || {}),
      updatedAt: new Date().toISOString(),
    };

    if (data.name !== undefined) updatedDoc.name = String(data.name).trim();
    if (data.category !== undefined) updatedDoc.category = data.category;
    if (data.subcategory !== undefined) updatedDoc.subcategory = data.subcategory;
    if (data.brand !== undefined) {
      updatedDoc.brand = data.brand;

    }
    if (data.capacity !== undefined) updatedDoc.capacity = data.capacity;
    if(data.publishAt!==undefined)updatedDoc.publishAt=data.publishAt || null;
    if(data.shortDescription!==undefined)updatedDoc.shortDescription=String(data.shortDescription);
    if(data.oldPrice!==undefined)updatedDoc.oldPrice=Math.round(Number(data.oldPrice || 0)*100);
    if (data.bulletPoints !== undefined) updatedDoc.features = Array.isArray(data.bulletPoints) ? data.bulletPoints : [];
    if(data.sale!==undefined)updatedDoc.sale={...data.sale,price:Math.round(Number(data.sale.price)*100)};
    if(data.specifications!==undefined)updatedDoc.specifications=data.specifications;
    for(const field of ['maintenanceCare','sustainability','returnPolicy','productAdvisory','deliveryTime','freeShipping','shippingClass','status','tags','collection','videoUrl','identity','packageDimensions','lowStockThreshold','imageVariantAssignments','productType'])if(data[field] !== undefined)updatedDoc[field]=data[field];
    if(data.status !== undefined)updatedDoc.storefrontPublished=data.status==='Active'||data.status==='Out of Stock';
    if(data.stock !== undefined)updatedDoc.availability=Number(data.stock)>0?'In stock':'Out of stock';
    if (data.gender !== undefined) updatedDoc.gender = data.gender;
    if (data.material !== undefined) updatedDoc.material = data.material;
    if (data.dimensions !== undefined) updatedDoc.dimensions = data.dimensions;
    if (data.weight !== undefined) updatedDoc.weight = data.weight;
    if (data.image !== undefined) updatedDoc.image = data.image;
    if (data.gallery !== undefined) {
      updatedDoc.gallery = data.gallery;
      const allowed=new Set(data.gallery);
      const images={...(updatedDoc.images || {}),main:updatedDoc.image,gallery:data.gallery};
      for(const key of Object.keys(images))if(Array.isArray(images[key]))images[key]=images[key].filter((image:string)=>allowed.has(image));
      updatedDoc.images=images;
    }

    const desc = data.fullDesc ?? data.description ?? data.shortDesc;
    if (desc !== undefined) updatedDoc.description = desc;

    const price = data.price !== undefined && !isNaN(Number(data.price)) ? Math.round(Number(data.price)*100) : undefined;
    const stock = data.stock !== undefined && !isNaN(Number(data.stock)) ? Number(data.stock) : undefined;
    const sku = data.sku;

    if (price !== undefined) updatedDoc.price = price;
    if (stock !== undefined) updatedDoc.stock = stock;
    if (data.oldPrice !== undefined || data.mrp !== undefined) updatedDoc.mrp = Math.round(Number(data.oldPrice ?? data.mrp ?? 0)*100);
    if (data.cost !== undefined) updatedDoc.cost = Math.round(Number(data.cost)*100);

    // Update variant representation
    if (Array.isArray(data.variants) && data.variants.length > 0) {
      updatedDoc.variants = data.variants.map((v: any, idx: number) => {
        const vPrice = v.price !== undefined && !isNaN(Number(v.price)) ? Math.round(Number(v.price)*100) : undefined;
        return {
          sku: v.sku ? String(v.sku).trim() : `${sku || updatedDoc.sku || "SKU"}-${idx + 1}`,
          size: v.size || "",
          color: v.color || "Standard",
          hex: v.hex || "#333333",
          price: idx === 0 && price !== undefined ? price : (vPrice ?? price ?? updatedDoc.price ?? 0),
          stock: v.stock !== undefined && !isNaN(Number(v.stock)) ? Number(v.stock) : (stock ?? 0),
          image: v.image ?? updatedDoc.image ?? "",
        };
      });
      updatedDoc.colors = updatedDoc.variants.map((v: any) => v.color);
      updatedDoc.stock = updatedDoc.variants.reduce((sum: number, v: any) => sum + (v.stock || 0), 0);
      if (price !== undefined) {
        updatedDoc.price = price;
        if (updatedDoc.variants[0]) updatedDoc.variants[0].price = price;
      } else if (updatedDoc.variants[0]?.price !== undefined) {
        updatedDoc.price = updatedDoc.variants[0].price;
      }
    } else if (Array.isArray(updatedDoc.variants) && updatedDoc.variants.length > 0) {
      updatedDoc.variants = updatedDoc.variants.map((v: any, idx: number) => {
        if (idx === 0) {
          return {
            ...v,
            ...(sku ? { sku } : {}),
            ...(price !== undefined ? { price } : {}),
            ...(stock !== undefined ? { stock } : {}),
            ...(data.image ? { image: data.image } : {}),
          };
        }
        return v;
      });
      if (price !== undefined) {
        updatedDoc.price = price;
      }
    } else {
      updatedDoc.variants = [
        {
          sku: sku || updatedDoc.sku || `OV-${(updatedDoc.slug || "prod").toUpperCase().slice(0, 10)}`,
          color: "Standard",
          hex: "#333333",
          price: price !== undefined ? price : 0,
          stock: stock !== undefined ? stock : 0,
          image: updatedDoc.image || "",
        },
      ];
      if (price !== undefined) {
        updatedDoc.price = price;
      }
    }

    // SEO & GEO updates
    if (data.metaTitle !== undefined) updatedDoc.metaTitle = data.metaTitle;
    if (data.primarySearchPhrase !== undefined) updatedDoc.primarySearchPhrase = data.primarySearchPhrase;
    if (data.metaDescription !== undefined) updatedDoc.metaDescription = data.metaDescription;
    if (data.searchTags !== undefined) updatedDoc.searchTags = data.searchTags;
    if (data.canonicalUrl !== undefined) updatedDoc.canonicalUrl = data.canonicalUrl;
    if (data.indexing !== undefined) updatedDoc.indexing = data.indexing;
    if (data.ogTitle !== undefined) updatedDoc.ogTitle = data.ogTitle;
    if (data.ogDescription !== undefined) updatedDoc.ogDescription = data.ogDescription;
    if (data.ogImage !== undefined) updatedDoc.ogImage = data.ogImage ? String(data.ogImage).trim() : "";
    if (data.imageAltMap !== undefined) updatedDoc.imageAltMap = data.imageAltMap;
    if (data.autoSchema !== undefined) updatedDoc.autoSchema = data.autoSchema;
    if (data.aiProductSummary !== undefined) updatedDoc.aiProductSummary = data.aiProductSummary;
    if (data.aiKeyFacts !== undefined) updatedDoc.aiKeyFacts = data.aiKeyFacts;
    if (data.lowStockThreshold !== undefined) updatedDoc.lowStockThreshold = Number(data.lowStockThreshold);
    if (data.barcode !== undefined) updatedDoc.barcode = String(data.barcode).trim();
    if (data.allowBackorders !== undefined) updatedDoc.allowBackorders = Boolean(data.allowBackorders);
    if (data.autoRestockOnCancellation !== undefined) updatedDoc.autoRestockOnCancellation = Boolean(data.autoRestockOnCancellation);

  if (!isDemo()) {
    const client = await mongo();
    const db = client.db(process.env.MONGODB_DB || "ovia");
    const targetFilter = existing?._id ? { _id: existing._id } : { $or: [{ id }, { slug: id }] };
    delete updatedDoc._id;
    await db.collection("products").updateOne(
      targetFilter,
      { $set: updatedDoc },
      { upsert: true }
    );
  } else {
    await transaction(async (repo) => {
      await repo.put("products", updatedDoc);
    });
  }

  // Sync to Algolia
  await saveAlgoliaProduct(updatedDoc);

  // Record Audit Event
  await recordAuditEvent({
    actor,
    action: "PRODUCT_UPDATED",
    resource: "products",
    resourceId: id,
    details: { name: updatedDoc.name, price: updatedDoc.price, stock: updatedDoc.stock },
  });

  try {
    revalidatePath("/", "layout");
    revalidatePath("/products");
    revalidatePath(`/products/${updatedDoc.slug}`);
    if(existing?.slug && existing.slug!==updatedDoc.slug)revalidatePath(`/products/${existing.slug}`);
    revalidatePath("/admin/products");
    revalidatePath("/admin/inventory");
  } catch {}

  return updatedDoc;
}

export async function deleteAdminProduct(id: string, actor: string) {
  let deletedSlug = id;
  if (!isDemo()) {
    const client = await mongo();
    const db = client.db(process.env.MONGODB_DB || "ovia");
    const found = await db.collection("products").findOne({
      $or: [{ id }, { slug: id }, { "variants.sku": id }],
    });
    if (found?.slug) deletedSlug = found.slug;
    await db.collection("products").deleteOne({
      $or: [{ id }, { slug: id }, { "variants.sku": id }],
    });
  } else {
    await transaction(async (repo) => {
      await repo.remove("products", id);
    });
  }

  // Delete from Algolia
  await deleteAlgoliaProduct(id);
  if (deletedSlug !== id) {
    await deleteAlgoliaProduct(deletedSlug);
  }

  // Record Audit Event
  await recordAuditEvent({
    actor,
    action: "PRODUCT_DELETED",
    resource: "products",
    resourceId: id,
  });

  try {
    revalidatePath("/", "layout");
    revalidatePath("/products");
    revalidatePath(`/products/${deletedSlug}`);
    revalidatePath("/admin/products");
    revalidatePath("/admin/inventory");
  } catch {}

  return { success: true, id };
}

export async function getAdminCategories() {
  if (!isDemo()) {
    try {
      const client = await mongo();
      const db = client.db(process.env.MONGODB_DB || "ovia");
      const cats = await db.collection("categories").find({}).sort({ displayOrder: 1, name: 1 }).toArray();
      if (cats && cats.length > 0) {
        const prods = await db.collection("products").find({
          id: { $not: /^ovia-import-/ },
          sourceId: { $exists: false },
          importSources: { $exists: false },
        }, { projection: { category: 1, subcategory: 1, department: 1, tags: 1 } }).toArray();
        const counts: Record<string, number> = {};
        for (const p of prods) {
          const c = (p.category || "").toLowerCase().trim();
          const sub = (p.subcategory || "").toLowerCase().trim();
          if (c) counts[c] = (counts[c] || 0) + 1;
          if (sub && sub !== c) counts[sub] = (counts[sub] || 0) + 1;
          if (Array.isArray(p.tags)) {
            for (const t of p.tags) {
              const low = String(t).toLowerCase().trim();
              if (low && low !== c && low !== sub) counts[low] = (counts[low] || 0) + 1;
            }
          }
        }
        return cats
          .filter((cat: any) => {
            const name = String(cat.name || "").trim();
            return name && !/^(1+|a+|abcd|test|demo)$/i.test(name);
          })
          .map((cat: any) => {
          const catNameLower = (cat.name || "").toLowerCase().trim();
          const catSlugLower = (cat.slug || "").toLowerCase().trim();
          const prodCount = counts[catNameLower] ?? counts[catSlugLower] ?? 0;
          const catImg = cat.image || "";
          return {
            id: cat.id || String(cat._id),
            name: cat.name,
            slug: cat.slug || cat.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            description:cat.description || "",metaTitle:cat.metaTitle || "",metaDescription:cat.metaDescription || "",
            parent: cat.parent || null,
            image: catImg,
            productCount: prodCount,
            status: cat.status || "Active",
            displayOrder: cat.displayOrder || 10,
          };
        });
      }
      return [];
    } catch (e) {
      throw new Error("Could not load stored categories.", {cause:e});
    }
  }
  return [];

}

export async function createAdminCategory(data: { name: string; parent?: string | null; image?: string; slug?:string; description?:string; status?:string; metaTitle?:string; metaDescription?:string }, actor: string) {
  if(isDemo())throw new Error("A store database is required to save categories.");
  if(!data.name?.trim())throw new Error("Category name is required.");
  const id = `cat-${randomUUID().slice(0, 8)}`;
  const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const newCat = {
    id,
    name: data.name.trim(),
    slug: data.slug?.trim() || slug,
    description:data.description || "",metaTitle:data.metaTitle || "",metaDescription:data.metaDescription || "",
    parent: data.parent || null,
    image: data.image || "",
    productCount: 0,
    status: data.status === "Draft" ? "Draft" : "Active",
    displayOrder: 20,
    createdAt: new Date().toISOString(),
  };

  if (!isDemo()) {
    const client = await mongo();
    const db = client.db(process.env.MONGODB_DB || "ovia");
    await db.collection("categories").insertOne(newCat);
  }

  await recordAuditEvent({
    actor,
    action: "CATEGORY_CREATED",
    resource: "categories",
    resourceId: id,
    details: { name: newCat.name, parent: newCat.parent },
  });

  try {
    revalidatePath("/", "layout");
    revalidatePath("/bags");
    revalidatePath("/luggage");
    revalidatePath("/accessories");
    revalidatePath("/admin/categories");
  } catch {}

  return newCat;
}

export async function updateAdminCategory(id: string, data: any, actor: string) {
  if(isDemo())throw new Error("A store database is required to save categories.");
  if (!isDemo()) {
    const client = await mongo();
    const db = client.db(process.env.MONGODB_DB || "ovia");
    const updateDoc: any = {};
    if (data.name !== undefined) {
      updateDoc.name = data.name.trim();
      updateDoc.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    }
    if (data.parent !== undefined) updateDoc.parent = data.parent;
    if (data.status !== undefined) updateDoc.status = data.status;
    if (data.image !== undefined) updateDoc.image = data.image;
    for(const key of ["slug","description","metaTitle","metaDescription"])if(data[key] !== undefined)updateDoc[key]=String(data[key]).trim();

    await db.collection("categories").updateOne(
      { $or: [{ id }, { slug: id }] },
      { $set: updateDoc }
    );
  }

  await recordAuditEvent({
    actor,
    action: "CATEGORY_UPDATED",
    resource: "categories",
    resourceId: id,
    details: data,
  });

  try {
    revalidatePath("/", "layout");
    revalidatePath("/bags");
    revalidatePath("/luggage");
    revalidatePath("/accessories");
    revalidatePath("/admin/categories");
  } catch {}

  return { success: true };
}

export async function deleteAdminCategory(id: string, actor: string) {
  if (!isDemo()) {
    const client = await mongo();
    const db = client.db(process.env.MONGODB_DB || "ovia");
    await db.collection("categories").deleteOne({
      $or: [{ id }, { slug: id }],
    });
  }

  await recordAuditEvent({
    actor,
    action: "CATEGORY_DELETED",
    resource: "categories",
    resourceId: id,
  });

  try {
    revalidatePath("/", "layout");
    revalidatePath("/bags");
    revalidatePath("/luggage");
    revalidatePath("/accessories");
    revalidatePath("/admin/categories");
  } catch {}

  return { success: true };
}

export async function getAdminInventory() {
 const prods=await catalog();
 return transaction(async repo=>{
  const balances=await repo.find<any>('inventory');const logs=await repo.find<any>('inventoryMovements');
  return prods.flatMap(p=>p.variants.map(v=>{
   const balance=balances.find(b=>b.id===v.sku);const available=balance?.available ?? v.stock;
   const reserved=balance?.reserved || 0;
   return {id:'inv-'+v.sku,productId:p.id,name:p.name,sku:v.sku,image:v.image||p.image,warehouse:balance?.warehouse||'Unassigned',totalStock:available+reserved,reserved,available,lowStockThreshold:lowStockThreshold((p as any).lowStockThreshold),status:inventoryStatus(available,(p as any).lowStockThreshold),history:logs.filter(l=>l.sku===v.sku).sort((a,b)=>b.date.localeCompare(a.date)).map(l=>({type:l.reason,quantity:l.adjustment,date:l.date,reason:l.notes || l.reason}))};
  }));
 });
}

export async function adjustInventoryStock(params: {
  sku: string;
  adjustment: number;
  reason: "RESTOCK" | "SALE" | "RETURN" | "CANCELLATION" | "MANUAL_ADJUSTMENT" | "RESERVATION" | "RELEASE";
  notes?: string;
  actor: string;
}) {
  if(!Number.isInteger(params.adjustment)||params.adjustment===0)throw new Error('Enter a nonzero whole quantity.');
  await transaction(async repo=>{
   const prods=await repo.find<any>('products');
   const prod=prods.find(p=>p.variants?.some((v:any)=>v.sku===params.sku));
   if(!prod)throw new Error('Inventory SKU not found.');
   const variant=prod.variants.find((v:any)=>v.sku===params.sku);
   const existing=await repo.get<any>('inventory',params.sku);
   const balance={id:params.sku,available:variant.stock || 0,reserved:0,...existing};
   const reservedDelta=params.reason==='RESERVATION'?-params.adjustment:params.reason==='RELEASE'?-params.adjustment:0;
   const available=balance.available+params.adjustment;const reserved=(balance.reserved||0)+reservedDelta;
   if(available<0||reserved<0)throw new Error('Adjustment exceeds available or reserved stock.');
   await repo.put('inventory',{...balance,available,reserved,updatedAt:new Date().toISOString()});
   const variants=prod.variants.map((v:any)=>v.sku===params.sku?{...v,stock:available+reserved}:v);
   await repo.put('products',{...prod,variants,stock:variants.reduce((sum:number,v:any)=>sum+v.stock,0),availability:available>0?'In stock':'Out of stock',updatedAt:new Date().toISOString()});
   await repo.put('inventoryMovements',{id:randomUUID(),sku:params.sku,adjustment:params.adjustment,reason:params.reason,notes:params.notes || '',actor:params.actor,date:new Date().toISOString()});
  });

  await recordAuditEvent({
    actor: params.actor,
    action: "INVENTORY_ADJUSTMENT",
    resource: "inventory",
    resourceId: params.sku,
    details: {
      adjustment: params.adjustment,
      reason: params.reason,
      notes: params.notes,
    },
  });

  try {
    revalidatePath("/", "layout");
    revalidatePath("/products");
    revalidatePath("/admin/products");
    revalidatePath("/admin/inventory");
  } catch {}

  return { success: true, sku: params.sku, adjustedBy: params.adjustment, reason: params.reason };
}

export async function getAdminCustomers() {
  const { orders } = await getAdminOrders({ unpaginated: true });
  const dbUsers = await transaction(async (repo) => {
    const rawUsers = await repo.find<User>("users");
    return rawUsers.filter(isLiveCustomer).map((u) => {
      const userOrders = orders.filter(
        (o) => o.customer.email.toLowerCase() === u.email.toLowerCase() || o.ownerId === u.id
      );
      const totalSpent = userOrders.reduce((sum, o) => sum + (o.payment.status === "Paid" ? o.amount : 0), 0);
      const regDate = u.createdAt ? new Date(u.createdAt) : null;
      return {
        id: u.id,
        name: u.name || "Valued Traveler",
        email: u.email,
        phone: (u as any).phone || "",
        ordersCount: userOrders.length,
        totalSpent,
        joined: regDate?.toLocaleDateString("en-IN", { month: "short", year: "numeric" }),
        registered: regDate?.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
        country: (u as any).country || (userOrders[0] as any)?.shippingAddress?.country || (userOrders[0] as any)?.customer?.country || "India",
        group: (u as any).group || ((u as any).role === "OWNER" ? "Owner" : totalSpent > 50000 ? "Wholesaler" : "Default"),
        status: (u as any).role === "OWNER" ? "Owner" : "Active",
        avatar: (u as any).avatar || (u as any).image || "",
      };
    });
  });

  return dbUsers;
}

export async function getAdminCustomerById(customerId: string) {
  const savedUser=await transaction(async repo=>{
    const byId=await repo.get<any>("users",customerId);
    if(byId)return byId;
    const users=await repo.find<any>("users");return users.find(user=>user.email?.toLowerCase()===customerId.toLowerCase());
  });
  if (!savedUser) {
    return null;
  }

  const { orders: allOrders } = await getAdminOrders({ limit: 1000,unpaginated:true });
  const {resolveWishlistItems}=await import("@/lib/account-wishlist");
  const savedSkus=Array.isArray(savedUser.accountWishlist)?savedUser.accountWishlist:[];
  const wishlist=savedSkus.length?resolveWishlistItems(savedSkus,await catalog()):[];
  const customer={
    id:savedUser.id,
    name:savedUser.name||"Valued Traveler",
    email:savedUser.email,
    phone:savedUser.phone||"",
    totalSpent:0,
    ordersCount:0,
    joined:new Date(savedUser.createdAt).toLocaleDateString("en-IN",{month:"short",year:"numeric"}),
    status:savedUser.role==="OWNER"?"Owner":"Active",
    avatar:savedUser.avatar || savedUser.image || "",
    emailMarketing:savedUser.emailMarketing || "Subscribed",
  };
  const userOrders = allOrders.filter(
    (o) => o.customer.email.toLowerCase() === customer.email.toLowerCase() || o.ownerId === customer.id
  );
  customer.ordersCount=userOrders.length;
  customer.totalSpent=userOrders.reduce((sum,order)=>sum+(order.payment.status==="Paid"?order.amount:0),0);

  const sortedOrders = [...userOrders].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  const calculateTimeAgo = (dateStr?: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return "Today";
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 30) return `${diffDays} days ago`;
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? "s" : ""} ago`;
    const diffYears = Math.floor(diffDays / 365);
    return `${diffYears} year${diffYears > 1 ? "s" : ""} ago`;
  };

  const lastOrder = sortedOrders[0] ? {
    id: sortedOrders[0].id,
    date: sortedOrders[0].date,
    relative: calculateTimeAgo(sortedOrders[0].date),
    amount: sortedOrders[0].amount,
  } : null;

  const averageOrderValue = customer.ordersCount > 0 ? Math.round(customer.totalSpent / customer.ordersCount) : 0;
  const registered = savedUser.createdAt ? calculateTimeAgo(savedUser.createdAt) : "Recently";

  const resolvedAddresses = Array.isArray(savedUser.addresses) && savedUser.addresses.length > 0
    ? savedUser.addresses
    : userOrders[0]?.address
      ? [
          {
            id: "addr_1",
            name: customer.name,
            type: "Default Shipping",
            address: userOrders[0].address.shipping,
          },
          ...(userOrders[0].address.billing && userOrders[0].address.billing !== userOrders[0].address.shipping
            ? [{
                id: "addr_2",
                name: customer.name,
                type: "Billing",
                address: userOrders[0].address.billing,
              }]
            : []),
        ]
      : [];

  const latestNote = Array.isArray(savedUser.adminNotes) && savedUser.adminNotes.length > 0
    ? savedUser.adminNotes[savedUser.adminNotes.length - 1]?.note
    : savedUser.note || "";

  return {
    ...customer,
    clv: customer.totalSpent,
    averageOrderValue,
    registered,
    lastOrder,
    latestNote,
    addresses: resolvedAddresses,
    wishlist,
    orders: sortedOrders.map((o) => ({
      id: o.id,
      date: o.date,
      items: o.itemsCount,
      amount: `₹${o.amount.toLocaleString("en-IN")}`,
      rawAmount: o.amount,
      status: o.status,
    })),
    supportHistory: [] as any[],
    notes: Array.isArray(savedUser?.adminNotes)?savedUser.adminNotes:[],
  };
}

export async function getAdminReturns() {
  return transaction(async repo => {
    const tickets = await repo.find<any>("tickets");
    const orders = await repo.find<any>("orders");
    const decisions = await repo.find<any>("returns");
    const claims = tickets.filter(ticket => ticket.orderId && ["return", "refund"].includes(ticket.orderAction?.type)).flatMap(ticket => {
      const order = orders.find(order => order.id === ticket.orderId && order.provider !== "demo" && order.status !== "demo");
      if (!order) return [];
      const decision = decisions.find(row => row.id === ticket.id && row.ticketId === ticket.id);
      const confirmed = (order.refunds || []).filter((refund: any) => refund.status === "Refunded").reduce((sum: number, refund: any) => sum + refund.amount, 0);
      return [{id: ticket.id, ticketId: ticket.id, orderId: order.orderNumber || order.id, orderRawId: order.id,
        customer: ticket.name, email: ticket.email, amount: order.total / 100,
        paymentMethod: order.provider || "Unknown", reason: ticket.messages?.[0]?.text || ticket.subject,
        status: confirmed >= order.total && confirmed > 0 ? "Refunded" : (order.refunds || []).some((refund: any) => refund.status === "Processing") ? "Processing" : decision?.status || "Pending",
        date: ticket.createdAt, createdAt: ticket.createdAt, updatedAt: decision?.updatedAt || ticket.updatedAt,
        inspectionNote: decision?.inspectionNote, product: order.lines?.map((item: any) => item.name || item.sku).join(", ") }];
    });
    const linkedOrders = new Set(claims.map(row => row.orderRawId));
    const paymentRefunds = orders.filter(order => order.provider !== "demo" && order.status !== "demo" && !linkedOrders.has(order.id)).flatMap(order =>
      (order.refunds || []).filter((refund: any) => ["Processing", "Refunded"].includes(refund.status)).map((refund: any) => ({
        id: refund.id, orderId: order.orderNumber || order.id, orderRawId: order.id,
        customer: order.address?.name || "", email: order.address?.email || "",
        amount: refund.amount / 100, paymentMethod: order.provider, reason: refund.reason || "Payment refund",
        status: refund.status, date: refund.requestedAt, createdAt: refund.requestedAt,
        product: order.lines?.map((item: any) => item.name || item.sku).join(", "),
      })));
    return [...claims, ...paymentRefunds].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  });
}

export async function updateReturnStatus(params: { returnId: string; status: string; reason?: string; actor: string }) {
  const { ApiError } = await import("./http");
  if (!["Approved", "Rejected"].includes(params.status)) throw new ApiError(400, "Refunds must be issued and verified through Payments. A manual status change cannot disburse money.");
  const result = await transaction(async repo => {
    const ticket = await repo.get<any>("tickets", params.returnId);
    if (!ticket?.orderId || !["return", "refund"].includes(ticket.orderAction?.type)) throw new ApiError(404, "Customer return request not found.");
    const order = await repo.get<any>("orders", ticket.orderId);
    if (!order || order.provider === "demo") throw new ApiError(400, "A stored payment order is required.");
    if ((order.refunds || []).some((refund: any) => ["Processing", "Refunded"].includes(refund.status))) throw new ApiError(409, "This order already has a refund. Review its provider status in Payments.");
    const updated = {id: ticket.id, ticketId: ticket.id, orderRawId: order.id, status: params.status, inspectionNote: params.reason || "", updatedAt: new Date().toISOString()};
    await repo.put("returns", updated);
    await repo.put("tickets", {...ticket, status: params.status === "Approved" ? "In Review" : "Resolved", updatedAt: updated.updatedAt, messages: [...(ticket.messages || []), {id: randomUUID(), author: "support", text: `Your ${ticket.orderAction.type} request was ${params.status.toLowerCase()}. ${params.reason || ""}${params.status === "Approved" ? " Payment provider processing is still required; this approval is not confirmation that money has been refunded." : ""}`, createdAt: updated.updatedAt}]});
    return updated;
  });
  await recordAuditEvent({actor: params.actor, action: "RETURN_STATUS_UPDATE", resource: "returns", resourceId: params.returnId, details: {status: params.status, reason: params.reason}});
  return {success: true, returnId: params.returnId, status: params.status, return: result};
}

export async function getAdminPayments() {
  const { orders } = await getAdminOrders({ unpaginated: true });
  return orders.map((o) => ({
    id: o.payment.id || `pay_${o.id}`,
    orderId: o.id,
    customer: o.customer.name,
    provider: o.payment.method.includes("Razorpay") ? "Razorpay" : o.payment.method.includes("PayPal") ? "PayPal" : "Online Payment",
    method: o.payment.method,
    amount: o.amount,
    status: o.payment.status,
    date: o.payment.date,
  }));
}

export async function getAdminTransactions() {
  const { orders } = await getAdminOrders({ unpaginated: true });
  return orders.map((o, idx) => {
    const rawMethod = o.payment.method || "";
    const methodClean = rawMethod.includes("Razorpay")
      ? "Razorpay"
      : rawMethod.includes("PayPal")
        ? "Paypal"
        : rawMethod.includes("Stripe")
          ? "Stripe"
          : idx % 3 === 0
            ? "Razorpay"
            : idx % 3 === 1
              ? "Paypal"
              : "Wise";
    return {
      id: `#${73423 + idx}`,
      rawId: o.payment.id || o.rawId,
      orderId: o.id.startsWith("#") ? o.id : `#${o.id}`,
      amount: o.amount,
      method: methodClean,
      mail: o.customer.email || "customer@example.com",
      customer: o.customer.name,
      status: o.payment.status === "Paid" ? "Paid" : o.payment.status === "Cancelled" ? "Paid" : "Pending",
      date: o.date,
      receiptUrl: `/api/admin/orders/${o.rawId}/receipt`,
    };
  });
}

export async function getAdminAbandonedCarts() {
  return await transaction(async (repo) => {
    const carts = await repo.find<any>("carts");
    const catalogProducts = await catalog(true);
    const priceMap = new Map<string, number>();
    for (const p of catalogProducts) {
      for (const v of p.variants) {
        priceMap.set(v.sku, v.price || p.price || 0);
      }
    }
    const users = await repo.find<any>("users");
    const userMap = new Map<string, any>(users.map((u: any) => [u.id, u]));

    const activeCarts = carts.filter((c: any) => Array.isArray(c.lines) && c.lines.length > 0);
    return activeCarts.map((c: any, idx: number) => {
      const user = userMap.get(c.userId || c.owner);
      const itemCount = c.lines.reduce((acc: number, l: any) => acc + (l.quantity || 1), 0);
      const totalPaise = c.lines.reduce((acc: number, l: any) => {
        const price = priceMap.get(l.sku) || l.price || 2450000;
        return acc + price * (l.quantity || 1);
      }, 0);
      const amount = totalPaise > 100000 ? Math.round(totalPaise / 100) : totalPaise;
      const cartDate = c.updatedAt || c.createdAt || new Date(Date.now() - (idx + 1) * 3600000 * 24).toISOString();
      return {
        id: `#${73423 + idx}`,
        cartId: c.id,
        customer: user?.name ? user.name : `Customer ${idx + 1}`,
        email: user?.email || "customer@example.com",
        itemsCount: itemCount,
        itemsText: `${itemCount} pcs`,
        lines: c.lines,
        amount,
        date: new Date(cartDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
        rawDate: cartDate,
        paymentStatus: "Pending",
        receivedStatus: "Unreceived",
      };
    });
  });
}

export async function getAdminShipping() {
  const { orders } = await getAdminOrders({ unpaginated: true });
  return orders
    .filter((o) => o.shipping && (o.shipping.awb || o.shipping.status))
    .map((o) => ({
      orderId: o.id,
      awb: o.shipping.awb,
      courier: o.shipping.courier,
      pickup: o.date,
      status: o.shipping.status,
      eta: o.shipping.eta,
      lastUpdate: `${o.shipping.status} - ${o.shipping.courier}`,
    }));
}

export async function getAdminCoupons() {
  return transaction(repo => repo.find<any>("coupons"));
}

export async function getAdminCouponById(idOrCode: string) {
  if (!isDemo()) {
    const client = await mongo();
    const db = client.db(process.env.MONGODB_DB || "ovia");
    const found = await db.collection("coupons").findOne({
      $or: [{ id: idOrCode }, { code: idOrCode.toUpperCase() }],
    }, { projection: { _id: 0 } });
    return found;
  }
  return transaction(async (repo) => {
    const all = await repo.find<any>("coupons");
    return all.find((c) => c.id === idOrCode || c.code?.toUpperCase() === idOrCode.toUpperCase()) || null;
  });
}

export async function createAdminCoupon(data: any, actor: string) {
  const code = String(data.code || "").trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
  if (!code) throw new Error("Coupon code is required.");

  const id = `cpn-${randomUUID()}`;
  const rawType = String(data.discountType || "percentage").toLowerCase();
  const discountType = rawType === "free_shipping" || rawType === "free shipping" ? "free_shipping" : rawType === "fixed" ? "fixed" : "percentage";
  let value = Number(data.value || 0);
  if (discountType === "free_shipping") {
    value = 0;
  } else if (!Number.isFinite(value) || value <= 0 || (discountType === "percentage" && value > 100)) {
    throw new Error("Enter a positive discount value; percentages cannot exceed 100%.");
  }

  let endDate = String(data.endDate || "").trim();
  if (endDate) {
    const expiry = Date.parse(`${endDate.slice(0, 10)}T23:59:59.999+05:30`);
    if (!Number.isFinite(expiry)) {
      endDate = "";
    }
  }

  const rawStatus = String(data.status || "Enabled").trim();
  const normalizedStatus = ["enabled", "active"].includes(rawStatus.toLowerCase()) ? "Active" : "Inactive";
  const minOrder = Number(data.minOrder || 0);
  const usageLimit = data.usageLimit ? Number(data.usageLimit) : undefined;
  const onlyRegistered = Boolean(data.onlyRegistered);

  const couponDoc = {
    id,
    code,
    description: String(data.description || `${code} promotional privilege`).trim(),
    discountType,
    value,
    minOrder,
    usageLimit,
    usedCount: 0,
    oneTimePerUser: true,
    onlyRegistered,
    usedBy: [] as string[],
    status: normalizedStatus,
    startDate: data.startDate || new Date().toISOString().split("T")[0],
    endDate: endDate || undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (!isDemo()) {
    const client = await mongo();
    const db = client.db(process.env.MONGODB_DB || "ovia");
    const existing = await db.collection("coupons").findOne({ code });
    if (existing) {
      throw new Error(`Coupon with code "${code}" already exists.`);
    }
    await db.collection("coupons").insertOne(couponDoc);
  } else {
    await transaction(async (repo) => {
      await repo.put("coupons", couponDoc);
    });
  }

  await recordAuditEvent({
    actor,
    action: "COUPON_CREATED",
    resource: "coupons",
    resourceId: code,
    details: { code, discountType, value, minOrder, oneTimePerUser: true },
  });

  return couponDoc;
}

export async function updateAdminCoupon(idOrCode: string, patch: any, actor: string) {
  let updated: any = null;
  const updateFields: any = { updatedAt: new Date().toISOString() };
  if (patch.status !== undefined) {
    const rawStatus = String(patch.status).toLowerCase();
    updateFields.status = ["enabled", "active"].includes(rawStatus) ? "Active" : "Inactive";
  }
  if (patch.code !== undefined) updateFields.code = String(patch.code).trim().toUpperCase();
  if (patch.description !== undefined) updateFields.description = patch.description;
  if (patch.discountType !== undefined) {
    const rawType = String(patch.discountType).toLowerCase();
    updateFields.discountType = rawType.includes("shipping") ? "free_shipping" : rawType === "fixed" ? "fixed" : "percentage";
  }
  if (patch.value !== undefined) updateFields.value = Number(patch.value);
  if (patch.minOrder !== undefined) updateFields.minOrder = Number(patch.minOrder);
  if (patch.maxDiscount !== undefined) updateFields.maxDiscount = Number(patch.maxDiscount);
  if (patch.usageLimit !== undefined) updateFields.usageLimit = patch.usageLimit ? Number(patch.usageLimit) : null;
  if (patch.onlyRegistered !== undefined) updateFields.onlyRegistered = Boolean(patch.onlyRegistered);
  if (patch.startDate !== undefined) updateFields.startDate = patch.startDate;
  if (patch.endDate !== undefined) updateFields.endDate = patch.endDate;

  if (!isDemo()) {
    const client = await mongo();
    const db = client.db(process.env.MONGODB_DB || "ovia");
    const filter = { $or: [{ id: idOrCode }, { code: idOrCode.toUpperCase() }] };
    const existing = await db.collection("coupons").findOne(filter);
    if (!existing) throw new Error("Coupon not found.");

    await db.collection("coupons").updateOne(filter, { $set: updateFields });
    updated = await db.collection("coupons").findOne(filter);
  } else {
    await transaction(async (repo) => {
      const existing = await repo.get<any>("coupons", idOrCode);
      if (!existing) throw new Error("Coupon not found.");
      updated = { ...existing, ...updateFields, updatedAt: new Date().toISOString() };
      await repo.put("coupons", updated);
    });
  }

  await recordAuditEvent({
    actor,
    action: "COUPON_UPDATED",
    resource: "coupons",
    resourceId: idOrCode,
    details: patch,
  });

  return updated;
}

export async function deleteAdminCoupon(idOrCode: string, actor: string) {
  if (!isDemo()) {
    const client = await mongo();
    const db = client.db(process.env.MONGODB_DB || "ovia");
    await db.collection("coupons").deleteOne({
      $or: [{ id: idOrCode }, { code: idOrCode.toUpperCase() }],
    });
  } else {
    await transaction(async (repo) => {
      await repo.remove("coupons", idOrCode);
    });
  }

  await recordAuditEvent({
    actor,
    action: "COUPON_DELETED",
    resource: "coupons",
    resourceId: idOrCode,
    details: { idOrCode },
  });

  return { success: true };
}

export async function recordCouponUsage(code: string, customerEmail?: string, userId?: string) {
  if (!code) return;
  const cleanCode = code.trim().toUpperCase();
  const normalizedEmail = customerEmail?.trim().toLowerCase();

  try {
    if (!isDemo()) {
      const client = await mongo();
      const db = client.db(process.env.MONGODB_DB || "ovia");
      const updateOps: any = {
        $inc: { usedCount: 1 },
        $set: { updatedAt: new Date().toISOString() },
      };
      if (normalizedEmail) {
        updateOps.$addToSet = { usedBy: normalizedEmail };
      }
      await db.collection("coupons").updateOne({ code: cleanCode }, updateOps);
    } else {
      await transaction(async (repo) => {
        const found = (await repo.find<any>("coupons", { code: cleanCode }))[0];
        if (found) {
          const usedBy = Array.isArray(found.usedBy) ? [...found.usedBy] : [];
          if (normalizedEmail && !usedBy.includes(normalizedEmail)) {
            usedBy.push(normalizedEmail);
          }
          await repo.put("coupons", {
            ...found,
            usedCount: (found.usedCount || 0) + 1,
            usedBy,
            updatedAt: new Date().toISOString(),
          });
        }
      });
    }
  } catch (err) {
    console.error("[recordCouponUsage] Error recording coupon usage:", err);
  }
}

export async function getAdminMarketing() {
  return (await import("./campaigns")).readCampaigns();
}

export async function getAdminSupportTickets() {
  return await transaction(async (repo) => {
    const rawContact = await repo.find<any>("contact");
    if (!rawContact || !rawContact.length) return [];
    return rawContact.map((c) => ({
      id: `TCK-${(c.id || "").slice(0, 8).toUpperCase()}`,
      customer: c.name || "Customer",
      email: c.email || "support@ovia.luxury",
      subject: c.message ? (c.message.length > 50 ? `${c.message.slice(0, 47)}...` : c.message) : "Client Inquiry",
      category: "Inquiry",
      priority: "Normal",
      status: c.status === "resolved" ? "Resolved" : "Open",
      createdAt: c.createdAt || new Date().toISOString(),
      assigned: "Shop Owner",
      messages: [
        { sender: "customer", text: c.message || "No content", time: new Date(c.createdAt || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
      ],
    }));
  });
}

export async function getAdminIntegrations() {
  const { getAdminIntegrationsList } = await import("./integrations-service");
  return await getAdminIntegrationsList();
}

export async function testAdminIntegration(id: string, actor: string) {
  const { testIntegrationConnection } = await import("./integrations-service");
  return await testIntegrationConnection(id, actor);
}

export async function updateAdminIntegration(id: string, config: any, actor: string) {
  const { saveStoredIntegrationSettings, getAdminIntegrationsList } = await import("./integrations-service");
  await saveStoredIntegrationSettings(id, config, actor);
  const all = await getAdminIntegrationsList();
  return all.find((item) => item.id === id);
}

export async function disconnectAdminIntegration(id: string, actor: string) {
  const { disconnectIntegration } = await import("./integrations-service");
  return await disconnectIntegration(id, actor);
}

export async function getAdminAuditLogs(limitCount = 25) {
  const client = await mongo();
  return client.db(process.env.MONGODB_DB || "ovia").collection("audit")
    .find({}, { projection: { _id: 0 } }).sort({ timestamp: -1 })
    .limit(Math.max(1, Math.floor(limitCount))).toArray();
}

/**
 * AI Admin Copilot query handler
 * Processes natural language questions from the shop owner about real store metrics!
 */
export async function queryAiCopilot(question: string) {
  const {askCopilot}=await import("./ai-copilot");
  return {answer:await askCopilot({question,messages:[]}),metrics:{}};
}

export async function getAdminReports(type: string = "sales", range: string = "last_30_days") {
  const [orders,products]=await Promise.all([transaction(repo=>repo.find<Order>("orders")),catalog(true)]);
  return buildStoredSalesReport(orders,products,type,range);
}

export async function getAdminSettings() {
  const saved=await transaction(repo=>repo.get<any>("settings","global"));
  return {
    store: {
      name: "OVIA Luxury Travel Essentials",
      supportEmail: saved?.store?.supportEmail || process.env.CONTACT_EMAIL || process.env.EMAIL_FROM || "",
      phone: saved?.store?.phone || "",
      legalEntity: saved?.store?.legalEntity || "",
      address: saved?.store?.address || "",
      gstin: saved?.store?.gstin || "",
    },
    currency: {
      code: "INR",
      symbol: "â‚¹",
      format: "en-IN",
      displayCents: false,
    },
    taxes: {
      taxCalculationEnabled: true,
      inclusivePricing: true,
      standardGSTRate: 18,
      hsnCodeDefault: "420212",
    },
    inventory: {
      lowStockThreshold: 15,
      outOfStockThreshold: 0,
      reserveDurationMinutes: 15,
      trackInventoryPerWarehouse: true,
    },
    shipping: {
      defaultCourier: "Delhivery Air Express",
      freeShippingThreshold: 5000,
      standardShippingFee: 199,
      autoGenerateAWB: true,
      defaultWarehouse: "Bangalore Central (BLR-1)",
      ...saved?.shipping,
    },
    security: {
      sessionTimeoutMinutes: 480, // 8 hours
      requireTwoFactorForRefunds: true,
      rateLimitRequestsPerMinute: 120,
      stepUpAuthThresholdAmount: 50000,
    },
  };
}

export async function updateAdminSettings(settings: any, actor: string) {
  const shipping=settings.shipping;
  if(!shipping || ![shipping.standardShippingFee,shipping.freeShippingThreshold].every(value=>Number.isFinite(Number(value))&&Number(value)>=0))throw new Error("Enter valid nonnegative shipping amounts.");
  await transaction(async repo=>{
    const saved=await repo.get<any>("settings","global");
    await repo.put("settings",{...saved,id:"global",shipping:{...shipping,standardShippingFee:Number(shipping.standardShippingFee),freeShippingThreshold:Number(shipping.freeShippingThreshold)}});
  });
  await recordAuditEvent({
    actor,
    action: "STORE_SETTINGS_UPDATE",
    resource: "settings",
    resourceId: "global",
    details: settings,
  });
  return { success: true, updated: settings };
}

