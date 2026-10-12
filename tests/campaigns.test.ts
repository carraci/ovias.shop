import { test } from "node:test";
import assert from "node:assert/strict";
import {
  campaignStatus,
  validateCampaign,
  validCampaignDestination,
} from "../src/lib/campaigns";
const campaign = {
  name: "A campaign",
  description: "",
  type: "Seasonal Campaign",
  banner: "/media/uploads/banner.webp",
  mobileBanner: "",
  headline: "Travel",
  subheading: "",
  cta: "Shop",
  destinationType: "Product",
  destination: "/products/cabin",
  placements: ["homeHero"],
  startAt: "2030-01-01T00:00:00Z",
  endAt: "2030-01-02T00:00:00Z",
  status: "Scheduled",
} as const;
test("campaign automatically starts and ends at the exact scheduled boundaries", () => {
  assert.equal(
    campaignStatus({ ...campaign }, Date.parse(campaign.startAt) - 1),
    "Scheduled",
  );
  assert.equal(
    campaignStatus({ ...campaign }, Date.parse(campaign.startAt)),
    "Active",
  );
  assert.equal(
    campaignStatus({ ...campaign }, Date.parse(campaign.endAt)),
    "Completed",
  );
  for (const status of ["Draft", "Paused", "Archived"] as const)
    assert.equal(
      campaignStatus({ ...campaign, status }, Date.parse(campaign.endAt) + 1),
      status,
    );
});
test("drafts can be incomplete but published campaigns need usable creative and destinations", () => {
  assert.doesNotThrow(() =>
    validateCampaign({
      ...campaign,
      status: "Draft",
      banner: "",
      destination: "",
      placements: [],
    }),
  );
  for (const field of ["banner", "headline", "destination"] as const)
    assert.throws(() => validateCampaign({ ...campaign, [field]: "" }));
  assert.throws(() => validateCampaign({ ...campaign, placements: [] }));
  assert.throws(() =>
    validateCampaign({ ...campaign, endAt: campaign.startAt }),
  );
  assert.throws(() => validateCampaign({ ...campaign, startAt: "invalid" }));
  assert.throws(() =>
    validateCampaign({ ...campaign, banner: "/media/../../secret.png" }),
  );
  assert.throws(() =>
    validateCampaign({
      ...campaign,
      startAt: "2020-01-01T00:00:00Z",
      endAt: "2020-01-02T00:00:00Z",
    }),
  );
});
test("destinations allow storefront paths and secure URLs, excluding unsafe redirect forms", () => {
  for (const path of [
    "/luggage?collection=Signature",
    "https://example.com/collection",
  ])
    assert.equal(validCampaignDestination(path), true);
  for (const path of [
    "//example.com",
    "/\\example.com",
    "javascript:alert(1)",
    "http://example.com",
    "https://user:password@example.com",
    "",
  ])
    assert.equal(validCampaignDestination(path), false);
});
