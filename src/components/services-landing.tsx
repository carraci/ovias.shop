"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Search,
  ArrowRight,
  Phone,
  Mail,
  MessageSquare,
  ChevronRight,
  Plus,
  Minus,
} from "lucide-react";
import { useState } from "react";

// ─── DATA ─────────────────────────────────────────────────────────────────────

const clientExperienceCards = [
  {
    id: "track-order",
    title: "Track Your Order",
    desc: "Get real-time updates on your order and delivery status.",
    image: "/media/material-aluminium.jpg",
    href: "/track-order",
  },
  {
    id: "delivery-returns",
    title: "Delivery & Returns",
    desc: "Information on shipping, delivery times and easy returns.",
    image: "/media/category-luggage.jpg",
    href: "/shipping",
  },
  {
    id: "care-repair",
    title: "Product Care & Repair",
    desc: "Keep your OVIA pieces in perfect condition for years to come.",
    image: "/media/cat-handcarry.jpg",
    href: "/care-service",
  },
  {
    id: "personalisation",
    title: "Personalisation",
    desc: "Learn about monogramming and customisation options.",
    image: "/media/accessories-cat-personalisation.jpg",
    href: "/accessories/address-tags",
  },
  {
    id: "payments-security",
    title: "Payments & Security",
    desc: "Accepted payment methods and secure shopping.",
    image: "/media/accessories-cat-travel.jpg",
    href: "/faq",
  },
  {
    id: "my-account",
    title: "My OVIA Account",
    desc: "Manage your profile, orders, wishlist and preferences.",
    image: "/media/spaces.jpg",
    href: "/account",
  },
];

type FAQCategory =
  | "ORDERS & DELIVERY"
  | "RETURNS & REFUNDS"
  | "PRODUCT CARE"
  | "PAYMENTS"
  | "PERSONALISATION"
  | "ACCOUNT"
  | "GENERAL";

const faqCategories: FAQCategory[] = [
  "ORDERS & DELIVERY",
  "RETURNS & REFUNDS",
  "PRODUCT CARE",
  "PAYMENTS",
  "PERSONALISATION",
  "ACCOUNT",
  "GENERAL",
];

