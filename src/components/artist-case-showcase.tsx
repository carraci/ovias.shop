"use client";

import { usePreferences } from "@/components/preferences";
import { useStore } from "@/components/store-provider";
import { money, type Product } from "@/lib/catalog";
import Image from "next/image";
import Link from "next/link";
import { useState, useRef } from "react";
import {
  Check,
  Plus,
  Expand,
  X,
  ShieldCheck,
  Truck,
  Sparkles,
  Palette,
  Layers,
  Lock,
  Compass,
  ArrowUpRight,
} from "lucide-react";
import { ProductCard } from "@/components/product-card";

type Props = {
  product: Product;
  pairings?: Product[];
};

const views = [
  {
    id: "exterior",
    label: "Exterior (Closed)",
    src: "/media/artist-case.svg",
    caption: "Iconic Grooved Anodized Aluminium with Heritage Leather Handle",
  },
  {
    id: "atelier",
    label: "Open Atelier (Dual-Tier)",
    src: "/media/artist-case-open.svg",
    caption: "Two-Tiered Solid Beechwood Trays with 120 Polychromos Pencils",
  },
  {
    id: "detail",
    label: "Craftsmanship & TSA Locks",
    src: "/media/artist-case-detail.svg",
    caption: "High-Gloss Riveted Aluminium Corners & Dual TSA Combination Locks",
  },
];

