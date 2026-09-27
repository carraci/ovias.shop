import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { api, body, originCheck } from "@/server/http";
import { currencies, markets } from "@/lib/markets";
export async function POST(req: NextRequest) {
  return api(async () => {
    originCheck(req);
    const input = z
      .object({
        country: z.string().refine((v) => markets.some((m) => m.code === v)),
        currency: z.enum(currencies),
        locale: z.literal("en-IN"),
        remember: z.boolean(),
      })
      .strict()
      .parse(await body(req));
    const jar = await cookies();
    if (input.remember)
      jar.set(
        "ovia_preferences",
        JSON.stringify({
          country: input.country,
          currency: input.currency,
          locale: input.locale,
        }),
        {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 180 * 86400,
        },
      );
    else jar.delete("ovia_preferences");
    return { ok: true };
  });
}
