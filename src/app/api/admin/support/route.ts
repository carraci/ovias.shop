import {
  conversationActionSchema,
  updateConversation,
} from "@/server/support-conversations";
import { ZodError } from "zod";
import {
  mailboxData,
  ensureMailboxIndexes,
  mailboxSchema,
  updateMailbox,
  draftSchema,
  composeSchema,
  scheduleSchema,
  cancelScheduledSchema,
  templateSchema,
  customLabelSchema,
  settingsSchema,
  saveDraft,
  saveScheduled,
  cancelScheduled,
  saveTemplate,
  saveCustomLabel,
  saveSupportSettings,
  emptyTrash,
  queueComposition,
} from "@/server/support-mailbox";
import { attemptContactNotification } from "@/server/contact-notifications";
import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminApi } from "@/server/admin-auth";
import { transaction } from "@/server/db";
import { body, originCheck, ApiError, limit } from "@/server/http";
import { replySchema, saveReply } from "@/server/support-inbox";
import { syncGmailInbox } from "@/server/support-gmail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await authorizeAdminApi(req);
  if (!auth.authorized) return auth.response;
  try {
    let emailConnection;
    try {
      emailConnection = await syncGmailInbox(true);
    } catch {
      emailConnection = {
        connected: false,
        message:
          "Gmail synchronization failed. Check the company mailbox connection.",
      };
    }
    return NextResponse.json(
      {
        success: true,
        emailConnection,
        ...(await transaction(mailboxData)),
        updatedAt: new Date().toISOString(),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Unable to load the support inbox." },
      { status: 503 },
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await authorizeAdminApi(req);
  if (!auth.authorized) return auth.response;
  try {
    originCheck(req);
    await ensureMailboxIndexes();
    await limit(req, "support-send", 30);
    const raw = await body(req);

    if (raw.action === "draft") {
      const draft = await transaction((repo) =>
        saveDraft(repo, draftSchema.parse(raw)),
      );
      return NextResponse.json({
        success: true,
        draft,
        message: "Draft saved.",
      });
    }

    if (raw.action === "schedule") {
      const scheduled = await transaction((repo) =>
        saveScheduled(repo, scheduleSchema.parse(raw)),
      );
      return NextResponse.json({
        success: true,
        scheduled,
        message: "Email scheduled successfully.",
      });
    }

    if (raw.action === "cancel_scheduled") {
      const input = cancelScheduledSchema.parse(raw);
      await transaction((repo) => cancelScheduled(repo, input.id));
      return NextResponse.json({
        success: true,
        message: "Scheduled email cancelled.",
      });
    }

    if (raw.action === "template") {
      const input = templateSchema.parse(raw);
      const template = await transaction((repo) => saveTemplate(repo, input));
      return NextResponse.json({
        success: true,
        template,
        message: input.delete ? "Template removed." : "Template saved.",
      });
    }

    if (raw.action === "label") {
      const input = customLabelSchema.parse(raw);
      const label = await transaction((repo) => saveCustomLabel(repo, input));
      return NextResponse.json({
        success: true,
        label,
        message: input.delete ? "Label removed." : "Label saved.",
      });
    }

    if (raw.action === "settings") {
      const input = settingsSchema.parse(raw);
      const settings = await transaction((repo) =>
        saveSupportSettings(repo, input),
      );
      return NextResponse.json({
        success: true,
        settings,
        message: "Support settings saved.",
      });
    }

    if (raw.action === "empty_trash") {
      await transaction((repo) => emptyTrash(repo));
      return NextResponse.json({
        success: true,
        message: "Trash emptied.",
      });
    }

    if (raw.action === "sync_mail") {
      const syncResult = await syncGmailInbox(true);
      return NextResponse.json({
        success: true,
        emailConnection: syncResult,
        ...(await transaction(mailboxData)),
        message: syncResult.message || "Mailbox synchronized.",
      });
    }

    if (raw.action === "simulate_inbound_reply") {
      const { receiveEmail } = await import("@/server/support-inbox");
      const ticket = await transaction(async (repo) => {
        return receiveEmail(repo, {
          messageId: `sim-${Date.now()}`,
          from: raw.from || "customer@example.com",
          to: process.env.SUPPORT_INBOX_EMAIL || "support@ovias.shop",
          subject: raw.subject || `Re: [${raw.ticketId}] Customer Follow-up`,
          text: raw.text || "Thank you for the update! Here is my query.",
          threadId: raw.threadId,
        });
      });
      return NextResponse.json({
        success: true,
        ticket,
        ...(await transaction(mailboxData)),
        message: "Customer email reply received successfully.",
      });
    }

    if (raw.action === "compose") {
      const input = composeSchema.parse(raw);
      const id = await transaction((repo) => queueComposition(repo, input));
      const delivery = await attemptContactNotification(id);
      return NextResponse.json({
        success: true,
        delivery,
        message:
          delivery === "Sent"
            ? "Email accepted by the delivery provider."
            : "Email saved and queued for delivery.",
      });
    }

    const input = replySchema.parse(raw);
    const ticket = await transaction(async (repo) => {
      const ticket = await saveReply(repo, input);
      await repo.put("audit", {
        id: `support-${input.requestId}`,
        actor: auth.user.email,
        action: "TICKET_REPLY_QUEUED",
        resource: "support",
        resourceId: input.ticketId,
        createdAt: new Date().toISOString(),
      });
      return ticket;
    });
    const delivery = await attemptContactNotification(
      `support-reply-${input.requestId}`,
    );
    return NextResponse.json({
      success: true,
      ticket,
      delivery,
      message:
        delivery === "Sent"
          ? "Reply accepted by the delivery provider."
          : "Reply saved and queued for email delivery.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof ApiError
            ? error.message
            : "Unable to process request. Check the input and try again.",
      },
      {
        status:
          error instanceof ApiError
            ? error.status
            : error instanceof ZodError
              ? 400
              : 503,
      },
    );
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await authorizeAdminApi(req);
  if (!auth.authorized) return auth.response;
  try {
    originCheck(req);
    await ensureMailboxIndexes();
    const raw = await body(req);
    if (["status", "priority", "note", "assign"].includes(raw.action)) {
      const input = conversationActionSchema.parse(raw);
      if (input.action === "assign" && input.assignedTo === "self")
        input.assignedTo = auth.user.id;
      await transaction((repo) => updateConversation(repo, input, auth.user));
    } else {
      const input = mailboxSchema.parse(raw);
      await transaction((repo) => updateMailbox(repo, input));
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof ApiError
            ? error.message
            : "Unable to update the mailbox.",
      },
      {
        status:
          error instanceof ApiError
            ? error.status
            : error instanceof ZodError
              ? 400
              : 503,
      },
    );
  }
}
