import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import { randomBytes, randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { authSigningKey, checkPassword } from "./auth";
import { transaction } from "./db";
import { hash } from "./http";
import type { Session, User } from "@/lib/types";

const COOKIE_NAME = "ovia_session";

export function isOwnerRole(role?: string): boolean {
  if (!role) return false;
  const normalized = role.trim().toUpperCase();
  return normalized === "OWNER" || normalized === "ADMIN";
}

export type SafeAdminUser = {
  id: string;
  name: string;
  email: string;
  role: "OWNER";
  verifiedAt?: string;
};

/**
 * Validates the caller's session and verifies that their role is OWNER.
 * Returns the authenticated owner user, or null if unauthenticated or not an owner.
 */
export async function getAuthenticatedOwner(): Promise<SafeAdminUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, authSigningKey(), {
      algorithms: ["HS256"],
      issuer: "ovia",
      audience: "ovia-store",
    });

    if (!payload.sub || !payload.jti) return null;

    return await transaction(async (repo) => {
      const session = await repo.get<Session>("sessions", hash(payload.jti || ""));
      if (
        !session ||
        session.userId !== payload.sub ||
        Date.parse(session.expiresAt) < Date.now()
      ) {
        return null;
      }

      const user = await repo.get<User>("users", session.userId);
      if (!user) return null;

      // Real server-side role check:
      if (!isOwnerRole(user.role)) {
        return null;
      }

      return {
        id: user.id,
        name: user.name || "Adarsh Shukla",
        email: user.email,
        role: "OWNER",
        verifiedAt: user.verifiedAt,
      };
    });
  } catch {
    return null;
  }
}

/**
 * Enforces owner access in Next.js Server Components.
 * If unauthenticated, redirects to the shared account sign-in page.
 * If logged in as customer, redirects to /admin/unauthorized (or /account).
 */
export async function requireOwner(): Promise<SafeAdminUser> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) redirect("/account/sign-in?next=/admin");
  let subject: string | undefined, sessionId: string | undefined;
  try {
    const { payload } = await jwtVerify(token, authSigningKey(), {algorithms:["HS256"],issuer:"ovia",audience:"ovia-store"});
    subject = payload.sub; sessionId = payload.jti;
  } catch { redirect("/account/sign-in?next=/admin"); }
  if (!subject || !sessionId) redirect("/account/sign-in?next=/admin");
  let user: User | null;
  try {
    user = await transaction(async repo => {
      const session = await repo.get<Session>("sessions", hash(sessionId!));
      if (!session || session.userId !== subject || !Number.isFinite(Date.parse(session.expiresAt)) || Date.parse(session.expiresAt) <= Date.now()) return null;
      return await repo.get<User>("users", session.userId) || null;
    });
  } catch { redirect("/admin/unavailable"); }
  if (!user) redirect("/account/sign-in?next=/admin");
  if (!isOwnerRole(user.role)) redirect("/admin/unauthorized");
  return {id:user.id,name:user.name || "Store owner",email:user.email,role:"OWNER",verifiedAt:user.verifiedAt};
}

/**
 * Server-side authorization guard for all /api/admin/* endpoints.
 * Returns either { authorized: true, user } or a NextResponse with 401/403.
 */
export async function authorizeAdminApi(req?: NextRequest | Request): Promise<
  | { authorized: true; user: SafeAdminUser }
  | { authorized: false; response: NextResponse }
