import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminApi, recordAuditEvent } from "@/server/admin-auth";
import { revalidatePath } from "next/cache";
import {
  getStories,
  createStory,
  updateStory,
  deleteStory,
  getStoryBySlug,
} from "@/server/stories";
import { transaction } from "@/server/db";
import type { Story, ContentBlock } from "@/lib/types";

export const runtime = "nodejs";

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

function calculateReadingTime(text: string): string {
  const words = text ? text.trim().split(/\s+/).length : 0;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

function parseContentToBlocks(htmlOrText: string): ContentBlock[] {
  if (!htmlOrText || !htmlOrText.trim()) return [];

  // Split by double newlines or HTML paragraph tags
  const clean = htmlOrText
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<p[^>]*>/gi, "")
    .replace(/<br\s*[\/]?>/gi, "\n");

  const lines = clean
    .split(/\n\n+/)
    .map((l) => l.trim())
    .filter(Boolean);

  return lines.map((line, idx) => {
    if (line.startsWith("# ") || line.startsWith("## ") || line.startsWith("<h3>")) {
      return {
        id: `block-${idx}-${Date.now()}`,
        type: "heading" as const,
        text: line.replace(/^#+\s*/, "").replace(/<\/?h[1-6]>/gi, ""),
      };
    }
    if (line.startsWith("> ") || line.startsWith("<blockquote>")) {
      return {
        id: `block-${idx}-${Date.now()}`,
        type: "quote" as const,
        text: line.replace(/^>\s*/, "").replace(/<\/?blockquote>/gi, ""),
      };
    }
    return {
      id: `block-${idx}-${Date.now()}`,
      type: "paragraph" as const,
      text: line.replace(/<[^>]+>/g, ""),
    };
  });
}

function mapStoryToAdminBlog(story: Story) {
  const statusFormatted =
    story.status === "published"
      ? "Published"
      : story.status === "scheduled"
      ? "Scheduled"
      : "Draft";

  const dateFormatted = new Date(story.publishedAt || story.createdAt).toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric", year: "numeric" }
  );

  return {
    id: story.id,
    title: story.title,
    slug: story.slug,
    category: story.category || "Travel",
    date: dateFormatted,
    status: statusFormatted as "Published" | "Draft" | "Scheduled",
    image: story.heroImage || story.thumbnail || "/media/case-flowers.jpg",
    excerpt: story.excerpt || "",
    content:
      story.content ||
      (story.contentBlocks && story.contentBlocks.length > 0
        ? story.contentBlocks.map((b) => b.text || "").filter(Boolean).join("\n\n")
        : story.excerpt || ""),
    author: story.author || "Adarsh Shukla",
    publishDate: story.publishedAt || new Date().toISOString(),
    featured: Boolean(story.featured),
    seoTitle: story.seoTitle || `${story.title} | OVIA Journal`,
    seoDescription: story.seoDescription || story.excerpt || "",
    focusKeyword: story.focusKeyword || "",
    canonicalUrl:
      story.canonicalUrl || `https://ovias.shop/journal/${story.slug}`,
    indexing: story.indexing || "Index (Allow search engines)",
    followLinks: story.followLinks || "Follow (Allow link following)",
    tags: story.tags || [story.category || "Travel"],
    relatedProducts: story.relatedProducts || [],
  };
}

