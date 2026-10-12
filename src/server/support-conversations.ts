import type { Repository } from "./db";
import { ApiError } from "./http";
import { createHash } from "node:crypto";
import { z } from "zod";

export const supportStatuses = [
  "New",
  "Open",
  "In Progress",
  "Waiting",
  "Resolved",
  "Closed",
] as const;
export const supportPriorities = ["Low", "Normal", "High", "Urgent"] as const;
export type ConversationMessage = {
  id: string;
  ticketId: string;
  sender: "customer" | "support";
  text: string;
  time: string;
  attachments?: string[];
  source?: "website" | "email";
  emailMessageId?: string;
  delivery?: "Queued" | "Sent" | "Saved";
  cc?: string[];
};
export type ConversationMeta = {
  id: string;
  status?: string;
  priority?: string;
  assignedTo?: string;
  gmailThreadIds?: string[];
  participants?: string[];
};
export function ticketReference(id: string) {
  return (
    "OV-SUP-" +
    createHash("sha256").update(id).digest("hex").slice(0, 32).toUpperCase()
  );
}
export function normalizeSupportStatus(status?: string) {
  if (status === "In Review") return "In Progress";
  if (["Waiting for reply", "Waiting for Customer"].includes(status || ""))
    return "Waiting";
  return supportStatuses.includes(status as (typeof supportStatuses)[number])
    ? status!
    : "Open";
}
export async function conversationMessages(
  repo: Repository,
  ticketId: string,
  legacy: Omit<ConversationMessage, "ticketId" | "id">[],
) {
  const stored = await repo.find<ConversationMessage>("support_messages", {
    ticketId,
  });
  const previous = legacy.map((m, i) => ({
    ...m,
    id:
      "legacy-" +
      createHash("sha256")
        .update(ticketId + ":" + i + ":" + m.time + ":" + m.text)
        .digest("hex"),
    ticketId,
  }));
  return [...previous, ...stored].sort(
    (a, b) => a.time.localeCompare(b.time) || a.id.localeCompare(b.id),
  );
}
export async function appendConversationMessage(
  repo: Repository,
  message: ConversationMessage,
) {
  const existing = await repo.get<ConversationMessage>(
    "support_messages",
    message.id,
  );
  if (existing) {
    if (
      existing.ticketId !== message.ticketId ||
      existing.sender !== message.sender ||
      existing.text !== message.text ||
      JSON.stringify(existing.attachments || []) !==
        JSON.stringify(message.attachments || [])
    )
      throw new ApiError(409, "Message identity already used.");
    return false;
  }
  await repo.put("support_messages", message);
  const parts = /^(contact|support_tickets|tickets):(.+)$/.exec(
    message.ticketId,
  );
  if (!parts) throw new ApiError(400, "Invalid conversation.");
  const ticket = await repo.get<{ id: string; updatedAt?: string }>(
    parts[1],
    parts[2],
  );
  if (!ticket) throw new ApiError(404, "Conversation not found.");
  await repo.put(parts[1], { ...ticket, updatedAt: message.time });
  if (message.sender === "customer") {
    const meta = await repo.get<ConversationMeta>(
      "support_conversations",
      message.ticketId,
    );
    await repo.put("support_conversations", {
      ...meta,
      id: message.ticketId,
      status: "Open",
    });
  }
  return true;
}
export async function hydrateCareTicket<
  T extends {
    id: string;
    messages: {
      id: string;
      author: "customer" | "support";
      text: string;
      createdAt: string;
      attachments?: string[];
    }[];
    status: string;
  },
>(repo: Repository, ticket: T) {
  const id = "tickets:" + ticket.id;
  const stored = await repo.find<ConversationMessage>("support_messages", {
    ticketId: id,
  });
  const meta = await repo.get<ConversationMeta>("support_conversations", id);
  return {
    ...ticket,
    ticketNumber: ticketReference(id),
    status: normalizeSupportStatus(meta?.status || ticket.status),
    messages: [
      ...ticket.messages,
      ...stored.map((m) => ({
        id: m.id,
        author: m.sender,
        text: m.text,
        createdAt: m.time,
        attachments: m.attachments,
      })),
    ].sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  };
}
export const conversationActionSchema = z
  .object({
    ticketId: z.string().min(1).max(250),
    action: z.enum(["status", "priority", "note", "assign"]),
    status: z.enum(supportStatuses).optional(),
    priority: z.enum(supportPriorities).optional(),
    text: z.string().trim().min(1).max(4000).optional(),
    requestId: z.uuid().optional(),
    assignedTo: z.string().max(100).optional(),
  })
  .strict();
export async function updateConversation(
  repo: Repository,
  input: z.infer<typeof conversationActionSchema>,
  actor: { id: string; email: string },
) {
  const match = /^(contact|support_tickets|tickets):(.+)$/.exec(input.ticketId);
  if (!match || !(await repo.get(match[1], match[2])))
    throw new ApiError(404, "Conversation not found.");
  const prior = await repo.get<ConversationMeta>(
    "support_conversations",
    input.ticketId,
  );
  const next = { ...prior, id: input.ticketId };
  const time = new Date().toISOString();
  if (input.action === "status") {
    if (!input.status) throw new ApiError(400, "Select a status.");
    next.status = input.status;
  }
  if (input.action === "priority") {
    if (!input.priority) throw new ApiError(400, "Select a priority.");
    next.priority = input.priority;
  }
  if (input.action === "assign") {
    if (input.assignedTo) {
      const user = await repo.get<{ id: string; role?: string }>(
        "users",
        input.assignedTo,
      );
      if (
        !user ||
        !["OWNER", "ADMIN", "SUPPORT"].includes((user.role || "").toUpperCase())
      )
        throw new ApiError(400, "Choose a support agent.");
    }
    next.assignedTo = input.assignedTo || undefined;
  }
  if (input.action === "note") {
    if (!input.text || !input.requestId)
      throw new ApiError(400, "A note and request identity are required.");
    const id = "note-" + input.requestId,
      existing = await repo.get<{ id: string; ticketId: string; text: string }>(
        "support_notes",
        id,
      );
    if (
      existing &&
      (existing.ticketId !== input.ticketId || existing.text !== input.text)
    )
      throw new ApiError(409, "Note identity already used.");
    if (!existing)
      await repo.put("support_notes", {
        id,
        ticketId: input.ticketId,
        text: input.text,
        actor: actor.email,
        createdAt: time,
      });
  }
  await repo.put("support_conversations", next);
  await repo.put("audit", {
    id: "support-action-" + (input.requestId || crypto.randomUUID()),
    actor: actor.email,
    action: "SUPPORT_" + input.action.toUpperCase(),
    resourceId: input.ticketId,
    createdAt: time,
  });
  return next;
}
export async function ownConversations(
  repo: Repository,
  user: { id: string; email: string; verifiedAt?: string },
) {
  const { listInbox } = await import("./support-inbox");
  const rows = await listInbox(repo);
  return rows
    .filter(
      (t) =>
        ("userId" in t && t.userId === user.id) ||
        (!!user.verifiedAt &&
          t.email.toLowerCase() === user.email.toLowerCase()),
    )
    .map(
      ({
        id,
        subject,
        category,
        status,
        createdAt,
        updatedAt,
        messages,
        ticketNumber,
      }) => ({
        id,
        subject,
        category,
        status,
        createdAt,
        updatedAt,
        messages,
        ticketNumber,
      }),
    );
}
