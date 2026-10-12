export type EventCategory =
  | "All Stories"
  | "Events"
  | "Launches"
  | "Experiences"
  | "Collections"
  | "Exhibition";

export type EventStatus = "Upcoming" | "Active" | "Completed" | "Draft";

export interface OviaEvent {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: EventCategory;
  location: string;
  date: string;
  image: string;
  gallery: string[];
  description: string;
  content?: string;
  details: string[];
  status: EventStatus;
  featured?: boolean;
  author?: string;
  readingTime?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const defaultEvents: OviaEvent[] = [
  {
    id: "an-evening-with-ovia",
    slug: "an-evening-with-ovia",
    title: "An Evening with OVIA",
    subtitle: "An exploration of design, movement and the art of travel.",
    category: "Experiences",
    location: "Palazzo Bocconi, Corso Venezia, Milan",
    date: "October 24, 2026",
    image: "/media/editorial-events.jpg",
    gallery: [
      "/media/editorial-events.jpg",
      "/media/spaces.jpg",
      "/media/editorial-collection.jpg",
      "/media/craftsmanship-artisan-detail.jpg",
    ],
    description:
      "An intimate evening bringing together architects, industrial designers, and patrons to explore the nuances of considered travel, understated luxury, and modern mobility.",
    content: `Set within the historic arcades of Palazzo Bocconi, An Evening with OVIA offered an immersive meditation on the rituals of departure and arrival. 

Guests were invited to experience the tactile poetry of anodized aluminium, hand-finished full-grain leathers, and precision-engineered mobility components. The evening unfolded not as a presentation, but as a salon—where conversations ranged from aviation aesthetics to the changing nature of contemplative travel.

Each installation throughout the palazzo celebrated the quiet friction between permanence and movement: cases sculpted to withstand decades of worldwide passage, displayed alongside archival blueprints and soundscapes captured on long-haul routes.

As dinner commenced by candlelight under the frescoed vaulted ceilings, the dialogue turned to what it means to create travel goods that outlive seasons, trends, and itineraries. OVIA remains committed to the principle that the finest objects are those that become silent companions to life's most transformative destinations.`,
    details: [
      "Keynote salon on spatial minimalism & transit architecture",
      "Private exhibition of archival prototypes & material tests",
      "Hands-on demonstration of saddle-stitched leather edge work",
      "Limited edition exhibition monograph presented to guests",
    ],
    status: "Completed",
    featured: true,
    author: "OVIA Editorial Desk",
    readingTime: "4 min read",
    createdAt: "2026-09-01T12:00:00Z",
    updatedAt: "2026-10-10T15:30:00Z",
  },
  {
    id: "a-new-perspective-on-travel",
    slug: "a-new-perspective-on-travel",
    title: "A New Perspective on Travel",
    subtitle: "A collection of moments and sculpted objects created for modern destinations.",
    category: "Collections",
    location: "OVIA Atelier Pavilion, Zurich",
    date: "September 18, 2026",
    image: "/media/pedestal-3d-display.jpg",
    gallery: [
      "/media/pedestal-3d-display.jpg",
      "/media/material-aluminium.jpg",
      "/media/creative.jpg",
    ],
    description:
      "A spatial exhibition presenting the architectural evolution of the OVIA cabin luggage and daypack collections in monochromatic white-cube pavilions.",
    content: `Travel has evolved from mere relocation into a conscious state of perception. In Zurich, OVIA unveiled an experimental installation that stripped luggage back to pure geometric harmony.

Mounted on floating limestone pedestals, the signature grooved aluminium cases and structured backpacks were presented as functional sculptures. Lighting calibrated to mirror dawn and twilight cast subtle linear shadows along the metallic contours, emphasizing the millimeter-level tolerances of each seam.

"We wanted guests to observe luggage the way an industrial designer observes an aircraft wing," explains the design team. "Every curve exists for structural integrity, every rivet for durability, and every handle for intuitive ergonomic grace."`,
    details: [
      "Monochromatic sculptural exhibition",
      "Tactile breakdown of 0.8mm aerospace aluminium alloys",
      "Acoustic chamber demonstrating silent multi-wheel glide",
    ],
    status: "Completed",
    featured: false,
    author: "OVIA Design Lab",
    readingTime: "3 min read",
    createdAt: "2026-08-15T10:00:00Z",
    updatedAt: "2026-09-20T11:00:00Z",
  },
  {
    id: "the-art-of-gathering",
    slug: "the-art-of-gathering",
    title: "The Art of Gathering",
    subtitle: "Reflections on companionship, shared dinners, and stories born upon arrival.",
    category: "Experiences",
    location: "Palazzo Corsini, Florence",
    date: "August 30, 2026",
    image: "/media/contact-ambassador.jpg",
    gallery: [
      "/media/contact-ambassador.jpg",
      "/media/spaces.jpg",
      "/media/journey.jpg",
    ],
    description:
      "An intimate salon on the banks of the Arno, celebrating the writers, photographers, and travelers who document the unseen texture of journeys.",
    content: `True luxury is found in presence—in the lingering conversations that follow long journeys across oceans. In Florence, OVIA hosted a banquet celebrating the art of gathering.

Surrounded by Renaissance stonework and warm taper candles, guests shared reflections on the solitary hours of departure and the rich warmth of arrival. Travel is inherently collaborative; even our personal luggage carries memories collected from porter carts, train compartments, and foreign lobbies.

The evening commemorated the launch of OVIA's global cultural series, ensuring that the brand remains not only a purveyor of exceptional goods, but a patron of the stories that elevate our world.`,
    details: [
      "Banquet by candlelight overlooking the Arno river",
      "Readings from commissioned travel journals",
      "Preview of upcoming seasonal leather patinas",
    ],
    status: "Completed",
    featured: false,
    author: "Elena Rostova",
    readingTime: "3 min read",
    createdAt: "2026-07-20T14:00:00Z",
    updatedAt: "2026-09-02T16:00:00Z",
  },
  {
    id: "milan-design-week-2027",
    slug: "milan-design-week-2027",
    title: "The Kinetic Pavilion — Milan Design Week",
    subtitle: "Future OVIA Experiences exploring velocity, stillness, and lightweight structures.",
    category: "Events",
    location: "Corso Venezia, Milan",
    date: "April 13 – 18, 2027",
    image: "/media/spaces.jpg",
    gallery: ["/media/spaces.jpg", "/media/material-aluminium.jpg"],
    description:
      "A forthcoming large-scale public pavilion featuring monumental rotating aluminium louvers and bespoke soundscapes created in collaboration with sonic artists.",
    content: `Announcements and formal invitations for the Milan 2027 Kinetic Pavilion will be released to registered patrons and clients in early spring.`,
    details: [
      "Open to the public during Milan Design Week",
      "Private preview registration opening March 2027",
      "Interactive material library and bespoke catalog release",
    ],
    status: "Upcoming",
    featured: false,
    author: "OVIA Curatorial",
    readingTime: "2 min read",
    createdAt: "2026-09-10T09:00:00Z",
    updatedAt: "2026-10-01T10:00:00Z",
  },
  {
    id: "atelier-residency-tokyo",
    slug: "atelier-residency-tokyo",
    title: "In Motion: The Tokyo Atelier Residency",
    subtitle: "A temporary conceptual space devoted to bespoke leatherwork and travel rituals.",
    category: "Launches",
    location: "Ginza, Tokyo",
    date: "May 20 – June 15, 2027",
    image: "/media/creative.jpg",
    gallery: ["/media/creative.jpg", "/media/craftsmanship-artisan-detail.jpg"],
    description:
      "A quiet sanctuary in Tokyo offering live monogramming, hot-stamping, and custom bag straps crafted by visiting master artisans.",
    content: `OVIA returns to Tokyo with a month-long residency exploring the union of Japanese craftsmanship and European luggage heritage.`,
    details: [
      "Bespoke hot-stamping and custom leather strap tailoring",
      "Limited Tokyo Edition luggage tag release",
      "Curated travel literature corner",
    ],
    status: "Upcoming",
    featured: false,
    author: "OVIA Press",
    readingTime: "2 min read",
    createdAt: "2026-09-25T11:00:00Z",
    updatedAt: "2026-10-05T12:00:00Z",
  },
];

// Compatibility export for editorial-triptych and other existing consumers
export const oviaEvents = defaultEvents;

export const getFeaturedEvent = (): OviaEvent => {
  return defaultEvents.find((e) => e.featured) || defaultEvents[0];
};
