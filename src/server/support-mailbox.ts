import { mongo } from "./db";
import { z } from "zod";
import type { Repository } from "./db";
import { ApiError } from "./http";
import { listInbox } from "./support-inbox";

export type MailboxMeta = {
  id: string;
  folder: "Inbox" | "Archive" | "Spam" | "Trash" | "Deleted";
  starred: boolean;
  important: boolean;
  labels?: string[];
  readAt?: string;
};

export type MailDraft = {
  id: string;
  to: string;
  subject: string;
  text: string;
  updatedAt: string;
  cc?: string[];
  bcc?: string[];
  attachments?: string[];
  forwardTicketId?: string;
};

export type ScheduledMail = {
  id: string;
  ticketId?: string;
  to: string;
  subject: string;
  text: string;
  scheduledFor: string;
  createdAt: string;
  cc?: string[];
  bcc?: string[];
  attachments?: string[];
  status: "scheduled" | "dispatched" | "cancelled";
};

export type SupportTemplate = {
  id: string;
  title: string;
  subject?: string;
  content: string;
  category?: string;
};

export type SupportLabel = {
  id: string;
  name: string;
  color: string;
};

export type SupportSettings = {
  id: string;
  signature: string;
  sendingName: string;
  sendingEmail: string;
  enableSignatureByDefault: boolean;
};

export const defaultTemplates: SupportTemplate[] = [
  {
    id: "tpl-1",
    title: "Order Status & Tracking",
    subject: "Order Status & Tracking Information",
    content:
      "Dear {customer_name},\n\nThank you for contacting OVIA Support regarding order #{order_id}.\n\nYour order has been verified and is currently on schedule. You can view the live courier updates using the link below:\nhttps://www.ovias.shop/account/orders/{order_id}\n\nPlease don't hesitate to reach back out if you have any questions.\n\nWarm regards,\nOVIA Concierge Support",
    category: "Orders",
  },
  {
    id: "tpl-2",
    title: "Return & Refund Approved",
    subject: "Update on Your Return & Refund Request",
    content:
      "Dear {customer_name},\n\nWe have approved your request regarding complaint #{ticket_number}.\n\nYour return has been logged, and your refund of the full order amount will be credited back to your original payment method within 3–5 business days.\n\nThank you for choosing OVIA.\n\nBest regards,\nOVIA Care Team",
    category: "Refunds",
  },
  {
    id: "tpl-3",
    title: "Issue Investigation in Progress",
    subject: "We're Looking Into Your Inquiry",
    content:
      "Dear {customer_name},\n\nThank you for reaching out to us. We have received your inquiry regarding \"{complaint_subject}\".\n\nOur senior specialists are actively investigating the issue and will follow up with you as soon as we have an update.\n\nThank you for your patience.\n\nWarm regards,\nOVIA Support",
    category: "General",
  },
  {
    id: "tpl-4",
    title: "Delivery Confirmation",
    subject: "Delivery Confirmation for Order #{order_id}",
    content:
      "Dear {customer_name},\n\nWe are delighted to confirm that your order #{order_id} has been successfully delivered.\n\nWe hope you love your new purchase. If you require any assistance with care or maintenance, our team is always here for you.\n\nSincerely,\nOVIA Customer Care",
    category: "Delivery",
  },
];

export const defaultLabels: SupportLabel[] = [
  { id: "lbl-1", name: "Delivery Issue", color: "#EF4444" },
  { id: "lbl-2", name: "Order Issue", color: "#3B82F6" },
  { id: "lbl-3", name: "Payment", color: "#10B981" },
  { id: "lbl-4", name: "Refund", color: "#8B5CF6" },
  { id: "lbl-5", name: "VIP Customer", color: "#F59E0B" },
  { id: "lbl-6", name: "Urgent Escalation", color: "#DC2626" },
];

export const defaultSettings: SupportSettings = {
  id: "global",
  signature:
    "OVIA\nCustomer Support\nadarshshukla4639@gmail.com",
  sendingName: "OVIA",
  sendingEmail: "adarshshukla4639@gmail.com",
  enableSignatureByDefault: true,
};

