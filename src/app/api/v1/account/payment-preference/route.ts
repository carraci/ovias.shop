import { NextRequest } from "next/server";
import { z } from "zod";
import { currentUser } from "@/server/auth";
import { transaction } from "@/server/db";
import { api, ApiError, originCheck, body, limit } from "@/server/http";
import type { User } from "@/lib/types";
type PaymentUser = User & {
  preferredPaymentMethod?: "card" | "upi" | "netbanking";
};
export async function GET() {
  return api(async () => {
    const user = await currentUser();
    if (!user) throw new ApiError(401, "Please sign in.");
    return transaction(async (repo) => ({
      method:
        (await repo.get<PaymentUser>("users", user.id))
          ?.preferredPaymentMethod || "",
    }));
  });
}
export async function PATCH(req: NextRequest) {
  return api(async () => {
    originCheck(req);
    const user = await currentUser();
    if (!user) throw new ApiError(401, "Please sign in.");
    await limit(req, `payment-preference-${user.id}`, 12);
    const { method } = z
      .object({ method: z.enum(["card", "upi", "netbanking"]) })
      .strict()
      .parse(await body(req));
    return transaction(async (repo) => {
      const stored = await repo.get<PaymentUser>("users", user.id);
      if (!stored) throw new ApiError(404, "Account not found.");
      await repo.put("users", { ...stored, preferredPaymentMethod: method });
      return { method };
    });
  });
}
