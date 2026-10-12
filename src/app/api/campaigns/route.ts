import { NextRequest, NextResponse } from "next/server";
import { activeCampaigns } from "@/server/campaigns";
import { campaignPlacements } from "@/lib/campaigns";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  const placement = req.nextUrl.searchParams.get("placement") || "";
  if (!campaignPlacements.some((value) => value === placement))
    return NextResponse.json({ error: "Invalid placement." }, { status: 400 });
  const campaigns = await activeCampaigns(placement);
  return NextResponse.json(
    {
      campaigns: campaigns.map(
        ({ id, banner, mobileBanner, headline, subheading, cta }) => ({
          id,
          banner,
          mobileBanner,
          headline,
          subheading,
          cta,
        }),
      ),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
