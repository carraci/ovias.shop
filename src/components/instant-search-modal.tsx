"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X, ArrowRight, Loader2 } from "lucide-react";
import { usePreferences } from "@/components/preferences";
import type { AlgoliaProductHit } from "@/lib/algolia";
import styles from "./instant-search-modal.module.css";

interface InstantSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_TAGS = [
  "Cabin Luggage",
  "Check-In",
  "Trunk",
  "Backpacks",
  "Duffle Bags",
  "Briefcases",
  "Aluminium",
  "Leather",
];

export function InstantSearchModal({ isOpen, onClose }: InstantSearchModalProps) {
  const router = useRouter();
  const { format } = usePreferences();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AlgoliaProductHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [totalHits, setTotalHits] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      document.body.style.overflow = "";
      setQuery("");
      setResults([]);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Escape key closes modal
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Debounced search query
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setTotalHits(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    setSearchError("");
    const controller = new AbortController();
    let active = true;
    const timeout = setTimeout(async () => {
      const deadline = setTimeout(() => controller.abort(), 15000);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}&limit=6`, {signal: controller.signal, cache: "no-store"});
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Search is unavailable.");
        if (active) { setResults(data.hits || []); setTotalHits(data.nbHits || 0); }
      } catch {
        if (active) { setResults([]); setTotalHits(0); setSearchError("Search could not be completed. Please try again."); }
      } finally { clearTimeout(deadline); if (active) setLoading(false); }
    }, 180);
    return () => { active = false; clearTimeout(timeout); controller.abort(); };
  }, [query]);

  if (!isOpen) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      onClose();
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }

  function handleTagClick(tag: string) {
    setQuery(tag);
  }

  return (
    <div
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Search products"
    >
      <div className={styles.modal}>
        {/* Header / Input */}
        <form onSubmit={handleSubmit} className={styles.searchHeader}>
          <Search size={20} className={styles.searchIcon} />
          <input
            ref={inputRef}
            type="text"
            className={styles.searchInput}
            placeholder="Search luggage, bags, accessories, or materials..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              type="button"
              className={styles.clearBtn}
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              aria-label="Clear search query"
            >
              <X size={16} />
            </button>
          )}
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close search"
          >
            <span className={styles.closeKeyHint}>ESC</span>
          </button>
        </form>

        {/* Content Body */}
        <div className={styles.body}>
          {!query.trim() && (
            <div className={styles.quickSection}>
              <h4 className={styles.sectionLabel}>Popular Searches</h4>
              <div className={styles.quickTags}>
                {QUICK_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className={styles.quickTag}
                    onClick={() => handleTagClick(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {searchError && <p role="alert" className={styles.emptyState}>{searchError}</p>}
          {loading && (
            <div className={styles.loadingState}>
              <Loader2 size={20} className="animate-spin" style={{ marginRight: 8 }} />
              Searching OVIA catalog...
            </div>
          )}

          {!loading && !searchError && query.trim() && results.length === 0 && (
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>No matching products found</p>
              <p className={styles.emptySubtitle}>
                Try adjusting your search terms or explore our curated luggage and bag collections.
              </p>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className={styles.resultsList}>
              {results.map((hit) => (
                <Link
                  key={hit.objectID}
                  href={`/products/${hit.slug}`}
                  className={styles.resultItem}
                  onClick={onClose}
                >
                  <div className={styles.thumbWrap}>
                    <></>
                  </div>
                  <div className={styles.itemInfo}>
                    <p className={styles.itemCategory}>
                      {hit.category || hit.department}
                    </p>
                    <h4 className={styles.itemName}>{hit.name}</h4>
                    <p className={styles.itemMeta}>
                      {[hit.material, hit.color].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <span className={styles.itemPrice}>{format(hit.price)}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {query.trim() && results.length > 0 && (
          <div className={styles.footerBar}>
            <Link
              href={`/search?q=${encodeURIComponent(query.trim())}`}
              className={styles.viewAllLink}
              onClick={onClose}
            >
              View all {totalHits} results <ArrowRight size={14} />
            </Link>
            <span className={styles.algoliaBadge}>Powered by Algolia</span>
          </div>
        )}
      </div>
    </div>
  );
}
