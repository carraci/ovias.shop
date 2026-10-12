import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/server/auth";
import { transaction } from "@/server/db";
import { originCheck, ApiError, limit } from "@/server/http";
import { saveSupportAttachment } from "@/server/support-attachments";
export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  try {
    originCheck(req);
    const user = await currentUser();
    if (!user) throw new ApiError(401, "Please sign in to attach a file.");
    await limit(req, "support-upload-" + user.id, 10);
    if (
      Number(req.headers.get("content-length") || 0) >
      4 * 1024 * 1024 + 65536
    )
      throw new ApiError(413, "Attachment is too large.");
    const reader = req.body?.getReader();
    if (!reader) throw new ApiError(400, "Choose a file.");
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 4 * 1024 * 1024 + 65536) {
        await reader.cancel();
        throw new ApiError(413, "Attachment is too large.");
      }
      chunks.push(value);
    }
    const form = await new Response(Buffer.concat(chunks), {
      headers: { "Content-Type": req.headers.get("content-type") || "" },
    }).formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new ApiError(400, "Choose a file.");
    const data = Buffer.from(await file.arrayBuffer());
    const result = await transaction((repo) =>
      saveSupportAttachment(repo, user.id, file.name, file.type, data),
    );
    return NextResponse.json({ success: true, attachment: result });
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof ApiError ? e.message : "Unable to upload attachment.",
      },
      { status: e instanceof ApiError ? e.status : 400 },
    );
  }
}
