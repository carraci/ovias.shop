import { NextRequest } from "next/server";
import { verifyCourierWebhook } from "@/server/courier-webhook-auth";
import { api, ApiError } from "@/server/http";
import { processShippingWebhook } from "@/lib/shipping/service";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  return api(async () => {
    const raw = await req.text();
    if (raw.length > 1_000_000) throw new ApiError(413, "Payload too large.");

    verifyCourierWebhook(raw, req.headers);

    let bodyData;
    try {
      bodyData = JSON.parse(raw);
    } catch {
      throw new ApiError(400, "Invalid JSON body.");
    }

    const res = await processShippingWebhook(bodyData);
    return { received: true, ...res };
  });
}
