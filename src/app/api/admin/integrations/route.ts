import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminApi } from "@/server/admin-auth";
import {
  getAdminIntegrations,
  testAdminIntegration,
  updateAdminIntegration,
  disconnectAdminIntegration,
} from "@/server/admin-service";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await authorizeAdminApi(req);
  if (!auth.authorized) {
    return auth.response;
  }

  const integrations = await getAdminIntegrations();
  return NextResponse.json({ success: true, integrations });
}

export async function POST(req: NextRequest) {
  const auth = await authorizeAdminApi(req);
  if (!auth.authorized) {
    return auth.response;
  }

  const body = await req.json();
  const { id } = body;
  if (!id) {
    return NextResponse.json({ success: false, error: "Missing integration id." }, { status: 400 });
  }

  const result = await testAdminIntegration(id, auth.user.email);
  return NextResponse.json({
    success: result.success,
    status: result.status,
    verified: result.success,
    message: result.message,
    latencyMs: result.latencyMs,
    testedAt: result.testedAt,
  });
}

export async function PATCH(req: NextRequest) {
  const auth = await authorizeAdminApi(req);
  if (!auth.authorized) {
    return auth.response;
  }

  const body = await req.json();
  const { id, config } = body;
  if (!id) {
    return NextResponse.json({ success: false, error: "Missing integration id." }, { status: 400 });
  }

  const updated = await updateAdminIntegration(id, config || {}, auth.user.email);
  return NextResponse.json({
    success: true,
    integration: updated,
    message: "Integration configuration saved securely.",
  });
}

export async function DELETE(req: NextRequest) {
  const auth = await authorizeAdminApi(req);
  if (!auth.authorized) {
    return auth.response;
  }

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ success: false, error: "Missing integration id." }, { status: 400 });
  }

  const result = await disconnectAdminIntegration(id, auth.user.email);
  return NextResponse.json(result);
}
