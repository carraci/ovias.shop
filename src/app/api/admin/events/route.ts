import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminApi } from "@/server/admin-auth";
import { transaction, readRepository } from "@/server/db";
import { originCheck } from "@/server/http";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { defaultEvents, type OviaEvent } from "@/lib/events";

export const runtime = "nodejs";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 140);
}

export async function GET(req: NextRequest) {
  const auth = await authorizeAdminApi(req);
  if (!auth.authorized) return auth.response;

  try {
    const dbEvents = await readRepository((repo) =>
      repo.find<OviaEvent>("events"),
    );
    const existingIds = new Set((dbEvents || []).map((e) => e.id));
    const merged = [
      ...(dbEvents || []),
      ...defaultEvents.filter((d) => !existingIds.has(d.id)),
    ];

    return NextResponse.json(
      { events: merged },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Could not retrieve events from database." },
      { status: 503 },
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await authorizeAdminApi(req);
  if (!auth.authorized) return auth.response;

  try {
    originCheck(req);
    const body = await req.json();

    const title = String(body.title || "").trim();
    if (!title) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }

    const slug = slugify(body.slug?.trim() || title);
    const id = body.id || randomUUID();
    const now = new Date().toISOString();

    const gallery = Array.isArray(body.gallery)
      ? body.gallery.filter(Boolean)
      : typeof body.gallery === "string"
        ? body.gallery
            .split(/[\n,]+/)
            .map((s: string) => s.trim())
            .filter(Boolean)
        : [];

    const details = Array.isArray(body.details)
      ? body.details.filter(Boolean)
      : typeof body.details === "string"
        ? body.details
            .split(/\r?\n/)
            .map((s: string) => s.trim())
            .filter(Boolean)
        : [];

    const newEvent: OviaEvent = {
      id,
      slug,
      title,
      subtitle: String(body.subtitle || "").trim(),
      category: body.category || "Events",
      location: String(body.location || "TBD").trim(),
      date: String(body.date || "Upcoming 2026/2027").trim(),
      image: String(body.image || "/media/editorial-events.jpg").trim(),
      gallery: gallery.length > 0 ? gallery : [body.image || "/media/editorial-events.jpg"],
      description: String(body.description || "").trim(),
      content: String(body.content || body.description || "").trim(),
      details,
      status: body.status || "Upcoming",
      featured: Boolean(body.featured),
      author: auth.user.name || "OVIA Curatorial",
      readingTime: `${Math.max(1, Math.ceil((body.description || "").split(/\s+/).length / 150))} min read`,
      createdAt: body.createdAt || now,
      updatedAt: now,
    };

    await transaction(async (repo) => {
      await repo.put("events", newEvent);
    });

    revalidatePath("/events");
    revalidatePath(`/events/${slug}`);
    revalidatePath("/");

    return NextResponse.json({ success: true, event: newEvent });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Event could not be saved.",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await authorizeAdminApi(req);
  if (!auth.authorized) return auth.response;

  try {
    originCheck(req);
    const body = await req.json();
    const id = String(body.id || "").trim();

    if (!id) {
      return NextResponse.json({ error: "Event ID required." }, { status: 400 });
    }

    const updated = await transaction(async (repo) => {
      let current = await repo.get<OviaEvent>("events", id);
      if (!current) {
        current = defaultEvents.find((d) => d.id === id);
      }
      if (!current) return null;

      const gallery = Array.isArray(body.gallery)
        ? body.gallery.filter(Boolean)
        : typeof body.gallery === "string"
          ? body.gallery
              .split(/[\n,]+/)
              .map((s: string) => s.trim())
              .filter(Boolean)
          : current.gallery;

      const details = Array.isArray(body.details)
        ? body.details.filter(Boolean)
        : typeof body.details === "string"
          ? body.details
              .split(/\r?\n/)
              .map((s: string) => s.trim())
              .filter(Boolean)
          : current.details;

      const nextEvent: OviaEvent = {
        ...current,
        title: body.title !== undefined ? String(body.title).trim() : current.title,
        subtitle:
          body.subtitle !== undefined
            ? String(body.subtitle).trim()
            : current.subtitle,
        category: body.category || current.category,
        location: body.location !== undefined ? String(body.location).trim() : current.location,
        date: body.date !== undefined ? String(body.date).trim() : current.date,
        image: body.image || current.image,
        gallery,
        description:
          body.description !== undefined
            ? String(body.description).trim()
            : current.description,
        content:
          body.content !== undefined ? String(body.content).trim() : current.content,
        details,
        status: body.status || current.status,
        featured: body.featured !== undefined ? Boolean(body.featured) : current.featured,
        updatedAt: new Date().toISOString(),
      };

      await repo.put("events", nextEvent);
      return nextEvent;
    });

    if (!updated) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    revalidatePath("/events");
    revalidatePath(`/events/${updated.slug}`);
    revalidatePath("/");

    return NextResponse.json({ success: true, event: updated });
  } catch (error) {
    return NextResponse.json(
      { error: "Event update failed." },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await authorizeAdminApi(req);
  if (!auth.authorized) return auth.response;

  try {
    originCheck(req);
    const body = await req.json();
    const id = String(body.id || "").trim();

    if (!id) {
      return NextResponse.json({ error: "Event ID required." }, { status: 400 });
    }

    const removed = await transaction(async (repo) => {
      const existing = await repo.get<OviaEvent>("events", id);
      if (existing) {
        await repo.remove("events", id);
        return existing;
      }
      return null;
    });

    revalidatePath("/events");
    revalidatePath("/");

    return NextResponse.json({ success: true, removed: Boolean(removed) });
  } catch {
    return NextResponse.json({ error: "Event deletion failed." }, { status: 500 });
  }
}