export const mailboxSchema = z
  .object({
    ids: z.array(z.string().min(1).max(250)).min(1).max(100),
    action: z.enum([
      "folder",
      "star",
      "important",
      "read",
      "label",
      "delete_permanent",
    ]),
    folder: z.enum(["Inbox", "Archive", "Spam", "Trash"]).optional(),
    value: z.boolean().optional(),
    labelName: z.string().max(50).optional(),
  })
  .strict();

export async function updateMailbox(
  repo: Repository,
  input: z.infer<typeof mailboxSchema>,
) {
  const rows = await listInbox(repo);
  const matches = input.ids.map((id) => rows.find((row) => row.id === id));
  if (matches.some((row) => !row))
    throw new ApiError(404, "One of these conversations no longer exists.");
  if (input.action === "folder" && !input.folder)
    throw new ApiError(400, "Select a folder.");
  if (
    !["folder", "delete_permanent"].includes(input.action) &&
    input.value === undefined
  )
    throw new ApiError(400, "A value is required.");

  for (const row of matches) {
    if (!row) continue;
    const previous = (await repo.get<MailboxMeta>(
      "support_mailbox",
      row.id,
    )) || {
      id: row.id,
      folder: "Inbox" as const,
      starred: false,
      important: false,
      labels: [],
    };
    const next = { ...previous };
    if (input.action === "folder") next.folder = input.folder!;
    if (input.action === "star") next.starred = input.value!;
    if (input.action === "important") next.important = input.value!;
    if (input.action === "read")
      next.readAt = input.value ? new Date().toISOString() : undefined;
    if (input.action === "label" && input.labelName) {
      const current = next.labels || [];
      if (input.value) {
        if (!current.includes(input.labelName)) {
          next.labels = [...current, input.labelName];
        }
      } else {
        next.labels = current.filter((l) => l !== input.labelName);
      }
    }
    if (input.action === "delete_permanent") {
      next.folder = "Deleted";
    }
    await repo.put("support_mailbox", next);
  }
}

export const draftSchema = z
  .object({
    action: z.literal("draft"),
    requestId: z.uuid(),
    to: z.string().max(200),
    subject: z.string().max(200),
    text: z.string().max(4000),
    cc: z.array(z.string().max(200)).max(20).optional(),
    bcc: z.array(z.string().max(200)).max(20).optional(),
    attachments: z.array(z.uuid()).max(5).optional(),
    forwardTicketId: z.string().max(250).optional(),
  })
  .strict();

export const composeSchema = z
  .object({
    action: z.literal("compose"),
    requestId: z.uuid(),
    draftId: z.uuid().optional(),
    to: z.email().max(200),
    subject: z.string().trim().min(1).max(200),
    text: z.string().trim().min(1).max(4000),
    cc: z.array(z.email()).max(20).optional(),
    bcc: z.array(z.email()).max(20).optional(),
    attachments: z.array(z.uuid()).max(5).optional(),
    forwardTicketId: z.string().max(250).optional(),
  })
  .strict();

export const scheduleSchema = z
  .object({
    action: z.literal("schedule"),
    requestId: z.uuid(),
    ticketId: z.string().max(250).optional(),
    to: z.email().max(200),
    subject: z.string().trim().min(1).max(200),
    text: z.string().trim().min(1).max(4000),
    scheduledFor: z.string().min(1),
    cc: z.array(z.email()).max(20).optional(),
    bcc: z.array(z.email()).max(20).optional(),
    attachments: z.array(z.uuid()).max(5).optional(),
  })
  .strict();

export const cancelScheduledSchema = z
  .object({
    action: z.literal("cancel_scheduled"),
    id: z.string().min(1),
  })
  .strict();

export const templateSchema = z
  .object({
    action: z.literal("template"),
    id: z.string().min(1).optional(),
    title: z.string().trim().min(1).max(100),
    subject: z.string().trim().max(200).optional(),
    content: z.string().trim().min(1).max(4000),
    category: z.string().max(50).optional(),
    delete: z.boolean().optional(),
  })
  .strict();

export const customLabelSchema = z
  .object({
    action: z.literal("label"),
    id: z.string().min(1).optional(),
    name: z.string().trim().min(1).max(50),
    color: z.string().trim().min(1).max(20),
    delete: z.boolean().optional(),
  })
  .strict();

