import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminApi, recordAuditEvent } from "@/server/admin-auth";
import {
  getNotificationStudioData,
  sendTestNotification,
} from "@/server/notification-service";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await authorizeAdminApi(req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const data = await getNotificationStudioData();
    return NextResponse.json({ success: true, ...data });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to load notification studio data." },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await authorizeAdminApi(req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const body = await req.json();
    const { templateName, recipient } = body;

    if (!templateName || !recipient || !recipient.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid template name and recipient email." },
        { status: 400 },
      );
    }

    const result = await sendTestNotification(templateName, recipient);

    await recordAuditEvent({
      actor: auth.user.email,
      action: "TEST_NOTIFICATION_SENT",
      resource: "notifications",
      resourceId: templateName,
      details: { recipient, success: result.success, logId: result.logId },
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Resend failed to deliver the test notification.",
          logId: result.logId,
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      message: `Test email for '${templateName}' dispatched successfully to ${recipient} via Resend.`,
      logId: result.logId,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to send test notification." },
      { status: 500 },
    );
  }
}
