import {
  appendConversationMessage,
  conversationMessages,
  ticketReference,
  normalizeSupportStatus,
  type ConversationMeta,
} from "./support-conversations";
import type { CareTicket } from "@/lib/care";
import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import type { Repository } from "./db";
import { ApiError } from "./http";

export type SupportMessage = {
  sender: "customer" | "support";
  text: string;
  time: string;
  delivery?: "Queued" | "Sent" | "Saved";
  id?: string;
  attachments?: string[];
  cc?: string[];
};
export type InboxRecord = {
  id: string;
  customerName?: string;
  name?: string;
  customerEmail?: string;
  email?: string;
  subject?: string;
  category?: string;
  message?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  messages?: SupportMessage[];
  source?: string;
  userId?: string;
  orderId?: string;
  ticketNumber?: string;
};
export function inboxView(
  record: InboxRecord,
  collection: "contact" | "support_tickets" | "tickets",
) {
  return {
    ...record,
    id: `${collection}:${record.id}`,
    customer: record.customerName || record.name || "Customer",
    email: record.customerEmail || record.email || "",
    subject:
      record.subject || record.message?.slice(0, 80) || "Customer inquiry",
    category: record.category || "Inquiry",
    ticketNumber:
      record.ticketNumber || ticketReference(collection + ":" + record.id),
    priority: "Normal",
    status:
      record.status === "resolved"
        ? "Resolved"
        : record.status === "received"
          ? "Open"
          : record.status || "Open",
    messages: (record.messages?.length
      ? record.messages
      : [
          {
            sender: "customer",
            text: record.message || "",
            time: record.createdAt || "",
          },
        ]) as SupportMessage[],
  };
}
export async function listInbox(repo: Repository) {
  const [contacts, tickets, care] = await Promise.all([
    repo.find<InboxRecord>("contact"),
    repo.find<InboxRecord>("support_tickets"),
    repo.find<CareTicket>("tickets"),
  ]);
  const rows = [
    ...contacts.map((c) => inboxView(c, "contact")),
    ...tickets.map((t) => inboxView(t, "support_tickets")),
    ...care.map((t) =>
      inboxView(
        {
          ...t,
          messages: t.messages.map((m) => ({
            sender: m.author,
            text: m.text,
            time: m.createdAt,
            attachments: m.attachments,
          })),
        },
        "tickets",
      ),
    ),
  ];
  const meta = await repo.find<ConversationMeta>("support_conversations");
  return Promise.all(
    rows.map(async (row) => {
      const m = meta.find((v) => v.id === row.id);
      const messages = await conversationMessages(repo, row.id, row.messages);
      return {
        ...row,
        status: normalizeSupportStatus(m?.status || row.status),
        priority: m?.priority || "Normal",
        assignedTo: m?.assignedTo,
        gmailThreadIds: m?.gmailThreadIds || [],
        participants: m?.participants || [],
        messages,
      };
    }),
  ).then((rows) =>
    rows.sort((a, b) =>
      (b.updatedAt || b.createdAt || "").localeCompare(
        a.updatedAt || a.createdAt || "",
      ),
    ),
  );
}
export const replySchema = z
  .object({
    ticketId: z.string().max(250),
    replyText: z.string().trim().min(1).max(4000),
    status: z.enum(["Waiting", "Resolved"]).default("Waiting"),
    requestId: z.uuid(),
    attachments: z.array(z.string().max(150)).max(5).optional(),
    replyAll: z.boolean().optional(),
  })
  .strict();