export async function GET(req: NextRequest) {
  const auth = await authorizeAdminApi(req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const stories = await getStories({ status: "all" });
    const blogs = stories.map(mapStoryToAdminBlog);

    // Retrieve events from DB repository
    let events: any[] = [];
    try {
      events = await transaction(async (repo) => {
        const list = await repo.find("events");
        return list || [];
      });
    } catch {
      events = [];
    }

    const counts = {
      all: blogs.length,
      published: blogs.filter((b) => b.status === "Published").length,
      drafts: blogs.filter((b) => b.status === "Draft").length,
      scheduled: blogs.filter((b) => b.status === "Scheduled").length,
    };

    return NextResponse.json({
      success: true,
      blogs,
      events,
      counts,
    });
  } catch (err: any) {
    console.error("Failed to fetch admin blog posts and events:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to load content" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await authorizeAdminApi(req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const body = await req.json();
    const type = body.type || "blog";

    if (type === "event") {
      const eventRecord = {
        id: body.id || `evt-${Date.now()}`,
        title: body.title?.trim() || "Untitled Event",
        slug: slugify(body.slug || body.title || `event-${Date.now()}`),
        category: body.category || "Flagship Launch",
        date: body.date || "Oct 24, 2026",
        endDate: body.endDate || "Oct 26, 2026",
        time: body.time || "18:00 - 21:00",
        endTime: body.endTime || "21:00",
        locationType: body.locationType || "Physical Event",
        locationName: body.locationName || "OVIA Flagship Studio",
        address: body.address || "Bandra Kurla Complex, Mumbai, India",
        status: body.status || "Upcoming",
        image: body.image || "/media/flagship-store.png",
        shortDescription: body.shortDescription || "",
        fullDescription: body.fullDescription || "",
        tags: body.tags || ["Store Event"],
        ctaButtonText: body.ctaButtonText || "RSVP PRIVATE PREVIEW",
        ctaLink: body.ctaLink || "/events/rsvp",
        showInHomepage: Boolean(body.showInHomepage),
        seoTitle: body.seoTitle || `${body.title} | OVIA Events`,
        seoDescription: body.seoDescription || body.shortDescription || "",
        canonicalUrl: body.canonicalUrl || `https://ovias.shop/events/${body.slug}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await transaction(async (repo) => {
        await repo.put("events", eventRecord);
      });

      return NextResponse.json({
        success: true,
        event: eventRecord,
        message: "Event created successfully.",
      });
    }

    // Creating Blog Post
    const title = (body.title || "").trim();
    if (!title) {
      return NextResponse.json(
        { success: false, error: "Blog post title is required." },
        { status: 400 }
      );
    }

    const slug = slugify(body.slug || title);
    if (!slug) {
      return NextResponse.json(
        { success: false, error: "Valid URL slug is required." },
        { status: 400 }
      );
    }

    const excerpt = (body.excerpt || "").trim() || `${title} — OVIA Journal notes and perspectives.`;
    const content = (body.content || "").trim();
    const heroImage = body.image || "/media/case-flowers.jpg";
    const author = (body.author || "").trim() || "Adarsh Shukla";
    const category = (body.category || "").trim() || "Travel";

    const normalizedStatus =
      body.status?.toLowerCase() === "published"
        ? "published"
        : body.status?.toLowerCase() === "scheduled"
        ? "scheduled"
        : "draft";

    const publishedAt =
      body.publishDate ||
      (normalizedStatus === "scheduled" && body.scheduledFor
        ? body.scheduledFor
        : new Date().toISOString());

    const contentBlocks =
      body.contentBlocks && body.contentBlocks.length > 0
        ? body.contentBlocks
        : parseContentToBlocks(content || excerpt);

    const readingTime = calculateReadingTime(content || excerpt);

    const newStoryData: any = {
      title,
      slug,
      category,
      excerpt,
      content,
      heroImage,
      thumbnail: heroImage,
      contentBlocks,
      gallery: body.gallery || [heroImage],
      relatedProducts: body.relatedProducts || ["interval-cabin", "forma-backpack"],
      publishedAt,
      status: normalizedStatus,
      featured: Boolean(body.featured),
      readingTime,
      author,
      tags: body.tags || [category],
      scheduledFor: body.scheduledFor || undefined,
      seoTitle: body.seoTitle || `${title} | OVIA Journal`,
      seoDescription: body.seoDescription || excerpt,
      focusKeyword: body.focusKeyword || "",
      canonicalUrl: body.canonicalUrl || `https://ovias.shop/journal/${slug}`,
      indexing: body.indexing || "Index (Allow search engines)",
      followLinks: body.followLinks || "Follow (Allow link following)",
      ogTitle: body.seoTitle || title,
      ogDescription: body.seoDescription || excerpt,
      ogImage: heroImage,
      twitterCard: "summary_large_image",
    };

    const createdStory = await createStory(newStoryData);

    // Revalidate Next.js cache for public journal pages
    try {
      revalidatePath("/journal");
      revalidatePath(`/journal/${slug}`);
      revalidatePath("/");
    } catch (e) {
      console.warn("Revalidation notice:", e);
    }

    await recordAuditEvent({
      actor: auth.user.email,
      action: "BLOG_POST_CREATE",
      resource: "stories",
      resourceId: createdStory.id,
      details: { slug, title, status: normalizedStatus },
    });

    return NextResponse.json({
      success: true,
      blog: mapStoryToAdminBlog(createdStory),
      message: `Blog post "${title}" created (${normalizedStatus}).`,
    });
  } catch (err: any) {
    console.error("Failed to create blog post:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create blog post." },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const auth = await authorizeAdminApi(req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const body = await req.json();
    const type = body.type || "blog";

    if (type === "event") {
      const eventId = body.id;
      if (!eventId) {
        return NextResponse.json(
          { success: false, error: "Event id required." },
          { status: 400 }
        );
      }
      await transaction(async (repo) => {
        const existing = await repo.get<any>("events", eventId);
        const updated = {
          ...existing,
          ...body,
          updatedAt: new Date().toISOString(),
        };
        await repo.put("events", updated);
      });
      return NextResponse.json({
        success: true,
        message: "Event updated successfully.",
      });
    }

    const idOrSlug = body.id || body.slug;
    if (!idOrSlug) {
      return NextResponse.json(
        { success: false, error: "Post ID or slug is required for updating." },
        { status: 400 }
      );
    }

    const existing = await getStoryBySlug(idOrSlug);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Blog post not found." },
        { status: 404 }
      );
    }

    const newSlug = body.slug ? slugify(body.slug) : existing.slug;
    const content = body.content !== undefined ? body.content : existing.content;
    const excerpt = body.excerpt !== undefined ? body.excerpt : existing.excerpt;
    const heroImage = body.image || body.heroImage || existing.heroImage;

    const normalizedStatus = body.status
      ? body.status.toLowerCase() === "published"
        ? "published"
        : body.status.toLowerCase() === "scheduled"
        ? "scheduled"
        : body.status.toLowerCase() === "archived"
        ? "archived"
        : "draft"
      : existing.status;

    const contentBlocks =
      body.contentBlocks && body.contentBlocks.length > 0
        ? body.contentBlocks
        : content
        ? parseContentToBlocks(content)
        : existing.contentBlocks;

    const updates: Partial<Story> = {
      ...(body.title && { title: body.title.trim() }),
      ...(newSlug && { slug: newSlug }),
      ...(body.category && { category: body.category.trim() }),
      ...(excerpt && { excerpt }),
      ...(content !== undefined && { content }),
      ...(heroImage && { heroImage, thumbnail: heroImage }),
      ...(contentBlocks && { contentBlocks }),
      ...(body.gallery && { gallery: body.gallery }),
      ...(body.relatedProducts && { relatedProducts: body.relatedProducts }),
      ...(body.author && { author: body.author.trim() }),
      ...(body.featured !== undefined && { featured: Boolean(body.featured) }),
      ...(body.publishDate && { publishedAt: body.publishDate }),
      ...(body.scheduledFor && { scheduledFor: body.scheduledFor }),
      status: normalizedStatus,
      readingTime: calculateReadingTime(content || excerpt || ""),
      seoTitle: body.seoTitle || `${body.title || existing.title} | OVIA Journal`,
      seoDescription: body.seoDescription || excerpt || existing.excerpt,
      focusKeyword: body.focusKeyword ?? existing.focusKeyword,
      canonicalUrl:
        body.canonicalUrl || `https://ovias.shop/journal/${newSlug}`,
      indexing: body.indexing ?? existing.indexing,
      followLinks: body.followLinks ?? existing.followLinks,
      ogTitle: body.seoTitle || body.title || existing.title,
      ogDescription: body.seoDescription || excerpt || existing.excerpt,
      ogImage: heroImage,
      tags: body.tags || (body.category ? [body.category] : existing.tags),
    };

    const updatedStory = await updateStory(existing.id, updates);

    // Revalidate paths
    try {
      revalidatePath("/journal");
      revalidatePath(`/journal/${updatedStory.slug}`);
      if (existing.slug !== updatedStory.slug) {
        revalidatePath(`/journal/${existing.slug}`);
      }
      revalidatePath("/");
    } catch (e) {
      console.warn("Revalidation notice:", e);
    }

    await recordAuditEvent({
      actor: auth.user.email,
      action: "BLOG_POST_UPDATE",
      resource: "stories",
      resourceId: updatedStory.id,
      details: { slug: updatedStory.slug, status: normalizedStatus },
    });

    return NextResponse.json({
      success: true,
      blog: mapStoryToAdminBlog(updatedStory),
      message: `Blog post "${updatedStory.title}" updated successfully.`,
    });
  } catch (err: any) {
    console.error("Failed to update blog post:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update blog post." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await authorizeAdminApi(req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const slug = url.searchParams.get("slug");
    const type = url.searchParams.get("type") || "blog";
    const permanent = url.searchParams.get("permanent") === "true";

    const target = id || slug;
    if (!target) {
      return NextResponse.json(
        { success: false, error: "Target id or slug is required." },
        { status: 400 }
      );
    }

    if (type === "event") {
      await transaction(async (repo) => {
        await repo.remove("events", target);
      });
      return NextResponse.json({
        success: true,
        message: "Event removed successfully.",
      });
    }

    if (permanent) {
      await deleteStory(target);
    } else {
      // Soft-delete / Archive
      await updateStory(target, { status: "archived" });
    }

    try {
      revalidatePath("/journal");
      if (slug) revalidatePath(`/journal/${slug}`);
      revalidatePath("/");
    } catch (e) {
      console.warn("Revalidation notice:", e);
    }

    await recordAuditEvent({
      actor: auth.user.email,
      action: permanent ? "BLOG_POST_DELETE" : "BLOG_POST_ARCHIVE",
      resource: "stories",
      resourceId: target,
      details: { permanent },
    });

    return NextResponse.json({
      success: true,
      message: permanent ? "Post permanently deleted." : "Post moved to archive/trash.",
    });
  } catch (err: any) {
    console.error("Failed to delete blog post:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to delete post." },
      { status: 500 }
    );
  }
}
