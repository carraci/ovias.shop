export interface MegaNavColumn {
  title: string;
  links: { label: string; href: string }[];
}

export interface MegaProductCard {
  name: string;
  subtitle: string;
  image: string;
  href: string;
}

export interface MegaVisualCard {
  name: string;
  image: string;
  href: string;
}

export interface MegaInspirationalCard {
  title: string;
  subtitle: string;
  image: string;
  href: string;
}

export const newMegaCards: MegaInspirationalCard[] = [
  {
    title: "Original Bags",
    subtitle: "Discover the latest products",
    image: "/media/megamenu/mega-new-original-bags.webp",
    href: "/bags",
  },
  {
    title: "Never Still",
    subtitle: "A new palette of colours",
    image: "/media/megamenu/mega-new-never-still.webp",
    href: "/bags/backpacks",
  },
  {
    title: "Distinct",
    subtitle: "Introducing the Anthracite colour",
    image: "/media/megamenu/mega-new-distinct.webp",
    href: "/products/distinct-cabin",
  },
];

export const luggageMegaData = {
  columns: [
    {
      title: "CATEGORIES",
      links: [
        { label: "Trunk", href: "/luggage/trunk" },
        { label: "Check-In", href: "/luggage/check-in" },
        { label: "Cabin", href: "/luggage/cabin" },
        { label: "Emblematic pieces", href: "/luggage/emblematic-pieces" },
        { label: "See all luggage", href: "/luggage" },
      ],
    },
    {
      title: "TRAVEL TYPE",
      links: [
        { label: "Long haul", href: "/collections/long-haul" },
        { label: "Short trips", href: "/collections/short-trips" },
        { label: "Business selection", href: "/collections/business-selection" },
      ],
    },
    {
      title: "FAVOURITES",
      links: [
        { label: "Polycarbonate", href: "/luggage?material=Polycarbonate" },
        { label: "Aluminium", href: "/luggage?material=Aluminium" },
        { label: "Leather", href: "/luggage?material=Leather" },
        { label: "Silver luggage", href: "/luggage?color=Silver" },
        { label: "Black luggage", href: "/luggage?color=Black" },
        { label: "Blue luggage", href: "/luggage?color=Midnight+Blue" },
      ],
    },
    {
      title: "HIGHLIGHTS",
      links: [
        { label: "For a Lifetime of Lives", href: "/heritage" },
        { label: "Customise", href: "/personalise" },
        { label: "All gifts", href: "/collections/gifts" },
        { label: "Size range by collection", href: "/size-guide" },
      ],
    },
  ],
  products: [
    {
      name: "Original",
      subtitle: "The aluminium icon",
      image: "/media/megamenu/mega-luggage-original.webp",
      href: "/products/original-cabin",
    },
    {
      name: "Essential",
      subtitle: "Practical and lightweight polycarbonate",
      image: "/media/megamenu/mega-luggage-essential.webp",
      href: "/products/essential-cabin",
    },
    {
      name: "Classic",
      subtitle: "Timeless aluminium design",
      image: "/media/megamenu/mega-luggage-classic.webp",
      href: "/products/classic-cabin",
    },
    {
      name: "Essential Sleeve",
      subtitle: "The versatile cabin companion",
      image: "/media/megamenu/mega-luggage-essential-sleeve.webp",
      href: "/products/essential-sleeve-cabin",
    },
    {
      name: "Distinct",
      subtitle: "An elegant leather cabin",
      image: "/media/megamenu/mega-luggage-distinct.webp",
      href: "/products/distinct-cabin",
    },
    {
      name: "Hybrid",
      subtitle: "An aluminium and polycarbonate union",
      image: "/media/megamenu/mega-luggage-hybrid.webp",
      href: "/products/hybrid-cabin",
    },
    {
      name: "Essential Lite",
      subtitle: "Exceptionally lightweight polycarbonate",
      image: "/media/megamenu/mega-luggage-essential-lite.webp",
      href: "/products/essential-lite-cabin",
    },
  ],
  allCollectionsHref: "/luggage",
};

