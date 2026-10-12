import type { MetadataRoute } from "next";
import { latestLinks } from "@/lib/new-collection";
import { stories } from "@/lib/journal";
import { products } from "@/lib/catalog";
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.APP_ORIGIN || "http://localhost:3000";
  return [
    "",
    "/luggage",
    "/bags",
    "/accessories",
    "/discover", "/heritage", "/help", "/faq", "/shipping", "/returns", "/privacy", "/terms", "/security", "/accessibility", "/cookies",
    "/storelocator",
    "/journal",
    ...latestLinks.map((item) => item.href),
    ...stories.map((story) => `/journal/${story.slug}`),
    ...products
      .filter((p: any) => p.indexing !== "noindex" && p.inSitemap !== false)
      .map((p) => `/products/${p.slug}`),
  ].map((path) => ({ url: `${base}${path}` }));
}
