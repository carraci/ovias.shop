"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Check, ArrowRight } from "lucide-react";
import { usePreferences } from "./preferences";
import { CountryRegionModal } from "./country-region-modal";

export function Footer() {
  const pathname = usePathname();
  const { preferences } = usePreferences();
  const [showInput, setShowInput] = useState(false);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);

  if (pathname?.startsWith("/checkout")) {
    return null;
  }

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && email.includes("@")) {
      setSubscribed(true);
      setTimeout(() => {
        setEmail("");
        setShowInput(false);
        setSubscribed(false);
      }, 4000);
    }
  };

  return (
    <footer className="ovia-luxury-footer">
      <div className="ovia-footer-inner">
        {/* Top Grid: Left Brand/Newsletter + 5 Navigation Columns */}
        <div className="ovia-footer-top-grid">
          {/* Brand & Newsletter Column */}
          <div className="ovia-footer-brand-col">
            <Link href="/" className="ovia-footer-brand-logo" aria-label="OVIA Home">
              <span className="ovia-footer-brand-text">OVIA</span>
              <span className="ovia-footer-brand-tagline">TRAVEL GOODS</span>
            </Link>

            <div className="ovia-footer-newsletter-wrap">
              <p className="ovia-newsletter-eyebrow">SIGN UP FOR OUR NEWSLETTER</p>
              <p className="ovia-newsletter-desc">
                Be the first to know about new collections, exclusive events and the world of OVIA.
              </p>

              {!showInput && !subscribed ? (
                <button
                  type="button"
                  onClick={() => setShowInput(true)}
                  className="ovia-newsletter-btn"
                  aria-label="Sign up for newsletter"
                >
                  SIGN UP
                </button>
              ) : subscribed ? (
                <div className="ovia-newsletter-success">
                  <Check size={14} className="ovia-success-icon" />
                  <span>Thank you for subscribing to OVIA.</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="ovia-newsletter-form">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="ovia-newsletter-input"
                    autoFocus
                  />
                  <button type="submit" className="ovia-newsletter-submit-btn" aria-label="Submit email">
                    <ArrowRight size={14} />
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* 5 Navigation Columns */}
          <div className="ovia-footer-nav-cols">
            {/* Column 1: SHOP */}
            <div className="ovia-footer-nav-col">
              <h4 className="ovia-footer-col-title">SHOP</h4>
              <ul className="ovia-footer-links-list">
                <li><Link href="/new">New Arrivals</Link></li>
                <li><Link href="/bags">Bags</Link></li>
                <li><Link href="/luggage">Luggage</Link></li>
                <li><Link href="/accessories">Accessories</Link></li>
                <li><Link href="/new">Collections</Link></li>
                <li><Link href="/personalise">Personalisation</Link></li>
              </ul>
            </div>

            {/* Column 2: THE WORLD OF OVIA */}
            <div className="ovia-footer-nav-col">
              <h4 className="ovia-footer-col-title">THE WORLD OF OVIA</h4>
              <ul className="ovia-footer-links-list">
                <li><Link href="/about">About OVIA</Link></li>
                <li><Link href="/events">Events</Link></li>
                <li><Link href="/journal">Latest News</Link></li>
              </ul>
            </div>

            {/* Column 3: CLIENT SERVICES */}
            <div className="ovia-footer-nav-col">
              <h4 className="ovia-footer-col-title">CLIENT SERVICES</h4>
              <ul className="ovia-footer-links-list">
                <li><Link href="/services/faq">Client Service</Link></li>
                <li><Link href="/faq">FAQ</Link></li>
                <li><Link href="/care-service">Care Service</Link></li>
                <li><Link href="/stores">Store Locator</Link></li>
              </ul>
            </div>

            {/* Column 4: SUPPORT */}
            <div className="ovia-footer-nav-col">
              <h4 className="ovia-footer-col-title">SUPPORT</h4>
              <ul className="ovia-footer-links-list">
                <li><Link href="/contact-us">Contact Us</Link></li>
                <li><Link href="/account">My Account</Link></li>
              </ul>
            </div>

            {/* Column 5: LEGAL */}
            <div className="ovia-footer-nav-col">
              <h4 className="ovia-footer-col-title">LEGAL</h4>
              <ul className="ovia-footer-links-list">
                <li><Link href="/privacy">Privacy Policy</Link></li>
                <li><Link href="/terms">Terms &amp; Conditions</Link></li>
                <li><Link href="/legal">Imprint</Link></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Sub-bar */}
        <div className="ovia-footer-bottom-bar">
          {/* Left: Country | Language - Opens Country/Region Modal */}
          <div className="ovia-footer-region-picker">
            <button
              type="button"
              onClick={() => setIsCountryModalOpen(true)}
              className="ovia-region-link-btn"
              aria-label="Select Country or Region"
            >
              <span className="ovia-region-label">{preferences.country.toUpperCase()}</span>
              <ChevronDown size={12} className="ovia-region-chevron" />
            </button>
            <span className="ovia-region-divider">|</span>
            <button
              type="button"
              onClick={() => setIsCountryModalOpen(true)}
              className="ovia-region-link-btn"
              aria-label="Select Language"
            >
              <span className="ovia-region-label">ENGLISH</span>
              <ChevronDown size={12} className="ovia-region-chevron" />
            </button>
          </div>

          {/* Center: Social Icons */}
          <div className="ovia-footer-social-wrap">
            <span className="ovia-social-lead">FOLLOW US ON:</span>
            <div className="ovia-social-icons">
              {/* Instagram */}
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="ovia-social-btn"
                aria-label="Instagram"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                </svg>
              </a>

              {/* YouTube */}
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="ovia-social-btn"
                aria-label="YouTube"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/>
                  <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor"/>
                </svg>
              </a>

              {/* Facebook */}
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="ovia-social-btn"
                aria-label="Facebook"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                </svg>
              </a>

              {/* X (formerly Twitter) */}
              <a
                href="https://x.com"
                target="_blank"
                rel="noopener noreferrer"
                className="ovia-social-btn"
                aria-label="X"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>

              {/* LinkedIn */}
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="ovia-social-btn"
                aria-label="LinkedIn"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                  <rect x="2" y="9" width="4" height="12"/>
                  <circle cx="4" cy="4" r="2"/>
                </svg>
              </a>

              {/* WeChat */}
              <a
                href="#wechat"
                className="ovia-social-btn"
                aria-label="WeChat"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8.5 15.5c-4.14 0-7.5-2.8-7.5-6.25S4.36 3 8.5 3c4.14 0 7.5 2.8 7.5 6.25 0 .58-.1 1.15-.28 1.68A6.87 6.87 0 0 0 15 11c0 3.31 3.13 6 7 6 .65 0 1.28-.08 1.87-.23L24 18.5l-1.55-.83c.96-1.07 1.55-2.4 1.55-3.87 0-3.31-3.13-6-7-6-.27 0-.54.02-.8.05C15.82 5.06 12.44 3 8.5 3 3.8 3 0 6.36 0 10.5c0 2.27 1.17 4.31 3.03 5.67L2 19l3.15-1.22c1.02.46 2.14.72 3.35.72 1.33 0 2.58-.33 3.67-.92-.95-.9-1.57-2.12-1.67-3.48-.33.07-.66.1-1 .1zm-2-7a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm5 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm6 5.5a.8.8 0 1 1 0-1.6.8.8 0 0 1 0 1.6zm3.5 0a.8.8 0 1 1 0-1.6.8.8 0 0 1 0 1.6z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Right: Copyright */}
          <div className="ovia-footer-copyright">
            © 2026 OVIA — ALL RIGHTS RESERVED
          </div>
        </div>

        {/* Discreet Academic Disclosure */}
        <p className="ovia-footer-disclosure">
          Fictional products and illustrative design studies. This preview does not fulfill purchases.
        </p>
      </div>

      {/* Country and Region Selector Modal */}
      <CountryRegionModal
        isOpen={isCountryModalOpen}
        onClose={() => setIsCountryModalOpen(false)}
      />
    </footer>
  );
}
