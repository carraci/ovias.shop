import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { transaction } from "@/server/db";
import { ApiError, body } from "@/server/http";
import {
  inboundSchema,
  receiveEmail,
  verifyInboxAuthorization,
} from "@/server/support-inbox";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    verifyInboxAuthorization(req.headers.get("authorization"));
    const raw = (await body(req)) as any;

    // Normalize webhook formats (Resend, SendGrid, Mailgun, or direct JSON)
    let payload: any = raw;
    if (raw?.data && (raw?.type?.startsWith("email.") || raw?.data?.email_id)) {
      const d = raw.data;
      payload = {
        messageId: d.email_id || d.id || randomUUID(),
        from: Array.isArray(d.from) ? d.from[0] : d.from || d.sender,
        to: Array.isArray(d.to) ? d.to[0] : d.to || d.recipient || process.env.SUPPORT_INBOX_EMAIL || "support@ovias.shop",
        subject: d.subject || "Customer Inquiry",
        text: d.text || d.html || d.body || "(Empty message content)",
        cc: Array.isArray(d.cc) ? d.cc : [],
        attachments: Array.isArray(d.attachments) ? d.attachments : [],
      };
    } else if (raw && !raw.messageId) {
      payload = {
        ...raw,
        messageId: raw.id || randomUUID(),
        to: raw.to || process.env.SUPPORT_INBOX_EMAIL || "support@ovias.shop",
        subject: raw.subject || "Customer Inquiry",
      };
    }

    const input = inboundSchema.parse(payload);
    const ticket = await transaction((repo) => receiveEmail(repo, input));
    return NextResponse.json({ success: true, id: ticket.id });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof ApiError
            ? error.message
            : error instanceof Error
              ? error.message
              : "Invalid inbound email.",
      },
      { status: error instanceof ApiError ? error.status : 400 },
    );
  }
}
