"use client";

import { useRef, useState, useEffect, MouseEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, ChevronLeft, ArrowUpRight } from "lucide-react";

export interface ProductVariant {
  name: string;
  hex: string;
  image: string;
}

export interface IconicProductItem {
  id: string;
  name: string;
  category: string;
  price: string;
  variants: ProductVariant[];
  moreColorsCount?: number;
  href: string;
}

// ============================================================================
// 1. HERO SUITCASES & ICONIC TRAVEL HARDWARE (20 PRODUCTS)
// ============================================================================
const iconicProducts: IconicProductItem[] = [
  {
    id: "classic-cabin-1",
    name: "Classic Cabin",
    category: "Aluminium Luggage",
    price: "₹95,000",
    variants: [
      { name: "Silver", hex: "#d0d2d3", image: "/media/showcase/iconic-1-classic-cabin.png" },
      { name: "Matte Black", hex: "#1a1a1a", image: "/media/showcase/like-3-original-black.png" },
      { name: "Titanium", hex: "#9a8c78", image: "/media/showcase/iconic-3-classic-checkin.png" },
    ],
    href: "/products/passage-cabin",
  },
  {
    id: "original-bag-backpack",
    name: "Original Bag - Aluminium Backpack",
    category: "Hard Shell Backpack",
    price: "₹1,15,000",
    variants: [
      { name: "Matte Black", hex: "#1c1c1c", image: "/media/showcase/iconic-2-original-bag.png" },
      { name: "Silver", hex: "#d0d2d3", image: "/media/showcase/like-4-original-crossbody.png" },
    ],
    href: "/products/meridian-cabin",
  },
  {
    id: "classic-check-in-l",
    name: "Classic Check-In L",
    category: "Check-In Suitcase",
    price: "₹1,28,000",
    variants: [
      { name: "Matte Black", hex: "#242424", image: "/media/showcase/iconic-3-classic-checkin.png" },
      { name: "Silver", hex: "#d0d2d3", image: "/media/showcase/iconic-1-classic-cabin.png" },
      { name: "Warm Titanium", hex: "#827563", image: "/media/showcase/like-1-classic-cabin.png" },
    ],
    href: "/products/forma-check-in",
  },
  {
    id: "original-cabin-navy",
    name: "Original Cabin",
    category: "Cabin Suitcase",
    price: "₹92,000",
    variants: [
      { name: "Marine Blue", hex: "#213247", image: "/media/showcase/iconic-4-original-cabin.png" },
      { name: "Silver", hex: "#d0d2d3", image: "/media/showcase/iconic-1-classic-cabin.png" },
    ],
    href: "/products/interval-cabin",
  },
  {
    id: "meridian-cabin-silver",
    name: "Meridian Cabin",
    category: "Essential Polycarbonate",
    price: "₹65,000",
    variants: [
      { name: "Silver Gloss", hex: "#d0d2d3", image: "/media/showcase/like-1-classic-cabin.png" },
      { name: "Gloss Black", hex: "#1a1a1a", image: "/media/showcase/like-3-original-black.png" },
    ],
    href: "/products/meridian-cabin",
  },
  {
    id: "original-check-in-l",
    name: "Original Check-In L",
    category: "Aluminium Check-In",
    price: "₹1,32,000",
    variants: [
      { name: "Matte Black", hex: "#1c1c1c", image: "/media/showcase/like-3-original-black.png" },
      { name: "Silver", hex: "#d0d2d3", image: "/media/showcase/like-1-classic-cabin.png" },
      { name: "Titanium", hex: "#998a76", image: "/media/showcase/iconic-3-classic-checkin.png" },
    ],
    href: "/products/forma-check-in",
  },
  {
    id: "forma-trunk-plus",
    name: "Forma Trunk Plus",
    category: "Deep Storage Trunk",
    price: "₹1,48,000",
    variants: [
      { name: "Titanium Bronze", hex: "#9a8c78", image: "/media/showcase/iconic-3-classic-checkin.png" },
      { name: "Silver Aluminium", hex: "#d0d2d3", image: "/media/showcase/iconic-1-classic-cabin.png" },
      { name: "Matte Black", hex: "#1a1a1a", image: "/media/showcase/like-3-original-black.png" },
    ],
    href: "/products/forma-trunk",
  },
  {
    id: "passage-cabin-plus",
    name: "Passage Cabin Plus",
    category: "High-Capacity Cabin",
    price: "₹98,000",
    variants: [
      { name: "Silver", hex: "#d0d2d3", image: "/media/showcase/like-1-classic-cabin.png" },
      { name: "Onyx Black", hex: "#1c1c1c", image: "/media/showcase/iconic-2-original-bag.png" },
    ],
    href: "/products/passage-cabin",
  },
  {
    id: "essential-check-in-green",
    name: "Essential Check-In L",
    category: "Polycarbonate Check-In",
    price: "₹88,000",
    variants: [
      { name: "Cedar Green", hex: "#1c3829", image: "/media/showcase/like-2-essential-green.png" },
      { name: "Gloss Black", hex: "#1a1a1a", image: "/media/showcase/like-3-original-black.png" },
      { name: "Pure White", hex: "#ffffff", image: "/media/showcase/like-4-original-crossbody.png" },
    ],
    moreColorsCount: 3,
    href: "/products/meridian-check-in",
  },
  {
    id: "interval-pilot-case",
    name: "Interval Pilot Case",
    category: "Compact Rolling Case",
    price: "₹85,000",
    variants: [
      { name: "Silver Aluminium", hex: "#d0d2d3", image: "/media/showcase/iconic-1-classic-cabin.png" },
      { name: "Matte Black", hex: "#1a1a1a", image: "/media/showcase/like-3-original-black.png" },
    ],
    href: "/products/interval-cabin",
  },
  {
    id: "meridian-check-in-plus",
    name: "Meridian Check-In Plus",
    category: "Extended Travel Suitcase",
    price: "₹1,22,000",
    variants: [
      { name: "Onyx Black", hex: "#1c1c1c", image: "/media/showcase/like-3-original-black.png" },
      { name: "Silver Aluminium", hex: "#d0d2d3", image: "/media/showcase/iconic-3-classic-checkin.png" },
    ],
    href: "/products/meridian-check-in",
  },
  {
    id: "classic-trunk-silver",
    name: "Classic Trunk Heritage",
    category: "Heritage Aluminium Trunk",
    price: "₹1,55,000",
    variants: [
      { name: "Silver", hex: "#d0d2d3", image: "/media/showcase/iconic-1-classic-cabin.png" },
      { name: "Bronze Tone", hex: "#8c7e6c", image: "/media/showcase/iconic-3-classic-checkin.png" },
    ],
    href: "/products/passage-trunk",
  },
  {
    id: "forma-cabin-edition",
    name: "Forma Cabin Edition",
    category: "Grooved Aluminium Edition",
    price: "₹1,05,000",
    variants: [
      { name: "Matte Black", hex: "#1a1a1a", image: "/media/showcase/iconic-2-original-bag.png" },
      { name: "Gunmetal", hex: "#464744", image: "/media/showcase/iconic-4-original-cabin.png" },
    ],
    href: "/products/forma-cabin",
  },
  {
    id: "essential-cabin-cedar",
    name: "Essential Cabin Polycarbonate",
    category: "Ultra-Lightweight Cabin",
    price: "₹62,000",
    variants: [
      { name: "Cedar Green", hex: "#1c3829", image: "/media/showcase/like-2-essential-green.png" },
      { name: "Pure White", hex: "#ffffff", image: "/media/showcase/like-4-original-crossbody.png" },
      { name: "Gloss Black", hex: "#1a1a1a", image: "/media/showcase/like-3-original-black.png" },
    ],
    href: "/products/interval-cabin",
  },
  {
    id: "original-trunk-large",
    name: "Original Trunk XL",
    category: "Expedition Aluminium Trunk",
    price: "₹1,68,000",
    variants: [
      { name: "Titanium", hex: "#9a8c78", image: "/media/showcase/iconic-3-classic-checkin.png" },
      { name: "Silver Aluminium", hex: "#d0d2d3", image: "/media/showcase/like-1-classic-cabin.png" },
    ],
    href: "/products/forma-trunk",
  },
  {
    id: "passage-check-in-l",
    name: "Passage Check-In L",
    category: "Precision Travel Suitcase",
    price: "₹1,25,000",
    variants: [
      { name: "Silver", hex: "#d0d2d3", image: "/media/showcase/like-1-classic-cabin.png" },
      { name: "Matte Black", hex: "#1c1c1c", image: "/media/showcase/like-3-original-black.png" },
    ],
    href: "/products/passage-check-in",
  },
  {
    id: "interval-cabin-marine",
    name: "Interval Cabin Deep Marine",
    category: "Anodized Nautical Edition",
    price: "₹94,000",
    variants: [
      { name: "Marine Blue", hex: "#213247", image: "/media/showcase/iconic-4-original-cabin.png" },
      { name: "Silver", hex: "#d0d2d3", image: "/media/showcase/iconic-1-classic-cabin.png" },
    ],
    href: "/products/interval-cabin",
  },
  {
    id: "meridian-trunk-poly",
    name: "Meridian Trunk Light",
    category: "Lightweight High Volume",
    price: "₹1,18,000",
    variants: [
      { name: "Gloss Black", hex: "#1a1a1a", image: "/media/showcase/like-3-original-black.png" },
      { name: "Cedar Green", hex: "#1c3829", image: "/media/showcase/like-2-essential-green.png" },
    ],
    href: "/products/meridian-trunk",
  },
  {
    id: "classic-cabin-bronze",
    name: "Classic Cabin Desert Gold",
    category: "Limited Anodized Edition",
    price: "₹1,12,000",
    variants: [
      { name: "Warm Bronze", hex: "#8c7e6c", image: "/media/showcase/iconic-3-classic-checkin.png" },
      { name: "Silver", hex: "#d0d2d3", image: "/media/showcase/iconic-1-classic-cabin.png" },
    ],
    href: "/products/passage-cabin",
  },
  {
    id: "forma-check-in-plus",
    name: "Forma Check-In Plus",
    category: "High-Performance Check-In",
    price: "₹1,36,000",
    variants: [
      { name: "Matte Black", hex: "#1c1c1c", image: "/media/showcase/iconic-3-classic-checkin.png" },
      { name: "Silver", hex: "#d0d2d3", image: "/media/showcase/like-1-classic-cabin.png" },
    ],
    href: "/products/forma-check-in",
  },
];

