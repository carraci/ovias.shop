import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminApi } from "@/server/admin-auth";
import { readCampaigns, saveCampaign } from "@/server/campaigns";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  const auth = await authorizeAdminApi(req);
  if (!auth.authorized) return auth.response;
  return NextResponse.json(
    { success: true, campaigns: await readCampaigns() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
export async function POST(req: NextRequest) {
  const auth = await authorizeAdminApi(req);
  if (!auth.authorized) return auth.response;
  try {
    return NextResponse.json({
      success: true,
      campaign: await saveCampaign(
        await req.json(),
        undefined,
        auth.user!.email,
      ),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not save campaign.",
      },
      { status: 400 },
    );
  }
}
export async function PATCH(req: NextRequest) {
  const auth = await authorizeAdminApi(req);
  if (!auth.authorized) return auth.response;
  try {
    const body = await req.json();
    if (typeof body.id !== "string") throw new Error("Campaign ID required.");
    return NextResponse.json({
      success: true,
      campaign: await saveCampaign(body, body.id, auth.user!.email),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not save campaign.",
      },
      { status: 400 },
    );
  }
}