const faqsByCategory: Record<FAQCategory, { question: string; answer: string }[]> = {
  "ORDERS & DELIVERY": [
    {
      question: "How can I track my order?",
      answer:
        "Once your order has shipped, you will receive an email confirmation with an active tracking link. You can also track your shipment status at any time by visiting our dedicated Track Order page and entering your order number and email address.",
    },
    {
      question: "What are the delivery times?",
      answer:
        "Standard complimentary domestic shipping takes 2–4 business days across metropolitan areas. Express delivery arrives within 1–2 business days. International orders typically reach their destination within 4–7 business days, fully insured.",
    },
    {
      question: "Do you ship internationally?",
      answer:
        "Yes, OVIA proudly ships to over 60 countries globally. Orders exceeding ₹ 50,000 include complimentary international courier shipping with all customs duties, import tariffs, and local taxes fully prepaid.",
    },
    {
      question: "How can I return or exchange an item?",
      answer:
        "We offer complimentary 30-day returns and exchanges for all unworn, unused items in their original packaging. Simply initiate a return through your OVIA Account or contact our dedicated Client Care team.",
    },
    {
      question: "When will I receive my refund?",
      answer:
        "Following quality inspection at our central atelier, your refund will be processed within 3–5 business days to your original payment method. You will receive an automated notification as soon as the credit is issued.",
    },
  ],
  "RETURNS & REFUNDS": [
    {
      question: "What is your return policy?",
      answer:
        "You may return any purchase within 30 days of receipt, provided the goods are in unused, immaculate condition with all protective seals, tags, and documentation intact.",
    },
    {
      question: "Are personalised or monogrammed items returnable?",
      answer:
        "Due to their custom, bespoke craftsmanship, personalised leather tags and engraved aluminium components cannot be returned or exchanged unless there is an intrinsic manufacturing defect.",
    },
    {
      question: "How do I schedule a return pickup?",
      answer:
        "Log in to your OVIA account, select the order you wish to return, and generate a pre-paid insured collection label. A courier will collect the package from your specified address.",
    },
  ],
  "PRODUCT CARE": [
    {
      question: "How should I clean my aluminium suitcase?",
      answer:
        "To clean your aluminium case, wipe gently with a soft microfibre cloth dampened with warm distilled water. Avoid abrasive cleansers, solvents, or scouring pads which could impair the anodised protective layer.",
    },
    {
      question: "Does OVIA provide a lifetime warranty?",
      answer:
        "OVIA provides a comprehensive lifetime functional warranty on all luggage shells, wheel assemblies, telescopic handles, and TSA locks purchased through official boutiques and ovia.com.",
    },
    {
      question: "How do I request a repair service?",
      answer:
        "Visit our Care & Repair Service page to submit a diagnostic request, or present your case at any OVIA flagship boutique where our in-house technicians can assist you.",
    },
  ],
  PAYMENTS: [
    {
      question: "What payment methods are accepted?",
      answer:
        "We accept Visa, Mastercard, American Express, UPI, Net Banking, Apple Pay, and interest-free split payment tenures through select premium credit cards.",
    },
    {
      question: "Is my payment information secure?",
      answer:
        "All transactions are encrypted with 256-bit bank-grade SSL security and certified Level 1 PCI-DSS compliance. We never store your full card details.",
    },
  ],
  PERSONALISATION: [
    {
      question: "Which items can be personalised?",
      answer:
        "Full-grain leather address tags, weekender duffle badges, and handle straps can be hot-stamped with your initials in blind deboss, gold foil, or silver foil.",
    },
    {
      question: "How long does custom monogramming take?",
      answer:
        "Personalisation typically adds 1–2 business days to the dispatch timeline, as each piece is individually crafted by our master artisans.",
    },
  ],
  ACCOUNT: [
    {
      question: "What are the benefits of an OVIA Account?",
      answer:
        "An OVIA Account lets you view order history, save curated wishlists, register case serial numbers for lifetime warranty coverage, and manage expedited checkout preferences.",
    },
    {
      question: "How do I reset my account password?",
      answer:
        "Click on the account icon in the header and select 'Forgot Password'. A secure reset link will be sent immediately to your registered email address.",
    },
  ],
  GENERAL: [
    {
      question: "Where are OVIA products designed and manufactured?",
      answer:
        "OVIA travel goods are conceptualised in our design studio in Milan, engineered with German precision grooved aluminium extrusions, and assembled with artisan Italian leather finishing.",
    },
    {
      question: "How can I locate an official OVIA boutique?",
      answer:
        "Use our interactive Store Locator to discover flagship stores, authorized stockists, and atelier repair drop-off points in key cities worldwide.",
    },
  ],
};

