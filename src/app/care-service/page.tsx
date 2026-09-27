import Image from "next/image";
import Link from "next/link";
import { CARE_CATEGORIES } from "@/lib/care-data";
import { FAQ_ITEMS } from "@/lib/faq-data";
import { ContactDrawerButton } from "@/components/contact-drawer-button";
import { ArrowRight, ArrowUpRight, Sparkles, Wrench } from "lucide-react";

export const metadata = {
  title: "Care Service & Repair | OVIA Luxury Travel Goods",
  description:
    "Preserve your OVIA travel pieces for generations. Explore dedicated material care guides and request professional atelier assistance.",
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
          <p className="faq-brand-eyebrow">OVIA</p>
          <h1 className="care-hero-title">CARE SERVICE</h1>
          <p className="care-hero-tagline">
            Designed for the journey. Cared for beyond it.
          </p>
          <p className="care-hero-description">
            Discover guidance for preserving your OVIA pieces and learn how to request assistance when your product requires professional attention.
          </p>

          <div className="care-hero-ctas">
            <a href="#product-care" className="button dark">
              EXPLORE PRODUCT CARE
            </a>
            <Link href="/care-service/request-assistance" className="button light">
              REQUEST ASSISTANCE <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* PRODUCT CARE CATEGORIES GRID */}
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
                <p>{cat.description}</p>
                <span className="care-card-action">
                  DISCOVER CARE <ArrowRight size={15} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* EDITORIAL CARE STORY */}
      <section className="care-editorial-story">
        <div className="care-story-grid">
          <div className="care-story-text">
            <p className="eyebrow">CRAFTSMANSHIP & PATINA</p>
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

      {/* CARE & REPAIR ASSESSMENT SECTION */}
      <section className="care-repair-section">
        <div className="care-repair-banner">
          <div className="care-repair-inner">
            <Wrench size={32} strokeWidth={1.5} className="care-repair-icon" />
            <p className="eyebrow">ATELIER SERVICE</p>
            <h2>CARE & REPAIR</h2>
            <p className="care-repair-text">
              Sometimes a well-travelled piece needs more than everyday care. If your OVIA product requires assessment, our Client Services team can help determine the appropriate next step.
            </p>
            <div className="care-repair-actions">
              <Link
                href="/care-service/request-assistance"
                className="button dark"
              >
                REQUEST PRODUCT ASSISTANCE <ArrowRight size={16} />
              </Link>
            </div>
            <p className="care-disclaimer-note">
              Assessments are conducted individually by our master craftspeople without automatic obligations or automated fees.
            </p>
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
