import "@/components/page-styles/editorial.css";
import { Suspense } from "react";

import { activeCampaigns } from "@/server/campaigns";
import { CampaignBanners } from "@/components/campaign-banners";
import Image from "next/image";
import {
  ArrowRight,
  ArrowUpRight,
  Compass,
  Package,
  Layers3,
} from "lucide-react";
import { storefrontCatalog as catalog } from "@/server/storefront-catalog";
import { ProductCard } from "@/components/product-card";
import { Reveal, RevealGroup, HeroMotion } from "@/components/motion";
import { JourneyMatches, StoreBanner } from "@/components/discovery-sections";
import { StoriesCarousel } from "@/components/stories-carousel";
import { getStories } from "@/server/stories";
import { EditorialPromoCarousel } from "@/components/editorial-promo-carousel";
import { IconicAndRecommendedSections } from "@/components/iconic-products-carousel";
import { EditorialTriptychSection } from "@/components/editorial-triptych";
const creations = [
  {
    title: "Trunk",
    image: "/media/products/luggage/97375014_1.png",
    imageAlt: "Classic Trunk suitcase",
    href: "/luggage/trunk",
  },
  {
    title: "Cabin",
    image: "/media/products/luggage/cabin/original-cabin-black-2276e47a58.webp",
    imageAlt: "Original Cabin suitcase in black",
    href: "/luggage/cabin-luggage",
  },
  {
    title: "Long Haul",
    image:
      "/media/products/luggage/check-in/classic-check-in-l-37faec1f53.webp",
    imageAlt: "Classic Check-In L suitcase for long journeys",
    href: "/collections/long-haul",
  },
  {
    title: "Business Selection",
    image:
      "/media/products/luggage/emblematic/attach-aluminium-briefcase-e4e4b5e79c.webp",
    imageAlt: "Attaché Aluminium Briefcase for business travel",
    href: "/collections/business-selection",
  },
  {
    title: "Backpacks",
    image: "/media/bags/never-still-canvas-flap-backpack-large.png",
    imageAlt: "Never Still Canvas Flap Backpack Large",
    href: "/bags/backpacks",
  },
  {
    title: "Duffel Bags",
    image: "/media/bags/never-still-leather-duffle-bag-large.png",
    imageAlt: "Never Still Leather Duffle Bag Large",
    href: "/bags/duffel-bags",
  },
  {
    title: "Briefcases",
    image: "/media/bags/never-still-leather-briefcase.png",
    imageAlt: "Never Still Leather Briefcase",
    href: "/bags/briefcases",
  },
  {
    title: "Crossbody Bags",
    image: "/media/bags/personal-polycarbonate-cross-body-bag.png",
    imageAlt: "Personal Polycarbonate Cross-Body Bag",
    href: "/bags/crossbody-bags",
  },
  {
    title: "Shoulder Bags",
    image: "/media/products/luggage/emblematic/groove-leather-hobo-bag-3087807314.webp",
    imageAlt: "Groove Leather Hobo Bag with adjustable shoulder strap",
    href: "/bags/shoulder-bags",
  },
  {
    title: "Small Luggage",
    image: "/media/products/luggage/cabin/original-cabin-s-a36ebbb785.webp",
    imageAlt: "Original Cabin S small suitcase",
    href: "/luggage/small-luggage",
  },
];

export const dynamic = "force-dynamic";
async function HomeHero() {
  const campaigns = await activeCampaigns("homeHero");
  return campaigns.length ? <CampaignBanners placement="homeHero" initial={campaigns} /> : null;
}
export default function Home() {
  return <><Suspense fallback={null}><HomeHero /></Suspense><Suspense fallback={null}><HomeContent /></Suspense></>;
}
async function HomeContent() {
  const [all, stories, collectionCampaigns] = await Promise.all([
    catalog(),
    getStories({ status: "published" }),
    activeCampaigns("homeCollection"),
  ]);
  const picks = [all[1], all[0], all[24], all[27]].filter(Boolean);
  const showcaseProducts = all.filter((product) => product.variants.length > 0);
  const bestsellers = [
    ...showcaseProducts.filter((product) => product.featured),
    ...showcaseProducts.filter((product) => !product.featured),
  ].slice(0, 6);
  const arrivals = [
    ...showcaseProducts.filter((product) =>
      product.tags.includes("new-arrivals"),
    ),
    ...showcaseProducts.filter(
      (product) => !product.tags.includes("new-arrivals"),
    ),
  ].slice(0, 6);
  return (
    <>
      <CampaignBanners
        placement="homeCollection"
        initial={collectionCampaigns}
      />
      <section className="section creations-section">
        <div className="creations-main-grid">
          <Reveal className="creations-reveal-heading">
            <div className="creations-heading">
              <h2>
                Explore a Selection of the Maison&apos;s
                <br />
                Creations
              </h2>
            </div>
          </Reveal>
          <RevealGroup
            className="creations-reveal-group"
            selector=".creation-card"
            stagger={0.08}
          >
            <div className="creations-grid">
              {creations.map((item) => (
                <a
                  data-store-navigation
                  key={item.title}
                  href={item.href}
                  className="creation-card"
                >
                  <div className="creation-image-wrapper">
                    <Image
                      src={item.image}
                      alt={item.imageAlt}
                      fill
                      sizes="(max-width: 640px) 45vw, 22vw"
                      className="creation-image"
                    />
                  </div>
                  <h3 className="creation-title">{item.title}</h3>
                </a>
              ))}
            </div>
          </RevealGroup>
        </div>
      </section>
      <Reveal y={24} duration={0.8}>
        <EditorialPromoCarousel />
      </Reveal>
      <Reveal y={24} duration={0.8}>
        <IconicAndRecommendedSections
          bestsellers={bestsellers}
          arrivals={arrivals}
        />
      </Reveal>
      <Reveal>
        <JourneyMatches />
      </Reveal>
      <Reveal>
        <StoreBanner />
      </Reveal>
      <StoriesCarousel initialStories={stories} />
      <EditorialTriptychSection />
      <RevealGroup selector="> div" stagger={0.1}>
        <div className="service-strip">
          <div>
            <Compass />
            <span>Find your fit</span>
          </div>
          <div>
            <Layers3 />
            <span>Make it your own</span>
          </div>
          <div>
            <Package />
            <span>
              Here to help
              <small>
                <a data-store-navigation href="/services/faq">Visit client services</a>
              </small>
            </span>
          </div>
        </div>
      </RevealGroup>
    </>
  );
}
