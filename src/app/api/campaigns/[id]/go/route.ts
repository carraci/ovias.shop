import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { campaignCollection, recordCampaignEvent } from "@/server/campaigns";
import { campaignStatus, validCampaignDestination } from "@/lib/campaigns";
import { hash, limit } from "@/server/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const campaign = await (await campaignCollection()).findOne({ id });
  if (
    !campaign ||
    campaignStatus(campaign) !== "Active" ||
    !validCampaignDestination(campaign.destination)
  )
    return NextResponse.redirect(new URL("/", req.url));
  await limit(req, "campaign-clicks", 120);
  const visitor =
    req.cookies.get("ovia-campaign-visitor")?.value || randomUUID();
  const eventId = hash(
    `${id}:${visitor}:click:${new Date().toISOString().slice(0, 10)}`,
  );
  await recordCampaignEvent(eventId, id, "click");
  const response = NextResponse.redirect(
    new URL(campaign.destination, req.url),
  );
  const options = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: req.nextUrl.protocol === "https:",
    path: "/",
    maxAge: 7 * 86400,
  };
  response.cookies.set("ovia-campaign", id, options);
  response.cookies.set("ovia-campaign-visitor", visitor, options);
  return response;
}