// ============================================================================
// 2. RECOMMENDED BAGS, BACKPACKS & ACCESSORIES (20 PRODUCTS)
// ============================================================================
const youMayAlsoLikeProducts: IconicProductItem[] = [
  {
    id: "never-still-flap-backpack",
    name: "Never Still - Leather Flap Backpack Small",
    category: "Canvas & Leather",
    price: "₹72,000",
    variants: [
      { name: "Desert Sand", hex: "#a59685", image: "/media/showcase/iconic-5-never-still-backpack.png" },
      { name: "Cedar Green", hex: "#263329", image: "/media/showcase/like-2-essential-green.png" },
    ],
    href: "/products/meridian-backpack",
  },
  {
    id: "like-crossbody-19",
    name: "Original Bag - Aluminium Cross-Body Bag 19",
    category: "Crossbody Clutch",
    price: "₹78,000",
    variants: [
      { name: "Silver Aluminium", hex: "#d0d2d3", image: "/media/showcase/like-4-original-crossbody.png" },
      { name: "Matte Black", hex: "#1c1c1c", image: "/media/showcase/iconic-2-original-bag.png" },
    ],
    href: "/products/forma-crossbody",
  },
  {
    id: "like-interval-backpack",
    name: "Interval Backpack",
    category: "Waterproof Canvas",
    price: "₹48,000",
    variants: [
      { name: "Forest Moss", hex: "#596450", image: "/media/showcase/iconic-5-never-still-backpack.png" },
      { name: "Deep Khaki", hex: "#263329", image: "/media/showcase/like-2-essential-green.png" },
    ],
    href: "/products/interval-backpack",
  },
  {
    id: "like-foldable-backpack",
    name: "Travel Accessories Foldable Backpack",
    category: "Ultra-Light Nylon",
    price: "₹18,500",
    variants: [
      { name: "Onyx Black", hex: "#1a1a1a", image: "/media/showcase/like-5-foldable-backpack.png" },
    ],
    href: "/products/meridian-backpack",
  },
  {
    id: "passage-weekender-duffle",
    name: "Passage Weekender Duffle",
    category: "Full-Grain Leather & Canvas",
    price: "₹68,000",
    variants: [
      { name: "Dune Canvas", hex: "#b5a58b", image: "/media/showcase/iconic-5-never-still-backpack.png" },
      { name: "Noir", hex: "#1c1c1c", image: "/media/showcase/like-5-foldable-backpack.png" },
    ],
    href: "/products/passage-weekender",
  },
  {
    id: "forma-briefcase-aluminium",
    name: "Forma Aluminium Briefcase",
    category: "Hard Shell Attache",
    price: "₹92,000",
    variants: [
      { name: "Silver", hex: "#d0d2d3", image: "/media/showcase/like-4-original-crossbody.png" },
      { name: "Matte Black", hex: "#1a1a1a", image: "/media/showcase/iconic-2-original-bag.png" },
    ],
    href: "/products/forma-briefcase",
  },
  {
    id: "meridian-tote-bag",
    name: "Meridian Everyday Tote",
    category: "Structured Italian Canvas",
    price: "₹42,000",
    variants: [
      { name: "Sand", hex: "#b5a58b", image: "/media/showcase/iconic-5-never-still-backpack.png" },
      { name: "Midnight Blue", hex: "#384c5c", image: "/media/showcase/iconic-4-original-cabin.png" },
    ],
    href: "/products/meridian-tote",
  },
  {
    id: "interval-crossbody-mini",
    name: "Interval Sling Crossbody",
    category: "Technical Water-Repellent",
    price: "₹34,000",
    variants: [
      { name: "Forest", hex: "#596450", image: "/media/showcase/like-2-essential-green.png" },
      { name: "Onyx", hex: "#1a1a1a", image: "/media/showcase/like-5-foldable-backpack.png" },
    ],
    href: "/products/interval-crossbody",
  },
  {
    id: "never-still-weekender",
    name: "Never Still Weekender Bag",
    category: "Large Travel Duffle",
    price: "₹76,000",
    variants: [
      { name: "Desert Sand", hex: "#a59685", image: "/media/showcase/iconic-5-never-still-backpack.png" },
      { name: "Matte Black", hex: "#1a1a1a", image: "/media/showcase/like-5-foldable-backpack.png" },
    ],
    href: "/products/meridian-weekender",
  },
  {
    id: "artist-case-limited",
    name: "Artisan Travel Case",
    category: "Bespoke Atelier Case",
    price: "₹88,000",
    variants: [
      { name: "Silver Aluminium", hex: "#d0d2d3", image: "/media/showcase/like-4-original-crossbody.png" },
      { name: "Matte Black", hex: "#1c1c1c", image: "/media/showcase/iconic-2-original-bag.png" },
    ],
    href: "/products/forma-crossbody",
  },
  {
    id: "leather-passport-cover",
    name: "Heritage Leather Passport Holder",
    category: "Calfskin Travel Accessory",
    price: "₹14,500",
    variants: [
      { name: "Espresso Brown", hex: "#543d2b", image: "/media/showcase/iconic-5-never-still-backpack.png" },
      { name: "Onyx", hex: "#1a1a1a", image: "/media/showcase/like-5-foldable-backpack.png" },
    ],
    href: "/products/meridian-accessory",
  },
  {
    id: "foldable-travel-tote",
    name: "Packable Cabin Tote",
    category: "Compact Ripstop Travel Bag",
    price: "₹16,000",
    variants: [
      { name: "Midnight", hex: "#213247", image: "/media/showcase/iconic-4-original-cabin.png" },
      { name: "Olive", hex: "#596450", image: "/media/showcase/like-2-essential-green.png" },
    ],
    href: "/products/passage-tote",
  },
  {
    id: "interval-duffle-bag",
    name: "Interval 48H Duffle",
    category: "Ballistic Nylon & Saddle Leather",
    price: "₹58,000",
    variants: [
      { name: "Forest", hex: "#596450", image: "/media/showcase/like-2-essential-green.png" },
      { name: "Onyx", hex: "#1a1a1a", image: "/media/showcase/like-5-foldable-backpack.png" },
    ],
    href: "/products/interval-weekender",
  },
  {
    id: "meridian-briefcase-leather",
    name: "Meridian Executive Briefcase",
    category: "Full-Grain Business Case",
    price: "₹74,000",
    variants: [
      { name: "Black", hex: "#1c1c1c", image: "/media/showcase/iconic-2-original-bag.png" },
      { name: "Chestnut", hex: "#8c7e6c", image: "/media/showcase/iconic-5-never-still-backpack.png" },
    ],
    href: "/products/meridian-briefcase",
  },
  {
    id: "passage-crossbody-bag",
    name: "Passage Flap Crossbody",
    category: "Minimalist City Bag",
    price: "₹38,000",
    variants: [
      { name: "Cedar Green", hex: "#1c3829", image: "/media/showcase/like-2-essential-green.png" },
      { name: "Sand", hex: "#b5a58b", image: "/media/showcase/iconic-5-never-still-backpack.png" },
    ],
    href: "/products/passage-crossbody",
  },
  {
    id: "leather-travel-organizer",
    name: "Multi-Zip Travel Tech Folio",
    category: "Italian Calfskin Folio",
    price: "₹24,000",
    variants: [
      { name: "Onyx Black", hex: "#1a1a1a", image: "/media/showcase/like-5-foldable-backpack.png" },
    ],
    href: "/products/meridian-accessory",
  },
  {
    id: "classic-cabin-companion",
    name: "Classic Cabin Companion Case",
    category: "Hand-Carry Case",
    price: "₹82,000",
    variants: [
      { name: "Silver", hex: "#d0d2d3", image: "/media/showcase/like-4-original-crossbody.png" },
      { name: "Matte Black", hex: "#1c1c1c", image: "/media/showcase/iconic-2-original-bag.png" },
    ],
    href: "/products/passage-cabin",
  },
  {
    id: "essential-cosmetic-case",
    name: "Vanity Travel Case",
    category: "Protective Hard Shell Beauty Case",
    price: "₹44,000",
    variants: [
      { name: "Silver Gloss", hex: "#d0d2d3", image: "/media/showcase/like-4-original-crossbody.png" },
      { name: "Cedar Green", hex: "#1c3829", image: "/media/showcase/like-2-essential-green.png" },
    ],
    href: "/products/interval-crossbody",
  },
  {
    id: "never-still-backpack-large",
    name: "Never Still Backpack Large",
    category: "Laptop Travel Backpack",
    price: "₹84,000",
    variants: [
      { name: "Desert Sand", hex: "#a59685", image: "/media/showcase/iconic-5-never-still-backpack.png" },
      { name: "Noir", hex: "#1c1c1c", image: "/media/showcase/iconic-2-original-bag.png" },
    ],
    href: "/products/meridian-backpack",
  },
  {
    id: "passage-messenger-bag",
    name: "Passage Urban Messenger",
    category: "Waterproof Canvas Messenger",
    price: "₹52,000",
    variants: [
      { name: "Onyx", hex: "#1a1a1a", image: "/media/showcase/like-5-foldable-backpack.png" },
      { name: "Dune", hex: "#b5a58b", image: "/media/showcase/iconic-5-never-still-backpack.png" },
    ],
    href: "/products/passage-briefcase",
  },
];

