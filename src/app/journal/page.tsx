import Image from "next/image";
import Link from "next/link";
import { getStories } from "@/server/stories";
import { stories as fallbackStories } from "@/lib/journal";

export const dynamic = "force-dynamic";
export const metadata = { title: "The OVIA Journal — Stories & Perspectives" };

export default async function JournalPage() {
  const dbStories = await getStories({ status: "published" });
  const displayStories =
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
        }));

  return (
    <section className="section journal-page">
      <p className="eyebrow">THE OVIA JOURNAL</p>
      <h1>
        Notes from <em>the journey.</em>
      </h1>
      <p style={{ color: "var(--muted)", maxWidth: "620px", fontSize: "15px", lineHeight: "1.7", margin: "16px 0 44px" }}>
        Chronicles of architecture, leather craft, industrial design, and contemporary perspectives on modern mobility.
      </p>
      <div className="journal-grid">
        {displayStories.map((story) => (
          <article className="story-card" key={story.slug}>
            <Link href={`/journal/${story.slug}`} className="story-card-image">
              <Image
                src={story.thumbnail || story.heroImage}
                alt={story.title}
                fill
                sizes="(max-width: 760px) 90vw, 30vw"
              />
            </Link>
            <p className="eyebrow">{story.category}</p>
            <h2>
              <Link href={`/journal/${story.slug}`}>{story.title}</Link>
            </h2>
            <Link className="story-read" href={`/journal/${story.slug}`}>
              READ STORY ↗
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}