export function ServicesLanding() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<FAQCategory>("ORDERS & DELIVERY");
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setExpandedFAQ((prev) => (prev === index ? null : index));
  };

  const handleOpenContactModal = () => {
    window.dispatchEvent(new CustomEvent("open-contact-drawer"));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/faq?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <div className="services-landing-page">
      {/* ── TOP ANNOUNCEMENT BAR ── */}
      <div className="services-announcement-bar">
        <div className="services-announcement-text">
          <span>COMPLIMENTARY SHIPPING &amp; RETURNS</span>
          <span className="services-announcement-sep">|</span>
          <span>DEDICATED CLIENT CARE</span>
          <span className="services-announcement-sep">|</span>
          <span>A MORE MINDFUL JOURNEY</span>
        </div>
        <div className="services-announcement-locale">
          <span>INDIA (INR ₹)</span>
          <span className="services-announcement-sep">|</span>
          <span>EN</span>
        </div>
      </div>

      {/* ── 1. HERO SECTION: HOW MAY WE ASSIST YOU? ── */}
      <section className="services-hero-section">
        <div className="services-hero-media">
          <Image
            src="/media/bags-hero-terrace.jpg"
            alt="OVIA Client Care - How may we assist you?"
            fill
            priority
            sizes="100vw"
            className="services-hero-img"
          />
          <div className="services-hero-overlay" />
        </div>

        <div className="services-hero-inner">
          <div className="services-hero-content">
            <p className="services-hero-eyebrow">CLIENT CARE</p>
            <h1 className="services-hero-title">
              HOW MAY WE<br />
              ASSIST YOU?
            </h1>
            <p className="services-hero-desc">
              Find answers, manage your orders and explore our services.
              We are here to ensure a seamless OVIA experience.
            </p>

            <form onSubmit={handleSearchSubmit} className="services-hero-search">
              <Search size={18} className="services-search-icon" />
              <input
                type="search"
                placeholder="Search for help, e.g. delivery, returns, size guide..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="services-search-input"
                aria-label="Search for help"
              />
              <button
                type="submit"
                className="services-search-submit"
                aria-label="Submit help search"
              >
                <ArrowRight size={16} />
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ── 2. THE OVIA CLIENT EXPERIENCE (6 CARDS) ── */}
      <section className="services-content-wrap services-experience-section">
        <div className="services-section-title-wrap">
          <h2 className="services-section-title uppercase center">
            THE OVIA CLIENT EXPERIENCE
          </h2>
          <p className="services-section-sub center">
            From your first order to a lifetime of journeys, our client care
            team is here to support you with personalised assistance and expert guidance.
          </p>
        </div>

        <div className="services-experience-grid">
          {clientExperienceCards.map((card) => (
            <Link key={card.id} href={card.href} className="services-exp-card group">
              <div className="services-exp-media">
                <Image
                  src={card.image}
                  alt={card.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="services-exp-img"
                />
                <div className="services-exp-overlay" />
                <div className="services-exp-content">
                  <div className="services-exp-text">
                    <h3 className="services-exp-title">{card.title}</h3>
                    <p className="services-exp-desc">{card.desc}</p>
                  </div>
                  <span className="services-circle-arrow" aria-hidden="true">
                    <ArrowRight size={15} />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── 3. FREQUENTLY ASKED QUESTIONS (ACCORDION) ── */}
      <section className="services-content-wrap services-faq-section">
        <div className="services-faq-header">
          <div>
            <h2 className="services-section-title uppercase">
              FREQUENTLY ASKED QUESTIONS
            </h2>
            <p className="services-faq-sub">
              Quick answers to the most common questions about your OVIA experience.
            </p>
          </div>
          <Link href="/faq" className="services-header-link">
            VIEW ALL FAQS <ArrowRight size={13} />
          </Link>
        </div>

        <div className="services-faq-container">
          {/* Left Category Selector */}
          <div className="services-faq-sidebar" role="tablist" aria-label="FAQ Topics">
            {faqCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={activeCategory === cat}
                className={`services-faq-tab ${
                  activeCategory === cat ? "active" : ""
                }`}
                onClick={() => {
                  setActiveCategory(cat);
                  setExpandedFAQ(0);
                }}
              >
                <span>{cat}</span>
                <ChevronRight size={15} className="services-tab-arrow" />
              </button>
            ))}
          </div>

          {/* Right Accordion */}
          <div className="services-faq-accordion">
            {faqsByCategory[activeCategory]?.map((faq, index) => {
              const isOpen = expandedFAQ === index;
              return (
                <div
                  key={faq.question}
                  className={`services-faq-item ${isOpen ? "open" : ""}`}
                >
                  <button
                    type="button"
                    className="services-faq-question-btn"
                    onClick={() => toggleFAQ(index)}
                    aria-expanded={isOpen}
                  >
                    <span className="services-faq-question-text">{faq.question}</span>
                    <span className="services-faq-toggle-icon">
                      {isOpen ? <Minus size={18} /> : <Plus size={18} />}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="services-faq-answer">
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 4. CARE THAT ENDURES (3-PANEL EDITORIAL) ── */}
      <section className="services-content-wrap services-care-section">
        <div className="services-care-grid">
          {/* Left: Aluminium Case Macro */}
          <div className="services-care-media left-media">
            <Image
              src="/media/material-aluminium.jpg"
              alt="OVIA Grooved Aluminium Case structure"
              fill
              sizes="(max-width: 900px) 100vw, 33vw"
              className="services-care-img"
            />
          </div>

          {/* Center: Warm Parchment Card */}
          <div className="services-care-card">
            <h3 className="services-care-title uppercase">CARE THAT ENDURES</h3>
            <div className="services-care-divider" />
            <p className="services-care-desc">
              Our luggage and bags are designed to accompany you for a lifetime.
              Discover expert care tips, repair services and materials that stand
              the test of time.
            </p>
            <Link href="/care-service" className="services-btn-secondary">
              EXPLORE CARE GUIDE <ArrowRight size={13} className="services-cta-icon" />
            </Link>
          </div>

          {/* Right: Leather Craftsmanship Macro */}
          <div className="services-care-media right-media">
            <Image
              src="/media/material-leather.jpg"
              alt="White-gloved artisan leather repair"
              fill
              sizes="(max-width: 900px) 100vw, 33vw"
              className="services-care-img"
            />
          </div>
        </div>
      </section>

      {/* ── 5. A PERSONAL TOUCH (2-PANEL BANNER) ── */}
      <section className="services-touch-section">
        <div className="services-touch-container">
          <div className="services-touch-grid">
            {/* Left: Flagship Store Interior */}
            <div className="services-touch-store">
              <Image
                src="/media/flagship-store.png"
                alt="OVIA Flagship Boutique Interior"
                fill
                sizes="(max-width: 900px) 100vw, 50vw"
                className="services-touch-store-img"
              />
            </div>

            {/* Right: Dark Luxury Client Support Card */}
            <div className="services-touch-card">
              <h2 className="services-touch-title uppercase">A PERSONAL TOUCH</h2>
              <div className="services-touch-divider" />
              <p className="services-touch-desc">
                Need further assistance? Our client advisors are available to help
                you with anything from product recommendations to aftercare services.
              </p>

              <div className="services-touch-channels">
                {/* Call Us */}
                <a href="tel:+9118001234567" className="services-touch-channel">
                  <div className="services-channel-icon-wrap">
                    <Phone size={18} />
                  </div>
                  <div>
                    <h4 className="services-channel-title">Call Us</h4>
                    <p className="services-channel-highlight">+91 1800 123 4567</p>
                    <p className="services-channel-sub">Mon – Sun, 10AM – 8PM (IST)</p>
                  </div>
                </a>

                {/* Email Us */}
                <a href="mailto:care@ovia.com" className="services-touch-channel">
                  <div className="services-channel-icon-wrap">
                    <Mail size={18} />
                  </div>
                  <div>
                    <h4 className="services-channel-title">Email Us</h4>
                    <p className="services-channel-highlight">care@ovia.com</p>
                    <p className="services-channel-sub">We reply within 24 hours</p>
                  </div>
                </a>

                {/* Live Chat */}
                <button
                  type="button"
                  onClick={handleOpenContactModal}
                  className="services-touch-channel button-reset"
                >
                  <div className="services-channel-icon-wrap">
                    <MessageSquare size={18} />
                  </div>
                  <div>
                    <h4 className="services-channel-title">Live Chat</h4>
                    <p className="services-channel-highlight">Chat with an advisor</p>
                    <p className="services-channel-sub">Mon – Sun, 10AM – 8PM (IST)</p>
                  </div>
                </button>
              </div>

              <div className="services-touch-actions">
                <button
                  type="button"
                  onClick={handleOpenContactModal}
                  className="services-btn-advisor"
                >
                  CONTACT AN ADVISOR <ArrowRight size={13} className="services-cta-icon" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