interface InteractiveCardProps {
  item: IconicProductItem;
}

function InteractiveProductCard({ item }: InteractiveCardProps) {
  const [activeVariantIndex, setActiveVariantIndex] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const activeVariant = item.variants[activeVariantIndex] || item.variants[0];

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateY = ((x - centerX) / centerX) * 6;
    const rotateX = -((y - centerY) / centerY) * 6;

    setRotate({ x: rotateX, y: rotateY });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotate({ x: 0, y: 0 });
  };

  return (
    <div
      ref={cardRef}
      className={`iconic-product-card-interactive ${isHovered ? "is-hovered" : ""}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg) translateY(${isHovered ? "-4px" : "0px"})`,
      }}
    >
      <Link href={item.href} className="iconic-product-card-link" aria-label={`View ${item.name}`}>
        <div className="iconic-product-image-box">
          <div className="iconic-image-transform-container">
            <Image
              src={activeVariant.image}
              alt={`${item.name} - ${activeVariant.name}`}
              width={260}
              height={260}
              className="iconic-product-img-interactive"
              priority={false}
            />
          </div>

          <div className="iconic-hover-pill">
            <span>Explore Piece</span>
            <ArrowUpRight size={13} />
          </div>
        </div>

        <div className="iconic-product-meta">
          <p className="iconic-product-name">{item.name}</p>
          <p className="iconic-product-price">{item.price}</p>
        </div>
      </Link>

      <div className="iconic-variant-selection-bar">
        <div className="iconic-swatches-row">
          {item.variants.map((v, idx) => {
            const isSelected = idx === activeVariantIndex;
            return (
              <button
                type="button"
                key={v.name + idx}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setActiveVariantIndex(idx);
                }}
                onMouseEnter={() => setActiveVariantIndex(idx)}
                className={`iconic-swatch-dot-interactive ${isSelected ? "is-active" : ""}`}
                style={{ backgroundColor: v.hex }}
                title={`${v.name}`}
                aria-label={`Select ${v.name}`}
              />
            );
          })}
          {item.moreColorsCount && (
            <span className="iconic-swatch-more">+{item.moreColorsCount}</span>
          )}
        </div>
        <span className="iconic-active-variant-label">{activeVariant.name}</span>
      </div>
    </div>
  );
}

