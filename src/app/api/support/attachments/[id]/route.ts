import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/server/auth";
import { transaction } from "@/server/db";
import {
  canDownloadAttachment,
  type SupportAttachment,
} from "@/server/support-attachments";
export const runtime = "nodejs";
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const user = await currentUser();
  if (!user)
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const { id } = await ctx.params;
  const file = await transaction(async (repo) => {
    const f = await repo.get<SupportAttachment>("support_attachments", id);
    return f && (await canDownloadAttachment(repo, f, user)) ? f : null;
  });
  if (!file)
    return NextResponse.json(
      { error: "Attachment not found." },
      { status: 404 },
    );
  return new Response(Buffer.from(file.content, "base64"), {
    headers: {
      "Content-Type": file.mime,
      "Content-Disposition":
        'attachment; filename="' + file.name.replace(/["\r\n]/g, "_") + '"',
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
