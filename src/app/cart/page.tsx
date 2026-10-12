"use client";
import "@/components/page-styles/cart.css";


import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Minus,
  Plus,
  Heart,
  ChevronLeft,
  ChevronRight,
  Truck,
  FileText,
  ShieldCheck,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { useStore } from "@/components/store-provider";
import { usePreferences } from "@/components/preferences";
import styles from "./cart.module.css";

interface RecProduct {
  id: string;
  sku: string;
  name: string;
  price: number;
  image: string;
  slug: string;
}

const CART_RECOMMENDATIONS: RecProduct[] = [
  {
    id: "checkin-m",
    sku: "OV-ORIG-CHECKIN-M-SILVER",
    name: "Original Check-In M",
    price: 100,
    image: "/media/cart/checkin-m.png",
    slug: "original-check-in-m",
  },
  {
    id: "trunk-plus",
    sku: "OV-TRUNK-2-PRIMARY",
    name: "Original Trunk Plus",
    price: 100,
    image: "/media/cart/trunk-plus.png",
    slug: "trunk-2-original-trunk-plus",
  },
  {
    id: "cabin-black",
    sku: "OV-ORIG-CABIN-BLACK",
    name: "Original Cabin",
    price: 100,
    image: "/media/cart/cabin-black.png",
    slug: "original-cabin",
  },
  {
    id: "trunk-silver",
    sku: "OV-TRUNK-27-PRIMARY",
    name: "Original Trunk",
    price: 100,
    image: "/media/cart/trunk-silver.png",
    slug: "trunk-27-original-trunk",
  },
];