export const settingsSchema = z
  .object({
    action: z.literal("settings"),
    signature: z.string().max(2000),
    sendingName: z.string().max(100),
    sendingEmail: z.string().max(100),
    enableSignatureByDefault: z.boolean(),
  })
  .strict();

export async function saveDraft(
  repo: Repository,
  input: z.infer<typeof draftSchema>,
) {
  const draft = {
    id: input.requestId,
    to: input.to,
    cc: input.cc || [],
    bcc: input.bcc || [],
    attachments: input.attachments || [],
    forwardTicketId: input.forwardTicketId,
    subject: input.subject,
    text: input.text,
    updatedAt: new Date().toISOString(),
  };
  await repo.put("support_drafts", draft);
  return draft;
}

export async function saveScheduled(
  repo: Repository,
  input: z.infer<typeof scheduleSchema>,
) {
  const id = `scheduled-${input.requestId}`;
  const scheduled: ScheduledMail = {
    id,
    ticketId: input.ticketId,
    to: input.to,
    subject: input.subject,
    text: input.text,
    scheduledFor: input.scheduledFor,
    createdAt: new Date().toISOString(),
    cc: input.cc || [],
    bcc: input.bcc || [],
    attachments: input.attachments || [],
    status: "scheduled",
  };
  await repo.put("support_scheduled", scheduled);
  return scheduled;
}

export async function cancelScheduled(repo: Repository, id: string) {
  const item = await repo.get<ScheduledMail>("support_scheduled", id);
  if (item) {
    item.status = "cancelled";
    await repo.put("support_scheduled", item);
  }
  return true;
}

export async function saveTemplate(
  repo: Repository,
  input: z.infer<typeof templateSchema>,
) {
  if (input.delete && input.id) {
    await repo.remove("support_templates", input.id);
    return { id: input.id, deleted: true };
  }
  const id = input.id || `tpl-${crypto.randomUUID()}`;
  const template: SupportTemplate = {
    id,
    title: input.title,
    subject: input.subject,
    content: input.content,
    category: input.category || "General",
  };
  await repo.put("support_templates", template);
  return template;
}

export async function saveCustomLabel(
  repo: Repository,
  input: z.infer<typeof customLabelSchema>,
) {
  if (input.delete && input.id) {
    await repo.remove("support_labels", input.id);
    return { id: input.id, deleted: true };
  }
  const id = input.id || `lbl-${crypto.randomUUID()}`;
  const label: SupportLabel = {
    id,
    name: input.name,
    color: input.color,
  };
  await repo.put("support_labels", label);
  return label;
}

export async function saveSupportSettings(
  repo: Repository,
  input: z.infer<typeof settingsSchema>,
) {
  const settings: SupportSettings = {
    id: "global",
    signature: input.signature,
    sendingName: input.sendingName,
    sendingEmail: input.sendingEmail,
    enableSignatureByDefault: input.enableSignatureByDefault,
  };
  await repo.put("support_settings", settings);
  return settings;
}

export async function emptyTrash(repo: Repository) {
  const rows = await listInbox(repo);
  for (const row of rows) {
    const meta = await repo.get<MailboxMeta>("support_mailbox", row.id);
    if (meta?.folder === "Trash") {
      meta.folder = "Deleted";
      await repo.put("support_mailbox", meta);
    }
  }
  return true;
}

