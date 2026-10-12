import { randomBytes, createHash } from "node:crypto";
import {
  SignJWT,
  jwtVerify,
  createRemoteJWKSet,
  importPKCS8,
  type JWTVerifyGetKey,
} from "jose";
import { authSigningKey, passwordHash } from "./auth";
import { transaction } from "./db";
import { ApiError, hash } from "./http";
import { TERMS_VERSION } from "@/lib/policies";
import type { User, Session } from "@/lib/types";
export type Provider = "google" | "apple";
export type Flow = {
  provider: Provider;
  state: string;
  nonce: string;
  verifier: string;
  intent: "signin" | "link";
  userId?: string;
  sessionId?: string;
  guestCartId?: string;
};
export class SocialError extends Error {
  constructor(
    public code: string,
    public reason?: string,
  ) {
    super(code);
  }
}
export function appOrigin() {
  return new URL(process.env.APP_ORIGIN || "http://localhost:3000").origin;
}
export function availableProviders() {
  const url = new URL(appOrigin());
  const secure = url.protocol === "https:";
  const local = ["localhost", "127.0.0.1"].includes(url.hostname);
  const productionReady =
    process.env.NODE_ENV !== "production" ||
    (secure &&
      !!process.env.MONGODB_URI &&
      (process.env.JWT_SECRET?.length || 0) >= 32);
  return {
    google:
      productionReady &&
      (secure || local) &&
      !!process.env.GOOGLE_CLIENT_ID &&
      !!process.env.GOOGLE_CLIENT_SECRET,
    apple:
      productionReady &&
      secure &&
      !local &&
      !!process.env.APPLE_CLIENT_ID &&
      !!process.env.APPLE_TEAM_ID &&
      !!process.env.APPLE_KEY_ID &&
      !!process.env.APPLE_PRIVATE_KEY,
  };
}
export const callbackUrl = (provider: Provider) =>
  `${appOrigin()}/api/auth/social/${provider}/callback`;
