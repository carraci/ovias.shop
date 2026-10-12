import { ensureMailboxIndexes } from "@/server/support-mailbox";
import { NextRequest } from "next/server";
import { z } from "zod";
import { currentUser } from "@/server/auth";
import { transaction } from "@/server/db";
import { api, body, originCheck, ApiError, limit } from "@/server/http";
import {
  ownConversations,
  appendConversationMessage,
} from "@/server/support-conversations";
import { validateAttachmentLinks } from "@/server/support-attachments";
import {
  queueContactNotification,
  attemptContactNotification,
} from "@/server/contact-notifications";
export const runtime = "nodejs";
export async function GET() {
  return api(async () => {
    const user = await currentUser();
    if (!user) throw new ApiError(401, "Please sign in.");
    return transaction((repo) => ownConversations(repo, user));
  });
}
export async function POST(req: NextRequest) {
  return api(async () => {
    originCheck(req);
    const user = await currentUser();
    if (!user) throw new ApiError(401, "Please sign in.");
    await ensureMailboxIndexes();
    await limit(req, "support-customer-reply-" + user.id, 20);
    const input = z
      .object({
        ticketId: z.string().min(1).max(250),
        text: z.string().trim().min(1).max(4000),
        requestId: z.uuid(),
        attachments: z.array(z.uuid()).max(5).optional(),
      })
      .strict()
      .parse(await body(req));
    await transaction(async (repo) => {
      const ticket = (await ownConversations(repo, user)).find(
        (t) => t.id === input.ticketId,
      );
      if (!ticket) throw new ApiError(404, "Request not found.");
      if (ticket.status === "Closed")
        throw new ApiError(409, "This request is closed.");
      await validateAttachmentLinks(
        repo,
        input.attachments || [],
        ticket.id,
        user.id,
      );
      await appendConversationMessage(repo, {
        id: input.requestId,
        ticketId: ticket.id,
        sender: "customer",
        text: input.text,
        time: new Date().toISOString(),
        attachments: input.attachments || [],
      });
      await queueContactNotification(repo, {
        id: input.requestId,
        ticketId: ticket.id,
        name: user.name,
        email: user.email,
        subject: ticket.subject,
        message: input.text,
      });
    });
    await attemptContactNotification("contact-notification-" + input.requestId);
    return transaction((repo) => ownConversations(repo, user));
  });
}
