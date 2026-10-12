"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Package,
  AlertCircle,
  Clock,
  CheckCircle2,
  RotateCw,
} from "lucide-react";
import { request } from "@/components/store-provider";
import type { OrderShipping, TrackingEvent } from "@/lib/shipping/types";
import {
  TRACKING_STAGES,
  trackingStatusRank,
  shipmentUnavailable,
} from "@/lib/order-tracking";
import styles from "./tracking.module.css";

type TrackingOrderData = {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: string;
  shipping: OrderShipping | null;
  address: {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    region: string;
    postalCode: string;
    country: string;
  };
  lines: Array<{
    sku: string;
    name: string;
    color: string;
    price: number;
    quantity: number;
    image: string;
    slug: string;
  }>;
  total: number;
};

function formatDate(isoString?: string): string {
  if (!isoString) return "—";
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return isoString;
  }
}

function formatTime(isoString?: string): string {
  if (!isoString) return "—";
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "";
  }
}

export default function OrderTrackingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<TrackingOrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let running = false;

    async function load(quiet = false) {
      if (running) return;
      running = true;
      try {
        if (!quiet) setLoading(true);
        setError(null);
        const res = await request<TrackingOrderData>(`orders/${id}/tracking`);
        if (!cancelled) {
          setData(res);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            (err as Error).message ||
              "Tracking information is temporarily unavailable. Please try again later.",
          );
        }
      } finally {
        running = false;
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void load(true);
    }, 5000);
    return () => {
      clearInterval(timer);
      cancelled = true;
    };
  }, [id, reload]);

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await request(`orders/${id}/refresh`, "POST", {});
      const res = await request<TrackingOrderData>(`orders/${id}/tracking`);
      setData(res);
    } catch (err) {
      setError((err as Error).message || "Could not refresh tracking.");
    } finally {
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  const refreshButton = (
    <button
      type="button"
      className={styles.refreshButton}
      onClick={handleRefresh}
      disabled={refreshing}
      title="Check for live Delhivery updates"
    >
      <RotateCw size={13} className={refreshing ? styles.spinning : ""} />
      <span>{refreshing ? "Syncing Scans…" : "Refresh Tracking Status"}</span>
    </button>
  );

  if (loading) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <div className={styles.header}>
            <Link href="/" className={styles.wordmark}>
              OVIA
            </Link>
            <h1 className={styles.title}>ORDER TRACKING</h1>
          </div>
          <div className={styles.stateBox} role="status" aria-live="polite">
            <Clock size={32} strokeWidth={1.5} className={styles.stateIcon} />
            <h2 className={styles.stateHeading}>
              Retrieving tracking updates…
            </h2>
            <p className={styles.stateMessage}>
              Loading the latest saved order and shipment updates.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <div className={styles.header}>
            <Link href="/" className={styles.wordmark}>
              OVIA
            </Link>
            <h1 className={styles.title}>ORDER TRACKING</h1>
          </div>
          <div className={styles.stateBox}>
            <AlertCircle
              size={36}
              strokeWidth={1.5}
              className={styles.stateIcon}
            />
            <h2 className={styles.stateHeading}>Tracking Unavailable</h2>
            <p className={styles.stateMessage}>
              {error || "Tracking information is temporarily unavailable."}
            </p>
            {refreshButton}
            <Link href="/account/orders" className={styles.backButton}>
              <ArrowLeft size={16} /> Return to Orders
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const { shipping } = data;

  if (!shipping || !shipping.awb) {
    const unavailable = shipmentUnavailable(data.status);
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <div className={styles.header}>
            <Link href="/" className={styles.wordmark}>
              OVIA
            </Link>
            <div className={styles.titleRow}>
              <h1 className={styles.title}>ORDER TRACKING</h1>
              <span className={styles.orderNumber}>
                Order #{data.orderNumber}
              </span>
            </div>
          </div>
          <div className={styles.stateBox}>
            <Package size={36} strokeWidth={1.5} className={styles.stateIcon} />
            <h2 className={styles.stateHeading}>{unavailable.title}</h2>
            <p className={styles.stateMessage}>{unavailable.message}</p>
            {refreshButton}
            <Link href="/account/orders" className={styles.backButton}>
              <ArrowLeft size={16} /> Back to My Orders
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const currentRank = trackingStatusRank(shipping.status);
  const isTerminalFailure = currentRank === -1;
  const events = shipping.events || [];

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <Link href="/" className={styles.wordmark}>
            OVIA
          </Link>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>ORDER TRACKING</h1>
            <span className={styles.orderNumber}>
              Order #{data.orderNumber}
            </span>
            {refreshButton}
          </div>
        </header>

        {/* Top Metadata Grid */}
        <section className={styles.metaGrid} aria-label="Shipment details">
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Current Status</span>
            <span
              className={`${styles.statusBadge} ${
                isTerminalFailure ? styles.statusBadgeAlert : ""
              }`}
            >
              {shipping.status.replaceAll("_", " ")}
            </span>
          </div>

          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Courier</span>
            <span className={styles.metaValue}>
              {shipping.courier || "Delhivery Express"}
            </span>
          </div>

          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>AWB / Tracking Number</span>
            <span className={styles.metaValue}>{shipping.awb}</span>
          </div>

          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Estimated Delivery</span>
            <span className={styles.metaValue}>
              {formatDate(shipping.estimatedDelivery)}
            </span>
          </div>

          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Last Update</span>
            <span className={styles.metaValue}>
              {formatDate(shipping.lastUpdatedAt)} ·{" "}
              {formatTime(shipping.lastUpdatedAt)}
            </span>
          </div>
        </section>

        {/* Visual Timeline */}
        <section className={styles.section} aria-label="Tracking timeline">
          <h2 className={styles.sectionTitle}>Shipment Progress</h2>
          <div className={styles.timeline}>
            {TRACKING_STAGES.map((stage, idx) => {
              const isCompleted =
                !isTerminalFailure && (shipping.status === stage.key || events.some(event => event.status === stage.key && !event.isSimulated));
              const isCurrent =
                !isTerminalFailure && currentRank === stage.orderRank;
              const isLast = idx === TRACKING_STAGES.length - 1;

              // Find most recent matching event for timestamp
              const matchingEvent = [...events]
                .reverse()
                .find((e) => e.status === stage.key);

              return (
                <div key={stage.key} className={styles.timelineStep}>
                  <div className={styles.timelineIndicator}>
                    <div
                      className={`${styles.timelineDot} ${
                        isCompleted ? styles.timelineDotFilled : ""
                      } ${isCurrent ? styles.timelineDotCurrent : ""}`}
                    />
                    {!isLast && (
                      <div
                        className={`${styles.timelineLine} ${
                          isCompleted && currentRank > stage.orderRank
                            ? styles.timelineLineFilled
                            : ""
                        }`}
                      />
                    )}
                  </div>
                  <div className={styles.timelineContent}>
                    <h3
                      className={`${styles.stepTitle} ${
                        !isCompleted ? styles.stepTitleInactive : ""
                      }`}
                    >
                      {stage.label}
                    </h3>
                    {matchingEvent && (
                      <p className={styles.stepDate}>
                        {formatDate(matchingEvent.timestamp)} at{" "}
                        {formatTime(matchingEvent.timestamp)}
                        {matchingEvent.location
                          ? ` · ${matchingEvent.location}`
                          : ""}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Tracking History */}
        <section className={styles.section} aria-label="Tracking history">
          <h2 className={styles.sectionTitle}>Tracking History</h2>
          {events.length === 0 ? (
            <p className={styles.stateMessage}>No tracking scans logged yet.</p>
          ) : (
            <div className={styles.historyTableWrapper}>
              <table className={styles.historyTable}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Status</th>
                    <th>Location</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {[...events].reverse().map((ev: TrackingEvent, index) => (
                    <tr key={`${ev.status}-${ev.timestamp}-${index}`}>
                      <td>{formatDate(ev.timestamp)}</td>
                      <td>{formatTime(ev.timestamp)}</td>
                      <td>
                        <strong>{ev.status.replaceAll("_", " ")}</strong>
                      </td>
                      <td>{ev.location || "In Transit"}</td>
                      <td>{ev.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Details: Address and Items */}
        <div className={styles.detailsGrid}>
          {/* Delivery Address */}
          <section className={styles.card} aria-label="Delivery address">
            <h2 className={styles.cardTitle}>Delivery Address</h2>
            <p className={styles.addressText}>
              <strong>{data.address.name}</strong>
              <br />
              {data.address.line1}
              {data.address.line2 ? (
                <>
                  <br />
                  {data.address.line2}
                </>
              ) : null}
              <br />
              {data.address.city}, {data.address.region}{" "}
              {data.address.postalCode}
              <br />
              {data.address.country || "India"}
            </p>

            {shipping?.logistics?.standardizedAddress && (
              <div className={styles.verifiedAddressBox}>
                <span className={styles.verifiedBadge}>
                  ✓ Delhivery Verified Rooftop Address
                </span>
                <p className={styles.verifiedText}>
                  {shipping.logistics.standardizedAddress}
                </p>
              </div>
            )}

            {shipping?.logistics?.route && (
              <p className={styles.routeDistanceText}>
                Fulfillment Route: {shipping.logistics.route.distanceKm} km ·
                Est. Drive Duration: {shipping.logistics.route.durationMinutes}{" "}
                mins
              </p>
            )}
          </section>

          {/* Order Items */}
          <section className={styles.card} aria-label="Order items">
            <h2 className={styles.cardTitle}>Order Items</h2>
            <div className={styles.itemsList}>
              {data.lines.map((item) => (
                <div key={item.sku} className={styles.itemRow}>
                  <div className={styles.itemImage}>
                    <></>
                  </div>
                  <div className={styles.itemInfo}>
                    <Link
                      href={`/products/${item.slug}`}
                      className={styles.itemName}
                    >
                      {item.name}
                    </Link>
                    <p className={styles.itemMeta}>
                      {item.color} · Qty {item.quantity}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Footer Navigation */}
        <nav className={styles.navLinks}>
          <Link href="/account/orders" className={styles.navLink}>
            ← Back to Orders
          </Link>
          <Link
            href={`/orders/${data.id}/confirmation`}
            className={styles.navLink}
          >
            View Order Receipt →
          </Link>
        </nav>
      </div>
    </main>
  );
}
