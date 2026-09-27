"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal, RevealGroup } from "./motion";
import { oviaEvents } from "@/lib/events";
import { newEdits } from "@/lib/new-collection";

export interface EditorialCardData {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  ctaText: string;
  href: string;
  image: string;
  alt: string;
}

interface EditorialTriptychProps {
  customCards?: EditorialCardData[];
}

export function EditorialTriptychSection({ customCards }: EditorialTriptychProps) {
  // Dynamic fallbacks or data connections
  const featuredEvent = oviaEvents[0];
  const featuredEdit = newEdits["artist-case"];

  const defaultCards: EditorialCardData[] = [
    {
      id: "about-ovia",
      badge: "01 — ABOUT OVIA",
      title: "ABOUT OVIA",
      subtitle: "Designed for movement.",
      description: "Created for every journey.",
      ctaText: "DISCOVER OUR STORY",
      href: "/about",
      image: "/media/editorial-collection.jpg",
      alt: "OVIA luggage craftsmanship and leather travel bag construction",
    },
    {
      id: "ovia-events",
      badge: "02 — OVIA EVENTS",
      title: "OVIA EVENTS",
      subtitle: "Beyond the Journey.",
      description:
        featuredEvent?.description
          ? "Discover launches, experiences and moments from the world of OVIA."
          : "Discover launches, experiences and moments from the world of OVIA.",
      ctaText: "EXPLORE EVENTS",
      href: "/events",
      image: featuredEvent?.image || "/media/editorial-events.jpg",
      alt: "OVIA exhibition and private preview event gathering",
    },
    {
      id: "latest-from-ovia",
      badge: "03 — LATEST FROM OVIA",
      title: "LATEST FROM OVIA",
      subtitle: "New Pieces. New Stories.",
      description:
        featuredEdit?.description
          ? "Explore our newest products, collections, materials and updates from OVIA."
          : "Explore our newest products, collections, materials and updates from OVIA.",
      ctaText: "DISCOVER WHAT'S NEW",
      href: "/new",
      image: "/media/editorial-bags.jpg",
      alt: "OVIA new travel pieces and latest campaign collection",
    },
  ];

  const cards = customCards && customCards.length === 3 ? customCards : defaultCards;

  return (
    <section
      className="editorial-triptych-section"
      aria-labelledby="editorial-journey-heading"
      id="ovia-the-journey"
    >
      <div className="editorial-triptych-inner">
        {/* Section Header */}
        <Reveal y={24} duration={0.8}>
          <div className="editorial-triptych-header">
            <p className="editorial-eyebrow">OVIA — THE JOURNEY</p>
            <h2 id="editorial-journey-heading" className="editorial-main-heading">
              Discover OVIA — our story, experiences and the latest
              <br className="editorial-br-desktop" />
              expressions of travel, bags and contemporary design.
            </h2>
          </div>
        </Reveal>

        {/* 3 Equal Vertical Editorial Cards */}
        <RevealGroup selector=".editorial-triptych-card" stagger={0.14} y={32} duration={0.85}>
          <div className="editorial-triptych-grid">
            {cards.map((card, index) => (
              <article key={card.id} className="editorial-triptych-card">
                <Link
                  href={card.href}
                  className="editorial-card-link-wrapper"
                  aria-label={`${card.title}: ${card.subtitle} — ${card.ctaText}`}
                >
                  {/* Vertical Image Container with smooth zoom */}
                  <div className="editorial-card-image-wrap">
                    <Image
                      src={card.image}
                      alt={card.alt}
                      fill
                      quality={100}
                      unoptimized
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="editorial-card-img"
                      priority={index === 0}
                    />
                    <div className="editorial-card-gradient-overlay" aria-hidden="true" />
                  </div>

                  {/* Below Image Text Block */}
                  <div className="editorial-card-body">
                    <h3 className="editorial-card-title">{card.title}</h3>

                    <div className="editorial-card-text">
                      <p className="editorial-card-subtitle">{card.subtitle}</p>
                      <p className="editorial-card-desc">{card.description}</p>
                    </div>

                    <div className="editorial-card-cta">
                      <span className="editorial-cta-text">{card.ctaText}</span>
                      <ArrowRight className="editorial-cta-arrow" size={15} />
                      <span className="editorial-cta-underline" aria-hidden="true" />
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </RevealGroup>
      </div>
    </section>
  );
}
