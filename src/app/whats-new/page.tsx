import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { storefrontCatalog } from "@/server/storefront-catalog";
import { money } from "@/lib/catalog-helpers";
import { readRepository } from "@/server/db";
import type { Story } from "@/lib/types";
import { WhatsNewGrid, type WhatsNewItem } from "@/components/whats-new-grid";
import styles from "./whats-new.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Latest from OVIA — What's New in Bags, Luggage & Design",
  description:
    "New pieces. New stories. Discover the latest arrivals, collections, and material explorations from OVIA.",
  alternates: {
    canonical: "/whats-new",
  },
};

export default async function WhatsNewPage() {
  const allProducts = await storefrontCatalog().catch(() => []);
  const newArrivalProducts = allProducts.filter((p) =>
    p.tags?.includes("new-arrivals"),
  );

  let stories: Story[] = [];
  try {
    stories = await readRepository((repo) => repo.find<Story>("stories"));
  } catch {}

  // Build curated What's New items
  const items: WhatsNewItem[] = [
    // 1. The Travel Edit (Featured New Arrival)
    {
      id: "the-travel-edit",
      type: "New Arrivals",
      categoryLabel: "NEW ARRIVALS",
      title: "The Travel Edit",
      description:
        "Handcrafted leather duffle bags and modular daypacks tailored for spontaneous weekends and extended city transit.",
      image: "/media/cat-duffle.jpg",
      href: newArrivalProducts[0]
        ? `/products/${newArrivalProducts[0].slug}`
        : "/bags",
      ctaText: "Explore",
    },
    // 2. The Journey Collection (Featured Luggage Collection)
    {
      id: "the-journey-collection",
      type: "Collections",
      categoryLabel: "COLLECTIONS",
      title: "The Journey Collection",
      description:
        "Precision anodized aluminium cases engineered with quiet multi-wheel systems and reinforced corner bumpers.",
      image: "/media/pedestal-3d-display.jpg",
      href: "/luggage",
      ctaText: "Explore",
    },
    // 3. Live New Arrival Products
    ...newArrivalProducts.slice(0, 4).map((p) => ({
      id: p.id,
      type: "New Arrivals" as const,
      categoryLabel: `${(p.department || "Bags").toUpperCase()} · NEW ARRIVAL`,
      title: p.name,
      description: p.description.slice(0, 110) + "…",
      image: p.variants?.[0]?.image || "/media/cat-backpack.jpg",
      href: `/products/${p.slug}`,
      price: p.priceOnRequest ? "Price on request" : money(p.price ?? p.variants[0]?.price ?? 0),
      ctaText: "View Product",
    })),
    // 4. Material & Studio Collections
    {
      id: "studio-artist-case",
      type: "Collections",
      categoryLabel: "SPECIAL EDITION",
      title: "Studio Artist Case",
      description:
        "Pairing German anodized aluminium with solid beechwood trays and professional platinum drawing instruments.",
      image: "/media/creative.jpg",
      href: "/new/artist-case",
      ctaText: "Discover Edition",
    },
    {
      id: "forma-anthracite",
      type: "Updates",
      categoryLabel: "PALETTE UPDATE",
      title: "Forma Anthracite",
      description:
        "A deep mineral grey palette introduced across cabin and check-in luggage silhouettes.",
      image: "/media/material-aluminium.jpg",
      href: "/luggage",
      ctaText: "View Shades",
    },
    // 5. Stories & Editorial Journal
    ...(stories.length > 0
      ? stories.slice(0, 2).map((s) => ({
          id: s.id,
          type: "Stories" as const,
          categoryLabel: `${s.category?.toUpperCase() || "JOURNAL"}`,
          title: s.title,
          description: s.excerpt || "",
          image: s.thumbnail || s.heroImage || "/media/editorial-events.jpg",
          href: `/journal/${s.slug}`,
          ctaText: "Read Story",
        }))
      : [
          {
            id: "kinetic-pavilion-story",
            type: "Stories" as const,
            categoryLabel: "DESIGN ARCHITECTURE",
            title: "Kinetic Design in Transit",
            description:
              "How classical aviation aesthetics informed the aerodynamic contours of the new luggage range.",
            image: "/media/spaces.jpg",
            href: "/events/an-evening-with-ovia",
            ctaText: "Read Story",
          },
        ]),
    // 6. Atelier Updates
    {
      id: "tokyo-atelier-update",
      type: "Updates",
      categoryLabel: "ATELIER UPDATE",
      title: "Custom Monogramming & Hot-Stamping",
      description:
        "Complimentary artisanal leather personalization now offered across all signature travel bag straps.",
      image: "/media/detail-strap.jpg",
      href: "/personalise",
      ctaText: "Consider Details",
    },
  ];

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
          <Link href="/" className={styles.breadcrumbLink}>
            Home
          </Link>
          <span className={styles.breadcrumbSeparator} aria-hidden="true">
            /
          </span>
          <Link href="/about" className={styles.breadcrumbLink}>
            Discover
          </Link>
          <span className={styles.breadcrumbSeparator} aria-hidden="true">
            /
          </span>
          <span className={styles.breadcrumbCurrent}>What&apos;s New</span>
        </nav>

        {/* Hero Header */}
        <header className={styles.heroHeader}>
          <h1 className={styles.heroTitle}>Latest from OVIA</h1>
          <p className={styles.heroSubtitle}>
            New pieces. New stories. Discover the latest from our world.
          </p>
        </header>

        {/* Featured Latest Collection Banner */}
        <section
          className={styles.featuredCollectionSection}
          aria-labelledby="featured-coll-title"
        >
          <div className={styles.featuredMediaWrap}>
            <Image
              src="/media/editorial-journey-model.jpg"
              alt="OVIA Latest Travel Collection in Florence"
              fill
              priority
              sizes="(max-width: 1200px) 100vw, 1180px"
              className={styles.featuredMedia}
            />
          </div>
          <div className={styles.featuredContent}>
            <span className={styles.featuredEyebrow}>LATEST COLLECTION</span>
            <h2 id="featured-coll-title" className={styles.featuredTitle}>
              A New Perspective on Travel
            </h2>
            <p className={styles.featuredDesc}>
              Discover a refined approach to everyday movement.
            </p>
            <Link href="/bags" className={styles.featuredLink}>
              Explore Collection
              <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </section>

        {/* Interactive Discover What's New Grid with Filter Tabs */}
        <WhatsNewGrid items={items} />

        {/* From the Journal Section */}
        <section
          className={styles.journalFeatureSection}
          aria-labelledby="journal-feat-title"
        >
          <div className={styles.journalFeatureHeader}>
            <span className={styles.journalFeatureEyebrow}>
              FROM THE JOURNAL
            </span>
          </div>

          <div className={styles.journalFeatureMediaWrap}>
            <Image
              src="/media/craftsmanship-artisan-detail.jpg"
              alt="Craftsmanship and material details of OVIA leather travel bag"
              fill
              sizes="(max-width: 1200px) 100vw, 1180px"
              className={styles.journalFeatureMedia}
            />
          </div>

          <div className={styles.journalFeatureContent}>
            <span className={styles.journalFeatureEyebrow}>
              DESIGN &amp; MATERIALS
            </span>
            <h2 id="journal-feat-title" className={styles.journalFeatureTitle}>
              The Beauty of Thoughtful Details
            </h2>
            <p className={styles.journalFeatureDesc}>
              Exploring the materials, forms and details behind considered travel
              design.
            </p>
            <Link href="/about" className={styles.journalFeatureLink}>
              Read Story
              <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </section>
      </div>

      {/* DISCOVER OVIA Banner */}
      <section className={styles.worldBanner} aria-labelledby="discover-banner-title">
        <div className={styles.worldBannerContent}>
          <span className={styles.worldEyebrow}>DISCOVER OVIA</span>
          <h2 id="discover-banner-title" className={styles.worldTitle}>
            Every Journey Has a Story.
          </h2>
          <p className={styles.worldSubtitle}>
            Explore our world of bags and luggage.
          </p>
          <Link href="/bags" className={styles.worldButton}>
            Shop the Collection
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </main>
  );
}
