"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { ChevronDown, Check, ArrowRight } from "lucide-react";
import { usePreferences } from "./preferences";
import { languages } from "@/lib/markets";

const CountryRegionModal = dynamic(() => import("./country-region-modal").then(m => m.CountryRegionModal), { ssr: false });

export function FooterNewsletter() {
  const [showInput, setShowInput] = useState(false);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  return !showInput && !subscribed ? (
    <button type="button" onClick={() => setShowInput(true)} className="ovia-newsletter-btn" aria-label="Sign up for newsletter">SIGN UP</button>
  ) : subscribed ? (
    <div className="ovia-newsletter-success"><Check size={14} className="ovia-success-icon" /><span>Thank you for subscribing to OVIA.</span></div>
  ) : (
    <form className="ovia-newsletter-form" onSubmit={e => {
      e.preventDefault();
      if (email && email.includes("@")) {
        setSubscribed(true);
        setTimeout(() => { setEmail(""); setShowInput(false); setSubscribed(false); }, 4000);
      }
    }}>
      <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email" className="ovia-newsletter-input" autoFocus />
      <button type="submit" className="ovia-newsletter-submit-btn" aria-label="Submit email"><ArrowRight size={14} /></button>
    </form>
  );
}

export function FooterRegion() {
  const { preferences, setPreferences } = usePreferences();
  const [open, setOpen] = useState(false);
  return <>
    <div className="ovia-footer-region-picker">
      <button type="button" onClick={() => setOpen(true)} className="ovia-region-link-btn" aria-label="Select Country or Region">
        <span className="ovia-region-label">{preferences.country.toUpperCase()}</span><ChevronDown size={12} className="ovia-region-chevron" />
      </button>
      <span className="ovia-region-divider">|</span>
      <select aria-label="Select Language" value={preferences.locale === "en-IN" ? "en" : preferences.locale} className="ovia-region-link-btn" onChange={async e => {
        const next = { ...preferences, locale: e.target.value };
        const response = await fetch("/api/v1/preferences", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...next, remember: true }) });
        if (response.ok) setPreferences(next);
      }}>
        {languages.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
      </select>
    </div>
    {open && <CountryRegionModal isOpen={open} onClose={() => setOpen(false)} />}
  </>;
}
