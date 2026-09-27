"use client";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useTransition, useEffect, useRef } from "react";
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
import {
  filterProducts,
  groups,
  slugify,
  type Filters,
  type Product,
  type Department,
} from "@/lib/catalog";
import { ProductCard } from "./product-card";

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
    title: "Check-In Luggage",
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
    alt: "Large Trunk Luggage",
    title: "Large Trunk Luggage",
    subtitle: "Expansive travel capacity engineered for life's longest horizons.",
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
    subtitle: "The most sought-after OVIA luggage icons, celebrated by travellers worldwide.",
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
  "duffle-bags": {
    image: "/media/editorial-bags.jpg",
    alt: "Duffle Bags",
    title: "Duffle Bags",
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
    image: "/media/accessories-hero-full.jpg",
    alt: "OVIA Accessories",
    title: "All Accessories",
    subtitle: "Thoughtfully designed accessories to make every journey smoother, more organised and more personal.",
  },
  "all-accessories": {
    image: "/media/accessories-hero-full.jpg",
    alt: "OVIA Accessories",
    title: "All Accessories",
    subtitle: "Thoughtfully designed accessories to make every journey smoother, more organised and more personal.",
  },
};


const filterOptions = {
  categories: {
    luggage: [
      { label: "All Luggage", value: "" },
      { label: "Cabin", value: "cabin" },
      { label: "Check-In", value: "check-in" },
      { label: "Trunk", value: "trunk" },
      { label: "Short Trips", value: "short-trips" },
      { label: "Long Journeys", value: "long-journeys" },
      { label: "Business Selection", value: "business-selection" },
      { label: "Best Sellers", value: "best-sellers" },
      { label: "New Arrivals", value: "new-arrivals" },
      { label: "Emblematic pieces", value: "emblematic-pieces" },
    ],
    bags: [
      { label: "All Bags", value: "" },
      { label: "Backpack", value: "backpacks" },
      { label: "Duffle Bag", value: "duffle-bags" },
      { label: "Briefcase", value: "briefcases" },
      { label: "Crossbody", value: "crossbodies" },
      { label: "Tote", value: "totes" },
      { label: "Shoulder Bag", value: "shoulder-bags" },
      { label: "Hand Carry", value: "hand-carry" },
    ],
    accessories: [
      { label: "All Accessories", value: "" },
      { label: "Customisation", value: "customisation" },
      { label: "iPhone Cases", value: "iphone-cases" },
      { label: "Hats", value: "hats" },
      { label: "Sunglasses", value: "sunglasses" },
      { label: "Belts", value: "belts" },
      { label: "Card Holders", value: "card-holders" },
      { label: "Address Tags", value: "address-tags" },
      { label: "Wheels", value: "wheels" },
      { label: "Stickers", value: "stickers" },
      { label: "Bag Straps", value: "bag-straps" },
      { label: "Organisers", value: "organisers" },
    ],
  },
  subCategories: [
    { label: "Organisers", value: "organisers" },
    { label: "Flap Backpack", value: "flap" },
    { label: "Zipped Backpack", value: "zipped" },
    { label: "Harness Backpack", value: "harness" },
  ],
  colors: [
    { label: "Black", value: "Black", hex: "#1a1a1a" },
    { label: "Silver", value: "Silver", hex: "#bec1bd" },
    { label: "Titanium", value: "Titanium", hex: "#a69f93" },
    { label: "White", value: "Gloss White", hex: "#f0f0f0" },
    { label: "Green", value: "Emerald Green", hex: "#1e3d34" },
    { label: "Grey", value: "Slate Grey", hex: "#5a6368" },
    { label: "Orange", value: "Papaya Orange", hex: "#e86130" },
    { label: "Blue", value: "Matte Blue", hex: "#263f59" },
    { label: "Red", value: "Gloss Red", hex: "#aa1923" },
    { label: "Brown", value: "Brown", hex: "#5a4231" },
  ],
  materials: [
    { label: "Aluminium", value: "Aluminium" },
    { label: "Canvas", value: "Canvas" },
    { label: "Leather", value: "Leather" },
    { label: "Nylon", value: "Nylon" },
    { label: "Polycarbonate", value: "Polycarbonate" },
  ],
  collections: [
    { label: "Classic", value: "Classic" },
    { label: "Essential", value: "Essential" },
    { label: "Hybrid", value: "Hybrid" },
    { label: "Original", value: "Original" },
    { label: "Never Still", value: "Never Still" },
    { label: "Personal", value: "Personal" },
    { label: "Groove", value: "Groove" },
    { label: "Attaché", value: "Attaché" },
  ],
  sorts: [
    { label: "Featured", value: "" },
    { label: "Price: low to high", value: "price-asc" },
    { label: "Price: high to low", value: "price-desc" },
    { label: "Name", value: "name" },
  ],
};

