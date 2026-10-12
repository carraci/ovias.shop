import { readRepository } from "@/server/db";
import { defaultEvents, type OviaEvent } from "@/lib/events";

export async function getEvents(): Promise<OviaEvent[]> {
  try {
    const dbEvents = await readRepository((repo) =>
      repo.find<OviaEvent>("events"),
    );
    if (dbEvents && dbEvents.length > 0) {
      const existingIds = new Set(dbEvents.map((e) => e.id));
      const combined = [
        ...dbEvents,
        ...defaultEvents.filter((d) => !existingIds.has(d.id)),
      ];
      return combined.filter((e) => e.status !== "Draft");
    }
  } catch {}
  return defaultEvents.filter((e) => e.status !== "Draft");
}

export async function getEventBySlug(slug: string): Promise<OviaEvent | null> {
  const events = await getEvents();
  return events.find((e) => e.slug === slug || e.id === slug) || null;
}

export async function getFeaturedEvent(): Promise<OviaEvent> {
  const events = await getEvents();
  return events.find((e) => e.featured) || events[0] || defaultEvents[0];
}

export async function getUpcomingEvents(): Promise<OviaEvent[]> {
  const events = await getEvents();
  return events.filter((e) => e.status === "Upcoming");
}
