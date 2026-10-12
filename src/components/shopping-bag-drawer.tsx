"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X, Minus, Plus, ArrowRight } from "lucide-react";
import { useStore } from "@/components/store-provider";
import { usePreferences } from "@/components/preferences";
import styles from "./shopping-bag-drawer.module.css";

interface RecItem {
  id: string;
  sku: string;
  name: string;
  price: number;
  image: string;
  slug: string;
}

export function ShoppingBagDrawer() {
  const router = useRouter();
  const { cart, setQuantity, add, isCartDrawerOpen, closeCartDrawer } = useStore();
  const { format } = usePreferences();
  const [busySku, setBusySku] = useState<string | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  const [recommendations, setRecommendations] = useState<RecItem[]>([]);
  useEffect(() => {
    if (!isCartDrawerOpen) return;
    const controller = new AbortController();
    async function refresh() {
      try {
        const response = await fetch("/api/products?limit=24", {cache:"no-store",signal:controller.signal});
        if(!response.ok) throw new Error();
        const data = await response.json();
        setRecommendations((data.items || []).flatMap((product: import("@/lib/catalog").Product) => {
          const variant = product.variants.find(item => item.stock > 0);
          return variant ? [{id:product.id,sku:variant.sku,name:product.name,price:variant.price,image:variant.image || product.image,slug:product.slug}] : [];
        }).slice(0,3));
      } catch { if(!controller.signal.aborted) setRecommendations([]); }
    }
    void refresh(); const timer=setInterval(refresh,15000);
    return () => {controller.abort();clearInterval(timer);};
  },[isCartDrawerOpen]);
  const totalItems = cart.lines.reduce((n, l) => n + l.quantity, 0);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isCartDrawerOpen) {
        closeCartDrawer();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCartDrawerOpen, closeCartDrawer]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isCartDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isCartDrawerOpen]);

  async function handleUpdateQuantity(sku: string, q: number) {
    setBusySku(sku);
    try {
      await setQuantity(sku, q);
    } finally {
      setBusySku(null);
    }
  }

  async function handleAddRec(rec: RecItem) {
    setBusySku(rec.sku);
    try {
      await add(rec.sku, 1);
    } finally {
      setBusySku(null);
    }
  }

  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 160, behavior: "smooth" });
    }
  };

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className={`${styles.overlay} ${isCartDrawerOpen ? styles.isOpen : ""}`}
        onClick={closeCartDrawer}
        aria-hidden={!isCartDrawerOpen}
      />

      {/* Slide-out drawer */}
      <aside
        className={`${styles.drawer} ${isCartDrawerOpen ? styles.isOpen : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Your Shopping bag"
        aria-hidden={!isCartDrawerOpen}
      >
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>Your Shopping bag</h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={closeCartDrawer}
            aria-label="Close shopping bag"
          >
            <X size={22} strokeWidth={1.5} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className={styles.content}>
          {cart.lines.length === 0 ? (
            <div className={styles.emptyState}>
              <p>Your shopping bag is currently empty.</p>
              <Link
                href="/luggage"
                className={styles.emptyStateLink}
                onClick={closeCartDrawer}
              >
                Discover Luggage
              </Link>
            </div>
          ) : (
            <div className={styles.itemsList}>
              {cart.lines.map((item) => {
                const isBusy = busySku === item.sku;
                return (
                  <article className={styles.itemCard} key={item.sku}>
                    <div className={styles.itemImageWrap}>
                      <></>
                    </div>
                    <div className={styles.itemDetails}>
                      <p className={styles.itemEyebrow}>ORIGINAL</p>
                      <Link
                        href={`/products/${item.slug}`}
                        className={styles.itemName}
                        onClick={closeCartDrawer}
                      >
                        {item.name}
                      </Link>
                      <p className={styles.itemPrice}>{format(item.price)}</p>
                      <div className={styles.itemActions}>
                        <div className={styles.stepper}>
                          <button
                            type="button"
                            className={styles.stepperBtn}
                            disabled={isBusy}
                            onClick={() => handleUpdateQuantity(item.sku, item.quantity - 1)}
                            aria-label={`Decrease ${item.name} quantity`}
                          >
                            <Minus size={13} />
                          </button>
                          <span className={styles.stepperVal}>{item.quantity}</span>
                          <button
                            type="button"
                            className={styles.stepperBtn}
                            disabled={isBusy || item.quantity >= 10}
                            onClick={() => handleUpdateQuantity(item.sku, item.quantity + 1)}
                            aria-label={`Increase ${item.name} quantity`}
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                        <button
                          type="button"
                          className={styles.removeBtn}
                          disabled={isBusy}
                          onClick={() => handleUpdateQuantity(item.sku, 0)}
                          aria-label={`Remove ${item.name} from bag`}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* Recommended For You Section */}
          {recommendations.length > 0 && <div className={styles.recSection}>
            <h3 className={styles.recTitle}>Recommended for you</h3>
            <div className={styles.recCarouselWrapper}>
              <div className={styles.recCarousel} ref={carouselRef}>
                {recommendations.map((rec) => (
                  <div className={styles.recCard} key={rec.id}>
                    <div className={styles.recImageWrap}>
                      <></>
                    </div>
                    <Link
                      href={`/products/${rec.slug}`}
                      className={styles.recName}
                      onClick={closeCartDrawer}
                      title={rec.name}
                    >
                      {rec.name}
                    </Link>
                    <p className={styles.recPrice}>{format(rec.price)}</p>
                    <button
                      type="button"
                      className={styles.recAddBtn}
                      disabled={busySku === rec.sku}
                      onClick={() => handleAddRec(rec)}
                    >
                      {busySku === rec.sku ? "Adding..." : "Add to Cart"}
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className={styles.recArrowBtn}
                onClick={scrollRight}
                aria-label="Scroll recommended items"
              >
                <ArrowRight size={15} />
              </button>
            </div>
          </div>}
        </div>

        {/* Sticky Footer */}
        {cart.lines.length > 0 && (
          <div className={styles.footer}>
            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>
                Total ({totalItems} {totalItems === 1 ? "item" : "items"})
              </span>
              <div className={styles.totalRight}>
                <span className={styles.totalAmount}>{format(cart.total)}</span>
                <span className={styles.taxNote}>Inclusive of all taxes</span>
              </div>
            </div>

            <button
              type="button"
              className={styles.checkoutBtn}
              onClick={() => {
                closeCartDrawer();
                router.push("/checkout");
              }}
            >
              Checkout Now
            </button>

            <button
              type="button"
              className={styles.modifyCartLink}
              onClick={() => {
                closeCartDrawer();
                router.push("/cart");
              }}
            >
              Modify your shopping cart
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