export function CatalogView({
  products,
  title,
  description,
  base = {},
  search = false,
}: {
  products: Product[];
  title: string;
  description: string;
  base?: Filters;
  search?: boolean;
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

  const filters = {
    ...Object.fromEntries(params),
    ...Object.fromEntries(
      Object.entries(base).filter(([, value]) => value !== undefined),
    ),
  };
  const { items, total, page, pages } = filterProducts(products, filters);
  const active = ["category", "subCategory", "material", "color", "collection"].filter((k) =>
    params.has(k),
  );
  function change(key: string, value: string) {
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
    (base.department && !filters.category && !filters.subcategory ? base.department : "") ||
    slugify(title)
  ).toLowerCase();

  const isBagsOverview =
    (base.department === "bags" || currentCategoryKey === "bags") &&
    !base.category &&
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

  const banner = !isBagsOverview
    ? categoryBanners[currentCategoryKey] ||
      (currentCategoryKey.includes("trunk") ? categoryBanners["trunk"] : null) ||
      (currentCategoryKey.includes("cabin") ? categoryBanners["cabin"] : null) ||
      (currentCategoryKey.includes("check") ? categoryBanners["check-in"] : null) ||
      (currentCategoryKey.includes("backpack") ? categoryBanners["backpacks"] : null) ||
      (isLuggageView ? categoryBanners["luggage"] : null) ||
      (isBagsView ? categoryBanners["bags"] : null)
    : null;

  // Dynamic API Fetching
  const [apiItems, setApiItems] = useState<Product[] | null>(null);
  const [apiTotal, setApiTotal] = useState<number | null>(null);

  useEffect(() => {
    let activeFetch = true;
    const q = new URLSearchParams(params);
    if (base.department) q.set("department", base.department);
    if (base.category && !q.has("category")) q.set("category", base.category);
    if (base.subcategory && !q.has("subcategory")) q.set("subcategory", base.subcategory);
    if (base.tag && !q.has("tag")) q.set("tag", base.tag);
    if (base.material && !q.has("material")) q.set("material", base.material);
    if (base.color && !q.has("color")) q.set("color", base.color);

    fetch(`/api/products?${q.toString()}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (activeFetch && data && Array.isArray(data.items)) {
          setApiItems(data.items);
          if (typeof data.total === "number") setApiTotal(data.total);
        }
      })
      .catch(() => {});

    return () => {
      activeFetch = false;
    };
  }, [pathname, params, base.department, base.category, base.subcategory, base.tag, base.material, base.color]);

  const displayedItems = apiItems || items;
  const displayedTotal = apiTotal !== null ? apiTotal : total;

  return (
    <div className="catalog-page section">
      <div className="breadcrumb">
        Home / {isBagsOverview ? "Bags" : currentCategoryKey.includes("trunk") ? "Trunk" : title}
      </div>
      {isBagsOverview ? (
        <div className="bags-overview-catalog-header">
          <h2 className="bags-overview-catalog-title">All Bags</h2>
          <span className="bags-overview-catalog-count">{displayedTotal} pieces</span>
        </div>
      ) : banner ? (
        <div className="category-hero-banner">
          <Image
            src={banner.image}
            alt={banner.alt}
            fill
            priority
            quality={95}
            sizes="100vw"
            className="category-hero-img"
          />
          <div className="category-hero-overlay" />
          <div className="category-hero-content">
            {banner.hasTitle ? (
              <h1 className="sr-only">{banner.title || title}</h1>
            ) : (
              <h1 className="category-hero-title">{banner.title || title}</h1>
            )}
            {banner.subtitle && (
              <p className="category-hero-subtitle">{banner.subtitle}</p>
            )}
          </div>
        </div>
      ) : (
        <div className="catalog-heading">
          <p className="eyebrow">THE OVIA COLLECTION</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
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
                )}
                {!isBagsView && !isLuggageView && base.department !== "accessories" && (
                  <div className="dropdown-divider" />
                )}
                {!isLuggageView && base.department !== "accessories" && (
                  <div className="dropdown-section">
                    {!base.department && <p className="dropdown-group-title">Bags</p>}
                    {filterOptions.categories.bags.map((opt) => {
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
          <div className="rimowa-filter-item">
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
                  const checked = filters.subCategory === opt.value;
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
