import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import styles from "./about.module.css";

export const metadata: Metadata = {
  title: "About OVIA — A Journey Beyond the Ordinary",
  description:
    "Designed for movement. Created for every journey. Discover the story, philosophy, and considered craftsmanship behind OVIA.",
  alternates: {
    canonical: "/about",
  },
};

export default function AboutPage() {
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
          <span className={styles.breadcrumbCurrent}>About OVIA</span>
        </nav>

        {/* Hero Header */}
        <header className={styles.heroHeader}>
          <h1 className={styles.heroTitle}>A Journey Beyond the Ordinary.</h1>
          <p className={styles.heroSubtitle}>
            Designed for movement. Created for every journey.
          </p>
        </header>

        {/* Main Hero Photography */}
        <div className={styles.heroMediaWrap}>
          <Image
            src="/media/editorial-collection.jpg"
            alt="OVIA handcrafted travel bags and luggage on a Mediterranean terrace overlooking the sea"
            fill
            priority
            sizes="(max-width: 1200px) 100vw, 1180px"
            className={styles.heroMedia}
          />
        </div>

        {/* 01 — OUR STORY */}
        <section className={styles.storySection} aria-labelledby="story-title">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionEyebrow}>01 — OUR STORY</span>
            <h2 id="story-title" className={styles.sectionTitle}>
              The Art of Moving Forward
            </h2>
            <p className={styles.sectionBody}>
              At OVIA, we believe every journey deserves thoughtful design. Our
              vision is to bring together timeless aesthetics, everyday
              functionality, and a sense of effortless movement.
            </p>
          </div>
        </section>

        {/* 02 — OUR PHILOSOPHY */}
        <section
          className={styles.storySection}
          aria-labelledby="philosophy-title"
        >
          <div className={styles.sectionHeader}>
            <span className={styles.sectionEyebrow}>02 — OUR PHILOSOPHY</span>
            <h2 id="philosophy-title" className={styles.sectionTitle}>
              Less, but Better.
            </h2>
            <p className={styles.sectionBody}>
              We believe in considered details, refined simplicity, and pieces
              designed to accompany life&apos;s changing destinations.
            </p>
          </div>

          <div className={styles.philosophyMediaWrap}>
            <Image
              src="/media/craftsmanship-artisan-detail.jpg"
              alt="OVIA leather craftsmanship detail with precision stitching and refined brass hardware"
              fill
              sizes="(max-width: 1200px) 100vw, 1180px"
              className={styles.philosophyMedia}
            />
          </div>
        </section>

        {/* 03 — THE COLLECTION */}
        <section
          className={styles.storySection}
          aria-labelledby="collection-title"
        >
          <div className={styles.sectionHeader}>
            <span className={styles.sectionEyebrow}>03 — THE COLLECTION</span>
            <h2 id="collection-title" className={styles.sectionTitle}>
              Made to Move With You.
            </h2>
          </div>

          <div className={styles.collectionGrid}>
            <Link
              href="/bags"
              className={styles.collectionCard}
              aria-label="Explore OVIA Bags collection"
            >
              <div className={styles.collectionMediaWrap}>
                <Image
                  src="/media/cat-backpack.jpg"
                  alt="OVIA modern minimalist leather backpack"
                  fill
                  sizes="(max-width: 768px) 100vw, 560px"
                  className={styles.collectionMedia}
                />
              </div>
              <div className={styles.collectionLinkRow}>
                <span className={styles.collectionLabel}>Bags</span>
                <ArrowUpRight
                  size={20}
                  className={styles.collectionIcon}
                  aria-hidden="true"
                />
              </div>
            </Link>

            <Link
              href="/luggage"
              className={styles.collectionCard}
              aria-label="Explore OVIA Luggage collection"
            >
              <div className={styles.collectionMediaWrap}>
                <Image
                  src="/media/pedestal-3d-display.jpg"
                  alt="OVIA signature grooved aluminium cabin suitcase"
                  fill
                  sizes="(max-width: 768px) 100vw, 560px"
                  className={styles.collectionMedia}
                />
              </div>
              <div className={styles.collectionLinkRow}>
                <span className={styles.collectionLabel}>Luggage</span>
                <ArrowUpRight
                  size={20}
                  className={styles.collectionIcon}
                  aria-hidden="true"
                />
              </div>
            </Link>
          </div>
        </section>
      </div>

      {/* THE OVIA WORLD BANNER */}
      <section className={styles.worldBanner} aria-labelledby="world-title">
        <div className={styles.worldBannerContent}>
          <span className={styles.worldEyebrow}>THE OVIA WORLD</span>
          <h2 id="world-title" className={styles.worldTitle}>
            Every Journey Begins Somewhere.
          </h2>
          <p className={styles.worldSubtitle}>Discover the collection.</p>
          <Link href="/bags" className={styles.worldButton}>
            Explore OVIA
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </main>
  );
}
