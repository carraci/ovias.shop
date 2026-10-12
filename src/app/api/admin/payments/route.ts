import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminApi } from "@/server/admin-auth";
import {
  issueRazorpayRefund,
  readRefundPayments,
  verifyAdminPayment,
} from "@/server/razorpay-refunds";
import { ApiError, body, originCheck, limit } from "@/server/http";
import { ZodError } from "zod";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function failure(error: unknown) {
  return NextResponse.json(
    {
      success: false,
      error:
        error instanceof ApiError
          ? error.message
          : error instanceof ZodError
            ? "Confirm the refund and enter a valid amount."
            : "Payment service is unavailable. Check this payment before retrying.",
    },
    {
      status:
        error instanceof ApiError
          ? error.status
          : error instanceof ZodError
            ? 400
            : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
export async function GET(req: NextRequest) {
  const auth = await authorizeAdminApi(req);
  if (!auth.authorized) return auth.response;
  try {
    return NextResponse.json(
      {
        success: true,
        payments: await readRefundPayments(),
        webhookConfigured: !!process.env.RAZORPAY_WEBHOOK_SECRET,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return failure(error);
  }
}
export async function POST(req: NextRequest) {
  const auth = await authorizeAdminApi(req);
  if (!auth.authorized) return auth.response;
  try {
    originCheck(req);
    await limit(req, "admin-refunds", 10);
    const input = await body(req);
    if (input?.action === "verify")
      return NextResponse.json(
        {
          success: true,
          ...(await verifyAdminPayment(input, auth.user.email)),
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    const refund = await issueRazorpayRefund(input, auth.user.email);
    return NextResponse.json(
      { success: true, refund },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return failure(error);
  }
}
