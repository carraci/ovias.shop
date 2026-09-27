"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { useState } from "react";

export interface BagCategoryGuide {
  id: string;
  name: string;
  href: string;
  count: number;
  image: string;
  tagline: string;
  subcategories: {
    label: string;
    href: string;
  }[];
}

export const bagCategoriesGuide: BagCategoryGuide[] = [
  {
    id: "backpacks",
    name: "Backpacks",
    href: "/bags/backpacks",
    count: 7,
    image: "/media/bags/original-bag-aluminium-backpack.png",
    tagline: "Everyday utility, flap, zipped and harness silhouettes.",
    subcategories: [
      { label: "All Backpacks", href: "/bags/backpacks" },
      { label: "Flap Backpacks", href: "/bags/backpacks?subCategory=flap" },
      { label: "Zipped Backpacks", href: "/bags/backpacks?subCategory=zipped" },
      { label: "Harness Backpacks", href: "/bags/backpacks?subCategory=harness" },
      { label: "Canvas Backpacks", href: "/bags/backpacks?material=Canvas" },
      { label: "Leather Backpacks", href: "/bags/backpacks?material=Leather" },
      { label: "Aluminium Backpacks", href: "/bags/backpacks?material=Aluminium" },
    ],
  },
  {
    id: "duffle-bags",
    name: "Duffle Bags",
    href: "/bags/duffle-bags",
    count: 4,
    image: "/media/bags/never-still-nylon-duffle-bag-medium.png",
    tagline: "Spacious weekenders equipped with luggage attachment sleeves.",
    subcategories: [
      { label: "All Duffle Bags", href: "/bags/duffle-bags" },
      { label: "Leather Duffle Bags", href: "/bags/duffle-bags?material=Leather" },
      { label: "Nylon Duffle Bags", href: "/bags/duffle-bags?material=Nylon" },
      { label: "Large Duffle Bags", href: "/bags/duffle-bags?q=large" },
      { label: "Medium Duffle Bags", href: "/bags/duffle-bags?q=medium" },
    ],
  },
  {
    id: "briefcases",
    name: "Briefcases",
    href: "/bags/briefcases",
    count: 2,
    image: "/media/bags/attach-aluminium-briefcase.png",
    tagline: "Architectural business cases made from grooved aluminium and leather.",
    subcategories: [
      { label: "All Briefcases", href: "/bags/briefcases" },
      { label: "Attaché Aluminium", href: "/bags/briefcases?material=Aluminium" },
      { label: "Leather Briefcase", href: "/bags/briefcases?material=Leather" },
    ],
  },
  {
    id: "crossbodies",
    name: "Crossbodies",
    href: "/bags/crossbodies",
    count: 8,
    image: "/media/bags/groove-leather-cross-body-bag-large.png",
    tagline: "Compact hands-free companions for effortless mobility.",
    subcategories: [
      { label: "All Crossbodies", href: "/bags/crossbodies" },
      { label: "Groove Leather Cross-Body", href: "/bags/crossbodies?q=groove" },
      { label: "Leather Hobo Bag", href: "/bags/crossbodies?q=hobo" },
      { label: "Personal Cross-Body", href: "/bags/crossbodies?collection=Personal" },
      { label: "Small Cross-Body", href: "/bags/crossbodies?q=small" },
      { label: "Large Cross-Body", href: "/bags/crossbodies?q=large" },
    ],
  },
  {
    id: "totes",
    name: "Totes",
    href: "/bags/totes",
    count: 2,
    image: "/media/bags/never-still-leather-zipped-tote.png",
    tagline: "Generous volumes crafted for daily essentials and business carry.",
    subcategories: [
      { label: "All Totes", href: "/bags/totes" },
      { label: "Canvas Tote", href: "/bags/totes?material=Canvas" },
      { label: "Leather Zipped Tote", href: "/bags/totes?material=Leather" },
    ],
  },
  {
    id: "hand-carry",
    name: "Hand Carry",
    href: "/bags/hand-carry",
    count: 8,
    image: "/media/bags/classic-aluminium-grid-hand-carry-case.png",
    tagline: "Structured statement cases and clutches crafted to hold small essentials.",
    subcategories: [
      { label: "All Hand Carry", href: "/bags/hand-carry" },
      { label: "Vanity Cases", href: "/bags/hand-carry?q=vanity" },
      { label: "Hand Clutches", href: "/bags/hand-carry?q=clutch" },
      { label: "Game & Specialist Cases", href: "/bags/hand-carry?q=specialist" },
    ],
  },
];

export function BagsGuideGrid() {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  return (
    <div className="bags-guide-container">
      <div className="bags-guide-header">
        <p className="eyebrow">OVIA BAGS GUIDE</p>
        <h1 className="bags-guide-headline">Available in a variety of shapes.</h1>
        <p className="bags-guide-intro">
          OVIA&apos;s versatile bag collections are designed for daily routines or travel needs.
          Hover over each category below to explore its subcategories and silhouettes, or click directly to view filtered collections.
        </p>
      </div>

      <div className="bags-guide-grid">
        {bagCategoriesGuide.map((cat) => {
          const isHovered = hoveredCategory === cat.id;

          return (
            <div
              key={cat.id}
              className={`bags-guide-card ${isHovered ? "is-hovered" : ""}`}
              onMouseEnter={() => setHoveredCategory(cat.id)}
              onMouseLeave={() => setHoveredCategory(null)}
            >
              <div className="bags-guide-card-media">
                <Image
                  src={cat.image}
                  alt={cat.name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="bags-guide-card-img"
                />
                <div className="bags-guide-card-badge">{cat.count} PIECES</div>
              </div>

              <div className="bags-guide-card-info">
                <div className="bags-guide-card-header">
                  <h3 className="bags-guide-card-title">{cat.name}</h3>
                  <Link href={cat.href} className="bags-guide-card-link" aria-label={`View ${cat.name}`}>
                    <ArrowUpRight size={18} />
                  </Link>
                </div>
                <p className="bags-guide-card-desc">{cat.tagline}</p>
                <div className="bags-guide-card-action">
                  <Link href={cat.href} className="bags-guide-card-cta">
                    <span>Explore {cat.name}</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>

              {/* OVERLAY REVEALING SUBCATEGORIES ON HOVER */}
              <div
                className={`bags-guide-subcategories-overlay ${isHovered ? "visible" : ""}`}
                aria-hidden={!isHovered}
              >
                <div className="bags-subcategories-inner">
                  <div className="bags-subcategories-header">
                    <span className="bags-subcategories-category-name">{cat.name}</span>
                    <span className="bags-subcategories-count">{cat.count} pieces</span>
                  </div>
                  <p className="bags-subcategories-hint">Select a subcategory to filter:</p>
                  <ul className="bags-subcategories-list">
                    {cat.subcategories.map((sub) => (
                      <li key={sub.href}>
                        <Link href={sub.href} className="bags-subcategory-link">
                          <span>{sub.label}</span>
                          <ArrowRight size={14} className="sub-arrow" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <div className="bags-subcategories-footer">
                    <Link href={cat.href} className="bags-subcategories-all-btn">
                      All {cat.name}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
