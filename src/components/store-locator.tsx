"use client";
import { useState } from "react";
import { MapPin, ArrowUpRight, Search } from "lucide-react";
import { store, directionsUrl, matchesStore } from "@/lib/stores";
import { StoreMap } from "./store-map";
export function StoreLocator() {
  const [query, setQuery] = useState("");
  const found = matchesStore(query);
  return (
    <section className="section locator-page">
      <p className="eyebrow">COME FIND US</p>
      <h1>
        A little closer to <em>your journey.</em>
      </h1>
      <p className="locator-intro">
        Find OVIA in Nalasopara East, Maharashtra.
      </p>
      <div className="locator-layout">
        <div className="store-directory">
          <label htmlFor="store-search">Search city, area or postcode</label>
          <div className="store-search">
            <Search size={20} />
            <input
              id="store-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Try Nalasopara or 401209"
            />
          </div>
          <p className="store-count" aria-live="polite">
            {found ? "1 location" : "No matching locations"}
          </p>
          {found ? (
            <article className="store-result">
              <MapPin size={25} />
              <p className="eyebrow">MAHARASHTRA / INDIA</p>
              <h2>{store.name}</h2>
              <address>{store.address}</address>
              <a
                className="button"
                href={directionsUrl}
                target="_blank"
                rel="noreferrer"
              >
                Get directions <ArrowUpRight size={18} />
              </a>
              <p className="store-hours">
                Opening hours and contact details will be added when available.
              </p>
            </article>
          ) : (
            <div className="store-empty">
              <h2>No stores found.</h2>
              <p>Try Nalasopara, Vasai-Virar or 401209.</p>
              <button className="text-link" onClick={() => setQuery("")}>
                Show all locations
              </button>
            </div>
          )}
        </div>
        {found ? (
          <StoreMap />
        ) : (
          <div className="store-map-empty">
            <MapPin size={40} />
            <p>Search again to see the location on the map.</p>
          </div>
        )}
      </div>
    </section>
  );
}
