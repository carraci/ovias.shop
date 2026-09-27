import { NextRequest } from "next/server";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { currentUser, checkPassword, signOut } from "@/server/auth";
import { api, ApiError, body, originCheck, limit } from "@/server/http";
import { transaction } from "@/server/db";
import {
  supportCategories,
  privacyTypes,
  type CareTicket,
  type PrivacyRequest,
} from "@/lib/care";
import type { User, Session, Order } from "@/lib/types";
export const runtime = "nodejs";
type Context = { params: Promise<{ path?: string[] }> };
async function viewer() {
  const user = await currentUser();
  if (!user) throw new ApiError(401, "Please sign in.");
  return user;
}
export async function GET(req: NextRequest, ctx: Context) {
  return api(async () => {
    const user = await viewer();
    const parts = (await ctx.params).path || [];
    const path = parts.join("/");
    return transaction(async (repo) => {
      if (path === "tickets")
        return (await repo.find<CareTicket>("tickets", { userId: user.id }))
          .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
          .slice(0, 50);
      if (parts[0] === "tickets" && parts.length === 2) {
        const ticket = await repo.get<CareTicket>("tickets", parts[1]);
        if (!ticket || ticket.userId !== user.id)
          throw new ApiError(404, "Request not found.");
        return ticket;
      }
      if (path === "privacy")
        return (
          await repo.find<PrivacyRequest>("privacyRequests", {
            userId: user.id,
          })
        )
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          .slice(0, 50);
      if (path === "security") {
        const record = await repo.get<User>("users", user.id);
        const sessions = await repo.find<Session>("sessions", {
          userId: user.id,
        });
        return {
          verified: !!record?.verifiedAt,
          activeSessions: sessions.filter(
            (s) => Date.parse(s.expiresAt) > Date.now(),
          ).length,
          termsVersion: record?.termsVersion || "Not recorded",
          passwordChangedAt: record?.passwordChangedAt,
        };
      }
      if (path === "admin") {
        const actor = await repo.get<User>("users", user.id);
        if (!actor || !["admin", "support"].includes(actor.role || ""))
          throw new ApiError(403, "Access denied.");
        return {
          tickets: (await repo.find<CareTicket>("tickets"))
            .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
            .slice(0, 100),
          privacy:
            actor.role === "admin"
              ? (await repo.find<PrivacyRequest>("privacyRequests")).slice(
                  0,
                  100,
                )
              : [],
        };
      }
      throw new ApiError(404, "Endpoint not found.");
    });
  });
}
export async function POST(req: NextRequest, ctx: Context) {
  return api(async () => {
    originCheck(req);
    const user = await viewer();
    const path = ((await ctx.params).path || []).join("/");
    await limit(
      req,
      `care-${path.split("/")[0]}-${user.id}`,
      path === "tickets" ? 5 : 10,
    );
    const raw = await body(req);
    const now = new Date().toISOString();
    if (path === "tickets") {
      const input = z
        .object({
          category: z.enum(supportCategories),
          subject: z.string().trim().min(3).max(150),
          message: z.string().trim().min(10).max(3000),
          orderId: z.union([z.uuid(), z.literal("")]).optional(),
          idempotencyKey: z.uuid(),
        })
        .strict()
        .parse(raw);
      return transaction(async (repo) => {
        const existing = await repo.get<CareTicket>(
          "tickets",
          input.idempotencyKey,
        );
        if (existing) {
          if (existing.userId !== user.id)
            throw new ApiError(409, "Request conflict.");
          return existing;
        }
        if (input.orderId) {
          const order = await repo.get<Order>("orders", input.orderId);
          if (!order || order.userId !== user.id)
            throw new ApiError(404, "Order not found.");
        }
        const ticket: CareTicket = {
          id: input.idempotencyKey,
          userId: user.id,
          name: user.name,
          email: user.email,
          category: input.category,
          subject: input.subject,
          orderId: input.orderId || undefined,
          status: "Open",
          messages: [
            {
              id: randomUUID(),
              author: "customer",
              text: input.message,
              createdAt: now,
            },
          ],
          createdAt: now,
          updatedAt: now,
        };
        await repo.put("tickets", ticket);
        return ticket;
      });
    }
    if (path === "reply") {
      const input = z
        .object({
          ticketId: z.uuid(),
          message: z.string().trim().min(1).max(3000),
          idempotencyKey: z.uuid(),
        })
        .strict()
        .parse(raw);
      return transaction(async (repo) => {
        const ticket = await repo.get<CareTicket>("tickets", input.ticketId);
        if (!ticket || ticket.userId !== user.id)
          throw new ApiError(404, "Request not found.");
        if (ticket.messages.some((m) => m.id === input.idempotencyKey))
          return ticket;
        if (ticket.messages.length >= 100)
          throw new ApiError(
            409,
            "This conversation is full. Please create another request.",
          );
        if (ticket.status === "Closed")
          throw new ApiError(
            409,
            "This request is closed. Please create another request.",
          );
        ticket.messages.push({
          id: input.idempotencyKey,
          author: "customer",
          text: input.message,
          createdAt: now,
        });
        ticket.status = "Open";
        ticket.updatedAt = now;
        await repo.put("tickets", ticket);
        return ticket;
      });
    }
    if (path === "privacy") {
      const input = z
        .object({
          requestType: z.enum(privacyTypes),
          message: z.string().trim().max(2000),
          password: z.string().max(128),
          confirmed: z.literal(true),
          idempotencyKey: z.uuid(),
        })
        .strict()
        .parse(raw);
      return transaction(async (repo) => {
        const account = await repo.get<User>("users", user.id);
        if (!account || !checkPassword(input.password, account.passwordHash))
          throw new ApiError(401, "Password confirmation failed.");
        const prior = await repo.get<PrivacyRequest>(
          "privacyRequests",
          input.idempotencyKey,
        );
        if (prior) {
          if (prior.userId !== user.id)
            throw new ApiError(409, "Request conflict.");
          return prior;
        }
        const record: PrivacyRequest = {
          id: input.idempotencyKey,
          userId: user.id,
          requestType: input.requestType,
          message: input.message,
          status: "Submitted",
          createdAt: now,
          updatedAt: now,
        };
        await repo.put("privacyRequests", record);
        return record;
      });
    }
    if (path === "export") {
      const { password } = z
        .object({ password: z.string().max(128) })
        .strict()
        .parse(raw);
      return transaction(async (repo) => {
        const account = await repo.get<User>("users", user.id);
        if (!account || !checkPassword(password, account.passwordHash))
          throw new ApiError(401, "Password confirmation failed.");
        const orders = await repo.find<Order>("orders", { userId: user.id });
        const tickets = await repo.find<CareTicket>("tickets", {
          userId: user.id,
        });
        const privacy = await repo.find<PrivacyRequest>("privacyRequests", {
          userId: user.id,
        });
        const addresses = await repo.find<{
          id: string;
          userId: string;
          name: string;
          email: string;
          line1: string;
          city: string;
          region: string;
          postalCode: string;
          country: string;
        }>("addresses", { userId: user.id });
        await repo.put("audit", {
          id: randomUUID(),
          actor: user.id,
          action: "data-export",
          createdAt: now,
        });
        return {
          exportedAt: now,
          account: {
            name: account.name,
            email: account.email,
            createdAt: account.createdAt,
            verifiedAt: account.verifiedAt,
            termsVersion: account.termsVersion,
            termsAcceptedAt: account.termsAcceptedAt,
          },
          addresses: addresses.map(({ id, userId, ...address }) => address),
          orders: orders.map((o) => ({
            id: o.id,
            lines: o.lines,
            total: o.total,
            currency: "INR",
            status: o.status,
            address: o.address,
            createdAt: o.createdAt,
          })),
          tickets: tickets.map(({ userId, email, name, ...t }) => t),
          privacy: privacy.map(({ userId, ...r }) => r),
        };
      });
    }
    if (path === "revoke-sessions") {
      const { password } = z
        .object({ password: z.string().max(128) })
        .strict()
        .parse(raw);
      await transaction(async (repo) => {
        const account = await repo.get<User>("users", user.id);
        if (!account || !checkPassword(password, account.passwordHash))
          throw new ApiError(401, "Password confirmation failed.");
        for (const session of await repo.find<Session>("sessions", {
          userId: user.id,
        }))
          await repo.remove("sessions", session.id);
      });
      await signOut();
      return { ok: true };
    }
    if (path === "admin") {
      const input = z
        .object({
          id: z.uuid(),
          kind: z.enum(["ticket", "privacy"]),
          status: z.string(),
          reply: z.string().trim().max(3000).optional(),
        })
        .strict()
        .parse(raw);
      return transaction(async (repo) => {
        const actor = await repo.get<User>("users", user.id);
        if (!actor || !["admin", "support"].includes(actor.role || ""))
          throw new ApiError(403, "Access denied.");
        if (input.kind === "privacy") {
          if (actor.role !== "admin") throw new ApiError(403, "Access denied.");
          const status = z
            .enum(["Submitted", "In Review", "Completed", "Rejected"])
            .parse(input.status);
          const record = await repo.get<PrivacyRequest>(
            "privacyRequests",
            input.id,
          );
          if (!record) throw new ApiError(404, "Request not found.");
          await repo.put("privacyRequests", {
            ...record,
            status,
            updatedAt: now,
          });
        } else {
          const status = z
            .enum([
              "Open",
              "In Review",
              "Waiting for Customer",
              "Resolved",
              "Closed",
            ])
            .parse(input.status);
          const ticket = await repo.get<CareTicket>("tickets", input.id);
          if (!ticket) throw new ApiError(404, "Request not found.");
          if (input.reply) {
            if (ticket.messages.length >= 100)
              throw new ApiError(409, "Conversation is full.");
            ticket.messages.push({
              id: randomUUID(),
              author: "support",
              text: input.reply,
              createdAt: now,
            });
          }
          await repo.put("tickets", { ...ticket, status, updatedAt: now });
        }
        await repo.put("audit", {
          id: randomUUID(),
          actor: user.id,
          action: `${input.kind}-status`,
          target: input.id,
          status: input.status,
          createdAt: now,
        });
        return { ok: true };
      });
    }
    throw new ApiError(404, "Endpoint not found.");
  });
}