export async function saveReply(
  repo: Repository,
  input: z.infer<typeof replySchema>,
) {
  const match = /^(contact|support_tickets|tickets):(.+)$/.exec(input.ticketId);
  if (!match) throw new ApiError(400, "Invalid conversation.");
  const care =
    match[1] === "tickets"
      ? await repo.get<CareTicket>("tickets", match[2])
      : undefined;
  const record: InboxRecord | undefined = care
    ? {
        ...care,
        messages: care.messages.map((m) => ({
          sender: m.author,
          text: m.text,
          time: m.createdAt,
        })),
      }
    : await repo.get<InboxRecord>(match[1], match[2]);
  if (!record) throw new ApiError(404, "Conversation not found.");
  const email = record.customerEmail || record.email;
  if (!email || !z.email().safeParse(email).success)
    throw new ApiError(400, "This conversation has no valid reply email.");
  const mailId = `support-reply-${input.requestId}`;
  const inputDigest = createHash("sha256")
    .update(
      JSON.stringify({
        text: input.replyText,
        attachments: input.attachments || [],
        replyAll: input.replyAll || false,
        status: input.status,
      }),
    )
    .digest("hex");
  const existing = await repo.get<{
    id: string;
    ticketId: string;
    inputDigest?: string;
  }>("outbox", mailId);
  if (
    existing &&
    (existing.ticketId !== input.ticketId ||
      (existing.inputDigest && existing.inputDigest !== inputDigest))
  )
    throw new ApiError(409, "Reply identity already used.");
  if (!existing) {
    const time = new Date().toISOString();
    const view = inboxView(
      record,
      match[1] as "contact" | "support_tickets" | "tickets",
    );
    const meta = await repo.get<ConversationMeta>(
      "support_conversations",
      input.ticketId,
    );
    if (normalizeSupportStatus(meta?.status || record.status) === "Closed")
      throw new ApiError(409, "This request is closed.");
    const { validateAttachmentLinks } = await import("./support-attachments");
    await validateAttachmentLinks(
      repo,
      input.attachments || [],
      input.ticketId,
      undefined,
      true,
    );
    await appendConversationMessage(repo, {
      id: mailId,
      ticketId: input.ticketId,
      sender: "support",
      text: input.replyText,
      time,
      attachments: input.attachments || [],
    });
    await repo.put("support_conversations", {
      ...meta,
      id: input.ticketId,
      status: input.status === "Waiting" ? "Waiting" : "Resolved",
    });
    const cc = input.replyAll
      ? (meta?.participants || []).filter(
          (v) =>
            v.toLowerCase() !== email.toLowerCase() &&
            v.toLowerCase() !==
              (
                process.env.SUPPORT_INBOX_EMAIL || "adarshshukla4639@gmail.com"
              ).toLowerCase(),
        )
      : [];
    await repo.put("outbox", {
      id: mailId,
      inputDigest,
      ticketId: input.ticketId,
      to: email,
      subject: `Re: [${ticketReference(input.ticketId)}] ${view.subject}`,
      cc,
      attachments: input.attachments || [],
      replyTo: process.env.SUPPORT_REPLY_TO || "adarshshukla4639@gmail.com",
      text: input.replyText,
      status: "pending",
      createdAt: time,
    });
  }
  return (await listInbox(repo)).find((t) => t.id === input.ticketId)!;
}
export const inboundSchema = z
  .object({
    messageId: z.string().trim().min(1).max(250),
    from: z.email(),
    to: z.email(),
    name: z.string().max(200).optional(),
    subject: z.string().trim().min(1).max(200),
    text: z.string().trim().min(1).max(10000),
    verifiedSender: z.boolean().optional(),
    threadId: z.string().max(250).optional(),
    cc: z.array(z.email()).max(20).optional(),
    attachments: z.array(z.string().max(150)).max(5).optional(),
  })
  .strict();
