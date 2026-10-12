import { NextResponse } from "next/server";
import { getAdminCategories } from "@/server/admin-service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const all = await getAdminCategories();
    const active = all.filter((c) => c.status === "Active" || !c.status);

    const bags = active.filter(
      (c) =>
        c.parent?.toLowerCase() === "bags" ||
        c.name.toLowerCase().includes("bag") ||
        c.slug.toLowerCase().includes("bag") ||
        c.slug.toLowerCase().includes("backpack") ||
        c.slug.toLowerCase().includes("tote") ||
        c.slug.toLowerCase().includes("duffle")
    );

    const luggage = active.filter(
      (c) =>
        c.parent?.toLowerCase() === "luggage" ||
        c.name.toLowerCase().includes("luggage") ||
        c.slug.toLowerCase().includes("luggage") ||
        c.slug.toLowerCase().includes("cabin") ||
        c.slug.toLowerCase().includes("check") ||
        c.slug.toLowerCase().includes("trunk")
    );

    const accessories = active.filter(
      (c) =>
        c.parent?.toLowerCase() === "accessories" ||
        c.name.toLowerCase().includes("access") ||
        c.slug.toLowerCase().includes("case") ||
        c.slug.toLowerCase().includes("tag") ||
        c.slug.toLowerCase().includes("strap")
    );

    return NextResponse.json(
      {
        success: true,
        categories: active,
        grouped: {
          bags,
          luggage,
          accessories,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
