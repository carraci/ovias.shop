"use client";
import "@/components/page-styles/editorial.css";


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

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const draggedRef = useRef(false);

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

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || !stories.length) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (preference.matches) return;
    section.classList.add("is-reveal-ready");
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        section.classList.add("is-revealed");
        observer.disconnect();
      }
    }, { threshold: 0.12 });
    observer.observe(section);
    const show = () => { if (preference.matches) section.classList.add("is-revealed"); };
    preference.addEventListener("change", show);
    return () => {
      observer.disconnect();
      preference.removeEventListener("change", show);
      section.classList.remove("is-reveal-ready");
    };
  }, [stories.length]);

  const updateScrollState = useCallback(() => {
    if (!trackRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = trackRef.current;
    const track = trackRef.current;
    const center = scrollLeft + clientWidth / 2;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const metrics = Array.from(track.querySelectorAll<HTMLElement>(".stories-card"), card => ({ card, left: card.offsetLeft, width: card.offsetWidth }));
    metrics.forEach(({ card, left, width }) => {
      const distance = (left + width / 2 - center) / (clientWidth / 2);
      const curve = Math.max(-2, Math.min(2, distance));
      const arc = curve * curve;
      card.style.setProperty("--curve-angle", `${reduced ? 0 : -curve * 18}deg`);
      card.style.setProperty("--curve-depth", `${reduced ? 0 : -arc * 35}px`);
      card.style.setProperty("--curve-drop", `${reduced ? 0 : arc * 60}px`);
      card.style.setProperty("--curve-skew", `${reduced ? 0 : curve * 3}deg`);
      card.style.setProperty("--curve-scale", `${reduced ? 1 : 1 - Math.min(Math.abs(curve), 2) * .015}`);
    });
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 6);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    updateScrollState();
    let frame = 0;
    const scheduleUpdate = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        updateScrollState();
      });
    };
    track.addEventListener("scroll", scheduleUpdate, { passive: true });
    const observer = new ResizeObserver(updateScrollState);
    observer.observe(track);
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    preference.addEventListener("change", updateScrollState);

    return () => {
      track.removeEventListener("scroll", scheduleUpdate);
      cancelAnimationFrame(frame);
      observer.disconnect();
      preference.removeEventListener("change", updateScrollState);
    };
  }, [stories, updateScrollState]);

  const scrollByCard = (direction: "prev" | "next") => {
    if (!trackRef.current) return;
    const track = trackRef.current;
    const card = track.querySelector(".stories-card") as HTMLElement | null;
    const cardWidth = card ? card.offsetWidth + parseFloat(getComputedStyle(track).columnGap) : track.clientWidth * 0.75;
    const scrollAmount = direction === "next" ? cardWidth : -cardWidth;

    track.scrollBy({
      left: scrollAmount,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
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
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    draggedRef.current = false;
    isDraggingRef.current = true;
    startXRef.current = e.pageX - trackRef.current.offsetLeft;
    scrollLeftRef.current = trackRef.current.scrollLeft;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || !trackRef.current) return;
    e.preventDefault();
    const x = e.pageX - trackRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;
    if (Math.abs(walk) > 6) draggedRef.current = true;
    trackRef.current.scrollLeft = scrollLeftRef.current - walk;
  };

  const handlePointerUpOrLeave = () => {
    isDraggingRef.current = false;
  };

  if (!stories || stories.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      className="stories-section stories-curved stories-editorial"
      aria-labelledby="stories-heading"
      id="stories"
    >
      <div className="stories-container">
        {/* Editorial heading above the curved gallery */}
        <div className="stories-heading-area">
          <p className="stories-eyebrow">STORIES</p>
          <h2 id="stories-heading" className="stories-title">
            Our Latest News <em>and Views</em>
          </h2>
        <Link href="/journal" className="stories-explore">Explore stories <ArrowRight size={15} /></Link></div>

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
            onDragStart={(event) => event.preventDefault()}
            onClickCapture={(event) => { if (draggedRef.current) { event.preventDefault(); draggedRef.current = false; } }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUpOrLeave}
            onPointerLeave={handlePointerUpOrLeave}
            onPointerCancel={handlePointerUpOrLeave}
          >
            {stories.map((story, idx) => {
              const imageSrc =
                (typeof story.thumbnail === "string" && story.thumbnail.trim()) ||
                (typeof story.heroImage === "string" && story.heroImage.trim()) ||
                "/media/case-flowers.jpg";

              return (
                <article key={story.id || story.slug} className="stories-card">
                  <Link
                    href={`/journal/${story.slug}`}
                    className="stories-card-link"
                    aria-label={`${story.title} - READ`}
                  >
                    <div className="stories-image-wrap">
                      <Image
                        src={imageSrc}
                        alt={story.title || "OVIA Story"}
                        fill
                        sizes="(max-width: 640px) 62vw, (max-width: 1024px) 30vw, 20vw"
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
              );
            })}
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