export function verifyInboxAuthorization(
  header: string | null,
  secret = process.env.SUPPORT_INBOUND_SECRET,
) {
  if (!secret?.trim())
    throw new ApiError(503, "Inbound email authentication is not configured.");
  const supplied = Buffer.from(header || "");
  const expected = Buffer.from(`Bearer ${secret}`);
  if (
    supplied.length !== expected.length ||
    !timingSafeEqual(supplied, expected)
  )
    throw new ApiError(401, "Invalid inbound email authentication.");
}
export async function receiveEmail(
  repo: Repository,
  input: z.infer<typeof inboundSchema>,
  mailbox = process.env.SUPPORT_INBOX_EMAIL,
) {
  if (!mailbox)
    throw new ApiError(503, "Company support mailbox is not configured.");
  const toAddr = input.to.toLowerCase().trim();
  if (toAddr !== mailbox.toLowerCase().trim())
    throw new ApiError(400, "Recipient does not match the company mailbox.");
  const id = `email-${createHash("sha256").update(`${input.to.toLowerCase()}:${input.messageId}`).digest("hex")}`;
  const receipt = await repo.get<{ id: string; ticketId: string }>(
    "support_email_receipts",
    id,
  );
  if (receipt) {
    const parts = receipt.ticketId.split(":");
    return (await repo.get<InboxRecord>(parts[0], parts.slice(1).join(":")))!;
  }
  const existing = await repo.get<InboxRecord>("support_tickets", id);
  if (existing) {
    await repo.put("support_email_receipts", {
      id,
      ticketId: "support_tickets:" + id,
    });
    return existing;
  }
  const rows = await listInbox(repo);
  const subjUpper = input.subject.toUpperCase();
  let matched =
    input.verifiedSender === false
      ? undefined
      : rows.find(
          (row) =>
            (row.email.toLowerCase() === input.from.toLowerCase() ||
              row.participants.includes(input.from.toLowerCase())) &&
            ((input.threadId && row.gmailThreadIds.includes(input.threadId)) ||
              subjUpper.includes(ticketReference(row.id)) ||
              (row.ticketNumber && subjUpper.includes(row.ticketNumber.toUpperCase())) ||
              (row.orderId && subjUpper.includes(row.orderId.toUpperCase()))),
        );

  if (!matched && input.verifiedSender !== false) {
    const isReply = /^(re:|fwd:)/i.test(input.subject.trim());
    const customerOpen = rows.find(
      (row) =>
        (row.email.toLowerCase() === input.from.toLowerCase() ||
          row.participants.includes(input.from.toLowerCase())) &&
        row.status !== "Closed",
    );
    if ((isReply || Boolean(customerOpen)) && customerOpen) {
      matched = customerOpen;
    }
  }
  if (matched) {
    const time = new Date().toISOString();
    await appendConversationMessage(repo, {
      id,
      ticketId: matched.id,
      sender: "customer",
      text: input.text,
      time,
      source: "email",
      emailMessageId: input.messageId,
      attachments: input.attachments || [],
      cc: input.cc || [],
    });
    const meta = await repo.get<ConversationMeta>(
      "support_conversations",
      matched.id,
    );
    await repo.put("support_conversations", {
      ...meta,
      id: matched.id,
      status: "Open",
      gmailThreadIds: [
        ...new Set([
          ...(meta?.gmailThreadIds || []),
          ...(input.threadId ? [input.threadId] : []),
        ]),
      ],
      participants: [
        ...new Set([
          ...(meta?.participants || []),
          input.from.toLowerCase(),
          ...(input.cc || []).map((v) => v.toLowerCase()),
        ]),
      ],
    });
    const parts = matched.id.split(":");
    const collection = parts[0] as "contact" | "support_tickets" | "tickets";
    const docId = parts.slice(1).join(":");
    const existingTicket = await repo.get<any>(collection, docId);
    if (existingTicket) {
      await repo.put(collection, {
        ...existingTicket,
        status: "Open",
        updatedAt: time,
      });
    }
    const mailboxMeta = await repo.get<any>("support_mailbox", matched.id);
    if (mailboxMeta) {
      await repo.put("support_mailbox", {
        ...mailboxMeta,
        folder: "Inbox",
        readAt: undefined,
      });
    }
    await repo.put("support_email_receipts", { id, ticketId: matched.id });
    return {
      ...matched,
      id: matched.id.split(":").slice(1).join(":"),
      message: input.text,
    };
  }
  const time = new Date().toISOString();
  const record = {
    id,
    ticketNumber: `#MAIL-${randomUUID().slice(0, 8)}`,
    customerName: input.name || input.from,
    customerEmail: input.from.toLowerCase(),
    subject: input.subject,
    category: "Email",
    message: input.text,
    status: "Open",
    attachments: input.attachments || [],
    source: "email",
    createdAt: time,
    updatedAt: time,
  };
  await repo.put("support_tickets", record);
  await repo.put("support_conversations", {
    id: "support_tickets:" + id,
    status: "Open",
    gmailThreadIds: input.threadId ? [input.threadId] : [],
    participants: [
      input.from.toLowerCase(),
      ...(input.cc || []).map((v) => v.toLowerCase()),
    ],
  });
  await repo.put("support_email_receipts", {
    id,
    ticketId: "support_tickets:" + id,
  });
  return record;
}
