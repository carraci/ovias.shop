
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
        { label: "Cabin Luggage", href: "/luggage/cabin-luggage" },
        { label: "Check-in Luggage", href: "/luggage/check-in-luggage" },
        { label: "Large Luggage", href: "/luggage/large-luggage" },
        { label: "Medium Luggage", href: "/luggage/medium-luggage" },
        { label: "Small Luggage", href: "/luggage/small-luggage" },
        { label: "See All Luggage", href: "/luggage" },
      ],
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
        { label: "Tote Bags", href: "/bags/tote-bags" },
        { label: "Crossbody Bags", href: "/bags/crossbody-bags" },
        { label: "Shoulder Bags", href: "/bags/shoulder-bags" },
        { label: "Duffel Bags", href: "/bags/duffel-bags" },
        { label: "Briefcases", href: "/bags/briefcases" },
        { label: "Weekend Bags", href: "/bags/weekend-bags" },
        { label: "Travel Bags", href: "/bags/travel-bags" },
        { label: "See All Bags", href: "/bags" },
      ],
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
