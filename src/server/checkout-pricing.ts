import { z } from "zod";
import { createHash } from "node:crypto";
import { transaction, type Repository, mongo, isDemo } from "./db";
import { readCart } from "./commerce";
import { ApiError } from "./http";
import type { CheckoutQuote, ShippingMethod } from "@/lib/checkout";
import type { Order, OrderLine } from "@/lib/types";
import {defaultShippingRules,standardShippingCost} from "@/lib/standard-shipping";

export const quoteInput = z.object({
  shippingMethod: z.enum(["standard", "express"]).default("standard"),
  promoCode: z
    .string()
    .trim()
    .max(40)
    .transform((s) => s.toUpperCase())
    .optional(),
  customerEmail: z.string().trim().optional(),
});
export type Promo = {
  id: string;
  code: string;
  active: boolean;
  type: "percent" | "fixed";
  value: number;
  minimum?: number;
  startsAt?: string;
  endsAt?: string;
};
function integer(name: string, fallback: number) {
  const value = process.env[name];
  if (value === undefined || value === "") return fallback;
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)))
    throw new ApiError(503, "Checkout pricing is not configured correctly.");
  return Number(value);
}
export function shippingOptions() {
  const options: CheckoutQuote["shippingOptions"] = [
    {
      id: "standard",
      label: "Standard Delivery",
      estimate: "3–7 business days",
      cost: integer("CHECKOUT_STANDARD_SHIPPING_PAISE", 0),
    },
  ];
  if (process.env.CHECKOUT_EXPRESS_ENABLED === "true")
    options.push({
      id: "express",
      label: "Express Delivery",
      estimate: "1–3 business days",
      cost: integer("CHECKOUT_EXPRESS_SHIPPING_PAISE", 49900),
    });
  return options;
}
export function paypalConversion(
  total: number,
): CheckoutQuote["payment"] | undefined {
  const currency = process.env.PAYPAL_CURRENCY || "USD";
  if (!["USD", "EUR", "GBP", "AUD", "CAD", "SGD"].includes(currency))
    throw new ApiError(
      503,
      "Configure a supported PayPal settlement currency.",
    );
  const rate = process.env.PAYPAL_INR_PER_UNIT;
  if (!rate) return undefined;
  if (!/^\d+(\.\d{1,6})?$/.test(rate))
    throw new ApiError(503, "Configure an explicit PayPal conversion rate.");
  const [whole, fraction = ""] = rate.split(".");
  const denominator = BigInt(whole + fraction.padEnd(6, "0"));
  if (denominator <= 0n)
    throw new ApiError(503, "Configure a positive PayPal conversion rate.");
  const amount = Number(
    (BigInt(total) * 1000000n + denominator / 2n) / denominator,
  );
  if (!Number.isSafeInteger(amount) || amount < 1)
    throw new ApiError(
      400,
      "The payable amount is outside the supported range.",
    );
  return { currency, amount, rate };
}
export async function priceLines(
  lines: OrderLine[],
  cartVersion: number,
  input: z.infer<typeof quoteInput>,
  repo: Repository,
  customerEmail?: string,
  authenticatedUserId?: string,
): Promise<CheckoutQuote> {
  if (!lines.length) throw new ApiError(400, "Your bag is empty.");
  const storedSettings=await repo.get<{id:string;shipping?:typeof defaultShippingRules}>("settings","global");
  const rules={...defaultShippingRules,...storedSettings?.shipping};
  const products=await repo.find<import("@/lib/catalog").Product>("products");
  const allProductsFree=lines.every(line=>products.find(product=>product.variants.some(variant=>variant.sku===line.sku))?.freeShipping===true);
  const options = shippingOptions();
  const shipping = options.find((s) => s.id === input.shippingMethod);
  if (!shipping)
    throw new ApiError(400, "This delivery method is not available.");
  const subtotal = lines.reduce(
    (sum, line) => sum + line.price * line.quantity,
    0,
  );
  const standard=options.find(option=>option.id==="standard");
  if(standard)standard.cost=standardShippingCost(subtotal,allProductsFree,rules);
  let discount = 0;
  if (input.promoCode) {
    const cleanCode = input.promoCode.trim().toUpperCase();
    let coupon: any = null;

    if (!isDemo()) {
      try {
        const client = await mongo();
        const db = client.db(process.env.MONGODB_DB || "ovia");
        const escaped = cleanCode.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        coupon = await db.collection("coupons").findOne({
          $or: [
            { code: cleanCode },
            { code: { $regex: new RegExp(`^${escaped}$`, "i") } },
          ],
        });
      } catch (err) {
        console.warn("[priceLines] Mongo lookup failed, trying repo fallback:", err);
      }
    }

    if (!coupon) {
      const inRepo = await repo.find<any>("coupons", { code: cleanCode });
      coupon = inRepo[0];
    }

    if (!coupon) {
      const promos = await repo.find<Promo>("checkoutPromos", { code: cleanCode, active: true });
      coupon = promos[0];
    }

    if (!coupon) {
      throw new ApiError(400, `Coupon "${cleanCode}" does not exist.`);
    }

    const authenticatedCustomer = authenticatedUserId
      ? await repo.get<{ id: string; email: string }>("users", authenticatedUserId)
      : undefined;
    if (coupon.onlyRegistered && !authenticatedCustomer) {
      throw new ApiError(400, "Sign in to your OVIA account to use this coupon.");
    }

    if ((coupon.status && coupon.status !== "Active") || coupon.active === false) {
      throw new ApiError(400, `Coupon "${cleanCode}" is currently ${coupon.status?.toLowerCase() || "inactive"}.`);
    }

    const now = Date.now();
    const startDate = coupon.startDate || coupon.startsAt;
    const endDate = coupon.endDate || coupon.endsAt;
    if (startDate && Date.parse(startDate) > now) {
      throw new ApiError(400, `Coupon "${cleanCode}" is not active yet.`);
    }
    const expiryTime=endDate && /^\d{4}-\d{2}-\d{2}$/.test(endDate) ? Date.parse(`${endDate}T23:59:59.999+05:30`) : endDate ? Date.parse(endDate) : undefined;
    if (expiryTime !== undefined && expiryTime <= now) {
      throw new ApiError(400, `Coupon "${cleanCode}" has expired.`);
    }

    if (coupon.usageLimit && (coupon.usedCount || 0) >= coupon.usageLimit) {
      throw new ApiError(400, `Coupon "${cleanCode}" has reached its maximum usage limit.`);
    }

    // Minimum order check (minOrder in rupees -> paise)
    const minOrderPaise = coupon.minOrder !== undefined
      ? Math.round(Number(coupon.minOrder) * 100)
      : (coupon.minimum || 0);
    if (subtotal < minOrderPaise) {
      const reqRupees = Math.round(minOrderPaise / 100);
      throw new ApiError(
        400,
        `Minimum order amount of ₹${reqRupees.toLocaleString("en-IN")} required to use coupon "${cleanCode}".`
      );
    }

    // STRICT ONE-TIME USE PER USER CHECK:
    const effectiveEmail = (authenticatedCustomer?.email || customerEmail || input.customerEmail || "").trim().toLowerCase();
    if (effectiveEmail) {
      // 1. Check coupon.usedBy array
      const usedByList: string[] = Array.isArray(coupon.usedBy)
        ? coupon.usedBy.map((e: string) => String(e).toLowerCase())
        : [];
      if (usedByList.includes(effectiveEmail)) {
        throw new ApiError(
          400,
          `You have already used coupon "${cleanCode}". This coupon is strictly valid for one-time use per customer.`
        );
      }

      // 2. Also verify against existing orders database to prevent multi-session double dipping
      if (!isDemo()) {
        try {
          const client = await mongo();
          const db = client.db(process.env.MONGODB_DB || "ovia");
          const priorOrder = await db.collection("orders").findOne({
            $and: [
              {
                $or: [
                  { "address.email": { $regex: new RegExp(`^${effectiveEmail}$`, "i") } },
                  { owner: effectiveEmail },
                  ...(authenticatedCustomer ? [{ userId: authenticatedCustomer.id }] : []),
                ],
              },
              {
                $or: [
                  { "checkoutQuote.promoCode": cleanCode },
                  { promoCode: cleanCode },
                ],
              },
            ],
            status: { $in: ["paid", "pending", "payment_pending"] },
          });
          if (priorOrder) {
            throw new ApiError(
              400,
              `You have already used coupon "${cleanCode}". This coupon is strictly valid for one-time use per customer.`
            );
          }
        } catch (err: any) {
          if (err instanceof ApiError) throw err;
        }
      }
    }

    // Calculate discount amount
    const isPercent = coupon.discountType === "percentage" || coupon.type === "percent";
    if (coupon.discountType === "free_shipping") {
      shipping.cost = 0;
    } else if (isPercent) {
      // Percentage discount: coupon.value is percentage 0 - 100%
      const rawPercent = (Number(coupon.value) || 0) /
        (coupon.type === "percent" && coupon.discountType === undefined ? 100 : 1);
      const pct = Math.min(100, Math.max(0, rawPercent));
      let calculated = Math.round((subtotal * pct) / 100);
      if (coupon.maxDiscount !== undefined && coupon.maxDiscount !== null && Number(coupon.maxDiscount) > 0) {
        const cap = Number(coupon.maxDiscount);
        const maxPaise = Math.round(cap * 100);
        calculated = Math.min(calculated, maxPaise);
      }
      discount = Math.min(subtotal, calculated);
    } else {
      // Fixed discount: coupon.value is in rupees
      const val = Math.max(0, Number(coupon.value) || 0);
      const fixedPaise = coupon.type === "fixed" && coupon.discountType === undefined
        ? Math.round(val)
        : Math.round(val * 100);
      discount = Math.min(subtotal, fixedPaise);
    }
  }

  const taxBps = integer("CHECKOUT_TAX_BPS", 0);
  if (taxBps > 10000)
    throw new ApiError(503, "Checkout tax is not configured correctly.");
  const taxIncluded = process.env.CHECKOUT_TAX_INCLUSIVE !== "false";
  const base = Math.max(0, subtotal - discount) + shipping.cost;
  const tax = Math.round(
    (base * taxBps) / (taxIncluded ? 10000 + taxBps : 10000),
  );
  const total = Math.max(0, base + (taxIncluded ? 0 : tax));
  if (!Number.isSafeInteger(total) || total < 0)
    throw new ApiError(400, "Your bag does not have a valid payable amount.");
  const razorpay = process.env.PAYMENT_PROVIDER === "razorpay";
  const payment = razorpay
    ? { currency: "INR", amount: total, rate: "1" }
    : (total === 0 ? { currency: "INR", amount: 0, rate: "1" } : paypalConversion(total));
  const value = {
    cartVersion,
    lines,
    subtotal,
    shipping: shipping.cost,
    discount,
    tax,
    taxIncluded,
    total,
    shippingMethod: input.shippingMethod as ShippingMethod,
    shippingLabel: shipping.label,
    estimate: shipping.estimate,
    promoCode: input.promoCode || undefined,
    currency: "INR" as const,
    payment,
  };
  const id = createHash("sha256").update(JSON.stringify(value)).digest("hex");
  return {
    ...value,
    id,
    expiresAt: new Date(Date.now() + 10 * 60_000).toISOString(),
    paypalReady:
      !razorpay &&
      !!payment &&
      !!process.env.PAYPAL_CLIENT_ID &&
      !!process.env.PAYPAL_CLIENT_SECRET &&
      !!process.env.PAYPAL_WEBHOOK_ID &&
      (process.env.PAYPAL_ENV || "sandbox") === "sandbox",
    shippingOptions: options,
  };
}
export async function checkoutQuote(
  owner: string,
  input: z.infer<typeof quoteInput>,
  customerEmail?: string,
  authenticatedUserId?: string,
) {
  const cart = await readCart(owner);
  return transaction((repo) =>
    priceLines(cart.lines, cart.version, input, repo, customerEmail || input.customerEmail, authenticatedUserId),
  );
}

/** Record usage with the verified order transition, exactly once per order. */
export async function recordPaidCouponUsage(repo: Repository, order: Order) {
  const code = order.checkoutQuote?.promoCode?.trim().toUpperCase();
  if (!code || order.provider === "demo" || order.status !== "paid") return;
  const eventId = `coupon-usage-${order.id}`;
  if (await repo.get("events", eventId)) return;
  let collection = "coupons";
  let coupon = (await repo.find<any>(collection, { code }))[0];
  if (!coupon) {
    collection = "checkoutPromos";
    coupon = (await repo.find<any>(collection, { code }))[0];
  }
  if (!coupon) return;
  const customer = order.userId ? await repo.get<{ id: string; email: string }>("users", order.userId) : undefined;
  const email = (customer?.email || order.address.email).trim().toLowerCase();
  await repo.put(collection, {
    ...coupon,
    usedCount: (coupon.usedCount || 0) + 1,
    usedBy: [...new Set([...(coupon.usedBy || []), email])],
    updatedAt: new Date().toISOString(),
  });
  await repo.put("events", { id: eventId, orderId: order.id, code, createdAt: new Date().toISOString() });
}
