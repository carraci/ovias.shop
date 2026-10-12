import { transaction } from "./db";
import { ApiError } from "./http";
import { receiveEmail } from "./support-inbox";
import {
  gmailAccessToken,
  gmailCredentials,
  googleClientId,
  googleClientSecret,
} from "./support-google-auth";
import { saveSupportAttachment } from "./support-attachments";
type Part = {
  mimeType?: string;
  filename?: string;
  body?: { data?: string; attachmentId?: string; size?: number };
  parts?: Part[];
};
export function gmailText(part: Part): string {
  if (part.filename) return "";
  if (part.mimeType === "text/plain" && part.body?.data)
    return Buffer.from(part.body.data, "base64url").toString("utf8");
  return (part.parts || []).map(gmailText).filter(Boolean).join("\n");
}
export function gmailConfigured() {
  return !!(googleClientId() && googleClientSecret());
}
let lastSync = 0;
let running: Promise<void> | undefined;
export async function syncGmailInbox(force = false) {
  if (!gmailConfigured())
    return {
      connected: false,
      message:
        "Connect your support Gmail account to synchronize customer email replies.",
    };
  const credentials = await gmailCredentials();
  if (!credentials)
    return {
      connected: false,
      message:
        "Gmail authorization is required. Website messages and outgoing email continue to work.",
    };
  if (!force && lastSync > Date.now() - 4000)
    return { connected: true, email: credentials.mailbox, message: "Gmail inbox synchronized." };
  if (!running)
    running = sync()
      .then(() => {
        lastSync = Date.now();
      })
      .finally(() => {
        running = undefined;
      });
  await running;
  return { connected: true, email: credentials.mailbox, message: "Gmail inbox synchronized." };
}
function addresses(header: string) {
  return [
    ...header.matchAll(
      /[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    ),
  ].map((m) => m[0].toLowerCase());
}

export function gmailHeaderValue(value: string) {
  return value
    .replace(/(\?=)\s+(=\?)/g, "$1$2")
    .replace(
      /=\?([^?]+)\?([bq])\?([^?]*)\?=/gi,
      (_whole, charset, encoding, data) => {
        try {
          const bytes =
            encoding.toLowerCase() === "b"
              ? Buffer.from(data, "base64")
              : Buffer.from(
                  data
                    .replace(/_/g, " ")
                    .replace(/=([a-f0-9]{2})/gi, (_m: string, hex: string) =>
                      String.fromCharCode(parseInt(hex, 16)),
                    ),
                  "latin1",
                );
          return new TextDecoder(charset).decode(bytes);
        } catch {
          return _whole;
        }
      },
    );
}
export function gmailSenderAddress(from: string) {
  const angleMatches = [...from.matchAll(/<([^>]+)>/g)];
  return angleMatches.length
    ? angleMatches.at(-1)![1].trim().toLowerCase()
    : addresses(from)[0];
}

async function sync() {
  const { accessToken, mailbox, connection } = await gmailAccessToken();
  async function get(path: string) {
    const response = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/" + path,
      {
        headers: { Authorization: "Bearer " + accessToken },
        signal: AbortSignal.timeout(10000),
        cache: "no-store",
      },
    );
    if (!response.ok)
      throw new ApiError(
        response.status === 404 ? 404 : 503,
        "Gmail could not be synchronized.",
      );
    return response.json();
  }
  const profile = await get("profile");
  if (typeof profile.emailAddress !== "string" ||
      profile.emailAddress.toLowerCase().trim() !== mailbox.toLowerCase().trim())
    throw new ApiError(503, "The connected Gmail account does not match the support mailbox.");
  const ids = new Set<string>();
  if (connection?.historyId) {
    let pageToken = "";
    try {
      do {
        const listing = await get(
          "history?" +
            new URLSearchParams({
              startHistoryId: connection.historyId,
              historyTypes: "messageAdded",
              ...(pageToken ? { pageToken } : {}),
            }),
        );
        for (const h of listing.history || [])
          for (const item of h.messagesAdded || []) ids.add(item.message.id);
        pageToken = listing.nextPageToken || "";
      } while (pageToken);
    } catch (e) {
      if (!(e instanceof ApiError) || e.status !== 404) throw e;
      const listing = await get("messages?labelIds=INBOX&maxResults=100");
      for (const item of listing.messages || []) ids.add(item.id);
    }
  } else {
    const listing = await get("messages?labelIds=INBOX&maxResults=50");
    for (const item of listing.messages || []) ids.add(item.id);
  }
  for (const id of ids) {
    const receiptId = "gmail:" + id;
    const { createHash } = await import("node:crypto");
    const receiptHash =
      "email-" +
      createHash("sha256")
        .update(mailbox.toLowerCase() + ":" + receiptId)
        .digest("hex");
    if (
      await transaction((repo) =>
        repo.get("support_email_receipts", receiptHash),
      )
    )
      continue;
    const message = await get(
      "messages/" + encodeURIComponent(id) + "?format=full",
    );
    if (!message.labelIds?.includes("INBOX")) continue;
    const headers = message.payload?.headers || [];
    const header = (name: string) =>
      headers
        .filter(
          (h: { name: string }) => h.name.toLowerCase() === name.toLowerCase(),
        )
        .map((h: { value: string }) => h.value)
        .join(", ");
    const from = gmailHeaderValue(header("From")),
      sender = gmailSenderAddress(from);
    if (!sender) continue;
    if (
      sender === mailbox.toLowerCase() ||
      header("Subject").startsWith("OVIA customer message:")
    )
      continue;
    const text = gmailText(message.payload || {});
    const files: string[] = [];
    async function attachments(part: Part) {
      if (
        part.filename &&
        part.body &&
        (part.body.data || part.body.attachmentId) &&
        files.length < 5 &&
        (part.body.size || 0) <= 4 * 1024 * 1024
      ) {
        try {
          const data =
            part.body.data ||
            (
              await get(
                "messages/" +
                  encodeURIComponent(id) +
                  "/attachments/" +
                  encodeURIComponent(part.body.attachmentId!),
              )
            ).data;
          const result = await transaction((repo) =>
            saveSupportAttachment(
              repo,
              "gmail",
              part.filename!,
              part.mimeType || "",
              Buffer.from(data, "base64url"),
            ),
          );
          files.push(result.id);
        } catch (e) {
          if (!(e instanceof ApiError) && !(e instanceof TypeError)) throw e;
        }
      }
      for (const child of part.parts || []) await attachments(child);
    }
    await attachments(message.payload || {});
    const authentication: string =
      headers.find(
        (h: { name: string; value: string }) =>
          h.name.toLowerCase() === "authentication-results" &&
          /^mx\.google\.com\s*;/i.test(h.value.trim()),
      )?.value || "";
    await transaction(async (repo) => {
      const ticket = await receiveEmail(
        repo,
        {
          messageId: receiptId,
          threadId: message.threadId,
          from: sender,
          to: mailbox,
          name: from
            .replace(/<[^>]*>/g, "")
            .replace(/^"|"$/g, "")
            .trim(),
          subject: (
            gmailHeaderValue(header("Subject")) || "(No subject)"
          ).slice(0, 200),
          text: (
            text ||
            "This email has no plain-text body. Open Gmail to view its original formatting."
          ).slice(0, 10000),
          cc: addresses(header("Cc")).filter(
            (v) => v !== mailbox.toLowerCase(),
          ),
          attachments: files,
          verifiedSender:
            /dmarc=pass\b/i.test(authentication) &&
            Array.from(
              authentication.matchAll(/header\.from=([a-z0-9.-]+)/gi),
            ).some(
              (match) => match[1].toLowerCase() === sender.split("@").at(-1),
            ),
        },
        mailbox,
      );
      const ticketId = ticket.id.includes(":")
        ? ticket.id
        : "support_tickets:" + ticket.id;
      // locate the canonical receipt because matched website tickets keep their original collection.
      const receipt = await repo.get<{ id: string; ticketId: string }>(
        "support_email_receipts",
        receiptHash,
      );
      const { validateAttachmentLinks } = await import("./support-attachments");
      await validateAttachmentLinks(
        repo,
        files,
        receipt?.ticketId || ticketId,
        undefined,
        true,
      );
    });
  }
  if (connection)
    await transaction((repo) =>
      repo.put("support_connections", {
        ...connection,
        historyId: String(profile.historyId),
      }),
    );
}
