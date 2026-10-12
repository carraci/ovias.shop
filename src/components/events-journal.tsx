"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { OviaEvent } from "@/lib/events";
import styles from "@/app/events/events.module.css";

interface EventsJournalProps {
  initialEvents: OviaEvent[];
}

const TABS = ["All Stories", "Events", "Launches", "Experiences"] as const;

export function EventsJournal({ initialEvents }: EventsJournalProps) {
  const [activeTab, setActiveTab] = useState<string>("All Stories");

  const filteredEvents = initialEvents.filter((ev) => {
    if (activeTab === "All Stories") return true;
    if (activeTab === "Events")
      return ev.category === "Events" || ev.category === "Exhibition";
    if (activeTab === "Launches")
      return ev.category === "Launches" || ev.category === "Collections";
    if (activeTab === "Experiences") return ev.category === "Experiences";
    return true;
  });

  return (
    <section className={styles.journalSection} aria-labelledby="journal-title">
      <div className={styles.journalHeader}>
        <h2 id="journal-title" className={styles.journalTitle}>
          The Journal
        </h2>
        <p className={styles.journalSubtitle}>
          A collection of OVIA moments and experiences.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className={styles.tabsRow} role="tablist" aria-label="Journal topics">
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

      {/* 2-Column Luxury Journal Grid */}
      <div className={styles.journalGrid}>
        {filteredEvents.map((item) => (
          <Link
            key={item.id}
            href={`/events/${item.slug}`}
            className={styles.journalCard}
          >
            <div className={styles.journalCardMediaWrap}>
              <Image
                src={item.image}
                alt={item.title}
                fill
                sizes="(max-width: 768px) 100vw, 560px"
                className={styles.journalCardMedia}
              />
            </div>
            <span className={styles.journalCardCategory}>
              {item.category.toUpperCase()}
            </span>
            <h3 className={styles.journalCardTitle}>{item.title}</h3>
            <span className={styles.journalCardLink}>
              Read Story
              <ArrowUpRight size={14} aria-hidden="true" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
