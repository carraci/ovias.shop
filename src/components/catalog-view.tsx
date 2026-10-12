"use client";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useTransition, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronDown,
  ChevronUp,
  Check,
  X,
  ArrowLeft,
  ArrowRight,
  Search,
} from "lucide-react";
import { filterProducts, type Filters } from "@/lib/catalog-filter";
import { groups, slugify, canonicalCategory } from "@/lib/catalog-helpers";
import type { Product, Department } from "@/lib/catalog";
import type { PreparedListing } from "@/lib/catalog-listing";
import { catalogFacets } from "@/lib/catalog-facets";
import { ProductCard } from "./product-card";
import searchStyles from "./catalog-search.module.css";

const categoryBanners: Record<
  string,
  {
    image: string;
    mobileImage?: string;
    alt: string;
    title?: string;
    subtitle?: string;
    hasTitle?: boolean;
  }
> = {
  "cabin-bags": {
    image: "/media/case-flowers.jpg", alt: "OVIA Cabin Bags", title: "Cabin Bags",
    subtitle: "Explore cabin bags and compact travel companions.",
  },
  luggage: {
    image: "/media/category-luggage.jpg",
    alt: "OVIA All Luggage",
    title: "All Luggage",
    subtitle: "Exceptional craftsmanship. Timeless design. Luggage created for every journey.",
  },
  "all-luggage": {
    image: "/media/category-luggage.jpg",
    alt: "OVIA All Luggage",
    title: "All Luggage",
    subtitle: "Exceptional craftsmanship. Timeless design. Luggage created for every journey.",
  },
  "emblematic-pieces": {
    image: "/media/category-luggage.jpg",
    alt: "OVIA Emblematic Pieces",
    title: "Emblematic Pieces",
    subtitle: "The defining icons of travel design, crafted with enduring German engineering.",
  },
  cabin: {
    image: "/media/case-flowers.jpg",
    alt: "OVIA Cabin Luggage",
    title: "Cabin Luggage",
    subtitle: "Compact proportions engineered for short journeys and effortless overhead carry.",
  },
  "check-in": {
    image: "/media/banner-checkin-16k.jpg",
    alt: "OVIA Check-In Luggage",
    title: "Check-in Luggage",
    subtitle: "Engineered volume and refined resilience for extended stays and long-haul travel.",
  },
  trunk: {
    image: "/media/banner-trunk-16k.jpg",
    alt: "Large Trunk Suitcases",
    title: "Large Trunk Suitcases",
    subtitle: "Iconic silhouette with expansive depth, inspired by classic travel trunks.",
  },
  trunks: {
    image: "/media/banner-trunk-16k.jpg",
    alt: "Large Trunk Suitcases",
    title: "Large Trunk Suitcases",
    subtitle: "Iconic silhouette with expansive depth, inspired by classic travel trunks.",
  },
  "large-luggage": {
    image: "/media/banner-trunk-16k.jpg",
    alt: "Large Luggage",
    title: "Large Luggage",
    subtitle: "Expansive travel capacity engineered for life's longest horizons.",
  },
  "medium-luggage": {
    image: "/media/banner-checkin-16k.jpg",
    alt: "Medium Luggage",
    title: "Medium Luggage",
    subtitle: "Medium suitcases for your next journey.",
  },
  "small-luggage": {
    image: "/media/case-flowers.jpg",
    alt: "Small Luggage",
    title: "Small Luggage",
    subtitle: "Compact suitcases for shorter trips.",
  },
  "short-trips": {
    image: "/media/journey.jpg",
    alt: "OVIA Short Trips Collection",
    title: "Short Trips",
    subtitle: "Agile, lightweight carry-ons crafted for weekend escapes and brief journeys.",
  },
  "long-journeys": {
    image: "/media/horizon-sunset.jpg",
    alt: "OVIA Long Journeys Collection",
    title: "Long Journeys",
    subtitle: "Spacious check-in cases designed to hold everything required for extended travels.",
  },
  "long-haul": {
    image: "/media/horizon-sunset.jpg",
    alt: "OVIA Long Haul Collection",
    title: "Long Haul",
    subtitle: "Spacious check-in cases designed to hold everything required for extended travels.",
  },
  "business-selection": {
    image: "/media/architecture.jpg",
    alt: "OVIA Business Selection",
    title: "Business Selection",
    subtitle: "Precision-crafted cases for the professional traveller demanding seamless mobility.",
  },
  "best-sellers": {
    image: "/media/launch-models.jpg",
    alt: "OVIA Best Sellers",
    title: "Best Sellers",
    subtitle: "Explore the selected Best Sellers collection.",
  },
  "new-arrivals": {
    image: "/media/new-hero.jpg",
    alt: "OVIA New Arrivals",
    title: "New Arrivals",
    subtitle: "The latest innovations in luxury luggage, refined materials, and finishes.",
  },
  aluminium: {
    image: "/media/material-aluminium.jpg",
    alt: "OVIA Aluminium Luggage",
    title: "Aluminium Luggage",
    subtitle: "High-grade anodised aluminium with grooved contours and reinforced corners.",
  },
  polypropylene: {
    image: "/media/category-luggage.jpg", alt: "OVIA Polypropylene Luggage", title: "Polypropylene Luggage",
    subtitle: "Explore lightweight polypropylene cases for your next journey.",
  },
  polycarbonate: {
    image: "/media/material-nylon.jpg",
    alt: "OVIA Polycarbonate Luggage",
    title: "Polycarbonate Luggage",
    subtitle: "Remarkably lightweight, impact-resistant polycarbonate engineered for fluid movement.",
  },
  leather: {
    image: "/media/material-leather.jpg",
    alt: "OVIA Leather Luggage",
    title: "Leather Luggage",
    subtitle: "Bespoke full-grain leather paired with artisan stitching and precision hardware.",
  },
  backpacks: {
    image: "/media/banner-backpacks.jpg",
    alt: "OVIA Backpacks",
    title: "Backpacks",
    subtitle: "A considered daily carry uniting refined utility and balanced proportions.",
  },
  "weekend-bags": {
    image: "/media/editorial-bags.jpg",
    alt: "Weekend Bags",
    title: "Weekend Bags",
    subtitle: "Bags for weekend getaways and overnight stays.",
  },
  "duffle-bags": {
    image: "/media/editorial-bags.jpg",
    alt: "Duffel Bags",
    title: "Duffel Bags",
    subtitle: "Generously proportioned for weekend escapes and spontaneous getaways.",
  },
  "shoulder-bags": {
    image: "/media/cat-crossbody.jpg",
    alt: "Shoulder Bags",
    title: "Shoulder Bags",
    subtitle: "Effortless carry for every occasion. Relaxed silhouettes and refined craftsmanship.",
  },
  "hand-carry": {
    image: "/media/cat-handcarry.jpg",
    alt: "Hand Carry",
    title: "Hand Carry",
    subtitle: "Precision-engineered cases, briefcases, and carriers for seamless daily mobility.",
  },
  'travel-bags': {image:'/media/editorial-bags.jpg',alt:'Travel Bags',title:'Travel Bags',subtitle:'Bags for travel, weekends and overnight stays.'},
  briefcases: {
    image: "/media/cat-handcarry.jpg", alt: "OVIA Briefcases", title: "Briefcases",
    subtitle: "Explore briefcases and bags for your working day.",
  },
  crossbodies: {
    image: "/media/cat-crossbody.jpg", alt: "OVIA Crossbody Bags", title: "Crossbody Bags",
    subtitle: "Compact bags to keep your everyday essentials close.",
  },
  totes: {
    image: "/media/editorial-bags.jpg", alt: "OVIA Tote Bags", title: "Tote Bags",
    subtitle: "Explore everyday tote bags and roomy carryalls.",
  },
  'everyday-mobility': {image:'/media/editorial-bags.jpg',alt:'Everyday Bags',title:'Everyday Bags',subtitle:'Bags for everyday routines and daily essentials.'},
  bags: {
    image: "/media/banner-backpacks.jpg",
    alt: "Bags",
    title: "All Bags",
    subtitle: "Available in a variety of shapes, OVIA's versatile bag collections are designed for daily routines or travel needs.",
  },
  gifts: {
    image: "/media/category-accessories.jpg",
    alt: "OVIA All Gifts",
    title: "All Gifts",
    subtitle: "A curated selection of iconic suitcases, handcrafted leather goods, and refined travel accessories.",
  },
  "all-gifts": {
    image: "/media/category-accessories.jpg",
    alt: "OVIA All Gifts",
    title: "All Gifts",
    subtitle: "A curated selection of iconic suitcases, handcrafted leather goods, and refined travel accessories.",
  },
  silver: {
    image: "/media/material-aluminium.jpg",
    alt: "OVIA Silver Luggage",
    title: "Silver Luggage",
    subtitle: "Iconic anodised aluminium cases finished with timeless high-gloss silver sheen.",
  },
  black: {
    image: "/media/banner-checkin-16k.jpg",
    alt: "OVIA Black Luggage",
    title: "Black Luggage",
    subtitle: "Understated elegance. Matte and satin black finishes engineered for stealth luxury.",
  },
  blue: {
    image: "/media/horizon-sunset.jpg",
    alt: "OVIA Blue Luggage",
    title: "Blue Luggage",
    subtitle: "Deep indigo, arctic and matte blue luggage crafted for captivating journeys.",
  },
  "midnight-blue": {
    image: "/media/horizon-sunset.jpg",
    alt: "OVIA Blue Luggage",
    title: "Blue Luggage",
    subtitle: "Deep indigo, arctic and matte blue luggage crafted for captivating journeys.",
  },
  "midnight blue": {
    image: "/media/horizon-sunset.jpg",
    alt: "OVIA Blue Luggage",
    title: "Blue Luggage",
    subtitle: "Deep indigo, arctic and matte blue luggage crafted for captivating journeys.",
  },
  "iphone-cases": {
    image: "/media/accessories-cat-tech.jpg",
    alt: "OVIA iPhone Cases",
    title: "iPhone Cases",
    subtitle: "Engineered with grooved aluminium and impact-resistant materials for seamless daily protection.",
  },
  hats: {
    image: "/media/accessories-cat-travel.jpg",
    alt: "OVIA Hats",
    title: "Hats",
    subtitle: "Reversible bucket hats crafted in resilient cotton canvas with understated monogram detailing.",
  },
  sunglasses: {
    image: "/media/accessories-detail-materials.jpg",
    alt: "OVIA Sunglasses",
    title: "Sunglasses",
    subtitle: "Architectural eyewear handcrafted with grooved metal temples and precision polarised lenses.",
  },
  belts: {
    image: "/media/accessories-cat-personalisation.jpg",
    alt: "OVIA Belts",
    title: "Belts",
    subtitle: "Reversible full-grain calfskin leather belts fitted with palladium-finish heritage buckles.",
  },
  "card-holders": {
    image: "/media/accessories-cat-all.jpg",
    alt: "OVIA Card Holders",
    title: "Card Holders",
    subtitle: "Anodised grooved aluminium card holders featuring RFID security and leather-lined compartments.",
  },
  "address-tags": {
    image: "/media/accessories-cat-personalisation.jpg",
    alt: "OVIA Address Tags",
    title: "Address Tags",
    subtitle: "Handcrafted in Europe from supple full-grain Italian leather for distinguished luggage identification.",
  },
  stickers: {
    image: "/media/accessories-cat-travel.jpg",
    alt: "OVIA Luggage Stickers",
    title: "Stickers",
    subtitle: "Screenprinted vinyl city and cultural stickers to chronicle your journey across global destinations.",
  },
  "bag-straps": {
    image: "/media/accessories-detail-materials.jpg",
    alt: "OVIA Bag Straps",
    title: "Bag Straps",
    subtitle: "Engineered jacquard webbing and premium leather straps fitted with brushed palladium snap hooks.",
  },
  wheels: {
    image: "/media/accessories-detail-hardware.jpg",
    alt: "OVIA Wheels Set",
    title: "Classic Wheels",
    subtitle: "Customise your case with whisper-quiet, dual ball-bearing multiwheel sets in signature hues.",
  },
  customisation: {
    image: "/media/accessories-cat-personalisation.jpg",
    alt: "OVIA Customisation",
    title: "Customisation",
    subtitle: "Make your luggage unmistakably yours with address tags, city stickers, bag straps, and wheel sets.",
  },
  accessories: {
    image: "/media/category-accessories.jpg",
    alt: "OVIA Accessories",
    title: "All Accessories",
    subtitle: "Thoughtfully designed accessories to make every journey smoother, more organised and more personal.",
  },
  "all-accessories": {
    image: "/media/category-accessories.jpg",
    alt: "OVIA Accessories",
    title: "All Accessories",
    subtitle: "Thoughtfully designed accessories to make every journey smoother, more organised and more personal.",
  },
};


