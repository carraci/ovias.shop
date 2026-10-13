import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { createHash } from "node:crypto";
import { transaction } from "./db";
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export function originCheck(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (!origin) return;

  const expected = process.env.APP_ORIGIN || "http://localhost:3000";
  try {
    if (origin === new URL(expected).origin) return;
  } catch {}

  if (origin === req.nextUrl.origin) return;

  try {
    const originUrl = new URL(origin);
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    if (host && (originUrl.host === host || originUrl.hostname === host.split(":")[0])) return;
    if (originUrl.hostname === "ovias.shop" || originUrl.hostname.endsWith(".ovias.shop") || originUrl.hostname.endsWith(".vercel.app")) return;
    if (originUrl.hostname === "localhost" || originUrl.hostname === "127.0.0.1") return;
  } catch {}

  throw new ApiError(403, "This request origin is not permitted.");
}
export async function body(req: NextRequest) {
  if (Number(req.headers.get("content-length") || 0) > 16_384)
    throw new ApiError(413, "Request is too large.");
  const reader = req.body?.getReader();
  if (!reader) throw new ApiError(400, "Invalid JSON.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 16_384) {
      await reader.cancel();
      throw new ApiError(413, "Request is too large.");
    }
    chunks.push(value);
  }
  const text = Buffer.concat(chunks).toString("utf8");
  try {
    return JSON.parse(text);
  } catch {
    throw new ApiError(400, "Invalid JSON.");
  }
}
export function backendErrorMessage(error: unknown): string {
  let message = error instanceof Error ? error.message : String(error);
  for (const [name, value] of Object.entries(process.env)) {
    if (value && /KEY|SECRET|TOKEN|PASSWORD|MONGODB_URI/i.test(name))
      message = message.split(value).join("[redacted]");
  }
  return message.replace(/mongodb(?:\+srv)?:\/\/[^\s]+/gi, "[redacted database URI]")
    .replace(/re_[a-zA-Z0-9_-]+/g, "[redacted API key]");
}
export function api(fn: () => Promise<unknown>, status = 200, reportBackendErrors = false) {
  return fn()
    .then((data) =>
      NextResponse.json(
        { data },
        { status, headers: { "Cache-Control": "no-store" } },
      ),
    )
    .catch((e: unknown) => {
      if (reportBackendErrors)
        console.error("[auth backend]", backendErrorMessage(e));
      const code =
        e instanceof ApiError
          ? e.status
          : e instanceof ZodError
            ? 400
            : (e as { code?: number })?.code === 11000
              ? 409
              : 503;
      return NextResponse.json(
        {
          error: {
            message:
              e instanceof ApiError
                ? backendErrorMessage(e)
                : e instanceof ZodError
                  ? e.issues[0]?.message
                  : (e as { code?: number })?.code === 11000
                    ? "This request conflicts with an existing record. Try signing in or retrying the action."
                    : reportBackendErrors
                      ? backendErrorMessage(e)
                      : "Service unavailable. Please try again shortly.",
          },
        },
        { status: code, headers: { "Cache-Control": "no-store" } },
      );
    });
}
export async function limit(req: NextRequest, scope: string, max = 20) {
  const ip = process.env.VERCEL
    ? req.headers.get("x-vercel-forwarded-for") || "unknown"
    : "local";
  const id = hash(`${scope}:${ip}`);
  const accepted = await transaction(async (repo) => {
    const now = Date.now();
    const entry = await repo.get<{ id: string; count: number; until: number }>(
      "limits",
      id,
    );
    const next =
      !entry || entry.until < now
        ? { id, count: 1, until: now + 60_000 }
        : { ...entry, count: entry.count + 1 };
    await repo.put("limits", next);
    return next.count <= max;
  });
  if (!accepted)
    throw new ApiError(429, "Too many attempts. Please wait a minute.");
}
