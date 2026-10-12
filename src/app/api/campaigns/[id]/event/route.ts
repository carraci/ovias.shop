import { NextRequest, NextResponse } from "next/server";
import { campaignCollection, recordCampaignEvent } from "@/server/campaigns";
import { campaignStatus } from "@/lib/campaigns";
import { hash, originCheck, limit } from "@/server/http";
export const runtime = "nodejs";
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    originCheck(req);
    await limit(req, "campaign-impressions", 120);
    const { id } = await ctx.params;
    const body = await req.json();
    if (
      typeof body.visitId !== "string" ||
      !/^[a-zA-Z0-9-]{16,80}$/.test(body.visitId)
    )
      return NextResponse.json({ error: "Invalid visit." }, { status: 400 });
    const campaign = await (await campaignCollection()).findOne({ id });
    if (!campaign || campaignStatus(campaign) !== "Active")
      return NextResponse.json({ success: false });
    const visitor =
      req.cookies.get("ovia-campaign-visitor")?.value || body.visitId;
    const eventId = hash(
      `${id}:${visitor}:impression:${new Date().toISOString().slice(0, 10)}`,
    );
    await recordCampaignEvent(eventId, id, "impression");
    const response = NextResponse.json({ success: true });
    response.cookies.set("ovia-campaign-visitor", visitor, {
      httpOnly: true,
      sameSite: "lax",
      secure: req.nextUrl.protocol === "https:",
      path: "/",
      maxAge: 7 * 86400,
    });
    return response;
  } catch {
    return NextResponse.json(
      { error: "Could not record campaign view." },
      { status: 400 },
    );
  }
}
