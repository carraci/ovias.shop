import { Approach } from "@/components/approach";
import { ClientServicePage } from "@/components/client-service-page";
import {
  HelpCenter,
  SupportDesk,
  PrivacyControls,
} from "@/components/care-center";
import {
  PolicyPage,
  ShippingReturns,
} from "@/components/policy-page";
import { RegionalSettings, CookiePreferences } from "@/components/preferences";
import { OrderTracking } from "@/components/order-tracking";
import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { storefrontCatalog as catalog } from "@/server/storefront-catalog";
import { getAdminCategories } from "@/server/admin-service";
import { groups, slugify, type Department, type Filters } from "@/lib/catalog";
import { CatalogListing as CatalogView } from "@/components/catalog-listing";
import { BagsLuggageLanding } from "@/components/bags-luggage-landing";
import { AllBagsGuide } from "@/components/all-bags-guide";
import { LuggageLanding } from "@/components/luggage-landing";
import { ServicesLanding } from "@/components/services-landing";
import { DiscoverLanding } from "@/components/discover-landing";
export const dynamic = "force-dynamic";
const pages: Record<
  string,
  { title: string; intro: string; sections: [string, string][] }
> = {
  "services/locks": {
    title: "A considered closure.",
    intro: "Lock instructions",
    sections: [
      [
        "Before setting a lock",
        "This concept catalog does not specify a real lock mechanism. Use the instructions supplied by the manufacturer of your physical case; do not follow unverified generic reset steps.",
      ],
    ],
  },
};
const collectionNames: Record<string, string> = {
  "short-trips": "Short trips",
  "long-haul": "Long haul",
  "business-selection": "Business selection",
  "everyday-mobility": "Everyday Bags",
  gifts: "All gifts",
  "signature-pieces": "Signature pieces",
  "travel-bags": "Travel bags",
  "business-bags": "Business bags",
  "best-sellers": "Best sellers",
  "everyday-bags": "Everyday bags",
};
export async function generateMetadata({
  params,
}: {
  params: Promise<{ segments: string[] }>;
}) {
  const { segments } = await params;
  const metadataPath = segments[0] === "bags" && ["weekend-bags", "weekends-bags", "weekender-bags"].includes(segments[1])
    ? "bags/weekend-bags"
    : segments[0] === "bags" && segments[1] === "duffel-bags"
      ? "bags/duffle-bags"
    : segments.join("/");
  const names: Record<string, string> = {
    help: "OVIA Client Care — How May We Assist You?",
    faq: "Frequently asked questions",
    contact: "Contact & support",
    shipping: "Shipping & delivery",
    returns: "Returns & refunds",
    legal: "Legal & Privacy Center",
    "privacy/request": "Privacy controls",
    preferences: "Country, language & currency",
    privacy: "Privacy Policy",
    terms: "Terms & Conditions",
    accessibility: "Accessibility",
    security: "Data Protection & Security",
    "data-protection": "Data Protection & Security",
    "data-protection-security": "Data Protection & Security",
    policies: "Data Protection & Security",
    cookies: "Cookie information",
    "cookie-preferences": "Cookie preferences",
    about: "About OVIA — Our Story & Craftsmanship",
    heritage: "The OVIA story",
    discover: "OVIA Discover — Explore Our World",
    "our-approach": "OVIA Discover — Our Approach",
    "track-order": "Track your order",
    "bags-guide": "OVIA Bags Guide — Available in a Variety of Shapes",
    bags: "OVIA All Bags — Shapes, Materials & Craftsmanship",
    "bags-and-luggage": "OVIA Bags & Luggage — The Complete Collection",
    "all-products": "OVIA All Products — The Complete Collection",
    travel: "OVIA Bags & Luggage — The Complete Collection",
    luggage: "OVIA Luggage — Designed for a Wider World",
    "all-luggage": "OVIA All Luggage — Designed for a Wider World",
    "luggage-guide": "OVIA Luggage Guide — Designed for a Wider World",
    "luggage/luggage": "OVIA Luggage Collection",
    "luggage/cabin-bags": "OVIA Cabin Bags",
    "luggage/cabin": "OVIA Cabin Luggage — Hand Carry & Cabin Proportions",
    "luggage/cabin-luggage": "OVIA Cabin Luggage — Hand Carry & Cabin Proportions",
    "luggage/check-in": "OVIA Check-In Luggage — Long Haul & Checked Baggage",
    "luggage/check-in-luggage": "OVIA Check-in Luggage — Long Haul & Checked Baggage",
    "luggage/trunk": "OVIA Trunk Luggage — Generous Volume & Iconic Trunks",
    "luggage/trunks": "OVIA Trunk Luggage — Generous Volume & Iconic Trunks",
    "luggage/large-luggage": "OVIA Large Luggage — Cases for Longer Journeys",
    "luggage/medium-luggage": "OVIA Medium Luggage — Cases for Your Next Journey",
    "luggage/small-luggage": "OVIA Small Luggage — Compact Cases for Short Trips",
    "luggage/short-trips": "OVIA Short Trips — Luggage for Quick Escapes & Weekends",
    "luggage/long-journeys": "OVIA Long Journeys — Luggage for Extended Journeys",
    "luggage/business-selection": "OVIA Business Selection — Engineered for Professionals on the Move",
    "luggage/best-sellers": "OVIA Best Sellers — Iconic Luxury Luggage",
    "luggage/new-arrivals": "OVIA New Arrivals — The Latest in Luxury Travel",
    "luggage/aluminium": "OVIA Aluminium Luggage — Anodised Grooved Aluminium",
    "luggage/polycarbonate": "OVIA Polycarbonate Luggage — High-Performance Resilience",
    "luggage/leather": "OVIA Leather Luggage — Artisanal Full-Grain Craftsmanship",
    "luggage/silver": "OVIA Silver Luggage — Iconic Anodised Aluminium",
    "luggage/black": "OVIA Black Luggage — Understated Stealth Luxury",
    "luggage/blue": "OVIA Blue Luggage — Deep Indigo & Matte Finish",
    "luggage/emblematic-pieces": "OVIA Emblematic Pieces — Icons of Craftsmanship & Best Sellers",
    accessories: "OVIA Accessories — The Details Move With You",
    "all-accessories": "OVIA All Accessories — The Details Move With You",
    "accessories-guide": "OVIA Accessories Guide — The Details Move With You",
    "accessories/iphone-cases": "OVIA iPhone Cases — Grooved Aluminium & MagSafe Protection",
    "accessories/hats": "OVIA Hats — Reversible Canvas Bucket Hats",
    "accessories/sunglasses": "OVIA Sunglasses — Architectural Eyewear & Polarised Lenses",
    "accessories/belts": "OVIA Belts — Reversible Full-Grain Calfskin Leather",
    "accessories/card-holders": "OVIA Card Holders — Iconic Anodised Aluminium",
    "accessories/address-tags": "OVIA Address Tags — Handcrafted Italian Leather Luggage Tags",
    "accessories/stickers": "OVIA Stickers — City & Cultural Luggage Stickers",
    "accessories/bag-straps": "OVIA Bag Straps — Jacquard Webbing & Leather Shoulder Straps",
    "accessories/wheels": "OVIA Classic Wheels — Custom Multiwheel Sets",
    "accessories/customisation": "OVIA Customisation Accessories — Luggage Tags, Stickers, Straps & Wheels",
    new: "OVIA New Arrivals — New Horizons, New Journeys",
    "all-new": "OVIA New Arrivals — New Horizons, New Journeys",
    latest: "OVIA New Arrivals — New Horizons, New Journeys",
    "collections/long-haul": "OVIA Long Haul — Luggage for Extended Journeys",
    "collections/short-trips": "OVIA Short Trips — Luggage for Quick Escapes & Weekends",
    "collections/business-selection": "OVIA Business Selection — Engineered for Professionals on the Move",
    "collections/gifts": "OVIA All Gifts — Curated Travel Luxury",
    "bags/shoulder-bags": "OVIA Shoulder Bags — Effortless Carry for Every Occasion",
    "bags/weekend-bags": "OVIA Weekend Bags — Bags for Short Getaways",
    "bags/duffle-bags": "OVIA Duffel Bags — Bags for Travel & Everyday Carry",
    "bags/hand-carry": "OVIA Hand Carry — Classic Cases & Aluminium Carriers",
    services: "OVIA Client Care — How May We Assist You?",
    "client-care": "OVIA Client Care — How May We Assist You?",
  };
  return {
    description: names[metadataPath]
      ? names[metadataPath] + " — OVIA travel goods."
      : undefined,
    alternates: { canonical: "/" + metadataPath },
    title:
      names[metadataPath] ||
      pages[segments.join("/")]?.intro ||
      segments
        .at(-1)
        ?.replaceAll("-", " ")
        .replace(/^./, (s) => s.toUpperCase()),
  };
}
export default async function RoutedPage({
  params,
  searchParams,
}: {
  params: Promise<{ segments: string[] }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { segments } = await params;
  const sp = searchParams ? await searchParams : {};
  const [first, second] = segments;
  const path = segments.join("/");
  if (["discover", "heritage", "our-approach", "about"].includes(path))
    return <DiscoverLanding />;
  if (["services", "client-care", "services/client-care", "help"].includes(path))
    return <ServicesLanding />;
  if (["faq", "services/faq"].includes(path)) return <HelpCenter />;
  if (path === "services/contact") return <ClientServicePage />;
  if (path === "contact") return <SupportDesk />;
  if (["shipping", "services/shipping"].includes(path))
    return <ShippingReturns />;
  if (["returns", "services/returns"].includes(path))
    return <ShippingReturns returns />;
  if (
    ["privacy", "terms", "security", "accessibility", "cookies", "data-protection", "data-protection-security", "policies"].includes(path)
  ) {
    const policyName = (path === "policies" || path === "data-protection" || path === "data-protection-security") ? "security" : path;
    return <PolicyPage name={policyName} />;
  }
  if (["legal", "privacy-center"].includes(path)) permanentRedirect("/privacy");
  if (path === "privacy/request") return <PrivacyControls />;
  if (path === "preferences") return <RegionalSettings />;
  if (path === "cookie-preferences") return <CookiePreferences />;
  if (path === "track-order") return <OrderTracking />;

  const dynamicCategories = await getAdminCategories().catch(() => []);
  const findCategory = (identifier: string) => {
    const clean = identifier.toLowerCase().trim();
    const slug = slugify(clean);
    return dynamicCategories.find(
      (c) =>
        (c.status === "Active" || !c.status) &&
        (c.slug === slug ||
          slugify(c.name) === slug ||
          c.name.toLowerCase().trim() === clean ||
          c.id === identifier)
    );
  };
  if (path === "bags" || path === "bags-guide") {
    const hasFilter = Boolean(
      sp.view === "catalog" ||
      sp.category ||
      sp.subCategory ||
      sp.material ||
      sp.colour ||
      sp.collection ||
      sp.q ||
      sp.sort ||
      sp.page ||
      sp.use
    );
    const useFilter = typeof sp.use === "string" ? sp.use : undefined;
    const materialFilter = typeof sp.material === "string" ? sp.material : undefined;
    const bagTitle = useFilter === "business"
      ? "Business Bags"
      : useFilter === "travel"
        ? "Travel Bags"
        : materialFilter
          ? `${materialFilter} Bags`
          : "All Bags";
    const bagDesc = useFilter === "business"
      ? "Structured, refined and boardroom-ready. OVIA bags designed for the professional traveller."
      : useFilter === "travel"
        ? "From duffle bags to harness backpacks — pieces engineered for every kind of journey."
        : materialFilter
          ? `Crafted from premium ${materialFilter}. Bags engineered for lasting style and performance.`
          : "Available in a variety of shapes, OVIA's versatile bag collections are designed for daily routines or travel needs.";
    return (
      <CatalogView query={sp}
        products={await catalog()}
        title={bagTitle}
        description={findCategory("bags")?.description || bagDesc}
        heroImage={findCategory("bags")?.image}
        base={{ department: "bags", ...(useFilter ? { use: useFilter } : {}), ...(materialFilter ? { material: materialFilter } : {}) }}
      />
    );
  }
  if (path === "luggage" || path === "all-luggage" || path === "luggage-guide") {
    const hasFilter = Boolean(
      sp.view === "catalog" ||
      sp.category ||
      sp.subCategory ||
      sp.material ||
      sp.color ||
      sp.colour ||
      sp.collection ||
      sp.tag ||
      sp.q ||
      sp.sort ||
      sp.page
    );
    const materialTitle = typeof sp.material === "string" ? `${sp.material} Luggage` : undefined;
    const colorParam = typeof sp.color === "string" ? sp.color : typeof sp.colour === "string" ? sp.colour : undefined;
    const colorTitle = colorParam ? `${colorParam === "Midnight Blue" ? "Blue" : colorParam} Luggage` : undefined;
    const computedTitle = materialTitle || colorTitle || "All Luggage";
    const computedDesc = materialTitle
      ? `Crafted from premium ${sp.material}. Engineered for enduring performance.`
      : colorTitle
        ? `Iconic pieces tailored in signature ${colorParam} hues. Designed for life's discerning journeys.`
        : "Exceptional craftsmanship. Timeless design. Luggage created for every journey.";
    return (
      <CatalogView query={sp}
        products={await catalog()}
        title={computedTitle}
        description={findCategory("luggage")?.description || computedDesc}
        heroImage={findCategory("luggage")?.image}
        base={{ department: "luggage" }}
      />
    );
  }
  if (path === "accessories" || path === "all-accessories" || path === "accessories-guide") {
    const catParam = typeof sp.category === "string" ? sp.category : undefined;
    const isCustom = catParam === "customisation" || catParam === "customization";
    const accTitle = isCustom
      ? "Customisation"
      : catParam
        ? catParam.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
        : "All Accessories";
    const accDesc = isCustom
      ? "Add distinctive flair with leather address tags, city stickers, bespoke bag straps and wheels designed for your cases."
      : "Thoughtfully designed accessories to make every journey smoother, more organised and more personal.";
    return (
      <CatalogView query={sp}
        products={await catalog()}
        title={accTitle}
        description={findCategory(catParam || "accessories")?.description || accDesc}
        heroImage={findCategory(catParam || "accessories")?.image || "/media/category-accessories.jpg"}
        base={{ department: "accessories", ...(catParam ? { category: catParam } : {}) }}
      />
    );
  }
  if (path === "new" || path === "all-new" || path === "latest") {
    return (
      <CatalogView query={sp}
        products={(await catalog()).filter((product) => product.tags.includes("new-arrivals") || (product.department === "bags" && product.collection === "Meridian"))}
        title="A new point of view."
        description="Discover the latest OVIA design studies: new shapes, new shades, and a fresh perspective on the journey."
      />
    );
  }
  if (path === "all-products" || path === "bags-and-luggage" || path === "travel") {
    return <BagsLuggageLanding />;
  }
  if (first === "luggage" && segments.length === 2) {
    const sub = second.toLowerCase();
    const subcatMap: Record<
      string,
      {
        title: string;
        category?: string;
        subcategory?: string;
        tag?: string;
        material?: string;
        color?: string;
      }
    > = {
      luggage: { title: "Luggage", category: "luggage" },
      "cabin-bags": { title: "Cabin Bags", category: "cabin-bags" },
      cabin: { title: "Cabin Luggage", category: "cabin", subcategory: "cabin" },
      "cabin-luggage": { title: "Cabin Luggage", category: "cabin", subcategory: "cabin" },
      "check-in": { title: "Check-In Luggage", category: "check-in", subcategory: "check-in" },
      "check-in-luggage": { title: "Check-in Luggage", category: "check-in", subcategory: "check-in" },
      trunk: { title: "Large Trunk Suitcases", category: "trunk", subcategory: "trunk" },
      trunks: { title: "Large Trunk Suitcases", category: "trunk", subcategory: "trunk" },
      "large-luggage": { title: "Large Luggage", category: "large-luggage" },
      "medium-luggage": { title: "Medium Luggage", category: "medium-luggage" },
      "small-luggage": { title: "Small Luggage", category: "small-luggage" },
      large: { title: "Large Trunk Luggage", category: "trunk", subcategory: "large-luggage" },
      "short-trips": { title: "Short Trips Luggage", tag: "short-trips", subcategory: "short-trips" },
      "long-journeys": { title: "Long Journeys Luggage", tag: "long-journeys", subcategory: "long-journeys" },
      "long-haul": { title: "Long Haul Luggage", tag: "long-haul", subcategory: "long-journeys" },
      "business-selection": { title: "Business Selection", tag: "business-selection", subcategory: "business-selection" },
      "best-sellers": { title: "Best Sellers", tag: "best-sellers", subcategory: "best-sellers" },
      "new-arrivals": { title: "New Arrivals", tag: "new-arrivals", subcategory: "new-arrivals" },
      aluminium: { title: "Aluminium Luggage", material: "Aluminium" },
      polycarbonate: { title: "Polycarbonate Luggage", material: "Polycarbonate" },
      leather: { title: "Leather Luggage", material: "Leather" },
      silver: { title: "Silver Luggage", color: "Silver" },
      black: { title: "Black Luggage", color: "Black" },
      blue: { title: "Blue Luggage", color: "Blue" },
      "all-luggage": { title: "All Luggage" },
      "emblematic-pieces": { title: "Emblematic Pieces", category: "emblematic-pieces" },
    };

    const cfg = subcatMap[sub];
    if (cfg) {
      return (
        <CatalogView query={sp}
          products={await catalog()}
          title={cfg.title}
          description={findCategory(sub)?.description || "Considered pieces. Quiet character. Room for wherever life takes you."}
          heroImage={findCategory(sub)?.image}
          base={{
            department: "luggage",
            ...(cfg.category ? { category: cfg.category } : {}),
            ...(cfg.subcategory ? { subcategory: cfg.subcategory } : {}),
            ...(cfg.tag ? { tag: cfg.tag } : {}),
            ...(cfg.material ? { material: cfg.material } : {}),
            ...(cfg.color ? { color: cfg.color } : {}),
          }}
        />
      );
    }
  }
  if (first === "accessories" && (second === "customisation" || second === "customization")) {
    return (
      <CatalogView query={sp}
        products={await catalog()}
        title="Customisation"
        description="Add distinctive flair with leather address tags, city stickers, bespoke bag straps and wheels designed for your cases."
        base={{ department: "accessories", category: "customisation" }}
      />
    );
  }
  if (first in groups && segments.length <= 2) {
    const department = first as Department;
    const catSlug = ["weekends-bags", "weekender-bags"].includes(second) ? "weekend-bags" : second === "duffel-bags" ? "duffle-bags" : second === "crossbody-bags" ? "crossbodies" : second === "tote-bags" ? "totes" : second;
    const category = catSlug
      ? groups[department].find(([name]) => slugify(name) === catSlug)
      : undefined;

    let dynamicTitle: string | undefined;
    if (second && !category) {
      try {
        const dynamicCats = await getAdminCategories();
        const match = dynamicCats.find(
          (c) =>
            (c.status === "Active" || !c.status) &&
            (c.slug === catSlug ||
              slugify(c.name) === catSlug ||
              c.name.toLowerCase() === catSlug.replace(/-/g, " "))
        );
        if (match) {
          dynamicTitle = match.name;
        }
      } catch (e) {
        console.warn("[segments] Admin categories check failed:", e);
      }

      if (!dynamicTitle) {
        const allProducts = await catalog();
        const hasMatchingProduct = allProducts.some(
          (p) =>
            p.department === department &&
            (slugify(p.category) === catSlug ||
              (p.subcategory && slugify(p.subcategory) === catSlug) ||
              p.tags.includes(catSlug) ||
              p.name.toLowerCase().includes(catSlug.replace(/-/g, " ")))
        );
        if (hasMatchingProduct) {
          dynamicTitle = catSlug.replace(/-/g, " ").replace(/\b\w/g, (s) => s.toUpperCase());
        }
      }

      if (!dynamicTitle) notFound();
    }

    return (
      <CatalogView query={sp}
        products={await catalog()}
        title={
          second === "trunk"
            ? "Large Trunk Suitcases"
            : second === "duffel-bags" || second === "duffle-bags" ? "Duffel Bags"
            : (category?.[0] || dynamicTitle || first[0].toUpperCase() + first.slice(1))
        }
        description={findCategory(catSlug || first)?.description || "Considered pieces. Quiet character. Room for wherever life takes you."}
        heroImage={findCategory(catSlug || first)?.image}
        base={{ department, category: catSlug }}
      />
    );
  }
  if (first === "collections" && second && segments.length === 2) {
    let base: Filters = { tag: second, ...(["long-haul", "short-trips", "business-selection"].includes(second) ? { department: "luggage" } : {}) };
    if(['everyday-mobility','best-sellers'].includes(second))base.department='bags';
    let title = collectionNames[second];
    if (["polycarbonate", "aluminium", "leather", "nylon"].includes(second)) {
      title = second[0].toUpperCase() + second.slice(1);
      base = { material: title };
    }
    if (["silver", "black", "blue"].includes(second)) {
      title = `${second[0].toUpperCase() + second.slice(1)} luggage`;
      base = {
        department: "luggage",
        color:
          second === "black"
            ? "Graphite"
            : second === "blue"
              ? "Midnight Blue"
              : "Silver",
      };
    }
    if (!title) notFound();
    return (
      <CatalogView query={sp}
        products={await catalog()}
        title={title}
        description={findCategory(second)?.description || "An edit for your own way of moving through the world."}
        heroImage={findCategory(second)?.image}
        base={base}
      />
    );
  }
  if (path === "search")
    return (
      <CatalogView query={sp}
        products={await catalog()}
        title="Find your next companion."
        description="Explore pieces, collections and materials."
        search
      />
    );
  if (path === "personalise")
    return (
      <CatalogView query={sp}
        products={(await catalog()).filter((p) =>
          ["Address Tags", "Wheels", "Bag Straps", "Stickers"].includes(
            p.category,
          ),
        )}
        title="Make it your own."
        description="Small details, a personal point of view. Explore our concept accessories."
      />
    );
  if (path === "size-guide")
    return (
      <section className="section content-page">
        <p className="eyebrow">FIND YOUR FIT</p>
        <h1>
          A little room.
          <br />
          <em>A world of possibility.</em>
        </h1>
        <p>
          Compare the illustrative dimensions in the OVIA concept collection.
          Check your airline’s requirements before choosing cabin luggage.
        </p>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Shape</th>
                <th>Dimensions</th>
                <th>Capacity</th>
                <th>Your journey</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <Link href="/luggage/cabin">Cabin ↗</Link>
                </td>
                <td>55 × 38 × 23 cm</td>
                <td>38 L</td>
                <td>Short stays</td>
              </tr>
              <tr>
                <td>
                  <Link href="/luggage/check-in">Check-In ↗</Link>
                </td>
                <td>70 × 46 × 28 cm</td>
                <td>70 L</td>
                <td>A week away</td>
              </tr>
              <tr>
                <td>
                  <Link href="/luggage/trunk">Trunk ↗</Link>
                </td>
                <td>80 × 44 × 36 cm</td>
                <td>100 L</td>
                <td>Longer horizons</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    );
  const page = pages[path];
  if (!page) notFound();
  return (
    <section className="section content-page">
      <p className="eyebrow">{page.intro}</p>
      <h1>{page.title}</h1>
      <div className="content-sections">
        {page.sections.map(([title, text]) => (
          <section key={title}>
            <h2>{title}</h2>
            <p>{text}</p>
          </section>
        ))}
      </div>
      <Link href="/services/contact" className="text-link">
        Contact the project <ArrowUpRight size={16} />
      </Link>
    </section>
  );
}
