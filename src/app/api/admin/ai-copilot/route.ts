import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminApi } from "@/server/admin-auth";
import {
  askCopilot,
  copilotConfigured,
  copilotInput,
} from "@/server/ai-copilot";
import { ApiError, body, originCheck, limit } from "@/server/http";
import { ZodError } from "zod";
import { DeadlineError } from "@/lib/ai-request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  const auth = await authorizeAdminApi(req);
  if (!auth.authorized) return auth.response;
  return NextResponse.json(
    { name: auth.user.name, configured: copilotConfigured() },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(req: NextRequest) {
  const auth = await authorizeAdminApi(req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    originCheck(req);
    await limit(req, "admin-ai-copilot", 12);
    const input = copilotInput.parse(await body(req));
    return NextResponse.json(
      { success: true, answer: await askCopilot(input) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        error:
          err instanceof ZodError
            ? "Enter a question up to 4,000 characters."
            : err instanceof ApiError || err instanceof DeadlineError
              ? err.message
              : "AI assistant is temporarily unavailable. Please retry.",
      },
      {
        status:
          err instanceof ZodError
            ? 400
            : err instanceof ApiError
              ? err.status
              : err instanceof DeadlineError
                ? 504
                : 503,
      },
    );
  }
}
