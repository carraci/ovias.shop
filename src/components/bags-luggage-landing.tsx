"use client";
import "@/components/page-styles/collection-landings.css";


import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { useState, useRef, useEffect } from "react";

// ─── LUGGAGE CATEGORIES ────────────────────────────────────────────────────────

interface LuggageCategoryGuide {
  id: string;
  name: string;
  href: string;
  count: number;
  image: string;
  tagline: string;
  subcategories: { label: string; href: string }[];
}

const luggageCategoriesGuide: LuggageCategoryGuide[] = [
  {
    id: "cabin",
    name: "Cabin",
    href: "/luggage/cabin",
    count: 19,
    image: "/media/bags/travel-accessories-cabin-luggage-harness-backpack.png",
    tagline: "Overhead-approved carry for short stays and spontaneous escapes.",
    subcategories: [
      { label: "All Cabin Luggage", href: "/luggage/cabin" },
      { label: "Original Cabin", href: "/products/original-cabin" },
      { label: "Classic Cabin", href: "/luggage/cabin?collection=Classic" },
      { label: "Aluminium Cabin", href: "/luggage/cabin?material=Aluminium" },
      { label: "Polycarbonate Cabin", href: "/luggage/cabin?material=Polycarbonate" },
    ],
  },
  {
    id: "check-in",
    name: "Check-In",
    href: "/luggage/check-in",
    count: 9,
    image: "/media/bags/never-still-leather-duffle-bag-large.png",
    tagline: "Space for a week away. Structured, considered, ready for longer horizons.",
    subcategories: [
      { label: "All Check-In Luggage", href: "/luggage/check-in" },
      { label: "Aluminium Check-In", href: "/luggage/check-in?material=Aluminium" },
      { label: "Polycarbonate Check-In", href: "/luggage/check-in?material=Polycarbonate" },
    ],
  },
  {
    id: "trunk",
    name: "Trunk",
    href: "/luggage/trunk",
    count: 8,
    image: "/media/bags/never-still-leather-duffle-bag-medium.png",
    tagline: "The ultimate travel companion for extended journeys and larger expeditions.",
    subcategories: [
      { label: "All Trunks", href: "/luggage/trunk" },
      { label: "Aluminium Trunks", href: "/luggage/trunk?material=Aluminium" },
      { label: "Leather Trunks", href: "/luggage/trunk?material=Leather" },
    ],
  },
];

// ─── FEATURED COLLECTIONS ──────────────────────────────────────────────────────

const featuredCollections = [
  {
    id: "never-still",
    label: "The Never Still Collection",
    description: "Canvas and leather silhouettes for the everyday explorer.",
    image: "/media/bags/never-still-canvas-flap-backpack-large.png",
    href: "/bags?collection=Never Still",
    tag: "BAGS",
  },
  {
    id: "original",
    label: "The Original Collection",
    description: "Iconic grooved aluminium crafted for a lifetime of travel.",
    image: "/media/bags/original-bag-aluminium-backpack.png",
    href: "/luggage?collection=Original",
    tag: "LUGGAGE",
  },
  {
    id: "groove",
    label: "The Groove Edit",
    description: "Structured leather crossbodies and pouches for refined daily carry.",
    image: "/media/bags/groove-leather-cross-body-bag-large.png",
    href: "/bags/crossbodies?collection=Groove",
    tag: "BAGS",
  },
  {
    id: "classic",
    label: "The Classic Collection",
    description: "Timeless aluminium hand-carry cases and briefcases built to last.",
    image: "/media/bags/classic-aluminium-grid-hand-carry-case.png",
    href: "/bags/hand-carry?collection=Classic",
    tag: "HAND CARRY",
  },
];

// ─── EDITORIAL SPLITS ─────────────────────────────────────────────────────────

const editorialSplits = [
  {
    id: "bags-editorial",
    eyebrow: "BAGS COLLECTION",
    headline: "Every bag tells a story.",
    body: "From the rigid structure of grooved aluminium briefcases to the easy drape of leather crossbodies — OVIA bags are designed for how you actually move through the world.",
    cta: { label: "Explore Bags", href: "/bags-guide" },
    image: "/media/editorial-bags.jpg",
    imageLeft: false,
  },
  {
    id: "luggage-editorial",
    eyebrow: "LUGGAGE COLLECTION",
    headline: "Built for every journey.",
    body: "Precision-engineered cases in aluminium and polycarbonate. TSA-approved locks. Smooth multi-wheel systems. Luggage that earns its place at every airport in the world.",
    cta: { label: "Explore Luggage", href: "/luggage" },
    image: "/media/category-luggage.jpg",
    imageLeft: true,
  },
];

