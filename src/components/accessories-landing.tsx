"use client";
import "@/components/page-styles/collection-landings.css";


import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ChevronLeft, ChevronRight, Heart } from "lucide-react";
import { useState } from "react";
import { useStore } from "./store-provider";

// ─── DATA ─────────────────────────────────────────────────────────────────────

const accessoryCategories = [
  {
    id: "travel",
    title: "Travel Accessories",
    sub: "For a more organised journey.",
    image: "/media/accessories-cat-travel.jpg",
    href: "/accessories/organisers",
  },
  {
    id: "tech",
    title: "Tech Accessories",
    sub: "Stay connected anywhere.",
    image: "/media/accessories-cat-tech.jpg",
    href: "/accessories/phone-cases",
  },
  {
    id: "packing",
    title: "Packing Essentials",
    sub: "Maximise every trip.",
    image: "/media/accessories-cat-packing.jpg",
    href: "/accessories/organisers",
  },
  {
    id: "all",
    title: "All Accessories",
    sub: "Explore the full collection.",
    image: "/media/accessories-cat-all.jpg",
    href: "/accessories?view=catalog",
  },
];

const iconicDetails = [
  {
    id: "premium-hardware",
    title: "Premium Hardware",
    desc: "Engineered for durability and a refined finish.",
    image: "/media/accessories-detail-hardware.jpg",
    href: "/accessories?view=catalog",
  },
  {
    id: "signature-materials",
    title: "Signature Materials",
    desc: "Selected for strength, style and timeless appeal.",
    image: "/media/accessories-detail-materials.jpg",
    href: "/accessories?material=Leather",
  },
  {
    id: "refined-functionality",
    title: "Refined Functionality",
    desc: "Thoughtful design in every detail.",
    image: "/media/accessories-detail-function.jpg",
    href: "/accessories?view=catalog",
  },
  {
    id: "smart-organisation",
    title: "Smart Organisation",
    desc: "Everything in its place, for a smoother journey.",
    image: "/media/accessories-detail-smart.jpg",
    href: "/accessories?category=Organisers",
  },
];

const bestSellers = [
  {
    id: "toiletry-pouch",
    name: "Toiletry Pouch",
    price: "₹1",
    image: "/media/accessories-prod-toiletry.jpg",
    href: "/products/never-still-leather-toiletry-bag-black",
  },
  {
    id: "tech-organiser",
    name: "Tech Organiser",
    price: "₹1",
    image: "/media/accessories-prod-tech.jpg",
    href: "/products/groove-leather-zipped-pouch-black",
  },
  {
    id: "luggage-tag",
    name: "Luggage Tag",
    price: "₹1",
    image: "/media/accessories-prod-tag.jpg",
    href: "/products/address-tag-leather-black",
  },
  {
    id: "water-bottle",
    name: "Water Bottle",
    price: "₹1",
    image: "/media/accessories-prod-bottle.jpg",
    href: "/products/travel-accessories-water-bottle-black",
  },
  {
    id: "packing-cube-set",
    name: "Packing Cube Set",
    price: "₹1",
    image: "/media/accessories-prod-cubes.jpg",
    href: "/products/travel-accessories-packing-cubes-set",
  },
];

