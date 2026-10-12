import { NextRequest } from "next/server";
import { z } from "zod";
import { currentUser } from "@/server/auth";
import { transaction } from "@/server/db";
import { recordAccountActivity } from "@/server/account-activity";
import { api, ApiError, originCheck, body, limit } from "@/server/http";
import type { AccountActivity } from "@/lib/account-activity";
import type { Order } from "@/lib/types";
import type { CareTicket } from "@/lib/care";
export async function GET() {
  return api(async () => {
    const user = await currentUser(); if (!user) throw new ApiError(401, "Please sign in.");
    return transaction(async (repo) => {
      const [orders, tickets] = await Promise.all([repo.find<Order>("orders", {userId:user.id}), repo.find<CareTicket>("tickets", {userId:user.id})]);
      for (const order of orders) await recordAccountActivity(repo, "orders", order);
      for (const ticket of tickets) await recordAccountActivity(repo, "tickets", ticket);
      return (await repo.find<AccountActivity>("account_notifications", {userId:user.id})).sort((a,b) => Date.parse(b.createdAt)-Date.parse(a.createdAt));
    });
  });
}
export async function PATCH(req: NextRequest) {
  return api(async () => {
    originCheck(req); const user = await currentUser(); if (!user) throw new ApiError(401, "Please sign in.");
    await limit(req, `activity-read-${user.id}`, 120);
    const input = z.object({ids:z.array(z.string().regex(/^[a-f0-9]{64}$/)).max(500)}).strict().parse(await body(req));
    return transaction(async repo => {
      const readAt = new Date().toISOString();
      for (const id of input.ids) {
        const record = await repo.get<AccountActivity>("account_notifications", id);
        if (!record || record.userId !== user.id) throw new ApiError(404, "Notification not found.");
        if (!record.readAt) await repo.put("account_notifications", {...record,readAt});
      }
      return {readAt};
    });
  });
}
