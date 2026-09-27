"use client";
import Link from "next/link";
import Image from "next/image";
import { latestLinks } from "@/lib/new-collection";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Search,
  UserRound,
  ShoppingBag,
  Menu,
  X,
  ArrowUpRight,
  Phone,
  Mail,
  MessageSquare,
  MessageCircle,
  Heart,
  ChevronDown,
  MapPin,
} from "lucide-react";
import { groups, slugify, type Department } from "@/lib/catalog";
import { clientServicesConfig } from "@/lib/client-services-config";
import { useStore } from "./store-provider";
import {
  newMegaCards,
  luggageMegaData,
  bagsMegaData,
  accessoriesMegaData,
} from "@/lib/mega-menu-data";
const departments = [
  "New",
  "Luggage",
  "Bags",
  "Accessories",
  "Specialties",
  "Services",
  "Discover",
];
export function Header() {
  const [open, setOpen] = useState<string | null>(null);
  const [mobile, setMobile] = useState(false);
  const [expandedMobileDept, setExpandedMobileDept] = useState<string | null>(null);
  const [mobileSearchQuery, setMobileSearchQuery] = useState("");
  const [ready, setReady] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const pathname = usePathname();
  const header = useRef<HTMLElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const callUsTriggerRef = useRef<HTMLButtonElement | null>(null);
  const contactCloseRef = useRef<HTMLButtonElement | null>(null);
  const { cart } = useStore();

  useEffect(() => {
    const handleOpenContactDrawer = () => {
      setContactModalOpen(true);
    };
    window.addEventListener("open-contact-drawer", handleOpenContactDrawer);
    return () => {
      window.removeEventListener("open-contact-drawer", handleOpenContactDrawer);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const closeContactDrawer = () => {
    setContactModalOpen(false);
    callUsTriggerRef.current?.focus();
  };

  useEffect(() => {
    if (contactModalOpen || mobile) {
      document.body.style.overflow = "hidden";
      if (contactModalOpen) {
        const timer = setTimeout(() => {
          contactCloseRef.current?.focus();
        }, 50);
        return () => clearTimeout(timer);
      }
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [contactModalOpen, mobile]);

  useEffect(() => {
    setReady(true);
    setOpen(null);
    setMobile(false);
    setExpandedMobileDept(null);
    setContactModalOpen(false);
  }, [pathname]);

  useEffect(() => {
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (contactModalOpen) {
          closeContactDrawer();
          return;
        }
        if (mobile) {
          setMobile(false);
          return;
        }
        setOpen(null);
        trigger.current?.focus();
      }
    };
    const click = (e: MouseEvent) => {
      if (!header.current?.contains(e.target as Node)) {
        setOpen(null);
      }
    };
    document.addEventListener("keydown", close);
    document.addEventListener("pointerdown", click);
    return () => {
      document.removeEventListener("keydown", close);
      document.removeEventListener("pointerdown", click);
    };
  }, [contactModalOpen, mobile]);
  const dept = open?.toLowerCase() as Department;
  if (pathname?.startsWith("/checkout")) {
    return null;
  }
  const isLightHeader =
    pathname === "/cart" ||
    pathname?.startsWith("/products/") ||
    pathname?.startsWith("/account") ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/forgot-password" ||
    pathname === "/storelocator";

  return (
    <>
      <header
        ref={header}
        className={`header ${scrolled ? "scrolled" : ""} ${open ? "menu-open" : ""} ${mobile ? "mobile-drawer-active" : ""} ${isLightHeader ? "header-light" : ""}`}
        onMouseLeave={() => setOpen(null)}
      >
        <Link href="/" className="wordmark" aria-label="OVIA home" onClick={() => setMobile(false)}>
          OVIA<span>TRAVEL GOODS</span>
        </Link>
        <nav
          aria-label="Main navigation"
          className="nav desktop-nav"
        >
          {departments.map((item) => {
            const href =
              item === "Bags"
                ? "/bags"
                : item === "Luggage"
                  ? "/luggage"
                  : item === "Accessories"
                    ? "/accessories"
                    : item === "Specialties"
                      ? "/new"
                      : item === "New"
                        ? "/new"
                        : item === "Services"
                          ? "/services"
                          : "/discover";
            return (
              <Link
                key={item}
                href={href}
                aria-expanded={open === item}
                aria-controls="mega-menu"
                onMouseEnter={() => {
                  setOpen(item);
                }}
                onClick={() => {
                  setOpen(null);
                  setMobile(false);
                }}
              >
                {item}
                <span className="nav-dot" />
              </Link>
            );
          })}
        </nav>
        <div className="header-actions">
          <button
            ref={callUsTriggerRef}
            type="button"
            className="call-us-trigger desktop-only"
            onClick={() => setContactModalOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={contactModalOpen}
          >
            Call Us
          </button>
          <Link href="/search" aria-label="Search" className="header-action-icon" onClick={() => setMobile(false)}>
            <Search size={20} strokeWidth={1.6} />
          </Link>
          <Link href="/account" aria-label="Wishlist" className="wishlist-icon header-action-icon desktop-tablet-only">
            <Heart size={20} strokeWidth={1.6} />
          </Link>
          <Link href="/account" aria-label="My account" className="header-action-icon desktop-only">
            <UserRound size={20} strokeWidth={1.6} />
          </Link>
          <Link
            href="/cart"
            className="bag-icon header-action-icon"
            aria-label={`Shopping bag, ${cart.lines.reduce((a, l) => a + l.quantity, 0)} items`}
            onClick={() => setMobile(false)}
          >
            <ShoppingBag size={20} strokeWidth={1.6} />
            <span>{cart.lines.reduce((a, l) => a + l.quantity, 0)}</span>
          </Link>
          <button
            disabled={!ready}
            className="mobile-toggle"
            aria-label={mobile ? "Close navigation" : "Open navigation"}
            aria-expanded={mobile}
            onClick={() => {
              setMobile(!mobile);
              setOpen(null);
            }}
          >
            {mobile ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Dedicated Mobile Navigation Drawer */}
        <div
          className={`mobile-nav-drawer ${mobile ? "is-open" : ""}`}
          aria-hidden={!mobile}
        >
          <div className="mobile-nav-inner">
            <form
              className="mobile-nav-search"
              onSubmit={(e) => {
                e.preventDefault();
                if (mobileSearchQuery.trim()) {
                  window.location.href = `/search?q=${encodeURIComponent(mobileSearchQuery.trim())}`;
                  setMobile(false);
                }
              }}
            >
              <Search size={18} className="search-icon" />
              <input
                type="search"
                placeholder="Search luggage, bags, materials…"
                value={mobileSearchQuery}
                onChange={(e) => setMobileSearchQuery(e.target.value)}
                aria-label="Search collection on mobile"
              />
            </form>

            <div className="mobile-nav-categories">
              {departments.map((item) => {
                const itemDept = item.toLowerCase() as Department;
                const isExpanded = expandedMobileDept === item;
                const hasSub = !!groups[itemDept] || item === "New" || item === "Services" || item === "Discover";
                return (
                  <div key={item} className="mobile-nav-item">
                    <div className="mobile-nav-row">
                      <button
                        type="button"
                        className="mobile-nav-link"
                        onClick={() => setExpandedMobileDept(isExpanded ? null : item)}
                        aria-expanded={isExpanded}
                        aria-label={item}
                      >
                        <span>{item}</span>
                        {hasSub && (
                          <ChevronDown size={18} className={`mobile-expand-icon ${isExpanded ? "expanded" : ""}`} />
                        )}
                      </button>
                    </div>
                    {hasSub && isExpanded && (
                      <div className="mobile-nav-subcategories">
                        <Link
                          href={item === "New" ? "/new" : `/${slugify(item)}`}
                          className="mobile-sublink highlight"
                          onClick={() => setMobile(false)}
                        >
                          All {item} →
                        </Link>
                        {item === "New" ? (
                          latestLinks.map((link) => (
                            <Link key={link.href} href={link.href} className="mobile-sublink" onClick={() => setMobile(false)}>
                              {link.label}
                            </Link>
                          ))
                        ) : groups[itemDept] ? (
                          groups[itemDept].map(([category]) => (
                            <Link
                              key={category}
                              href={`/${itemDept}/${slugify(category)}`}
                              className="mobile-sublink"
                              onClick={() => setMobile(false)}
                            >
                              {category}
                            </Link>
                          ))
                        ) : item === "Services" ? (
                          <>
                            <Link href="/care-service" className="mobile-sublink" onClick={() => setMobile(false)}>
                              Care & Repair Service
                            </Link>
                            <Link href="/faq" className="mobile-sublink" onClick={() => setMobile(false)}>
                              Help & FAQ
                            </Link>
                            <Link href="/storelocator" className="mobile-sublink" onClick={() => setMobile(false)}>
                              Store Locator
                            </Link>
                          </>
                        ) : (
                          <>
                            <Link href="/discover" className="mobile-sublink" onClick={() => setMobile(false)}>
                              Our Approach
                            </Link>
                            <Link href="/journal" className="mobile-sublink" onClick={() => setMobile(false)}>
                              Stories & Journal
                            </Link>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mobile-nav-utilities">
              <Link href="/storelocator" className="mobile-utility-link" onClick={() => setMobile(false)}>
                <MapPin size={18} />
                <span>Find an OVIA Store</span>
              </Link>
              <button
                type="button"
                className="mobile-utility-link"
                onClick={() => {
                  setMobile(false);
                  setContactModalOpen(true);
                }}
              >
                <Phone size={18} />
                <span>Call Client Advisor</span>
              </button>
              <Link href="/account" className="mobile-utility-link" onClick={() => setMobile(false)}>
                <UserRound size={18} />
                <span>My Account & Orders</span>
              </Link>
              <Link href="/account" className="mobile-utility-link" onClick={() => setMobile(false)}>
                <Heart size={18} />
                <span>Saved Wishlist</span>
              </Link>
            </div>
          </div>
        </div>
        {open && (
          <div
            id="mega-menu"
            className={`mega-menu ${open === "New" ? "new-menu-wrap" : ""} ${["New", "Luggage", "Bags", "Accessories", "Specialties"].includes(open) ? "mega-menu-luxury-wrap" : ""}`}
          >
            {open === "Luggage" ? (
              <div className="mega-menu-luxury">
                <div className="mega-nav-columns cols-4">
                  {luggageMegaData.columns.map((col) => (
                    <div key={col.title} className="mega-nav-col">
                      <p className="mega-nav-heading">{col.title}</p>
                      <div className="mega-nav-list">
                        {col.links.map((link) => (
                          <Link
                            key={link.label}
                            href={link.href}
                            className="mega-nav-link"
                            onClick={() => setOpen(null)}
                          >
                            {link.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mega-showcase-section">
                  <div className="mega-product-grid luggage-grid">
                    {luggageMegaData.products.map((prod) => (
                      <Link
                        key={prod.name}
                        href={prod.href}
                        className="mega-product-card"
                        onClick={() => setOpen(null)}
                      >
                        <div className="mega-product-thumb">
                          <Image
                            src={prod.image}
                            alt={prod.name}
                            fill
                            sizes="180px"
                            className="mega-product-img"
                          />
                        </div>
                        <div className="mega-product-info">
                          <span className="mega-product-name">{prod.name}</span>
                          <span className="mega-product-sub">{prod.subtitle}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <div className="mega-showcase-footer">
                    <Link
                      href={luggageMegaData.allCollectionsHref}
                      className="mega-showcase-all-link"
                      onClick={() => setOpen(null)}
                    >
                      See all collections
                    </Link>
                  </div>
                </div>
              </div>
            ) : open === "Bags" ? (
              <div className="mega-menu-luxury">
                <div className="mega-nav-columns cols-3">
                  {bagsMegaData.columns.map((col) => (
                    <div key={col.title} className="mega-nav-col">
                      <p className="mega-nav-heading">{col.title}</p>
                      <div className="mega-nav-list">
                        {col.links.map((link) => (
                          <Link
                            key={link.label}
                            href={link.href}
                            className="mega-nav-link"
                            onClick={() => setOpen(null)}
                          >
                            {link.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mega-showcase-section">
                  <div className="mega-product-grid bags-grid">
                    {bagsMegaData.products.map((prod) => (
                      <Link
                        key={prod.name}
                        href={prod.href}
                        className="mega-product-card"
                        onClick={() => setOpen(null)}
                      >
                        <div className="mega-product-thumb">
                          <Image
                            src={prod.image}
                            alt={prod.name}
                            fill
                            sizes="180px"
                            className="mega-product-img"
                          />
                        </div>
                        <div className="mega-product-info">
                          <span className="mega-product-name">{prod.name}</span>
                          <span className="mega-product-sub">{prod.subtitle}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : open === "Accessories" ? (
              <div className="mega-menu-luxury">
                <div className="mega-nav-columns cols-4">
                  {accessoriesMegaData.columns.map((col) => (
                    <div key={col.title} className="mega-nav-col">
                      <p className="mega-nav-heading">{col.title}</p>
                      <div className="mega-nav-list">
                        {col.links.map((link) => (
                          <Link
                            key={link.label}
                            href={link.href}
                            className="mega-nav-link"
                            onClick={() => setOpen(null)}
                          >
                            {link.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mega-showcase-section">
                  <div className="mega-accessories-visual-grid">
                    {accessoriesMegaData.visualCards.map((card) => (
                      <Link
                        key={card.name}
                        href={card.href}
                        className="mega-visual-card"
                        onClick={() => setOpen(null)}
                      >
                        <div className="mega-visual-thumb">
                          <Image
                            src={card.image}
                            alt={card.name}
                            fill
                            sizes="200px"
                            className="mega-visual-img"
                          />
                        </div>
                        <span className="mega-visual-name">{card.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : open === "Specialties" ? (
              <div className="mega-menu-luxury">
                <div className="mega-nav-columns cols-3">
                  <div className="mega-nav-col">
                    <p className="mega-nav-heading">SPECIAL PIECES</p>
                    <div className="mega-nav-list">
                      <Link href="/new/artist-case" className="mega-nav-link" onClick={() => setOpen(null)}>Artist Case</Link>
                      <Link href="/specialty-dartboard-case" className="mega-nav-link" onClick={() => setOpen(null)}>Dartboard Case</Link>
                      <Link href="/new" className="mega-nav-link" onClick={() => setOpen(null)}>Limited Editions</Link>
                      <Link href="/discover" className="mega-nav-link" onClick={() => setOpen(null)}>Bespoke Atelier</Link>
                    </div>
                  </div>
                </div>
                <div className="mega-showcase-section">
                  <div className="mega-accessories-visual-grid">
                    <Link href="/new/artist-case" className="mega-visual-card" onClick={() => setOpen(null)}>
                      <div className="mega-visual-thumb">
                        <Image src="/media/artist-case.svg" alt="Artist Case" fill sizes="200px" className="mega-visual-img" />
                      </div>
                      <span className="mega-visual-name">The Studio Artist Case</span>
                    </Link>
                    <Link href="/specialty-dartboard-case" className="mega-visual-card" onClick={() => setOpen(null)}>
                      <div className="mega-visual-thumb">
                        <Image src="/media/bags/specialty-dartboard-case.png" alt="Dartboard Case" fill sizes="200px" className="mega-visual-img" />
                      </div>
                      <span className="mega-visual-name">Dartboard Case</span>
                    </Link>
                  </div>
                </div>
              </div>
            ) : open === "New" ? (
              <div className="mega-menu-luxury new-mega-container">
                <div className="new-nav-col">
                  <p className="mega-nav-heading">LATEST</p>
                  <div className="mega-nav-list">
                    {latestLinks.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="mega-nav-link"
                        onClick={() => setOpen(null)}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
                <div className="new-showcase-section">
                  <div className="new-cards-grid">
                    {newMegaCards.map((card) => (
                      <Link
                        key={card.title}
                        className="new-card-item"
                        href={card.href}
                        onClick={() => setOpen(null)}
                      >
                        <div className="new-card-thumb">
                          <Image
                            src={card.image}
                            alt={card.title}
                            fill
                            sizes="(max-width: 1200px) 28vw, 360px"
                            priority
                            className="new-card-img"
                          />
                        </div>
                        <div className="new-card-info">
                          <span className="new-card-title">{card.title}</span>
                          <span className="new-card-sub">{card.subtitle}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : open === "Services" ? (
              <div className="mega-menu-luxury">
                <div className="mega-nav-columns cols-3">
                  <div className="mega-nav-col">
                    <p className="mega-nav-heading">CLIENT SERVICES</p>
                    <div className="mega-nav-list">
                      <Link href="/help" className="mega-nav-link" onClick={() => setOpen(null)}>Help Center</Link>
                      <Link href="/storelocator" className="mega-nav-link" onClick={() => setOpen(null)}>Find a store</Link>
                      <Link href="/services/faq" className="mega-nav-link" onClick={() => setOpen(null)}>FAQ</Link>
                      <Link href="/services/shipping" className="mega-nav-link" onClick={() => setOpen(null)}>Shipping</Link>
                      <Link href="/services/returns" className="mega-nav-link" onClick={() => setOpen(null)}>Returns & Repairs</Link>
                      <Link href="/services/locks" className="mega-nav-link" onClick={() => setOpen(null)}>Lock instructions</Link>
                      <Link href="/services/contact" className="mega-nav-link" onClick={() => setOpen(null)}>Contact Us</Link>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mega-menu-luxury">
                <div className="mega-nav-columns cols-3">
                  <div className="mega-nav-col">
                    <p className="mega-nav-heading">STORIES & CRAFT</p>
                    <div className="mega-nav-list">
                      <Link href="/discover" className="mega-nav-link" onClick={() => setOpen(null)}>Our approach</Link>
                      <Link href="/heritage" className="mega-nav-link" onClick={() => setOpen(null)}>The OVIA story</Link>
                      <Link href="/journal" className="mega-nav-link" onClick={() => setOpen(null)}>All stories</Link>
                      <Link href="/journal" className="mega-nav-link" onClick={() => setOpen(null)}>In motion</Link>
                      <Link href="/our-approach" className="mega-nav-link" onClick={() => setOpen(null)}>A considered carry</Link>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <button
              className="mega-close icon-button"
              aria-label="Close menu"
              onClick={() => {
                setOpen(null);
                trigger.current?.focus();
              }}
            >
              <X />
            </button>
          </div>
        )}
      </header>
      <div
        className={`contact-drawer-backdrop ${contactModalOpen ? "is-open" : ""}`}
        aria-hidden={!contactModalOpen}
        onClick={(e) => {
          if (e.target === e.currentTarget) closeContactDrawer();
        }}
      >
        <aside
          className={`contact-drawer-panel ${contactModalOpen ? "is-open" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="contact-drawer-title"
          tabIndex={-1}
        >
          <div className="contact-drawer-inner">
            <div className="contact-drawer-header">
              <h2 id="contact-drawer-title">Call Us</h2>
              <button
                ref={contactCloseRef}
                type="button"
                className="contact-drawer-close"
                onClick={closeContactDrawer}
                aria-label="Close Call Us panel"
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            <p className="contact-drawer-subtitle">
              Wherever you are, OVIA Client Advisors will be delighted to assist you.
            </p>

            <div className="contact-drawer-options">
              <a href={`tel:${clientServicesConfig.supportPhone}`} className="contact-drawer-item">
                <Phone size={18} strokeWidth={1.5} />
                <span>{clientServicesConfig.supportPhoneDisplay}</span>
              </a>
              <a href={`mailto:${clientServicesConfig.supportEmail}`} className="contact-drawer-item">
                <Mail size={18} strokeWidth={1.5} />
                <span>Send an Email</span>
              </a>
              <a
                href={clientServicesConfig.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="contact-drawer-item"
              >
                <MessageSquare size={18} strokeWidth={1.5} />
                <span>WhatsApp</span>
              </a>
              <a href={clientServicesConfig.appleMessagesUrl} className="contact-drawer-item">
                <MessageCircle size={18} strokeWidth={1.5} />
                <span>Apple Messages</span>
              </a>
              <a
                href={clientServicesConfig.facebookMessengerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="contact-drawer-item"
              >
                <MessageSquare size={18} strokeWidth={1.5} />
                <span>Facebook Messenger</span>
              </a>
            </div>

            <div className="contact-drawer-divider" />

            <div className="contact-drawer-links">
              <Link href="/contact-us" onClick={closeContactDrawer}>
                CONTACT US
              </Link>
              <Link href="/faq" onClick={closeContactDrawer}>
                FAQ
              </Link>
              <Link href="/care-service" onClick={closeContactDrawer}>
                CARE SERVICE
              </Link>
              <Link href="/contact-us" onClick={closeContactDrawer}>
                Store Lounges
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
