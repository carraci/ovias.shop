"use client";
import "@/components/page-styles/editorial.css";


import { useEffect, useRef, useState } from "react";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Product } from "@/lib/catalog";
import { ProductPhoto } from "./product-photo";
import { DisplayPrice } from "./display-price";
import { useStore } from "./store-provider";
import styles from "./iconic-products-carousel.module.css";

function ShowcaseCard({ product, compact }: { product: Product; compact: boolean }) {
  const { add } = useStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [active, setActive] = useState(0);
  const images = [...new Set([product.image, ...(product.images?.gallery || []), ...(product.gallery || [])].filter(Boolean))].slice(0, 3);
  const variant = product.variants[0];
  async function addToCart() {
    if (!variant || busy) return;
    setBusy(true);
    setError("");
    try { await add(variant.sku); }
    catch (error) { setError(error instanceof Error ? error.message : "Unable to add this item. Please try again."); }
    finally { setBusy(false); }
  }
  return (
    <article className={styles.card}>
      <div className={styles.media}>
        <a data-store-navigation href={`/products/${product.slug}`} aria-label={`View ${product.name}`}>
          <ProductPhoto src={images[active]} fallbackSources={[...images, product.images?.main || "", ...product.variants.map((variant) => variant.image || "")]} alt={product.name} fill sizes={compact ? "(max-width: 600px) 75vw, (max-width: 1000px) 32vw, 17vw" : "(max-width: 600px) 85vw, (max-width: 1000px) 45vw, 25vw"} className={styles.photo} />
        </a>
        {images.length > 1 && <div className={styles.dots} aria-label={`${product.name} photos`}>
          {images.map((image, index) => <button key={image} type="button" aria-label={`Show photo ${index + 1} of ${product.name}`} aria-pressed={active === index} className={active === index ? styles.activeDot : ""} onClick={() => setActive(index)} />)}
        </div>}
      </div>
      <div className={styles.details}>
        <p className={styles.eyebrow}>{product.category}</p>
        <a data-store-navigation href={`/products/${product.slug}`} className={styles.name}>{product.name}</a>
        <div className={styles.price}>{variant && <DisplayPrice amount={variant.price} />}</div>
        <button type="button" className={styles.add} disabled={busy || !variant || variant.stock <= 0} onClick={addToCart} aria-label={`Add ${product.name} to cart`}>
          {busy ? "ADDING…" : !variant || variant.stock <= 0 ? "SOLD OUT" : "ADD TO CART"}
        </button>
        {error && <p className={styles.error} role="alert">{error}</p>}
      </div>
    </article>
  );
}

function ProductRow({ title, items, compact = false, href }: { title: string; items: Product[]; compact?: boolean; href: string }) {
  const track = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });
  function updateEdges() {
    const el = track.current;
    if (el) setEdges({ left: el.scrollLeft > 2, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 2 });
  }
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const observer = new ResizeObserver(updateEdges);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  function scroll(direction: number) {
    const el = track.current;
    if (el) el.scrollBy({ left: direction * el.clientWidth, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }
  if (!items.length) return null;
  return <section className={styles.section} aria-label={title}>
    <div className={styles.heading}><h2>{title}</h2><a data-store-navigation href={href}>View All</a></div>
    <div className={styles.viewport}>
      <div ref={track} onScroll={updateEdges} className={`${styles.track} ${compact ? styles.compact : ""}`}>
        {items.map(product => <ShowcaseCard key={product.id} product={product} compact={compact} />)}
      </div>
      {edges.left && <button type="button" className={`${styles.arrow} ${styles.prev}`} aria-label={`Previous ${title}`} onClick={() => scroll(-1)}><ChevronLeft size={18} /></button>}
      {edges.right && <button type="button" className={`${styles.arrow} ${styles.next}`} aria-label={`Next ${title}`} onClick={() => scroll(1)}><ChevronRight size={18} /></button>}
    </div>
  </section>;
}

export function IconicAndRecommendedSections({ bestsellers, arrivals }: { bestsellers: Product[]; arrivals: Product[] }) {
  return <div className={styles.showcase}>
    <ProductRow title="Explore Bestsellers" items={bestsellers} href="/search" />
    <ProductRow title="New Arrivals" items={arrivals} compact href="/new" />
  </div>;
}

