"use client";
import "@/components/page-styles/collection-landings.css";


import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Heart } from "lucide-react";
import { useState } from "react";
import { useStore } from "./store-provider";

// ─── DATA ─────────────────────────────────────────────────────────────────────

type CategoryType = "ALL" | "CABIN" | "CHECK-IN" | "TRUNKS" | "TRAVEL BAGS" | "ACCESSORIES";

const filterTabs: CategoryType[] = [
  "ALL",
  "CABIN",
  "CHECK-IN",
  "TRUNKS",
  "TRAVEL BAGS",
  "ACCESSORIES",
];

const newProductsList = [
  {
    id: "horizon-cabin",
    name: "HORIZON CABIN",
    price: "₹1",
    category: "CABIN" as CategoryType,
    image: "/media/new-prod-horizon-cabin.jpg",
    href: "/products/horizon-cabin",
  },
  {
    id: "horizon-checkin",
    name: "HORIZON CHECK-IN",
    price: "₹1",
    category: "CHECK-IN" as CategoryType,
    image: "/media/new-prod-horizon-checkin.jpg",
    href: "/products/horizon-check-in",
  },
  {
    id: "horizon-trunk",
    name: "HORIZON TRUNK",
    price: "₹1",
    category: "TRUNKS" as CategoryType,
    image: "/media/new-prod-horizon-trunk.jpg",
    href: "/products/horizon-trunk",
  },
  {
    id: "travel-duffle",
    name: "TRAVEL DUFFLE",
    price: "₹1",
    category: "TRAVEL BAGS" as CategoryType,
    image: "/media/new-prod-travel-duffle.jpg",
    href: "/products/never-still-leather-duffle-bag-large",
  },
  {
    id: "travel-backpack",
    name: "TRAVEL BACKPACK",
    price: "₹1",
    category: "TRAVEL BAGS" as CategoryType,
    image: "/media/new-prod-travel-backpack.jpg",
    href: "/products/never-still-canvas-flap-backpack-large",
  },
  {
    id: "packing-cube-set",
    name: "PACKING CUBE SET",
    price: "₹1",
    category: "ACCESSORIES" as CategoryType,
    image: "/media/new-prod-packing-cubes.jpg",
    href: "/products/travel-accessories-packing-cubes-set",
  },
  {
    id: "toiletry-pouch",
    name: "TOILETRY POUCH",
    price: "₹1",
    category: "ACCESSORIES" as CategoryType,
    image: "/media/new-prod-toiletry-pouch.jpg",
    href: "/products/never-still-leather-toiletry-bag-black",
  },
  {
    id: "luggage-tag",
    name: "LUGGAGE TAG",
    price: "₹1",
    category: "ACCESSORIES" as CategoryType,
    image: "/media/new-prod-luggage-tag.jpg",
    href: "/products/address-tag-leather-black",
  },
  {
    id: "water-bottle",
    name: "WATER BOTTLE",
    price: "₹1",
    category: "ACCESSORIES" as CategoryType,
    image: "/media/new-prod-water-bottle.jpg",
    href: "/products/travel-accessories-water-bottle-black",
  },
  {
    id: "tech-organiser",
    name: "TECH ORGANISER",
    price: "₹1",
    category: "ACCESSORIES" as CategoryType,
    image: "/media/new-prod-tech-organiser.jpg",
    href: "/products/groove-leather-zipped-pouch-black",
  },
  {
    id: "cabin-plus",
    name: "CABIN PLUS",
    price: "₹1",
    category: "CABIN" as CategoryType,
    image: "/media/new-prod-cabin-plus.jpg",
    href: "/products/horizon-cabin",
  },
  {
    id: "weekend-bag",
    name: "WEEKEND BAG",
    price: "₹1",
    category: "TRAVEL BAGS" as CategoryType,
    image: "/media/new-prod-weekend-bag.jpg",
    href: "/products/never-still-leather-duffle-bag-medium",
  },
];

export function NewArrivalsLanding() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>("ALL");
  const { isWishlisted, toggleWishlist: storeToggleWishlist } = useStore();

  const handleToggleWishlist = (item: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const slug = item.href?.replace(/^\/products\//, "") || item.id;
    const numPrice =
      typeof item.price === "string"
        ? parseInt(item.price.replace(/[^0-9]/g, ""), 10) || 0
        : item.price;
    storeToggleWishlist(item.id || slug, {
      sku: item.id || slug,
      name: item.name,
      color: "Classic",
      slug,
      image: item.image,
      price: numPrice,
      available: true,
    });
  };

  const filteredProducts =
    selectedCategory === "ALL"
      ? newProductsList
      : newProductsList.filter((p) => p.category === selectedCategory);

  return (
    <div className="new-arrivals-landing-page">

      {/* ── 2. LATEST PRODUCTS SECTION WITH FILTER PILLS ── */}
      <section id="latest-products-grid" className="new-content-wrap new-products-section">
        <div className="new-section-header">
          <div>
            <p className="new-section-eyebrow">LATEST</p>
            <h1 className="new-section-title">Latest Products</h1>
          </div>
          <Link href="/new?view=catalog" className="new-header-link">
            VIEW ALL LATEST <ArrowRight size={13} />
          </Link>
        </div>

        {/* Filter Pills */}
        <div className="new-filter-pills" role="tablist" aria-label="Product categories">
          {filterTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={selectedCategory === tab}
              className={`new-filter-pill ${selectedCategory === tab ? "active" : ""}`}
              onClick={() => setSelectedCategory(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* 12-Product 4x3 Grid */}
        <div className="new-products-grid">
          {filteredProducts.map((item) => {
            const isSaved = isWishlisted(item.id) || isWishlisted(item.href?.replace(/^\/products\//, ""));
            return (
              <div key={item.id} className="new-product-card group">
                <Link href={item.href} className="new-product-anchor">
                  <div className="new-product-media">
                    <></>
                    <span className="new-product-badge">NEW</span>
                    <button
                      type="button"
                      className={`new-wishlist-btn ${isSaved ? "active" : ""}`}
                      onClick={(e) => handleToggleWishlist(item, e)}
                      aria-label={isSaved ? "Remove from wishlist" : "Add to wishlist"}
                    >
                      <Heart size={15} fill={isSaved ? "currentColor" : "none"} />
                    </button>
                  </div>
                  <div className="new-product-details">
                    <h3 className="new-product-name">{item.name}</h3>
                    <p className="new-product-price">{item.price}</p>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 3. BOTTOM BANNER: DESIGNED FOR WHAT'S NEXT ── */}
      <section className="new-bottom-banner-section">
        <div className="new-bottom-banner-media">
          <Image
            src="/media/new-bottom-banner.jpg"
            alt="OVIA Latest Collection - Designed for what's next"
            fill
            sizes="100vw"
            className="new-bottom-banner-img"
          />
          <div className="new-bottom-banner-overlay" />
        </div>

        <div className="new-bottom-banner-inner">
          <p className="new-bottom-banner-eyebrow">LATEST COLLECTION</p>
          <h2 className="new-bottom-banner-title">
            Designed<br />
            for what’s next
          </h2>
          <p className="new-bottom-banner-desc">
            Explore the newest luggage and travel essentials,<br />
            created for every kind of journey.
          </p>
          <div className="new-bottom-banner-actions">
            <Link href="/luggage" className="new-btn-primary banner-btn">
              EXPLORE LATEST <ArrowRight size={14} className="new-cta-icon" />
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