export async function queueComposition(
  repo: Repository,
  input: z.infer<typeof composeSchema>,
) {
  const id = `support-compose-${input.requestId}`;
  if (input.attachments?.length) {
    const { validateAttachmentLinks } = await import("./support-attachments");
    await validateAttachmentLinks(
      repo,
      input.attachments,
      input.forwardTicketId || "outbox:" + id,
      undefined,
      true,
    );
  }
  if (
    input.forwardTicketId &&
    !(await listInbox(repo)).some((t) => t.id === input.forwardTicketId)
  )
    throw new ApiError(404, "Conversation not found.");
  const existing = await repo.get<MailDraft>("support_sent", id);
  if (
    existing &&
    (existing.to !== input.to ||
      existing.subject !== input.subject ||
      existing.text !== input.text ||
      JSON.stringify(existing.cc || []) !== JSON.stringify(input.cc || []) ||
      JSON.stringify(existing.bcc || []) !== JSON.stringify(input.bcc || []) ||
      JSON.stringify(existing.attachments || []) !==
        JSON.stringify(input.attachments || []))
  )
    throw new ApiError(409, "Email draft identity already used.");
  if (!existing) {
    const time = new Date().toISOString();
    await repo.put("support_sent", {
      id,
      to: input.to,
      subject: input.subject,
      text: input.text,
      updatedAt: time,
      cc: input.cc || [],
      bcc: input.bcc || [],
      attachments: input.attachments || [],
      forwardTicketId: input.forwardTicketId,
    });
    await repo.put("outbox", {
      id,
      to: input.to,
      cc: input.cc || [],
      bcc: input.bcc || [],
      attachments: input.attachments || [],
      forwardTicketId: input.forwardTicketId,
      subject: input.subject.replace(/[\r\n]/g, " "),
      text: input.text,
      status: "pending",
      createdAt: time,
      replyTo: process.env.SUPPORT_REPLY_TO || "adarshshukla4639@gmail.com",
    });
    if (input.forwardTicketId)
      await repo.put("support_forwards", {
        id,
        ticketId: input.forwardTicketId,
        to: input.to,
        createdAt: time,
      });
  }
  if (input.draftId) await repo.remove("support_drafts", input.draftId);
  return id;
}

export async function dispatchScheduledEmails(repo: Repository) {
  const now = new Date().toISOString();
  const scheduled = await repo.find<ScheduledMail>("support_scheduled");
  const due = scheduled.filter(
    (s) => s.status === "scheduled" && s.scheduledFor <= now,
  );
  if (!due.length) return;
  const { attemptContactNotification } = await import(
    "./contact-notifications"
  );
  const { saveReply } = await import("./support-inbox");
  for (const item of due) {
    try {
      if (item.ticketId) {
        await saveReply(repo, {
          ticketId: item.ticketId,
          replyText: item.text,
          status: "Waiting",
          requestId: crypto.randomUUID(),
          attachments: item.attachments,
        });
        await attemptContactNotification(
          `support-reply-${item.id.replace("scheduled-", "")}`,
        );
      } else {
        const id = await queueComposition(repo, {
          action: "compose",
          requestId: crypto.randomUUID(),
          to: item.to,
          subject: item.subject,
          text: item.text,
          cc: item.cc,
          bcc: item.bcc,
          attachments: item.attachments,
        });
        await attemptContactNotification(id);
      }
      item.status = "dispatched";
      await repo.put("support_scheduled", item);
    } catch (e) {
      console.error("Failed to dispatch scheduled email:", item.id, e);
    }
  }
}

