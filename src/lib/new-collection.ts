import type { Product } from "./catalog";

export const latestLinks = [
  { label: "Original Backpack Black", href: "/products/original-bag-aluminium-backpack-93090009" },
  { label: "iPhone 18 Cases", href: "/new/phone-cases" },
  { label: "Artist Case Collaboration", href: "/new/artist-case" },
  { label: "Never Still collection", href: "/bags/backpacks" },
  { label: "Distinct Anthracite Grey", href: "/products/distinct-cabin" },
  { label: "All new products", href: "/new" },
];
export const newEdits: Record<
  string,
  { title: string; description: string; matches: (p: Product) => boolean }
> = {
  "phone-cases": {
    title: "Everyday, considered.",
    description:
      "The OVIA iPhone 18 case design study. Concept compatibility only; fit has not been certified against physical hardware.",
    matches: (p) => p.tags.includes("phone-18"),
  },
  "artist-case": {
    title: "Room for a new perspective.",
    description:
      "The Studio Artist Case: an original luxury concept pairing German anodized aluminium luggage craftsmanship with a professional two-tiered drawing atelier.",
    matches: (p) => p.tags.includes("artist-case"),
  },
  "in-motion": {
    title: "Always in motion.",
    description:
      "An everyday edit of backpacks, weekenders and crossbodies. From the familiar to somewhere new.",
    matches: (p) => p.department === "bags" && p.collection === "Meridian",
  },
  anthracite: {
    title: "A quieter kind of statement.",
    description:
      "Introducing Forma Anthracite. Deep grey, considered proportions and an understated presence.",
    matches: (p) => p.tags.includes("anthracite"),
  },
  stone: {
    title: "A softer point of view.",
    description:
      "Meridian Stone brings a warm, mineral-inspired palette to the cabin collection.",
    matches: (p) => p.tags.includes("stone"),
  },
};

export const newProducts: Product[] = [
  {
    id: "forma-iphone-18-case",
    slug: "forma-iphone-18-case",
    name: "Forma iPhone 18 Case",
    collection: "Forma",
    department: "accessories",
    category: "Phone Cases",
    material: "Aluminium",
    description:
      "A restrained silver phone-case concept with a smooth frame and an understated OVIA signature. An illustrative design study; physical iPhone 18 compatibility has not been verified.",
    dimensions: "Concept fit — not certified",
    capacity: "—",
    weight: "—",
    tags: ["new-arrivals", "phone-18", "gifts"],
    variants: [
      {
        sku: "OV-FORMA-IPHONE-18-CASE-0",
        color: "Silver",
        hex: "#bfc2be",
        price: 590000,
        stock: 12,
      },
    ],
    image: "/media/phone-case.svg",
    imageKind: "illustration",
    featured: true,
  },
  {
    id: "studio-artist-case",
    slug: "studio-artist-case",
    name: "Studio Artist Case",
    collection: "Studio",
    department: "bags",
    category: "Hand Carry",
    material: "Aluminium",
    description:
      "A portable atelier for visionary ideas. Crafted in precision-engineered grooved anodized aluminium with reinforced riveted high-gloss corners, a hand-stitched heritage leather handle, and dual TSA-approved combination locks. The microfiber interior features a bespoke two-tiered wooden tray system organizing 120 artist colour pencils, custom graphite tools, and platinum-plated accessories. Inspired by classic German luggage engineering.",
    dimensions: "67 × 35 × 8 cm",
    capacity: "19 L",
    weight: "6.8 kg",
    tags: ["new-arrivals", "artist-case", "gifts", "signature-pieces"],
    variants: [
      {
        sku: "OV-STUDIO-ARTIST-CASE-0",
        color: "Silver",
        hex: "#c4c7c5",
        price: 23500000,
        stock: 8,
      },
      {
        sku: "OV-STUDIO-ARTIST-CASE-1",
        color: "Graphite",
        hex: "#464744",
        price: 23500000,
        stock: 6,
      },
    ],
    image: "/media/artist-case.svg",
    gallery: ["/media/artist-case.svg", "/media/artist-case-open.svg", "/media/artist-case-detail.svg"],
    imageKind: "illustration",
    featured: true,
  },
  {
    id: "forma-anthracite-cabin",
    slug: "forma-anthracite-cabin",
    name: "Forma Anthracite Cabin",
    collection: "Forma",
    department: "luggage",
    category: "Cabin",
    material: "Leather",
    description:
      "A deeper shade for the road ahead. A dark-grey cabin concept with a soft visual texture, quiet detailing and space for a considered edit of essentials.",
    dimensions: "55 × 38 × 23 cm",
    capacity: "38 L",
    weight: "3.4 kg",
    tags: ["new-arrivals", "anthracite", "gifts"],
    variants: [
      {
        sku: "OV-FORMA-ANTHRACITE-CABIN-0",
        color: "Anthracite",
        hex: "#505251",
        price: 4650000,
        stock: 12,
      },
    ],
    image: "/media/luggage.svg",
    imageKind: "illustration",
    featured: true,
  },
  {
    id: "meridian-stone-cabin",
    slug: "meridian-stone-cabin",
    name: "Meridian Stone Cabin",
    collection: "Meridian",
    department: "luggage",
    category: "Cabin",
    material: "Polycarbonate",
    description:
      "Inspired by warm mineral tones, this stone-coloured cabin concept brings a lighter expression to everyday travel. All specifications are illustrative.",
    dimensions: "55 × 38 × 23 cm",
    capacity: "38 L",
    weight: "3.2 kg",
    tags: ["new-arrivals", "stone", "gifts"],
    variants: [
      {
        sku: "OV-MERIDIAN-STONE-CABIN-0",
        color: "Stone",
        hex: "#c6bda9",
        price: 2850000,
        stock: 12,
      },
    ],
    image: "/media/luggage.svg",
    imageKind: "illustration",
    featured: true,
  },
];