export default function CartPage() {
  const router = useRouter();
  const { cart, setQuantity, add } = useStore();
  const { format } = usePreferences();
  const [error, setError] = useState("");
  const [busySku, setBusySku] = useState<string | null>(null);
  const [wishlist, setWishlist] = useState<Record<string, boolean>>({});
  const recGridRef = useRef<HTMLDivElement>(null);

  const totalItems = cart.lines.reduce((n, l) => n + l.quantity, 0);

  async function handleUpdateQuantity(sku: string, q: number) {
    setBusySku(sku);
    setError("");
    try {
      await setQuantity(sku, q);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusySku(null);
    }
  }

  async function handleAddRec(rec: RecProduct) {
    setBusySku(rec.sku);
    setError("");
    try {
      await add(rec.sku, 1);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusySku(null);
    }
  }

  const toggleWishlist = (id: string) => {
    setWishlist((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const scrollRec = (dir: "left" | "right") => {
    if (recGridRef.current) {
      const offset = dir === "left" ? -280 : 280;
      recGridRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  return (
    <div className={styles.pageWrap}>
      <div className={styles.pageInner}>
        {/* Top Action Bar (Image 2) */}
        {cart.lines.length > 0 && (
          <div className={styles.topActionBar}>
            <span className={styles.topTotalLabel}>
              Total ({totalItems} {totalItems === 1 ? "item" : "items"}){" "}
              <strong>{format(cart.total)}</strong>
            </span>
            <Link href="/checkout" className={styles.topProceedBtn}>
              Checkout Now
            </Link>
          </div>
        )}

        {/* Page Header */}
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Your cart</h1>
          <p className={styles.deliveryAddressNote}>
            Your delivery address is currently in India.
            <button
              type="button"
              className={styles.changeLink}
              onClick={() => alert("Deliveries are currently supported throughout India.")}
            >
              Change
            </button>
          </p>
        </div>

        {error && (
          <div className={styles.errorBanner} role="alert">
            {error}
          </div>
        )}

        {cart.lines.length > 0 ? (
          <>
            {/* Two Column Layout: Cart Items & Order Summary (Image 2) */}
            <div className={styles.layoutGrid}>
              {/* Left Column: Line Items */}
              <div className={styles.itemsList}>
                {cart.lines.map((item) => {
                  const isBusy = busySku === item.sku;
                  return (
                    <article className={styles.productCard} key={item.sku}>
                      <div className={styles.imageWrap}>
                        <></>
                      </div>

                      <div className={styles.detailsCol}>
                        <p className={styles.eyebrow}>ORIGINAL</p>
                        <div className={styles.titleRow}>
                          <Link
                            href={`/products/${item.slug}`}
                            className={styles.productName}
                          >
                            {item.name}
                          </Link>
                          <button
                            type="button"
                            className={styles.heartBtn}
                            onClick={() => toggleWishlist(item.sku)}
                            aria-label={`Save ${item.name} to wishlist`}
                          >
                            <Heart
                              size={17}
                              strokeWidth={1.5}
                              fill={wishlist[item.sku] ? "#111111" : "none"}
                            />
                          </button>
                        </div>
                        <p className={styles.colorLabel}>
                          Colour : {item.color || "Silver"}
                        </p>
                        <p className={styles.limitedStockBadge}>LIMITED STOCK</p>

                        <div className={styles.controlsRow}>
                          <div className={styles.stepper}>
                            <button
                              type="button"
                              className={styles.stepperBtn}
                              disabled={isBusy}
                              onClick={() =>
                                handleUpdateQuantity(item.sku, item.quantity - 1)
                              }
                              aria-label={`Decrease ${item.name} quantity`}
                            >
                              <Minus size={14} />
                            </button>
                            <span className={styles.stepperVal}>
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              className={styles.stepperBtn}
                              disabled={isBusy || item.quantity >= 10}
                              onClick={() =>
                                handleUpdateQuantity(item.sku, item.quantity + 1)
                              }
                              aria-label={`Increase ${item.name} quantity`}
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          <button
                            type="button"
                            className={styles.removeLink}
                            disabled={isBusy}
                            onClick={() => handleUpdateQuantity(item.sku, 0)}
                            aria-label={`Remove ${item.name}`}
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      <div className={styles.priceCol}>
                        <span>{format(item.price * item.quantity)}</span>
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Right Column: Order Summary (Image 2) */}
              <aside className={styles.summaryAside}>
                <div className={styles.summaryRow}>
                  <span>Subtotal</span>
                  <span>{format(cart.total)}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span>Shipping</span>
                  <span>₹ 0.00</span>
                </div>
                <div className={styles.summaryTotalRow}>
                  <span>Estimated Total</span>
                  <span>{format(cart.total)}</span>
                </div>
                <div className={styles.salesTaxNote}>₹ 0.00 Sales Tax</div>

                {/* Trust Information */}
                <div className={styles.trustList}>
                  <div className={styles.trustItem}>
                    <Truck size={18} strokeWidth={1.5} className={styles.trustIcon} />
                    <p className={styles.trustText}>
                      Please enjoy express deliveries on all orders
                    </p>
                  </div>
                  <div className={styles.trustItem}>
                    <FileText size={18} strokeWidth={1.5} className={styles.trustIcon} />
                    <p className={styles.trustText}>
                      All purchases/orders are solely processed and fulfilled by
                      OVIA authorized partner Ethos, registered in India. OVIA does
                      not process, fulfill or assume any responsibility or
                      liability for such transactions.
                    </p>
                  </div>
                </div>

                {/* Accepted Payment Methods */}
                <div className={styles.paymentSection}>
                  <p className={styles.paymentTitle}>Accepted payment methods</p>
                  <div className={styles.paymentBadges}>
                    <span className={styles.paymentBadge}>UPI</span>
                    <span className={styles.paymentBadge}>Cards</span>
                    <span className={styles.paymentBadge}>NetBanking</span>
                  </div>
                </div>
              </aside>
            </div>

            {/* Middle Action Bar (Image 3) */}
            <div className={styles.middleActionBar}>
              <span className={styles.topTotalLabel}>
                Total ({totalItems} {totalItems === 1 ? "item" : "items"}){" "}
                <strong>{format(cart.total)}</strong>
              </span>
              <Link href="/checkout" className={styles.topProceedBtn}>
                Checkout Now
              </Link>
            </div>
          </>
        ) : (
          /* Empty Cart State */
          <div className={styles.emptyState}>
            <h2 className={styles.emptyTitle}>Your cart is currently empty</h2>
            <p className={styles.emptySubtitle}>
              Explore our iconic luggage and bag collections to begin your journey.
            </p>
            <div className={styles.emptyActions}>
              <Link href="/luggage" className={styles.emptyBtn}>
                Explore Luggage
              </Link>
            </div>
          </div>
        )}

        {/* 4 Recommended Products Carousel/Grid (Image 3) */}
        <section className={styles.recGridWrapper}>
          <button
            type="button"
            className={`${styles.navArrow} ${styles.left}`}
            onClick={() => scrollRec("left")}
            aria-label="Previous recommended items"
          >
            <ChevronLeft size={18} />
          </button>

          <div className={styles.recGrid} ref={recGridRef}>
            {CART_RECOMMENDATIONS.map((rec) => (
              <div className={styles.recCard} key={rec.id}>
                <div className={styles.recImageWrap}>
                  <></>
                </div>
                <Link
                  href={`/products/${rec.slug}`}
                  className={styles.recName}
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
            className={`${styles.navArrow} ${styles.right}`}
            onClick={() => scrollRec("right")}
            aria-label="Next recommended items"
          >
            <ChevronRight size={18} />
          </button>
        </section>

        {/* BACK TO SHOP Button (Image 3) */}
        <Link href="/luggage" className={styles.backToShopBtn}>
          Back to shop
        </Link>

        {/* Brand Guarantees / Icons at bottom of Image 3 */}
        <div className={styles.guaranteesBar}>
          <div className={styles.guaranteeItem}>
            <Sparkles size={24} strokeWidth={1.3} className={styles.guaranteeIcon} />
            <span className={styles.guaranteeTitle}>Lifetime Guarantee</span>
          </div>
          <div className={styles.guaranteeItem}>
            <RotateCcw size={24} strokeWidth={1.3} className={styles.guaranteeIcon} />
            <span className={styles.guaranteeTitle}>Complimentary Returns</span>
          </div>
          <div className={styles.guaranteeItem}>
            <ShieldCheck size={24} strokeWidth={1.3} className={styles.guaranteeIcon} />
            <span className={styles.guaranteeTitle}>Secure Payments</span>
          </div>
        </div>
      </div>
    </div>
  );
}
