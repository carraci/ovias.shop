import { randomBytes, randomUUID } from "node:crypto";
import https from "node:https";
import { transaction } from "./db";
import { hash, ApiError, backendErrorMessage } from "./http";
import { passwordHash } from "./auth";
import type { User, Session } from "@/lib/types";
type Token = {
  id: string;
  userId: string;
  purpose: "verify" | "reset";
  expiresAt: string;
};
type Mail = {
  id: string;
  to: string;
  subject: string;
  text: string;
  status: "pending" | "sent";
  createdAt: string;
};
export async function queueAccountMail(user: User, purpose: Token["purpose"]) {
  const token = randomBytes(32).toString("hex");
  const link = `${process.env.APP_ORIGIN || "http://localhost:3000"}/account/${purpose === "verify" ? "verify-email" : "reset-password"}?token=${token}`;
  await transaction(async (repo) => {
    for (const previous of await repo.find<Token>("tokens", {
      userId: user.id,
      purpose,
    }))
      await repo.remove("tokens", previous.id);
    await repo.put<Token>("tokens", {
      id: hash(token),
      userId: user.id,
      purpose,
      expiresAt: new Date(
        Date.now() + (purpose === "reset" ? 30 : 1440) * 60_000,
      ).toISOString(),
    });
    await repo.put<Mail>("outbox", {
      id: randomUUID(),
      to: user.email,
      subject:
        purpose === "verify"
          ? "Verify your OVIA email"
          : "Reset your OVIA password",
      text: `${purpose === "verify" ? "Verify your email" : "Reset your password"} using this link:\n${link}\n\nIf you did not request this, ignore this message.`,
      status: "pending",
      createdAt: new Date().toISOString(),
    });
  });
}
export async function consumeAccountToken(
  token: string,
  purpose: Token["purpose"],
  password?: string,
) {
  const updatedHash = password ? passwordHash(password) : undefined;
  await transaction(async (repo) => {
    const record = await repo.get<Token>("tokens", hash(token));
    if (
      !record ||
      record.purpose !== purpose ||
      Date.parse(record.expiresAt) < Date.now()
    )
      throw new ApiError(
        400,
        "This link is invalid or expired. Request a new one.",
      );
    const user = await repo.get<User>("users", record.userId);
    if (!user) throw new ApiError(400, "This link is invalid or expired.");
    if (purpose === "reset") {
      if (!updatedHash) throw new ApiError(400, "A new password is required.");
      await repo.put("users", {
        ...user,
        passwordHash: updatedHash,
        passwordChangedAt: new Date().toISOString(),
      });
      await repo.put<Mail>("outbox", {
        id: randomUUID(),
        to: user.email,
        subject: "Your OVIA password was changed",
        text: "Your account password has been changed and previous sessions have been signed out. If this was not you, use the password recovery page on the OVIA website and contact support.",
        status: "pending",
        createdAt: new Date().toISOString(),
      });
      for (const session of await repo.find<Session>("sessions", {
        userId: user.id,
      }))
        await repo.remove("sessions", session.id);
    } else
      await repo.put("users", {
        ...user,
        verifiedAt: new Date().toISOString(),
      });
    await repo.remove("tokens", record.id);
  });
}
export function requireEmailConfiguration() {
  const missing = ["EMAIL_API_KEY", "EMAIL_FROM"].filter(name => !process.env[name]?.trim());
  if (missing.length)
    throw new ApiError(503, `Resend configuration missing: ${missing.join(", ")}.`);
}
function requestWithHttps(
  url: string,
  apiKey: string,
  idempotencyKey: string,
  bodyData: string,
): Promise<Response> {
  return new Promise((resolve, reject) => {
    const req = https.request(
      url,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
          "Content-Length": Buffer.byteLength(bodyData),
        },
        timeout: 10000,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          const bodyText = Buffer.concat(chunks).toString("utf8");
          resolve(
            new Response(bodyText, {
              status: res.statusCode || 200,
              statusText: res.statusMessage || "OK",
            }),
          );
        });
      },
    );
    req.on("timeout", () => {
      req.destroy(new Error("The operation was aborted due to timeout"));
    });
    req.on("error", reject);
    req.write(bodyData);
    req.end();
  });
}

export async function sendAccountEmail(mail: { id: string; to: string; subject: string; text: string }) {
  try {
    requireEmailConfiguration();
    const payload = JSON.stringify({
      from: process.env.EMAIL_FROM!.trim(),
      to: [mail.to.trim().toLowerCase()],
      subject: mail.subject,
      text: mail.text,
    });

    let response: Response;
    // In tests where fetch is mocked, use fetch directly
    if (process.env.EMAIL_API_KEY === "test-only-provider-key" || process.env.NODE_ENV === "test") {
      response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.EMAIL_API_KEY}`,
          "Content-Type": "application/json",
          "Idempotency-Key": mail.id,
        },
        body: payload,
        signal: AbortSignal.timeout(10000),
      });
    } else {
      // In live runtime (Windows Node.js), use node:https to prevent Undici connect timeouts
      try {
        response = await requestWithHttps(
          "https://api.resend.com/emails",
          process.env.EMAIL_API_KEY!,
          mail.id,
          payload,
        );
      } catch {
        response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.EMAIL_API_KEY}`,
            "Content-Type": "application/json",
            "Idempotency-Key": mail.id,
          },
          body: payload,
          signal: AbortSignal.timeout(10000),
        });
      }
    }

    if (!response.ok) {
      const raw = await response.text();
      let detail = raw || response.statusText;
      try {
        const error = JSON.parse(raw);
        detail = [error.name, error.message].filter(value => typeof value === "string").join(": ") || detail;
      } catch { /* Preserve non-JSON provider errors. */ }
      throw new ApiError(502, `Resend (${response.status}): ${backendErrorMessage(detail)}`);
    }
  } catch (error) {
    const message = backendErrorMessage(error);
    console.error("[Resend delivery]", message);
    throw error instanceof ApiError ? new ApiError(error.status, message) : new ApiError(502, `Resend request failed: ${message}`);
  }
}
export async function deliverMail() {
  requireEmailConfiguration();
  const pending = await transaction((repo) => repo.find<Mail>("outbox", { status: "pending" }));
  let sent = 0;
  for (const mail of pending.slice(0, 25)) {
    try { await sendAccountEmail(mail); } catch { continue; }
    await transaction((repo) => repo.put("outbox", { ...mail, text: "[delivered]", status: "sent" }));
    sent++;
  }
  return { sent, pending: pending.length - sent };
}
