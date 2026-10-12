import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getEvents, getFeaturedEvent, getUpcomingEvents } from "@/server/events-db";
import { EventsJournal } from "@/components/events-journal";
import styles from "./events.module.css";

export const metadata: Metadata = {
  title: "Events & Experiences — The World of OVIA",
  description:
    "Beyond the journey. Discover the moments, gatherings and stories that shape the world of OVIA.",
  alternates: {
    canonical: "/events",
  },
};

export default async function EventsPage() {
  const allEvents = await getEvents();
  const featured = await getFeaturedEvent();
  const upcoming = await getUpcomingEvents();

  // Exclude featured from the general journal list to keep an editorial hierarchy
  const journalEvents = allEvents.filter((e) => e.id !== featured?.id);

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
          <Link href="/" className={styles.breadcrumbLink}>
            Home
          </Link>
          <span className={styles.breadcrumbSeparator} aria-hidden="true">
            /
          </span>
          <Link href="/about" className={styles.breadcrumbLink}>
            The World of OVIA
          </Link>
          <span className={styles.breadcrumbSeparator} aria-hidden="true">
            /
          </span>
          <span className={styles.breadcrumbCurrent}>Events</span>
        </nav>

        {/* Header */}
        <header className={styles.heroHeader}>
          <h1 className={styles.heroTitle}>Events &amp; Experiences</h1>
          <p className={styles.heroSubtitle}>
            Beyond the journey. Discover the moments, gatherings and stories
            that shape the world of OVIA.
          </p>
        </header>

        {/* Featured Experience */}
        {featured && (
          <section
            className={styles.featuredSection}
            aria-labelledby="featured-title"
          >
            <div className={styles.featuredMediaWrap}>
              <Image
                src={featured.image}
                alt={featured.title}
                fill
                priority
                sizes="(max-width: 1200px) 100vw, 1180px"
                className={styles.featuredMedia}
              />
            </div>
            <div className={styles.featuredContent}>
              <span className={styles.featuredEyebrow}>
                FEATURED EXPERIENCE
              </span>
              <h2 id="featured-title" className={styles.featuredTitle}>
                {featured.title}
              </h2>
              <p className={styles.featuredDesc}>{featured.subtitle}</p>
              <Link
                href={`/events/${featured.slug}`}
                className={styles.featuredLink}
              >
                Discover the Story
                <ArrowUpRight size={15} aria-hidden="true" />
              </Link>
            </div>
          </section>
        )}

        {/* The Journal Section with interactive category filters */}
        <EventsJournal initialEvents={journalEvents} />

        {/* Upcoming Events Section */}
        <section
          className={styles.upcomingSection}
          aria-labelledby="upcoming-title"
        >
          <div className={styles.upcomingHeader}>
            <h2 id="upcoming-title" className={styles.upcomingTitle}>
              Upcoming Events
            </h2>
            <p className={styles.upcomingSubtitle}>Future OVIA Experiences</p>
            {upcoming.length === 0 ? (
              <p className={styles.upcomingNotice}>
                Announcements will appear here.
              </p>
            ) : (
              <div className={styles.upcomingList}>
                {upcoming.map((item) => (
                  <Link
                    key={item.id}
                    href={`/events/${item.slug}`}
                    className={styles.upcomingItem}
                  >
                    <div className={styles.upcomingDateCol}>
                      <strong>{item.date}</strong>
                      <span className={styles.upcomingLocation}>
                        {item.location}
                      </span>
                    </div>
                    <div className={styles.upcomingMainCol}>
                      <h4>{item.title}</h4>
                      <p>{item.subtitle}</p>
                    </div>
                    <div className={styles.upcomingActionCol}>
                      View Announcement
                      <ArrowUpRight size={14} aria-hidden="true" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className={styles.stayConnectedRow}>
            <p className={styles.stayConnectedText}>
              Receive private invitations and announcements for future OVIA
              design exhibitions.
            </p>
            <Link href="/services/contact" className={styles.stayConnectedBtn}>
              Stay Connected
              <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </section>
      </div>

      {/* The World of OVIA Banner */}
      <section className={styles.worldBanner} aria-labelledby="world-banner-title">
        <div className={styles.worldBannerContent}>
          <span className={styles.worldEyebrow}>STAY CONNECTED</span>
          <h2 id="world-banner-title" className={styles.worldTitle}>
            The World of OVIA
          </h2>
          <p className={styles.worldSubtitle}>
            Explore our stories, collections and inspirations.
          </p>
          <Link href="/journal" className={styles.worldButton}>
            Explore Our Journal
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </main>
  );
}
