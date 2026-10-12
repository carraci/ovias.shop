import { NextRequest, NextResponse } from "next/server";
import { authenticateOwnerLogin } from "@/server/admin-auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;
    // Authenticate and set HttpOnly session cookie
    const result = await authenticateOwnerLogin(email, password);

    return NextResponse.json({
      success: true,
      user: result,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to authenticate as owner." },
      { status: 401 }
    );
  }
}
