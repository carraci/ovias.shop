"use client";
import "@/components/page-styles/discover-landing.css";


import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

// ─── DATA ─────────────────────────────────────────────────────────────────────

const worldCards = [
  {
    id: "our-approach",
    tag: "OUR PHILOSOPHY",
    title: "Our approach",
    desc: "Design with purpose. Create for a lifetime. Travel with intention.",
    image: "/media/architecture.jpg",
    href: "/our-approach",
  },
  {
    id: "the-story",
    tag: "HERITAGE",
    title: "The OVIA story",
    desc: "A journey of craftsmanship, innovation and a global perspective.",
    image: "/media/material-aluminium.jpg",
    href: "/heritage",
  },
  {
    id: "all-stories",
    tag: "JOURNAL",
    title: "All stories",
    desc: "People, places and ideas shaping a more meaningful tomorrow.",
    image: "/media/editorial-style.jpg",
    href: "/journal",
  },
];

export function DiscoverLanding() {
  return (
    <div className="discover-landing-page">
      {/* ── TOP ANNOUNCEMENT BAR ── */}
      <div className="discover-announcement-bar">
        <div className="discover-announcement-text">
          <span>COMPLIMENTARY SHIPPING &amp; RETURNS</span>
          <span className="discover-announcement-sep">|</span>
          <span>DEDICATED CLIENT CARE</span>
          <span className="discover-announcement-sep">|</span>
          <span>A MORE MINDFUL JOURNEY</span>
        </div>
        <div className="discover-announcement-locale">
          <span>INDIA (INR ₹)</span>
          <span className="discover-announcement-sep">|</span>
          <span>EN</span>
        </div>
      </div>

      {/* ── 1. HERO SECTION: DISCOVER ── */}
      <section className="discover-hero-section">
        <div className="discover-hero-media">
          <Image
            src="/media/bags-hero-terrace.jpg"
            alt="OVIA Discover - Stories of people, places and ideas"
            fill
            priority
            sizes="100vw"
            className="discover-hero-img"
          />
          <div className="discover-hero-overlay" />
        </div>

        <div className="discover-hero-inner">
          <div className="discover-hero-content">
            <p className="discover-hero-eyebrow">EXPLORE</p>
            <h1 className="discover-hero-title">DISCOVER</h1>
            <p className="discover-hero-desc">
              Stories of people, places and ideas that
              <br />
              shape a more meaningful way to travel.
            </p>
            <div className="discover-hero-actions">
              <a href="#explore-our-world" className="discover-hero-btn">
                <span className="discover-btn-circle-arrow">
                  <ArrowRight size={15} />
                </span>
                <span className="discover-btn-label">EXPLORE DISCOVER</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. EXPLORE OUR WORLD (3 CARDS) ── */}
      <section id="explore-our-world" className="discover-content-wrap discover-world-section">
        <div className="discover-section-title-wrap">
          <h2 className="discover-section-title uppercase center">
            EXPLORE OUR WORLD
          </h2>
          <div className="discover-section-divider center" />
          <p className="discover-section-sub center">
            Discover the craftsmanship, innovation and people behind OVIA.
          </p>
        </div>

        <div className="discover-world-grid">
          {worldCards.map((card) => (
            <Link key={card.id} href={card.href} className="discover-world-card group">
              <div className="discover-world-media">
                <Image
                  src={card.image}
                  alt={card.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="discover-world-img"
                />
                <div className="discover-world-overlay" />
                <div className="discover-world-content">
                  <div className="discover-world-text">
                    <p className="discover-world-tag">{card.tag}</p>
                    <h3 className="discover-world-title">{card.title}</h3>
                    <p className="discover-world-desc">{card.desc}</p>
                  </div>
                  <span className="discover-circle-arrow" aria-hidden="true">
                    <ArrowRight size={15} />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── 3. FEATURED STORY 1: IN MOTION ── */}
      <section className="discover-content-wrap discover-featured-section">
        <div className="discover-featured-card card-in-motion">
          <div className="discover-featured-content">
            <span className="discover-featured-tag">FEATURED STORY</span>
            <h2 className="discover-featured-title">In motion</h2>
            <p className="discover-featured-desc">
              Moments, movements and the people who keep the world moving.
            </p>
            <Link href="/journal" className="discover-read-btn">
              <span className="discover-read-circle">
                <ArrowRight size={14} />
              </span>
              <span>Read the story</span>
            </Link>
          </div>

          <div className="discover-featured-media">
            <Image
              src="/media/journey.jpg"
              alt="In motion - Moments and movements"
              fill
              sizes="(max-width: 900px) 100vw, 60vw"
              className="discover-featured-img"
            />
          </div>
        </div>
      </section>

      {/* ── 4. FEATURED STORY 2: A CONSIDERED CARRY (REVERSED) ── */}
      <section className="discover-content-wrap discover-featured-section">
        <div className="discover-featured-card card-considered-carry reversed">
          <div className="discover-featured-media">
            <Image
              src="/media/editorial-collection.jpg"
              alt="A considered carry - Thoughtful design for a conscious tomorrow"
              fill
              sizes="(max-width: 900px) 100vw, 60vw"
              className="discover-featured-img"
            />
          </div>

          <div className="discover-featured-content">
            <span className="discover-featured-tag">FEATURED STORY</span>
            <h2 className="discover-featured-title">A considered carry</h2>
            <p className="discover-featured-desc">
              Thoughtful design for a more conscious tomorrow.
            </p>
            <Link href="/our-approach" className="discover-read-btn">
              <span className="discover-read-circle">
                <ArrowRight size={14} />
              </span>
              <span>Read the story</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── 5. BRAND STATEMENT: A MORE MEANINGFUL JOURNEY ── */}
      <section className="discover-statement-section">
        <div className="discover-statement-media">
          <Image
            src="/media/spaces.jpg"
            alt="OVIA - A More Meaningful Journey"
            fill
            sizes="100vw"
            className="discover-statement-img"
          />
          <div className="discover-statement-overlay" />
        </div>

        <div className="discover-statement-inner">
          <h2 className="discover-statement-title uppercase">
            A MORE<br />
            MEANINGFUL JOURNEY
          </h2>
          <div className="discover-statement-divider" />
          <p className="discover-statement-desc">
            Through design, people and places, we explore a world in motion
            and the stories that connect us all.
          </p>
        </div>
      </section>
    </div>
  );
}
