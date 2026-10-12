import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { customerOrder } from "@/server/customer-order";
import { ApiError } from "@/server/http";
import { renderOrderDocument } from "@/lib/order-document";
import { verifiedShipment } from "@/server/logistics";
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const { order } = await customerOrder(id);
    if (req.nextUrl.searchParams.get("type") === "invoice")
      throw new ApiError(
        409,
        "Invoice unavailable: verified seller details, invoice number and tax breakdown are not recorded. Download the order summary instead.",
      );
    const nonce = randomUUID();
    return new NextResponse(
      renderOrderDocument(
        {
          ...order,
          shipping: verifiedShipment(order) ? order.shipping : undefined,
        },
        false,
        nonce,
      )
        .replace('<a href="?type=packing">Packing Slip</a>', "")
        .replace('<a href="?type=invoice">GST Tax Invoice</a>', "")
        .replace('<a href="../shipping-label">Shipping Label</a>', ""),
      {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "private, no-store",
          "Content-Security-Policy": `default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}'; base-uri 'none'; frame-ancestors 'none'`,
          "X-Content-Type-Options": "nosniff",
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Document unavailable",
      },
      { status: error instanceof ApiError ? error.status : 503 },
    );
  }
}
