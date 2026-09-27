"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ChevronLeft, ChevronRight, Heart } from "lucide-react";
import { useState } from "react";

// ─── DATA ─────────────────────────────────────────────────────────────────────

const sizeCategories = [
  {
    id: "cabin",
    title: "Cabin",
    sub: "For short trips",
    image: "/media/showcase/iconic-1-classic-cabin.png",
    href: "/luggage/cabin",
  },
  {
    id: "check-in",
    title: "Check-In",
    sub: "For longer journeys",
    image: "/media/showcase/like-3-original-black.png",
    href: "/luggage/check-in",
  },
  {
    id: "trunks",
    title: "Trunks",
    sub: "For extended travel",
    image: "/media/showcase/like-2-essential-green.png",
    href: "/luggage/trunk",
  },
  {
    id: "all-luggage",
    title: "View All Luggage",
    sub: "Explore the full collection",
    image: "/media/showcase/iconic-4-original-cabin.png",
    href: "/luggage?view=catalog",
  },
];

const luggageFavourites = [
  { label: "Leather", href: "/luggage?material=Leather" },
  { label: "Silver luggage", href: "/luggage?color=Silver" },
  { label: "Black luggage", href: "/luggage?color=Black" },
  { label: "Blue luggage", href: "/luggage?color=Midnight+Blue" },
  { label: "All gifts", href: "/collections/gifts" },
];

const iconicMaterials = [
  {
    id: "aluminium",
    title: "Aluminium",
    desc: "Iconic structure with precision for lasting strength.",
    image: "/media/material-aluminium.jpg",
    href: "/luggage?material=Aluminium",
  },
  {
    id: "polycarbonate",
    title: "Polycarbonate",
    desc: "Lightweight, durable and ready for every destination.",
    image: "/media/material-nylon.jpg",
    href: "/luggage?material=Polycarbonate",
  },
  {
    id: "leather",
    title: "Leather",
    desc: "Refined craftsmanship with timeless appeal.",
    image: "/media/material-leather.jpg",
    href: "/luggage?material=Leather",
  },
  {
    id: "signature",
    title: "Signature Finish",
    desc: "Distinctive details for extraordinary journeys.",
    image: "/media/cat-handcarry.jpg",
    href: "/luggage?view=catalog",
  },
];

