import { randomBytes, randomInt } from "node:crypto";
import { transaction } from "./db";
import { ApiError, hash } from "./http";
import { checkPassword, passwordHash, signPasswordResetToken } from "./auth";
import { sendAccountEmail, requireEmailConfiguration } from "./mail";
import type { User } from "@/lib/types";

// Reuses the existing tokens collection and MongoDB connection.
export type RecoveryCode = {
  id: string;
  userId: string;
  purpose: "reset-otp" | "verify-otp";
  credentialHash?: string;
  otpHash: string;
  previousOtpHashes?: string[];
  attempts: number;
  createdAt: string;
  expiresAt: string;
  cleanupAt: Date;
  generation: string;
};
export const recoveryMessage = "If that email is registered, a code was sent.";
type CodePurpose = "reset" | "verify";
export const normalizeEmail = (email: string) => email.trim().toLowerCase();
const codeId = (email: string, purpose: CodePurpose = "reset") =>
  hash(`${purpose}-otp:${normalizeEmail(email)}`);

async function requestCode(
  rawEmail: string,
  purpose: CodePurpose,
) {
  requireEmailConfiguration();
  const email = normalizeEmail(rawEmail);
  // Reserve cooldown for known AND unknown addresses to avoid enumeration.
  // Cooldown is set to 40s so that users clicking Resend after the 42s UI timer are allowed,
  // while immediate requests (0s) are rejected with the 60s message.
  const accepted = await transaction(async (repo) => {
    const id = hash(`${purpose}-cooldown:${email}`);
    const previous = await repo.get<{ id: string; until: number }>(
      "limits",
      id,
    );
    if (previous && previous.until > Date.now()) return false;
    await repo.put("limits", { id, until: Date.now() + 40_000 });
    return true;
  });
  if (!accepted)
    throw new ApiError(
      429,
      "Please wait 60 seconds before requesting another code.",
    );
  const otp = String(randomInt(100000, 1000000));
  // Hash even for unknown accounts so both paths incur the same expensive work.
  const otpHash = passwordHash(otp);
  const generation = randomBytes(32).toString("hex");
  const user = await transaction(async (repo) => {
    let user: User | undefined = (await repo.find<User>("users", { email }))[0];
    if (!user) {
      const allUsers = await repo.find<User>("users");
      user = allUsers.find((u) => normalizeEmail(u.email) === email);
    }
    if (!user || (purpose === "verify" && user.verifiedAt)) return undefined;

    // Check if there was an active token to retain previous OTP hash on resend
    const existing = await repo.get<RecoveryCode>("tokens", codeId(email, purpose));
    const previousOtpHashes: string[] = [];
    if (existing && Date.parse(existing.expiresAt) > Date.now()) {
      if (existing.otpHash) previousOtpHashes.push(existing.otpHash);
      if (Array.isArray(existing.previousOtpHashes)) {
        previousOtpHashes.push(...existing.previousOtpHashes.slice(0, 2));
      }
    }

    for (const previous of await repo.find<{
      id: string;
      userId: string;
      purpose: string;
    }>("tokens", { userId: user.id })) {
      if (previous.purpose === purpose || previous.purpose === `${purpose}-otp`)
        await repo.remove("tokens", previous.id);
    }
    const expiresAt = new Date(Date.now() + 10 * 60_000);
    await repo.put<RecoveryCode>("tokens", {
      id: codeId(email, purpose),
      userId: user.id,
      purpose: `${purpose}-otp`,
      credentialHash: hash(user.passwordHash),
      otpHash,
      previousOtpHashes,
      attempts: 0,
      generation,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
      cleanupAt: expiresAt,
    });
    return user;
  });
  if (user) {
    try {
      // The plaintext code exists only in memory and the recipient's email.
      await sendAccountEmail({
        id: generation,
        to: email,
        subject: "Your OVIA verification code",
        text: `Your OVIA verification code is: ${otp}\n\nIt expires in 10 minutes.\n\nIf you didn't request this, ignore this email.`,
      });
    } catch (error) {
      await transaction(async (repo) => {
        await repo.remove("tokens", codeId(email, purpose));
      });
      throw error;
    }
  }
  return { message: recoveryMessage };
}

async function verifyCode(rawEmail: string, rawOtp: string, purpose: CodePurpose) {
  const email = normalizeEmail(rawEmail);
  const otp = rawOtp.trim();
  const tokenId = randomBytes(32).toString("hex");
  const outcome = await transaction(async (repo) => {
    let record = await repo.get<RecoveryCode>(
      "tokens",
      codeId(email, purpose),
    );
    // If not found under exact purpose, check if an active token exists under alternate purpose
    if (!record) {
      const altPurpose = purpose === "reset" ? "verify" : "reset";
      const altRecord = await repo.get<RecoveryCode>(
        "tokens",
        codeId(email, altPurpose),
      );
      if (altRecord && Date.parse(altRecord.expiresAt) > Date.now()) {
        record = altRecord;
      }
    }
    if (
      !record ||
      Date.parse(record.expiresAt) <= Date.now()
    ) {
      if (record) await repo.remove("tokens", record.id);
      return { error: "Invalid or expired code." };
    }
    const attempts = record.attempts + 1;
    if (record.attempts >= 5) {
      await repo.remove("tokens", record.id);
      return { error: "Too many attempts. Request a new code." };
    }
    let valid = checkPassword(otp, record.otpHash);
    if (!valid && Array.isArray(record.previousOtpHashes)) {
      for (const prevHash of record.previousOtpHashes) {
        if (checkPassword(otp, prevHash)) {
          valid = true;
          break;
        }
      }
    }
    if (!valid) {
      if (attempts >= 5) await repo.remove("tokens", record.id);
      else await repo.put("tokens", { ...record, attempts });
      return {
        error:
          attempts >= 5
            ? "Too many attempts. Request a new code."
            : `Invalid or expired code. ${5 - attempts} of 5 attempts remaining.`,
      };
    }
    const user = await repo.get<User>("users", record.userId);
    if (!user) {
      await repo.remove("tokens", record.id);
      return { error: "Invalid or expired code." };
    }
    if (purpose === "verify" || record.purpose === "verify-otp") {
      if (record.credentialHash && record.credentialHash !== hash(user.passwordHash)) {
        await repo.remove("tokens", record.id);
        return {
          error:
            "Invalid or expired code. Sign in again to request a new code.",
        };
      }
      const verified = {
        ...user,
        verifiedAt: user.verifiedAt || new Date().toISOString(),
      };
      await repo.put("users", verified);
      await repo.remove("tokens", record.id);
      return { user: verified };
    }
    const resetToken = await signPasswordResetToken(user.id, tokenId);
    const expiresAt = new Date(Date.now() + 15 * 60_000);
    await repo.remove("tokens", record.id);
    await repo.put("tokens", {
      id: hash(tokenId),
      userId: user.id,
      purpose: "reset",
      expiresAt: expiresAt.toISOString(),
      cleanupAt: expiresAt,
    });
    return { resetToken };
  });
  // Throw AFTER commit: bad attempts/deletions must not roll back.
  if (outcome.error) throw new ApiError(400, outcome.error);
  return outcome;
}

export function requestRecoveryCode(email: string) {
  return requestCode(email, "reset");
}
export function requestVerificationCode(
  email: string,
) {
  return requestCode(email, "verify");
}
export async function verifyRecoveryCode(email: string, otp: string) {
  const outcome = await verifyCode(email, otp, "reset");
  return { resetToken: outcome.resetToken! };
}
export async function verifyEmailCode(email: string, otp: string) {
  const outcome = await verifyCode(email, otp, "verify");
  return outcome.user!;
}
