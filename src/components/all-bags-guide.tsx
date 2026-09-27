"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Play } from "lucide-react";
import { useState } from "react";

// ─── DATA ─────────────────────────────────────────────────────────────────────

const bagCollections = [
  {
    id: "backpacks",
    title: "Backpacks",
    desc: "Designed for everyday journeys.",
    image: "/media/cat-backpack.jpg",
    href: "/bags/backpacks",
  },
  {
    id: "duffle-bags",
    title: "Duffle bags",
    desc: "For short escapes or long journeys.",
    image: "/media/cat-duffle.jpg",
    href: "/bags/duffle-bags",
  },
  {
    id: "briefcases",
    title: "Briefcases",
    desc: "Structured carry for the boardroom.",
    image: "/media/cat-handcarry.jpg",
    href: "/bags/briefcases",
  },
  {
    id: "crossbodies",
    title: "Crossbodies",
    desc: "Effortless style for day to night.",
    image: "/media/cat-crossbody.jpg",
    href: "/bags/crossbodies",
  },
  {
    id: "totes",
    title: "Totes",
    desc: "Open-top carry for daily essentials.",
    image: "/media/cat-backpack.jpg",
    href: "/bags/totes",
  },
  {
    id: "shoulder-bags",
    title: "Shoulder bags",
    desc: "Relaxed silhouettes for every day.",
    image: "/media/cat-crossbody.jpg",
    href: "/bags/shoulder-bags",
  },
  {
    id: "hand-carry",
    title: "Hand carry",
    desc: "Briefcases, specialty cases and structured carriers.",
    image: "/media/cat-handcarry.jpg",
    href: "/bags/hand-carry",
  },
];

const favourites = [
  { label: "Business Bags", href: "/bags?use=business" },
  { label: "Travel Bags", href: "/bags?use=travel" },
  { label: "Aluminium", href: "/bags?material=Aluminium" },
  { label: "Leather", href: "/bags?material=Leather" },
  { label: "Nylon", href: "/bags?material=Nylon" },
  { label: "Bag Straps", href: "/accessories/bag-straps" },
  { label: "All gifts", href: "/collections/gifts" },
];

const horizonMaterials = [
  { name: "ALUMINIUM", href: "/bags?material=Aluminium" },
  { name: "NYLON", href: "/bags?material=Nylon" },
  { name: "LEATHER", href: "/bags?material=Leather" },
  { name: "CANVAS", href: "/bags?material=Canvas" },
];

