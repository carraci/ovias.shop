"use client";
import Link from "next/link";
import Image from "next/image";
import { Instrument_Serif } from "next/font/google";
import { ArrowRight } from "lucide-react";
import styles from "./cinematic-home-hero.module.css";
const display = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  display: "optional",
});
export function CinematicHomeHero() {
  return (
    <section
      data-default-home-hero
      className={styles.hero}
      aria-label="Discover OVIA travel goods"
    >
      <Image
        src="/media/editorial-hero.png"
        alt="OVIA luxury handcrafted leather bags and travel goods"
        fill
        priority
        sizes="100vw"
        className={styles.video}
      />
      <div className={styles.overlay} />
      <div className={styles.content}>
        <p className={styles.eyebrow}>OVIA · THE ART OF TRAVEL</p>
        <h1 className={`${styles.heading} ${display.className}`}>
          Built for <em>everyday</em>
          <br />
          journeys.
        </h1>
        <p className={styles.description}>
          Considered travel essentials for wherever life takes you. Discover
          luggage and bags designed to move beautifully through your world.
        </p>
        <Link prefetch={false} className={styles.action} href="/bags">
          Discover the selection <ArrowRight size={18} strokeWidth={1.5} />
        </Link>
      </div>
    </section>
  );
}
