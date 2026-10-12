import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { signOut } from "@/server/auth";

export const runtime = "nodejs";

export async function POST() {
  await signOut();
  const jar = await cookies();
  jar.delete("ovia_session");
  return NextResponse.json({ success: true });
}
