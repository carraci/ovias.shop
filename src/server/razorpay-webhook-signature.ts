import { createHmac, timingSafeEqual } from "node:crypto";
import { ApiError } from "./http";
export function verifyRazorpayWebhookSignature(
  raw: string,
  signature: string,
  secret: string,
) {
  if (!/^[a-fA-F0-9]{64}$/.test(signature))
    throw new ApiError(400, "Invalid signature.");
  const expected = createHmac("sha256", secret).update(raw).digest();
  const actual = Buffer.from(signature, "hex");
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual))
    throw new ApiError(400, "Invalid signature.");
}
