import { NextRequest } from "next/server";
import { api, ApiError } from "@/server/http";
import { deliverMail } from "@/server/mail";
export function GET(req: NextRequest) {
  return api(async () => {
    if (
      !process.env.CRON_SECRET ||
      req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
    )
      throw new ApiError(401, "Unauthorized.");
    return deliverMail();
  });
}
