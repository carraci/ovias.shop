import { NextRequest, NextResponse } from "next/server";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { authorizeAdminApi } from "@/server/admin-auth";
import {
  googleClientId,
  googleClientSecret,
  sealSupportSecret,
  openSupportSecret,
  supportMailbox,
  gmailConnection,
} from "@/server/support-google-auth";
import { transaction } from "@/server/db";
import { originCheck } from "@/server/http";
import { syncGmailInbox } from "@/server/support-gmail";
export const runtime = "nodejs";
export async function GET(req: NextRequest) {
  const auth = await authorizeAdminApi(req);
  if (!auth.authorized) return auth.response;
  const connected = await gmailConnection();
  return NextResponse.json({
    connected: !!connected,
    email: connected?.email || supportMailbox(),
    configured: !!googleClientId() && !!googleClientSecret(),
    callbackUrl:
      (process.env.APP_ORIGIN || "http://localhost:3000") +
      "/api/admin/support/gmail/callback",
  });
}
export async function POST(req: NextRequest) {
  const auth = await authorizeAdminApi(req);
  if (!auth.authorized) return auth.response;
  try {
    originCheck(req);
    const { action } = await req.json();
    if (action === "sync") {
      return NextResponse.json(await syncGmailInbox(true));
    }
    if (action === "disconnect") {
      await transaction((repo) => repo.remove("support_connections", "gmail"));
      return NextResponse.json({ success: true });
    }
    if (action !== "connect")
      return NextResponse.json({ error: "Invalid action." }, { status: 400 });
    if (!googleClientId() || !googleClientSecret())
      return NextResponse.json(
        { error: "Google OAuth client credentials are not configured." },
        { status: 503 },
      );
    const state = randomBytes(32).toString("base64url");
    const redirectUri =
      (process.env.APP_ORIGIN || "http://localhost:3000") +
      "/api/admin/support/gmail/callback";
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.search = new URLSearchParams({
      client_id: googleClientId()!,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "https://www.googleapis.com/auth/gmail.readonly",
      access_type: "offline",
      prompt: "consent",
      state,
      login_hint: supportMailbox(),
    }).toString();
    const res = NextResponse.json({ url: url.toString() });
    res.cookies.set(
      "ovia_support_google",
      sealSupportSecret(
        JSON.stringify({
          state,
          ownerId: auth.user.id,
          expiresAt: Date.now() + 600000,
        }),
      ),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/api/admin/support/gmail",
        maxAge: 600,
      },
    );
    return res;
  } catch {
    return NextResponse.json(
      { error: "Unable to update the Gmail connection." },
      { status: 503 },
    );
  }
}
