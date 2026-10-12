import { NextRequest } from "next/server";
import { z } from "zod";
import { currentUser } from "@/server/auth";
import { api, ApiError, body, originCheck, limit } from "@/server/http";
import { transaction } from "@/server/db";
const input = z
  .object({
    email: z
      .email()
      .max(254)
      .transform((value) => value.trim().toLowerCase()),
  })
  .strict();
export async function POST(req: NextRequest) {
  return api(async () => {
    originCheck(req);
    const user = await currentUser();
    if (!user) throw new ApiError(401, "Please sign in.");
    await limit(req, `newsletter-${user.id}`, 6);
    const { email } = input.parse(await body(req));
    await transaction(async (repo) => {
      await repo.put("newsletter_subscribers", {
        id: user.id,
        userId: user.id,
        email,
        consent: true,
        source: "account-profile",
        updatedAt: new Date().toISOString(),
      });
    });
    return { saved: true };
  });
}
