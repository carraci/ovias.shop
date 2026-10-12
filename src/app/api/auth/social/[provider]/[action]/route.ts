import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { api, ApiError, body, hash, limit, originCheck } from "@/server/http";
import { authSigningKey, cartOwner, currentUser } from "@/server/auth";
import { completeSignIn } from "@/server/account-sign-in";
import {
  appOrigin,
  cookieName,
  cookieOptions,
  prepareFlow,
  consumeFlow,
  exchangeCode,
  verifyIdentity,
  resolveSocialUser,
  SocialError,
  type Provider,
} from "@/server/social-auth";
export const runtime = "nodejs";
type Context = { params: Promise<{ provider: string; action: string }> };
async function callback(req: NextRequest, provider: Provider) {
  const jar = await cookies();
  let destination = "/account";
  let stage = "state";
  try {
    if (Number(req.headers.get("content-length") || 0) > 16384)
      throw new SocialError("failed");
    let values: URLSearchParams;
    if (req.method === "POST") {
      if (
        !req.headers
          .get("content-type")
          ?.startsWith("application/x-www-form-urlencoded")
      )
        throw new SocialError("failed");
      const reader = req.body?.getReader();
      if (!reader) throw new SocialError("failed");
      const chunks: Uint8Array[] = [];
      let size = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 16384) {
          await reader.cancel();
          throw new SocialError("failed");
        }
        chunks.push(value);
      }
      values = new URLSearchParams(Buffer.concat(chunks).toString("utf8"));
    } else values = req.nextUrl.searchParams;
    const flow = await consumeFlow(
      provider,
      values.get("state") || "",
      jar.get(cookieName(provider))?.value,
    );
    if (values.has("error"))
      throw new SocialError(
        values.get("error") === "access_denied" ? "cancelled" : "failed",
      );
    stage = "exchange";
    const token = await exchangeCode(flow, values.get("code") || "");
    stage = "verify";
    const identity = await verifyIdentity(flow, token);
    let name: string | undefined;
    if (provider === "apple" && values.get("user")) {
      try {
        const user = JSON.parse(values.get("user")!);
        name = [user.name?.firstName, user.name?.lastName]
          .filter((v) => typeof v === "string")
          .join(" ")
          .slice(0, 100);
      } catch {
        /* Optional one-time display name. Identity always comes from the verified token. */
      }
    }
    stage = "account";
    const user = await resolveSocialUser(flow, identity, name);
    stage = "session";
    await completeSignIn(user, flow.guestCartId);
    if (flow.intent === "link")
      destination = "/account/security?social_linked=1";
  } catch (error) {
    // Only fixed error names/codes are logged; never tokens, identity claims, or URLs.
    const detail = error as {
      name?: string;
      code?: string | number;
      claim?: string;
      payload?: { iat?: number };
    };
    const knownCodes = [
      "ERR_JWT_EXPIRED",
      "ERR_JWT_CLAIM_VALIDATION_FAILED",
      "ERR_JWS_SIGNATURE_VERIFICATION_FAILED",
      "ERR_JWKS_TIMEOUT",
      "ERR_JWKS_NO_MATCHING_KEY",
      "ERR_JOSE_ALG_NOT_ALLOWED",
      "ERR_JWS_INVALID",
      "ERR_JWT_INVALID",
    ];
    const reason =
      error instanceof SocialError
        ? error.reason || error.code
        : knownCodes.includes(String(detail?.code))
          ? String(detail.code)
          : detail?.code === 11000
            ? "duplicate_record"
            : detail?.name === "TimeoutError"
              ? "network_timeout"
              : "internal_error";
    const claim = ["iat", "exp", "iss", "aud", "sub", "nonce"].includes(
      detail?.claim || "",
    )
      ? detail.claim
      : undefined;
    console.error(
      "[social-auth]",
      JSON.stringify({
        provider,
        stage,
        reason,
        claim,
        clockOffsetSeconds:
          claim === "iat" && typeof detail?.payload?.iat === "number"
            ? Math.round(Date.now() / 1000 - detail.payload.iat)
            : undefined,
      }),
    );
    const code = error instanceof SocialError ? error.code : "failed";
    destination = `/account/sign-in?social_error=${encodeURIComponent(code)}`;
  }
  jar.set(cookieName(provider), "", { ...cookieOptions(provider), maxAge: 0 });
  return NextResponse.redirect(new URL(destination, appOrigin()), {
    status: 303,
    headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" },
  });
}
export async function GET(req: NextRequest, ctx: Context) {
  const { provider, action } = await ctx.params;
  if (provider === "google" && action === "callback")
    return callback(req, provider);
  return NextResponse.json(
    { error: { message: "Not found." } },
    { status: 404 },
  );
}
export async function POST(req: NextRequest, ctx: Context) {
  const { provider, action } = await ctx.params;
  if (provider === "apple" && action === "callback")
    return callback(req, provider);
  return api(async () => {
    if (!["google", "apple"].includes(provider) || action !== "start")
      throw new ApiError(404, "Not found.");
    originCheck(req);
    await limit(req, `social-start-${provider}`, 10);
    const data = await body(req);
    if (
      !data ||
      !["signin", "link"].includes(data.intent) ||
      data.terms !== "on"
    )
      throw new ApiError(400, "Accept the terms before continuing.");
    let binding: { userId: string; sessionId: string } | undefined;
    if (data.intent === "link") {
      const user = await currentUser();
      const token = (await cookies()).get("ovia_session")?.value;
      if (!user || !token)
        throw new ApiError(401, "Sign in before connecting an account.");
      const { payload } = await jwtVerify(token, authSigningKey(), {
        algorithms: ["HS256"],
        issuer: "ovia",
        audience: "ovia-store",
      });
      binding = { userId: user.id, sessionId: hash(payload.jti!) };
    }
    const result = await prepareFlow(
      provider as Provider,
      data.intent,
      binding,
      await cartOwner(),
    );
    (await cookies()).set(
      cookieName(provider as Provider),
      result.token,
      cookieOptions(provider as Provider),
    );
    return { url: result.url };
  });
}
