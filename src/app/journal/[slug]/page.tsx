import "@/components/page-styles/editorial.css";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Clock, Calendar, Share2, Sparkles } from "lucide-react";
import { getStoryBySlug, getStories, initialStories } from "@/server/stories";
import { stories as legacyStories } from "@/lib/journal";
import { catalog } from "@/server/db";
import { type Product } from "@/lib/catalog";
import { displayMoney } from "@/lib/markets";
import type { Story, ContentBlock } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let story = await getStoryBySlug(slug);
  if (!story) {
    const legacy = legacyStories.find((s) => s.slug === slug);
    if (legacy) {
      return {
        title: `${legacy.title} | OVIA Stories`,
        description: legacy.paragraphs[0],
        alternates: { canonical: `/journal/${slug}` },
      };
    }
  }

  if (!story) return { title: "Story not found | OVIA" };

  return {
    title: `${story.title} | OVIA Stories`,
    description: story.excerpt,
    alternates: { canonical: `/journal/${slug}` },
    openGraph: {
      title: story.title,
      description: story.excerpt,
      images: [{ url: story.heroImage }],
    },
  };
}

export default async function StoryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let story: Story | undefined = await getStoryBySlug(slug);

  // Fallback to legacy stories if not yet migrated to DB
  if (!story) {
    const legacy = legacyStories.find((s) => s.slug === slug);
    if (legacy) {
      story = {
        id: legacy.slug,
        title: legacy.title,
        slug: legacy.slug,
        category: legacy.category,
        excerpt: legacy.paragraphs[0],
        heroImage: legacy.image,
        thumbnail: legacy.image,
        author: "OVIA Editorial Studio",
        readingTime: "4 min read",
        publishedAt: "2026-03-01T10:00:00Z",
        status: "published",
        featured: false,
        relatedProducts: ["interval-cabin", "forma-backpack"],
        gallery: [legacy.image, "/media/architecture.jpg", "/media/spaces.jpg"],
        contentBlocks: [
          {
            id: "legacy-h",
            type: "heading",
            text: legacy.heading,
          },
          ...legacy.paragraphs.map((p, i) => ({
            id: `legacy-p-${i}`,
            type: "paragraph" as const,
            text: p,
          })),
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
  }

  if (!story || story.status !== "published") notFound();

  // Load related products from catalog
  const allProducts = await catalog();
  const relatedProductItems: Product[] = (story.relatedProducts || [])
    .map((slugOrId) => allProducts.find((p) => p.slug === slugOrId || p.id === slugOrId))
    .filter((p): p is Product => Boolean(p))
    .slice(0, 3);

  // If none matched, provide 3 fallback products from catalog
  const displayProducts =
    relatedProductItems.length > 0 ? relatedProductItems : allProducts.slice(0, 3);

  // Load related stories
  const allPublished = await getStories({ status: "published" });
  const relatedStories = allPublished
    .filter((s) => s.slug !== story?.slug)
    .slice(0, 3);

  return (
    <article className="story-editorial-page">
      {/* 1. Full-Width Cinematic Hero Image */}
      <header className="story-cinematic-hero">
        <div className="story-hero-media-wrap">
          {((story.heroImage && story.heroImage.trim()) || (story.thumbnail && story.thumbnail.trim())) && <Image
            src={(story.heroImage && story.heroImage.trim()) || (story.thumbnail && story.thumbnail.trim()) || "/media/case-flowers.jpg"}
            alt={story.title}
            fill
            priority
            sizes="100vw"
            className="story-hero-img"
          />}
          <div className="story-hero-overlay" aria-hidden="true" />
        </div>

        {/* Hero Title & Metadata Badge */}
        <div className="story-hero-content-bounds">
          <div className="story-hero-meta-badge">
            <span className="story-category-tag">{story.category}</span>
            <span className="story-meta-dot" aria-hidden="true">·</span>
            <span className="story-reading-time">
              <Clock size={12} /> {story.readingTime || "5 min read"}
            </span>
            <span className="story-meta-dot" aria-hidden="true">·</span>
            <time className="story-pub-date">
              {new Date(story.publishedAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </time>
          </div>

          <h1 className="story-hero-title">{story.title}</h1>

          {story.author && (
            <p className="story-hero-author">Words by {story.author}</p>
          )}
        </div>
      </header>

      {/* 2. Editorial Body Layout */}
      <div className="story-editorial-body-wrap">
        {/* Navigation Breadcrumb Bar */}
        <nav aria-label="Breadcrumbs" className="story-nav-bar">
          <Link href="/#stories" className="story-back-link">
            <ArrowLeft size={16} /> Return to Stories
          </Link>
          <div className="story-share-wrap">
            <span className="story-share-label">SHARE</span>
            <button
              type="button"
              className="story-share-btn"
              aria-label="Share article"
            >
              <Share2 size={15} />
            </button>
          </div>
        </nav>

        {/* Intro Lead Text */}
        {story.excerpt && (
          <div className="story-lead-intro">
            <p>{story.excerpt}</p>
          </div>
        )}

        {/* Alternating Content Blocks */}
        <div className="story-content-stream">
          {story.contentBlocks.map((block) => {
            if (block.type === "paragraph" && block.text) {
              return (
                <p key={block.id} className="story-body-paragraph">
                  {block.text}
                </p>
              );
            }

            if (block.type === "heading" && block.text) {
              return (
                <h2 key={block.id} className="story-body-subheading">
                  {block.text}
                </h2>
              );
            }

            if (block.type === "quote" && block.text) {
              return (
                <figure key={block.id} className="story-pull-quote-wrap">
                  <blockquote className="story-pull-quote">
                    &ldquo;{block.text}&rdquo;
                  </blockquote>
                  {block.author && (
                    <figcaption className="story-quote-caption">
                      — {block.author}
                    </figcaption>
                  )}
                </figure>
              );
            }

            if (block.type === "image" && block.image) {
              return (
                <figure key={block.id} className="story-inline-media">
                  <div className="story-inline-media-frame">
                    <Image
                      src={block.image}
                      alt={block.caption || story.title}
                      fill
                      sizes="(max-width: 1024px) 100vw, 980px"
                      className="story-inline-media-img"
                    />
                  </div>
                  {block.caption && (
                    <figcaption className="story-inline-media-caption">
                      {block.caption}
                    </figcaption>
                  )}
                </figure>
              );
            }

            return null;
          })}
        </div>

        {/* Photo Gallery Grid */}
        {story.gallery && story.gallery.length > 0 && (
          <section className="story-gallery-section" aria-label="Photo gallery">
            <p className="story-section-eyebrow">PHOTO ESSAY & DETAILS</p>
            <div className="story-gallery-grid">
              {story.gallery.map((imgUrl, i) => (
                <div key={i} className="story-gallery-item">
                  <Image
                    src={imgUrl}
                    alt={`${story.title} visual study ${i + 1}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="story-gallery-img"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Curated Related Products */}
        {displayProducts.length > 0 && (
          <section className="story-related-products" aria-labelledby="featured-pieces-heading">
            <div className="story-section-header">
              <p className="story-section-eyebrow">FEATURED IN THIS EDIT</p>
              <h2 id="featured-pieces-heading">Objects for the Journey</h2>
            </div>

            <div className="story-products-grid">
              {displayProducts.map((prod) => (
                <div key={prod.id} className="story-product-card">
                  <Link href={`/products/${prod.slug}`} className="story-product-img-wrap">
                    <Image
                      src={prod.image}
                      alt={prod.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 30vw"
                      className="story-product-img"
                    />
                  </Link>
                  <div className="story-product-info">
                    <span className="story-product-material">{prod.material}</span>
                    <h3 className="story-product-name">
                      <Link href={`/products/${prod.slug}`}>{prod.name}</Link>
                    </h3>
                    <p className="story-product-price">
                      {displayMoney(prod.variants[0].price)}
                    </p>
                    <Link href={`/products/${prod.slug}`} className="story-product-cta">
                      Discover Piece <ArrowUpRight size={14} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Related Stories */}
        {relatedStories.length > 0 && (
          <section className="story-more-stories" aria-labelledby="more-stories-heading">
            <div className="story-section-header">
              <p className="story-section-eyebrow">CONTINUE READING</p>
              <h2 id="more-stories-heading">More from the OVIA Journal</h2>
            </div>

            <div className="story-more-grid">
              {relatedStories.map((relStory) => (
                <article key={relStory.id} className="story-more-card">
                  <Link href={`/journal/${relStory.slug}`} className="story-more-img-wrap">
                    <Image
                      src={(typeof relStory.thumbnail === "string" && relStory.thumbnail.trim()) || (typeof relStory.heroImage === "string" && relStory.heroImage.trim()) || "/media/case-flowers.jpg"}
                      alt={relStory.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="story-more-img"
                    />
                  </Link>
                  <p className="story-more-category">{relStory.category}</p>
                  <h3 className="story-more-title">
                    <Link href={`/journal/${relStory.slug}`}>{relStory.title}</Link>
                  </h3>
                  <Link href={`/journal/${relStory.slug}`} className="story-more-read">
                    READ
                  </Link>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Back Link Footer */}
        <div className="story-bottom-nav">
          <Link href="/#stories" className="button dark">
            <ArrowLeft size={16} /> Explore All Stories
          </Link>
        </div>
      </div>
    </article>
  );
}
