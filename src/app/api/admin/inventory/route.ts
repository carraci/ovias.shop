import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminApi } from "@/server/admin-auth";
import { getAdminInventory, adjustInventoryStock } from "@/server/admin-service";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await authorizeAdminApi(req);
  if (!auth.authorized) {
    return auth.response;
  }

  const inventory = await getAdminInventory();
  return NextResponse.json({ success: true, inventory });
}

export async function PATCH(req: NextRequest) {
  const auth = await authorizeAdminApi(req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const body = await req.json();
    const { sku, adjustment, reason, notes } = body;

    if (!sku || typeof adjustment !== "number" || !reason) {
      return NextResponse.json(
        { error: "SKU, numerical adjustment, and reason are required." },
        { status: 400 }
      );
    }

    const result = await adjustInventoryStock({
      sku,
      adjustment,
      reason,
      notes,
      actor: auth.user.email,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to adjust inventory." },
      { status: 400 }
    );
  }
}
