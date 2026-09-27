import Link from "next/link";
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
import {
  JourneyMatches,
  StoreBanner,
} from "@/components/discovery-sections";
import { StoriesCarousel } from "@/components/stories-carousel";
import { getStories } from "@/server/stories";
import { EditorialPromoCarousel } from "@/components/editorial-promo-carousel";
import { IconicAndRecommendedSections } from "@/components/iconic-products-carousel";
import { EditorialTriptychSection } from "@/components/editorial-triptych";
const creations = [
  {
    title: "Women's Handbags",
    image: "/media/creations/handbag.jpg",
    href: "/bags",
  },
  {
    title: "Women's Wallets and Small Leather Goods",
    image: "/media/creations/wallet.jpg",
    href: "/accessories",
  },
  {
    title: "Women's Accessories",
    image: "/media/creations/jewelry.jpg",
    href: "/accessories",
  },
  {
    title: "Perfume",
    image: "/media/creations/perfume.jpg",
    href: "/accessories",
  },
  {
    title: "Men's Bags",
    image: "/media/creations/backpack.jpg",
    href: "/bags",
  },
  {
    title: "Men's Wallets and Small Leather Goods",
    image: "/media/creations/passport.jpg",
    href: "/accessories",
  },
  {
    title: "Men's Shoes",
    image: "/media/creations/sneakers.jpg",
    href: "/accessories",
  },
  {
    title: "Men's Accessories",
    image: "/media/creations/sunglasses.jpg",
    href: "/accessories",
  },
];

export const dynamic = "force-dynamic";
export default async function Home() {
  const all = await catalog();
  const picks = [all[1], all[0], all[24], all[27]].filter(Boolean);
  const stories = await getStories({ status: "published" });
  return (
    <>
      <HeroMotion>
        <section className="hero hero-luxury">
          <Image
            src="/media/rimowa-hero.jpg"
            alt="Built for everyday journeys"
            fill
            priority
            sizes="100vw"
            className="hero-background"
          />
          <div className="hero-shade hero-shade-luxury" />
          <div className="hero-center-content">
            <h1 className="hero-headline">Built for everyday journeys</h1>
            <Link className="hero-luxury-button" href="/luggage">
              DISCOVER THE SELECTION
            </Link>
          </div>
        </section>
      </HeroMotion>
      <Reveal y={16} duration={0.7}>
        <div className="intro-strip">
          <span>Considered design</span>
          <i />
          <span>Everyday versatility</span>
          <i />
          <span>A personal point of view</span>
        </div>
      </Reveal>
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
          <RevealGroup className="creations-reveal-group" selector=".creation-card" stagger={0.08}>
            <div className="creations-grid">
              {creations.map((item) => (
                <Link key={item.title} href={item.href} className="creation-card">
                  <div className="creation-image-wrapper">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, (max-width: 1600px) 25vw, 420px"
                      className="creation-image"
                    />
                  </div>
                  <h3 className="creation-title">{item.title}</h3>
                </Link>
              ))}
            </div>
          </RevealGroup>
        </div>
      </section>
      <Reveal y={24} duration={0.8}>
        <EditorialPromoCarousel />
      </Reveal>
      <Reveal y={24} duration={0.8}>
        <IconicAndRecommendedSections />
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
            <span>
              Find your fit
              <small>
                <Link href="/size-guide">Explore the size guide</Link>
              </small>
            </span>
          </div>
          <div>
            <Layers3 />
            <span>
              Make it your own
              <small>
                <Link href="/personalise">Consider the details</Link>
              </small>
            </span>
          </div>
          <div>
            <Package />
            <span>
              Here to help
              <small>
                <Link href="/services/faq">Visit client services</Link>
              </small>
            </span>
          </div>
        </div>
      </RevealGroup>
    </>
  );
}
