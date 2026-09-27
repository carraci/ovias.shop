import { NextRequest } from "next/server";
import { z } from "zod";
import { getStoryBySlug, updateStory, deleteStory } from "@/server/stories";
import { api, ApiError, body, originCheck } from "@/server/http";

export const runtime = "nodejs";

type Context = { params: Promise<{ slug: string }> };

const contentBlockSchema = z.object({
  id: z.string(),
  type: z.enum(["paragraph", "heading", "quote", "image", "callout"]),
  text: z.string().optional(),
  image: z.string().optional(),
  caption: z.string().optional(),
  author: z.string().optional(),
});

const storyUpdateSchema = z.object({
  title: z.string().trim().min(3).max(200).optional(),
  slug: z
    .string()
    .trim()
    .min(3)
    .max(100)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  category: z.string().trim().min(2).max(60).optional(),
  excerpt: z.string().trim().min(10).max(600).optional(),
  heroImage: z.string().trim().min(1).optional(),
  thumbnail: z.string().trim().min(1).optional(),
  author: z.string().trim().optional(),
  readingTime: z.string().trim().optional(),
  status: z.enum(["published", "draft"]).optional(),
  featured: z.boolean().optional(),
  publishedAt: z.string().optional(),
  relatedProducts: z.array(z.string()).optional(),
  gallery: z.array(z.string()).optional(),
  contentBlocks: z.array(contentBlockSchema).optional(),
});

export async function GET(req: NextRequest, ctx: Context) {
  return api(async () => {
    const { slug } = await ctx.params;
    const story = await getStoryBySlug(slug);
    if (!story) {
      throw new ApiError(404, "Story not found.");
    }
    return story;
  });
}

export async function PUT(req: NextRequest, ctx: Context) {
  return api(async () => {
    originCheck(req);
    const { slug } = await ctx.params;
    const updates = storyUpdateSchema.parse(await body(req));
    try {
      const updated = await updateStory(slug, updates);
      return updated;
    } catch (err: any) {
      throw new ApiError(400, err.message || "Failed to update story.");
    }
  });
}

export async function PATCH(req: NextRequest, ctx: Context) {
  return PUT(req, ctx);
}

export async function DELETE(req: NextRequest, ctx: Context) {
  return api(async () => {
    originCheck(req);
    const { slug } = await ctx.params;
    try {
      await deleteStory(slug);
      return { success: true, message: "Story deleted successfully." };
    } catch (err: any) {
      throw new ApiError(404, err.message || "Failed to delete story.");
    }
  });
}
