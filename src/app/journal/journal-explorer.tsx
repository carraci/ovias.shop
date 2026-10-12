"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, X, Clock, Calendar, ArrowRight, ArrowUpRight } from "lucide-react";
import type { Story } from "@/lib/types";

interface JournalExplorerProps {
  initialStories: Story[];
}

export function JournalExplorer({ initialStories }: JournalExplorerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [visibleCount, setVisibleCount] = useState(6);

  // Extract all unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    initialStories.forEach((s) => {
      if (s.category) set.add(s.category.trim());
    });
    return ["All", ...Array.from(set)];
  }, [initialStories]);

  // Filtered stories based on search and category
  const filteredStories = useMemo(() => {
    return initialStories.filter((story) => {
      const matchesCategory =
        selectedCategory === "All" ||
        story.category?.toLowerCase() === selectedCategory.toLowerCase();

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        story.title?.toLowerCase().includes(q) ||
        story.excerpt?.toLowerCase().includes(q) ||
        story.author?.toLowerCase().includes(q) ||
        story.category?.toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [initialStories, selectedCategory, searchQuery]);

  // Featured story: first featured or first item
  const featuredStory = useMemo(() => {
    if (selectedCategory !== "All" || searchQuery) return null;
    return initialStories.find((s) => s.featured) || initialStories[0] || null;
  }, [initialStories, selectedCategory, searchQuery]);

  // Rest of stories to show in grid
  const gridStories = useMemo(() => {
    if (featuredStory && selectedCategory === "All" && !searchQuery) {
      return filteredStories.filter((s) => s.id !== featuredStory.id);
    }
    return filteredStories;
  }, [filteredStories, featuredStory, selectedCategory, searchQuery]);

  const displayedStories = gridStories.slice(0, visibleCount);
  const hasMore = gridStories.length > visibleCount;

  return (
    <div className="journal-explorer-wrap" style={{ width: "100%", maxWidth: 1280, margin: "0 auto" }}>
      {/* Search & Category Filter Toolbar */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          margin: "24px 0 40px",
          paddingBottom: 24,
          borderBottom: "1px solid var(--border, #EAE5DC)",
        }}
      >
        {/* Category Pills */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 8,
          }}
        >
          {categories.map((cat) => {
            const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat);
                  setVisibleCount(6);
                }}
                style={{
                  padding: "7px 16px",
                  borderRadius: 24,
                  fontSize: 13,
                  fontWeight: 500,
                  letterSpacing: "0.02em",
                  border: isSelected ? "1px solid #111111" : "1px solid #E2DCD2",
                  backgroundColor: isSelected ? "#111111" : "#FFFFFF",
                  color: isSelected ? "#FFFFFF" : "#555555",
                  cursor: "pointer",
                  transition: "all 0.18s ease",
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div
          style={{
            position: "relative",
            minWidth: 260,
            maxWidth: 360,
            flex: "1 1 260px",
          }}
        >
          <Search
            size={16}
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#888888",
              pointerEvents: "none",
            }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setVisibleCount(6);
            }}
            placeholder="Search articles, topics, authors..."
            style={{
              width: "100%",
              padding: "9px 36px 9px 36px",
              borderRadius: 24,
              border: "1px solid #DCD5C9",
              backgroundColor: "#FAF8F5",
              fontSize: 13,
              color: "#111111",
              outline: "none",
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                padding: 0,
                color: "#888888",
                cursor: "pointer",
              }}
              aria-label="Clear search"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Featured Lead Story (Only if showing All and no search) */}
      {featuredStory && (
        <section
          style={{
            marginBottom: 56,
            borderRadius: 8,
            overflow: "hidden",
            backgroundColor: "#FAF8F5",
            border: "1px solid #EAE5DC",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              alignItems: "stretch",
            }}
          >
            <Link
              href={`/journal/${featuredStory.slug}`}
              style={{
                position: "relative",
                minHeight: 380,
                display: "block",
                overflow: "hidden",
              }}
            >
              <Image
                src={featuredStory.heroImage || featuredStory.thumbnail || "/media/case-flowers.jpg"}
                alt={featuredStory.title}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 55vw"
                style={{
                  objectFit: "cover",
                  transition: "transform 0.4s ease",
                }}
              />
            </Link>

            <div
              style={{
                padding: "40px 36px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 16,
                  fontSize: 12,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "#777777",
                }}
              >
                <span
                  style={{
                    backgroundColor: "#111111",
                    color: "#FFFFFF",
                    padding: "3px 10px",
                    borderRadius: 12,
                    fontWeight: 600,
                  }}
                >
                  {featuredStory.category}
                </span>
                <span>·</span>
                <span>{featuredStory.readingTime || "5 min read"}</span>
              </div>

              <h2
                style={{
                  fontFamily: "Georgia, serif",
                  fontSize: "clamp(24px, 3.2vw, 36px)",
                  lineHeight: 1.25,
                  fontWeight: 600,
                  margin: "0 0 16px",
                  color: "#111111",
                }}
              >
                <Link
                  href={`/journal/${featuredStory.slug}`}
                  style={{ color: "inherit", textDecoration: "none" }}
                >
                  {featuredStory.title}
                </Link>
              </h2>

              <p
                style={{
                  fontSize: 15,
                  lineHeight: 1.7,
                  color: "#555555",
                  margin: "0 0 24px",
                  maxWidth: 520,
                }}
              >
                {featuredStory.excerpt}
              </p>

              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <Link
                  href={`/journal/${featuredStory.slug}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 22px",
                    backgroundColor: "#111111",
                    color: "#FFFFFF",
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    borderRadius: 24,
                    textDecoration: "none",
                  }}
                >
                  READ ARTICLE <ArrowRight size={14} />
                </Link>
                {featuredStory.author && (
                  <span style={{ fontSize: 13, color: "#777777" }}>
                    By {featuredStory.author}
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Grid of Articles */}
      {displayedStories.length > 0 ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 32,
            marginBottom: 48,
          }}
        >
          {displayedStories.map((story) => (
            <article
              key={story.id || story.slug}
              style={{
                display: "flex",
                flexDirection: "column",
                border: "1px solid #EAE5DC",
                borderRadius: 8,
                overflow: "hidden",
                backgroundColor: "#FFFFFF",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
              }}
            >
              <Link
                href={`/journal/${story.slug}`}
                style={{
                  position: "relative",
                  width: "100%",
                  aspectRatio: "16 / 10",
                  display: "block",
                  overflow: "hidden",
                  backgroundColor: "#F2EFEB",
                }}
              >
                <Image
                  src={story.thumbnail || story.heroImage || "/media/case-flowers.jpg"}
                  alt={story.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  style={{
                    objectFit: "cover",
                    transition: "transform 0.3s ease",
                  }}
                />
              </Link>

              <div
                style={{
                  padding: "20px 22px 24px",
                  display: "flex",
                  flexDirection: "column",
                  flex: 1,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 10,
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "#888888",
                  }}
                >
                  <span style={{ color: "#B45309", fontWeight: 600 }}>
                    {story.category}
                  </span>
                  <span>·</span>
                  <span>{story.readingTime || "4 min read"}</span>
                </div>

                <h3
                  style={{
                    fontFamily: "Georgia, serif",
                    fontSize: 19,
                    lineHeight: 1.35,
                    fontWeight: 600,
                    margin: "0 0 10px",
                    color: "#111111",
                    flex: "0 0 auto",
                  }}
                >
                  <Link
                    href={`/journal/${story.slug}`}
                    style={{ color: "inherit", textDecoration: "none" }}
                  >
                    {story.title}
                  </Link>
                </h3>

                <p
                  style={{
                    fontSize: 14,
                    lineHeight: 1.6,
                    color: "#666666",
                    margin: "0 0 20px",
                    flex: 1,
                  }}
                >
                  {story.excerpt}
                </p>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingTop: 14,
                    borderTop: "1px solid #F0ECE4",
                    fontSize: 12,
                  }}
                >
                  <span style={{ color: "#888888" }}>
                    {story.author || "OVIA Editorial"}
                  </span>
                  <Link
                    href={`/journal/${story.slug}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      color: "#111111",
                      fontWeight: 600,
                      textDecoration: "none",
                    }}
                  >
                    READ ARTICLE <ArrowUpRight size={13} />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div
          style={{
            padding: "80px 20px",
            textAlign: "center",
            backgroundColor: "#FAF8F5",
            borderRadius: 8,
            border: "1px dashed #D5CFC5",
            margin: "24px 0",
          }}
        >
          <p
            style={{
              fontSize: 18,
              fontFamily: "Georgia, serif",
              margin: "0 0 8px",
              color: "#333333",
            }}
          >
            No articles found matching &ldquo;{searchQuery}&rdquo;
          </p>
          <p style={{ fontSize: 14, color: "#777777", margin: "0 0 20px" }}>
            Try checking for spelling errors or clear your category filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("All");
            }}
            style={{
              padding: "8px 20px",
              backgroundColor: "#111111",
              color: "#FFFFFF",
              fontSize: 13,
              borderRadius: 20,
              border: "none",
              cursor: "pointer",
            }}
          >
            Reset All Filters
          </button>
        </div>
      )}

      {/* Pagination / Load More Button */}
      {hasMore && (
        <div style={{ textAlign: "center", margin: "32px 0 64px" }}>
          <button
            type="button"
            onClick={() => setVisibleCount((prev) => prev + 6)}
            style={{
              padding: "12px 32px",
              borderRadius: 24,
              border: "1px solid #111111",
              backgroundColor: "#FFFFFF",
              color: "#111111",
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "0.04em",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            LOAD MORE ARTICLES ({gridStories.length - visibleCount} REMAINING)
          </button>
        </div>
      )}
    </div>
  );
}
