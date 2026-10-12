import {
  timingSafeEqual,
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import { transaction } from "./db";
import { ApiError } from "./http";
export const supportMailbox = () =>
  process.env.SUPPORT_INBOX_EMAIL ||
  process.env.SUPPORT_REPLY_TO ||
  "adarshshukla4639@gmail.com";
export const googleClientId = () =>
  process.env.SUPPORT_GMAIL_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
export const googleClientSecret = () =>
  process.env.SUPPORT_GMAIL_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
function encryptionKey() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)
    throw new ApiError(
      503,
      "Configure a stable JWT_SECRET to encrypt Gmail authorization.",
    );
  return createHash("sha256")
    .update(process.env.JWT_SECRET + ":support-google-v1")
    .digest();
}
export function sealSupportSecret(value: string) {
  const iv = randomBytes(12),
    cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const data = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), data]).toString("base64url");
}
export function openSupportSecret(value: string) {
  const data = Buffer.from(value, "base64url"),
    cipher = createDecipheriv(
      "aes-256-gcm",
      encryptionKey(),
      data.subarray(0, 12),
    );
  cipher.setAuthTag(data.subarray(12, 28));
  return Buffer.concat([
    cipher.update(data.subarray(28)),
    cipher.final(),
  ]).toString("utf8");
}
export type GmailConnection = {
  id: string;
  email: string;
  refreshToken: string;
  historyId?: string;
  connectedAt: string;
};
export async function gmailConnection() {
  return transaction((repo) =>
    repo.get<GmailConnection>("support_connections", "gmail"),
  );
}
export async function gmailCredentials() {
  if (!googleClientId() || !googleClientSecret()) return null;
  const connection = process.env.SUPPORT_GMAIL_REFRESH_TOKEN
    ? undefined
    : await gmailConnection();
  const refreshToken = connection
    ? openSupportSecret(connection.refreshToken)
    : process.env.SUPPORT_GMAIL_REFRESH_TOKEN;
  if (!refreshToken || !googleClientId() || !googleClientSecret()) return null;
  return {
    refreshToken,
    mailbox:
      connection?.email || process.env.SUPPORT_INBOX_EMAIL || supportMailbox(),
    connection,
  };
}
export async function gmailAccessToken() {
  const credentials = await gmailCredentials();
  if (!credentials)
    throw new ApiError(503, "Connect your support Gmail account.");
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    body: new URLSearchParams({
      client_id: googleClientId()!,
      client_secret: googleClientSecret()!,
      refresh_token: credentials.refreshToken,
      grant_type: "refresh_token",
    }),
    signal: AbortSignal.timeout(10000),
  });
  const result = await response.json();
  if (!response.ok || !result.access_token)
    throw new ApiError(
      503,
      "Gmail authorization expired. Reconnect the support mailbox.",
    );
  return { accessToken: result.access_token as string, ...credentials };
}
export function validOAuthState(supplied: string, expected: string) {
  const a = Buffer.from(supplied),
    b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
