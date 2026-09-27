"use client";

import { usePreferences } from "@/components/preferences";
import Link from "next/link";
import Image from "next/image";
import { useState, useRef } from "react";
import {
  ArrowRight,
  Minus,
  Plus,
  X,
  Heart,
  ChevronLeft,
  ChevronRight,
  Box,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";
import { useStore } from "@/components/store-provider";

interface Recommendation {
  id: string;
  name: string;
  price: string;
  image: string;
  slug: string;
}

const recommendations: Recommendation[] = [
  {
    id: "rec-horizon-cabin",
    name: "Horizon Cabin",
    price: "₹22,500.00",
    image: "/media/cart/rec-horizon-cabin.png",
    slug: "forma-cabin",
  },
  {
    id: "rec-voyage-duffel",
    name: "Voyage Duffel",
    price: "₹28,000.00",
    image: "/media/cart/rec-voyage-duffel.png",
    slug: "meridian-duffle-bag",
  },
  {
    id: "rec-packing-case",
    name: "Packing Case",
    price: "₹9,500.00",
    image: "/media/cart/rec-packing-case.png",
    slug: "passage-organisers",
  },
  {
    id: "rec-luggage-tag",
    name: "Luggage Tag",
    price: "₹4,500.00",
    image: "/media/cart/rec-luggage-tag.png",
    slug: "forma-address-tags",
  },
];

export default function CartPage() {
  const { format } = usePreferences();
  const { cart, setQuantity } = useStore();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [wishlist, setWishlist] = useState<Record<string, boolean>>({});
  const carouselRef = useRef<HTMLDivElement>(null);

  const totalItems = cart.lines.reduce((n, l) => n + l.quantity, 0);

  async function update(sku: string, q: number) {
    setBusy(true);
    setError("");
    try {
      await setQuantity(sku, q);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function addDemoItem() {
    setBusy(true);
    setError("");
    try {
      await setQuantity("OV-MERIDIAN-CABIN-0", 1);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const toggleWishlist = (id: string) => {
    setWishlist((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const scrollCarousel = (direction: "left" | "right") => {
    if (carouselRef.current) {
      const offset = direction === "left" ? -280 : 280;
      carouselRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  return (
    <section className="cart-page-wrap">
      <div className="cart-page-inner">
        {/* Eyebrow & Title */}
        <div className="cart-page-header">
          <p className="cart-eyebrow">READY WHEN YOU ARE</p>
          <h1 className="cart-main-title">
            Your bag
            <sup className="cart-superscript-count">{totalItems}</sup>
          </h1>
          <p className="cart-currency-note">
            Converted prices are estimates.{" "}
            <strong>Checkout is in INR.</strong>
          </p>
        </div>

        {error && (
          <p className="cart-error-banner" role="alert">
            {error}
          </p>
        )}

        {cart.lines.length > 0 ? (
          <div className="cart-split-layout">
            {/* ─── Left Column: Items & Recommendations ─── */}
            <div className="cart-left-col">
              {/* Cart Items List */}
              <div className="cart-items-list">
                {cart.lines.map((l) => {
                  const isMeridian =
                    l.slug.includes("meridian") || l.name.includes("Meridian");
                  const displayImage = isMeridian
                    ? "/media/cart/meridian-cabin.png"
                    : l.image;

                  return (
                    <article className="cart-product-card" key={l.sku}>
                      {/* Product Image */}
                      <Link
                        href={`/products/${l.slug}`}
                        className="cart-card-image-wrap"
                      >
                        <Image
                          src={displayImage}
                          width={140}
                          height={145}
                          alt={l.name}
                          className="cart-card-img"
                        />
                      </Link>

                      {/* Details */}
                      <div className="cart-card-details">
                        <Link href={`/products/${l.slug}`}>
                          <h2 className="cart-card-title">{l.name}</h2>
                        </Link>
                        <p className="cart-card-color">{l.color || "Graphite"}</p>
                        <span className="cart-card-unit-price">
                          {format(l.price)}
                        </span>

                        {/* In stock badge */}
                        <div className="cart-stock-badge">
                          <span className="cart-stock-dot" />
                          <span>In stock</span>
                        </div>

                        {/* Quantity Selector */}
                        <div className="cart-qty-pill">
                          <button
                            type="button"
                            disabled={busy}
                            aria-label={`Decrease ${l.name} quantity`}
                            onClick={() => update(l.sku, l.quantity - 1)}
                            className="cart-qty-btn"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="cart-qty-num">{l.quantity}</span>
                          <button
                            type="button"
                            disabled={busy || l.quantity >= 10}
                            aria-label={`Increase ${l.name} quantity`}
                            onClick={() => update(l.sku, l.quantity + 1)}
                            className="cart-qty-btn"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Right: Wishlist, Remove & Line Total */}
                      <div className="cart-card-right">
                        <div className="cart-card-actions">
                          <button
                            type="button"
                            aria-label="Add to wishlist"
                            className={`cart-action-icon-btn ${
                              wishlist[l.sku] ? "is-active" : ""
                            }`}
                            onClick={() => toggleWishlist(l.sku)}
                          >
                            <Heart
                              size={18}
                              strokeWidth={1.5}
                              fill={wishlist[l.sku] ? "#15130f" : "none"}
                            />
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            className="cart-action-icon-btn"
                            aria-label={`Remove ${l.name}`}
                            onClick={() => update(l.sku, 0)}
                          >
                            <X size={18} strokeWidth={1.5} />
                          </button>
                        </div>

                        <span className="cart-card-total-price">
                          {format(l.price * l.quantity)}
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* ─── You May Also Like Section ─── */}
              <section className="cart-recommendations-section">
                <div className="cart-rec-header">
                  <h3 className="cart-rec-title">You may also like</h3>
                  <Link href="/luggage" className="cart-rec-view-all">
                    View all →
                  </Link>
                </div>

                <div className="cart-rec-carousel-wrap">
                  <button
                    type="button"
                    className="cart-rec-arrow-btn left"
                    aria-label="Previous items"
                    onClick={() => scrollCarousel("left")}
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <div className="cart-rec-grid" ref={carouselRef}>
                    {recommendations.map((rec) => (
                      <article className="cart-rec-card" key={rec.id}>
                        <div className="cart-rec-img-wrap">
                          <Link href={`/products/${rec.slug}`}>
                            <Image
                              src={rec.image}
                              width={125}
                              height={106}
                              alt={rec.name}
                              className="cart-rec-img"
                            />
                          </Link>
                          <button
                            type="button"
                            className={`cart-rec-heart-btn ${
                              wishlist[rec.id] ? "is-active" : ""
                            }`}
                            aria-label={`Save ${rec.name} to wishlist`}
                            onClick={() => toggleWishlist(rec.id)}
                          >
                            <Heart
                              size={16}
                              strokeWidth={1.5}
                              fill={wishlist[rec.id] ? "#15130f" : "none"}
                            />
                          </button>
                        </div>
                        <Link href={`/products/${rec.slug}`}>
                          <h4 className="cart-rec-card-name">{rec.name}</h4>
                        </Link>
                        <span className="cart-rec-card-price">{rec.price}</span>
                      </article>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="cart-rec-arrow-btn right"
                    aria-label="Next items"
                    onClick={() => scrollCarousel("right")}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </section>
            </div>

            {/* ─── Right Column: Order Summary ─── */}
            <aside className="cart-summary-card">
              <p className="cart-summary-eyebrow">YOUR JOURNEY, CONSIDERED</p>
              <h2 className="cart-summary-title">Order summary</h2>

              {/* Mini Item Preview Rows */}
              <div className="cart-summary-preview-list">
                {cart.lines.map((l) => {
                  const isMeridian =
                    l.slug.includes("meridian") || l.name.includes("Meridian");
                  const displayImage = isMeridian
                    ? "/media/cart/meridian-cabin.png"
                    : l.image;

                  return (
                    <div className="cart-summary-preview-row" key={l.sku}>
                      <Image
                        src={displayImage}
                        width={52}
                        height={56}
                        alt={l.name}
                        className="cart-summary-preview-thumb"
                      />
                      <div className="cart-summary-preview-info">
                        <span className="cart-summary-preview-title">
                          {l.name}
                        </span>
                        <span className="cart-summary-preview-variant">
                          {l.color || "Graphite"}
                        </span>
                        <span className="cart-summary-preview-qty">
                          Qty: {l.quantity}
                        </span>
                      </div>
                      <span className="cart-summary-preview-price">
                        {format(l.price * l.quantity)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="cart-summary-divider" />

              {/* Subtotal & Shipping */}
              <div className="cart-summary-line">
                <span>Subtotal</span>
                <span>{format(cart.total)}</span>
              </div>
              <div className="cart-summary-line">
                <span>Demo shipping</span>
                <span>₹0</span>
              </div>

              <div className="cart-summary-divider" />

              {/* Total */}
              <div className="cart-summary-total-row">
                <span>Total</span>
                <strong>{format(cart.total)}</strong>
              </div>

              <p className="cart-summary-note">
                Illustrative prices. No real payment or shipment in demo mode.
              </p>

              {/* Checkout Button */}
              <Link href="/checkout" className="cart-checkout-btn">
                <span>Continue to checkout</span>
                <ArrowRight size={18} />
              </Link>

              {/* Secondary link */}
              <Link href="/luggage" className="cart-continue-exploring">
                Continue exploring
              </Link>

              {/* Trust Badges */}
              <div className="cart-trust-badges">
                <div className="cart-trust-item">
                  <Box size={22} strokeWidth={1.5} className="cart-trust-icon" />
                  <span className="cart-trust-title">Free delivery</span>
                  <span className="cart-trust-sub">On all orders</span>
                </div>
                <div className="cart-trust-item">
                  <RotateCcw
                    size={22}
                    strokeWidth={1.5}
                    className="cart-trust-icon"
                  />
                  <span className="cart-trust-title">Easy returns</span>
                  <span className="cart-trust-sub">Within 14 days</span>
                </div>
                <div className="cart-trust-item">
                  <ShieldCheck
                    size={22}
                    strokeWidth={1.5}
                    className="cart-trust-icon"
                  />
                  <span className="cart-trust-title">Secure payment</span>
                  <span className="cart-trust-sub">100% protected</span>
                </div>
              </div>
            </aside>
          </div>
        ) : (
          /* Empty state */
          <div className="cart-empty-luxury">
            <div className="cart-empty-icon-wrap">
              <ShoppingBag size={40} strokeWidth={1.2} />
            </div>
            <h2 className="cart-empty-title">Your bag is currently empty</h2>
            <p className="cart-empty-sub">
              Explore our collection of iconic luggage, bags and travel essentials.
            </p>
            <div className="cart-empty-actions">
              <button
                type="button"
                className="cart-empty-demo-btn"
                onClick={addDemoItem}
                disabled={busy}
              >
                Add Meridian Cabin (Demo)
              </button>
              <Link href="/luggage" className="cart-empty-explore-btn">
                Explore collection →
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
