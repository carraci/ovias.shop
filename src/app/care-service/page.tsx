import "@/components/page-styles/editorial.css";
import Image from "next/image";
import Link from "next/link";
import { CARE_CATEGORIES, CARE_PRINCIPLES } from "@/lib/care-data";
import { FAQ_ITEMS } from "@/lib/faq-data";
import { ContactDrawerButton } from "@/components/contact-drawer-button";
import { ArrowRight, ArrowUpRight, Sparkles, Wrench, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Care for Your OVIA Piece — Care & Service | OVIA",
  description:
    "Explore our care guides by material and product category for practical recommendations on cleaning, storage, handling, protection, and long-term maintenance.",
};

export default function CareServicePage() {
  const careFaqs = [
    FAQ_ITEMS.find((q) => q.slug === "how-should-i-care-for-my-ovia-bag")!,
    FAQ_ITEMS.find((q) => q.slug === "how-should-i-store-my-bag")!,
    FAQ_ITEMS.find((q) => q.slug === "how-do-i-clean-my-product")!,
    FAQ_ITEMS.find((q) => q.slug === "how-can-i-request-a-repair")!,
    FAQ_ITEMS.find((q) => q.slug === "does-ovia-provide-product-care-assistance")!,
    FAQ_ITEMS.find((q) => q.slug === "how-does-ovia-personalisation-work")!,
  ].filter(Boolean);

  return (
    <div className="care-page-container">
      {/* PAGE HERO */}
      <section className="care-hero-section">
        <div className="care-hero-content">
          <p className="faq-brand-eyebrow">CARE &amp; SERVICE</p>
          <h1 className="care-hero-title">CARE FOR YOUR OVIA PIECE</h1>
          <p className="care-hero-tagline">
            Designed for the journey. Preserved through time.
          </p>
          <p className="care-hero-description">
            A well-made piece is designed to accompany you over time. With considered handling, appropriate storage, and the right care, the materials and craftsmanship of your OVIA collection can be preserved through everyday use, travel, and the years ahead.
          </p>
          <p className="care-hero-description" style={{ marginTop: "-1.5rem" }}>
            Explore our care guides by material and product category for practical recommendations on cleaning, storage, handling, protection, and long-term maintenance.
          </p>

          <div className="care-hero-ctas">
            <a href="#product-care" className="button dark">
              EXPLORE CARE GUIDES
            </a>
            <Link href="/care-service/request-assistance" className="button light">
              REQUEST ASSISTANCE <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* 01–07 PRODUCT CARE CATEGORIES GRID */}
      <section id="product-care" className="care-categories-section">
        <div className="faq-section-header">
          <p className="eyebrow">PRESERVATION BY SILHOUETTE</p>
          <h2>PRODUCT CARE</h2>
          <p className="care-section-sub">
            Every OVIA piece deserves considered care. Select your product category for dedicated guidance.
          </p>
          <div className="faq-divider" />
        </div>

        <div className="care-grid">
          {CARE_CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/care-service/${cat.slug}`}
              className="care-card"
            >
              <div className="care-card-image-wrapper">
                <Image
                  src={cat.heroImage}
                  alt={cat.title}
                  width={600}
                  height={450}
                  className="care-card-image"
                />
                <span className="care-card-num">{cat.number}</span>
              </div>
              <div className="care-card-body">
                <h3>{cat.title}</h3>
                <p>{cat.cardDescription || cat.description}</p>
                <span className="care-card-action">
                  {cat.ctaLabel || "DISCOVER CARE"} <ArrowRight size={15} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* PROFESSIONAL CARE & REPAIR */}
      <section className="care-repair-section">
        <div className="care-repair-banner">
          <div className="care-repair-inner">
            <Wrench size={32} strokeWidth={1.5} className="care-repair-icon" />
            <p className="eyebrow">PROFESSIONAL CARE &amp; REPAIR</p>
            <h2>WHEN YOUR PIECE NEEDS MORE THAN EVERYDAY CARE</h2>
            <div className="care-repair-text">
              <p>
                Some marks, wear, or damage require more than routine maintenance. If you are uncertain about how to treat your OVIA piece, we recommend contacting Customer Care before attempting a repair or using a cleaning product.
              </p>
              <p>
                Depending on the product and condition, our team can advise on available care, repair, or after-sales options.
              </p>
              <p>
                Professional assessment may be appropriate for issues involving stitching, handles, straps, hardware, closures, structural components, or significant marks and damage.
              </p>
            </div>
            <div className="care-repair-actions">
              <Link
                href="/care-service/request-assistance"
                className="button dark"
              >
                EXPLORE REPAIR &amp; AFTERCARE <ArrowRight size={16} />
              </Link>
            </div>
            <p className="care-disclaimer-note">
              Assessments are conducted individually by our master craftspeople without automatic obligations or automated fees.
            </p>
          </div>
        </div>
      </section>

      {/* CARE NOTES — A FEW SIMPLE PRINCIPLES */}
      <section className="care-principles-section">
        <div className="faq-section-header">
          <p className="eyebrow">CARE NOTES</p>
          <h2>A FEW SIMPLE PRINCIPLES</h2>
          <div className="faq-divider" />
        </div>

        <div className="care-principles-grid">
          {CARE_PRINCIPLES.map((principle) => (
            <div key={principle.number} className="care-principle-card">
              <span className="care-principle-num">{principle.number}</span>
              <h3 className="care-principle-title">{principle.title}</h3>
              <p className="care-principle-desc">{principle.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CARE THAT CONTINUES BEYOND THE PURCHASE */}
      <section className="care-cta-banner">
        <div className="care-cta-banner-inner">
          <ShieldCheck size={32} strokeWidth={1.5} style={{ margin: "0 auto 1.25rem", color: "var(--ink)" }} />
          <h2>CARE THAT CONTINUES BEYOND THE PURCHASE</h2>
          <p>
            An OVIA piece is intended to be used, carried, travelled with, and lived with. Natural signs of use can become part of its character, while thoughtful care helps preserve the materials and craftsmanship that define each piece.
          </p>
          <p>
            Our care and service guides are designed to help you look after your OVIA collection throughout its life.
          </p>
          <div className="care-cta-banner-actions">
            <a href="#product-care" className="button dark">
              EXPLORE ALL CARE &amp; SERVICE <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </section>

      {/* EDITORIAL CARE STORY */}
      <section className="care-editorial-story">
        <div className="care-story-grid">
          <div className="care-story-text">
            <p className="eyebrow">CRAFTSMANSHIP &amp; PATINA</p>
            <h2>THE LIFE OF A TRAVEL PIECE</h2>
            <p className="story-lead">
              A well-traveled suitcase or bag reflects the horizons it has witnessed.
            </p>
            <p className="story-p">
              We design our creations using authentic materials that develop a singular character over time. Vegetable-tanned leathers soften with handling; anodized aluminium earns a soft burnish from train platforms and tarmac transits.
            </p>
            <p className="story-p">
              Our Care Service is dedicated to ensuring that every hinge, stitch, and wheel continues to perform reliably across a lifetime of departures.
            </p>
          </div>
          <div className="care-story-image">
            <Image
              src="/media/spaces.jpg"
              alt="OVIA leather and aluminium crafting"
              width={750}
              height={600}
              className="story-img"
            />
          </div>
        </div>
      </section>

      {/* POPULAR CARE FAQS */}
      <section className="care-faq-section">
        <div className="faq-section-header">
          <p className="eyebrow">FREQUENT INQUIRIES</p>
          <h2>POPULAR CARE QUESTIONS</h2>
          <div className="faq-divider" />
        </div>

        <div className="faq-questions-list">
          {careFaqs.map((faq) => (
            <Link
              key={faq.id}
              href={`/faq/${faq.category}/${faq.slug}`}
              className="faq-question-row"
            >
              <span className="faq-question-text">{faq.question}</span>
              <ArrowRight size={18} strokeWidth={1.5} className="faq-arrow-icon" />
            </Link>
          ))}
        </div>

        <div className="contact-faq-all-btn">
          <Link href="/faq/products" className="button light">
            DISCOVER ALL PRODUCT FAQs <ArrowUpRight size={14} />
          </Link>
        </div>
      </section>

      {/* CONTACT INTEGRATION */}
      <section className="care-contact-section">
        <div className="care-contact-box">
          <Sparkles size={24} strokeWidth={1.5} className="care-contact-icon" />
          <p className="eyebrow">CONSULT AN EXPERT</p>
          <h3>NEED PERSONAL ASSISTANCE?</h3>
          <p>
            Our Client Advisors are available to help with product care, maintenance instructions, and service enquiries.
          </p>
          <div className="faq-assistance-actions">
            <ContactDrawerButton variant="primary">
              CONTACT US
            </ContactDrawerButton>
          </div>
        </div>
      </section>
    </div>
  );
}
