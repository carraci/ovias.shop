import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminApi } from "@/server/admin-auth";
import { getAdminAbandonedCarts } from "@/server/admin-service";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await authorizeAdminApi(req);
  if (!auth.authorized) {
    return auth.response;
  }

  const abandonedCarts = await getAdminAbandonedCarts();
  return NextResponse.json({ success: true, abandonedCarts });
}
