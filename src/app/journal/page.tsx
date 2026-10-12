import Link from "next/link";
import { getStories } from "@/server/stories";
import { stories as fallbackStories } from "@/lib/journal";
import { JournalExplorer } from "./journal-explorer";
import type { Story } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "The OVIA Journal — Notes, Craft & Modern Mobility",
  description:
    "Chronicles of architecture, leather craft, industrial design, and contemporary perspectives on luxury travel and everyday journeys.",
  alternates: {
    canonical: "https://ovias.shop/journal",
  },
  openGraph: {
    title: "The OVIA Journal — Notes, Craft & Modern Mobility",
    description:
      "Chronicles of architecture, leather craft, industrial design, and contemporary perspectives on luxury travel and everyday journeys.",
    url: "https://ovias.shop/journal",
    siteName: "OVIA",
    images: [{ url: "/media/case-flowers.jpg" }],
  },
};

export default async function JournalPage() {
  const dbStories = await getStories({ status: "published" });

  const allStories: Story[] =
    dbStories.length > 0
      ? dbStories
      : fallbackStories.map((s) => ({
          id: s.slug,
          slug: s.slug,
          title: s.title,
          category: s.category,
          thumbnail: s.image,
          heroImage: s.image,
          excerpt: s.paragraphs[0],
          content: s.paragraphs.join("\n\n"),
          contentBlocks: s.paragraphs.map((p, i) => ({
            id: `p-${i}`,
            type: "paragraph" as const,
            text: p,
          })),
          gallery: [s.image],
          relatedProducts: ["interval-cabin", "forma-backpack"],
          publishedAt: new Date().toISOString(),
          status: "published" as const,
          featured: false,
          readingTime: "4 min read",
          author: "OVIA Editorial Studio",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));

  return (
    <main className="section journal-page" style={{ padding: "48px 24px 80px" }}>
      <header style={{ maxWidth: 840, margin: "0 auto 40px", textAlign: "center" }}>
        <p
          className="eyebrow"
          style={{
            fontSize: 12,
            letterSpacing: "0.14em",
            fontWeight: 600,
            color: "var(--muted, #888888)",
            textTransform: "uppercase",
            marginBottom: 12,
          }}
        >
          THE OVIA JOURNAL
        </p>
        <h1
          style={{
            fontFamily: "Georgia, serif",
            fontSize: "clamp(32px, 4.5vw, 48px)",
            lineHeight: 1.18,
            fontWeight: 500,
            margin: "0 0 18px",
            color: "#111111",
          }}
        >
          Notes from <em>the journey.</em>
        </h1>
        <p
          style={{
            color: "var(--muted, #666666)",
            maxWidth: 640,
            fontSize: 16,
            lineHeight: 1.7,
            margin: "0 auto",
          }}
        >
          Chronicles of architecture, leather atelier craft, industrial design, and contemporary perspectives on modern mobility.
        </p>
      </header>

      <JournalExplorer initialStories={allStories} />
    </main>
  );
}

