"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import styles from "./campaign-banners.module.css";
type Banner = {
  id: string;
  banner: string;
  mobileBanner?: string;
  headline: string;
  subheading: string;
  cta: string;
};
export function CampaignBanners({
  placement,
  initial = [],
}: {
  placement: string;
  initial?: Banner[];
}) {
  const [campaigns, setCampaigns] = useState(initial),
    [index, setIndex] = useState(0);
  const element = useRef<HTMLElement>(null),
    current = campaigns[index % Math.max(campaigns.length, 1)];
  useEffect(() => {
    const controller = new AbortController();
    let running = false;
    const refresh = async () => {
      if (running || document.visibilityState === "hidden") return;
      running = true;
      try {
        const response = await fetch(`/api/campaigns?placement=${placement}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (response.ok) {
          const result = await response.json();
          setCampaigns(result.campaigns || []);
        }
      } catch {} finally { running = false; }
    };
    void refresh();
    const timer = setInterval(refresh, 60000);
    return () => {
      controller.abort();
      clearInterval(timer);
    };
  }, [placement]);
  useEffect(() => {
    if (!current || !element.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        let visitId = crypto.randomUUID() as string;
        try {
          visitId = sessionStorage.getItem("ovia-campaign-visit") || visitId;
          sessionStorage.setItem("ovia-campaign-visit", visitId);
        } catch {}
        void fetch(`/api/campaigns/${current.id}/event`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ visitId }),
        }).catch(() => {});
      },
      { threshold: 0.5 },
    );
    observer.observe(element.current);
    return () => observer.disconnect();
  }, [current?.id]);
  if (!current) return null;
  return (
    <section
      ref={element}
      data-home-hero-campaign={placement === "homeHero" ? true : undefined}
      className={styles.banner}
      aria-label={current.headline}
    >
      <picture>
        {current.mobileBanner && (
          <source media="(max-width:700px)" srcSet={current.mobileBanner} />
        )}
        <img src={current.banner} alt={current.headline} loading={placement === "homeHero" ? "eager" : "lazy"} decoding="async" />
      </picture>
      <div className={styles.content}>
        {placement === "homeHero" ? (
          <h1>{current.headline}</h1>
        ) : (
          <h2>{current.headline}</h2>
        )}
        {current.subheading && <p>{current.subheading}</p>}
        <a href={`/api/campaigns/${current.id}/go`}>
          {current.cta || "Discover"}
        </a>
      </div>
      {campaigns.length > 1 && (
        <div className={styles.controls}>
          {campaigns.map((campaign, i) => (
            <button
              key={campaign.id}
              aria-label={`Show campaign ${i + 1}`}
              aria-pressed={index % campaigns.length === i}
              onClick={() => setIndex(i)}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
export function PublicCampaignPlacement() {
  const pathname = usePathname();
  const placement = pathname.startsWith("/bags")
    ? "bags"
    : pathname.startsWith("/luggage")
      ? "luggage"
      : /^\/(journal|stories|editorial|blog)(\/|$)/.test(pathname)
        ? "editorial"
        : "";
  return placement ? <CampaignBanners placement={placement} /> : null;
}