const iconicMaterials = [
  {
    id: "aluminium",
    title: "Aluminium",
    desc: "Iconic structure with precision for lasting strength.",
    image: "/media/material-aluminium.jpg",
    href: "/bags?material=Aluminium",
  },
  {
    id: "leather",
    title: "Leather",
    desc: "Refined craftsmanship with timeless appeal.",
    image: "/media/material-leather.jpg",
    href: "/bags?material=Leather",
  },
  {
    id: "canvas",
    title: "Canvas",
    desc: "A modern take on everyday versatility.",
    image: "/media/material-canvas.jpg",
    href: "/bags?material=Canvas",
  },
  {
    id: "nylon",
    title: "Nylon",
    desc: "Lightweight performance for modern travel.",
    image: "/media/material-nylon.jpg",
    href: "/bags?material=Nylon",
  },
];

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export function AllBagsGuide() {
  const [activeSlide, setActiveSlide] = useState(1);
  const [videoModal, setVideoModal] = useState(false);

  return (
    <div className="wider-bags-page">

      {/* ── 1. HERO BANNER: BAGS FOR A WIDER WORLD ── */}
      <section className="wider-hero-section">
        <div className="wider-hero-media">
          <Image
            src="/media/bags-hero-terrace.jpg"
            alt="OVIA Bags for a wider world - Mediterranean terrace collection"
            fill
            priority
            sizes="100vw"
            className="wider-hero-img"
          />
          <div className="wider-hero-gradient-overlay" />
        </div>

        <div className="wider-hero-inner">
          <div className="wider-hero-content">
            <p className="wider-hero-eyebrow">THE ART OF MOVEMENT</p>
            <h1 className="wider-hero-title">
              Bags for<br />
              a wider world
            </h1>
            <p className="wider-hero-desc">
              Timeless design. Exceptional craftsmanship.<br />
              Created for every journey, wherever life takes you.
            </p>
            <div className="wider-hero-cta-row">
              <Link href="/bags?view=catalog" className="wider-btn-primary">
                EXPLORE ALL BAGS <ArrowRight size={14} className="wider-cta-icon" />
              </Link>
            </div>
          </div>

          <div className="wider-hero-bottom-bar">
            <div className="wider-slide-indicators">
              <button
                type="button"
                className={`wider-slide-dot ${activeSlide === 1 ? "active" : ""}`}
                onClick={() => setActiveSlide(1)}
              >
                01 <span>——</span>
              </button>
              <button
                type="button"
                className={`wider-slide-dot ${activeSlide === 2 ? "active" : ""}`}
                onClick={() => setActiveSlide(2)}
              >
                02
              </button>
              <button
                type="button"
                className={`wider-slide-dot ${activeSlide === 3 ? "active" : ""}`}
                onClick={() => setActiveSlide(3)}
              >
                03
              </button>
            </div>

            <button
              type="button"
              className="wider-watch-story-btn"
              onClick={() => setVideoModal(true)}
              aria-label="Watch the story"
            >
              <span className="wider-play-circle">
                <Play size={13} fill="currentColor" />
              </span>
              <span className="wider-watch-text">
                WATCH<br />THE STORY
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* ── 2. EXPLORE OUR BAG COLLECTIONS (4-UP) ── */}
      <section className="wider-content-container wider-collections-section">
        <div className="wider-section-header">
          <div>
            <p className="wider-section-eyebrow">EXPLORE OUR</p>
            <h2 className="wider-section-title">Bag Collections</h2>
          </div>
          <Link href="/bags?view=catalog" className="wider-header-link">
            VIEW ALL BAGS <ArrowRight size={13} />
          </Link>
        </div>

        <div className="wider-grid-4">
          {bagCollections.map((item) => (
            <div key={item.id} className="wider-collection-card">
              <Link href={item.href} className="wider-card-anchor">
                <div className="wider-card-media-wrap">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 25vw"
                    className="wider-card-img"
                  />
                </div>
                <div className="wider-card-info">
                  <h3 className="wider-card-title">{item.title}</h3>
                  <p className="wider-card-desc">{item.desc}</p>
                  <span className="wider-card-cta">
                    EXPLORE <ArrowRight size={12} className="wider-arrow-icon" />
                  </span>
                </div>
              </Link>
            </div>
          ))}
        </div>

        {/* Favourites quick-links */}
        <div className="wider-favourites-row">
          <span className="wider-favourites-label">FAVOURITES</span>
          <div className="wider-favourites-links">
            {favourites.map((fav) => (
              <Link key={fav.href} href={fav.href} className="wider-favourites-chip">
                {fav.label} <ArrowRight size={12} />
              </Link>
            ))}
          </div>
          <Link href="/bags?view=catalog" className="wider-see-all-link">
            See all shapes <ArrowRight size={12} />
          </Link>
        </div>
      </section>

      {/* ── 3. NEW COLLECTION: THE HORIZON SERIES ── */}
      <section className="wider-horizon-section">
        <div className="wider-horizon-media">
          <Image
            src="/media/horizon-sunset.jpg"
            alt="OVIA The Horizon Series luxury luggage at Lake Como sunset"
            fill
            sizes="100vw"
            className="wider-horizon-img"
          />
          <div className="wider-horizon-dim" />
        </div>

        <div className="wider-horizon-inner">
          <div className="wider-horizon-panel">
            <p className="wider-horizon-eyebrow">NEW COLLECTION</p>
            <h2 className="wider-horizon-title">
              THE<br />
              HORIZON<br />
              SERIES
            </h2>
            <p className="wider-horizon-desc">
              Sculpted for modern explorers.<br />
              Built to move, made to last.
            </p>
            <Link href="/bags?collection=Horizon" className="wider-btn-outline">
              DISCOVER THE COLLECTION <ArrowRight size={13} />
            </Link>
          </div>

          <div className="wider-horizon-materials-list">
            {horizonMaterials.map((mat) => (
              <Link key={mat.name} href={mat.href} className="wider-horizon-mat-link">
                <span>{mat.name}</span>
                <span className="wider-mat-line" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. ICONIC MATERIALS ── */}
      <section className="wider-content-container wider-materials-section">
        <div className="wider-section-header">
          <h2 className="wider-section-title uppercase">ICONIC MATERIALS</h2>
          <Link href="/bags?view=catalog" className="wider-header-link">
            VIEW ALL MATERIALS <ArrowRight size={13} />
          </Link>
        </div>

        <div className="wider-grid-4">
          {iconicMaterials.map((mat) => (
            <div key={mat.id} className="wider-material-card">
              <Link href={mat.href} className="wider-card-anchor">
                <div className="wider-mat-media-wrap">
                  <Image
                    src={mat.image}
                    alt={mat.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 25vw"
                    className="wider-mat-img"
                  />
                </div>
                <div className="wider-card-info">
                  <h3 className="wider-card-title">{mat.title}</h3>
                  <p className="wider-card-desc">{mat.desc}</p>
                  <span className="wider-card-cta">
                    DISCOVER <ArrowRight size={12} className="wider-arrow-icon" />
                  </span>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── 5. BEYOND DESTINATIONS / A COMPANION FOR EVERY JOURNEY ── */}
      <section className="wider-companion-section">
        <div className="wider-companion-media">
          <Image
            src="/media/launch-models.jpg"
            alt="A companion for every journey"
            fill
            sizes="100vw"
            className="wider-companion-img"
          />
          <div className="wider-companion-dim" />
        </div>

        <div className="wider-companion-inner">
          <p className="wider-companion-eyebrow">BEYOND DESTINATIONS</p>
          <h2 className="wider-companion-title">
            A companion<br />
            for every journey
          </h2>
          <p className="wider-companion-desc">
            More than a bag. A part of your story.
          </p>
          <Link href="/discover" className="wider-btn-outline">
            EXPLORE THE STORY <ArrowRight size={13} />
          </Link>
        </div>
      </section>

      {/* ── VIDEO MODAL ── */}
      {videoModal && (
        <div className="wider-modal-backdrop" onClick={() => setVideoModal(false)}>
          <div className="wider-modal-box" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="wider-modal-close"
              onClick={() => setVideoModal(false)}
            >
              ✕
            </button>
            <div className="wider-modal-player">
              <Image
                src="/media/bags-hero-terrace.jpg"
                alt="OVIA Brand Story Preview"
                fill
                className="wider-modal-cover"
              />
              <div className="wider-modal-caption">
                <h3>The Art of Movement — Chapter I</h3>
                <p>Crafted in Germany, made for infinite horizons.</p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
