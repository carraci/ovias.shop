"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { usePreferences } from "./preferences";
import { markets, countryLocale, type Currency } from "@/lib/markets";

export interface RegionCountry {
  name: string;
  code: string;
  currency?: Currency;
  hasShopping: boolean;
}

export interface RegionGroup {
  region: string;
  countries: RegionCountry[];
}

export const regionGroups: RegionGroup[] = [
  {
    region: "ASIA (COUNTRY/REGION)",
    countries: [
      { name: "Australia", code: "AU", currency: "AUD", hasShopping: true },
      { name: "China Mainland", code: "CN", hasShopping: false },
      { name: "Hong Kong SAR", code: "HK", hasShopping: false },
      { name: "India", code: "IN", currency: "INR", hasShopping: true },
      { name: "Japan", code: "JP", currency: "JPY", hasShopping: true },
      { name: "Korea", code: "KR", hasShopping: true },
      { name: "Macau SAR", code: "MO", hasShopping: false },
      { name: "Malaysia", code: "MY", hasShopping: false },
      { name: "Singapore", code: "SG", hasShopping: true },
      { name: "Taiwan region", code: "TW", hasShopping: false },
      { name: "Thailand", code: "TH", hasShopping: false },
    ],
  },
  {
    region: "EUROPE",
    countries: [
      { name: "Andorra", code: "AD", hasShopping: false },
      { name: "Austria", code: "AT", currency: "EUR", hasShopping: true },
      { name: "Belgium", code: "BE", currency: "EUR", hasShopping: true },
      { name: "Croatia", code: "HR", currency: "EUR", hasShopping: true },
      { name: "Cyprus", code: "CY", currency: "EUR", hasShopping: true },
      { name: "Czech Republic", code: "CZ", hasShopping: true },
      { name: "Denmark", code: "DK", hasShopping: true },
      { name: "Estonia", code: "EE", currency: "EUR", hasShopping: true },
      { name: "Finland", code: "FI", currency: "EUR", hasShopping: true },
      { name: "France", code: "FR", currency: "EUR", hasShopping: true },
      { name: "Germany", code: "DE", currency: "EUR", hasShopping: true },
      { name: "Greece", code: "GR", currency: "EUR", hasShopping: true },
      { name: "Hungary", code: "HU", hasShopping: true },
      { name: "Ireland", code: "IE", currency: "EUR", hasShopping: true },
      { name: "Italy", code: "IT", currency: "EUR", hasShopping: true },
      { name: "Latvia", code: "LV", currency: "EUR", hasShopping: true },
      { name: "Liechtenstein", code: "LI", hasShopping: true },
      { name: "Lithuania", code: "LT", currency: "EUR", hasShopping: true },
      { name: "Luxembourg", code: "LU", currency: "EUR", hasShopping: true },
      { name: "Malta", code: "MT", currency: "EUR", hasShopping: true },
      { name: "Monaco", code: "MC", currency: "EUR", hasShopping: true },
      { name: "Netherlands", code: "NL", currency: "EUR", hasShopping: true },
      { name: "Norway", code: "NO", hasShopping: true },
      { name: "Poland", code: "PL", hasShopping: true },
      { name: "Portugal", code: "PT", currency: "EUR", hasShopping: true },
      { name: "Romania", code: "RO", hasShopping: true },
      { name: "Slovakia", code: "SK", currency: "EUR", hasShopping: true },
      { name: "Slovenia", code: "SI", currency: "EUR", hasShopping: true },
      { name: "Spain", code: "ES", currency: "EUR", hasShopping: true },
      { name: "Sweden", code: "SE", hasShopping: true },
      { name: "Switzerland", code: "CH", hasShopping: true },
      { name: "United Kingdom", code: "GB", currency: "GBP", hasShopping: true },
    ],
  },
  {
    region: "AMERICAS",
    countries: [
      { name: "United States", code: "US", currency: "USD", hasShopping: true },
      { name: "Brazil", code: "BR", hasShopping: true },
      { name: "Canada", code: "CA", currency: "CAD", hasShopping: true },
      { name: "Mexico", code: "MX", hasShopping: true },
    ],
  },
  {
    region: "MIDDLE-EAST",
    countries: [
      { name: "Kuwait", code: "KW", hasShopping: false },
      { name: "Lebanon", code: "LB", hasShopping: false },
      { name: "Qatar", code: "QA", hasShopping: false },
      { name: "Saudi Arabia", code: "SA", hasShopping: false },
      { name: "Turkey", code: "TR", hasShopping: false },
      { name: "United Arab Emirates", code: "AE", currency: "AED", hasShopping: true },
    ],
  },
];

interface CountryRegionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CountryRegionModal({ isOpen, onClose }: CountryRegionModalProps) {
  const { preferences, setPreferences } = usePreferences();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelectCountry = async (country: RegionCountry) => {
    if(saving) return;
    setSaving(true);setSaveError("");
    const next = {...preferences, country:country.code, locale:countryLocale(country.code), currency:markets.find(m => m.code === country.code)?.currency || country.currency || "INR"};
    try {
      const response = await fetch("/api/v1/preferences",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...next,remember:true})});
      if(!response.ok) throw new Error("Unable to save country selection. Please try again.");
      setPreferences(next);onClose();
    } catch(error) {setSaveError((error as Error).message);} finally {setSaving(false);}
  };

  return (
    <div className="crm-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="crm-container"
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          className="crm-close-btn"
          onClick={onClose}
          aria-label="Close country and region selector"
        >
          <X size={20} strokeWidth={1.5} />
        </button>

        {/* Modal Header */}
        <div className="crm-header">
          {saveError && <p role="alert">{saveError}</p>}
          {saving && <p role="status">Saving country selection…</p>}
          <h2 className="crm-title">Please select your country / region</h2>
          <p className="crm-notice">
            Be advised that your country selection changes display currency. Your shopping bag is preserved.
          </p>
          <p className="crm-legend">
            * Unfortunately, we do not currently offer online shopping in these locations.
          </p>
        </div>

        {/* Modal Grid of Regions */}
        <div className="crm-grid">
          {regionGroups.map((group) => {
            const isEurope = group.region === "EUROPE";
            return (
              <div
                key={group.region}
                className={`crm-region-block ${isEurope ? "crm-region-europe" : ""}`}
              >
                <h3 className="crm-region-title">{group.region}</h3>
                <div className={`crm-country-list ${isEurope ? "crm-europe-columns" : ""}`}>
                  {group.countries.map((country) => {
                    const isSelected = preferences.country === country.code;
                    return (
                      <button
                        key={country.name}
                        type="button"
                        onClick={() => handleSelectCountry(country)}
                        className={`crm-country-item ${isSelected ? "crm-selected" : ""}`}
                      >
                        <span className="crm-country-icon-col">
                          {country.hasShopping ? (
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 16 16"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              className="crm-shopping-bag-icon"
                              aria-hidden="true"
                            >
                              <path d="M2.5 5.5h11l-1 9h-9l-1-9z" />
                              <path d="M5.5 5.5v-2a2.5 2.5 0 0 1 5 0v2" />
                            </svg>
                          ) : (
                            <span className="crm-asterisk" aria-hidden="true">*</span>
                          )}
                        </span>
                        <span className="crm-country-name">{country.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="crm-footer-note">
          Other countries: <a href="https://ovia.com" className="crm-global-link">global website</a>
        </div>
      </div>
    </div>
  );
}