export const bagsMegaData = {
  columns: [
    {
      title: "CATEGORIES",
      links: [
        { label: "Backpacks", href: "/bags/backpacks" },
        { label: "Duffle Bags", href: "/bags/duffle-bags" },
        { label: "Briefcases", href: "/bags/briefcases" },
        { label: "Crossbodies", href: "/bags/crossbodies" },
        { label: "Totes", href: "/bags/totes" },
        { label: "Shoulder Bags", href: "/bags/shoulder-bags" },
        { label: "Hand Carry", href: "/bags/hand-carry" },
        { label: "See all shapes", href: "/bags?view=catalog" },
      ],
    },
    {
      title: "FAVOURITES",
      links: [
        { label: "Business Bags", href: "/bags?use=business" },
        { label: "Aluminium", href: "/bags?material=Aluminium" },
        { label: "Travel Bags", href: "/bags?use=travel" },
        { label: "Leather", href: "/bags?material=Leather" },
        { label: "Nylon", href: "/bags?material=Nylon" },
      ],
    },
    {
      title: "HIGHLIGHTS",
      links: [
        { label: "A Life of Mobility", href: "/discover" },
        { label: "Everyday mobility", href: "/collections/everyday-mobility" },
        { label: "Bag Straps", href: "/accessories/bag-straps" },
        { label: "All gifts", href: "/collections/gifts" },
        { label: "Emblematic pieces", href: "/bags?collection=emblematic" },
      ],
    },
  ],
  products: [
    {
      name: "Never Still",
      subtitle: "Functional designs for daily life",
      image: "/media/bags/never-still-canvas-flap-backpack-large.png",
      href: "/product/never-still-backpack",
    },
    {
      name: "Original",
      subtitle: "An aluminium companion for any occasion",
      image: "/media/showcase/iconic-2-original-bag.png",
      href: "/product/original-compact",
    },
    {
      name: "Groove",
      subtitle: "Elegant bags with purpose",
      image: "/media/bags/groove-leather-shopping-bag.png",
      href: "/product/groove-crossbody",
    },
    {
      name: "Personal",
      subtitle: "Portable pieces in iconic materials",
      image: "/media/bags/personal-polycarbonate-cross-body-bag.png",
      href: "/product/personal-crossbody",
    },
    {
      name: "Attaché",
      subtitle: "The aluminium minimalist briefcase",
      image: "/media/bags/never-still-leather-briefcase.png",
      href: "/product/attache-case",
    },
  ],
  allCollectionsHref: "/bags",
};

export const accessoriesMegaData = {
  columns: [
    {
      title: "LIFESTYLE",
      links: [
        { label: "iPhone Cases", href: "/accessories/iphone-cases" },
        { label: "Hats", href: "/accessories/hats" },
        { label: "Sunglasses", href: "/accessories/sunglasses" },
        { label: "Belts", href: "/accessories/belts" },
        { label: "Card Holders", href: "/accessories/card-holders" },
        { label: "See all", href: "/accessories" },
      ],
    },
    {
      title: "CUSTOMISATION",
      links: [
        { label: "Address Tags", href: "/accessories/address-tags" },
        { label: "Wheels", href: "/accessories/wheels" },
        { label: "Stickers", href: "/accessories/stickers" },
        { label: "Bag Straps", href: "/accessories/bag-straps" },
        { label: "See all", href: "/accessories?category=customisation" },
      ],
    },
    {
      title: "TRAVEL",
      links: [
        { label: "Organisers", href: "/accessories/organisers" },
        { label: "Pet Carrier Bag", href: "/accessories/pet-carrier-bag" },
        { label: "Foldable Bags", href: "/accessories/foldable-bags" },
        { label: "Garment Bags", href: "/accessories/garment-bags" },
        { label: "See all", href: "/accessories?category=travel" },
      ],
    },
    {
      title: "HIGHLIGHTS",
      links: [
        { label: "Everyday mobility", href: "/collections/everyday-mobility" },
        { label: "Care Products", href: "/accessories/care-products" },
      ],
    },
  ],
  visualCards: [
    {
      name: "Customisation",
      image: "/media/cart/rec-luggage-tag.png",
      href: "/accessories/address-tags",
    },
    {
      name: "Travel",
      image: "/media/cart/rec-packing-case.png",
      href: "/accessories/organisers",
    },
    {
      name: "Lifestyle",
      image: "/media/accessories-prod-tech.jpg",
      href: "/accessories/iphone-cases",
    },
    {
      name: "Care",
      image: "/media/accessories-prod-bottle.jpg",
      href: "/accessories/care-products",
    },
  ],
};
