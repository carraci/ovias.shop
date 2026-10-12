"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Search,
  Crosshair,
  MapPin,
  Clock,
  ArrowUpRight,
  X,
  Navigation,
} from "lucide-react";
import {
  stores,
  OviaStore,
  calculateDistanceKm,
  getDirectionsUrl,
} from "@/lib/stores";
import { StoresMap } from "./stores-map";

interface StoreWithDistance extends OviaStore {
  distanceKm?: number;
}

export function StoresLocator() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStore, setSelectedStore] = useState<OviaStore | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "map">("list");

  const listContainerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<string, HTMLElement>>(new Map());

  // Geolocation handler
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser. Please search by city or PIN code.");
      return;
    }

    setGeoLoading(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserCoords(coords);
        setGeoLoading(false);
      },
      (error) => {
        setGeoLoading(false);
        if (error.code === error.PERMISSION_DENIED) {
          setGeoError("Location access is unavailable. Search by city or PIN code instead.");
        } else {
          setGeoError("Could not retrieve your location. Search by city or PIN code instead.");
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setGeoError(null);
  };

  // Filter and sort stores
  const filteredStores: StoreWithDistance[] = useMemo(() => {
    let result = stores.map((s) => {
      let distanceKm: number | undefined = undefined;
      if (userCoords) {
        distanceKm = calculateDistanceKm(
          userCoords.lat,
          userCoords.lng,
          s.latitude,
          s.longitude
        );
      }
      return { ...s, distanceKm };
    });

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().replace(/[^a-z0-9]/g, "");
      result = result.filter((s) => {
        const target = `${s.name} ${s.address} ${s.city} ${s.state} ${s.area} ${s.postalCode} India`
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "");
        return target.includes(q);
      });
    }

    // Sort by distance if user coords are present
    if (userCoords) {
      result.sort((a, b) => (a.distanceKm ?? 99999) - (b.distanceKm ?? 99999));
    }

    return result;
  }, [searchQuery, userCoords]);

  // Scroll active card into view when selected from map
  const handleSelectStore = (store: OviaStore) => {
    setSelectedStore(store);
    const cardEl = cardRefs.current.get(store.id);
    if (cardEl && listContainerRef.current) {
      cardEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  return (
    <div className="ovia-stores-page-root">
      {/* 1. Header Section */}
      <header className="ovia-stores-header">
        <div className="ovia-stores-header-inner">
          <p className="ovia-stores-eyebrow">FIND AN OVIA STORE</p>
          <h1 className="ovia-stores-title">
            Discover OVIA stores and explore our collections, services and travel pieces in person.
          </h1>

          {/* Search & Location Bar */}
          <div className="ovia-stores-search-wrapper">
            <div className="ovia-stores-search-input-box">
              <Search size={18} className="ovia-search-icon" />
              <input
                type="search"
                placeholder="City, State, Area or PIN Code"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ovia-stores-search-input"
                aria-label="Search OVIA stores"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="ovia-search-clear-btn"
                  aria-label="Clear search"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <div className="ovia-stores-action-controls">
              <button
                type="button"
                onClick={handleUseMyLocation}
                disabled={geoLoading}
                className={`ovia-geolocation-btn ${userCoords ? "is-active" : ""}`}
                aria-label="Use my current location"
              >
                <Crosshair size={16} className={geoLoading ? "spin-icon" : ""} />
                <span>{geoLoading ? "LOCATING..." : "USE MY CURRENT LOCATION"}</span>
              </button>

            </div>
          </div>

          {userCoords && !geoError && (
            <div className="ovia-geo-notice-bar success" role="status">
              <Navigation size={14} />
              <span>Sorted by closest proximity to your location in India.</span>
            </div>
          )}

          {/* Mobile Tab Switcher */}
          <div className="ovia-stores-mobile-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mobileView === "list"}
              onClick={() => setMobileView("list")}
              className={`ovia-tab-btn ${mobileView === "list" ? "active" : ""}`}
            >
              LIST ({filteredStores.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mobileView === "map"}
              onClick={() => setMobileView("map")}
              className={`ovia-tab-btn ${mobileView === "map" ? "active" : ""}`}
            >
              MAP
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Two-Column Viewport */}
      <div className="ovia-stores-body-grid">
        {/* Left Side: Store List */}
        <div
          ref={listContainerRef}
          className={`ovia-stores-list-column ${mobileView === "map" ? "hide-on-mobile" : ""}`}
        >
          <div className="ovia-stores-list-meta-bar">
            <span className="ovia-stores-count">
              {filteredStores.length} {filteredStores.length === 1 ? "STORE" : "STORES"} IN INDIA
            </span>
            <span className="ovia-demo-pill">DEMO DATA</span>
          </div>

          {filteredStores.length === 0 ? (
            <div className="ovia-stores-empty-state">
              <MapPin size={38} strokeWidth={1.2} />
              <h3 className="ovia-empty-title">NO OVIA STORES FOUND</h3>
              <p className="ovia-empty-desc">
                We couldn&apos;t find a store matching your search. Please check your spelling or search by another city or PIN code.
              </p>
              <button
                type="button"
                onClick={clearAllFilters}
                className="ovia-empty-clear-btn"
              >
                CLEAR SEARCH
              </button>
            </div>
          ) : (
            <div className="ovia-stores-cards-stack">
              {filteredStores.map((s) => {
                const isSelected = selectedStore?.id === s.id;
                return (
                  <article
                    key={s.id}
                    ref={(el) => {
                      if (el) cardRefs.current.set(s.id, el);
                    }}
                    onClick={() => handleSelectStore(s)}
                    className={`ovia-store-card ${isSelected ? "is-active" : ""}`}
                  >
                    <div className="ovia-store-card-header">
                      <div>
                        <h2 className="ovia-store-card-name">{s.name.toUpperCase()}</h2>
                        <p className="ovia-store-card-location">
                          {s.area}, {s.city}, {s.state}, India
                        </p>
                      </div>

                      {s.distanceKm !== undefined && (
                        <div className="ovia-store-distance-badge">
                          <Navigation size={12} />
                          <span>{s.distanceKm} km away</span>
                        </div>
                      )}
                    </div>

                    <div className="ovia-store-card-details">
                      <div className="ovia-store-hours-row">
                        <Clock size={14} />
                        <span>Open today {s.todayHours}</span>
                      </div>

                      <div className="ovia-store-services-row">
                        <span>{s.services.slice(0, 4).join(" • ")}</span>
                        {s.services.length > 4 && (
                          <span className="ovia-services-more"> +{s.services.length - 4} more</span>
                        )}
                      </div>
                    </div>

                    <div className="ovia-store-card-actions">
                      <Link
                        href={`/stores/${s.slug}`}
                        className="ovia-card-btn view-store"
                        onClick={(e) => e.stopPropagation()}
                      >
                        VIEW STORE
                      </Link>

                      <a
                        href={getDirectionsUrl(s)}
                        target="_blank"
                        rel="noreferrer"
                        className="ovia-card-btn directions"
                        onClick={(e) => e.stopPropagation()}
                      >
                        DIRECTIONS <ArrowUpRight size={14} />
                      </a>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectStore(s);
                          if (window.innerWidth <= 768) {
                            setMobileView("map");
                          }
                        }}
                        className="ovia-card-btn view-map"
                      >
                        VIEW ON MAP
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Map */}
        <div className={`ovia-stores-map-column ${mobileView === "list" ? "hide-on-mobile" : ""}`}>
          <StoresMap
            stores={filteredStores}
            selectedStore={selectedStore}
            onSelectStore={(st) => setSelectedStore(st)}
            userCoords={userCoords}
            className="ovia-sticky-map"
          />

          {/* Mobile Bottom Store Preview Card */}
          {selectedStore && mobileView === "map" && (
            <div className="ovia-mobile-active-store-card">
              <div className="ovia-mobile-card-inner">
                <div className="ovia-mobile-card-info">
                  <h3 className="ovia-mobile-store-title">{selectedStore.name}</h3>
                  <p className="ovia-mobile-store-sub">
                    {selectedStore.area}, {selectedStore.city}
                  </p>
                  <p className="ovia-mobile-store-hours">Open today {selectedStore.todayHours}</p>
                </div>
                <div className="ovia-mobile-card-actions">
                  <Link href={`/stores/${selectedStore.slug}`} className="ovia-mobile-view-btn">
                    VIEW STORE
                  </Link>
                  <a
                    href={getDirectionsUrl(selectedStore)}
                    target="_blank"
                    rel="noreferrer"
                    className="ovia-mobile-dir-btn"
                  >
                    DIRECTIONS <ArrowUpRight size={13} />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
