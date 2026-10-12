import { createHmac, timingSafeEqual } from "node:crypto";
import { ApiError } from "./http";

export function verifyCourierWebhook(
  raw: string,
  headers: Headers,
  secret = process.env.DELHIVERY_WEBHOOK_SECRET,
) {
  if (!secret?.trim())
    throw new ApiError(
      503,
      "Courier webhook authentication is not configured.",
    );
  const signature = headers.get("x-delhivery-signature") || "";
  const authorization = headers.get("authorization") || "";
  const safeEqual = (a: string, b: string) => {
    const left = Buffer.from(a),
      right = Buffer.from(b);
    return left.length === right.length && timingSafeEqual(left, right);
  };
  if (
    signature &&
    /^[a-f0-9]{64}$/i.test(signature) &&
    safeEqual(
      signature.toLowerCase(),
      createHmac("sha256", secret.trim()).update(raw).digest("hex"),
    )
  )
    return;
  if (
    /^(Token|Bearer) /.test(authorization) &&
    safeEqual(
      authorization.replace(/^(Token|Bearer) /, "").trim(),
      secret.trim(),
    )
  )
    return;
  throw new ApiError(401, "Invalid courier webhook credentials.");
}
