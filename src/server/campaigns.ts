import { mongo } from "./db";
import { randomUUID } from "node:crypto";
import {
  campaignStatus,
  validateCampaign,
  type Campaign,
} from "@/lib/campaigns";
import { revalidatePath } from "next/cache";
import { recordAuditEvent } from "./admin-auth";
export async function campaignCollection() {
  return (await mongo())
    .db(process.env.MONGODB_DB || "ovia")
    .collection<Campaign>("campaigns");
}
export async function recordCampaignEvent(
  id: string,
  campaignId: string,
  type: "impression" | "click",
) {
  const collection = (await mongo())
    .db(process.env.MONGODB_DB || "ovia")
    .collection("campaignEvents");
  await collection.createIndex({ id: 1 }, { unique: true });
  try {
    await collection.updateOne(
      { id },
      {
        $setOnInsert: {
          id,
          campaignId,
          type,
          createdAt: new Date().toISOString(),
        },
      },
      { upsert: true },
    );
  } catch (error) {
    if ((error as { code?: number }).code !== 11000) throw error;
  }
}
export async function readCampaigns() {
  const client = await mongo(),
    db = client.db(process.env.MONGODB_DB || "ovia");
  const [campaigns, events, orders] = await Promise.all([
    db
      .collection<Campaign>("campaigns")
      .find({}, { projection: { _id: 0 } })
      .sort({ createdAt: -1 })
      .toArray(),
    db
      .collection("campaignEvents")
      .aggregate([
        {
          $group: {
            _id: { campaignId: "$campaignId", type: "$type" },
            count: { $sum: 1 },
          },
        },
      ])
      .toArray(),
    db
      .collection("orders")
      .find(
        {
          status: "paid",
          provider: { $ne: "demo" },
          campaignId: { $exists: true },
        },
        { projection: { campaignId: 1, total: 1 } },
      )
      .toArray(),
  ]);
  return campaigns.map((campaign) => {
    const impressions =
      events.find(
        (event) =>
          event._id.campaignId === campaign.id &&
          event._id.type === "impression",
      )?.count || 0;
    const clicks =
      events.find(
        (event) =>
          event._id.campaignId === campaign.id && event._id.type === "click",
      )?.count || 0;
    const sales = orders.filter((order) => order.campaignId === campaign.id);
    return {
      ...campaign,
      status: campaignStatus(campaign),
      savedStatus: campaign.status,
      impressions,
      clicks,
      conversions: sales.length,
      revenue: sales.reduce((sum, order) => sum + (order.total || 0), 0) / 100,
      ctr: impressions ? (clicks / impressions) * 100 : 0,
      conversionRate: clicks ? (sales.length / clicks) * 100 : 0,
    };
  });
}
export async function activeCampaigns(placement: string) {
  return (
    await (
      await campaignCollection()
    )
      .find({ placements: placement as any }, { projection: { _id: 0 } })
      .sort({ createdAt: -1 })
      .toArray()
  ).filter((campaign) => campaignStatus(campaign) === "Active");
}
export async function saveCampaign(
  input: unknown,
  id: string | undefined,
  actor: string,
) {
  const data = validateCampaign(input),
    collection = await campaignCollection();
  const existing = id ? await collection.findOne({ id }) : null;
  if(["Active","Scheduled"].includes(data.status)&&data.destinationType==="Product"){
   const {storefrontCatalog}=await import("./storefront-catalog");
   const available=(await storefrontCatalog()).some(product=>`/products/${product.slug}`===data.destination);
   if(!available)throw new Error("This product is not available on the public website. Publish the product first or select another destination.");
  }
  if (id && !existing) throw new Error("Campaign not found.");
  const now = new Date().toISOString();
  const campaign: Campaign = {
    ...data,
    id: id || randomUUID(),
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };
  await collection.updateOne(
    { id: campaign.id },
    { $set: campaign },
    { upsert: !id },
  );
  await recordAuditEvent({
    actor,
    action: id ? "CAMPAIGN_UPDATED" : "CAMPAIGN_CREATED",
    resource: "marketing",
    resourceId: campaign.id,
    details: { name: campaign.name, status: campaign.status },
  });
  revalidatePath("/", "layout");
  return campaign;
}
