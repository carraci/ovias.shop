"use client";
import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { store, directionsUrl } from "@/lib/stores";
export function StoreMap() {
  const host = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let disposed = false;
    let map: import("leaflet").Map | undefined;
    let observer: ResizeObserver | undefined;
    import("leaflet")
      .then((L) => {
        if (disposed || !host.current) return;
        map = L.map(host.current, { scrollWheelZoom: false }).setView(
          [store.latitude, store.longitude],
          14,
        );
        const tiles = L.tileLayer(
          "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
          {
            maxZoom: 19,
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          },
        ).addTo(map);
        tiles.on("tileerror", () => {
          if (!disposed) setFailed(true);
        });
        L.circle([store.latitude, store.longitude], {
          radius: 450,
          color: "#334636",
          fillOpacity: 0.18,
        })
          .addTo(map)
          .bindPopup("OVIA · Achole Road area. Approximate location.");
        observer = new ResizeObserver(() => map?.invalidateSize());
        observer.observe(host.current);
      })
      .catch(() => {
        if (!disposed) setFailed(true);
      });
    return () => {
      disposed = true;
      observer?.disconnect();
      map?.remove();
    };
  }, []);
  return (
    <div className="store-map-wrap">
      <div
        ref={host}
        className="store-map"
        role="region"
        aria-label="Map of the Achole Road area"
      />
      {failed && (
        <p className="map-fallback" role="status">
          Map tiles unavailable.{" "}
          <a href={directionsUrl} target="_blank" rel="noreferrer">
            Open directions
          </a>
        </p>
      )}
      <p className="map-caption">
        The circle shows the approximate Achole Road area. Use the full address
        for directions.
      </p>
    </div>
  );
}
