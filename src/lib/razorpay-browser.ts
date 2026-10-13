import type { Address } from "./types";
import type { PaymentSession } from "./checkout";

export type RazorpaySession = PaymentSession & {
  provider: "razorpay";
  key: string;
  orderId?: string;
  amount: number;
  currency: "INR";
  setupPending?: boolean;
};
export type RazorpayResult = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};
export class PaymentDismissed extends Error {}
type Options = {
  key: string;
  order_id: string;
  amount: number;
  currency: "INR";
  name: string;
  description: string;
  prefill: Pick<Address, "name" | "email"> & { contact: string };
  theme: { color: string };
  config: {
    display: {
      blocks: Record<string, unknown>;
      sequence: string[];
      preferences: { show_default_blocks: boolean };
    };
  };
  handler: (result: RazorpayResult) => void;
  modal: { ondismiss: () => void };
};
type Checkout = {
  open: () => void;
  on: (event: string, callback: () => void) => void;
};
declare global {
  interface Window {
    Razorpay?: new (options: Options) => Checkout;
  }
}
export let scriptPromise: Promise<void> | undefined;
export function loadCheckout() {
  if (window.Razorpay) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    const timeout = window.setTimeout(() => fail(), 20_000);
    const fail = () => {
      window.clearTimeout(timeout);
      script.remove();
      scriptPromise = undefined;
      reject(
        new Error("Secure payment checkout could not load. Please try again."),
      );
    };
    script.onerror = fail;
    script.onload = () => {
      window.clearTimeout(timeout);
      if (!window.Razorpay) {
        fail();
        return;
      }
      resolve();
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}
export async function openRazorpay(
  session: RazorpaySession,
  method: "upi" | "card" | "netbanking",
) {
  await loadCheckout();
  if (!session.orderId || !window.Razorpay || !session.address)
    throw new Error(
      "Payment setup is incomplete. Please check the order status before retrying.",
    );
  const orderId = session.orderId;
  const prefill = {
    name: session.address.name,
    email: session.address.email,
    contact: session.address.phone || "",
  };
  return new Promise<RazorpayResult>((resolve, reject) => {
    const checkout = new window.Razorpay!({
      key: session.key,
      order_id: orderId,
      amount: session.amount,
      currency: session.currency,
      name: "OVIA",
      description: `Order ${session.orderNumber}`,
      prefill,
      theme: { color: "#171717" },
      config: {
        display: {
          blocks: {
            preferred: {
              name: "Selected payment method",
              instruments: [{ method }],
            },
          },
          sequence: ["block.preferred"],
          preferences: { show_default_blocks: true },
        },
      },
      handler: resolve,
      modal: {
        ondismiss: () =>
          reject(
            new PaymentDismissed(
              "Payment window closed. You can retry securely with the same order.",
            ),
          ),
      },
    });
    // Razorpay can let a customer retry a declined payment inside its checkout.
    // Keep the window open and wait for a signed success or dismissal.
    checkout.open();
  });
}
