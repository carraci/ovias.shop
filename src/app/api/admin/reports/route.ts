import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminApi } from "@/server/admin-auth";
import { getAdminReports } from "@/server/admin-service";

export async function GET(request: NextRequest) {
  const auth = await authorizeAdminApi(request);
  if (!auth.authorized) {
    return auth.response;
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "sales";
  const range = searchParams.get("range") || "last_30_days";

  const data = await getAdminReports(type, range);
  return NextResponse.json(data);
}
