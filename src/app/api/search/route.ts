import { NextRequest, NextResponse } from "next/server";
import { searchAlgoliaProducts } from "@/lib/algolia";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q") || req.nextUrl.searchParams.get("query") || "";
  const limit = Number(req.nextUrl.searchParams.get("limit") || 8);
  const page = Number(req.nextUrl.searchParams.get("page") || 0);
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const result = await Promise.race([
      searchAlgoliaProducts(query, {
        hitsPerPage: Number.isFinite(limit) ? Math.max(1, Math.min(100, Math.floor(limit))) : 8,
        page: Number.isFinite(page) ? Math.max(0, Math.floor(page)) : 0,
      }),
      new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error("Search timeout")), 10000); }),
    ]);
    return NextResponse.json({ query, ...result }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Catalog search is temporarily unavailable. Please try again." }, { status: 503 });
  } finally { if (timer) clearTimeout(timer); }
}
