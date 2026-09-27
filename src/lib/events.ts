export interface OviaEvent {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: "Exhibition" | "Collection Launch" | "Private Preview" | "Design Week" | "Pop-Up";
  location: string;
  date: string;
  image: string;
  description: string;
  details: string[];
  status: "upcoming" | "active" | "archived";
}

export const oviaEvents: OviaEvent[] = [
  {
    id: "art-of-travel-2026",
    slug: "the-art-of-travel-milan",
    title: "The Art of Movement — Milan Design Week",
    subtitle: "An immersive exploration of kinetic design, anodized aluminium, and luggage heritage.",
    category: "Exhibition",
    location: "Palazzo Bocconi, Corso Venezia, Milan",
    date: "April 14 – 19, 2026",
    image: "/media/editorial-events.jpg",
    description: "OVIA presents an architectural pavilion exploring the intersection of modern aviation aesthetics and classical travel craftsmanship. Featuring kinetic light installations and historical concept archives.",
    details: [
      "Curated by the OVIA Design Lab",
      "Private opening preview on April 14",
      "Interactive materials library & tactile atelier",
      "Limited edition travel journal available on site"
    ],
    status: "upcoming"
  },
  {
    id: "studio-artist-case-preview",
    slug: "studio-artist-case-preview",
    title: "Studio Artist Case: Private Atelier Preview",
    subtitle: "A private evening celebrating the intersection of fine art instruments and luxury travel.",
    category: "Private Preview",
    location: "OVIA Gallery, New Delhi",
    date: "May 8, 2026",
    image: "/media/editorial-collection.jpg",
    description: "An intimate gathering of contemporary artists, architects, and industrial designers previewing the Studio Artist Case — pairing anodized German aluminium with a walnut drawing atelier.",
    details: [
      "Live artisanal demonstration of leather edge-finishing",
      "Keynote conversation with the lead industrial designer",
      "Exclusive prototype display"
    ],
    status: "upcoming"
  },
  {
    id: "in-motion-pop-up-tokyo",
    slug: "in-motion-tokyo",
    title: "In Motion: The Tokyo Residency",
    subtitle: "A pop-up space designed around quiet travel rituals in the heart of Ginza.",
    category: "Pop-Up",
    location: "Ginza Six, Tokyo",
    date: "June 2 – July 15, 2026",
    image: "/media/editorial-bags.jpg",
    description: "A minimal, cedar-lined conceptual space dedicated to lightweight urban mobility, bespoke monogramming, and modular packing systems.",
    details: [
      "On-site bespoke hot-stamping service",
      "Curated travel library by independent publishers",
      "Daily matcha service for guests"
    ],
    status: "upcoming"
  }
];

export const getFeaturedEvent = (): OviaEvent => {
  return oviaEvents[0];
};
