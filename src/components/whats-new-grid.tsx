"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import styles from "@/app/whats-new/whats-new.module.css";

export interface WhatsNewItem {
  id: string;
  type: "New Arrivals" | "Collections" | "Stories" | "Updates";
  categoryLabel: string;
  title: string;
  description: string;
  image: string;
  href: string;
  ctaText?: string;
  price?: string;
}

interface WhatsNewGridProps {
  items: WhatsNewItem[];
}

const TABS = ["All", "New Arrivals", "Collections", "Stories", "Updates"] as const;

export function WhatsNewGrid({ items }: WhatsNewGridProps) {
  const [activeTab, setActiveTab] = useState<string>("All");

  const filtered = items.filter((item) => {
    if (activeTab === "All") return true;
    return item.type === activeTab;
  });

  return (
    <section className={styles.discoverSection} aria-labelledby="discover-title">
      <div className={styles.discoverHeader}>
        <h2 id="discover-title" className={styles.discoverTitle}>
          Discover What&apos;s New
        </h2>
        <p className={styles.discoverSubtitle}>
          Explore the latest designs, limited editions and stories from our ateliers.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className={styles.tabsRow} role="tablist" aria-label="What's new topics">
        {TABS.map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            className={`${styles.tabBtn} ${
              activeTab === tab ? styles.tabBtnActive : ""
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 2-Column Luxury Editorial Grid */}
      <div className={styles.grid}>
        {filtered.map((item) => (
          <Link key={item.id} href={item.href} className={styles.card}>
            <div className={styles.cardMediaWrap}>
              <Image
                src={item.image}
                alt={item.title}
                fill
                sizes="(max-width: 768px) 100vw, 560px"
                className={styles.cardMedia}
              />
            </div>
            <span className={styles.cardCategory}>{item.categoryLabel}</span>
            <h3 className={styles.cardTitle}>{item.title}</h3>
            {item.description && (
              <p className={styles.cardDesc}>{item.description}</p>
            )}
            {item.price && <span className={styles.cardPrice}>{item.price}</span>}
            <span className={styles.cardLink}>
              {item.ctaText || "Explore"}
              <ArrowUpRight size={14} aria-hidden="true" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
