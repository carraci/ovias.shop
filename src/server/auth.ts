import { cookies, headers } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import {
  createHash,
  randomBytes,
  randomUUID,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { transaction } from "./db";
import { ApiError, hash } from "./http";
import type { Session, User } from "@/lib/types";
import { parseDeviceFromUserAgent } from "./session-device";
const globalAuth = globalThis as typeof globalThis & { oviaSecret?: string };
const cookieName = "ovia_session";
export function authSigningKey() {
  const secret = process.env.JWT_SECRET || process.env.AUTH_SECRET;
  if (secret && secret.trim().length >= 32) {
    return new TextEncoder().encode(secret.trim());
  }
  if (secret && secret.trim().length > 0) {
    return new TextEncoder().encode(
      createHash("sha256").update(secret.trim()).digest("hex"),
    );
  }
  const fallback = process.env.VERCEL_GIT_COMMIT_SHA
    ? createHash("sha256").update(process.env.VERCEL_GIT_COMMIT_SHA).digest("hex")
    : (globalAuth.oviaSecret ??= randomBytes(48).toString("hex"));
  return new TextEncoder().encode(fallback);
}
export function passwordHash(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `scrypt-v2:${salt}:${scryptSync(password, salt, 64, { N: 131072, r: 8, p: 1, maxmem: 192 * 1024 * 1024 }).toString("hex")}`;
}
export function checkPassword(password: string, stored: string) {
  const parts = stored.split(":");
  const modern = parts[0] === "scrypt-v2";
  const [salt, key] = modern ? parts.slice(1) : parts;
  if (!salt || !key) return false;
  const actual = scryptSync(
    password,
    salt,
    64,
    modern ? { N: 131072, r: 8, p: 1, maxmem: 192 * 1024 * 1024 } : undefined,
  );
  const expected = Buffer.from(key, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
export async function currentSessionId(): Promise<string | null> {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, authSigningKey(), {
      algorithms: ["HS256"],
      issuer: "ovia",
      audience: "ovia-store",
    });
    return hash(payload.jti || "");
  } catch {
    return null;
  }
}
export async function signIn(user: User, meta?: { userAgent?: string; ip?: string }) {
  await signOut();
  const id = randomUUID();
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setJti(id)
    .setIssuer("ovia")
    .setAudience("ovia-store")
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(authSigningKey());
  const now = new Date().toISOString();
  let userAgent = meta?.userAgent;
  let ip = meta?.ip;
  if (!userAgent || !ip) {
    try {
      const headerList = await headers();
      if (!userAgent) userAgent = headerList.get("user-agent") || undefined;
      if (!ip) ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || headerList.get("x-real-ip") || undefined;
    } catch {
      // not in request context
    }
  }
  const parsed = parseDeviceFromUserAgent(userAgent, ip);
  await transaction((repo) =>
    repo.put<Session>("sessions", {
      id: hash(id),
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
      createdAt: now,
      lastActiveAt: now,
      userAgent,
      ip: parsed.ip,
      device: parsed.device,
      browser: parsed.browser,
      os: parsed.os,
      deviceType: parsed.deviceType,
      location: parsed.location,
    }),
  );
  (await cookies()).set(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 604800,
  });
}
export async function currentUser() {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, authSigningKey(), {
      algorithms: ["HS256"],
      issuer: "ovia",
      audience: "ovia-store",
    });
    return await transaction(async (repo) => {
      const session = await repo.get<Session>(
        "sessions",
        hash(payload.jti || ""),
      );
      if (
        !session ||
        session.userId !== payload.sub ||
        !Number.isFinite(Date.parse(session.expiresAt)) ||
        Date.parse(session.expiresAt) <= Date.now()
      )
        return null;
      const user = await repo.get<User>("users", session.userId);
      return user?.verifiedAt
        ? {
            id: user.id,
            name: user.name,
            email: user.email,
            verifiedAt: user.verifiedAt,
            role: user.role || "CUSTOMER",
          }
        : null;
    });
  } catch {
    return null;
  }
}
export async function signOut() {
  const jar = await cookies();
  const token = jar.get(cookieName)?.value;
  let sessionId: string | undefined;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, authSigningKey(), {
        algorithms: ["HS256"],
        issuer: "ovia",
        audience: "ovia-store",
      });
      sessionId = payload.jti;
    } catch {
      /* Invalid signatures/expired sessions cannot authenticate. */
    }
  }
  if (sessionId)
    await transaction((repo) => repo.remove("sessions", hash(sessionId)));
  jar.delete(cookieName);
}
export async function cartOwner() {
  const jar = await cookies();
  let token = jar.get("ovia_cart")?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) {
    token = randomBytes(32).toString("hex");
    jar.set("ovia_cart", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 2592000,
    });
  }
  return hash(token);
}

export async function signPasswordResetToken(userId: string, tokenId: string) {
  return new SignJWT({ purpose: "password-reset" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setJti(tokenId)
    .setIssuer("ovia")
    .setAudience("ovia-password-reset")
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(authSigningKey());
}
export async function readPasswordResetToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, authSigningKey(), {
      algorithms: ["HS256"], issuer: "ovia", audience: "ovia-password-reset",
    });
    if (payload.purpose !== "password-reset" || !payload.jti || !payload.sub)
      throw new Error("Invalid purpose");
    return { tokenId: payload.jti, userId: payload.sub };
  } catch {
    throw new ApiError(400, "Invalid or expired reset authorization. Request a new code.");
  }
}

