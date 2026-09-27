import { NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { currentUser } from "@/server/auth";
import { api, ApiError, body, originCheck } from "@/server/http";
import { transaction } from "@/server/db";
import { addressSchema } from "@/server/commerce";
import type { Address } from "@/lib/types";
type Saved = Address & { id: string; userId: string };
type Context = { params: Promise<{ id?: string[] }> };
async function user() {
  const u = await currentUser();
  if (!u) throw new ApiError(401, "Please sign in.");
  return u;
}
export function GET() {
  return api(async () => {
    const u = await user();
    return transaction((repo) =>
      repo.find<Saved>("addresses", { userId: u.id }),
    );
  });
}
export function POST(req: NextRequest) {
  return api(async () => {
    originCheck(req);
    const u = await user();
    const input = addressSchema.parse(await body(req));
    return transaction(async (repo) => {
      if ((await repo.find<Saved>("addresses", { userId: u.id })).length >= 10)
        throw new ApiError(409, "You can save up to 10 addresses.");
      const record = { ...input, id: randomUUID(), userId: u.id };
      await repo.put("addresses", record);
      return record;
    });
  }, 201);
}
export function PATCH(req: NextRequest, ctx: Context) {
  return api(async () => {
    originCheck(req);
    const u = await user();
    const id = (await ctx.params).id?.[0];
    const input = addressSchema.parse(await body(req));
    return transaction(async (repo) => {
      const existing = await repo.get<Saved>("addresses", id || "");
      if (!existing || existing.userId !== u.id)
        throw new ApiError(404, "Address not found.");
      const record = { ...input, id: existing.id, userId: u.id };
      await repo.put("addresses", record);
      return record;
    });
  });
}
export function DELETE(req: NextRequest, ctx: Context) {
  return api(async () => {
    originCheck(req);
    const u = await user();
    const id = (await ctx.params).id?.[0];
    return transaction(async (repo) => {
      const existing = await repo.get<Saved>("addresses", id || "");
      if (!existing || existing.userId !== u.id)
        throw new ApiError(404, "Address not found.");
      await repo.remove("addresses", existing.id);
      return { deleted: true };
    });
  });
}
