import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminApi, recordAuditEvent } from "@/server/admin-auth";
import { getAdminOrders, transitionOrderStatus, OrderStatus } from "@/server/admin-service";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await authorizeAdminApi(req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || undefined;
    const status = searchParams.get("status") || undefined;
    const payment = searchParams.get("payment") || undefined;
    const shipping = searchParams.get("shipping") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "8", 10);

    const result = await getAdminOrders({
      from:searchParams.get("from") || undefined,
      to:searchParams.get("to") || undefined,
      query,
      status,
      payment,
      shipping,
      page,
      limit,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch orders." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await authorizeAdminApi(req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const body = await req.json();
    const { orderId, nextStatus, reason, note } = body;

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required." }, { status: 400 });
    }

    if (nextStatus) {
      const updated = await transitionOrderStatus({
        orderId,
        nextStatus: nextStatus as OrderStatus,
        actor: auth.user.email,
        reason,
      });
      return NextResponse.json({ success: true, order: updated });
    }

    if (note) {
      await recordAuditEvent({
        actor: auth.user.email,
        action: "ORDER_NOTE_ADDED",
        resource: "orders",
        resourceId: orderId,
        details: { note },
      });
      return NextResponse.json({ success: true, message: "Note recorded." });
    }

    return NextResponse.json({ error: "No action specified." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Order modification failed." },
      { status: 400 }
    );
  }
}
