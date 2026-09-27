"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Story } from "@/lib/types";

interface StoriesCarouselProps {
  initialStories?: Story[];
}

export function StoriesCarousel({ initialStories }: StoriesCarouselProps) {
  const [stories, setStories] = useState<Story[]>(initialStories || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const trackRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);

  // Fetch updated stories from API if not provided or to ensure fresh data
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch("/api/v1/stories?status=published");
        if (res.ok) {
          const data = await res.json();
          if (mounted && data.stories && data.stories.length > 0) {
            setStories(data.stories);
          }
        }
      } catch (err) {
        // Fallback to initialStories on network error
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const updateScrollState = useCallback(() => {
    if (!trackRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = trackRef.current;
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 6);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    updateScrollState();
    track.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    return () => {
      track.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [stories, updateScrollState]);

  const scrollByCard = (direction: "prev" | "next") => {
    if (!trackRef.current) return;
    const track = trackRef.current;
    const card = track.querySelector(".stories-card") as HTMLElement | null;
    const cardWidth = card ? card.offsetWidth + 28 : track.clientWidth * 0.75;
    const scrollAmount = direction === "next" ? cardWidth : -cardWidth;

    track.scrollBy({
      left: scrollAmount,
      behavior: "smooth",
    });
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      scrollByCard("prev");
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      scrollByCard("next");
    }
  };

  // Touch and pointer dragging support
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!trackRef.current) return;
    isDraggingRef.current = true;
    startXRef.current = e.pageX - trackRef.current.offsetLeft;
    scrollLeftRef.current = trackRef.current.scrollLeft;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || !trackRef.current) return;
    e.preventDefault();
    const x = e.pageX - trackRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;
    trackRef.current.scrollLeft = scrollLeftRef.current - walk;
  };

  const handlePointerUpOrLeave = () => {
    isDraggingRef.current = false;
  };

  if (!stories || stories.length === 0) return null;

  return (
    <section
      className="stories-section"
      aria-labelledby="stories-heading"
      id="stories"
    >
      <div className="stories-container">
        {/* Left Fixed Editorial Heading */}
        <div className="stories-heading-area">
          <p className="stories-eyebrow">STORIES</p>
          <h2 id="stories-heading" className="stories-title">
            Our latest news
            <br />
            and views
          </h2>
        </div>

        {/* Right Carousel Wrapper with Overlay Circular Arrows */}
        <div className="stories-carousel-wrapper">
          {/* Previous Arrow Button */}
          <button
            type="button"
            className={`stories-nav-btn stories-nav-prev ${
              !canScrollLeft ? "is-disabled" : ""
            }`}
            onClick={() => scrollByCard("prev")}
            aria-label="Previous stories"
            disabled={!canScrollLeft}
          >
            <ArrowLeft size={18} strokeWidth={1.8} />
          </button>

          {/* Horizontally Scrollable Track */}
          <div
            ref={trackRef}
            className="stories-track"
            tabIndex={0}
            role="region"
            aria-label="Latest stories and news carousel"
            onKeyDown={handleKeyDown}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUpOrLeave}
            onPointerLeave={handlePointerUpOrLeave}
          >
            {stories.map((story, idx) => (
              <article key={story.id || story.slug} className="stories-card">
                <Link
                  href={`/journal/${story.slug}`}
                  className="stories-card-link"
                  aria-label={`${story.title} - READ`}
                >
                  <div className="stories-image-wrap">
                    <Image
                      src={story.thumbnail || story.heroImage}
                      alt={story.title}
                      fill
                      sizes="(max-width: 640px) 80vw, (max-width: 1024px) 45vw, 360px"
                      className="stories-card-img"
                      priority={idx < 3}
                    />
                  </div>

                  <div className="stories-card-content">
                    <h3 className="stories-card-title">{story.title}</h3>
                    <span className="stories-read-link">READ</span>
                  </div>
                </Link>
              </article>
            ))}
          </div>

          {/* Next Arrow Button */}
          <button
            type="button"
            className={`stories-nav-btn stories-nav-next ${
              !canScrollRight ? "is-disabled" : ""
            }`}
            onClick={() => scrollByCard("next")}
            aria-label="Next stories"
            disabled={!canScrollRight}
          >
            <ArrowRight size={18} strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </section>
  );
}
