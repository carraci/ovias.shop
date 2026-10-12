"use client";
import Link from "next/link";
import dynamic from "next/dynamic";
import Image from "next/image";
import { latestLinks } from "@/lib/new-collection";
import { stories } from "@/lib/journal";
import discoverStyles from "./discover-menu.module.css";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Search,
  UserRound,
  ShoppingBag,
  Heart,
  Menu,
  X,
  ArrowUpRight,
  Phone,
  Mail,
  MessageSquare,
  MessageCircle,
  ChevronDown,
  MapPin,
} from "lucide-react";
import { slugify } from "@/lib/catalog-helpers";
import { clientServicesConfig } from "@/lib/client-services-config";
import { useStore } from "./store-provider";
import {
  newMegaCards,
  luggageMegaData,
  bagsMegaData,
  type MegaProductCard,
} from "@/lib/mega-menu-data";
const InstantSearchModal = dynamic(() => import("./instant-search-modal").then(module => module.InstantSearchModal), {ssr:false});
const departments = [
  "New",
  "Luggage",
  "Bags",
  "Services",
  "Discover",
];
interface HeaderProps {
  initialIsOwner?: boolean;
  menuProducts?: { luggage: MegaProductCard[]; bags: MegaProductCard[] };
}
const emptyMenuProducts = { luggage: [], bags: [] };