export function ArtistCaseShowcase({ product: p, pairings = [] }: Props) {
  const { format } = usePreferences();
  const [activeView, setActiveView] = useState(views[0]);
  const [sku, setSku] = useState(p.variants[0]?.sku || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const { add } = useStore();

  const variant = p.variants.find((v) => v.sku === sku) || p.variants[0];

  async function buy() {
    if (!variant) return;
    setBusy(true);
    setError("");
    try {
      await add(variant.sku);
      setAdded(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="artist-case-page">
      {/* Editorial Navigation Breadcrumb */}
      <div className="section" style={{ paddingBottom: 0 }}>
        <nav aria-label="Breadcrumb" className="breadcrumb">
          <Link href="/">Home</Link> / <Link href="/new">New</Link> /{" "}
          <span style={{ color: "var(--ink)" }}>Studio Artist Case</span>
        </nav>
      </div>

      {/* Main Luxury Showcase Hero (Grid with Visual Gallery & Configurator) */}
      <section className="section artist-hero-section">
        <div className="artist-hero-grid">
          {/* Visual Gallery Column */}
          <div className="artist-gallery-col">
            <div className="artist-view-tabs" role="tablist" aria-label="Product views">
              {views.map((v) => (
                <button
                  key={v.id}
                  role="tab"
                  aria-selected={activeView.id === v.id}
                  className={`artist-view-tab ${activeView.id === v.id ? "active" : ""}`}
                  onClick={() => setActiveView(v)}
                >
                  {v.label}
                </button>
              ))}
            </div>

            <div className="artist-main-image-container">
              <span className="artist-edition-pill">
                LIMITED EDITION · 97390043
              </span>
              <div className="artist-image-wrapper">
                <Image
                  src={activeView.src}
                  alt={`OVIA Studio Artist Case - ${activeView.label}`}
                  fill
                  priority
                  className="artist-hero-image"
                  sizes="(max-width: 900px) 100vw, 58vw"
                />
                <button
                  className="zoom-button icon-button"
                  aria-label="Enlarge view"
                  onClick={() => dialog.current?.showModal()}
                >
                  <Expand size={20} />
                </button>
              </div>
              <p className="artist-image-caption">{activeView.caption}</p>
            </div>
          </div>

          {/* Configurator & Buy Module Column */}
          <div className="artist-config-col">
            <div className="artist-header-group">
              <p className="eyebrow" style={{ letterSpacing: "0.22em" }}>
                STUDIO COLLECTION · HAND CARRY ATELIER
              </p>
              <h1 className="artist-title">Studio Artist Case</h1>
              <p className="artist-model-code">Ref. 97390043 · Engineered in Cologne</p>
              <p className="artist-price">
                {format(variant?.price || p.variants[0].price)}
              </p>
            </div>

            <p className="artist-lead-description">
              A portable atelier crafted for visionary ideas. Pairing the legendary
              endurance of grooved anodized aluminium with a comprehensive 120-piece
              colour pencil atelier, dual removable solid beechwood trays, and platinum-plated
              drawing tools.
            </p>

            {/* Variant Selector */}
            <div className="artist-variant-box">
              <span className="artist-variant-label">
                Edition & Handle:{" "}
                <strong>
                  {variant?.color === "Silver"
                    ? "Classic Silver · Heritage Forest Green Handle"
                    : "Stealth Graphite · Onyx Black Leather Handle"}
                </strong>
              </span>
              <div className="artist-swatch-list">
                {p.variants.map((v) => (
                  <button
                    key={v.sku}
                    className={`artist-swatch-btn ${sku === v.sku ? "selected" : ""}`}
                    aria-label={`Select ${v.color}`}
                    onClick={() => {
                      setSku(v.sku);
                      setAdded(false);
                    }}
                  >
                    <span
                      className="artist-swatch-dot"
                      style={{
                        background:
                          v.color === "Silver"
                            ? "linear-gradient(135deg, #e3e6e2 0%, #b8beb7 100%)"
                            : "linear-gradient(135deg, #4d524e 0%, #252926 100%)",
                      }}
                    />
                    <span className="artist-swatch-text">{v.color}</span>
                    {sku === v.sku && <Check size={14} className="swatch-check" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Stock & Availability */}
            <div className="artist-stock-banner">
              <span className="stock-pulse-dot" />
              <span>
                {variant.stock > 0
                  ? `In Stock · ${variant.stock} numbered pieces currently available`
                  : "Currently reserved · Inquire for allocation"}
              </span>
            </div>

            {/* Error Message if any */}
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}

            {/* Purchase CTA */}
            <div className="artist-cta-row">
              <button
                className="button dark artist-buy-btn"
                onClick={buy}
                disabled={!variant.stock || busy}
              >
                {busy ? "Adding to Bag…" : added ? "Added to Bag" : "Add to Shopping Bag"}
                {added ? <Check size={18} /> : <Plus size={18} />}
              </button>
            </div>

            {added && (
              <div className="artist-added-toast">
                <span>The Studio Artist Case has been added to your bag.</span>
                <Link href="/cart" className="text-link">
                  View bag & checkout <ArrowUpRight size={14} />
                </Link>
              </div>
            )}

            {/* Luxury Assurance Badges */}
            <div className="artist-assurances">
              <div className="assurance-item">
                <Truck size={18} />
                <div>
                  <strong>Complimentary Express Delivery</strong>
                  <p>Fully insured climate-controlled white-glove transport.</p>
                </div>
              </div>
              <div className="assurance-item">
                <ShieldCheck size={18} />
                <div>
                  <strong>OVIA Lifetime Guarantee</strong>
                  <p>Comprehensive aluminium shell and hardware warranty.</p>
                </div>
              </div>
              <div className="assurance-item">
                <Sparkles size={18} />
                <div>
                  <strong>Certificate of Authenticity</strong>
                  <p>Each case features an individually stamped laser serial number.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Atelier Deep-Dive Section */}
      <section className="section artist-deep-dive">
        <div className="section-heading">
          <div>
            <p className="eyebrow">INSIDE THE ATELIER</p>
            <h2>The Anatomy of Inspiration.</h2>
          </div>
          <p className="section-intro">
            From the tactile feedback of the TSA combination locks to the smooth release
            of the magnetic beechwood organizers, every element is designed for creation in motion.
          </p>
        </div>

        <div className="artist-features-grid">
          <div className="artist-feature-card">
            <div className="feature-icon-circle">
              <Palette size={24} />
            </div>
            <h3>120 Polychromos Pencils</h3>
            <p>
              A spectrum of 120 artist-grade colour pencils featuring oil-based leads
              with unmatched lightfastness and brilliant break-resistant colour laydown.
            </p>
          </div>

          <div className="artist-feature-card">
            <div className="feature-icon-circle">
              <Layers size={24} />
            </div>
            <h3>Dual-Tier Beechwood Trays</h3>
            <p>
              Precision-milled from sustainable European solid beechwood with magnetic alignment
              pins. Trays can be lifted out and arranged flat on an easel or drafting desk.
            </p>
          </div>

          <div className="artist-feature-card">
            <div className="feature-icon-circle">
              <Sparkles size={24} />
            </div>
            <h3>Platinum-Plated Instruments</h3>
            <p>
              Includes custom 2B graphite sketching pencils, a weighted dual-blade
              platinum-finished sharpener, and a refillable cylindrical eraser.
            </p>
          </div>

          <div className="artist-feature-card">
            <div className="feature-icon-circle">
              <Lock size={24} />
            </div>
            <h3>Dual TSA Combination Locks</h3>
            <p>
              Two recessed TSA-approved key and combination latches securely seal
              the aluminium shells, preserving airtight closure during international transit.
            </p>
          </div>
        </div>
      </section>

      {/* Technical Specifications Matrix */}
      <section className="section artist-specs-section">
        <div className="section-heading compact">
          <div>
            <p className="eyebrow">TECHNICAL METRICS</p>
            <h2>Engineered to the millimeter.</h2>
          </div>
        </div>

        <div className="artist-specs-table-wrapper">
          <table className="artist-specs-table">
            <tbody>
              <tr>
                <th>Model Reference</th>
                <td>OV-9739-0043 (Classic Edition)</td>
              </tr>
              <tr>
                <th>Dimensions</th>
                <td>
                  <strong>67 × 35 × 8 cm</strong> (26.4 × 13.8 × 3.2 in)
                </td>
              </tr>
              <tr>
                <th>Weight</th>
                <td>
                  <strong>6.8 kg</strong> (15.0 lbs fully outfitted)
                </td>
              </tr>
              <tr>
                <th>Volume & Capacity</th>
                <td>19 Litres · Hand Carry Specification</td>
              </tr>
              <tr>
                <th>Shell Material</th>
                <td>High-strength Anodized Aluminium with Classic Grooves</td>
              </tr>
              <tr>
                <th>Corner Reinforcement</th>
                <td>High-Gloss Polished Aluminium Caps with Stainless Rivets</td>
              </tr>
              <tr>
                <th>Carrying Handle</th>
                <td>Full-Grain Italian Leather with Handcrafted Saddle Stitching</td>
              </tr>
              <tr>
                <th>Interior Lining</th>
                <td>Charcoal Microfiber with Cushioning Shock Protection</td>
              </tr>
              <tr>
                <th>Locking Mechanism</th>
                <td>Dual TSA-Approved Combination Locking Clasps</td>
              </tr>
              <tr>
                <th>Included Accessories</th>
                <td>
                  120 Polychromos Pencils, Custom 2B Graphite Pencils, Platinum Dual Sharpener,
                  Replaceable Eraser, and Artist Color Technique Manual.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Along for the Journey (Curated Pairings) */}
      {pairings.length > 0 && (
        <section className="section">
          <div className="section-heading compact">
            <div>
              <p className="eyebrow">ALONG FOR THE JOURNEY</p>
              <h2>Considered pairings.</h2>
            </div>
            <Link href="/luggage" className="text-link">
              Explore luggage <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="product-grid">
            {pairings.slice(0, 4).map((item, idx) => (
              <ProductCard key={item.id} product={item} index={idx} />
            ))}
          </div>
        </section>
      )}

      {/* Zoom Modal Dialog */}
      <dialog ref={dialog} className="image-dialog" onClick={(e) => {
        if (e.target === dialog.current) dialog.current?.close();
      }}>
        <div className="dialog-content">
          <button
            className="icon-button dialog-close"
            aria-label="Close dialog"
            onClick={() => dialog.current?.close()}
          >
            <X size={24} />
          </button>
          <div className="dialog-image-wrapper">
            <Image
              src={activeView.src}
              alt={`OVIA Studio Artist Case full view - ${activeView.label}`}
              width={1100}
              height={750}
              style={{ objectFit: "contain", width: "100%", height: "auto" }}
            />
          </div>
          <p className="dialog-caption">{activeView.caption}</p>
        </div>
      </dialog>
    </div>
  );
}
