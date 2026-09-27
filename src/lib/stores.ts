export interface OviaStore {
  id: string;
  name: string;
  slug: string;
  area: string;
  city: string;
  state: string;
  country: "India";
  postalCode: string;
  address: string;
  latitude: number;
  longitude: number;
  openingHours: {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
  };
  todayHours: string;
  services: string[];
  image: string;
  phone: string;
  email: string;
  isDemo: true;
}

export const STORE_SERVICES = [
  "Bags",
  "Travel",
  "Personalisation",
  "Product Care",
  "Repairs",
  "Click & Collect",
  "Client Advisor",
] as const;

export type StoreService = (typeof STORE_SERVICES)[number];

export const stores: OviaStore[] = [
  {
    id: "mumbai-jio-world-drive",
    name: "OVIA Mumbai — Jio World Drive",
    slug: "ovia-mumbai-jio-world-drive",
    area: "Bandra Kurla Complex",
    city: "Mumbai",
    state: "Maharashtra",
    country: "India",
    postalCode: "400051",
    address: "Unit 08, Ground Level, Jio World Drive, Bandra Kurla Complex, Mumbai, Maharashtra 400051",
    latitude: 19.0664,
    longitude: 72.8687,
    openingHours: {
      monday: "11:00 AM – 8:00 PM",
      tuesday: "11:00 AM – 8:00 PM",
      wednesday: "11:00 AM – 8:00 PM",
      thursday: "11:00 AM – 8:00 PM",
      friday: "11:00 AM – 8:00 PM",
      saturday: "11:00 AM – 9:00 PM",
      sunday: "11:00 AM – 8:00 PM",
    },
    todayHours: "11:00 AM – 8:00 PM",
    services: ["Bags", "Travel", "Personalisation", "Product Care", "Repairs", "Click & Collect", "Client Advisor"],
    image: "/media/spaces.jpg",
    phone: "+91 22 6900 8011",
    email: "client.jioworld@ovia-luxury.demo",
    isDemo: true,
  },
  {
    id: "mumbai-palladium",
    name: "OVIA Mumbai — Palladium",
    slug: "ovia-mumbai-palladium",
    area: "Lower Parel",
    city: "Mumbai",
    state: "Maharashtra",
    country: "India",
    postalCode: "400013",
    address: "First Floor, High Street Phoenix, Palladium Mall, Lower Parel, Mumbai, Maharashtra 400013",
    latitude: 18.9950,
    longitude: 72.8247,
    openingHours: {
      monday: "11:00 AM – 8:00 PM",
      tuesday: "11:00 AM – 8:00 PM",
      wednesday: "11:00 AM – 8:00 PM",
      thursday: "11:00 AM – 8:00 PM",
      friday: "11:00 AM – 8:00 PM",
      saturday: "11:00 AM – 9:00 PM",
      sunday: "11:00 AM – 8:00 PM",
    },
    todayHours: "11:00 AM – 8:00 PM",
    services: ["Bags", "Travel", "Personalisation", "Product Care", "Click & Collect", "Client Advisor"],
    image: "/media/spaces.jpg",
    phone: "+91 22 6900 8012",
    email: "client.palladium@ovia-luxury.demo",
    isDemo: true,
  },
  {
    id: "delhi-vasant-kunj",
    name: "OVIA New Delhi — Vasant Kunj",
    slug: "ovia-new-delhi-vasant-kunj",
    area: "Vasant Kunj",
    city: "New Delhi",
    state: "Delhi",
    country: "India",
    postalCode: "110070",
    address: "Upper Ground Floor, DLF Emporio, Nelson Mandela Marg, Vasant Kunj, New Delhi, Delhi 110070",
    latitude: 28.5283,
    longitude: 77.1558,
    openingHours: {
      monday: "11:00 AM – 8:00 PM",
      tuesday: "11:00 AM – 8:00 PM",
      wednesday: "11:00 AM – 8:00 PM",
      thursday: "11:00 AM – 8:00 PM",
      friday: "11:00 AM – 8:00 PM",
      saturday: "11:00 AM – 9:00 PM",
      sunday: "11:00 AM – 8:00 PM",
    },
    todayHours: "11:00 AM – 8:00 PM",
    services: ["Bags", "Travel", "Personalisation", "Product Care", "Repairs", "Client Advisor"],
    image: "/media/spaces.jpg",
    phone: "+91 11 6900 8021",
    email: "client.vasantkunj@ovia-luxury.demo",
    isDemo: true,
  },
  {
    id: "delhi-connaught-place",
    name: "OVIA New Delhi — Connaught Place",
    slug: "ovia-new-delhi-connaught-place",
    area: "Connaught Place",
    city: "New Delhi",
    state: "Delhi",
    country: "India",
    postalCode: "110001",
    address: "Radial Road 4, Inner Circle Block E, Connaught Place, New Delhi, Delhi 110001",
    latitude: 28.6328,
    longitude: 77.2197,
    openingHours: {
      monday: "11:00 AM – 8:00 PM",
      tuesday: "11:00 AM – 8:00 PM",
      wednesday: "11:00 AM – 8:00 PM",
      thursday: "11:00 AM – 8:00 PM",
      friday: "11:00 AM – 8:00 PM",
      saturday: "11:00 AM – 9:00 PM",
      sunday: "11:00 AM – 8:00 PM",
    },
    todayHours: "11:00 AM – 8:00 PM",
    services: ["Bags", "Travel", "Click & Collect", "Client Advisor"],
    image: "/media/spaces.jpg",
    phone: "+91 11 6900 8022",
    email: "client.cp@ovia-luxury.demo",
    isDemo: true,
  },
  {
    id: "bengaluru-ub-city",
    name: "OVIA Bengaluru — UB City",
    slug: "ovia-bengaluru-ub-city",
    area: "UB City",
    city: "Bengaluru",
    state: "Karnataka",
    country: "India",
    postalCode: "560001",
    address: "The Collection, Level 1, UB City, 24 Vittal Mallya Road, Bengaluru, Karnataka 560001",
    latitude: 12.9716,
    longitude: 77.5962,
    openingHours: {
      monday: "11:00 AM – 8:00 PM",
      tuesday: "11:00 AM – 8:00 PM",
      wednesday: "11:00 AM – 8:00 PM",
      thursday: "11:00 AM – 8:00 PM",
      friday: "11:00 AM – 8:00 PM",
      saturday: "11:00 AM – 9:00 PM",
      sunday: "11:00 AM – 8:00 PM",
    },
    todayHours: "11:00 AM – 8:00 PM",
    services: ["Bags", "Travel", "Personalisation", "Product Care", "Repairs", "Click & Collect", "Client Advisor"],
    image: "/media/spaces.jpg",
    phone: "+91 80 6900 8031",
    email: "client.ubcity@ovia-luxury.demo",
    isDemo: true,
  },
  {
    id: "hyderabad-banjara-hills",
    name: "OVIA Hyderabad — Banjara Hills",
    slug: "ovia-hyderabad-banjara-hills",
    area: "Banjara Hills",
    city: "Hyderabad",
    state: "Telangana",
    country: "India",
    postalCode: "500034",
    address: "Road No. 10, Banjara Hills, near GVK One, Hyderabad, Telangana 500034",
    latitude: 17.4156,
    longitude: 78.4354,
    openingHours: {
      monday: "11:00 AM – 8:00 PM",
      tuesday: "11:00 AM – 8:00 PM",
      wednesday: "11:00 AM – 8:00 PM",
      thursday: "11:00 AM – 8:00 PM",
      friday: "11:00 AM – 8:00 PM",
      saturday: "11:00 AM – 9:00 PM",
      sunday: "11:00 AM – 8:00 PM",
    },
    todayHours: "11:00 AM – 8:00 PM",
    services: ["Bags", "Travel", "Personalisation", "Product Care", "Client Advisor"],
    image: "/media/spaces.jpg",
    phone: "+91 40 6900 8041",
    email: "client.banjarahills@ovia-luxury.demo",
    isDemo: true,
  },
  {
    id: "pune-koregaon-park",
    name: "OVIA Pune — Koregaon Park",
    slug: "ovia-pune-koregaon-park",
    area: "Koregaon Park",
    city: "Pune",
    state: "Maharashtra",
    country: "India",
    postalCode: "411001",
    address: "Lane 6, North Main Road, Koregaon Park, Pune, Maharashtra 411001",
    latitude: 18.5362,
    longitude: 73.8940,
    openingHours: {
      monday: "11:00 AM – 8:00 PM",
      tuesday: "11:00 AM – 8:00 PM",
      wednesday: "11:00 AM – 8:00 PM",
      thursday: "11:00 AM – 8:00 PM",
      friday: "11:00 AM – 8:00 PM",
      saturday: "11:00 AM – 9:00 PM",
      sunday: "11:00 AM – 8:00 PM",
    },
    todayHours: "11:00 AM – 8:00 PM",
    services: ["Bags", "Travel", "Personalisation", "Product Care", "Repairs", "Client Advisor"],
    image: "/media/spaces.jpg",
    phone: "+91 20 6900 8051",
    email: "client.pune@ovia-luxury.demo",
    isDemo: true,
  },
  {
    id: "chennai-nungambakkam",
    name: "OVIA Chennai — Nungambakkam",
    slug: "ovia-chennai-nungambakkam",
    area: "Nungambakkam",
    city: "Chennai",
    state: "Tamil Nadu",
    country: "India",
    postalCode: "600006",
    address: "Khader Nawaz Khan Road, Nungambakkam, Chennai, Tamil Nadu 600006",
    latitude: 13.0604,
    longitude: 80.2443,
    openingHours: {
      monday: "11:00 AM – 8:00 PM",
      tuesday: "11:00 AM – 8:00 PM",
      wednesday: "11:00 AM – 8:00 PM",
      thursday: "11:00 AM – 8:00 PM",
      friday: "11:00 AM – 8:00 PM",
      saturday: "11:00 AM – 9:00 PM",
      sunday: "11:00 AM – 8:00 PM",
    },
    todayHours: "11:00 AM – 8:00 PM",
    services: ["Bags", "Travel", "Personalisation", "Client Advisor"],
    image: "/media/spaces.jpg",
    phone: "+91 44 6900 8061",
    email: "client.chennai@ovia-luxury.demo",
    isDemo: true,
  },
  {
    id: "kolkata-park-street",
    name: "OVIA Kolkata — Park Street",
    slug: "ovia-kolkata-park-street",
    area: "Park Street",
    city: "Kolkata",
    state: "West Bengal",
    country: "India",
    postalCode: "700016",
    address: "Heritage Square, Park Street (Mother Teresa Sarani), Kolkata, West Bengal 700016",
    latitude: 22.5513,
    longitude: 88.3526,
    openingHours: {
      monday: "11:00 AM – 8:00 PM",
      tuesday: "11:00 AM – 8:00 PM",
      wednesday: "11:00 AM – 8:00 PM",
      thursday: "11:00 AM – 8:00 PM",
      friday: "11:00 AM – 8:00 PM",
      saturday: "11:00 AM – 9:00 PM",
      sunday: "11:00 AM – 8:00 PM",
    },
    todayHours: "11:00 AM – 8:00 PM",
    services: ["Bags", "Travel", "Product Care", "Client Advisor"],
    image: "/media/spaces.jpg",
    phone: "+91 33 6900 8071",
    email: "client.kolkata@ovia-luxury.demo",
    isDemo: true,
  },
  {
    id: "ahmedabad-sg-highway",
    name: "OVIA Ahmedabad — SG Highway",
    slug: "ovia-ahmedabad-sg-highway",
    area: "SG Highway",
    city: "Ahmedabad",
    state: "Gujarat",
    country: "India",
    postalCode: "380054",
    address: "Gallops Terrace, Bodakdev, SG Highway, Ahmedabad, Gujarat 380054",
    latitude: 23.0373,
    longitude: 72.5085,
    openingHours: {
      monday: "11:00 AM – 8:00 PM",
      tuesday: "11:00 AM – 8:00 PM",
      wednesday: "11:00 AM – 8:00 PM",
      thursday: "11:00 AM – 8:00 PM",
      friday: "11:00 AM – 8:00 PM",
      saturday: "11:00 AM – 9:00 PM",
      sunday: "11:00 AM – 8:00 PM",
    },
    todayHours: "11:00 AM – 8:00 PM",
    services: ["Bags", "Travel", "Personalisation", "Click & Collect", "Client Advisor"],
    image: "/media/spaces.jpg",
    phone: "+91 79 6900 8081",
    email: "client.ahmedabad@ovia-luxury.demo",
    isDemo: true,
  },
  {
    id: "jaipur-c-scheme",
    name: "OVIA Jaipur — C-Scheme",
    slug: "ovia-jaipur-c-scheme",
    area: "C-Scheme",
    city: "Jaipur",
    state: "Rajasthan",
    country: "India",
    postalCode: "302001",
    address: "Prithviraj Road, Ashok Nagar, C-Scheme, Jaipur, Rajasthan 302001",
    latitude: 26.9112,
    longitude: 75.8015,
    openingHours: {
      monday: "11:00 AM – 8:00 PM",
      tuesday: "11:00 AM – 8:00 PM",
      wednesday: "11:00 AM – 8:00 PM",
      thursday: "11:00 AM – 8:00 PM",
      friday: "11:00 AM – 8:00 PM",
      saturday: "11:00 AM – 9:00 PM",
      sunday: "11:00 AM – 8:00 PM",
    },
    todayHours: "11:00 AM – 8:00 PM",
    services: ["Bags", "Travel", "Personalisation", "Client Advisor"],
    image: "/media/spaces.jpg",
    phone: "+91 141 6900 8091",
    email: "client.jaipur@ovia-luxury.demo",
    isDemo: true,
  },
  {
    id: "chandigarh-sector-17",
    name: "OVIA Chandigarh — Sector 17",
    slug: "ovia-chandigarh-sector-17",
    area: "Sector 17",
    city: "Chandigarh",
    state: "Chandigarh",
    country: "India",
    postalCode: "160017",
    address: "Piazza promenade, City Centre, Sector 17, Chandigarh 160017",
    latitude: 30.7415,
    longitude: 76.7854,
    openingHours: {
      monday: "11:00 AM – 8:00 PM",
      tuesday: "11:00 AM – 8:00 PM",
      wednesday: "11:00 AM – 8:00 PM",
      thursday: "11:00 AM – 8:00 PM",
      friday: "11:00 AM – 8:00 PM",
      saturday: "11:00 AM – 9:00 PM",
      sunday: "11:00 AM – 8:00 PM",
    },
    todayHours: "11:00 AM – 8:00 PM",
    services: ["Bags", "Travel", "Product Care", "Click & Collect", "Client Advisor"],
    image: "/media/spaces.jpg",
    phone: "+91 172 6900 8101",
    email: "client.chandigarh@ovia-luxury.demo",
    isDemo: true,
  },
  {
    id: "kochi-edappally",
    name: "OVIA Kochi — Edappally",
    slug: "ovia-kochi-edappally",
    area: "Edappally",
    city: "Kochi",
    state: "Kerala",
    country: "India",
    postalCode: "682024",
    address: "NH 66 Bypass Junction, Edappally, Kochi, Kerala 682024",
    latitude: 10.0261,
    longitude: 76.3085,
    openingHours: {
      monday: "11:00 AM – 8:00 PM",
      tuesday: "11:00 AM – 8:00 PM",
      wednesday: "11:00 AM – 8:00 PM",
      thursday: "11:00 AM – 8:00 PM",
      friday: "11:00 AM – 8:00 PM",
      saturday: "11:00 AM – 9:00 PM",
      sunday: "11:00 AM – 8:00 PM",
    },
    todayHours: "11:00 AM – 8:00 PM",
    services: ["Bags", "Travel", "Personalisation", "Product Care", "Client Advisor"],
    image: "/media/spaces.jpg",
    phone: "+91 484 6900 8111",
    email: "client.kochi@ovia-luxury.demo",
    isDemo: true,
  },
  {
    id: "lucknow-gomti-nagar",
    name: "OVIA Lucknow — Gomti Nagar",
    slug: "ovia-lucknow-gomti-nagar",
    area: "Gomti Nagar",
    city: "Lucknow",
    state: "Uttar Pradesh",
    country: "India",
    postalCode: "226010",
    address: "Vibhuti Khand, Gomti Nagar Boulevard, Lucknow, Uttar Pradesh 226010",
    latitude: 26.8532,
    longitude: 80.9995,
    openingHours: {
      monday: "11:00 AM – 8:00 PM",
      tuesday: "11:00 AM – 8:00 PM",
      wednesday: "11:00 AM – 8:00 PM",
      thursday: "11:00 AM – 8:00 PM",
      friday: "11:00 AM – 8:00 PM",
      saturday: "11:00 AM – 9:00 PM",
      sunday: "11:00 AM – 8:00 PM",
    },
    todayHours: "11:00 AM – 8:00 PM",
    services: ["Bags", "Travel", "Personalisation", "Repairs", "Client Advisor"],
    image: "/media/spaces.jpg",
    phone: "+91 522 6900 8121",
    email: "client.lucknow@ovia-luxury.demo",
    isDemo: true,
  },
  {
    id: "goa-panjim",
    name: "OVIA Goa — Panjim",
    slug: "ovia-goa-panjim",
    area: "Panjim",
    city: "Panaji",
    state: "Goa",
    country: "India",
    postalCode: "403001",
    address: "Campal Waterfront, MG Road, Panaji, Goa 403001",
    latitude: 15.4989,
    longitude: 73.8278,
    openingHours: {
      monday: "11:00 AM – 8:00 PM",
      tuesday: "11:00 AM – 8:00 PM",
      wednesday: "11:00 AM – 8:00 PM",
      thursday: "11:00 AM – 8:00 PM",
      friday: "11:00 AM – 8:00 PM",
      saturday: "11:00 AM – 9:00 PM",
      sunday: "11:00 AM – 8:00 PM",
    },
    todayHours: "11:00 AM – 8:00 PM",
    services: ["Bags", "Travel", "Personalisation", "Product Care", "Client Advisor"],
    image: "/media/spaces.jpg",
    phone: "+91 832 6900 8131",
    email: "client.goa@ovia-luxury.demo",
    isDemo: true,
  },
];

// Compatibility single-store export for legacy components if needed
export const store = stores[0];

export function getStoreBySlug(slug: string): OviaStore | undefined {
  return stores.find((s) => s.slug === slug);
}

export function getDirectionsUrl(store: OviaStore): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${store.latitude},${store.longitude}`;
}

export const directionsUrl = getDirectionsUrl(store);

export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export function matchesStore(query: string, storeItem: OviaStore = store): boolean {
  if (!query.trim()) return true;
  const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
  const target = normalize(
    `${storeItem.name} ${storeItem.address} ${storeItem.city} ${storeItem.state} ${storeItem.area} ${storeItem.postalCode} India`
  );
  return target.includes(normalize(query));
}