export function Header({ initialIsOwner = false, menuProducts = emptyMenuProducts }: HeaderProps) {
  const [open, setOpen] = useState<string | null>(null);
  const [mobile, setMobile] = useState(false);
  const [expandedMobileDept, setExpandedMobileDept] = useState<string | null>(null);
  const [mobileSearchQuery, setMobileSearchQuery] = useState("");
  const [ready, setReady] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const pathname = usePathname();
  const header = useRef<HTMLElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const callUsTriggerRef = useRef<HTMLButtonElement | null>(null);
  const contactCloseRef = useRef<HTMLButtonElement | null>(null);
  const { cart, openCartDrawer, wishlist, user } = useStore();
  const isOwner = initialIsOwner || ["OWNER", "ADMIN"].includes(user?.role?.toUpperCase() || "") ||
    ["no-reply@ovias.shop", "adarshshukla4639@gmail.com"].includes(user?.email?.toLowerCase() || "");

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
  if (pathname?.startsWith("/checkout") || pathname?.startsWith("/admin")) {
    return null;
  }
  const isLightHeader =
    pathname !== "/" &&
    !pathname?.startsWith("/admin");

  return (
    <>
      <header
        ref={header}
        className={`header ${scrolled ? "scrolled" : ""} ${open ? "menu-open" : ""} ${mobile ? "mobile-drawer-active" : ""} ${isLightHeader ? "header-light" : ""}`}
        onMouseLeave={() => setOpen(null)}
      >
        <Link href="/" prefetch={false} className="wordmark" aria-label="OVIA home" onClick={() => setMobile(false)}>
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
                  : item === "New"
                    ? "/new"
                    : item === "Services"
                      ? "/services"
                      : "/discover";
            return (
              <Link
                key={item}
                href={href}
                prefetch={false}
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
          <button
            type="button"
            aria-label="Search"
            className="header-action-icon"
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "inherit",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
            }}
            onClick={() => {
              setMobile(false);
              setSearchModalOpen(true);
            }}
          >
            <Search size={20} strokeWidth={1.6} />
          </button>
          {isOwner && (
            <Link
              href="/admin"
              className="admin-badge-toggle desktop-only"
              aria-label="Switch to Owner Admin Control Center"
              title="Shop-Owner Admin Control Center"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 10px",
                borderRadius: 16,
                backgroundColor: "rgba(142, 105, 62, 0.12)",
                border: "1px solid rgba(142, 105, 62, 0.35)",
                color: "#8E693E",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                textDecoration: "none",
                lineHeight: 1.2,
                marginRight: 2,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  backgroundColor: "#10B981",
                  display: "inline-block",
                }}
                className="animate-pulse"
              />
              <span>Admin</span>
            </Link>
          )}
          <Link href={user ? "/account" : "/account/sign-in"} prefetch={false} aria-label="My account" className="header-action-icon desktop-only">
            <UserRound size={20} strokeWidth={1.6} />
          </Link>
          <Link
            href="/account/wishlist"
            aria-label={wishlist.length ? `Wishlist, ${wishlist.length} saved pieces` : "Wishlist"}
            prefetch={false}
            className="header-action-icon desktop-only"
            style={{ position: "relative" }}
          >
            <Heart size={20} strokeWidth={1.6} fill={wishlist.length > 0 ? "currentColor" : "none"} />
            {wishlist.length > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-4px",
                  right: "-6px",
                  fontSize: "10px",
                  background: "#111111",
                  color: "#ffffff",
                  borderRadius: "50%",
                  width: "16px",
                  height: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 600,
                }}
              >
                {wishlist.length}
              </span>
            )}
          </Link>
          <Link
            href="/cart"
            prefetch={false}
            className="bag-icon header-action-icon"
            aria-label={`Shopping bag, ${cart.lines.reduce((a, l) => a + l.quantity, 0)} items`}
            onClick={(e) => {
              e.preventDefault();
              setMobile(false);
              openCartDrawer();
            }}
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
        {mobile && <div
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
                onFocus={() => {
                  setMobile(false);
                  setSearchModalOpen(true);
                }}
                onChange={(e) => setMobileSearchQuery(e.target.value)}
                aria-label="Search collection on mobile"
              />
            </form>

            <div className="mobile-nav-categories">
              {departments.map((item) => {
                const categoryLinks = item === "Bags" ? bagsMegaData.columns[0].links
                  : item === "Luggage" ? luggageMegaData.columns[0].links : [];
                const isExpanded = expandedMobileDept === item;
                const hasSub = categoryLinks.length > 0 || item === "New" || item === "Services" || item === "Discover";
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
                        ) : categoryLinks.length > 0 ? (
                          categoryLinks.filter((link) => link.href !== `/${slugify(item)}`).map((link) => (
                            <Link key={link.href} href={link.href} className="mobile-sublink" onClick={() => setMobile(false)}>
                              {link.label}
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
                            <Link href="/bags" className="mobile-sublink" onClick={() => setMobile(false)}>
                              Bags
                            </Link>
                            <Link href="/luggage" className="mobile-sublink" onClick={() => setMobile(false)}>
                              Luggage
                            </Link>
                            <Link href="/journal" className="mobile-sublink" onClick={() => setMobile(false)}>
                              OVIA Stories & Blogs
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
              {isOwner && (
                <Link
                  href="/admin"
                  className="mobile-utility-link"
                  onClick={() => setMobile(false)}
                  style={{
                    backgroundColor: "rgba(142, 105, 62, 0.1)",
                    color: "#8E693E",
                    border: "1px solid rgba(142, 105, 62, 0.3)",
                    borderRadius: 8,
                    padding: "10px 14px",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor: "#10B981",
                      display: "inline-block",
                    }}
                    className="animate-pulse"
                  />
                  <span>Admin Control Center</span>
                </Link>
              )}
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
              <Link href={user ? "/account" : "/account/sign-in"} className="mobile-utility-link" onClick={() => setMobile(false)}>
                <UserRound size={18} />
                <span>My Account & Orders</span>
              </Link>
              <Link href="/account/wishlist" className="mobile-utility-link" onClick={() => setMobile(false)}>
                <span>Saved Wishlist</span>
              </Link>
            </div>
          </div>
        </div>}
        {open && (
          <div
            id="mega-menu"
            className={`mega-menu ${open === "New" ? "new-menu-wrap" : ""} ${["New", "Luggage", "Bags", "Discover"].includes(open) ? "mega-menu-luxury-wrap" : ""}`}
          >
            {open === "Luggage" ? (
              <div className="mega-menu-luxury">
                <div className="mega-nav-columns">
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
                    {menuProducts.luggage.map((prod) => (
                      <Link
                        key={prod.href}
                        href={prod.href}
                        className="mega-product-card"
                        onClick={() => setOpen(null)}
                      >
                        <div className="mega-product-thumb">
                          <Image src={prod.image} alt={prod.name} fill sizes="160px" style={{objectFit:"contain"}} />
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
                <div className="mega-nav-columns">
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
                    {menuProducts.bags.map((prod) => (
                      <Link
                        key={prod.href}
                        href={prod.href}
                        className="mega-product-card"
                        onClick={() => setOpen(null)}
                      >
                        <div className="mega-product-thumb">
                          <Image src={prod.image} alt={prod.name} fill sizes="160px" style={{objectFit:"contain"}} />
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
                          <></>
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
                      <Link href="/services/contact" className="mega-nav-link" onClick={() => setOpen(null)}>Contact Us</Link>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className={discoverStyles.menu}>
                <div className={discoverStyles.collections}>
                  {[
                    { title: "Bags", description: "Discover bags for every journey", href: "/bags", image: "/media/megamenu/mega-new-never-still.webp" },
                    { title: "Luggage", description: "Explore the OVIA luggage collection", href: "/luggage", image: "/media/megamenu/mega-new-distinct.webp" },
                  ].map((item) => <Link key={item.href} href={item.href} className={discoverStyles.collection} onClick={() => setOpen(null)}>
                    <div className={discoverStyles.collectionImage}><></></div>
                    <strong>{item.title}</strong><span>{item.description}</span>
                  </Link>)}
                </div>
                <section className={discoverStyles.stories} aria-labelledby="discover-stories-title">
                  <h2 id="discover-stories-title">OVIA STORIES & BLOGS</h2>
                  <div className={discoverStyles.storyGrid}>{stories.slice(0, 3).map((story) => <Link key={story.slug} href={`/journal/${story.slug}`} onClick={() => setOpen(null)}>
                    <div className={discoverStyles.storyImage}><Image src={story.image} alt="" fill sizes="(max-width: 760px) 28vw, 13vw" /></div>
                    <span>{story.title}</span>
                  </Link>)}</div>
                  <Link className={discoverStyles.all} href="/journal" onClick={() => setOpen(null)}>All stories & blogs</Link>
                </section>
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
      {contactModalOpen && <div
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
      </div>}

      {searchModalOpen && <InstantSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
      />}
    </>
  );
}