export function CatalogView({
  products,
  title,
  description,
  base = {},
  search = false,
  heroImage,
  prepared,
}: {
  products: Product[];
  title: string;
  description: string;
  base?: Filters;
  search?: boolean;
  heroImage?: string;
  prepared?: PreparedListing;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const filterBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filterBarRef.current && !filterBarRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filters = useMemo<Filters & { colour?: string }>(() => ({
    ...Object.fromEntries(params),
    ...Object.fromEntries(
      Object.entries(base).filter(([, value]) => value !== undefined),
    ),
    limit: base.limit || params.get("limit") || "12",
  }), [params, base]);

  const filterOptions = useMemo(() => prepared?.facets || catalogFacets(products, base, filters), [prepared, products, base, filters]);
  const { items, total, page, pages } = useMemo(() => prepared ? { items: products, ...prepared.pagination } : filterProducts(products, filters), [prepared, products, filters]);
  const active = ["category", "subCategory", "material", "color", "collection"].filter((k) =>
    params.has(k),
  );
  function change(key: string, value: string) {
    if ((key === "category" || key === "subCategory") && (base.department === "luggage" || base.department === "bags") && pathname.startsWith(`/${base.department}`)) {
      const next = new URLSearchParams(params);
      ["category", "subCategory", "subcategory", "page", "material", "color", "collection"].forEach(key => next.delete(key));
      const route = value ? `/${base.department}/${value}` : `/${base.department}`;
      if (!value) next.set("view", "catalog");
      startTransition(() => router.push(`${route}?${next.toString()}`, {scroll:false}));
      return;
    }
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    startTransition(() =>
      router.push(`${pathname}?${next.toString()}`, { scroll: false }),
    );
  }
  const currentCategoryKey = (
    filters.color ||
    filters.colour ||
    filters.material ||
    filters.tag ||
    filters.subcategory ||
    filters.subCategory ||
    filters.category ||
    base.subcategory ||
    base.subCategory ||
    base.category ||
    base.tag ||
    (base.department && !filters.category && !filters.subcategory ? base.department : "") ||
    slugify(title)
  ).toLowerCase();

  const isBagsOverview =
    (base.department === "bags" || currentCategoryKey === "bags") &&
    !base.category &&
    !base.tag &&
    !filters.tag &&
    !filters.category;

  const isBagsView =
    base.department === "bags" ||
    pathname.startsWith("/bags") ||
    [
      "backpacks",
      "duffle-bags",
      "briefcases",
      "crossbodies",
      "totes",
      "shoulder-bags",
      "hand-carry",
      "bags",
    ].includes(currentCategoryKey);

  const isLuggageView =
    (base.department === "luggage" ||
      pathname.startsWith("/luggage") ||
      pathname.startsWith("/all-luggage") ||
      [
        "cabin",
        "check-in",
        "trunk",
        "trunks",
        "large-luggage",
        "short-trips",
        "long-journeys",
        "long-haul",
        "business-selection",
        "best-sellers",
        "new-arrivals",
        "all-luggage",
        "luggage",
      ].includes(currentCategoryKey)) &&
    !isBagsView;

  const isValidCustomHero = Boolean(
    heroImage &&
    heroImage.trim() !== "" &&
    heroImage !== "/media/luggage.svg"
  );

  const staticBanner =
    categoryBanners[currentCategoryKey] ||
    (currentCategoryKey.includes("trunk") ? categoryBanners["trunk"] : null) ||
    (currentCategoryKey.includes("cabin") ? categoryBanners["cabin"] : null) ||
    (currentCategoryKey.includes("check") ? categoryBanners["check-in"] : null) ||
    (currentCategoryKey.includes("backpack") ? categoryBanners["backpacks"] : null) ||
    (isLuggageView ? categoryBanners["luggage"] : null) ||
    (isBagsView ? categoryBanners["bags"] : null);

  const banner = isValidCustomHero
    ? {
        image: heroImage!,
        alt: title,
        title: title,
        subtitle: description || staticBanner?.subtitle,
        hasTitle: false,
      }
    : staticBanner;

  const displayedItems = items;
  const displayedTotal = total;

  return (
    <div className="catalog-page section">
      <div className="breadcrumb">
        Home / {isBagsOverview && !banner ? "Bags" : currentCategoryKey.includes("trunk") ? "Trunk" : title}
      </div>
      {banner ? (
        <div className="category-hero-banner">
          <Image
            src={banner.image}
            alt={banner.alt || title}
            fill
            preload
            sizes="100vw"
            className="category-hero-img"
          />
          <div className="category-hero-overlay" />
          <div className="category-hero-content">
            {banner.hasTitle ? (
              <h1 className="sr-only">{pathname === "/luggage/luggage" ? "Luggage" : banner.title || title}</h1>
            ) : (
              <h1 className="category-hero-title">{pathname === "/luggage/luggage" ? "Luggage" : banner.title || title}</h1>
            )}
            {banner.subtitle && (
              <p className="category-hero-subtitle">{banner.subtitle}</p>
            )}
          </div>
        </div>
      ) : isBagsOverview ? (
        <div className="bags-overview-catalog-header">
          <h2 className="bags-overview-catalog-title">All Bags</h2>
          <span className="bags-overview-catalog-count">{displayedTotal} pieces</span>
        </div>
      ) : (
        <div className="catalog-heading">
          <p className="eyebrow">THE OVIA COLLECTION</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      )}

      {search && (
        <form
          className={searchStyles.form}
          role="search"
          aria-label="Product search"
          onSubmit={(event) => {
            event.preventDefault();
            const query = String(new FormData(event.currentTarget).get("q") || "").trim();
            change("q", query);
          }}
        >
          <button type="submit" aria-label="Submit search" disabled={pending}>
            <Search size={18} strokeWidth={1.4} aria-hidden="true" />
          </button>
          <input
            key={params.get("q") || ""}
            type="search"
            name="q"
            aria-label="Search products"
            placeholder="Search"
            defaultValue={params.get("q") || ""}
          />
        </form>
      )}

      {/* RIMOWA-STYLE DROPDOWN FILTER BAR */}
      <div className="rimowa-filter-bar" ref={filterBarRef}>
        <div className="rimowa-filter-left">
          {/* CATEGORY */}
          <div className="rimowa-filter-item">
            <button
              type="button"
              className={`rimowa-filter-btn ${activeDropdown === "category" ? "open" : ""} ${filters.category ? "has-val" : ""}`}
              onClick={() => setActiveDropdown(activeDropdown === "category" ? null : "category")}
              aria-expanded={activeDropdown === "category"}
            >
              <span>Category</span>
              {activeDropdown === "category" ? <ChevronUp size={13} strokeWidth={2} /> : <ChevronDown size={13} strokeWidth={2} />}
            </button>
            {activeDropdown === "category" && (
              <div className="rimowa-dropdown rimowa-dropdown-category">
                {!isBagsView && base.department !== "accessories" && (
                  <div className="dropdown-section">
                    {!base.department && <p className="dropdown-group-title">Luggage</p>}
                    {filterOptions.categories.luggage.map((opt) => {
                      const checked = canonicalCategory(filters.category || "") === canonicalCategory(opt.value);
                      return (
                        <label key={opt.value} className="dropdown-checkbox-label">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              change("category", checked ? "" : opt.value);
                              setActiveDropdown(null);
                            }}
                          />
                          <span className="custom-checkbox">{checked && <Check size={11} strokeWidth={3} />}</span>
                          <span>{opt.label}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
                {!isBagsView && !isLuggageView && base.department !== "accessories" && (
                  <div className="dropdown-divider" />
                )}
                {!isLuggageView && base.department !== "accessories" && (
                  <div className="dropdown-section">
                    {!base.department && <p className="dropdown-group-title">Bags</p>}
                    {filterOptions.categories.bags.map((opt) => {
                      const checked = canonicalCategory(filters.category || "") === canonicalCategory(opt.value);
                      return (
                        <label key={opt.value} className="dropdown-checkbox-label">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              change("category", checked ? "" : opt.value);
                              setActiveDropdown(null);
                            }}
                          />
                          <span className="custom-checkbox">{checked && <Check size={11} strokeWidth={3} />}</span>
                          <span>{opt.label}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
                {!isLuggageView && !isBagsView && (
                  <div className="dropdown-divider" />
                )}
                {(!isLuggageView && !isBagsView) || base.department === "accessories" ? (
                  <div className="dropdown-section">
                    {!base.department && <p className="dropdown-group-title">Accessories</p>}
                    {filterOptions.categories.accessories.map((opt) => {
                      const checked = filters.category === opt.value;
                      return (
                        <label key={opt.value} className="dropdown-checkbox-label">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              change("category", checked ? "" : opt.value);
                              setActiveDropdown(null);
                            }}
                          />
                          <span className="custom-checkbox">{checked && <Check size={11} strokeWidth={3} />}</span>
                          <span>{opt.label}</span>
                        </label>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* SUB-CATEGORY */}
          {!base.category && filterOptions.subCategories.length > 1 && <div className="rimowa-filter-item">
            <button
              type="button"
              className={`rimowa-filter-btn ${activeDropdown === "sub-category" ? "open" : ""} ${filters.subCategory ? "has-val" : ""}`}
              onClick={() => setActiveDropdown(activeDropdown === "sub-category" ? null : "sub-category")}
              aria-expanded={activeDropdown === "sub-category"}
            >
              <span>Sub-category</span>
              {activeDropdown === "sub-category" ? <ChevronUp size={13} strokeWidth={2} /> : <ChevronDown size={13} strokeWidth={2} />}
            </button>
            {activeDropdown === "sub-category" && (
              <div className="rimowa-dropdown">
                {filterOptions.subCategories.map((opt) => {
                  const checked = canonicalCategory(filters.subCategory || filters.subcategory || "") === canonicalCategory(opt.value);
                  return (
                    <label key={opt.value} className="dropdown-checkbox-label">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          change("subCategory", checked ? "" : opt.value);
                          setActiveDropdown(null);
                        }}
                      />
                      <span className="custom-checkbox">{checked && <Check size={11} strokeWidth={3} />}</span>
                      <span>{opt.label}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          }

          {/* COLOUR */}
          <div className="rimowa-filter-item">
            <button
              type="button"
              className={`rimowa-filter-btn ${activeDropdown === "colour" ? "open" : ""} ${filters.color ? "has-val" : ""}`}
              onClick={() => setActiveDropdown(activeDropdown === "colour" ? null : "colour")}
              aria-expanded={activeDropdown === "colour"}
            >
              <span>Colour</span>
              {activeDropdown === "colour" ? <ChevronUp size={13} strokeWidth={2} /> : <ChevronDown size={13} strokeWidth={2} />}
            </button>
            {activeDropdown === "colour" && (
              <div className="rimowa-dropdown rimowa-dropdown-colors">
                <div className="colors-grid">
                  {filterOptions.colors.map((c) => {
                    const checked = filters.color === c.value;
                    return (
                      <button
                        type="button"
                        key={c.value}
                        className={`color-swatch-item ${checked ? "selected" : ""}`}
                        onClick={() => {
                          change("color", checked ? "" : c.value);
                          setActiveDropdown(null);
                        }}
                      >
                        <span className="color-swatch-box" style={{ backgroundColor: c.hex }} />
                        <span className="color-swatch-name">{c.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* MATERIAL */}
          <div className="rimowa-filter-item">
            <button
              type="button"
              className={`rimowa-filter-btn ${activeDropdown === "material" ? "open" : ""} ${filters.material ? "has-val" : ""}`}
              onClick={() => setActiveDropdown(activeDropdown === "material" ? null : "material")}
              aria-expanded={activeDropdown === "material"}
            >
              <span>Material</span>
              {activeDropdown === "material" ? <ChevronUp size={13} strokeWidth={2} /> : <ChevronDown size={13} strokeWidth={2} />}
            </button>
            {activeDropdown === "material" && (
              <div className="rimowa-dropdown">
                {filterOptions.materials.map((m) => {
                  const checked = filters.material?.toLowerCase() === m.value.toLowerCase();
                  return (
                    <label key={m.value} className="dropdown-checkbox-label">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          change("material", checked ? "" : m.value);
                          setActiveDropdown(null);
                        }}
                      />
                      <span className="custom-checkbox">{checked && <Check size={11} strokeWidth={3} />}</span>
                      <span>{m.label}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* COLLECTION */}
          <div className="rimowa-filter-item">
            <button
              type="button"
              className={`rimowa-filter-btn ${activeDropdown === "collection" ? "open" : ""} ${filters.collection ? "has-val" : ""}`}
              onClick={() => setActiveDropdown(activeDropdown === "collection" ? null : "collection")}
              aria-expanded={activeDropdown === "collection"}
            >
              <span>Collection</span>
              {activeDropdown === "collection" ? <ChevronUp size={13} strokeWidth={2} /> : <ChevronDown size={13} strokeWidth={2} />}
            </button>
            {activeDropdown === "collection" && (
              <div className="rimowa-dropdown">
                {filterOptions.collections.map((col) => {
                  const checked = filters.collection?.toLowerCase() === col.value.toLowerCase();
                  return (
                    <label key={col.value} className="dropdown-checkbox-label">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          change("collection", checked ? "" : col.value);
                          setActiveDropdown(null);
                        }}
                      />
                      <span className="custom-checkbox">{checked && <Check size={11} strokeWidth={3} />}</span>
                      <span>{col.label}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: COUNT & SORT BY */}
        <div className="rimowa-filter-right">
          <span className="rimowa-products-count">{displayedTotal} products</span>
          <div className="rimowa-filter-item">
            <button
              type="button"
              className={`rimowa-filter-btn ${activeDropdown === "sort" ? "open" : ""}`}
              onClick={() => setActiveDropdown(activeDropdown === "sort" ? null : "sort")}
              aria-expanded={activeDropdown === "sort"}
            >
              <span>Sort by</span>
              {activeDropdown === "sort" ? <ChevronUp size={13} strokeWidth={2} /> : <ChevronDown size={13} strokeWidth={2} />}
            </button>
            {activeDropdown === "sort" && (
              <div className="rimowa-dropdown rimowa-dropdown-right">
                {filterOptions.sorts.map((s) => {
                  const selected = (filters.sort || "") === s.value;
                  return (
                    <button
                      type="button"
                      key={s.label}
                      className={`dropdown-sort-item ${selected ? "selected" : ""}`}
                      onClick={() => {
                        change("sort", s.value);
                        setActiveDropdown(null);
                      }}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      {active.length > 0 && (
        <div className="filter-chips">
          {active.map((k) => (
            <button key={k} onClick={() => change(k, "")}>
              {params.get(k)}
              <X size={14} />
              <span className="sr-only">Remove filter</span>
            </button>
          ))}
          <button
            onClick={() => {
              const next = new URLSearchParams(params);
              active.forEach((k) => next.delete(k));
              next.delete("page");
              router.push(`${pathname}?${next}`);
            }}
          >
            Clear all
          </button>
        </div>
      )}
      {displayedItems.length ? (
        <div className="product-grid" aria-busy={pending}>
          {displayedItems.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>A little more room to explore.</h2>
          <p>
            No pieces match this selection. Try another search or clear your
            filters.
          </p>
          <button className="button dark" onClick={() => router.push(pathname)}>
            Reset selection
          </button>
        </div>
      )}
      {pages > 1 && (
        <nav aria-label="Product pages" className="pagination">
          <button
            disabled={page === 1}
            onClick={() => change("page", String(page - 1))}
            aria-label="Previous page"
          >
            <ArrowLeft size={18} />
          </button>
          <span>
            Page {page} of {pages}
          </span>
          <button
            disabled={page === pages}
            onClick={() => change("page", String(page + 1))}
            aria-label="Next page"
          >
            <ArrowRight size={18} />
          </button>
        </nav>
      )}
    </div>
  );
}
