import { saveReply } from "@/server/support-inbox";
import { normalizeSupportStatus } from "@/server/support-conversations";
import { ensureMailboxIndexes } from "@/server/support-mailbox";
import {
  hydrateCareTicket,
  appendConversationMessage,
} from "@/server/support-conversations";
import {
  queueContactNotification,
  attemptContactNotification,
} from "@/server/contact-notifications";
import { NextRequest } from "next/server";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import {
  currentUser,
  checkPassword,
  signOut,
  currentSessionId,
} from "@/server/auth";
import { parseDeviceFromUserAgent } from "@/server/session-device";
import { api, ApiError, body, originCheck, limit } from "@/server/http";
import { transaction } from "@/server/db";
import { isOwnerRole } from "@/server/admin-auth";
import { createCareTicket } from "@/server/care-order-requests";
import { privacyTypes, type CareTicket, type PrivacyRequest } from "@/lib/care";
import type { User, Session, Order } from "@/lib/types";
export const runtime = "nodejs";
type Context = { params: Promise<{ path?: string[] }> };
async function viewer() {
  const user = await currentUser();
  if (!user) throw new ApiError(401, "Please sign in.");
  return user;
}
function canManageSupport(actor: User) {
  return isOwnerRole(actor.role) || actor.role?.trim().toUpperCase() === "SUPPORT";
}
export async function GET(req: NextRequest, ctx: Context) {
  return api(async () => {
    const user = await viewer();
    const parts = (await ctx.params).path || [];
    const path = parts.join("/");
    return transaction(async (repo) => {
      if (path === "tickets")
        return Promise.all(
          (await repo.find<CareTicket>("tickets", { userId: user.id }))
            .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
            .map((t) => hydrateCareTicket(repo, t)),
        );
      if (parts[0] === "tickets" && parts.length === 2) {
        const ticket = await repo.get<CareTicket>("tickets", parts[1]);
        if (!ticket || ticket.userId !== user.id)
          throw new ApiError(404, "Request not found.");
        return hydrateCareTicket(repo, ticket);
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
        const currentHash = await currentSessionId();
        const userAgentHeader = req.headers.get("user-agent") || "";
        const clientIp =
          req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          req.headers.get("x-real-ip") ||
          "127.0.0.1";
        const currentParsed = parseDeviceFromUserAgent(
          userAgentHeader,
          clientIp,
        );

        const allSessions = await repo.find<Session>("sessions", {
          userId: user.id,
        });

        const activeSessions = allSessions.filter(
          (s) => Date.parse(s.expiresAt) > Date.now(),
        );

        // Update the current session with real live metadata from this HTTP request
        if (currentHash) {
          const current = activeSessions.find((s) => s.id === currentHash);
          if (current) {
            current.userAgent = userAgentHeader;
            current.ip = currentParsed.ip;
            current.device = currentParsed.device;
            current.browser = currentParsed.browser;
            current.os = currentParsed.os;
            current.deviceType = currentParsed.deviceType;
            current.location = currentParsed.location;
            current.lastActiveAt = new Date().toISOString();
            await repo.put("sessions", current);
          }
        }

        // Keep current session and only valid sessions with real device info.
        // Prune orphaned/ghost sessions without client metadata or duplicate same-device tokens.
        const validSessions: Session[] = [];
        const seenDevices = new Set<string>();

        // Process current session first
        const currentSession = activeSessions.find((s) => s.id === currentHash);
        if (currentSession) {
          validSessions.push(currentSession);
          seenDevices.add(
            `${currentParsed.device}::${currentParsed.browser}::${currentParsed.ip}`,
          );
        }

        // Process other sessions
        for (const s of activeSessions) {
          if (s.id === currentHash) continue;
          if (!s.userAgent && !s.device) {
            // Orphaned legacy test token without device context
            await repo.remove("sessions", s.id);
            continue;
          }
          const parsed = parseDeviceFromUserAgent(s.userAgent, s.ip);
          const devKey = `${s.device || parsed.device}::${s.browser || parsed.browser}::${s.ip || parsed.ip}`;
          if (seenDevices.has(devKey)) {
            // Duplicate session token on the exact same browser/device; prune stale duplicate
            await repo.remove("sessions", s.id);
          } else {
            seenDevices.add(devKey);
            validSessions.push(s);
          }
        }

        // Map sessions with full real device details
        const sessionList = validSessions
          .map((s) => {
            const isCurrent = s.id === currentHash;
            const parsed = isCurrent
              ? currentParsed
              : parseDeviceFromUserAgent(s.userAgent, s.ip);
            return {
              id: s.id,
              device: s.device || parsed.device,
              browser: s.browser || parsed.browser,
              os: s.os || parsed.os,
              deviceType: s.deviceType || parsed.deviceType,
              location: s.location || parsed.location,
              ip: s.ip || parsed.ip,
              isCurrent,
              createdAt: s.createdAt || s.expiresAt,
              lastActiveAt:
                s.lastActiveAt ||
                (isCurrent ? new Date().toISOString() : undefined),
            };
          })
          .sort((a, b) => (b.isCurrent ? 1 : 0) - (a.isCurrent ? 1 : 0));

        return {
          verified: !!record?.verifiedAt,
          activeSessions: sessionList.length,
          sessions: sessionList,
          termsVersion: record?.termsVersion || "Standard 2026.1",
          passwordChangedAt: record?.passwordChangedAt,
        };
      }
      if (path === "admin") {
        const actor = await repo.get<User>("users", user.id);
        if (!actor || !canManageSupport(actor))
          throw new ApiError(403, "Access denied.");
        return {
          tickets: (await repo.find<CareTicket>("tickets"))
            .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
            .slice(0, 100),
          privacy:
            isOwnerRole(actor.role)
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
    if (path === "tickets" || path === "reply") await ensureMailboxIndexes();
    const now = new Date().toISOString();
    if (path === "tickets") {
      const ticket = await transaction(async (repo) => {
        const ticket = await createCareTicket(repo, user, raw, now);
        await queueContactNotification(repo, {
          id: ticket.id,
          ticketId: "tickets:" + ticket.id,
          name: ticket.name,
          email: ticket.email,
          subject: ticket.subject,
          message: ticket.messages[0]?.text || "Support request",
        });
        return ticket;
      });
      await attemptContactNotification(`contact-notification-${ticket.id}`);
      return ticket;
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
      const result = await transaction(async (repo) => {
        const ticket = await repo.get<CareTicket>("tickets", input.ticketId);
        if (!ticket || ticket.userId !== user.id)
          throw new ApiError(404, "Request not found.");
        if (
          ticket.messages.some((m) => m.id === input.idempotencyKey) ||
          (await repo.get("support_messages", input.idempotencyKey))
        )
          return hydrateCareTicket(repo, ticket);

        if ((await hydrateCareTicket(repo, ticket)).status === "Closed")
          throw new ApiError(
            409,
            "This request is closed. Please create another request.",
          );
        await appendConversationMessage(repo, {
          id: input.idempotencyKey,
          ticketId: "tickets:" + ticket.id,
          sender: "customer",
          text: input.message,
          time: now,
        });
        ticket.status = "Open";
        ticket.updatedAt = now;
        await repo.put("tickets", ticket);
        await queueContactNotification(repo, {
          id: `customer-reply-${input.idempotencyKey}`,
          ticketId: "tickets:" + ticket.id,
          name: ticket.name,
          email: ticket.email,
          subject: ticket.subject,
          message: input.message,
        });
        return hydrateCareTicket(repo, ticket);
      });
      await attemptContactNotification(
        `contact-notification-customer-reply-${input.idempotencyKey}`,
      );
      return result;
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
    if (path === "revoke-session") {
      const { sessionId } = z
        .object({ sessionId: z.string().min(1) })
        .strict()
        .parse(raw);
      await transaction(async (repo) => {
        const session = await repo.get<Session>("sessions", sessionId);
        if (session && session.userId === user.id) {
          await repo.remove("sessions", sessionId);
        }
      });
      return { ok: true, message: "Device session signed out." };
    }
    if (path === "revoke-other-sessions") {
      const currentHash = await currentSessionId();
      let revokedCount = 0;
      await transaction(async (repo) => {
        const userSessions = await repo.find<Session>("sessions", {
          userId: user.id,
        });
        for (const s of userSessions) {
          if (s.id !== currentHash) {
            await repo.remove("sessions", s.id);
            revokedCount++;
          }
        }
      });
      return {
        ok: true,
        revokedCount,
        message: `Signed out ${revokedCount} other active sessions.`,
      };
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
      await ensureMailboxIndexes();
      const replyId = randomUUID();
      const result = await transaction(async (repo) => {
        const actor = await repo.get<User>("users", user.id);
        if (!actor || !canManageSupport(actor))
          throw new ApiError(403, "Access denied.");
        if (input.kind === "privacy") {
          if (!isOwnerRole(actor.role)) throw new ApiError(403, "Access denied.");
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
          const previous = await repo.get<{ id: string }>(
            "support_conversations",
            "tickets:" + ticket.id,
          );
          await repo.put("support_conversations", {
            ...previous,
            id: "tickets:" + ticket.id,
            status: normalizeSupportStatus(status),
          });
          if (input.reply) {
            await saveReply(repo, {
              ticketId: "tickets:" + ticket.id,
              replyText: input.reply,
              requestId: replyId,
              status: status === "Resolved" ? "Resolved" : "Waiting",
            });
          }
          const meta = await repo.get<{ id: string }>(
            "support_conversations",
            "tickets:" + ticket.id,
          );
          await repo.put("support_conversations", {
            ...meta,
            id: "tickets:" + ticket.id,
            status: normalizeSupportStatus(status),
          });
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
      if (input.kind === "ticket" && input.reply)
        await attemptContactNotification("support-reply-" + replyId);
      return result;
    }
    throw new ApiError(404, "Endpoint not found.");
  });
}
