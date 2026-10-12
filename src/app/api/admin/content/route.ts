import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminApi, recordAuditEvent } from "@/server/admin-auth";
import { mongo, isDemo, transaction } from "@/server/db";

export const runtime = "nodejs";

const DEFAULT_CONTENT = {
  banners: [
    {
      id: "1",
      page: "Homepage",
      section: "Hero Banner",
      heading: "Built for everyday journeys",
      status: "Published",
      updated: "Oct 1, 2026",
      eyebrow: "OVIA LUXURY TRAVEL",
      description: "Timeless design meets contemporary life. Discover pieces crafted for every journey.",
      buttonText: "DISCOVER THE SELECTION",
      buttonLink: "/collections/all",
      linkType: "Collection Page",
      image: "/media/case-flowers.jpg",
      mobileImage: "/media/case-flowers.jpg",
      seoTitle: "Ovia - Premium Bags & Luggage for Everyday Journeys",
      metaDescription: "Discover Ovia's premium collection of luxury bags and luggage. Timeless design, exceptional craftsmanship, and pieces made for every journey.",
      canonicalUrl: "https://ovias.shop/",
      ogImage: "/media/case-flowers.jpg",
      imageAlt: "Ovia luxury luggage and travel bags",
    },
    {
      id: "2",
      page: "Bags",
      section: "Collection Banner",
      heading: "Crafted for modern life",
      status: "Published",
      updated: "Sep 28, 2026",
      eyebrow: "OVIA LEATHER ATELIER",
      description: "Full-grain Italian hides sculpted for effortless urban mobility.",
      buttonText: "SHOP BAGS",
      buttonLink: "/collections/bags",
      linkType: "Collection Page",
      image: "/media/all-bags-hero.jpg",
      mobileImage: "/media/all-bags-hero.jpg",
      seoTitle: "Ovia - Luxury Handcrafted Leather Bags",
      metaDescription: "Explore our collection of luxury travel duffles, backpacks and weekend totes.",
      canonicalUrl: "https://ovias.shop/collections/bags",
      ogImage: "/media/all-bags-hero.jpg",
      imageAlt: "Ovia luxury handcrafted bags",
    },
    {
      id: "3",
      page: "Luggage",
      section: "Hero Banner",
      heading: "Journey without limits",
      status: "Draft",
      updated: "Sep 25, 2026",
      eyebrow: "AEROSPACE ALUMINIUM",
      description: "Grooved aluminium shells engineered for lifetime resilience.",
      buttonText: "EXPLORE LUGGAGE",
      buttonLink: "/collections/luggage",
      linkType: "Collection Page",
      image: "/media/banner-trunk-16k.jpg",
      mobileImage: "/media/banner-trunk-16k.jpg",
      seoTitle: "Ovia - Engineered Aluminium Suitcases",
      metaDescription: "Precision anodized aluminium cabin and check-in luggage with Hinomoto wheels.",
      canonicalUrl: "https://ovias.shop/collections/luggage",
      ogImage: "/media/banner-trunk-16k.jpg",
      imageAlt: "Ovia aluminium luggage trunk",
    },
    {
      id: "4",
      page: "Discover",
      section: "Editorial Banner",
      heading: "Stories from the World",
      status: "Published",
      updated: "Sep 20, 2026",
      eyebrow: "OVIA JOURNAL",
      description: "Journals, artist collaborations and architectural voyages.",
      buttonText: "READ STORIES",
      buttonLink: "/stories",
      linkType: "Custom Link",
      image: "/media/editorial-journey-model.jpg",
      mobileImage: "/media/editorial-journey-model.jpg",
      seoTitle: "Ovia - Stories from the World",
      metaDescription: "Travel narratives and artisan craftsmanship stories.",
      canonicalUrl: "https://ovias.shop/stories",
      ogImage: "/media/editorial-journey-model.jpg",
      imageAlt: "Ovia editorial journal stories",
    },
    {
      id: "5",
      page: "Services",
      section: "Banner",
      heading: "Expert care, wherever you go",
      status: "Published",
      updated: "Sep 18, 2026",
      eyebrow: "ATELIER PRIVILEGES",
      description: "Lifetime warranty, lock repair, and tailored monogramming services.",
      buttonText: "DISCOVER SERVICES",
      buttonLink: "/services",
      linkType: "Custom Link",
      image: "/media/craftsmanship-artisan-detail.jpg",
      mobileImage: "/media/craftsmanship-artisan-detail.jpg",
      seoTitle: "Ovia - Client Care & Repair Services",
      metaDescription: "Personalized care, lifetime warranty services, and repairs.",
      canonicalUrl: "https://ovias.shop/services",
      ogImage: "/media/craftsmanship-artisan-detail.jpg",
      imageAlt: "Ovia craftsmanship repair services",
    },
  ],
  pageSeo: {
    page: "Homepage",
    seoTitle: "OVIA – Luxury Bags & Luggage for Everyday Journeys",
    metaDescription: "Discover OVIA's premium collection of luxury bags and luggage. Timeless design, exceptional craftsmanship, and pieces made for every journey.",
    urlSlug: "/",
    canonicalUrl: "https://ovias.shop/",
    indexing: "Index (Allow search engines)",
    followLinks: "Follow (Allow link following)",
    ogTitle: "OVIA – Luxury Bags & Luggage for Everyday Journeys",
    ogDescription: "Discover OVIA's premium collection of luxury bags and luggage. Timeless design, exceptional craftsmanship, and pieces made for every journey.",
    ogImage: "/media/case-flowers.jpg",
    twitterCard: "Large Image Summary",
    twitterTitle: "OVIA - Luxury Bags & Luggage",
    twitterDescription: "Discover OVIA's premium collection of luxury bags and luggage.",
    structuredData: {
      organization: true,
      websiteSearch: true,
      breadcrumb: true,
      faq: false,
    },
  },
  sections: [
    {
      id: "hero-banner",
      title: "Hero Banner",
      subtitle: "Main banner with title and CTA",
      enabled: true,
      image: "/media/case-flowers.jpg",
      mobileImage: "/media/case-flowers.jpg",
      eyebrow: "OVIA LUXURY TRAVEL",
      heading: "Built for everyday journeys",
      buttonText: "DISCOVER THE SELECTION",
      buttonLink: "/collections/all",
      overlay: "dark",
      textAlignment: "center",
      showEyebrow: true,
      showButton: true,
    },
    {
      id: "category-nav",
      title: "Category Navigation",
      subtitle: "Maison's Creations (Luggage, Bags, etc.)",
      enabled: true,
      image: "/media/megamenu/mega-luggage-original.webp",
      eyebrow: "MAISON'S CREATIONS",
      heading: "Explore a Selection of the Maison's Creations",
      buttonText: "EXPLORE CREATIONS",
      buttonLink: "/collections/all",
      overlay: "dark",
      textAlignment: "center",
      showEyebrow: true,
      showButton: true,
    },
    {
      id: "featured-products",
      title: "Featured Products",
      subtitle: "Iconic & Recommended product selections",
      enabled: true,
      image: "/media/artist-case.svg",
      eyebrow: "ICONIC SELECTIONS",
      heading: "Bestsellers & New Arrivals",
      buttonText: "VIEW ALL PRODUCTS",
      buttonLink: "/collections/all",
      overlay: "dark",
      textAlignment: "center",
      showEyebrow: true,
      showButton: true,
    },
    {
      id: "editorial-section",
      title: "Editorial & Stories",
      subtitle: "Brand stories and lifestyle journals",
      enabled: true,
      image: "/media/editorial-journey-model.jpg",
      eyebrow: "OVIA JOURNAL",
      heading: "Stories from the World",
      buttonText: "READ STORIES",
      buttonLink: "/stories",
      overlay: "dark",
      textAlignment: "center",
      showEyebrow: true,
      showButton: true,
    },
    {
      id: "services",
      title: "Services",
      subtitle: "Icons with service details",
      enabled: true,
      image: "/media/craftsmanship-artisan-detail.jpg",
      eyebrow: "ATELIER PRIVILEGES",
      heading: "Expert care, wherever you go",
      buttonText: "DISCOVER SERVICES",
      buttonLink: "/services",
      overlay: "dark",
      textAlignment: "center",
      showEyebrow: true,
      showButton: true,
    },
  ],
};

