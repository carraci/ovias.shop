import { NextRequest } from "next/server";
import { mutateShipping } from "@/server/logistics-api";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  return mutateShipping(req, { orderId: id });
}
export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  return mutateShipping(req, { orderId: id, action: "cancel" });
}
