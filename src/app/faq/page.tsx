import Link from "next/link";
import { FAQ_CATEGORIES, FAQ_ITEMS } from "@/lib/faq-data";
import { FaqSearchBar } from "@/components/faq-search-bar";
import { ContactDrawerButton } from "@/components/contact-drawer-button";
import { ArrowRight, ArrowUpRight } from "lucide-react";

export const metadata = {
  title: "Client Services & FAQ | OVIA Luxury Travel Goods",
  description:
    "How can we assist you? Explore OVIA delivery, complimentary returns, bespoke gifting, product care, and client services.",
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
          <p className="faq-brand-eyebrow">OVIA</p>
          <h1 className="faq-page-title">CLIENT SERVICES</h1>
          <p className="faq-hero-subtitle">How can we assist you?</p>

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
          <div className="faq-divider" />
        </div>

        <div className="faq-questions-list">
          {frequentQuestions.map((item) => (
            <Link
              key={item.id}
              href={`/faq/${item.category}/${item.slug}`}
              className="faq-question-row"
            >
              <span className="faq-question-text">{item.question}</span>
              <ArrowRight size={18} strokeWidth={1.5} className="faq-arrow-icon" />
            </Link>
          ))}
        </div>
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