const REAL_SECTION_IDS = new Set([
  "hero-banner",
  "category-nav",
  "featured-products",
  "editorial-section",
  "services",
]);

export async function GET(req: NextRequest) {
  const auth = await authorizeAdminApi(req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    let record: any = null;
    if (!isDemo()) {
      const client = await mongo();
      const db = client.db(process.env.MONGODB_DB || "ovia");
      record = await db.collection("site_content").findOne({ id: "homepage_studio" });
    } else {
      record = await transaction(async (repo) => {
        return await repo.get<any>("site_content", "homepage_studio");
      });
    }

    if (record) {
      if (Array.isArray(record.sections)) {
        record.sections = record.sections.filter((s: any) => REAL_SECTION_IDS.has(s.id));
        if (record.sections.length === 0) {
          record.sections = DEFAULT_CONTENT.sections;
        }
      }
      return NextResponse.json({ success: true, ...record });
    }
    return NextResponse.json({ success: true, ...DEFAULT_CONTENT });
  } catch (err: any) {
    return NextResponse.json({ success: true, ...DEFAULT_CONTENT });
  }
}

export async function POST(req: NextRequest) {
  const auth = await authorizeAdminApi(req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const body = await req.json();
    const updated = {
      ...DEFAULT_CONTENT,
      ...body,
      id: "homepage_studio",
      updatedAt: new Date().toISOString(),
    };

    if (!isDemo()) {
      const client = await mongo();
      const db = client.db(process.env.MONGODB_DB || "ovia");
      await db.collection("site_content").updateOne(
        { id: "homepage_studio" },
        { $set: updated },
        { upsert: true },
      );
    } else {
      await transaction(async (repo) => {
        await repo.put("site_content", updated);
      });
    }

    await recordAuditEvent({
      actor: auth.user.email,
      action: "CONTENT_STUDIO_UPDATED",
      resource: "site_content",
      resourceId: "homepage_studio",
      details: { tab: body.activeTab || "general", timestamp: new Date().toISOString() },
    });

    return NextResponse.json({ success: true, message: "Changes published successfully to storefront." });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update content." },
      { status: 500 },
    );
  }
}