export async function mailboxData(repo: Repository) {
  // Automatically dispatch any due scheduled emails
  try {
    await dispatchScheduledEmails(repo);
  } catch (err) {
    console.error("Scheduled dispatch error:", err);
  }

  const [
    tickets,
    meta,
    drafts,
    scheduled,
    templates,
    labels,
    settings,
    outbox,
    sent,
    notes,
    forwards,
  ] = await Promise.all([
    listInbox(repo),
    repo.find<MailboxMeta>("support_mailbox"),
    repo.find<MailDraft>("support_drafts"),
    repo.find<ScheduledMail>("support_scheduled"),
    repo.find<SupportTemplate>("support_templates"),
    repo.find<SupportLabel>("support_labels"),
    repo.find<SupportSettings>("support_settings"),
    repo.find<{
      id: string;
      ticketId?: string;
      attachments?: string[];
      cc?: string[];
      to: string;
      subject: string;
      text: string;
      status: string;
      createdAt: string;
    }>("outbox"),
    repo.find<MailDraft>("support_sent"),
    repo.find<{
      id: string;
      ticketId: string;
      text: string;
      actor: string;
      createdAt: string;
    }>("support_notes"),
    repo.find<{
      id: string;
      ticketId: string;
      to: string;
      createdAt: string;
    }>("support_forwards"),
  ]);

  const updated = tickets.map((ticket) => {
    const m = meta.find((m) => m.id === ticket.id);
    const lastCustomer =
      ticket.messages.filter((m) => m.sender === "customer").at(-1)?.time ||
      ticket.createdAt ||
      "";
    return {
      ...ticket,
      notes: notes.filter((n) => n.ticketId === ticket.id),
      forwards: forwards.filter((n) => n.ticketId === ticket.id),
      folder: m?.folder || "Inbox",
      starred: m?.starred || false,
      important: m?.important || false,
      labels: m?.labels || (ticket.category ? [ticket.category] : []),
      read: !!m?.readAt && m.readAt >= lastCustomer,
      messages: ticket.messages.map((message) => {
        if (message.sender !== "support") return message;
        const mail = outbox.find(
          (mail) =>
            mail.ticketId === ticket.id && mail.createdAt === message.time,
        );
        return {
          ...message,
          delivery: mail
            ? mail.status === "sent"
              ? "Sent"
              : "Queued"
            : "Saved",
        };
      }),
    };
  });

  const outgoingMessages = outbox
    .filter(
      (mail) =>
        mail.id.startsWith("support-reply-") ||
        mail.id.startsWith("support-compose-"),
    )
    .map((mail) => {
      const composed = sent.find((s) => s.id === mail.id);
      const ticket = updated.find((t) => t.id === mail.ticketId);
      const text =
        composed?.text ||
        ticket?.messages.find(
          (m) => m.sender === "support" && m.time === mail.createdAt,
        )?.text ||
        (mail.text === "[delivered]"
          ? "Email content is no longer available."
          : mail.text);
      return {
        id: ticket ? `sent:${ticket.id}` : `outbox:${mail.id}`,
        conversationId: ticket?.id,
        customer: mail.to,
        email: mail.to,
        subject: ticket?.subject || mail.subject,
        category: "Outgoing",
        status: mail.status === "sent" ? "Sent" : "Queued",
        folder: "Sent",
        read: true,
        starred: false,
        important: false,
        labels: ["Outgoing"],
        createdAt: mail.createdAt,
        messages: ticket
          ? ticket.messages
          : [
              {
                sender: "support",
                text,
                time: mail.createdAt,
                delivery: mail.status === "sent" ? "Sent" : "Queued",
                attachments: mail.attachments || [],
              },
            ],
        source: "outgoing",
        attachments: mail.attachments?.map(
          (id) => "/api/support/attachments/" + id,
        ),
      };
    });

  const outgoing = Array.from(
    new Map(
      outgoingMessages
        .sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""))
        .map((entry) => [entry.id, entry]),
    ).values(),
  );

  const activeTickets = updated.filter((t) => t.folder !== "Deleted");

  return {
    tickets: [...activeTickets, ...outgoing].sort((a, b) =>
      (b.createdAt || "").localeCompare(a.createdAt || ""),
    ),
    drafts: drafts.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    scheduled: (scheduled || [])
      .filter((s) => s.status === "scheduled")
      .sort((a, b) => (a.scheduledFor || "").localeCompare(b.scheduledFor || "")),
    templates: templates && templates.length > 0 ? templates : defaultTemplates,
    labels: labels && labels.length > 0 ? labels : defaultLabels,
    settings: settings?.[0] || defaultSettings,
  };
}

let indexes: Promise<unknown> | undefined;
export function ensureMailboxIndexes() {
  if (!indexes)
    indexes = mongo()
      .then((client) => {
        const db = client.db(process.env.MONGODB_DB || "ovia");
        return Promise.all([
          db
            .collection("support_messages")
            .createIndex({ ticketId: 1, time: 1 }),
          db.collection("support_notes").createIndex({ ticketId: 1 }),
          ...[
            "support_messages",
            "support_conversations",
            "support_notes",
            "support_forwards",
            "support_attachments",
            "support_email_receipts",
            "support_connections",
            "support_mailbox",
            "support_drafts",
            "support_sent",
            "support_tickets",
            "tickets",
            "outbox",
            "support_scheduled",
            "support_templates",
            "support_labels",
            "support_settings",
          ].map((name) =>
            db.collection(name).createIndex({ id: 1 }, { unique: true }),
          ),
        ]);
      })
      .catch((error) => {
        indexes = undefined;
        throw error;
      });
  return indexes;
}
