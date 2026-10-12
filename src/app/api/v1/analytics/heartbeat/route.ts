import { NextRequest, NextResponse } from "next/server";
import { recordActiveVisitor } from "@/server/realtime-active-users";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const path = typeof body?.path === "string" ? body.path : "/";
    const visitorId = typeof body?.visitorId === "string" ? body.visitorId : undefined;

    recordActiveVisitor(path, visitorId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
