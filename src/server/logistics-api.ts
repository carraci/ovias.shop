import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminApi } from "./admin-auth";
import { executeLogistics } from "./logistics";
import { ApiError, body, originCheck, limit } from "./http";
import { ZodError } from "zod";
export async function mutateShipping(
  req: NextRequest,
  override?: { orderId: string; action?: string },
) {
  const auth = await authorizeAdminApi(req);
  if (!auth.authorized) return auth.response;
  try {
    originCheck(req);
    await limit(req, "admin-logistics", 15);
    const input = await body(req);
    const order = await executeLogistics(
      { ...input, ...override },
      auth.user.email,
    );
    const operation =
      order.logisticsOperations?.[
        (override?.action || input.action) as "approve" | "cancel"
      ];
    return NextResponse.json(
      { success: true, order, operation, shipping: order.shipping },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof ApiError
            ? error.message
            : error instanceof ZodError
              ? "Confirm the action and enter valid shipment details."
              : "Logistics service is unavailable. Check the saved operation before retrying.",
      },
      {
        status:
          error instanceof ApiError
            ? error.status
            : error instanceof ZodError
              ? 400
              : 503,
      },
    );
  }
}