export function AccessoriesLanding() {
  const [activeSlide, setActiveSlide] = useState(1);
  const { isWishlisted, toggleWishlist: storeToggleWishlist } = useStore();

  const handleToggleWishlist = (item: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const slug = item.href?.replace(/^\/products\//, "") || item.id;
    const numPrice =
      typeof item.price === "string"
        ? parseInt(item.price.replace(/[^0-9]/g, ""), 10) || 0
        : item.price;
    storeToggleWishlist(item.id || slug, {
      sku: item.id || slug,
      name: item.name,
      color: "Classic",
      slug,
      image: item.image,
      price: numPrice,
      available: true,
    });
  };

  return (
    <div className="accessories-landing-page">

      {/* ── 1. HERO BANNER: THE DETAILS MOVE WITH YOU ── */}
      <section className="accessories-hero-section">
        <div className="accessories-hero-media">
          <Image
            src="/media/category-accessories.jpg"
            alt="OVIA Accessories Collection - The details move with you"
            fill
            priority
            sizes="100vw"
            className="accessories-hero-img"
          />
          <div className="accessories-hero-overlay" />
        </div>

        <div className="accessories-hero-inner">
          <div className="accessories-hero-content">
            <p className="accessories-hero-eyebrow">ACCESSORIES COLLECTION</p>
            <h1 className="accessories-hero-title">
              The details<br />
              move with you
            </h1>
            <p className="accessories-hero-desc">
              Thoughtfully designed accessories to make<br />
              every journey smoother, more organised<br />
              and more personal.
            </p>
            <div className="accessories-hero-actions">
              <Link href="/accessories?view=catalog" className="accessories-btn-primary">
                EXPLORE ACCESSORIES <ArrowRight size={14} className="accessories-cta-icon" />
              </Link>
            </div>
          </div>

          <div className="accessories-hero-side-tags">
            <span>ORGANISE</span>
            <span>PROTECT</span>
            <span>PERSONALISE</span>
            <span>TRAVEL BETTER</span>
            <span className="accessories-tag-dash">——</span>
          </div>

          <div className="accessories-hero-bottom-bar">
            <div className="accessories-slide-indicators">
              <button
                type="button"
                className={`accessories-slide-dot ${activeSlide === 1 ? "active" : ""}`}
                onClick={() => setActiveSlide(1)}
              >
                01 <span>——</span>
              </button>
              <button
                type="button"
                className={`accessories-slide-dot ${activeSlide === 2 ? "active" : ""}`}
                onClick={() => setActiveSlide(2)}
              >
                02
              </button>
              <button
                type="button"
                className={`accessories-slide-dot ${activeSlide === 3 ? "active" : ""}`}
                onClick={() => setActiveSlide(3)}
              >
                03
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. EXPLORE ACCESSORIES / SHOP BY CATEGORY ── */}
      <section className="accessories-content-wrap accessories-cat-section">
        <div className="accessories-section-header">
          <div>
            <p className="accessories-section-eyebrow">EXPLORE ACCESSORIES</p>
            <h2 className="accessories-section-title">Shop by Category</h2>
          </div>
          <Link href="/accessories?view=catalog" className="accessories-header-link">
            VIEW ALL ACCESSORIES <ArrowRight size={13} />
          </Link>
        </div>

        <div className="accessories-grid-5">
          {accessoryCategories.map((item) => (
            <Link key={item.id} href={item.href} className="accessories-card-wrap">
              <div className="accessories-card-media">
                <></>
              </div>
              <div className="accessories-card-meta">
                <div>
                  <h3 className="accessories-card-title">{item.title}</h3>
                  <p className="accessories-card-sub">{item.sub}</p>
                </div>
                <span className="accessories-circle-arrow" aria-hidden="true">
                  <ArrowRight size={14} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── 3. FEATURED BANNER: TRAVEL ACCESSORIES ── */}
      <section className="accessories-content-wrap accessories-banner-section">
        <div className="accessories-banner-card">
          <div className="accessories-banner-bg">
            <Image
              src="/media/accessories-refined-journey.jpg"
              alt="OVIA Travel Accessories - A More Refined Journey"
              fill
              sizes="(max-width: 1440px) 100vw, 1440px"
              className="accessories-banner-img"
            />
            <div className="accessories-banner-overlay" />
          </div>

          <div className="accessories-banner-content">
            <p className="accessories-banner-eyebrow">A MORE REFINED JOURNEY</p>
            <h2 className="accessories-banner-title">
              TRAVEL<br />
              ACCESSORIES
            </h2>
            <p className="accessories-banner-desc">
              Designed to keep your essentials<br />
              protected, organised and within reach<br />
              wherever you go.
            </p>
            <Link href="/accessories/organisers" className="accessories-btn-primary banner-btn">
              EXPLORE TRAVEL ACCESSORIES <ArrowRight size={14} className="accessories-cta-icon" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 4. ICONIC DETAILS ── */}
      <section className="accessories-content-wrap accessories-details-section">
        <div className="accessories-section-header">
          <h2 className="accessories-section-title uppercase">ICONIC DETAILS</h2>
          <Link href="/accessories?view=catalog" className="accessories-header-link">
            VIEW ALL DETAILS <ArrowRight size={13} />
          </Link>
        </div>

        <div className="accessories-grid-4">
          {iconicDetails.map((mat) => (
            <Link key={mat.id} href={mat.href} className="accessories-detail-card">
              <div className="accessories-detail-media">
                <Image
                  src={mat.image}
                  alt={mat.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 25vw"
                  className="accessories-detail-img"
                />
              </div>
              <div className="accessories-detail-text">
                <h3 className="accessories-detail-title">{mat.title}</h3>
                <p className="accessories-detail-desc">{mat.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── 5. BRAND STORY BANNER: SMALL DETAILS. A BIGGER JOURNEY. ── */}
      <section className="accessories-story-section">
        <div className="accessories-story-media">
          <Image
            src="/media/accessories-story-banner.jpg"
            alt="Small details. A bigger journey."
            fill
            sizes="100vw"
            className="accessories-story-img"
          />
          <div className="accessories-story-overlay" />
        </div>

        <div className="accessories-story-inner">
          <p className="accessories-story-eyebrow">DESIGNED FOR EVERY DESTINATION</p>
          <h2 className="accessories-story-title">
            Small details.<br />
            A bigger journey.
          </h2>
          <div className="accessories-story-actions">
            <Link href="/discover" className="accessories-btn-primary banner-btn">
              EXPLORE THE STORY <ArrowRight size={14} className="accessories-cta-icon" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 6. BEST SELLERS ── */}
      <section className="accessories-content-wrap accessories-bestsellers-section">
        <div className="accessories-section-header">
          <h2 className="accessories-section-title uppercase">BEST SELLERS</h2>
          <Link href="/accessories?view=catalog" className="accessories-header-link">
            VIEW ALL <ArrowRight size={13} />
          </Link>
        </div>

        <div className="accessories-bestsellers-grid">
          {bestSellers.map((item) => {
            const isSaved = isWishlisted(item.id) || isWishlisted(item.href?.replace(/^\/products\//, ""));
            return (
              <div key={item.id} className="accessories-product-card">
                <Link href={item.href} className="accessories-product-anchor">
                  <div className="accessories-product-media">
                    <></>
                  </div>
                  <div className="accessories-product-details">
                    <h3 className="accessories-product-name">{item.name}</h3>
                    <p className="accessories-product-price">{item.price}</p>
                  </div>
                </Link>
                <button
                  type="button"
                  className={`accessories-wishlist-btn ${isSaved ? "active" : ""}`}
                  onClick={(e) => handleToggleWishlist(item, e)}
                  aria-label={isSaved ? "Remove from wishlist" : "Add to wishlist"}
                >
                  <Heart size={16} fill={isSaved ? "currentColor" : "none"} />
                </button>
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
}
