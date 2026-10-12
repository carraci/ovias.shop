import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminApi } from "@/server/admin-auth";
import { getAdminReturns, updateReturnStatus } from "@/server/admin-service";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await authorizeAdminApi(req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const returns = await getAdminReturns();
    return NextResponse.json({ success: true, returns }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ success: false, error: "Return data could not be loaded from the store database. Please retry." }, { status: 503 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await authorizeAdminApi(req);
  if (!auth.authorized) {
    return auth.response;
  }

  const body = await req.json();
  const { returnId, status, reason } = body;

  try {
  const { originCheck } = await import("@/server/http");
  originCheck(req);
  const result = await updateReturnStatus({
    returnId,
    status,
    reason,
    actor: auth.user.email,
  });

  return NextResponse.json(result);
  } catch (error) {
    const { ApiError } = await import("@/server/http");
    return NextResponse.json({success:false,error:error instanceof Error ? error.message : "Return update failed."},{status:error instanceof ApiError ? error.status : 503});
  }
}
