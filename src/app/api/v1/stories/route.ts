import { NextRequest } from "next/server";
import { z } from "zod";
import { getStories, createStory } from "@/server/stories";
import { api, ApiError, body, originCheck } from "@/server/http";

export const runtime = "nodejs";

const contentBlockSchema = z.object({
  id: z.string(),
  type: z.enum(["paragraph", "heading", "quote", "image", "callout"]),
  text: z.string().optional(),
  image: z.string().optional(),
  caption: z.string().optional(),
  author: z.string().optional(),
});

const storyCreateSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(200),
  slug: z
    .string()
    .trim()
    .min(3, "Slug must be at least 3 characters")
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  category: z.string().trim().min(2).max(60),
  excerpt: z.string().trim().min(10).max(600),
  heroImage: z.string().trim().min(1),
  thumbnail: z.string().trim().min(1),
  author: z.string().trim().optional(),
  readingTime: z.string().trim().optional(),
  status: z.enum(["published", "draft"]).default("published"),
  featured: z.boolean().default(false),
  publishedAt: z.string().optional(),
  relatedProducts: z.array(z.string()).default([]),
  gallery: z.array(z.string()).default([]),
  contentBlocks: z.array(contentBlockSchema).default([]),
});

export async function GET(req: NextRequest) {
  return api(async () => {
    const url = new URL(req.url);
    const statusParam = url.searchParams.get("status");
    const status = statusParam === "draft" || statusParam === "all" ? statusParam : "published";
    const featuredOnly = url.searchParams.get("featured") === "true";

    const stories = await getStories({
      status: status as "published" | "draft" | "all",
      featuredOnly,
    });

    return { stories, total: stories.length };
  });
}

export async function POST(req: NextRequest) {
  return api(async () => {
    originCheck(req);
    const data = storyCreateSchema.parse(await body(req));
    try {
      const created = await createStory(data);
      return created;
    } catch (err: any) {
      throw new ApiError(400, err.message || "Failed to create story.");
    }
  }, 201);
}
