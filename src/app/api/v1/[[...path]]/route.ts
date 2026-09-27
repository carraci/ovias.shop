import { TERMS_VERSION } from "@/lib/policies";
import { NextRequest } from "next/server";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import Stripe from "stripe";
import Razorpay from "razorpay";
import { filterProducts } from "@/lib/catalog";
import type { User, Order, Cart } from "@/lib/types";
import { catalog, transaction } from "@/server/db";
import { api, ApiError, body, limit, originCheck } from "@/server/http";
import {
  cartOwner,
  currentUser,
  passwordHash,
  checkPassword,
  signIn,
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
type Context = { params: Promise<{ path?: string[] }> };
async function owner() {
  return (await currentUser())?.id || (await cartOwner());
}
async function completeSignIn(user: User) {
      const guest = await cartOwner();
      await transaction(async (repo) => {
        const old = await repo.get<Cart>("carts", guest);
        if (!old?.lines.length) return;
        const account = (await repo.get<Cart>("carts", user.id)) || {
          id: user.id,
          lines: [],
          version: 0,
        };
        for (const line of old.lines) {
          const present = account.lines.find((l) => l.sku === line.sku);
          if (present)
            present.quantity = Math.min(10, present.quantity + line.quantity);
          else account.lines.push(line);
        }
        await repo.put("carts", { ...account, version: account.version + 1 });
        await repo.remove("carts", guest);
      });
      await signIn(user);
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
      return transaction(async (repo) =>
        (await repo.find<Order>("orders", { userId: user.id }))
          .map(({ owner, idempotencyKey, ...o }) => o)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      );
    }
    if (route[0] === "orders" && route.length === 2) {
      const id = await owner();
      return transaction(async (repo) => {
        const order = await repo.get<Order>("orders", route[1]);
        if (!order || order.owner !== id)
          throw new ApiError(404, "Order not found.");
        const { owner: _, idempotencyKey: __, ...safe } = order;
        return safe;
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
          password: z.string().min(10, "Use at least 10 characters.").max(128),
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
          if ((await repo.find<User>("users", { email: input.email })).length)
            throw new ApiError(
              409,
              "Unable to create this account. Try signing in or resetting your password.",
            );
          const u = {
            id: randomUUID(),
            name: input.name!,
            email: input.email,
            passwordHash: password,
            termsVersion: TERMS_VERSION, termsAcceptedAt: new Date().toISOString(),
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
        newPassword: z.string().min(10).max(128).optional(),
        password: z.string().min(10).max(128).optional(),
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
        .object({ address: addressSchema, idempotencyKey: z.uuid(), market: z.literal("IN", {error:"Checkout is not configured for this market."}).default("IN") })
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
      if (
        provider === "razorpay" &&
        !process.env.RAZORPAY_KEY_ID?.startsWith("rzp_test_")
      )
        throw new ApiError(
          503,
          "Configure Razorpay test credentials to use sandbox checkout.",
        );
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
        return { provider: "demo", url: `/orders/${order.id}/confirmation` };
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
                line_items: order.lines.map((l) => ({
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
      if (!order.providerId)
        await transaction(async (repo) => {
          const current = await repo.get<Order>("orders", order.id);
          if (!current || current.providerCreating || current.providerId)
            throw new ApiError(
              409,
              "Payment setup is already in progress. An uncertain setup requires merchant reconciliation before retry.",
            );
          await repo.put("orders", { ...current, providerCreating: true });
        });
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID!,
        key_secret: process.env.RAZORPAY_KEY_SECRET!,
      });
      const remote = order.providerId
        ? await razorpay.orders.fetch(order.providerId)
        : await razorpay.orders.create({
            amount: order.total,
            currency: "INR",
            receipt: order.id,
            notes: { orderId: order.id },
          });
      await attachProvider(order.id, remote.id);
      return {
        provider,
        orderId: remote.id,
        key: process.env.RAZORPAY_KEY_ID,
        amount: order.total,
        localOrderId: order.id,
      };
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
      await transaction((repo) =>
        repo.put("contact", {
          ...input,
          id,
          createdAt: new Date().toISOString(),
          status: "received",
        }),
      );
      return { reference: id };
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
