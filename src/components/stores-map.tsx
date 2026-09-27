"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { OviaStore, getDirectionsUrl } from "@/lib/stores";

interface StoresMapProps {
  stores: OviaStore[];
  selectedStore: OviaStore | null;
  onSelectStore: (store: OviaStore) => void;
  userCoords: { lat: number; lng: number } | null;
  className?: string;
}

export function StoresMap({
  stores,
  selectedStore,
  onSelectStore,
  userCoords,
  className = "",
}: StoresMapProps) {
  const host = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markersRef = useRef<Map<string, import("leaflet").Marker>>(new Map());
  const userMarkerRef = useRef<import("leaflet").Marker | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [failed, setFailed] = useState(false);

  // Initialize Map
  useEffect(() => {
    let disposed = false;
    let observer: ResizeObserver | undefined;

    import("leaflet")
      .then((L) => {
        if (disposed || !host.current) return;

        // Default center: India overview
        const map = L.map(host.current, {
          scrollWheelZoom: true,
          zoomControl: false,
        }).setView([20.5937, 78.9629], 5);

        // Luxury Zoom Control top-right
        L.control.zoom({ position: "topright" }).addTo(map);

        // Standard OpenStreetMap tiles as requested
        const tiles = L.tileLayer(
          "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
          {
            maxZoom: 19,
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          }
        ).addTo(map);

        tiles.on("tileerror", () => {
          if (!disposed) setFailed(true);
        });

        mapRef.current = map;
        setMapReady(true);

        setTimeout(() => map.invalidateSize(), 150);
        setTimeout(() => map.invalidateSize(), 600);

        observer = new ResizeObserver(() => {
          map.invalidateSize();
        });
        observer.observe(host.current);
      })
      .catch(() => {
        if (!disposed) setFailed(true);
      });

    return () => {
      disposed = true;
      observer?.disconnect();
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Update Store Markers
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    import("leaflet").then((L) => {
      const map = mapRef.current;
      if (!map) return;

      // Clear existing markers
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current.clear();

      stores.forEach((s) => {
        const isSelected = selectedStore?.id === s.id;

        const customIcon = L.divIcon({
          className: "ovia-map-marker-wrapper",
          html: `
            <div class="ovia-custom-marker ${isSelected ? "is-active" : ""}">
              <div class="ovia-marker-core">
                <span class="ovia-marker-dot"></span>
              </div>
              <span class="ovia-marker-tag">${s.city}</span>
            </div>
          `,
          iconSize: [36, 44],
          iconAnchor: [18, 22],
        });

        const marker = L.marker([s.latitude, s.longitude], { icon: customIcon })
          .addTo(map)
          .on("click", () => {
            onSelectStore(s);
          });

        markersRef.current.set(s.id, marker);
      });

      // Fit bounds if no specific store selected and multiple stores exist
      if (!selectedStore && stores.length > 0) {
        const bounds = L.latLngBounds(stores.map((s) => [s.latitude, s.longitude]));
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
      }
    });
  }, [mapReady, stores, selectedStore, onSelectStore]);

  // Pan / Fly to selected store
  useEffect(() => {
    if (!mapReady || !mapRef.current || !selectedStore) return;
    mapRef.current.flyTo([selectedStore.latitude, selectedStore.longitude], 14, {
      duration: 1.2,
      easeLinearity: 0.25,
    });
  }, [mapReady, selectedStore]);

  // Handle User Geolocation Marker
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    import("leaflet").then((L) => {
      const map = mapRef.current;
      if (!map) return;

      if (userCoords) {
        if (!userMarkerRef.current) {
          const userIcon = L.divIcon({
            className: "ovia-user-location-marker",
            html: `
              <div class="user-pulse-marker">
                <div class="user-pulse-ring"></div>
                <div class="user-dot"></div>
              </div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          });

          userMarkerRef.current = L.marker([userCoords.lat, userCoords.lng], {
            icon: userIcon,
            zIndexOffset: 1000,
          }).addTo(map);
          userMarkerRef.current.bindPopup("<strong>Your Location</strong>");
        } else {
          userMarkerRef.current.setLatLng([userCoords.lat, userCoords.lng]);
        }
      } else if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
    });
  }, [mapReady, userCoords]);

  return (
    <div className={`ovia-stores-map-container ${className}`}>
      <div
        ref={host}
        className="ovia-leaflet-host"
        role="region"
        aria-label="Interactive map of OVIA store locations in India"
      />
      {failed && (
        <div className="ovia-map-error-state">
          <p>Unable to load interactive map tiles.</p>
          {selectedStore && (
            <a
              href={getDirectionsUrl(selectedStore)}
              target="_blank"
              rel="noreferrer"
              className="text-link"
            >
              Open {selectedStore.name} in Google Maps
            </a>
          )}
        </div>
      )}
    </div>
  );
}
