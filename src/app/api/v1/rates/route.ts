import { NextResponse } from "next/server";
import { currencies, type Rate } from "@/lib/markets";
const cache = globalThis as typeof globalThis & {
  oviaRates?: { until: number; rates: Rate[]; key: string };
  oviaRatesPending?: Promise<Rate[]>;
};
export async function GET() {
  try {
    if (!cache.oviaRates || cache.oviaRates.until < Date.now() || cache.oviaRates.key !== currencies.join(",")) {
      cache.oviaRatesPending ??= (async () => {
        const res = await fetch(
          `https://api.frankfurter.dev/v2/rates?base=INR&quotes=${currencies.filter(c => c !== "INR").join(",")}`,
          { signal: AbortSignal.timeout(8000), cache: "no-store" },
        );
        if (!res.ok) throw new Error("Provider unavailable");
        const rows: unknown = await res.json();
        if (!Array.isArray(rows)) throw new Error("Invalid rates");
        const rates: Rate[] = rows
          .filter(
            (r) =>
              r &&
              typeof r === "object" &&
              r.base === "INR" &&
              currencies.includes(r.quote) &&
              typeof r.rate === "number" &&
              Number.isFinite(r.rate) &&
              r.rate > 0 &&
              typeof r.date === "string" &&
              /^\d{4}-\d{2}-\d{2}$/.test(r.date) &&
              Date.now() - Date.parse(r.date) < 7 * 86400000 &&
              Date.parse(r.date) <= Date.now() + 86400000,
          )
          .map((r) => ({ currency: r.quote, rate: r.rate, date: r.date }));
        cache.oviaRates = { until: Date.now() + 3600000, rates, key:currencies.join(",") };
        return rates;
      })();
      try {
        await cache.oviaRatesPending;
      } finally {
        cache.oviaRatesPending = undefined;
      }
    }
    return NextResponse.json(
      {
        data: {
          rates: cache.oviaRates!.rates,
          provider: "Frankfurter",
          approximate: true,
        },
      },
      { headers: { "Cache-Control": "public, max-age=300" } },
    );
  } catch {
    return NextResponse.json(
      { data: { rates: [], provider: "unavailable", approximate: true } },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
}
