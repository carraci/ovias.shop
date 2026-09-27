"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, X, ArrowUpRight } from "lucide-react";
import { searchFaqs, type FaqItem } from "@/lib/faq-data";

interface FaqSearchBarProps {
  placeholder?: string;
  initialQuery?: string;
  className?: string;
  autoFocus?: boolean;
}

export function FaqSearchBar({
  placeholder = "Search for a question...",
  initialQuery = "",
  className = "",
  autoFocus = false,
}: FaqSearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<FaqItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      setSelectedIndex(-1);
      return;
    }

    const matched = searchFaqs(query);
    setResults(matched.slice(0, 7));
    setIsOpen(true);
    setSelectedIndex(-1);
  }, [query]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === "Enter") {
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        e.preventDefault();
        navigateToItem(results[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const navigateToItem = (item: FaqItem) => {
    setIsOpen(false);
    router.push(`/faq/${item.category}/${item.slug}`);
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  // Helper to highlight matching terms
  const renderHighlighted = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    const parts = text.split(new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
    return parts.map((part, index) =>
      part.toLowerCase() === highlight.toLowerCase() ? (
        <mark key={index} className="faq-search-highlight">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div ref={containerRef} className={`faq-search-wrapper ${className}`.trim()}>
      <div className="faq-search-bar">
        <Search className="faq-search-icon" size={18} strokeWidth={1.5} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim() && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label="Search FAQ questions"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          autoFocus={autoFocus}
          className="faq-search-input"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="faq-search-clear"
            aria-label="Clear search"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="faq-search-dropdown" role="listbox">
          {results.length > 0 ? (
            <ul>
              {results.map((item, idx) => (
                <li
                  key={item.id}
                  role="option"
                  aria-selected={selectedIndex === idx}
                  className={`faq-search-item ${selectedIndex === idx ? "active" : ""}`}
                  onClick={() => navigateToItem(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <div className="faq-search-item-info">
                    <span className="faq-search-item-category">
                      {item.category.replace("-", " & ").toUpperCase()}
                    </span>
                    <p className="faq-search-item-question">
                      {renderHighlighted(item.question, query)}
                    </p>
                  </div>
                  <ArrowUpRight size={16} className="faq-search-item-arrow" />
                </li>
              ))}
            </ul>
          ) : (
            <div className="faq-search-no-results">
              <p>No questions found matching &ldquo;{query}&rdquo;.</p>
              <span>Our Client Advisors are available to assist with specific inquiries.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