interface ProductSliderProps {
  title: string;
  items: IconicProductItem[];
}

export function ProductRowSlider({ title, items }: ProductSliderProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (!rowRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (!rowRef.current) return;
    const scrollAmount = rowRef.current.clientWidth * 0.75;
    rowRef.current.scrollBy({
      left: direction === "right" ? scrollAmount : -scrollAmount,
      behavior: "smooth",
    });
    setTimeout(checkScroll, 350);
  };

  return (
    <section className="iconic-row-section full-width-slider" aria-label={title}>
      <div className="iconic-row-header">
        <h2 className="iconic-row-title">{title}</h2>
      </div>

      <div className="iconic-row-viewport-wrapper">
        {canScrollLeft && (
          <button
            type="button"
            className="iconic-row-nav-btn prev"
            onClick={() => scroll("left")}
            aria-label={`Scroll ${title} left`}
          >
            <ChevronLeft size={18} strokeWidth={1.5} />
          </button>
        )}

        <div
          ref={rowRef}
          className="iconic-row-scroll-track"
          onScroll={checkScroll}
        >
          {items.map((item) => (
            <InteractiveProductCard key={item.id} item={item} />
          ))}
        </div>

        {canScrollRight && (
          <button
            type="button"
            className="iconic-row-nav-btn next"
            onClick={() => scroll("right")}
            aria-label={`Scroll ${title} right`}
          >
            <ChevronRight size={18} strokeWidth={1.5} />
          </button>
        )}
      </div>
    </section>
  );
}

export function IconicAndRecommendedSections() {
  return (
    <div className="iconic-showcase-container">
      {/* 1. Full-width Section: ICONIC PRODUCTS (20 pieces) */}
      <ProductRowSlider title="ICONIC PRODUCTS" items={iconicProducts} />

      {/* 2. Full-width Section: YOU MAY ALSO LIKE (20 pieces) */}
      <ProductRowSlider title="YOU MAY ALSO LIKE" items={youMayAlsoLikeProducts} />
    </div>
  );
}
