"use client";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { Check, ArrowUpRight } from "lucide-react";
import { request } from "@/components/store-provider";
import { money } from "@/lib/catalog";
import type { Order } from "@/lib/types";
export default function Confirmation({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let canceled = false;
    let timer: ReturnType<typeof setTimeout>;
    async function load() {
      try {
        const result = await request<Order>(`orders/${id}`);
        if (!canceled) {
          setOrder(result);
          if (result.status === "pending") timer = setTimeout(load, 4000);
        }
      } catch (e) {
        if (!canceled) setError((e as Error).message);
      }
    }
    void load();
    return () => {
      canceled = true;
      clearTimeout(timer);
    };
  }, [id]);
  return (
    <section className="section confirmation">
      {error ? (
        <>
          <h1>We couldn’t find that order.</h1>
          <p role="alert">{error}</p>
        </>
      ) : !order ? (
        <h1>Finding your journey…</h1>
      ) : (
        <>
          <span className="confirmation-icon">
            <Check size={28} />
          </span>
          <p className="eyebrow">
            {order.status === "demo"
              ? "DEMO ORDER SAVED"
              : order.status.toUpperCase().replaceAll("_", " ")}
          </p>
          <h1>
            {order.status === "pending"
              ? "Confirming your payment."
              : order.status === "expired"
                ? "This checkout has expired."
                : order.status === "refund_required"
                  ? "Your order needs attention."
                  : "Your next chapter awaits."}
          </h1>
          <p>
            {order.status === "demo"
              ? "This sample order was saved. No payment was taken and no products will be shipped."
              : order.status === "pending"
                ? "Your order updates only after a verified payment notification. You can safely return to this page."
                : order.status === "paid"
                  ? "Your sandbox payment has been confirmed."
                  : order.status === "refund_required"
                    ? "Payment arrived after the stock reservation expired. Merchant review is required."
                    : "Return to your bag to start a new checkout."}
          </p>
          <div className="confirmation-details">
            <div>
              <span>Order reference</span>
              <strong>{order.id.slice(0, 8)}</strong>
            </div>
            <div>
              <span>Selection</span>
              <strong>
                {order.lines.reduce((n, l) => n + l.quantity, 0)} pieces
              </strong>
            </div>
            <div>
              <span>Total</span>
              <strong>{money(order.total)}</strong>
            </div>
          </div>
        </>
      )}
      <Link href="/luggage" className="button dark">
        Continue exploring <ArrowUpRight size={18} />
      </Link>
    </section>
  );
}
