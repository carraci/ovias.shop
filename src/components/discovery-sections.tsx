"use client";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { stories } from "@/lib/journal";

export function StoriesSection() {
  const rail = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ start: true, end: false });
  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    const update = () =>
      setPosition({
        start: el.scrollLeft < 5,
        end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 5,
      });
    update();
    el.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, []);
  function move(direction: number) {
    const el = rail.current;
    if (!el) return;
    const card = el.querySelector("article");
    el.scrollBy({
      left: direction * ((card?.getBoundingClientRect().width || 320) + 24),
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }
  return (
    <section className="stories-section" aria-labelledby="stories-heading">
      <div className="stories-intro">
        <p className="eyebrow">STORIES</p>
        <h2 id="stories-heading">
          Our latest
          <br />
          <em>notes & views.</em>
        </h2>
        <p>
          People, places and the things
          <br />
          we take along the way.
        </p>
        <Link href="/journal" className="text-link">
          Explore the journal <ArrowUpRight size={17} />
        </Link>
        <div className="story-controls">
          <button
            onClick={() => move(-1)}
            disabled={position.start}
            aria-label="Previous stories"
          >
            <ArrowLeft size={20} />
          </button>
          <button
            onClick={() => move(1)}
            disabled={position.end}
            aria-label="Next stories"
          >
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
      <div
        className="stories-rail"
        ref={rail}
        tabIndex={0}
        aria-label="Latest stories; scroll to explore"
      >
        {stories.slice(0, 4).map((story) => (
          <article className="story-card" key={story.slug}>
            <Link href={`/journal/${story.slug}`} className="story-card-image">
              <Image
                src={story.image}
                alt={story.alt}
                fill
                sizes="(max-width: 600px) 80vw, 30vw"
              />
            </Link>
            <p className="eyebrow">{story.category}</p>
            <h3>
              <Link href={`/journal/${story.slug}`}>{story.title}</Link>
            </h3>
            <Link
              href={`/journal/${story.slug}`}
              className="story-read"
              aria-label={`Read ${story.title}`}
            >
              Read <ArrowUpRight size={15} />
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
export function JourneyMatches() {
  return (
    <section className="section journey-matches">
      <p className="eyebrow">ONE WORLD. YOUR WAY.</p>
      <h2>
        Find your kind of <em>journey.</em>
      </h2>
      <div className="match-grid">
        {[
          {
            key: "luggage",
            title: "For the miles ahead",
            label: "See all luggage",
            image: "/media/category-luggage.jpg",
            alt: "OVIA luxury luggage collection at private airfield",
          },
          {
            key: "bags",
            title: "For every day in between",
            label: "See all bags",
            image: "/media/category-bags.jpg",
            alt: "OVIA luxury bags collection on Mediterranean limestone terrace",
          },
          {
            key: "accessories",
            title: "For the details that matter",
            label: "See all accessories",
            image: "/media/category-accessories.jpg",
            alt: "OVIA curated luxury accessories and leather goods",
          },
        ].map((item, i) => (
          <article key={item.key}>
            <Link href={`/${item.key}`} className={`match-image match-${i}`}>
              <Image
                src={item.image}
                alt={item.alt}
                fill
                sizes="(max-width: 760px) 85vw, 30vw"
              />
            </Link>
            <p>{item.title}</p>
            <Link className="story-read" href={`/${item.key}`}>
              {item.label} <ArrowUpRight size={16} />
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
export function StoreBanner() {
  return (
    <section className="store-banner" aria-labelledby="store-banner-heading">
      <Image
        src="/media/flagship-store.png"
        alt="OVIA luxury flagship boutique interior"
        fill
        sizes="100vw"
        priority={false}
      />
      <div className="store-banner-shade" />
      <div className="store-banner-content text-center">
        <p className="eyebrow">WE ARE NOT FAR AWAY</p>
        <h2 id="store-banner-heading">
          Visit us in store
        </h2>
        <Link className="button light store-banner-btn" href="/stores">
          FIND A STORE
        </Link>
      </div>
    </section>
  );
}
