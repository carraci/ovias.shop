import type { NextRequest } from "next/server";
import { currentUser } from "@/server/auth";
import { api, ApiError, body, limit, originCheck } from "@/server/http";
import { changeAccountWishlist, readAccountWishlist } from "@/server/account-wishlist";

export const runtime = "nodejs";

async function viewer() {
  const user = await currentUser();
  if (!user) throw new ApiError(401, "Please sign in.");
  return user;
}

export function GET() {
  return api(async () => readAccountWishlist((await viewer()).id));
}

export function POST(req: NextRequest) {
  return api(async () => {
    originCheck(req);
    const user = await viewer();
    await limit(req, "account-wishlist-save-" + user.id, 60);
    return changeAccountWishlist(user.id, await body(req), "save");
  });
}

export function DELETE(req: NextRequest) {
  return api(async () => {
    originCheck(req);
    const user = await viewer();
    await limit(req, "account-wishlist-remove-" + user.id, 60);
    return changeAccountWishlist(user.id, await body(req), "remove");
  });
}
