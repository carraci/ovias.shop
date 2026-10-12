import { z } from "zod";
export const campaignPlacements = [
  "homeHero",
  "homeCollection",
  "bags",
  "luggage",
  "editorial",
] as const;
export const campaignSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().max(2000).default(""),
  type: z.enum([
    "Seasonal Campaign",
    "Collection Launch",
    "Promotional Campaign",
    "Editorial / Story",
  ]),
  banner: z.string().max(500).default(""),
  mobileBanner: z.string().max(500).default(""),
  headline: z.string().trim().max(160).default(""),
  subheading: z.string().max(300).default(""),
  cta: z.string().max(60).default("Shop Collection"),
  destinationType: z.enum([
    "Product",
    "Collection",
    "Category",
    "Editorial",
    "Custom URL",
  ]),
  destination: z.string().trim().max(1000).default(""),
  placements: z.array(z.enum(campaignPlacements)).max(5),
  startAt: z.string().default(""),
  endAt: z.string().default(""),
  status: z.enum(["Draft", "Scheduled", "Active", "Paused", "Archived"]),
});
export type Campaign = z.infer<typeof campaignSchema> & {
  id: string;
  createdAt: string;
  updatedAt: string;
};
export function campaignStatus(
  campaign: Pick<Campaign, "status" | "startAt" | "endAt">,
  now = Date.now(),
): string {
  if (["Draft", "Paused", "Archived"].includes(campaign.status))
    return campaign.status;
  if (campaign.endAt && Date.parse(campaign.endAt) <= now) return "Completed";
  if (campaign.startAt && Date.parse(campaign.startAt) > now)
    return "Scheduled";
  return "Active";
}
export function validCampaignDestination(value: string): boolean {
  if (
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !/[\\\r\n]/.test(value)
  )
    return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}
export function validateCampaign(
  input: unknown,
): z.infer<typeof campaignSchema> {
  const data = campaignSchema.parse(input);
  for (const image of [data.banner, data.mobileBanner])
    if (image && (!image.startsWith("/media/") || /[\\]|\.\./.test(image)))
      throw new Error("Upload a product/banner image from your media library.");
  if (data.destination && !validCampaignDestination(data.destination))
    throw new Error("Use a site path or a secure HTTPS destination.");
  if (
    (data.startAt && !Number.isFinite(Date.parse(data.startAt))) ||
    (data.endAt && !Number.isFinite(Date.parse(data.endAt)))
  )
    throw new Error("Enter valid campaign dates.");
  if (
    data.startAt &&
    data.endAt &&
    Date.parse(data.endAt) <= Date.parse(data.startAt)
  )
    throw new Error("End time must be after the start time.");
  if (["Active", "Scheduled"].includes(data.status)) {
    if (
      data.status === "Active" &&
      data.endAt &&
      Date.parse(data.endAt) <= Date.now()
    )
      throw new Error(
        "Choose a future end time before publishing or resuming.",
      );
    if (
      !data.banner ||
      !data.headline ||
      !data.destination ||
      !data.placements.length
    )
      throw new Error(
        "Add a desktop banner, headline, destination and placement before publishing.",
      );
    if (data.status === "Scheduled" && (!data.startAt || !data.endAt))
      throw new Error("Choose start and end dates to schedule the campaign.");
    if (data.status === "Scheduled" && Date.parse(data.startAt) <= Date.now())
      throw new Error("Choose a future start time for a scheduled campaign.");
  }
  return data;
}