// ─── HOOK: INTERSECTION REVEAL ────────────────────────────────────────────────

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = "1";
          el.style.transform = "translateY(0)";
          observer.unobserve(el);
        }
      },
      { threshold: 0.08 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

// ─── CATEGORY CARD ────────────────────────────────────────────────────────────

type AnyCategory = LuggageCategoryGuide;

function CategoryCard({
  cat,
  isHovered,
  onHover,
  onLeave,
}: {
  cat: AnyCategory;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
}) {
  const ref = useReveal();
  return (
    <div
      ref={ref}
      className={`blanding-category-card${isHovered ? " is-hovered" : ""}`}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      style={{ opacity: 0, transform: "translateY(24px)", transition: "opacity 0.65s ease, transform 0.65s ease" }}
    >
      <div className="blanding-card-media">
        <></>
        <div className="blanding-card-badge">{cat.count} PIECES</div>
      </div>
      <div className="blanding-card-info">
        <div className="blanding-card-header">
          <h3 className="blanding-card-title">{cat.name}</h3>
          <Link href={cat.href} className="blanding-card-link" aria-label={`View all ${cat.name}`}>
            <ArrowUpRight size={18} />
          </Link>
        </div>
        <p className="blanding-card-desc">{cat.tagline}</p>
        <div className="blanding-card-action">
          <Link href={cat.href} className="blanding-card-cta">
            <span>Explore {cat.name}</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
      <div
        className={`blanding-subcategories-overlay${isHovered ? " visible" : ""}`}
        aria-hidden={!isHovered}
      >
        <div className="blanding-subcategories-inner">
          <div className="blanding-subcategories-header">
            <span className="blanding-subcategories-name">{cat.name}</span>
            <span className="blanding-subcategories-count">{cat.count} pieces</span>
          </div>
          <p className="blanding-subcategories-hint">Browse by type:</p>
          <ul className="blanding-subcategories-list">
            {cat.subcategories.map((sub) => (
              <li key={sub.href}>
                <Link href={sub.href} className="blanding-subcategory-link">
                  <span>{sub.label}</span>
                  <ArrowRight size={13} className="sub-arrow" />
                </Link>
              </li>
            ))}
          </ul>
          <div className="blanding-subcategories-footer">
            <Link href={cat.href} className="blanding-all-btn">
              All {cat.name}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── EDITORIAL SPLIT ─────────────────────────────────────────────────────────

function EditorialSplit({ item }: { item: (typeof editorialSplits)[0] }) {
  const ref = useReveal();
  return (
    <div
      ref={ref}
      className={`blanding-editorial-split${item.imageLeft ? " image-left" : " image-right"}`}
      style={{ opacity: 0, transform: "translateY(28px)", transition: "opacity 0.7s ease, transform 0.7s ease" }}
    >
      <div className="blanding-editorial-text">
        <p className="eyebrow">{item.eyebrow}</p>
        <h2 className="blanding-editorial-headline">{item.headline}</h2>
        <p className="blanding-editorial-body">{item.body}</p>
        <Link href={item.cta.href} className="blanding-editorial-cta">
          {item.cta.label}
          <ArrowRight size={15} />
        </Link>
      </div>
      <div className="blanding-editorial-image-wrap">
        <Image
          src={item.image}
          alt={item.headline}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="blanding-editorial-img"
        />
        <div className="blanding-editorial-img-overlay" />
      </div>
    </div>
  );
}

// ─── COLLECTION CARD ─────────────────────────────────────────────────────────

function CollectionCard({ col, index }: { col: (typeof featuredCollections)[0]; index: number }) {
  const ref = useReveal();
  const delay = (index * 0.1).toFixed(2);
  return (
    <div
      ref={ref}
      style={{
        opacity: 0,
        transform: "translateY(20px)",
        transition: `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s`,
      }}
    >
      <Link href={col.href} className="blanding-col4-card">
        <div className="blanding-col4-media">
          <></>
        </div>
        <div className="blanding-col4-info">
          <span className="blanding-col4-tag">{col.tag}</span>
          <h3 className="blanding-col4-name">{col.label}</h3>
          <p className="blanding-col4-desc">{col.description}</p>
          <span className="blanding-col4-cta">
            Discover <ArrowRight size={13} />
          </span>
        </div>
      </Link>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export function BagsLuggageLanding() {
  const [hoveredLuggage, setHoveredLuggage] = useState<string | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const collectionsRef = useReveal();
  const luggageHeaderRef = useReveal();
  const statsRef = useReveal();

  // Parallax on hero scroll
  useEffect(() => {
    const hero = heroRef.current?.querySelector<HTMLElement>(".blanding-hero-bg");
    if (!hero) return;
    const onScroll = () => {
      hero.style.transform = `translateY(${window.scrollY * 0.18}px)`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="blanding-page">

      {/* ── HERO ── */}
      <div ref={heroRef} className="blanding-hero">
        <Image
          src="/media/editorial-bags.jpg"
          alt="OVIA Bags & Luggage"
          fill
          priority
          sizes="100vw"
          className="blanding-hero-bg"
        />
        <div className="blanding-hero-overlay" />
        <div className="blanding-hero-content">
          <p className="blanding-hero-eyebrow">OVIA — BAGS &amp; LUGGAGE</p>
          <h1 className="blanding-hero-headline">
            Space for the<br />
            <em>journey ahead.</em>
          </h1>
          <p className="blanding-hero-sub">
            Every piece in this collection begins with a single idea — the right bag makes every journey feel effortless.
          </p>
          <div className="blanding-hero-actions">
            <Link href="/bags-guide" className="blanding-hero-btn primary">Shop Bags</Link>
            <Link href="/luggage" className="blanding-hero-btn secondary">Shop Luggage</Link>
          </div>
        </div>
        <div className="blanding-hero-scroll" aria-hidden="true">
          <span />
        </div>
      </div>

      {/* ── INTRO ROW ── */}
      <div className="blanding-intro-row">
        <p className="breadcrumb">Home / Bags &amp; Luggage</p>
        <div
          ref={statsRef}
          className="blanding-stats"
          style={{ opacity: 0, transform: "translateY(20px)", transition: "opacity 0.6s ease, transform 0.6s ease" }}
        >
          <div className="blanding-stat">
            <span className="blanding-stat-num">6</span>
            <span className="blanding-stat-label">Bag silhouettes</span>
          </div>
          <div className="blanding-stat-divider" />
          <div className="blanding-stat">
            <span className="blanding-stat-num">3</span>
            <span className="blanding-stat-label">Luggage sizes</span>
          </div>
          <div className="blanding-stat-divider" />
          <div className="blanding-stat">
            <span className="blanding-stat-num">70+</span>
            <span className="blanding-stat-label">Pieces in total</span>
          </div>
        </div>
      </div>

      {/* ── FEATURED COLLECTIONS ── */}
      <section className="blanding-col4-section">
        <div
          ref={collectionsRef}
          className="blanding-col4-header"
          style={{ opacity: 0, transform: "translateY(20px)", transition: "opacity 0.6s ease, transform 0.6s ease" }}
        >
          <p className="eyebrow">FEATURED COLLECTIONS</p>
          <h2 className="blanding-section-title">The edit right now.</h2>
        </div>
        <div className="blanding-col4-grid">
          {featuredCollections.map((col, i) => (
            <CollectionCard key={col.id} col={col} index={i} />
          ))}
        </div>
      </section>

      {/* ── EDITORIAL SPLITS ── */}
      <section className="blanding-editorial-section">
        {editorialSplits.map((item) => (
          <EditorialSplit key={item.id} item={item} />
        ))}
      </section>



      {/* ── LUGGAGE SECTION ── */}
      <section className="blanding-department-section blanding-luggage-section">
        <div
          ref={luggageHeaderRef}
          className="blanding-department-header"
          style={{ opacity: 0, transform: "translateY(20px)", transition: "opacity 0.6s ease, transform 0.6s ease" }}
        >
          <div className="blanding-dept-title-row">
            <div>
              <p className="eyebrow">LUGGAGE</p>
              <h2 className="blanding-section-title">Built for the distance.</h2>
              <p className="blanding-dept-intro">
                Three sizes. Infinite journeys. Choose your case by trip length, or let the material speak for itself.
              </p>
            </div>
            <Link href="/luggage" className="blanding-dept-view-all">
              View all luggage <ArrowRight size={15} />
            </Link>
          </div>
        </div>
        <div className="blanding-category-grid blanding-luggage-grid">
          {luggageCategoriesGuide.map((cat) => (
            <CategoryCard
              key={cat.id}
              cat={cat}
              isHovered={hoveredLuggage === cat.id}
              onHover={() => setHoveredLuggage(cat.id)}
              onLeave={() => setHoveredLuggage(null)}
            />
          ))}
        </div>
        <div className="blanding-size-guide-cta">
          <p className="blanding-size-guide-text">Not sure which size to choose?</p>
          <Link href="/size-guide" className="blanding-size-guide-link">
            See the size guide <ArrowUpRight size={14} />
          </Link>
        </div>
      </section>

      {/* ── BOTTOM BANNER ── */}
      <section className="blanding-bottom-banner">
        <Image
          src="/media/editorial-collection.jpg"
          alt="The OVIA collection"
          fill
          sizes="100vw"
          className="blanding-bottom-banner-img"
        />
        <div className="blanding-bottom-banner-overlay" />
        <div className="blanding-bottom-banner-content">
          <p className="eyebrow" style={{ color: "rgba(255,255,255,0.7)" }}>THE OVIA COLLECTION</p>
          <h2 className="blanding-bottom-banner-headline">
            One collection.<br />Every journey.
          </h2>
          <div className="blanding-bottom-banner-actions">
            <Link href="/new" className="blanding-hero-btn" style={{ background: "var(--canvas)", color: "var(--ink)", borderColor: "var(--canvas)" }}>
              New Arrivals
            </Link>
            <Link href="/search" className="blanding-hero-btn" style={{ color: "#fff", borderColor: "rgba(255,255,255,0.4)" }}>
              Explore All
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