export const cookieName = (provider: Provider) => `ovia_social_${provider}`;
export const cookieOptions = (provider: Provider) => ({
  httpOnly: true,
  secure: appOrigin().startsWith("https:"),
  sameSite: provider === "apple" ? ("none" as const) : ("lax" as const),
  path: `/api/auth/social/${provider}`,
  maxAge: 600,
});
export async function prepareFlow(
  provider: Provider,
  intent: Flow["intent"],
  binding?: { userId: string; sessionId: string },
  guestCartId?: string,
) {
  if (!availableProviders()[provider])
    throw new ApiError(
      503,
      `${provider === "google" ? "Google" : "Apple"} sign-in needs provider configuration.`,
    );
  if (intent === "link" && !binding)
    throw new ApiError(401, "Sign in before connecting an account.");
  const flow: Flow = {
    provider,
    intent,
    state: randomBytes(32).toString("hex"),
    nonce: randomBytes(32).toString("hex"),
    verifier: randomBytes(32).toString("base64url"),
    ...binding,
    guestCartId,
  };
  const token = await new SignJWT(flow)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer("ovia")
    .setAudience("ovia-social-state")
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(authSigningKey());
  await transaction((repo) =>
    repo.put("tokens", {
      id: `social-flow-${hash(flow.state)}`,
      purpose: "social-login",
      provider,
      cleanupAt: new Date(Date.now() + 600000),
    }),
  );
  const url = new URL(
    provider === "google"
      ? "https://accounts.google.com/o/oauth2/v2/auth"
      : "https://appleid.apple.com/auth/authorize",
  );
  url.search = new URLSearchParams({
    client_id:
      process.env[
        provider === "google" ? "GOOGLE_CLIENT_ID" : "APPLE_CLIENT_ID"
      ]!,
    redirect_uri: callbackUrl(provider),
    response_type: "code",
    scope: provider === "google" ? "openid email profile" : "name email",
    state: flow.state,
    nonce: flow.nonce,
  }).toString();
  if (provider === "google") {
    url.searchParams.set(
      "code_challenge",
      createHash("sha256").update(flow.verifier).digest("base64url"),
    );
    url.searchParams.set("code_challenge_method", "S256");
    url.searchParams.set("prompt", "select_account");
  } else url.searchParams.set("response_mode", "form_post");
  return { token, url: url.toString(), flow };
}
export async function consumeFlow(
  provider: Provider,
  state: string,
  token?: string,
): Promise<Flow> {
  try {
    if (!token || !/^[a-f0-9]{64}$/.test(state)) throw new Error();
    const { payload } = await jwtVerify(token, authSigningKey(), {
      algorithms: ["HS256"],
      issuer: "ovia",
      audience: "ovia-social-state",
    });
    if (
      payload.provider !== provider ||
      payload.state !== state ||
      typeof payload.nonce !== "string" ||
      typeof payload.verifier !== "string" ||
      !["signin", "link"].includes(String(payload.intent))
    )
      throw new Error();
    await transaction(async (repo) => {
      const id = `social-flow-${hash(state)}`;
      const record = await repo.get<{
        id: string;
        provider: string;
        cleanupAt: Date | string;
      }>("tokens", id);
      if (
        !record ||
        record.provider !== provider ||
        new Date(record.cleanupAt).getTime() <= Date.now()
      )
        throw new Error();
      await repo.remove("tokens", id);
    });
    return payload as unknown as Flow;
  } catch {
    throw new SocialError("expired");
  }
}
const googleKeys = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs"),
  { timeoutDuration: 10000 },
);
const appleKeys = createRemoteJWKSet(
  new URL("https://appleid.apple.com/auth/keys"),
  { timeoutDuration: 10000 },
);
export async function appleClientSecret() {
  const key = await importPKCS8(
    process.env.APPLE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
    "ES256",
  );
  return new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: process.env.APPLE_KEY_ID })
    .setIssuer(process.env.APPLE_TEAM_ID!)
    .setSubject(process.env.APPLE_CLIENT_ID!)
    .setAudience("https://appleid.apple.com")
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(key);
}
export async function exchangeCode(flow: Flow, code: string) {
  if (!code || code.length > 4096) throw new SocialError("failed");
  const google = flow.provider === "google";
  const form = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: process.env[google ? "GOOGLE_CLIENT_ID" : "APPLE_CLIENT_ID"]!,
    client_secret: google
      ? process.env.GOOGLE_CLIENT_SECRET!
      : await appleClientSecret(),
    redirect_uri: callbackUrl(flow.provider),
  });
  if (google) form.set("code_verifier", flow.verifier);
  const response = await fetch(
    google
      ? "https://oauth2.googleapis.com/token"
      : "https://appleid.apple.com/auth/token",
    {
      method: "POST",
      body: form,
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(10000),
    },
  );
  if (!response.ok) {
    const failure = await response.json().catch(() => null);
    const allowed = [
      "invalid_client",
      "invalid_grant",
      "invalid_request",
      "unauthorized_client",
      "unsupported_grant_type",
      "access_denied",
      "temporarily_unavailable",
      "server_error",
    ];
    const reason = allowed.includes(failure?.error)
      ? failure.error
      : "provider_error";
    throw new SocialError("failed", reason);
  }
  const data = await response.json();
  if (typeof data.id_token !== "string" || data.id_token.length > 20000)
    throw new SocialError("failed");
  return data.id_token as string;
}
export async function verifyIdentity(
  flow: Flow,
  token: string,
  keys?: JWTVerifyGetKey,
) {
  const google = flow.provider === "google";
  const { payload } = await jwtVerify(
    token,
    keys || (google ? googleKeys : appleKeys),
    {
      algorithms: ["RS256"],
      issuer: google
        ? ["https://accounts.google.com", "accounts.google.com"]
        : "https://appleid.apple.com",
      audience: process.env[google ? "GOOGLE_CLIENT_ID" : "APPLE_CLIENT_ID"],
      requiredClaims: ["exp", "iat", "sub", "nonce"],
      maxTokenAge: "10m",
      // Provider/server clocks can differ slightly; retain bounded age and expiry checks.
      clockTolerance: 60,
    },
  );
  if (
    payload.azp !== undefined &&
    payload.azp !== process.env[google ? "GOOGLE_CLIENT_ID" : "APPLE_CLIENT_ID"]
  )
    throw new SocialError("failed");
  if (payload.nonce !== flow.nonce || !payload.sub || payload.sub.length > 255)
    throw new SocialError("failed");
  const email =
    typeof payload.email === "string" &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email) &&
    payload.email.length <= 254
      ? payload.email.toLowerCase()
      : undefined;
  const verified =
    payload.email_verified === true || payload.email_verified === "true";
  if (payload.email !== undefined && (!email || !verified))
    throw new SocialError("failed");
  return {
    sub: payload.sub,
    email,
    // Google is authoritative for Gmail ownership; external email needs a separate challenge.
    googleOwnsEmail:
      google && verified && email?.endsWith("@gmail.com") === true,
    name:
      typeof payload.name === "string" ? payload.name.slice(0, 100) : undefined,
  };
}
export async function resolveSocialUser(
  flow: Flow,
  identity: {
    sub: string;
    email?: string;
    name?: string;
    googleOwnsEmail?: boolean;
  },
  appleName?: string,
) {
  const identityId = `social-identity-${hash(`${flow.provider}:${identity.sub}`)}`;
  // A random, unusable password preserves existing password-reset and session behavior.

  return transaction(async (repo) => {
    async function bindIdentity(userId: string) {
      if (flow.provider === "google") {
        const bindingId = `social-provider-google-${hash(userId)}`;
        const binding = await repo.get<{ id: string; identityId: string }>(
          "tokens",
          bindingId,
        );
        const links = await repo.find<{
          id: string;
          purpose: string;
          provider: string;
          userId: string;
        }>("tokens", {
          purpose: "social-identity",
          provider: "google",
          userId,
        });
        if (
          (binding && binding.identityId !== identityId) ||
          links.some((link) => link.id !== identityId)
        )
          throw new SocialError(
            flow.intent === "link" ? "linked_elsewhere" : "account_link",
          );
        // A shared unique record serializes competing first-time Google bindings in MongoDB.
        await repo.put("tokens", {
          id: bindingId,
          purpose: "social-provider-binding",
          provider: "google",
          userId,
          identityId,
        });
      }
      await repo.put("tokens", {
        id: identityId,
        purpose: "social-identity",
        provider: flow.provider,
        userId,
      });
    }
    const record = await repo.get<{ id: string; userId: string }>(
      "tokens",
      identityId,
    );
    if (flow.intent === "link") {
      const session = flow.sessionId
        ? await repo.get<Session>("sessions", flow.sessionId)
        : undefined;
      const user = flow.userId
        ? await repo.get<User>("users", flow.userId)
        : undefined;
      if (
        !user?.verifiedAt ||
        !session ||
        session.userId !== user.id ||
        Date.parse(session.expiresAt) <= Date.now()
      )
        throw new SocialError("expired");
      if (record && record.userId !== user.id)
        throw new SocialError("linked_elsewhere");
      await bindIdentity(user.id);
      return user;
    }
    if (record) {
      const user = await repo.get<User>("users", record.userId);
      if (!user?.verifiedAt) throw new SocialError("failed");
      return user;
    }
    if (!identity.email) throw new SocialError("failed");
    const matchingUsers = await repo.find<User>("users", {
      email: identity.email,
    });
    if (matchingUsers.length) {
      const existing = matchingUsers[0];
      if (
        matchingUsers.length !== 1 ||
        !existing.verifiedAt ||
        flow.provider !== "google" ||
        identity.googleOwnsEmail !== true ||
        !identity.email.endsWith("@gmail.com")
      )
        throw new SocialError("account_link");
      // Bind the verified Google subject atomically; future logins resolve this identity first.
      await bindIdentity(existing.id);
      return existing;
    }
    const now = new Date().toISOString();
    const user: User = {
      id: `social-${hash(`${flow.provider}:${identity.sub}`)}`,
      email: identity.email,
      name: (identity.name || appleName || identity.email.split("@")[0])
        .replace(/[\x00-\x1f<>]/g, "")
        .slice(0, 100),
      passwordHash: passwordHash(randomBytes(48).toString("hex")),
      createdAt: now,
      verifiedAt: now,
      termsVersion: TERMS_VERSION,
      termsAcceptedAt: now,
    };
    await repo.put("users", user);
    await bindIdentity(user.id);
    return user;
  });
}
