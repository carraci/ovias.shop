import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminApi } from "@/server/admin-auth";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const auth = await authorizeAdminApi(req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    const allowed: Record<string,string> = {"image/jpeg":".jpg","image/png":".png","image/webp":".webp","video/mp4":".mp4","video/webm":".webm"};
    if(!allowed[file.type]) return NextResponse.json({error:"Use JPG, PNG, WebP, MP4 or WebM media."},{status:400});
    const limit=file.type.startsWith("video/") ? 100*1024*1024 : 5*1024*1024;
    if(file.size>limit)return NextResponse.json({error:"Images must be under 5MB and videos under 100MB."},{status:400});
    const buffer = Buffer.from(await file.arrayBuffer());
    const originalExt = allowed[file.type];
    const cleanExt = originalExt.replace(/[^a-zA-Z0-9.]/g, "").slice(0, 6) || ".png";
    const filename = `luxury-${Date.now()}-${randomUUID().slice(0, 6)}${cleanExt}`;

    const uploadsDir = path.join(process.cwd(), "public", "media", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    const filePath = path.join(uploadsDir, filename);
    await writeFile(filePath, buffer);

    const publicUrl = `/media/uploads/${filename}`;
    return NextResponse.json({ success: true, url: publicUrl });
  } catch (err: any) {
    console.error("[Upload API Error]", err);
    return NextResponse.json(
      { error: err.message || "Failed to upload image." },
      { status: 500 }
    );
  }
}
