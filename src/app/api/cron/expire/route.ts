import { NextRequest } from "next/server";
import { api, ApiError } from "@/server/http";
import { expireOrders } from "@/server/commerce";
export function GET(req: NextRequest) {
  return api(async () => {
    if (
      !process.env.CRON_SECRET ||
      req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
    )
      throw new ApiError(401, "Unauthorized.");
    return expireOrders();
  });
}
