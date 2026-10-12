import { NextRequest } from "next/server";
import { z } from "zod";
import { api, body, originCheck, limit, ApiError } from "@/server/http";
import { currentUser, cartOwner } from "@/server/auth";
import { addressSchema } from "@/server/commerce";
import { checkoutQuote, quoteInput } from "@/server/checkout-pricing";
import {
  activeCheckout,
  beginPayPalCheckout,
  verifyCheckout,
  captureCheckout,
  cancelCheckout,
} from "@/server/paypal-checkout";
import { POST as legacyCheckout } from "../../[[...path]]/route";
export const runtime = "nodejs";
type Context = { params: Promise<{ action?: string[] }> };
async function viewer() {
  const user = await currentUser();
  return { user, owner: user?.id || (await cartOwner()) };
}
export function GET(req: NextRequest, context: Context) {
  return api(async () => {
    const action = (await context.params).action || [];
    const { owner } = await viewer();
    if (action.join("/") === "session") return activeCheckout(owner);
    if (action.length === 2 && action[0] === "session") {
      z.uuid().parse(action[1]);
      await limit(req, "payment-status", 40);
      return verifyCheckout(owner, action[1]);
    }
    throw new ApiError(404, "Checkout endpoint not found.");
  });
}
export async function POST(req: NextRequest, context: Context) {
  const action = (await context.params).action || [];
  if (!action.length)
    return legacyCheckout(req, {
      params: Promise.resolve({ path: ["checkout"] }),
    });
  return api(async () => {
    originCheck(req);
    const { user, owner } = await viewer();
    if (action.join("/") === "quote") {
      await limit(req, "checkout-quote", 90);
      const parsed = quoteInput.strict().parse(await body(req));
      const effectiveEmail = user?.email || parsed.customerEmail;
      return checkoutQuote(owner, parsed, effectiveEmail, user?.id);
    }
    if (action.join("/") === "paypal") {
      await limit(req, "paypal-create", 12);
      const input = quoteInput
        .extend({
          address: addressSchema.extend({
            phone: z
              .string()
              .trim()
              .regex(
                /^(?:\+91[ -]?)?[6-9][0-9]{9}$/,
                "Enter a valid Indian mobile number.",
              ),
          }),
          quoteId: z.string().regex(/^[a-f0-9]{64}$/),
          idempotencyKey: z.uuid(),
        })
        .strict()
        .parse(await body(req));
      return beginPayPalCheckout(owner, user?.id, input);
    }
    if (action.length === 2 && ["capture", "cancel"].includes(action[0])) {
      z.uuid().parse(action[1]);
      await limit(req, "paypal-action", 20);
      return action[0] === "capture"
        ? captureCheckout(owner, action[1])
        : cancelCheckout(owner, action[1]);
    }
    throw new ApiError(404, "Checkout endpoint not found.");
  });
}
