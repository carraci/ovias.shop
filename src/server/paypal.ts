import { ApiError } from "./http";
import type { Order } from "@/lib/types";
const base = "https://api-m.sandbox.paypal.com";
export type PayPalOrder = {
  id: string;
  status: string;
  links?: { rel: string; href: string }[];
  purchase_units?: {
    custom_id?: string;
    amount?: { currency_code: string; value: string };
    payments?: {
      captures?: {
        id: string;
        status: string;
        final_capture?: boolean;
        amount: { currency_code: string; value: string };
      }[];
    };
  }[];
};
export function requirePayPal() {
  if ((process.env.PAYPAL_ENV || "sandbox") !== "sandbox")
    throw new ApiError(
      503,
      "Live payments are disabled. Configure PayPal sandbox.",
    );
  if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET)
    throw new ApiError(
      503,
      "PayPal sandbox is not configured yet. Please contact OVIA support.",
    );
  if (!process.env.PAYPAL_WEBHOOK_ID)
    throw new ApiError(
      503,
      "PayPal sandbox webhook is not configured yet. Please contact OVIA support.",
    );
  if (process.env.NODE_ENV === "production" && !process.env.MONGODB_URI)
    throw new ApiError(503, "Checkout requires durable MongoDB storage.");
  const origin = new URL(process.env.APP_ORIGIN || "http://localhost:3000");
  if (process.env.NODE_ENV === "production" && origin.protocol !== "https:")
    throw new ApiError(503, "Checkout requires a secure HTTPS origin.");
}
async function token() {
  requirePayPal();
  let response: Response;
  try {
    response = await fetch(`${base}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new ApiError(
      503,
      "Payment connection interrupted. Please retry shortly.",
    );
  }
  if (!response.ok)
    throw new ApiError(
      503,
      "PayPal sandbox could not connect. Please contact OVIA support.",
    );
  const result = await response.json();
  if (typeof result.access_token !== "string")
    throw new ApiError(503, "Payment connection unavailable.");
  return result.access_token;
}
async function call<T>(
  path: string,
  method = "GET",
  body?: unknown,
  requestId?: string,
): Promise<T> {
  const authorization = await token();
  let response: Response;
  try {
    response = await fetch(`${base}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${authorization}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
        ...(requestId ? { "PayPal-Request-Id": requestId } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    });
  } catch {
    throw new ApiError(
      503,
      "We couldn’t confirm payment status. Please retry verification; do not start another payment.",
    );
  }
  if (!response.ok) {
    console.error(
      "[PayPal]",
      method,
      path.split("/").slice(0, 4).join("/"),
      response.status,
      response.headers.get("paypal-debug-id") || "",
    );
    throw new ApiError(
      response.status === 422 ? 409 : 503,
      response.status === 422
        ? "Payment could not be completed. Please check your PayPal account and retry."
        : "We couldn’t confirm payment status. Please retry verification shortly.",
    );
  }
  return response.json();
}
export function approvalUrl(remote: PayPalOrder) {
  const link = remote.links?.find(
    (l) => l.rel === "payer-action" || l.rel === "approve",
  )?.href;
  if (!link) return undefined;
  const url = new URL(link);
  if (url.protocol !== "https:" || url.hostname !== "www.sandbox.paypal.com")
    throw new ApiError(503, "Payment approval link is invalid.");
  return url.href;
}
export async function createPayPalOrder(order: Order) {
  if (!order.checkoutQuote?.payment)
    throw new ApiError(503, "PayPal settlement currency is not configured.");
  const payment = order.checkoutQuote.payment;
  const origin = new URL(process.env.APP_ORIGIN || "http://localhost:3000")
    .origin;
  return call<PayPalOrder>(
    "/v2/checkout/orders",
    "POST",
    {
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: order.id,
          custom_id: order.id,
          invoice_id: order.orderNumber,
          amount: {
            currency_code: payment.currency,
            value: (payment.amount / 100).toFixed(2),
          },
        },
      ],
      payment_source: {
        paypal: {
          experience_context: {
            brand_name: "OVIA",
            user_action: "PAY_NOW",
            shipping_preference: "NO_SHIPPING",
            return_url: `${origin}/checkout?paypal=return&order=${order.id}`,
            cancel_url: `${origin}/checkout?paypal=cancel&order=${order.id}`,
          },
        },
      },
    },
    `create-${order.id}`,
  );
}
export const getPayPalOrder = (id: string) =>
  call<PayPalOrder>(`/v2/checkout/orders/${encodeURIComponent(id)}`);
export const capturePayPalOrder = (id: string, localId: string) =>
  call<PayPalOrder>(
    `/v2/checkout/orders/${encodeURIComponent(id)}/capture`,
    "POST",
    {},
    `capture-${localId}`,
  );
export async function verifyPayPalWebhook(headers: Headers, event: unknown) {
  if (!process.env.PAYPAL_WEBHOOK_ID)
    throw new ApiError(503, "PayPal webhook is not configured.");
  const values = {
    auth_algo: headers.get("paypal-auth-algo"),
    cert_url: headers.get("paypal-cert-url"),
    transmission_id: headers.get("paypal-transmission-id"),
    transmission_sig: headers.get("paypal-transmission-sig"),
    transmission_time: headers.get("paypal-transmission-time"),
  };
  if (Object.values(values).some((v) => !v || v.length > 4096))
    throw new ApiError(400, "Invalid webhook signature.");
  let cert: URL;
  try {
    cert = new URL(values.cert_url!);
  } catch {
    throw new ApiError(400, "Invalid webhook certificate.");
  }
  if (
    cert.protocol !== "https:" ||
    ![
      "api.paypal.com",
      "api.sandbox.paypal.com",
      "api-m.paypal.com",
      "api-m.sandbox.paypal.com",
    ].includes(cert.hostname)
  )
    throw new ApiError(400, "Invalid webhook certificate.");
  const result = await call<{ verification_status: string }>(
    "/v1/notifications/verify-webhook-signature",
    "POST",
    {
      ...values,
      webhook_id: process.env.PAYPAL_WEBHOOK_ID,
      webhook_event: event,
    },
  );
  if (result.verification_status !== "SUCCESS")
    throw new ApiError(400, "Invalid webhook signature.");
}
