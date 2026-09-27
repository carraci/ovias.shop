import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Calendar, MapPin, Sparkles } from "lucide-react";
import { oviaEvents } from "@/lib/events";
import { Reveal, RevealGroup } from "@/components/motion";

export const metadata = {
  title: "OVIA Events — Experiences & Design Exhibitions",
  description: "Discover upcoming OVIA exhibitions, private previews, design week pavilions, and cultural moments across the world.",
};

export default function EventsPage() {
  const featured = oviaEvents[0];
  const upcoming = oviaEvents.slice(1);

  return (
    <main className="events-page-wrap">
      {/* Editorial Header */}
      <section className="events-hero-section">
        <Reveal y={24} duration={0.8}>
          <div className="events-hero-header">
            <span className="events-eyebrow">THE WORLD OF OVIA</span>
            <h1 className="events-hero-title">Events &amp; Cultural Moments</h1>
            <p className="events-hero-subtitle">
              Beyond the journey. Explore design week exhibitions, private atelier previews,
              and pop-up spaces that reflect our dialogue with contemporary architecture,
              craftsmanship, and travel.
            </p>
          </div>
        </Reveal>

        {/* Featured Hero Event */}
        {featured && (
          <Reveal y={32} duration={0.9} delay={0.1}>
            <article className="featured-event-card">
              <div className="featured-event-image-wrap">
                <Image
                  src={featured.image}
                  alt={featured.title}
                  fill
                  priority
                  className="featured-event-image"
                  sizes="(max-width: 1024px) 100vw, 1200px"
                />
                <span className="featured-event-badge">FEATURED EXHIBITION</span>
              </div>
              <div className="featured-event-content">
                <div className="event-meta-row">
                  <span className="event-meta-pill">
                    <Calendar size={13} /> {featured.date}
                  </span>
                  <span className="event-meta-pill">
                    <MapPin size={13} /> {featured.location}
                  </span>
                </div>
                <h2 className="featured-event-heading">{featured.title}</h2>
                <p className="featured-event-description">{featured.description}</p>
                <div className="featured-event-highlights">
                  {featured.details.map((detail, idx) => (
                    <div key={idx} className="event-highlight-item">
                      <Sparkles size={13} className="highlight-icon" />
                      <span>{detail}</span>
                    </div>
                  ))}
                </div>
                <div className="featured-event-action">
                  <Link href="/services/contact" className="event-cta-btn">
                    Inquire About Invitations <ArrowUpRight size={15} />
                  </Link>
                </div>
              </div>
            </article>
          </Reveal>
        )}
      </section>

      {/* Upcoming Events Grid */}
      <section className="upcoming-events-section">
        <Reveal y={20}>
          <div className="upcoming-section-header">
            <h2 className="upcoming-section-title">Upcoming Calendar</h2>
            <p className="upcoming-section-desc">
              Experience the craftsmanship and philosophy of OVIA in person.
            </p>
          </div>
        </Reveal>

        <RevealGroup selector=".upcoming-event-item" stagger={0.12}>
          <div className="upcoming-events-grid">
            {upcoming.map((ev) => (
              <article key={ev.id} className="upcoming-event-item">
                <div className="upcoming-image-wrap">
                  <Image
                    src={ev.image}
                    alt={ev.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="upcoming-img"
                  />
                  <span className="upcoming-category-tag">{ev.category}</span>
                </div>
                <div className="upcoming-content-wrap">
                  <div className="event-meta-row">
                    <span className="event-date-text">
                      <Calendar size={13} /> {ev.date}
                    </span>
                    <span className="event-location-text">
                      <MapPin size={13} /> {ev.location}
                    </span>
                  </div>
                  <h3 className="upcoming-card-title">{ev.title}</h3>
                  <p className="upcoming-card-desc">{ev.description}</p>
                  <Link href="/services/contact" className="upcoming-card-link">
                    Register Interest <ArrowUpRight size={14} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </RevealGroup>
      </section>
    </main>
  );
}
