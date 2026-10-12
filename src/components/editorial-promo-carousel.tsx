"use client";
import "@/components/page-styles/editorial.css";


import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface EditorialSlide {
  id: string;
  category: string;
  imagePosition: "left" | "right";
  image: string;
  imageAlt: string;
  headlineTop: string;
  headlineBottom: string;
  description: string;
  ctaText: string;
  ctaHref: string;
}

const slides: EditorialSlide[] = [
  {
    id: "events",
    category: "EVENTS",
    imagePosition: "left",
    image: "/media/editorial-events.jpg",
    imageAlt: "OVIA Private Preview & Exhibition Event",
    headlineTop: "OVIA",
    headlineBottom: "PRIVATE EVENTS",
    description:
      "Discover OVIA through curated launches, private previews and experiences created around travel, design and craftsmanship.",
    ctaText: "EXPLORE EVENTS",
    ctaHref: "/contact-us",
  },
  {
    id: "collection",
    category: "COLLECTION",
    imagePosition: "right",
    image: "/media/editorial-collection.jpg",
    imageAlt: "The New OVIA Collection Still Life",
    headlineTop: "THE NEW",
    headlineBottom: "COLLECTION",
    description:
      "A new expression of movement. Designed for everyday journeys and destinations beyond.",
    ctaText: "DISCOVER THE COLLECTION",
    ctaHref: "/collections/signature-pieces",
  },
  {
    id: "bags",
    category: "BAGS",
    imagePosition: "left",
    image: "/media/editorial-bags.jpg",
    imageAlt: "OVIA Handbags and Travel Pieces in Italy",
    headlineTop: "BAGS FOR",
    headlineBottom: "EVERY JOURNEY",
    description:
      "From structured everyday pieces to effortless travel companions, discover bags designed around the way you move.",
    ctaText: "EXPLORE BAGS",
    ctaHref: "/bags",
  },
  {
    id: "style",
    category: "STYLE",
    imagePosition: "right",
    image: "/media/editorial-style.jpg",
    imageAlt: "The OVIA Style Edit Airport Editorial",
    headlineTop: "THE OVIA",
    headlineBottom: "STYLE EDIT",
    description:
      "Explore considered combinations of bags, accessories and travel pieces selected for different moments and destinations.",
    ctaText: "EXPLORE THE EDIT",
    ctaHref: "/journal/a-considered-carry",
  },
  {
    id: "new-arrivals",
    category: "PRODUCT",
    imagePosition: "left",
    image: "/media/spaces.jpg",
    imageAlt: "OVIA New Arrivals Architectural Collection",
    headlineTop: "NEW",
    headlineBottom: "ARRIVALS",
    description:
      "Meet the latest additions to OVIA—new silhouettes, materials, colours and travel essentials.",
    ctaText: "SHOP NEW ARRIVALS",
    ctaHref: "/new",
  },
];

export function EditorialPromoCarousel() {
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const total = slides.length;
  const goToSlide = useCallback((index: number) => {
    setCurrent((index + total) % total);
  }, [total]);
  const nextSlide = () => goToSlide(current + 1);
  const prevSlide = () => goToSlide(current - 1);
  // Touch swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
    touchStartX.current = null;
  };

  const slide = slides[current];


  return (
    <section

      className="editorial-promo-section"
      aria-label="Editorial promotional features"
      onKeyDown={(event) => {
        if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
          event.preventDefault();
          goToSlide(current + (event.key === "ArrowRight" ? 1 : -1));
        }
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="editorial-promo-card img-left">
        <div className="editorial-promo-visual editorial-image-accordion" aria-label="Choose an editorial feature">
          {slides.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={`editorial-accordion-panel ${current === index ? "is-active" : ""}`}
              aria-label={`Show ${item.category.toLowerCase()} feature`}
              aria-pressed={current === index}
              onPointerEnter={(event) => { if (event.pointerType === "mouse") goToSlide(index); }}
              onFocus={() => goToSlide(index)}
              onClick={() => goToSlide(index)}
            >
              <Image src={item.image} alt={item.imageAlt} fill sizes="(max-width: 900px) 80vw, 40vw" className="editorial-accordion-image" />
              <span className="editorial-accordion-label">{item.category}</span>
            </button>
          ))}
        </div>
        {/* CONTENT SIDE */}
        <div className="editorial-promo-content">
          <div className="editorial-promo-inner">
            {/* LARGE EDITORIAL ARROW ABOVE HEADLINE */}
            <div className="editorial-arrow-glyph" aria-hidden="true">
              <svg
                width="36"
                height="22"
                viewBox="0 0 36 22"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M0 11H33M33 11L23 1M33 11L23 21"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            {/* HEADLINE */}
            <h2 className="editorial-promo-headline">
              <span>{slide.headlineTop}</span>
              <span>{slide.headlineBottom}</span>
            </h2>

            {/* DESCRIPTION */}
            <p className="editorial-promo-desc">{slide.description}</p>

            {/* ROUNDED PILL CTA BUTTON */}
            <div className="editorial-promo-cta-box">
              <Link href={slide.ctaHref} className="editorial-pill-btn">
                <span>{slide.ctaText}</span>
                <span className="editorial-pill-arrow">→</span>
              </Link>
            </div>
          </div>

          {/* EDITORIAL BOTTOM NAVIGATION */}
          <div className="editorial-promo-nav">
            <span className="editorial-counter">
              {String(current + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
            </span>
            <div className="editorial-nav-arrows">
              <button
                type="button"
                onClick={prevSlide}
                className="editorial-nav-btn"
                aria-label="Previous editorial feature"
              >
                <ArrowLeft size={18} strokeWidth={1.5} />
              </button>
              <button
                type="button"
                onClick={nextSlide}
                className="editorial-nav-btn"
                aria-label="Next editorial feature"
              >
                <ArrowRight size={18} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


