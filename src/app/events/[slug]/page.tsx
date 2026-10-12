import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Calendar,
  MapPin,
  Clock,
  Sparkles,
  ArrowUpRight,
  ArrowLeft,
} from "lucide-react";
import { getEventBySlug, getEvents } from "@/server/events-db";
import styles from "./event-detail.module.css";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return { title: "Event Not Found | OVIA" };

  return {
    title: `${event.title} — OVIA Events`,
    description: event.subtitle || event.description,
    openGraph: {
      title: event.title,
      description: event.subtitle || event.description,
      images: [event.image],
    },
  };
}

export default async function EventDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event) {
    notFound();
  }

  const allEvents = await getEvents();
  const relatedEvents = allEvents
    .filter((e) => e.slug !== event.slug)
    .slice(0, 2);

  const paragraphs = (event.content || event.description)
    .split(/\n\s*\n/)
    .filter(Boolean);

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.articleContainer}>
          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
            <Link href="/" className={styles.breadcrumbLink}>
              Home
            </Link>
            <span className={styles.breadcrumbSeparator} aria-hidden="true">
              /
            </span>
            <Link href="/events" className={styles.breadcrumbLink}>
              Events
            </Link>
            <span className={styles.breadcrumbSeparator} aria-hidden="true">
              /
            </span>
            <span className={styles.breadcrumbCurrent}>{event.title}</span>
          </nav>

          {/* Article Header */}
          <header className={styles.articleHeader}>
            <span className={styles.categoryEyebrow}>
              {event.category.toUpperCase()} · {event.status.toUpperCase()}
            </span>
            <h1 className={styles.articleTitle}>{event.title}</h1>
            <p className={styles.articleSubtitle}>{event.subtitle}</p>

            {/* Event Metadata Bar */}
            <div className={styles.metaBar}>
              <div className={styles.metaItem}>
                <Calendar size={15} className={styles.metaIcon} aria-hidden="true" />
                <span className={styles.metaValue}>{event.date}</span>
              </div>
              <div className={styles.metaItem}>
                <MapPin size={15} className={styles.metaIcon} aria-hidden="true" />
                <span className={styles.metaValue}>{event.location}</span>
              </div>
              {event.readingTime && (
                <div className={styles.metaItem}>
                  <Clock size={15} className={styles.metaIcon} aria-hidden="true" />
                  <span className={styles.metaValue}>{event.readingTime}</span>
                </div>
              )}
            </div>
          </header>
        </div>

        {/* Hero Full-width Media */}
        <div className={styles.heroMediaWrap}>
          <Image
            src={event.image}
            alt={event.title}
            fill
            priority
            sizes="(max-width: 1200px) 100vw, 1180px"
            className={styles.heroMedia}
          />
        </div>

        <div className={styles.articleContainer}>
          {/* Article Narrative Body */}
          <article className={styles.articleBody}>
            {paragraphs.map((p, idx) => (
              <p key={idx} className={styles.bodyParagraph}>
                {p}
              </p>
            ))}

            {/* Highlights Box */}
            {event.details && event.details.length > 0 && (
              <div className={styles.highlightsSection}>
                <h3 className={styles.highlightsTitle}>Exhibition Highlights</h3>
                <ul className={styles.highlightsList}>
                  {event.details.map((item, idx) => (
                    <li key={idx} className={styles.highlightItem}>
                      <Sparkles
                        size={15}
                        className={styles.highlightBullet}
                        aria-hidden="true"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </article>

          {/* Photo Gallery Grid */}
          {event.gallery && event.gallery.length > 0 && (
            <section
              className={styles.gallerySection}
              aria-labelledby="gallery-title"
            >
              <div className={styles.galleryHeader}>
                <h3 id="gallery-title" className={styles.galleryTitle}>
                  Gallery &amp; Impressions
                </h3>
                <p className={styles.gallerySubtitle}>
                  Photographs and moments from {event.title}.
                </p>
              </div>

              <div className={styles.galleryGrid}>
                {event.gallery.map((imgSrc, idx) => {
                  const isWide = idx === 0 || idx === 3;
                  return (
                    <div
                      key={idx}
                      className={`${styles.galleryItem} ${
                        isWide ? styles.galleryItemWide : ""
                      }`}
                    >
                      <Image
                        src={imgSrc}
                        alt={`${event.title} impression ${idx + 1}`}
                        fill
                        sizes={
                          isWide
                            ? "(max-width: 860px) 100vw, 860px"
                            : "(max-width: 860px) 100vw, 420px"
                        }
                        className={styles.galleryImage}
                      />
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Related Events */}
          {relatedEvents.length > 0 && (
            <section
              className={styles.relatedSection}
              aria-labelledby="related-title"
            >
              <h3 id="related-title" className={styles.relatedTitle}>
                More from The World of OVIA
              </h3>

              <div className={styles.relatedGrid}>
                {relatedEvents.map((rel) => (
                  <Link
                    key={rel.id}
                    href={`/events/${rel.slug}`}
                    className={styles.relatedCard}
                  >
                    <div className={styles.relatedMediaWrap}>
                      <Image
                        src={rel.image}
                        alt={rel.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 420px"
                        className={styles.relatedMedia}
                      />
                    </div>
                    <span className={styles.relatedCardCategory}>
                      {rel.category.toUpperCase()}
                    </span>
                    <h4 className={styles.relatedCardTitle}>{rel.title}</h4>
                    <span className={styles.relatedCardLink}>
                      Read Story
                      <ArrowUpRight size={13} aria-hidden="true" />
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Back to Events Navigation */}
          <div style={{ marginTop: "40px", marginBottom: "80px" }}>
            <Link
              href="/events"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "12px",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                fontWeight: 600,
                color: "#121212",
                textDecoration: "none",
              }}
            >
              <ArrowLeft size={16} aria-hidden="true" />
              Back to All Events
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
