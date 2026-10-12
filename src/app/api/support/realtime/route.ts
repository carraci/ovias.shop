import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import { currentUser, currentSessionId, authSigningKey } from "@/server/auth";
export const runtime = "nodejs";
export async function GET() {
  const user = await currentUser();
  if (!user)
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const sessionId = await currentSessionId();
  if (!sessionId)
    return NextResponse.json({ error: "Invalid session." }, { status: 401 });
  const url =
    process.env.SUPPORT_REALTIME_URL ||
    (process.env.NODE_ENV !== "production"
      ? "http://localhost:3001"
      : undefined);
  if (!url) return NextResponse.json({ enabled: false });
  const token = await new SignJWT({
    sessionId,
    role: ["ADMIN", "OWNER"].includes(user.role.toUpperCase())
      ? "owner"
      : "customer",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuer("ovia-support")
    .setAudience("ovia-support-socket")
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(authSigningKey());
  return NextResponse.json(
    { enabled: true, url, token },
    { headers: { "Cache-Control": "no-store" } },
  );
}
