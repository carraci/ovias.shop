import { randomUUID } from "node:crypto";
import type { Repository } from "./db";
import { ApiError } from "./http";
export type SupportAttachment = {
  id: string;
  name: string;
  mime: string;
  size: number;
  content: string;
  ownerId: string;
  ticketIds: string[];
  createdAt: string;
};
const allowed = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "text/plain",
]);
export function checkSupportFile(name: string, mime: string, data: Buffer) {
  if (!data.length || data.length > 4 * 1024 * 1024)
    throw new ApiError(413, "Each attachment must be between 1 byte and 4 MB.");
  if (!allowed.has(mime))
    throw new ApiError(400, "Use a PDF, PNG, JPEG, WebP, or plain text file.");
  const valid =
    mime === "application/pdf"
      ? data.subarray(0, 5).toString() === "%PDF-"
      : mime === "image/png"
        ? data
            .subarray(0, 8)
            .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
        : mime === "image/jpeg"
          ? data[0] === 255 && data[1] === 216 && data[2] === 255
          : mime === "image/webp"
            ? data.subarray(0, 4).toString() === "RIFF" &&
              data.subarray(8, 12).toString() === "WEBP"
            : !data.includes(0);
  if (!valid)
    throw new ApiError(
      400,
      "The file contents do not match the selected file type.",
    );
  return name.replace(/[^a-zA-Z0-9._ -]/g, "_").slice(0, 150) || "attachment";
}
export async function saveSupportAttachment(
  repo: Repository,
  ownerId: string,
  name: string,
  mime: string,
  data: Buffer,
) {
  const safeName = checkSupportFile(name, mime, data);
  const file: SupportAttachment = {
    id: randomUUID(),
    ownerId,
    name: safeName,
    mime,
    size: data.length,
    content: data.toString("base64"),
    ticketIds: [],
    createdAt: new Date().toISOString(),
  };
  await repo.put("support_attachments", file);
  return {
    id: file.id,
    name: file.name,
    size: file.size,
    url: "/api/support/attachments/" + file.id,
  };
}
export async function validateAttachmentLinks(
  repo: Repository,
  ids: string[],
  ticketId: string,
  ownerId?: string,
  admin = false,
) {
  const files = await Promise.all(
    ids.map((id) => repo.get<SupportAttachment>("support_attachments", id)),
  );
  if (
    files.some(
      (f) =>
        !f ||
        (!admin && f.ownerId !== ownerId && !f.ticketIds.includes(ticketId)),
    )
  )
    throw new ApiError(
      403,
      "An attachment is unavailable or belongs to another customer.",
    );
  for (const f of files)
    if (f)
      await repo.put("support_attachments", {
        ...f,
        ticketIds: [...new Set([...f.ticketIds, ticketId])],
      });
}
export async function canDownloadAttachment(
  repo: Repository,
  file: SupportAttachment,
  user: { id: string; email: string; verifiedAt?: string; role?: string },
) {
  if (
    ["OWNER", "ADMIN"].includes((user.role || "").toUpperCase()) ||
    file.ownerId === user.id
  )
    return true;
  for (const id of file.ticketIds) {
    const [collection, ...parts] = id.split(":");
    const t = await repo.get<{
      id: string;
      userId?: string;
      email?: string;
      customerEmail?: string;
    }>(collection, parts.join(":"));
    if (
      t &&
      (t.userId === user.id ||
        (!!user.verifiedAt &&
          (t.customerEmail || t.email)?.toLowerCase() ===
            user.email.toLowerCase()))
    )
      return true;
  }
  return false;
}
export async function mailAttachments(ids: string[]) {
  const { transaction } = await import("./db");
  return transaction(async (repo) => {
    const files = await Promise.all(
      ids.map((id) => repo.get<SupportAttachment>("support_attachments", id)),
    );
    if (files.some((f) => !f))
      throw new ApiError(400, "An email attachment is missing.");
    return files.map((f) => ({ filename: f!.name, content: f!.content }));
  });
}
