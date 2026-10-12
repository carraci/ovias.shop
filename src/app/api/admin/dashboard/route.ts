import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminApi } from "@/server/admin-auth";
import { getDashboardOverview } from "@/server/admin-service";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await authorizeAdminApi(req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const from=req.nextUrl.searchParams.get('from');const to=req.nextUrl.searchParams.get('to');
    if((from || to) && (!from || !to || !/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to) || from>to)) return NextResponse.json({error:'Invalid date range'},{status:400});
    const data = await getDashboardOverview(from && to ? {from,to}:undefined);
    return NextResponse.json({
      success: true,
      owner: auth.user,
      data,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to load dashboard metrics." },
      { status: 500 }
    );
  }
}
