import Image from "next/image";
import Link from "next/link";
import { clientServicesConfig } from "@/lib/client-services-config";
import { FAQ_ITEMS } from "@/lib/faq-data";
import { FaqSearchBar } from "@/components/faq-search-bar";
import { ContactDrawerButton } from "@/components/contact-drawer-button";
import {
  Phone,
  Mail,
  MessageSquare,
  MessageCircle,
  ArrowRight,
  ArrowUpRight,
  Sparkles,
  ShieldCheck,
  Package,
  Wrench,
  Clock,
  Compass,
} from "lucide-react";

export const metadata = {
  title: "Contact Us & Client Services | OVIA Luxury Travel Goods",
  description:
    "Speak directly with an OVIA Client Advisor. Call, email, WhatsApp, or schedule an appointment for bespoke assistance.",
};

export default function ContactUsPage() {
  const popularFaqs = [
    FAQ_ITEMS.find((q) => q.slug === "where-does-ovia-deliver")!,
    FAQ_ITEMS.find((q) => q.slug === "how-can-i-track-my-order")!,
    FAQ_ITEMS.find((q) => q.slug === "what-is-ovias-return-policy")!,
    FAQ_ITEMS.find((q) => q.slug === "how-should-i-care-for-my-ovia-bag")!,
    FAQ_ITEMS.find((q) => q.slug === "can-ovia-products-be-personalised")!,
    FAQ_ITEMS.find((q) => q.slug === "how-can-i-request-a-repair")!,
  ].filter(Boolean);

  const capabilities = [
    {
      title: "PRODUCT ADVICE",
      desc: "Explore bags, luggage, materials and curated collections for your itinerary.",
      icon: Compass,
      link: "/faq/products",
    },
    {
      title: "ORDER ASSISTANCE",
      desc: "Get bespoke help with existing orders, changes, invoicing, and fulfillment.",
      icon: Package,
      link: "/faq/orders",
    },
    {
      title: "DELIVERY & RETURNS",
      desc: "Complimentary white-glove delivery, real-time tracking, and returns.",
      icon: Clock,
      link: "/faq/delivery",
    },
    {
      title: "PRODUCT CARE",
      desc: "Comprehensive guidance on preserving leather, canvas, and aluminium travel pieces.",
      icon: ShieldCheck,
      link: "/care-service",
    },
    {
      title: "REPAIRS & RESTORATION",
      desc: "Submit pieces for atelier assessment, component replacement, and structural care.",
      icon: Wrench,
      link: "/care-service/request-assistance",
    },
    {
      title: "PERSONALISATION",
      desc: "Hot-foil monogramming, blind debossing, and tailored initials.",
      icon: Sparkles,
      link: "/faq/products/how-does-ovia-personalisation-work",
    },
  ];

  return (
    <div className="contact-page-container">
      {/* HERO SECTION */}
      <section className="contact-hero-section">
        <p className="faq-brand-eyebrow">OVIA</p>
        <h1 className="contact-hero-title">CONTACT US</h1>
        <p className="contact-hero-subtitle">
          Our Client Advisors are here to assist with products, orders, delivery, care and OVIA services.
        </p>
      </section>

      {/* THREE CONTACT OPTIONS */}
      <section className="contact-channels-section">
        <div className="contact-channels-grid">
          {/* 01 - CALL US */}
          <div className="contact-channel-card">
            <div className="contact-channel-header">
              <span className="contact-channel-number">01</span>
              <Phone size={20} strokeWidth={1.5} className="contact-channel-icon" />
            </div>
            <h2>CALL US</h2>
            <p className="contact-channel-desc">
              Speak directly with an OVIA Client Advisor.
            </p>
            <div className="contact-hours-box">
              <div className="contact-hours-row">
                <span className="contact-hours-label">Monday – Saturday</span>
                <span className="contact-hours-value">10:00 AM – 7:00 PM</span>
              </div>
              <div className="contact-hours-row">
                <span className="contact-hours-label">Sunday</span>
                <span className="contact-hours-value">10:00 AM – 5:00 PM</span>
              </div>
            </div>
            <div className="contact-channel-actions">
              <a
                href={`tel:${clientServicesConfig.supportPhone}`}
                className="button dark full"
                aria-label={`Call OVIA at ${clientServicesConfig.supportPhoneDisplay}`}
              >
                CALL OVIA ({clientServicesConfig.supportPhoneDisplay})
              </a>
              <ContactDrawerButton variant="secondary" className="full">
                OPEN CLIENT SERVICES DRAWER
              </ContactDrawerButton>
            </div>
          </div>

          {/* 02 - EMAIL US */}
          <div className="contact-channel-card">
            <div className="contact-channel-header">
              <span className="contact-channel-number">02</span>
              <Mail size={20} strokeWidth={1.5} className="contact-channel-icon" />
            </div>
            <h2>EMAIL US</h2>
            <p className="contact-channel-desc">
              Whether you need assistance with an order, product information or OVIA services, our Client Advisors are here to help.
            </p>
            <div className="contact-email-meta">
              <span className="contact-meta-label">Direct Correspondence</span>
              <span className="contact-meta-val">{clientServicesConfig.supportEmail}</span>
              <span className="contact-meta-sub">Typical response within 4 hours</span>
            </div>
            <div className="contact-channel-actions">
              <a
                href={`mailto:${clientServicesConfig.supportEmail}`}
                className="button dark full"
              >
                SEND AN EMAIL
              </a>
            </div>
          </div>

          {/* 03 - MESSAGE US */}
          <div className="contact-channel-card">
            <div className="contact-channel-header">
              <span className="contact-channel-number">03</span>
              <MessageSquare size={20} strokeWidth={1.5} className="contact-channel-icon" />
            </div>
            <h2>MESSAGE US</h2>
            <p className="contact-channel-desc">
              Connect with an OVIA Client Advisor using your preferred digital messaging service.
            </p>
            <div className="contact-messaging-links">
              <a
                href={clientServicesConfig.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="contact-msg-link"
              >
                <div className="contact-msg-left">
                  <MessageSquare size={18} strokeWidth={1.5} />
                  <span>WhatsApp</span>
                </div>
                <ArrowRight size={16} strokeWidth={1.5} className="contact-msg-arrow" />
              </a>

              <a
                href={clientServicesConfig.appleMessagesUrl}
                className="contact-msg-link"
              >
                <div className="contact-msg-left">
                  <MessageCircle size={18} strokeWidth={1.5} />
                  <span>Apple Messages</span>
                </div>
                <ArrowRight size={16} strokeWidth={1.5} className="contact-msg-arrow" />
              </a>

              <a
                href={clientServicesConfig.facebookMessengerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="contact-msg-link"
              >
                <div className="contact-msg-left">
                  <MessageSquare size={18} strokeWidth={1.5} />
                  <span>Facebook Messenger</span>
                </div>
                <ArrowRight size={16} strokeWidth={1.5} className="contact-msg-arrow" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FREQUENT QUESTIONS SEARCH & POPULAR LIST */}
      <section className="contact-faq-section">
        <div className="faq-section-header">
          <p className="eyebrow">HELP & GUIDANCE</p>
          <h2>FREQUENT QUESTIONS</h2>
          <p className="contact-faq-sub">How can we assist you?</p>
          <div className="contact-faq-search-box">
            <FaqSearchBar placeholder="Search for a question..." />
          </div>
          <div className="faq-divider" />
        </div>

        <div className="faq-questions-list">
          {popularFaqs.map((faq) => (
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
          <Link href="/faq" className="button light">
            DISCOVER ALL FAQs <ArrowUpRight size={14} />
          </Link>
        </div>
      </section>

      {/* CLIENT ADVISOR EDITORIAL SECTION */}
      <section className="contact-editorial-section">
        <div className="contact-editorial-grid">
          <div className="contact-editorial-image">
            <Image
              src="/media/creative.jpg"
              alt="OVIA Client Advisor consultation"
              width={700}
              height={850}
              className="editorial-img"
            />
          </div>
          <div className="contact-editorial-text">
            <p className="eyebrow">PERSONAL ASSISTANCE</p>
            <h2>OUR CLIENT ADVISORS</h2>
            <p className="editorial-lead">
              Looking for the right travel piece or gift? Our team can assist you wherever your journey takes you.
            </p>
            <p className="editorial-body">
              From curating custom luggage sets for extended overseas expeditions to selecting timeless monogrammed leather gifts, our dedicated team is at your service with generational expertise.
            </p>
            <div className="editorial-actions">
              <ContactDrawerButton variant="primary">
                CONTACT US <ArrowRight size={16} />
              </ContactDrawerButton>
            </div>
          </div>
        </div>
      </section>

      {/* WHAT CAN OVIA HELP WITH? */}
      <section className="contact-capabilities-section">
        <div className="faq-section-header">
          <p className="eyebrow">CONCIERGE SERVICES</p>
          <h2>WHAT CAN OVIA HELP WITH?</h2>
          <div className="faq-divider" />
        </div>

        <div className="contact-capabilities-grid">
          {capabilities.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.title} href={item.link} className="capability-card">
                <Icon size={22} strokeWidth={1.5} className="capability-icon" />
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
                <span className="capability-link">
                  Learn more <ArrowRight size={14} />
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
