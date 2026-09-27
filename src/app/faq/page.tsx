import Link from "next/link";
import { FAQ_CATEGORIES, FAQ_ITEMS } from "@/lib/faq-data";
import { FaqSearchBar } from "@/components/faq-search-bar";
import { PopularInquiriesAccordion } from "@/components/popular-inquiries-accordion";
import { ContactDrawerButton } from "@/components/contact-drawer-button";
import { ArrowRight, ArrowUpRight } from "lucide-react";

export const metadata = {
  title: "Frequently Asked Questions — Customer Care Guide | OVIA",
  description:
    "Explore the OVIA Customer Care Guide: orders, delivery, complimentary returns, product care, bespoke personalisation, and repairs.",
};

export default function FaqPage() {
  // Select 6 prominent frequent questions across categories
  const frequentQuestions = [
    FAQ_ITEMS.find((q) => q.slug === "where-does-ovia-deliver")!,
    FAQ_ITEMS.find((q) => q.slug === "how-can-i-track-my-order")!,
    FAQ_ITEMS.find((q) => q.slug === "what-is-ovias-return-policy")!,
    FAQ_ITEMS.find((q) => q.slug === "how-should-i-care-for-my-ovia-bag")!,
    FAQ_ITEMS.find((q) => q.slug === "can-ovia-products-be-personalised")!,
    FAQ_ITEMS.find((q) => q.slug === "how-can-i-request-a-repair")!,
  ].filter(Boolean);

  return (
    <div className="faq-page-container">
      {/* PAGE HERO */}
      <section className="faq-hero-section">
        <div className="faq-hero-content">
          <p className="faq-brand-eyebrow">CUSTOMER CARE</p>
          <h1 className="faq-page-title">FREQUENT QUESTIONS</h1>
          <h2 className="faq-hero-guide-title">The OVIA Customer Care Guide</h2>
          <p className="faq-hero-guide-desc">
            At <strong>OVIA</strong>, every detail matters — from the design of each piece to the experience of receiving it. Whether you are placing your first order, checking a delivery, caring for your favourite OVIA bag, or looking for support after your purchase, our Customer Care Guide is designed to give you clear answers at every step.
          </p>

          <div className="faq-hero-search">
            <FaqSearchBar placeholder="Search for a question..." />
          </div>
        </div>
      </section>

      {/* HELP BY TOPIC */}
      <section className="faq-topics-section">
        <div className="faq-section-header">
          <p className="eyebrow">TOPICS</p>
          <h2>HELP BY TOPIC</h2>
          <div className="faq-divider" />
        </div>

        <div className="faq-categories-grid">
          {FAQ_CATEGORIES.map((category) => (
            <Link
              key={category.slug}
              href={`/faq/${category.slug}`}
              className="faq-category-card"
            >
              <div className="faq-category-card-inner">
                <span className="faq-category-name">{category.name}</span>
                <p className="faq-category-desc">{category.shortDescription}</p>
              </div>
              <div className="faq-category-arrow">
                <ArrowRight size={18} strokeWidth={1.5} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* FREQUENT QUESTIONS */}
      <section className="faq-frequent-section">
        <div className="faq-section-header">
          <p className="eyebrow">POPULAR INQUIRIES</p>
          <h2>FREQUENT QUESTIONS</h2>
          <p className="faq-section-subtitle">
            Information on delivery, orders, returns, product care, personalisation, and after-sales service.
          </p>
          <div className="faq-divider" />
        </div>

        <PopularInquiriesAccordion />
      </section>

      {/* NEED MORE HELP / CONTACT US */}
      <section className="faq-assistance-section">
        <div className="faq-assistance-box">
          <p className="eyebrow">PERSONAL ASSISTANCE</p>
          <h3>NEED MORE HELP?</h3>
          <p className="faq-assistance-text">
            Our Client Advisors are available to assist with orders, deliveries, product guidance and bespoke requests.
          </p>
          <div className="faq-assistance-actions">
            <ContactDrawerButton variant="primary">
              CONTACT A CLIENT ADVISOR
            </ContactDrawerButton>
            <Link href="/contact-us" className="button light">
              ALL CONTACT OPTIONS <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
