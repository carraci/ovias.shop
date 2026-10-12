import type { Department } from "./catalog";

export const groups: Record<Department, [string, number][]> = {
  luggage: [
    ["Cabin", 62],
    ["Check-In", 32],
    ["Trunk", 29],
    ["Luggage", 59],
    ["Cabin Bags", 59],
    ["Emblematic pieces", 117],
  ],
  bags: [
    ["Weekend Bags", 0],
    ["Backpacks", 11],
    ["Duffle Bags", 4],
    ["Briefcases", 2],
    ["Crossbodies", 8],
    ["Totes", 2],
    ["Shoulder Bags", 6],
    ["Bags", 0],
    ["Travel Bags", 0],
    ["Cabin Bags", 0],
    ["Hand Carry", 8],
  ],
  accessories: [
    ["iPhone Cases", 12],
    ["Phone Cases", 3],
    ["Hats", 3],
    ["Sunglasses", 14],
    ["Belts", 4],
    ["Card Holders", 3],
    ["Address Tags", 13],
    ["Wheels", 12],
    ["Stickers", 38],
    ["Bag Straps", 5],
    ["Organisers", 2],
    ["Pet Carrier Bag", 1],
    ["Foldable Bags", 1],
    ["Garment Bags", 1],
    ["Care Products", 1],
  ],
};
export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
export const bagCategoryNames = ["Backpacks", "Tote Bags", "Crossbody Bags", "Shoulder Bags", "Duffel Bags", "Briefcases", "Weekend Bags", "Travel Bags"];
export const luggageCategoryNames = ["Cabin Luggage", "Check-in Luggage", "Large Luggage", "Medium Luggage", "Small Luggage"];
export function canonicalCategory(value: string) {
  const key = slugify(value);
  const aliases: Record<string, string> = {
    "duffel-bags": "duffle-bags", "crossbody-bags": "crossbodies", "tote-bags": "totes",
    "weekends-bags": "weekend-bags", "weekender-bags": "weekend-bags",
    "cabin-luggage": "cabin", "check-in-luggage": "check-in", checkin: "check-in", trunks: "trunk",
  };
  return aliases[key] || key;
}
const formatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });
export const money = (minor: number) => formatter.format(minor / 100);