const bestSellers = [
  {
    id: "horizon-cabin-silver",
    name: "Horizon Cabin",
    price: "₹ 82,000",
    image: "/media/showcase/iconic-1-classic-cabin.png",
    href: "/products/horizon-cabin",
  },
  {
    id: "horizon-checkin-black",
    name: "Horizon Check-In",
    price: "₹ 95,000",
    image: "/media/showcase/like-3-original-black.png",
    href: "/products/horizon-check-in",
  },
  {
    id: "horizon-trunk-green",
    name: "Horizon Trunk",
    price: "₹ 1,20,000",
    image: "/media/showcase/like-2-essential-green.png",
    href: "/products/horizon-trunk",
  },
  {
    id: "horizon-cabin-champagne",
    name: "Horizon Cabin",
    price: "₹ 82,000",
    image: "/media/showcase/iconic-4-original-cabin.png",
    href: "/products/horizon-cabin",
  },
  {
    id: "horizon-checkin-grey",
    name: "Horizon Check-In",
    price: "₹ 95,000",
    image: "/media/showcase/iconic-3-classic-checkin.png",
    href: "/products/horizon-check-in",
  },
];

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export function LuggageLanding() {
  const [activeSlide, setActiveSlide] = useState(1);
  const [wishlist, setWishlist] = useState<Record<string, boolean>>({});

  const toggleWishlist = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setWishlist((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="wider-luggage-page">

      {/* ── 1. HERO BANNER: DESIGNED FOR A WIDER WORLD ── */}
      <section className="luggage-hero-section">
        <div className="luggage-hero-media">
          <Image
            src="/media/category-luggage.jpg"
            alt="OVIA Luggage Collection - Designed for a wider world"
            fill
            priority
            sizes="100vw"
            className="luggage-hero-img"
          />
          <div className="luggage-hero-overlay" />
        </div>

        <div className="luggage-hero-inner">
          <div className="luggage-hero-content">
            <p className="luggage-hero-eyebrow">LUGGAGE COLLECTION</p>
            <h1 className="luggage-hero-title">
              Designed<br />
              for a wider<br />
              world
            </h1>
            <p className="luggage-hero-desc">
              Exceptional craftsmanship. Timeless design.<br />
              Luggage created for every journey.
            </p>
            <div className="luggage-hero-actions">
              <Link href="/luggage?view=catalog" className="luggage-btn-primary">
                EXPLORE LUGGAGE <ArrowRight size={14} className="luggage-cta-icon" />
              </Link>
            </div>
          </div>

          <div className="luggage-hero-side-tags">
            <span>TRAVEL FURTHER</span>
            <span>LIVE BOLDER</span>
            <span>CARRY BETTER</span>
          </div>

          <div className="luggage-hero-bottom-bar">
            <div className="luggage-slide-indicators">
              <button
                type="button"
                className={`luggage-slide-dot ${activeSlide === 1 ? "active" : ""}`}
                onClick={() => setActiveSlide(1)}
              >
                01 <span>——</span>
              </button>
              <button
                type="button"
                className={`luggage-slide-dot ${activeSlide === 2 ? "active" : ""}`}
                onClick={() => setActiveSlide(2)}
              >
                02
              </button>
              <button
                type="button"
                className={`luggage-slide-dot ${activeSlide === 3 ? "active" : ""}`}
                onClick={() => setActiveSlide(3)}
              >
                03
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. EXPLORE BY SIZE / LUGGAGE FOR EVERY JOURNEY ── */}
      <section className="luggage-content-wrap luggage-size-section">
        <div className="luggage-section-header">
          <div>
            <p className="luggage-section-eyebrow">EXPLORE BY SIZE</p>
            <h2 className="luggage-section-title">Luggage for every journey</h2>
          </div>
          <Link href="/luggage?view=catalog" className="luggage-header-link">
            VIEW ALL LUGGAGE <ArrowRight size={13} />
          </Link>
        </div>

        <div className="luggage-grid-4">
          {sizeCategories.map((item) => (
            <div key={item.id} className="luggage-size-card">
              <Link href={item.href} className="luggage-card-anchor">
                <div className="luggage-size-media-wrap">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 25vw"
                    className="luggage-size-img"
                  />
                </div>
                <div className="luggage-size-info">
                  <div className="luggage-size-text">
                    <h3 className="luggage-size-name">{item.title}</h3>
                    <p className="luggage-size-sub">{item.sub}</p>
                  </div>
                  <div className="luggage-circle-arrow-btn" aria-hidden="true">
                    <ArrowRight size={13} />
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>

        {/* Favourites quick-links */}
        <div className="wider-favourites-row">
          <span className="wider-favourites-label">FAVOURITES</span>
          <div className="wider-favourites-links">
            {luggageFavourites.map((fav) => (
              <Link key={fav.href} href={fav.href} className="wider-favourites-chip">
                {fav.label} <ArrowRight size={12} />
              </Link>
            ))}
          </div>
          <Link href="/luggage" className="wider-see-all-link">
            See all luggage <ArrowRight size={12} />
          </Link>
        </div>
      </section>

      {/* ── 3. NEW COLLECTION: THE HORIZON SERIES ── */}
      <section className="luggage-horizon-section">
        <div className="luggage-horizon-media">
          <Image
            src="/media/horizon-sunset.jpg"
            alt="OVIA The Horizon Series luxury luggage"
            fill
            sizes="100vw"
            className="luggage-horizon-img"
          />
          <div className="luggage-horizon-dim" />
        </div>

        <div className="luggage-horizon-inner">
          <div className="luggage-horizon-panel">
            <p className="luggage-horizon-eyebrow">NEW COLLECTION</p>
            <h2 className="luggage-horizon-title">
              THE HORIZON<br />
              SERIES
            </h2>
            <p className="luggage-horizon-desc">
              Sculpted for modern explorers.<br />
              Built to move, made to last.
            </p>
            <Link href="/luggage?collection=Horizon" className="luggage-btn-outline">
              DISCOVER THE COLLECTION <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 4. ICONIC MATERIALS ── */}
      <section className="luggage-content-wrap luggage-materials-section">
        <div className="luggage-section-header">
          <h2 className="luggage-section-title uppercase">ICONIC MATERIALS</h2>
          <Link href="/luggage?view=catalog" className="luggage-header-link">
            EXPLORE ALL MATERIALS <ArrowRight size={13} />
          </Link>
        </div>

        <div className="luggage-grid-4">
          {iconicMaterials.map((mat) => (
            <div key={mat.id} className="luggage-mat-card">
              <Link href={mat.href} className="luggage-card-anchor">
                <div className="luggage-mat-media-wrap">
                  <Image
                    src={mat.image}
                    alt={mat.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 25vw"
                    className="luggage-mat-img"
                  />
                </div>
                <div className="luggage-mat-info">
                  <h3 className="luggage-mat-title">{mat.title}</h3>
                  <p className="luggage-mat-desc">{mat.desc}</p>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── 5. BEYOND DESTINATIONS / A COMPANION FOR EVERY JOURNEY ── */}
      <section className="luggage-companion-section">
        <div className="luggage-companion-media">
          <Image
            src="/media/bags-hero-terrace.jpg"
            alt="A companion for every journey"
            fill
            sizes="100vw"
            className="luggage-companion-img"
          />
          <div className="luggage-companion-dim" />
        </div>

        <div className="luggage-companion-inner">
          <p className="luggage-companion-eyebrow">BEYOND DESTINATIONS</p>
          <h2 className="luggage-companion-title">
            A companion<br />
            for every journey
          </h2>
          <p className="luggage-companion-desc">
            From city escapes to far horizons,<br />
            OVIA luggage moves with you.
          </p>
          <Link href="/discover" className="luggage-btn-outline">
            EXPLORE THE STORY <ArrowRight size={13} />
          </Link>
        </div>
      </section>

      {/* ── 6. BEST SELLERS CAROUSEL ── */}
      <section className="luggage-content-wrap luggage-bestsellers-section">
        <div className="luggage-section-header">
          <h2 className="luggage-section-title uppercase">BEST SELLERS</h2>
          <Link href="/luggage?view=catalog" className="luggage-header-link">
            VIEW ALL <ArrowRight size={13} />
          </Link>
        </div>

        <div className="luggage-bestsellers-grid">
          {bestSellers.map((item) => {
            const isLiked = !!wishlist[item.id];
            return (
              <div key={item.id} className="luggage-product-card">
                <Link href={item.href} className="luggage-product-anchor">
                  <div className="luggage-product-media">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="(max-width: 768px) 50vw, 20vw"
                      className="luggage-product-img"
                    />
                    <button
                      type="button"
                      className={`luggage-wishlist-btn ${isLiked ? "active" : ""}`}
                      onClick={(e) => toggleWishlist(item.id, e)}
                      aria-label="Add to wishlist"
                    >
                      <Heart size={15} fill={isLiked ? "#111" : "none"} strokeWidth={1.6} />
                    </button>
                  </div>
                  <div className="luggage-product-details">
                    <h3 className="luggage-product-name">{item.name}</h3>
                    <p className="luggage-product-price">{item.price}</p>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
}
