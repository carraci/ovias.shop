import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminApi } from "@/server/admin-auth";
import { getAdminSettings, updateAdminSettings } from "@/server/admin-service";

export async function GET(request: NextRequest) {
  const auth = await authorizeAdminApi(request);
  if (!auth.authorized) {
    return auth.response;
  }

  const data = await getAdminSettings();
  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest) {
  const auth = await authorizeAdminApi(request);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const body = await request.json();
    const result = await updateAdminSettings(body, auth.user!.email);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update settings" }, { status: 400 });
  }
}
