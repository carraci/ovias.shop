import type { NextRequest } from "next/server";
import { currentUser } from "@/server/auth";
import { api, ApiError, body, limit, originCheck } from "@/server/http";
import {
  readAccountProfile,
  saveAccountProfile,
} from "@/server/account-profile";

export const runtime = "nodejs";

async function userId() {
  const user = await currentUser();
  if (!user) throw new ApiError(401, "Please sign in.");
  return user.id;
}

export function GET() {
  return api(async () => readAccountProfile(await userId()));
}

export function PATCH(req: NextRequest) {
  return api(async () => {
    originCheck(req);
    const id = await userId();
    await limit(req, `account-profile-${id}`, 12);
    return saveAccountProfile(id, await body(req));
  });
}
