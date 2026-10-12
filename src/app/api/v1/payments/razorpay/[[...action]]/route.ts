import { NextRequest } from "next/server";
import { z } from "zod";
import { currentUser, cartOwner } from "@/server/auth";
import { api, ApiError, body, originCheck, limit } from "@/server/http";
import {
  razorpayConfiguration,
  activeRazorpayCheckout,
  beginRazorpayCheckout,
  verifyRazorpayCheckout,
  verifyRazorpayPayment,
  razorpayCheckoutInput,
  razorpayVerificationInput,
} from "@/server/razorpay-checkout";
export const runtime = "nodejs";
export const maxDuration = 60;
type Context = { params: Promise<{ action?: string[] }> };
async function viewer() {
  const user = await currentUser();
  return { user, owner: user?.id || (await cartOwner()) };
}
export function GET(req: NextRequest, context: Context) {
  return api(async () => {
    const action = (await context.params).action || [];
    if (action.join("/") === "config") return razorpayConfiguration();
    await limit(req, "razorpay-status", 40);
    const { owner } = await viewer();
    if (action.join("/") === "sessions") return activeRazorpayCheckout(owner);
    if (action.length === 2 && action[0] === "sessions") {
      z.uuid().parse(action[1]);
      return verifyRazorpayCheckout(owner, action[1]);
    }
    throw new ApiError(404, "Payment endpoint not found.");
  });
}
export function POST(req: NextRequest, context: Context) {
  return api(async () => {
    originCheck(req);
    const action = (await context.params).action || [];
    const { user, owner } = await viewer();
    if (action.join("/") === "sessions") {
      await limit(req, "razorpay-create", 12);
      return beginRazorpayCheckout(
        owner,
        user?.id,
        razorpayCheckoutInput.parse(await body(req)),
      );
    }
    if (action.join("/") === "verify") {
      await limit(req, "razorpay-verify", 20);
      return verifyRazorpayPayment(
        owner,
        razorpayVerificationInput.parse(await body(req)),
      );
    }
    throw new ApiError(404, "Payment endpoint not found.");
  });
}
