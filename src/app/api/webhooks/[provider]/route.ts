import { NextRequest } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import Stripe from "stripe";
import { api, ApiError } from "@/server/http";
import { finalizePayment } from "@/server/commerce";
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ provider: string }> },
) {
  return api(async () => {
    const { provider } = await ctx.params;
    const raw = await req.text();
    if (raw.length > 1_000_000) throw new ApiError(413, "Payload too large.");
    if (provider === "stripe") {
      if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET)
        throw new ApiError(503, "Webhook is not configured.");
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      let event: Stripe.Event;
      try {
        event = stripe.webhooks.constructEvent(
          raw,
          req.headers.get("stripe-signature") || "",
          process.env.STRIPE_WEBHOOK_SECRET,
        );
      } catch {
        throw new ApiError(400, "Invalid signature.");
      }
      if (
        event.type === "checkout.session.completed" ||
        event.type === "checkout.session.async_payment_succeeded"
      ) {
        const s = event.data.object;
        if (s.payment_status === "paid" && s.currency === "inr")
          await finalizePayment(
            s.metadata?.orderId || "",
            s.id,
            s.amount_total || 0,
            event.id,
          );
      }
      return { received: true };
    }
    if (provider === "razorpay") {
      if (!process.env.RAZORPAY_WEBHOOK_SECRET)
        throw new ApiError(503, "Webhook is not configured.");
      const expected = createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
        .update(raw)
        .digest();
      const actual = Buffer.from(
        req.headers.get("x-razorpay-signature") || "",
        "hex",
      );
      if (
        expected.length !== actual.length ||
        !timingSafeEqual(expected, actual)
      )
        throw new ApiError(400, "Invalid signature.");
      const event = JSON.parse(raw);
      if (event.event === "order.paid") {
        const order = event.payload?.order?.entity;
        if (order?.currency === "INR" && order.status === "paid")
          await finalizePayment(
            order.notes?.orderId || "",
            order.id,
            order.amount,
            `rzp:${order.id}`,
          );
      }
      return { received: true };
    }
    throw new ApiError(404, "Unknown provider.");
  });
}
