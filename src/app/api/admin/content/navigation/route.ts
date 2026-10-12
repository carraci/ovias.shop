import { NextResponse } from "next/server";
import { mongo } from "@/server/db";
import { recordAuditEvent } from "@/server/admin-auth";

const COLLECTION_NAME = "site_content";
const DOC_ID = "navigation_menu";

export async function GET() {
  try {
    const client = await mongo();
    const db = client.db(process.env.MONGODB_DB || "ovia");
    const doc = await db.collection(COLLECTION_NAME).findOne({ _id: DOC_ID as any });

    if (!doc) {
      return NextResponse.json({ success: true, data: null });
    }

    return NextResponse.json({
      success: true,
      data: {
        menuItems: doc.menuItems,
        menuSettings: doc.menuSettings,
        updatedAt: doc.updatedAt,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch navigation settings" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { menuItems, menuSettings } = body;

    const client = await mongo();
    const db = client.db(process.env.MONGODB_DB || "ovia");

    const payload = {
      _id: DOC_ID,
      menuItems,
      menuSettings,
      updatedAt: new Date().toISOString(),
    };

    await db.collection(COLLECTION_NAME).updateOne(
      { _id: DOC_ID as any },
      { $set: payload },
      { upsert: true }
    );

    try {
      await recordAuditEvent({
        actor: "admin",
        action: "NAVIGATION_MENU_UPDATED",
        resource: "site_content",
        resourceId: DOC_ID,
        result: "SUCCESS",
        details: { itemsCount: menuItems?.length },
      });
    } catch {
      // audit logging non-blocking
    }

    return NextResponse.json({
      success: true,
      message: "Navigation saved successfully",
      updatedAt: payload.updatedAt,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save navigation" },
      { status: 500 }
    );
  }
}
