import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminApi } from "@/server/admin-auth";
import {
  googleClientId,
  googleClientSecret,
  openSupportSecret,
  sealSupportSecret,
  supportMailbox,
  validOAuthState,
} from "@/server/support-google-auth";
import { transaction } from "@/server/db";
export const runtime = "nodejs";
export async function GET(req: NextRequest) {
  const auth = await authorizeAdminApi(req);
  if (!auth.authorized) return auth.response;
  const redirect = new URL(
    "/admin/support",
    process.env.APP_ORIGIN || "http://localhost:3000",
  );
  try {
    const cookie = req.cookies.get("ovia_support_google")?.value;
    if (!cookie) throw new Error("Missing authorization state.");
    const state = JSON.parse(openSupportSecret(cookie));
    if (
      state.ownerId !== auth.user.id ||
      state.expiresAt < Date.now() ||
      !validOAuthState(req.nextUrl.searchParams.get("state") || "", state.state)
    )
      throw new Error("Invalid authorization state.");
    const code = req.nextUrl.searchParams.get("code");
    if (!code) throw new Error("Authorization declined.");
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      body: new URLSearchParams({
        client_id: googleClientId()!,
        client_secret: googleClientSecret()!,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirect.origin + "/api/admin/support/gmail/callback",
      }),
      signal: AbortSignal.timeout(10000),
    });
    const token = await response.json();
    if (!response.ok || !token.refresh_token || !token.access_token)
      throw new Error("Missing offline authorization.");
    const profileResponse = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/profile",
      {
        headers: { Authorization: "Bearer " + token.access_token },
        signal: AbortSignal.timeout(10000),
      },
    );
    const profile = await profileResponse.json();
    if (!profileResponse.ok || !profile.emailAddress)
      throw new Error("Unable to read Google account email.");
    const email = profile.emailAddress.toLowerCase();
    await transaction((repo) =>
      repo.put("support_connections", {
        id: "gmail",
        email,
        refreshToken: sealSupportSecret(token.refresh_token),
        connectedAt: new Date().toISOString(),
      }),
    );
    redirect.searchParams.set("gmail", "connected");
    try {
      const { syncGmailInbox } = await import("@/server/support-gmail");
      await syncGmailInbox(true);
    } catch {
      /* Background sync retry */
    }
  } catch {
    redirect.searchParams.set("gmail", "failed");
  }
  const result = NextResponse.redirect(redirect);
  result.cookies.delete({
    name: "ovia_support_google",
    path: "/api/admin/support/gmail",
  });
  return result;
}
