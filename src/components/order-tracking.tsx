"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { request, useStore } from "./store-provider";
import type { Order } from "@/lib/types";
export function OrderTracking() {
  const { user } = useStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [message, setMessage] = useState("Loading orders…");
  useEffect(() => {
    if (user)
      request<Order[]>("account/orders")
        .then((o) => {
          setOrders(o);
          setMessage(o.length ? "" : "No orders yet.");
        })
        .catch((e) => setMessage(e.message));
  }, [user?.id]);
  return (
    <section className="section care-page">
      <p className="eyebrow">YOUR JOURNEYS</p>
      <h1>
        Track your <em>order.</em>
      </h1>
      {user ? (
        <>
          <p role="status">{message}</p>
          {orders.map((o) => (
            <article className="tracking-card" key={o.id}>
              <h2>Order {o.id.slice(0, 8)}</h2>
              <p>Status: {o.status.replaceAll("_", " ")}</p>
              <p>
                {o.status === "demo"
                  ? "Demo order — no shipment will be created."
                  : "Carrier tracking is not yet available."}
              </p>
              <Link className="text-link" href={`/orders/${o.id}/confirmation`}>
                Order details ↗
              </Link>
            </article>
          ))}
        </>
      ) : (
        <>
          <p>
            Sign in to securely view your orders. For a guest order, use the
            confirmation in the browser where you placed it.
          </p>
          <Link className="button dark" href="/account/sign-in">
            Sign in
          </Link>
        </>
      )}
    </section>
  );
}
