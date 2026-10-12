import { NextRequest } from "next/server";
import { api, originCheck, limit } from "@/server/http";
import { customerOrder } from "@/server/customer-order";
import { verifyRazorpayCheckout } from "@/server/razorpay-checkout";
import { verifyAdminPayment } from "@/server/razorpay-refunds";
import { verifiedShipment } from "@/server/logistics";
import { syncOrderTracking } from "@/lib/shipping/service";
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  return api(async () => {
    originCheck(req);
    await limit(req, "customer-order-refresh", 20);
    const { id } = await ctx.params;
    const { order, user } = await customerOrder(id);
    const results: { source: string; confirmed: boolean; message: string }[] =
      [];
    async function check(source: string, work: () => Promise<unknown>) {
      try {
        const result = (await work()) as
          { verified?: boolean; message?: string } | undefined;
        results.push({
          source,
          confirmed: result?.verified !== false,
          message: result?.message || "Provider records refreshed.",
        });
      } catch (error) {
        results.push({
          source,
          confirmed: false,
          message:
            error instanceof Error
              ? error.message
              : "Provider update unavailable.",
        });
      }
    }
    if (order.provider === "razorpay" && order.providerId) {
      if (["pending", "payment_pending"].includes(order.status))
        await check("Payment", () => verifyRazorpayCheckout(order.owner, id));
      await check("Payment and refunds", () =>
        verifyAdminPayment({ action: "verify", orderId: id }, user.email),
      );
    }
    if (verifiedShipment(order))
      await check("Courier", () => syncOrderTracking(id));
    return { results, checkedAt: new Date().toISOString() };
  });
}
