import { verifyCourierWebhook } from "@/server/courier-webhook-auth";
import { NextRequest } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import Stripe from "stripe";
import { api, ApiError } from "@/server/http";
import { verifyPayPalWebhook } from "@/server/paypal";
import { processPayPalEvent } from "@/server/paypal-checkout";
import { finalizePayment } from "@/server/commerce";
import { processRazorpayWebhook } from "@/server/razorpay-checkout";
import { processRefundWebhook } from "@/server/razorpay-refunds";
import { verifyRazorpayWebhookSignature } from "@/server/razorpay-webhook-signature";
export const maxDuration = 60;
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ provider: string }> },
) {
  return api(async () => {
    const { provider } = await ctx.params;
    const raw = await req.text();
    if (raw.length > 1_000_000) throw new ApiError(413, "Payload too large.");
    if (provider === "paypal") {
      let event;
      try { event = JSON.parse(raw); } catch { throw new ApiError(400, "Invalid webhook body."); }
      if (!event || typeof event.id !== "string" || !event.id || event.id.length > 200 || typeof event.event_type !== "string" || event.event_type.length > 200) throw new ApiError(400, "Invalid webhook body.");
      await verifyPayPalWebhook(req.headers, event);
      await processPayPalEvent(event);
      return { received: true };
    }
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
      const signature = req.headers.get("x-razorpay-signature") || "";
      verifyRazorpayWebhookSignature(raw, signature, process.env.RAZORPAY_WEBHOOK_SECRET);
      let event;
      try { event = JSON.parse(raw); } catch { throw new ApiError(400, "Invalid webhook body."); }
      if (!event || typeof event.event !== "string") throw new ApiError(400, "Invalid webhook body.");
      if (!(await processRefundWebhook(event))) await processRazorpayWebhook(event);
      return { received: true };
    }
    if (provider === "delhivery") {
      verifyCourierWebhook(raw, req.headers);
      let bodyData;
      try { bodyData = JSON.parse(raw); } catch { throw new ApiError(400, "Invalid JSON body."); }
      const { processShippingWebhook } = await import("@/lib/shipping/service");
      const res = await processShippingWebhook(bodyData);
      return { received: true, ...res };
    }
    throw new ApiError(404, "Unknown provider.");
  });
}
