import { queueContactNotification, attemptContactNotification } from "@/server/contact-notifications";
import { authorizeAdminApi } from "@/server/admin-auth";
import { verifiedShipment } from "@/server/logistics";
import { completeSignIn } from "@/server/account-sign-in";
import { TERMS_VERSION } from "@/lib/policies";
import { getPasswordValidationError, PASSWORD_MAX_LENGTH } from "@/lib/password-policy";
import { NextRequest } from "next/server";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import Stripe from "stripe";
import { requireRazorpay } from "@/server/razorpay-checkout";
import { filterProducts } from "@/lib/catalog";
import type { User, Order, Address } from "@/lib/types";
import { catalog, transaction } from "@/server/db";
import { api, ApiError, body, limit, originCheck } from "@/server/http";
import {
  cartOwner,
  currentUser,
  passwordHash,
  checkPassword,
  signOut,
  readPasswordResetToken,
} from "@/server/auth";
import {
  addressSchema,
  readCart,
  changeCart,
  createOrder,
  attachProvider,
} from "@/server/commerce";
import { consumeAccountToken, requireEmailConfiguration } from "@/server/mail";
import { requestRecoveryCode, verifyRecoveryCode, requestVerificationCode, verifyEmailCode } from "@/server/recovery";
export const runtime = "nodejs";
const newPasswordSchema = z.string().superRefine((password, context) => {
  const message = getPasswordValidationError(password);
  if (message) context.addIssue({ code: "custom", message });
});
type Context = { params: Promise<{ path?: string[] }> };
async function owner() {
  return (await currentUser())?.id || (await cartOwner());
}
export async function GET(req: NextRequest, ctx: Context) {
  return api(async () => {
    const route = (await ctx.params).path || [];
    const path = route.join("/");
    if (path === "products" || path === "search")
      return filterProducts(
        await catalog(),
        Object.fromEntries(req.nextUrl.searchParams),
      );
    if (route[0] === "products" && route.length === 2) {
      const p = (await catalog()).find((p) => p.slug === route[1]);
      if (!p) throw new ApiError(404, "Product not found.");
      return p;
    }
    if (path === "cart") return readCart(await owner());
    if (path === "account") return { user: await currentUser() };
    if (path === "account/orders") {
      const user = await currentUser();
      if (!user) throw new ApiError(401, "Please sign in.");
      return transaction(async (repo) => {
        const byUserId = await repo.find<Order>("orders", { userId: user.id });
        const byOwner = await repo.find<Order>("orders", { owner: user.id });
        const allOrders = await repo.find<Order>("orders", {});
        const byEmail = user.email
          ? allOrders.filter(
              (o) => o.address?.email && o.address.email.trim().toLowerCase() === user.email.trim().toLowerCase(),
            )
          : [];
        const map = new Map<string, Order>();
        for (const o of [...byUserId, ...byOwner, ...byEmail]) {
          map.set(o.id, o);
        }
        return Array.from(map.values())
          .map(({ owner, idempotencyKey, ...o }) => ({...o,shipping:verifiedShipment(o as Order)?o.shipping:undefined}))
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      });
    }
    if (route[0] === "orders" && route.length === 2) {
      const id = await owner();
      const user = await currentUser();
      return transaction(async (repo) => {
        const target = route[1];
        let order = await repo.get<Order>("orders", target);
        if (!order) {
          const byNumber = await repo.find<Order>("orders", { orderNumber: target });
          if (byNumber[0]) order = byNumber[0];
        }
        if (!order) {
          const all = await repo.find<Order>("orders", {});
          const clean = target.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
          order = all.find((o) => {
            if (o.id === target || o.id?.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() === clean) return true;
            if (o.orderNumber && (o.orderNumber.toLowerCase() === target.toLowerCase() || o.orderNumber.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() === clean)) return true;
            if (clean.length >= 6 && ((o.orderNumber && o.orderNumber.toLowerCase().includes(clean)) || o.id.toLowerCase().includes(clean))) return true;
            return false;
          }) || undefined;
        }
        if (!order) throw new ApiError(404, "Order not found.");
        const isOwner =
          order.owner === id ||
          (user && order.userId === user.id) ||
          (user && order.address?.email?.toLowerCase() === user.email?.toLowerCase());
        const isStaff = user?.role === "admin" || user?.role === "support";
        if (!isOwner && !isStaff)
          throw new ApiError(403, "Access denied.");
        const { owner: _, idempotencyKey: __, ...safe } = order;
        return {...safe,shipping:verifiedShipment(order)?safe.shipping:undefined};
      });
    }
    if (route[0] === "orders" && route.length === 3 && route[2] === "tracking") {
      const target = route[1];
      const viewerId = await owner();
      const user = await currentUser();
      return transaction(async (repo) => {
        let order = await repo.get<Order>("orders", target);
        if (!order) {
          const byNumber = await repo.find<Order>("orders", { orderNumber: target });
          if (byNumber[0]) order = byNumber[0];
        }
        if (!order) {
          const all = await repo.find<Order>("orders", {});
          const clean = target.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
          order = all.find((o) => {
            if (o.id === target || o.id?.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() === clean) return true;
            if (o.orderNumber && (o.orderNumber.toLowerCase() === target.toLowerCase() || o.orderNumber.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() === clean)) return true;
            if (clean.length >= 6 && ((o.orderNumber && o.orderNumber.toLowerCase().includes(clean)) || o.id.toLowerCase().includes(clean))) return true;
            return false;
          }) || undefined;
        }
        if (!order) throw new ApiError(404, "Order not found.");
        const isOwner =
          order.owner === viewerId ||
          (user && order.userId === user.id) ||
          (user && order.address?.email?.toLowerCase() === user.email?.toLowerCase());
        const isStaff = user?.role === "admin" || user?.role === "support";
        if (!isOwner && !isStaff) {
          throw new ApiError(403, "Access denied. You can only view tracking for your own orders.");
        }
        return {
          id: order.id,
          orderNumber: order.orderNumber || `OVIA-${order.id.slice(0, 8).toUpperCase()}`,
          createdAt: order.createdAt,
          status: order.status,
          shipping: verifiedShipment(order) ? order.shipping : undefined,
          address: {
            name: order.address.name,
            city: order.address.city,
            region: order.address.region,
            postalCode: order.address.postalCode,
            country: order.address.country,
            line1: order.address.line1,
            line2: order.address.line2,
          },
          lines: order.lines.map((l) => ({
            sku: l.sku,
            name: l.name,
            color: l.color,
            price: l.price,
            quantity: l.quantity,
            image: l.image,
            slug: l.slug,
          })),
          total: order.total,
        };
      });
    }
    if (path === "shipping/serviceability") {
      await limit(req, "shipping-pincode", 60);
      const pincode = req.nextUrl.searchParams.get("pincode") || "";
      if (!/^[1-9][0-9]{5}$/.test(pincode.trim())) {
        throw new ApiError(400, "Enter a valid 6-digit Indian PIN code.");
      }
      const { getShippingProvider } = await import("@/lib/shipping/service");
      const provider = getShippingProvider("delhivery");
      return provider.checkServiceability({ pincode: pincode.trim() });
    }
    if (path === "shipping/maps/auto-suggest") {
      const q = req.nextUrl.searchParams.get("query") || "";
      if (!q.trim()) return { data: [] };
      const latParam = req.nextUrl.searchParams.get("lat");
      const lngParam = req.nextUrl.searchParams.get("lng");
      const lat = latParam ? Number(latParam) : undefined;
      const lng = lngParam ? Number(lngParam) : undefined;
      const { searchLocation } = await import("@/lib/shipping/delhivery-maps");
      return searchLocation(q, lat, lng);
    }
    if (path === "admin/orders") {
      const user = await currentUser();
      if (!user || !["admin", "support"].includes(user.role || "")) {
        throw new ApiError(403, "Access denied. Staff privileges required.");
      }
      return transaction(async (repo) => {
        const all = await repo.find<Order>("orders");
        return all
          .map(({ idempotencyKey: _, ...o }) => o)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      });
    }
    if (route[0] === "admin" && route[1] === "orders" && route.length === 4 && route[3] === "tracking") {
      const user = await currentUser();
      if (!user || !["admin", "support"].includes(user.role || "")) {
        throw new ApiError(403, "Access denied. Staff privileges required.");
      }
      return transaction(async (repo) => {
        const order = await repo.get<Order>("orders", route[2]);
        if (!order) throw new ApiError(404, "Order not found.");
        return {
          orderNumber: order.orderNumber || order.id,
          customer: order.address.name,
          paymentStatus: order.status,
          shipping: order.shipping || null,
        };
      });
    }
    throw new ApiError(404, "Endpoint not found.");
  });
}
export async function POST(req: NextRequest, ctx: Context) {
  return api(async () => {
    originCheck(req);
    const path = ((await ctx.params).path || []).join("/");
    if (path === "auth/register" || path === "auth/login") {
      await limit(req, "auth", 12);
      const input = z
        .object({
          email: z
            .string().trim().email()
            .max(200)
            .transform((s) => s.toLowerCase()),
          password: path === "auth/register"
            ? newPasswordSchema
            : z.string().min(1, "Enter your password.").max(PASSWORD_MAX_LENGTH),
          name: z.string().trim().min(2).max(100).optional(),
          confirmPassword: z.string().optional(),
          terms: z.enum(["on"]).optional(),
        })
        .parse(await body(req));
      await limit(req, `auth-account-${input.email}`, 8);
      let user: User;
      if (path === "auth/register") {
        requireEmailConfiguration();
        if (!input.name) throw new ApiError(400, "Enter your name.");
        if (input.confirmPassword !== input.password) throw new ApiError(400, "Passwords must match.");
        if (input.terms !== "on") throw new ApiError(400, "Accept the terms to create an account.");
        const password = passwordHash(input.password);
        user = await transaction(async (repo) => {
          const existing = (await repo.find<User>("users", { email: input.email }))[0];
          if (existing) {
            // An email failure leaves a pending account. Its owner can retry
            // verification using the original password without replacing it.
            if (!existing.verifiedAt && checkPassword(input.password, existing.passwordHash))
              return existing;
            throw new ApiError(
              409,
              "Unable to create this account. Try signing in or resetting your password.",
            );
          }
          const u = {
            id: randomUUID(),
            name: input.name!,
            email: input.email,
            passwordHash: password,
            termsVersion: TERMS_VERSION, termsAcceptedAt: new Date().toISOString(),
            role: "CUSTOMER",
            createdAt: new Date().toISOString(),
          };
          await repo.put("users", u);
          return u;
        });
      } else {
        const found = await transaction(
          async (repo) =>
            (await repo.find<User>("users", { email: input.email }))[0],
        );
        const valid = checkPassword(input.password, found?.passwordHash || `scrypt-v2:00000000000000000000000000000000:${"00".repeat(64)}`);
        if (!found || !valid)
          throw new ApiError(401, "Email or password is incorrect.");
        user = found;
        if (!found.passwordHash.startsWith("scrypt-v2:")) { user = { ...found, passwordHash: passwordHash(input.password) }; await transaction(repo => repo.put("users", user)); }
      }
      if (!user.verifiedAt) {
        await requestVerificationCode(user.email);
        return { verificationRequired: true, email: user.email, message: "Enter the verification code sent to your email." };
      }
      await completeSignIn(user);
      return { user: { id: user.id, name: user.name, email: user.email } };
    }
    if (path === "auth/resend-verification") {
      await limit(req, "verify-resend", 3);
      const viewer = await currentUser();
      const input = z.object({ email: z.string().trim().email().max(200).transform(s => s.toLowerCase()).optional() }).parse(await body(req));
      const email = input.email || viewer?.email;
      if (!email) throw new ApiError(400, "Enter your email address.");
      await requestVerificationCode(email);
      return { message: "If verification is needed, a code was sent." };
    }
    if (path === "auth/forgot-password") {
      await limit(req, "recovery", 5);
      const { email } = z
        .object({
          email: z
            .string().trim().email()
            .max(200)
            .transform((s) => s.toLowerCase()),
        })
        .parse(await body(req));
      return requestRecoveryCode(email);
    }
    if (path === "auth/verify-otp") {
      await limit(req, "recovery-otp", 20);
      const { email, otp } = z.object({
        email: z.string().trim().email().max(200).transform(s => s.toLowerCase()),
        otp: z.string().regex(/^\d{6}$/, "Enter the 6-digit code."),
      }).parse(await body(req));
      await limit(req, `recovery-otp-${email}`, 10);
      return verifyRecoveryCode(email, otp);
    }
    if (path === "auth/reset-password") {
      await limit(req, "recovery-confirm", 10);
      const input = z.object({
        resetToken: z.string().max(2048).optional(),
        token: z.string().regex(/^[a-f0-9]{64}$/).optional(),
        newPassword: newPasswordSchema.optional(),
        password: newPasswordSchema.optional(),
      }).parse(await body(req));
      const password = input.newPassword ?? input.password;
      const token = input.resetToken ? (await readPasswordResetToken(input.resetToken)).tokenId : input.token;
      if (!password || !token) throw new ApiError(400, "Reset authorization and a new password are required.");
      await consumeAccountToken(token, "reset", password);
      return { message: "Password updated. Sign in with your new password." };
    }
    if (path === "auth/verify-email") {
      await limit(req, "verify", 10);
      const input = z.union([
        z.object({ token: z.string().regex(/^[a-f0-9]{64}$/) }),
        z.object({ email: z.string().trim().email().max(200).transform(s => s.toLowerCase()), otp: z.string().regex(/^\d{6}$/, "Enter the 6-digit code.") }),
      ]).parse(await body(req));
      if ("token" in input) {
        await consumeAccountToken(input.token, "verify");
        return { message: "Your email has been verified. You can now sign in." };
      }
      const user = await verifyEmailCode(input.email, input.otp);
      await completeSignIn(user);
      return { message: "Your email has been verified.", user: { id: user.id, name: user.name, email: user.email } };
    }
    if (path === "auth/logout") {
      await signOut();
      return { ok: true };
    }
    if (path === "cart/items") {
      await limit(req, "cart", 90);
      const input = z
        .object({
          sku: z.string().min(1).max(160),
          quantity: z.number().int().min(1).max(10),
        })
        .parse(await body(req));
      return changeCart(await owner(), input.sku, input.quantity, "add");
    }
    if (path === "checkout") {
      await limit(req, "checkout", 12);
      const input = z
        .object({
          address: addressSchema,
          idempotencyKey: z.uuid(),
          market: z.literal("IN", {error:"Checkout is not configured for this market."}).default("IN"),
          paymentMethod: z.string().optional(),
          paymentDetails: z.record(z.string(), z.any()).optional(),
        })
        .parse(await body(req));
      const provider = z
        .enum(["demo", "stripe", "razorpay"])
        .parse(process.env.PAYMENT_PROVIDER || "demo");
      if (
        provider === "demo" &&
        process.env.NODE_ENV === "production" &&
        process.env.ALLOW_DEMO_CHECKOUT !== "true"
      )
        throw new ApiError(503, "Checkout is not enabled on this preview.");
      if (
        provider === "stripe" &&
        !process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_")
      )
        throw new ApiError(
          503,
          "Configure Stripe test credentials to use sandbox checkout.",
        );
      if (provider === "razorpay") {
        requireRazorpay();
        throw new ApiError(409, "Use the secure Razorpay checkout to review and verify your payment.");
      }
      const user = await currentUser();
      const order = await createOrder(
        await owner(),
        user?.id,
        input.address,
        input.idempotencyKey,
        provider,
      );
      const origin = process.env.APP_ORIGIN || "http://localhost:3000";
      if (provider === "demo" || order.status !== "pending")
        return {
          provider: "demo",
          url: `/orders/${order.id}/confirmation`,
          orderId: order.orderNumber || order.id,
          id: order.id,
        };
      if (provider === "stripe") {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
        const session = order.providerId
          ? await stripe.checkout.sessions.retrieve(order.providerId)
          : await stripe.checkout.sessions.create(
              {
                mode: "payment",
                client_reference_id: order.id,
                customer_email: order.address.email,
                metadata: { orderId: order.id },
                expires_at:
                  Math.floor(Date.parse(order.createdAt) / 1000) + 30 * 60,
                line_items: order.lines.map((l: any) => ({
                  price_data: {
                    currency: "inr",
                    unit_amount: l.price,
                    product_data: { name: `${l.name} · ${l.color}` },
                  },
                  quantity: l.quantity,
                })),
                success_url: `${origin}/orders/${order.id}/confirmation`,
                cancel_url: `${origin}/checkout?canceled=1`,
              },
              { idempotencyKey: order.id },
            );
        await attachProvider(order.id, session.id);
        return { provider, url: session.url };
      }
      throw new ApiError(503, "Payment provider is unavailable.");
    }
    if (path === "contact") {
      await limit(req, "contact", 5);
      const input = z
        .object({
          name: z.string().trim().min(2).max(100),
          email: z.email().max(200),
          message: z.string().trim().min(10).max(3000),
        })
        .parse(await body(req));
      const id = randomUUID();
      const notificationId = await transaction(async (repo) => {
        await repo.put("contact", {
          ...input, id, createdAt: new Date().toISOString(), status: "received",
        });
        return queueContactNotification(repo, { ...input, id });
      });
      const emailNotification = await attemptContactNotification(notificationId);
      return { reference: id, emailNotification };
    }
    if (path === "shipping/serviceability") {
      await limit(req, "shipping-pincode", 30);
      const input = z
        .object({
          pincode: z
            .string()
            .trim()
            .regex(/^[1-9][0-9]{5}$/, "Enter a valid 6-digit Indian PIN code."),
        })
        .parse(await body(req));
      const { getShippingProvider } = await import("@/lib/shipping/service");
      const provider = getShippingProvider("delhivery");
      return provider.checkServiceability({ pincode: input.pincode });
    }
    if (path === "shipping/create") {
      const user = await currentUser();
      if (!user || !["admin", "support"].includes(user.role || "")) {
        throw new ApiError(403, "Access denied. Staff privileges required.");
      }
      const input = z.object({ orderId: z.string().min(1) }).parse(await body(req));
      const { createOrderShipment } = await import("@/lib/shipping/service");
      return createOrderShipment(input.orderId);
    }
    const route = (await ctx.params).path || [];
    if (route[0] === "orders" && route.length === 3 && route[2] === "cancel") {
      const orderId = route[1];
      const viewerId = await owner();
      const user = await currentUser();
      const target=await transaction(async (repo) => {
        let order = await repo.get<Order>("orders", orderId);
        if (!order) {
          const byNumber = await repo.find<Order>("orders", { orderNumber: orderId });
          if (byNumber[0]) order = byNumber[0];
        }
        if (!order) {
          const all = await repo.find<Order>("orders", {});
          const clean = orderId.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
          order = all.find((o) => o.id === orderId || (o.orderNumber && o.orderNumber.toLowerCase() === orderId.toLowerCase()) || (clean.length >= 6 && o.orderNumber?.toLowerCase().includes(clean))) || undefined;
        }
        if (!order) throw new ApiError(404, "Order not found.");
        const isOwner =
          order.owner === viewerId ||
          (user && order.userId === user.id) ||
          (user && order.address?.email?.toLowerCase() === user.email?.toLowerCase());
        if (!isOwner) throw new ApiError(403, "Access denied.");
        return order;
      });
      if(target.cancellationDeadline && !(Date.parse(target.cancellationDeadline)>Date.now())) throw new ApiError(409,"The cancellation deadline has passed. Contact support.");
      const input=z.object({confirmed:z.literal(true),reason:z.string().max(200).optional()}).strict().parse(await body(req));
      const {executeLogistics}=await import("@/server/logistics");
      return executeLogistics({orderId:target.id,action:"cancel",...input},user?.email || "Customer cancellation");
    }
    if (route[0] === "orders" && route.length === 3 && route[2] === "address") {
      const orderId = route[1];
      const viewerId = await owner();
      const user = await currentUser();
      const updateData = (await body(req)) as Partial<Address>;
      return transaction(async (repo) => {
        let order = await repo.get<Order>("orders", orderId);
        if (!order) {
          const byNumber = await repo.find<Order>("orders", { orderNumber: orderId });
          if (byNumber[0]) order = byNumber[0];
        }
        if (!order) {
          const all = await repo.find<Order>("orders", {});
          const clean = orderId.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
          order = all.find((o) => o.id === orderId || (o.orderNumber && o.orderNumber.toLowerCase() === orderId.toLowerCase()) || (clean.length >= 6 && o.orderNumber?.toLowerCase().includes(clean))) || undefined;
        }
        if (!order) throw new ApiError(404, "Order not found.");
        const isOwner =
          order.owner === viewerId ||
          (user && order.userId === user.id) ||
          (user && order.address?.email?.toLowerCase() === user.email?.toLowerCase());
        if (!isOwner) throw new ApiError(403, "Access denied.");
        if (["cancelled", "expired"].includes(order.status)) throw new ApiError(400, "Cannot update cancelled or expired order.");
        if (order.logisticsOperations?.approve || order.logisticsOperations?.cancel || order.shipping?.shippedAt || ["IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED"].includes(order.shipping?.status || "")) {
          throw new ApiError(400, "Order is already shipped. Address cannot be changed.");
        }
        const updated: Order = {
          ...order,
          address: {
            ...order.address,
            ...updateData,
          },
        };
        await repo.put("orders", updated);
        return updated;
      });
    }
    if (route[0] === "shipping" && route[1] === "cancel" && route.length === 3) {
      const user = await currentUser();
      if (!(await authorizeAdminApi(req)).authorized) {
        throw new ApiError(403, "Access denied. Staff privileges required.");
      }
      const { cancelOrderShipment } = await import("@/lib/shipping/service");
      z.object({confirmed:z.literal(true)}).passthrough().parse(await body(req));
      return cancelOrderShipment(route[2]);
    }
    if (route[0] === "admin" && route[1] === "orders" && route.length === 4 && route[3] === "shipment") {
      const user = await currentUser();
      if (!(await authorizeAdminApi(req)).authorized) {
        throw new ApiError(403, "Access denied. Staff privileges required.");
      }
      const { createOrderShipment } = await import("@/lib/shipping/service");
      return createOrderShipment(route[2]);
    }
    if (route[0] === "admin" && route[1] === "orders" && route.length === 5 && route[3] === "tracking" && route[4] === "refresh") {
      const user = await currentUser();
      if (!(await authorizeAdminApi(req)).authorized) {
        throw new ApiError(403, "Access denied. Staff privileges required.");
      }
      const { syncOrderTracking } = await import("@/lib/shipping/service");
      return syncOrderTracking(route[2]);
    }
    if (route[0] === "admin" && route[1] === "orders" && route.length === 5 && route[3] === "shipment" && route[4] === "cancel") {
      const user = await currentUser();
      if (!(await authorizeAdminApi(req)).authorized) {
        throw new ApiError(403, "Access denied. Staff privileges required.");
      }
      const { cancelOrderShipment } = await import("@/lib/shipping/service");
      z.object({confirmed:z.literal(true)}).passthrough().parse(await body(req));
      return cancelOrderShipment(route[2]);
    }
    if (route[0] === "admin" && route[1] === "orders" && route.length === 4 && route[3] === "pickup") {
      const user = await currentUser();
      if (!(await authorizeAdminApi(req)).authorized) {
        throw new ApiError(403, "Access denied. Staff privileges required.");
      }
      const input = z
        .object({
          pickupDate: z.string().optional(),
          pickupTime: z.string().optional(),
          pickupLocation: z.string().optional(),
          expectedCount: z.number().optional(),
        })
        .catchall(z.any())
        .parse(await body(req));
      const { requestOrderPickup } = await import("@/lib/shipping/service");
      return requestOrderPickup(route[2], input);
    }
    if (route[0] === "admin" && route[1] === "orders" && route.length === 5 && route[3] === "shipment" && route[4] === "simulate") {
      const user = await currentUser();
      if (!(await authorizeAdminApi(req)).authorized) {
        throw new ApiError(403, "Access denied. Staff privileges required.");
      }
      const input = z.object({ targetStatus: z.string().optional() }).catchall(z.any()).parse(await body(req));
      const { simulateShippingStep } = await import("@/lib/shipping/service");
      return simulateShippingStep(route[2], input.targetStatus as any);
    }
    if (path === "shipping/maps/standardize-address") {
      await limit(req, "shipping-standardize", 30);
      const input = z.object({ address: z.string().min(3) }).parse(await body(req));
      const { standardizeAddress, validateAddress } = await import("@/lib/shipping/delhivery-maps");
      const [standardized, validation] = await Promise.all([
        standardizeAddress(input.address).catch((err) => ({ error: (err as Error).message })),
        validateAddress(input.address).catch((err) => ({ error: (err as Error).message })),
      ]);
      return { standardized, validation };
    }
    if (path === "shipping/maps/auto-suggest") {
      await limit(req, "shipping-suggest", 60);
      const input = z
        .object({
          query: z.string().min(1),
          lat: z.number().optional(),
          lng: z.number().optional(),
        })
        .parse(await body(req));
      const { searchLocation } = await import("@/lib/shipping/delhivery-maps");
      return searchLocation(input.query, input.lat, input.lng);
    }
    if (path === "shipping/maps/route") {
      await limit(req, "shipping-route", 30);
      const input = z
        .object({
          origin: z.tuple([z.number(), z.number()]),
          destination: z.tuple([z.number(), z.number()]),
          travelMode: z.enum(["auto", "motorcycle", "truck", "pedestrian"]).optional(),
        })
        .parse(await body(req));
      const { computeRoute } = await import("@/lib/shipping/delhivery-maps");
      return computeRoute(input.origin, input.destination, input.travelMode || "truck");
    }
    if (path === "shipping/maps/optimize-stops") {
      await limit(req, "shipping-stops", 20);
      const input = z
        .object({
          startLocation: z.object({ lat: z.number(), lng: z.number() }),
          stops: z.array(
            z.object({
              stop_id: z.string(),
              stop_lat: z.number(),
              stop_lng: z.number(),
              assigned_orders: z.array(z.string()).optional(),
            }),
          ),
          travelMode: z.enum(["motorcycle", "truck", "auto"]).optional(),
        })
        .parse(await body(req));
      const { optimizeDeliveryStops } = await import("@/lib/shipping/delhivery-maps");
      return optimizeDeliveryStops(
        input.startLocation,
        input.stops,
        input.travelMode || "motorcycle",
      );
    }
    throw new ApiError(404, "Endpoint not found.");
  }, 200, req.nextUrl.pathname.startsWith("/api/v1/auth/"));
}

export async function PATCH(req: NextRequest, ctx: Context) {
  return api(async () => {
    originCheck(req);
    const route = (await ctx.params).path || [];
    if (route[0] !== "cart" || route[1] !== "items" || route.length !== 3)
      throw new ApiError(404, "Endpoint not found.");
    const input = z
      .object({
        quantity: z.number().int().min(0).max(10),
        version: z.number().int().nonnegative(),
      })
      .parse(await body(req));
    return changeCart(
      await owner(),
      route[2],
      input.quantity,
      "set",
      input.version,
    );
  });
}
export async function DELETE(req: NextRequest, ctx: Context) {
  return api(async () => {
    originCheck(req);
    const route = (await ctx.params).path || [];
    if (route[0] !== "cart" || route[1] !== "items" || route.length !== 3)
      throw new ApiError(404, "Endpoint not found.");
    return changeCart(await owner(), route[2], 0, "set");
  });
}



