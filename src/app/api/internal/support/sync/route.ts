import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { authSigningKey } from "@/server/auth";
import { syncGmailInbox } from "@/server/support-gmail";
export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  try {
    await jwtVerify(
      (req.headers.get("authorization") || "").replace(/^Bearer /, ""),
      authSigningKey(),
      {
        issuer: "ovia-support-worker",
        audience: "ovia-support-worker",
        algorithms: ["HS256"],
      },
    );
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    return NextResponse.json(await syncGmailInbox(true));
  } catch {
    return NextResponse.json(
      { error: "Gmail synchronization failed." },
      { status: 503 },
    );
  }
}
