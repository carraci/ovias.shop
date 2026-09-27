export type CareCategorySlug =
  | "leather-bags"
  | "canvas-bags"
  | "travel-bags"
  | "rolling-luggage"
  | "small-leather-goods"
  | "accessories"
  | "personalised-products";

export interface CareSection {
  number: string;
  title: string;
  guidance: string;
  tips?: string[];
}

export interface CareCategory {
  slug: CareCategorySlug;
  number: string;
  title: string;
  subtitle: string;
  description: string;
  heroImage: string;
  detailImage: string;
  sections: CareSection[];
  checklist?: string[];
  warnings?: string[];
  materialsCovered: string[];
  relatedFaqSlugs: string[];
}

export const CARE_CATEGORIES: CareCategory[] = [
  // 01 - LEATHER BAGS
  {
    slug: "leather-bags",
    number: "01",
    title: "LEATHER BAGS",
    subtitle: "CARE FOR THE JOURNEY AHEAD",
    description:
      "Leather naturally develops character through use. Thoughtful handling and appropriate storage will preserve the suppleness, rich patina, and architectural silhouette of your OVIA leather piece across countless journeys.",
    heroImage: "/media/creations/handbag.jpg",
    detailImage: "/media/journey.jpg",
    materialsCovered: ["Full-Grain Bovine", "Vegetable-Tanned Leather", "Calfskin Trim"],
    sections: [
      {
        number: "01",
        title: "EVERYDAY CARE & HANDLING",
        guidance:
          "Handle your bag with clean, dry hands. Avoid placing your leather piece on abrasive surfaces, damp floors, or unpaved terrain. Rotate your pieces periodically to allow the natural fibers to breathe and recover their natural shape.",
        tips: [
          "Avoid direct friction against raw denim or dark garments to prevent pigment transfer.",
          "Keep sharp objects inside pouches to protect interior lining.",
        ],
      },
      {
        number: "02",
        title: "WATER & MOISTURE EXPOSURE",
        guidance:
          "Leather is naturally permeable. If your bag encounters unexpected rain or moisture, dab gently with a dry, clean microfibre cloth immediately. Never rub aggressively, and never apply heat sources such as hairdryers or radiators, as forced drying causes irreversible brittleness and warping.",
      },
      {
        number: "03",
        title: "SURFACE DIRT & GENTLE CLEANING",
        guidance:
          "For routine maintenance, buff surfaces softly with a dry lint-free cloth. For light superficial marks, a cloth dampened with distilled water may be smoothed in gentle circular motions. Allow the leather to dry completely at natural ambient room temperature.",
      },
      {
        number: "04",
        title: "OILS, COSMETICS & PERFUME",
        guidance:
          "Alcohol, mineral oils, cosmetics, and fragrances can degrade leather finishes and cause permanent discoloration. Ensure hand creams and perfumes are fully absorbed before carrying your piece, and secure cosmetics in a dedicated pouch.",
      },
      {
        number: "05",
        title: "COLOUR TRANSFER PREVENTION",
        guidance:
          "Light-toned leathers (such as Ivory, Chalk, and Sand) are receptive to dark pigments from indigo denim or dark suede jackets. Exercise mindfulness during initial wears, as dye transfer cannot always be completely reversed.",
      },
      {
        number: "06",
        title: "HEAT, SUNLIGHT & CLIMATE",
        guidance:
          "Prolonged exposure to direct sunlight or humid environments may fade leather dyes or dry out natural oils. Store away from south-facing windows and high-output indoor spotlights.",
      },
      {
        number: "07",
        title: "STORAGE & PRESERVING SILHOUETTE",
        guidance:
          "When resting between travels, fill your bag loosely with acid-free tissue paper to support its architectural structure. Store upright inside its breathable OVIA cotton-linen dust bag in a well-ventilated, dry setting. Never seal in airtight plastic bags.",
      },
      {
        number: "08",
        title: "HARDWARE & PALLADIUM DETAILS",
        guidance:
          "OVIA hardware is engineered from solid brass with palladium or satin-matte finishes. Polish periodically with a jewelers microfibre cloth. Avoid abrasive polishing compounds which can strip protective electroplating.",
      },
      {
        number: "09",
        title: "WHEN PROFESSIONAL ASSISTANCE IS RECOMMENDED",
        guidance:
          "Should your piece experience deep scratches, stubborn ink stains, edge-seal peeling, or loose stitching, do not attempt home chemical remedies. Entrust it to our atelier craftspeople through an OVIA Care Request.",
      },
    ],
    warnings: [
      "Never use household detergents, acetone, alcohol wipes, or saddle soap on OVIA leathers.",
      "Never machine wash or submerge in water.",
    ],
    relatedFaqSlugs: [
      "how-should-i-care-for-my-ovia-bag",
      "how-should-i-store-my-bag",
      "how-do-i-clean-my-product",
      "how-can-i-request-a-repair",
    ],
  },

  // 02 - CANVAS BAGS
  {
    slug: "canvas-bags",
    number: "02",
    title: "CANVAS BAGS",
    subtitle: "ENGINEERED RESILIENCE & TEXTILE CARE",
    description:
      "OVIA technical canvas blends high-density coated weaves with refined leather accents. Designed for durable travel, regular mindful care preserves its crisp visual texture and hydrophobic coating.",
    heroImage: "/media/creations/backpack.jpg",
    detailImage: "/media/creative.jpg",
    materialsCovered: ["Technical Coated Canvas", "Cotton-Linen Jacquard", "Water-Repellent Weaves"],
    sections: [
      {
        number: "01",
        title: "EVERYDAY CARE & DUST REMOVAL",
        guidance:
          "Brush surface dust gently using a soft, natural-bristle garment brush. Avoid scraping the canvas against coarse concrete or unvarnished timber surfaces.",
      },
      {
        number: "02",
        title: "CLEANING CANVAS SURFACES",
        guidance:
          "To clean localized spots, use a sponge lightly moistened with lukewarm water and a drop of neutral pH soap. Dab softly along the weave pattern. Rinse with clean water dampness and blot dry with a towel.",
      },
      {
        number: "03",
        title: "PRINTED SURFACES & MONOGRAM DETAILS",
        guidance:
          "Specialized archival prints on canvas should never be scrubbed or subjected to solvent-based cleaners. Treat printed areas with minimal pressure.",
      },
      {
        number: "04",
        title: "ABRASION & WEAR AT CORNERS",
        guidance:
          "The lower corners of canvas bags encounter the highest mechanical friction. Periodically check that corner leather pipings remain clean and conditioned.",
      },
      {
        number: "05",
        title: "COLOUR TRANSFER & WATER REPELLENCY",
        guidance:
          "While coated canvas is water-repellent, prolonged soaking can saturate seams. Dry damp canvas immediately in ambient air before enclosing in storage.",
      },
      {
        number: "06",
        title: "STORAGE & HARDWARE",
        guidance:
          "Enclose in the provided dust bag away from dampness. Ensure all zippers and clasps are fastened to relieve tension across the canvas weave.",
      },
    ],
    warnings: [
      "Do not dry clean, bleach, tumble dry, or iron OVIA canvas creations.",
      "Keep solvents and sanitizing gels away from technical coatings.",
    ],
    relatedFaqSlugs: [
      "what-materials-does-ovia-use",
      "how-do-i-clean-my-product",
      "how-can-i-request-a-repair",
    ],
  },

  // 03 - TRAVEL BAGS & DUFFELS
  {
    slug: "travel-bags",
    number: "03",
    title: "TRAVEL BAGS & DUFFELS",
    subtitle: "BUILT FOR THE DEMANDS OF TRANSIT",
    description:
      "From weekend getaways to transatlantic itineraries, our duffels and weekender holdalls are built to endure rigorous transit while maintaining understated luxury.",
    heroImage: "/media/spaces.jpg",
    detailImage: "/media/architecture.jpg",
    materialsCovered: ["Waterproof Ballistic Nylon", "Full-Grain Saddle Leather", "Reinforced Webbing"],
    sections: [
      {
        number: "01",
        title: "CONSIDERED PACKING & WEIGHT DISTRIBUTION",
        guidance:
          "Distribute heavy essentials along the base of your duffel to maintain structural balance. Avoid overstuffing beyond volume specifications, which strains zipper teeth and seams.",
      },
      {
        number: "02",
        title: "HANDLES & REMOVABLE SHOULDER STRAPS",
        guidance:
          "Inspect strap snap hooks and D-rings periodically. When checking a duffel as luggage, detach the shoulder strap and pack it internally to prevent baggage carousel entanglement.",
      },
      {
        number: "03",
        title: "ZIPPER FUNCTION & CARE",
        guidance:
          "Our zippers are engineered with precision teeth. When closing an abundantly packed bag, pull side panels together with one hand before advancing the zipper slider to eliminate lateral strain.",
      },
      {
        number: "04",
        title: "INTERIOR LINING SANITATION",
        guidance:
          "Vacuum interior crevices gently to remove travel debris. Wipe water-resistant nylon linings with a clean, slightly damp cloth and allow to air thoroughly before closing.",
      },
      {
        number: "05",
        title: "STORAGE BETWEEN EXPEDITIONS",
        guidance:
          "Do not compress leather-trimmed duffels beneath heavy hard-shell luggage. Lay flat or loosely pack with paper in a temperate wardrobe.",
      },
    ],
    warnings: [
      "Avoid lifting maximum-capacity duffels by single shoulder strap attachments alone when hoisting into overhead bins.",
    ],
    relatedFaqSlugs: [
      "where-are-ovia-products-designed",
      "how-should-i-store-my-bag",
      "how-can-i-request-a-repair",
    ],
  },

  // 04 - ROLLING LUGGAGE
  {
    slug: "rolling-luggage",
    number: "04",
    title: "ROLLING LUGGAGE",
    subtitle: "PRECISION ENGINEERING & LIFETIME MOBILITY",
    description:
      "Engineered from grooved anodized aluminium and lightweight virgin polycarbonate, OVIA rolling luggage combines silent multi-wheel glide with impact-absorbing security.",
    heroImage: "/media/rimowa-hero.jpg",
    detailImage: "/media/spaces.jpg",
    materialsCovered: ["Anodized Aluminium Alloy", "Virgin Polycarbonate", "Aluminium Frame Clasp"],
    checklist: [
      "Inspect 360° wheels for foreign debris, threads, or grit.",
      "Test multi-stage telescopic handle lock at each height extension.",
      "Check TSA-approved combination lock dials and latch spring action.",
      "Verify zipper teeth alignment and smooth slider travel.",
      "Ensure total packed weight does not exceed airline checked limits.",
    ],
    sections: [
      {
        number: "01",
        title: "ALUMINIUM & POLYCARBONATE SHELL CARE",
        guidance:
          "Scuffs and character marks on aluminium tell the story of your journeys. For routine cleaning, wipe the shell with a microfibre cloth dampened with warm water and mild dish soap. Remove transit sticker residues using isopropyl alcohol applied sparingly with a cloth.",
      },
      {
        number: "02",
        title: "360° DUAL BEARING WHEELS",
        guidance:
          "Keep wheel axels free of hair, lint, and sand grains after returning from transit. Rinse wheel housings with a damp cloth; do not apply petroleum lubricants directly to bearings.",
      },
      {
        number: "03",
        title: "TELESCOPIC MONO-TUBE & DUAL HANDLES",
        guidance:
          "Always press the central release button fully before extending or retracting the handle. Never use the telescopic pull-handle to lift your luggage up staircases or into luggage bins; use the reinforced leather top or side carry handles.",
      },
      {
        number: "04",
        title: "TSA COMBINATION LOCKS & LATCHES",
        guidance:
          "Ensure dials turn freely. To reset your combination, follow our official instructions or contact a Client Advisor for assistance. Never force latches closed over an overpacked frame.",
      },
      {
        number: "05",
        title: "INTERIOR COMPRESSION SYSTEM & LININGS",
        guidance:
          "Utilize the height-adjustable flex-divider system to secure belongings firmly in transit. Wipe interior linings with a damp cloth if spills occur.",
      },
    ],
    warnings: [
      "Never lift a fully loaded suitcase by the telescopic pull handle.",
      "Never use aggressive chemical solvents, acetone, or abrasive scourers on aluminium or polycarbonate shells.",
    ],
    relatedFaqSlugs: [
      "how-do-i-choose-the-correct-size",
      "how-do-i-clean-my-product",
      "how-can-i-request-a-repair",
    ],
  },

  // 05 - SMALL LEATHER GOODS
  {
    slug: "small-leather-goods",
    number: "05",
    title: "SMALL LEATHER GOODS",
    subtitle: "DAILY COMPANIONS & REFINED TOUCHPOINTS",
    description:
      "Wallets, card cases, passport covers, and pouches encounter constant tactile contact. Careful handling preserves leather elasticity and edge-paint integrity.",
    heroImage: "/media/creations/wallet.jpg",
    detailImage: "/media/creations/passport.jpg",
    materialsCovered: ["Calfskin", "Grained Leather", "Smooth Saddle Leather"],
    sections: [
      {
        number: "01",
        title: "AVOID OVERFILLING & CARD STRETCHING",
        guidance:
          "Leather card slots conform naturally to the thickness of inserted contents. Avoid forcing multiple cards into a single slot, as leather will not shrink back to its original tension.",
      },
      {
        number: "02",
        title: "PROTECTING HAND-LACQUERED EDGES",
        guidance:
          "The hand-painted edge sealant guards raw leather boundaries. Minimize friction against keys and metallic pocket items that can chip edge lacquer over time.",
      },
      {
        number: "03",
        title: "MOISTURE & COLOUR FASTNESS",
        guidance:
          "Do not carry small leather goods in saturated trouser pockets during intense exercise or downpours. Dry immediately if contacted by liquids.",
      },
      {
        number: "04",
        title: "STORAGE & ROTATION",
        guidance:
          "When rotating wallets or passport cases, store inside the original micro-dust pouch in a cool drawer.",
      },
    ],
    warnings: [
      "Avoid sitting on back-pocket wallets for prolonged intervals to prevent silhouette warping and stitching failure.",
    ],
    relatedFaqSlugs: [
      "how-should-i-care-for-my-ovia-bag",
      "how-do-i-clean-my-product",
      "can-personalised-products-be-gifted",
    ],
  },

  // 06 - ACCESSORIES
  {
    slug: "accessories",
    number: "06",
    title: "ACCESSORIES",
    subtitle: "FINISHING TOUCHES & TRAVEL COMPANIONS",
    description:
      "Luggage tags, key fobs, bespoke straps, and tech sleeves require distinct care tailored to their tactile hardware and fine leather elements.",
    heroImage: "/media/creations/jewelry.jpg",
    detailImage: "/media/creations/sunglasses.jpg",
    materialsCovered: ["Polished Metal", "Embossed Leather Tags", "Palladium Buckles"],
    sections: [
      {
        number: "01",
        title: "LUGGAGE TAG CARE & STRAP BUCKLES",
        guidance:
          "Check that luggage tag strap buckles are firmly tightened before handing bags to airline baggage handlers. Polish metal rivets with a microfibre cloth.",
      },
      {
        number: "02",
        title: "TECH SLEEVES & POUCHES",
        guidance:
          "Keep microfiber interior linings clean of abrasive grit to prevent micro-scratches on tablet or laptop glass surfaces.",
      },
      {
        number: "03",
        title: "KEY HOLDERS & HARDWARE FRICTION",
        guidance:
          "Metal contact will produce a natural softening of gloss over time. Clean contact surfaces with a dry cloth.",
      },
    ],
    warnings: [
      "Do not spray perfume or cologne directly onto leather strap accessories or metal charms.",
    ],
    relatedFaqSlugs: [
      "what-materials-does-ovia-use",
      "how-can-i-request-a-repair",
    ],
  },

  // 07 - PERSONALISED PRODUCTS
  {
    slug: "personalised-products",
    number: "07",
    title: "SPECIAL & PERSONALISED PIECES",
    subtitle: "BESPOKE MONOGRAMS & ARCHIVAL EMBOSSING",
    description:
      "Personalised OVIA pieces embody your distinct journey. Whether detailed with gold foil stamping, blind heat-debossing, or hand-painted initials, custom treatments require thoughtful attention.",
    heroImage: "/media/creations/passport.jpg",
    detailImage: "/media/creations/handbag.jpg",
    materialsCovered: ["Metallic Hot-Stamping", "Blind Debossing", "Hand-Painted Details"],
    sections: [
      {
        number: "01",
        title: "CARE FOR METALLIC FOIL & INITIALS",
        guidance:
          "Hot-stamped metallic foils (Gold, Palladium, Bronze) adhere to conditioned leather under high heat and precision pressure. Never pick at monogram edges, and avoid rubbing over foil with coarse fabrics.",
      },
      {
        number: "02",
        title: "BLIND DEBOSSING INTEGRITY",
        guidance:
          "Blind debossed initials without foil are deeply set into the leather. Keep the recess free of dust with a gentle soft brush.",
      },
      {
        number: "03",
        title: "CLEANING RESTRICTIONS OVER PERSONALISED AREAS",
        guidance:
          "Do not apply cleaning products, leather conditioners, balms, or polishes directly over personalised areas unless OVIA's official instructions specifically allow it. Solvents will dissolve foil adhesives and alter paint pigments.",
      },
      {
        number: "04",
        title: "SPECIAL FINISHES & RE-STAMPING",
        guidance:
          "If your monogram foil wears after years of faithful travel, consult an OVIA Client Advisor to determine whether atelier re-stamping is possible for your specific silhouette.",
      },
    ],
    warnings: [
      "CRITICAL: Do not apply cleaning products, alcohol, or leather balms directly over personalised areas.",
    ],
    relatedFaqSlugs: [
      "can-personalised-products-be-returned",
      "how-does-ovia-personalisation-work",
      "can-ovia-products-be-personalised",
      "how-do-i-request-personalisation",
    ],
  },
];

// --------------------------------------------------
// HELPERS
// --------------------------------------------------

export function getAllCareCategories(): CareCategory[] {
  return CARE_CATEGORIES;
}

export function getCareCategoryBySlug(slug: string): CareCategory | undefined {
  return CARE_CATEGORIES.find((cat) => cat.slug === slug);
}

/**
 * Resolves product material or department to the matching care guide slug.
 */
export function getCareSlugForProduct(material?: string, department?: string): CareCategorySlug {
  const m = (material || "").toLowerCase();
  const d = (department || "").toLowerCase();

  if (d === "luggage" || m.includes("aluminium") || m.includes("polycarbonate")) {
    return "rolling-luggage";
  }
  if (m.includes("canvas") || m.includes("cotton") || m.includes("jacquard")) {
    return "canvas-bags";
  }
  if (d === "accessories" || m.includes("palladium") || m.includes("metal")) {
    return "accessories";
  }
  if (m.includes("nylon") || d.includes("duffel") || d.includes("travel")) {
    return "travel-bags";
  }
  if (m.includes("wallet") || m.includes("card") || m.includes("small leather")) {
    return "small-leather-goods";
  }
  return "leather-bags";
}