> {
  let token: string | undefined;
  if (req && "cookies" in req && (req as any).cookies?.get) {
    token = (req as any).cookies.get(COOKIE_NAME)?.value;
  }
  if (!token && req) {
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    }
    const cookieHeader = req.headers.get("cookie");
    if (cookieHeader && !token) {
      const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
      if (match) token = match[1];
    }
  }

  if (!token) {
    try {
      const jar = await cookies();
      token = jar.get(COOKIE_NAME)?.value;
    } catch {
      // Not in Next.js cookie store context
    }
  }

  if (!token) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Authentication required. Please sign in as OVIA shop owner." },
        { status: 401 }
      ),
    };
  }

  try {
    const { payload } = await jwtVerify(token, authSigningKey(), {
      algorithms: ["HS256"],
      issuer: "ovia",
      audience: "ovia-store",
    });

    if (!payload.sub || !payload.jti) {
      return {
        authorized: false,
        response: NextResponse.json(
          { error: "Invalid session token." },
          { status: 401 }
        ),
      };
    }

    const verification = await transaction(async (repo) => {
      const session = await repo.get<Session>("sessions", hash(payload.jti || ""));
      if (
        !session ||
        session.userId !== payload.sub ||
        Date.parse(session.expiresAt) < Date.now()
      ) {
        return { status: 401, error: "Session expired or revoked." };
      }

      const user = await repo.get<User>("users", session.userId);
      if (!user) {
        return { status: 401, error: "User record not found." };
      }

      if (!isOwnerRole(user.role)) {
        return {
          status: 403,
          error: "Forbidden: Access restricted to OVIA Shop Owner (role=OWNER).",
        };
      }

      return {
        user: {
          id: user.id,
          name: user.name || "Adarsh Shukla",
          email: user.email,
          role: "OWNER" as const,
          verifiedAt: user.verifiedAt,
        },
      };
    });

    if ("error" in verification) {
      return {
        authorized: false,
        response: NextResponse.json(
          { error: verification.error },
          { status: verification.status }
        ),
      };
    }

    return {
      authorized: true,
      user: verification.user,
    };
  } catch {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Invalid or forged session signature." },
        { status: 401 }
      ),
    };
  }
}

/**
 * Creates an audit record in the database for every critical shop-owner action.
 */
export async function recordAuditEvent(params: {
  actor: string;
  action: string;
  resource: string;
  resourceId?: string;
  result?: "SUCCESS" | "FAILED";
  details?: Record<string, unknown>;
  ip?: string;
}) {
  try {
    await transaction(async (repo) => {
      const auditLog = {
        id: randomUUID(),
        timestamp: new Date().toISOString(),
        actor: params.actor,
        action: params.action,
        resource: params.resource,
        resourceId: params.resourceId || "",
        result: params.result || "SUCCESS",
        details: params.details || {},
        ip: params.ip || "127.0.0.1",
      };
      await repo.put("audit", auditLog);
    });
  } catch (err) {
    console.error("Failed to write audit event:", err);
  }
}

/**
 * Authenticates shop owner by email and password, establishing an HttpOnly session cookie.
 */
export async function authenticateOwnerLogin(email: string, password?: string) {
  if (typeof email !== "string" || !email.trim() || typeof password !== "string" || !password.length) {
    throw new Error("Invalid owner credentials.");
  }
  return await transaction(async (repo) => {
    const normalizedEmail = email.trim().toLowerCase();
    const user = (await repo.find<User>("users", { email: normalizedEmail }))[0];

    if (!user) {
      throw new Error("Invalid owner credentials.");
    }

    if (!isOwnerRole(user.role)) {
      throw new Error("Access restricted. This account does not possess OWNER privileges.");
    }

    const valid = checkPassword(password, user.passwordHash);
    if (!valid) {
      throw new Error("Invalid owner credentials.");
    }

    const sessionId = randomUUID();
    const token = await new SignJWT({})
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(user.id)
      .setJti(sessionId)
      .setIssuer("ovia")
      .setAudience("ovia-store")
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(authSigningKey());

    await repo.put<Session>("sessions", {
      id: hash(sessionId),
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    });

    const jar = await cookies();
    jar.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 604800,
    });

    await recordAuditEvent({
      actor: user.email,
      action: "OWNER_SIGN_IN",
      resource: "auth",
      resourceId: user.id,
      details: { role: "OWNER" },
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: "OWNER",
    };
  });
}
