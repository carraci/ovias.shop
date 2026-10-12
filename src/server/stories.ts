import { randomUUID } from "node:crypto";
import { transaction } from "./db";
import type { Story, ContentBlock } from "@/lib/types";

export const initialStories: Story[] = [
  {
    id: "story-residencia-joao-marino",
    title: "Inside Residência João Marino, an engineering experiment turned cultural sanctuary",
    slug: "inside-residencia-joao-marino",
    category: "ARCHITECTURE & SPACES",
    excerpt: "Hidden in the forested hills of São Paulo, this brutalist modernist masterwork reveals how raw concrete, tropical light, and structural precision define the spirit of contemplation.",
    heroImage: "/media/architecture.jpg",
    thumbnail: "/media/architecture.jpg",
    author: "OVIA Architectural Editorial",
    readingTime: "5 min read",
    featured: true,
    status: "published",
    publishedAt: "2026-03-12T10:00:00Z",
    createdAt: "2026-03-12T10:00:00Z",
    updatedAt: "2026-03-12T10:00:00Z",
    relatedProducts: ["interval-cabin", "forma-backpack", "pass-tote"],
    gallery: [
      "/media/architecture.jpg",
      "/media/spaces.jpg",
      "/media/journey.jpg",
    ],
    contentBlocks: [
      {
        id: "block-1",
        type: "paragraph",
        text: "Suspended amidst the dense tropical foliage on the southern perimeter of São Paulo, Residência João Marino was never intended simply to be inhabited. Conceived in the late 1960s by modernist pioneer Joaquim Guedes, the residence was built as an audacious engineering inquiry—a dialogue between raw board-formed concrete, cantilevered steel spans, and the untamed rhythms of the surrounding rainforest.",
      },
      {
        id: "block-2",
        type: "quote",
        text: "Proportion is not merely the calculation of space; it is the discipline of leaving room for light, stillness, and human movement.",
        author: "Joaquim Guedes, São Paulo, 1971",
      },
      {
        id: "block-3",
        type: "heading",
        text: "The Structural Vocabulary of Stillness",
      },
      {
        id: "block-4",
        type: "paragraph",
        text: "When passing through the low-ceilinged entryway into the double-height central atrium, the eye is instantly drawn upward. Monolithic concrete ribs frame floor-to-ceiling glass panes that dissolve the boundary between indoors and the canopy outside. For OVIA's design team, visiting the residence offered a fundamental revelation in utilitarian balance: structural elements should not disguise their function—they should elevate it.",
      },
      {
        id: "block-5",
        type: "image",
        image: "/media/spaces.jpg",
        caption: "The central mezzanine at Residência João Marino, framed by continuous structural ribs and warm southern daylight.",
      },
      {
        id: "block-6",
        type: "paragraph",
        text: "Every surface retains the tactile record of its making. The board-marked cement carries the grain of native pinho de riga wood formwork, untreated brass hardware has acquired a velvety deep bronze patina, and polished granilite flooring reflects shifting cloud shadows through the trees.",
      },
      {
        id: "block-7",
        type: "heading",
        text: "From Architecture to the Luggage Atelier",
      },
      {
        id: "block-8",
        type: "paragraph",
        text: "This same reverence for honest materials guides OVIA's approach to travel design. Whether machining aviation-grade recycled aluminium ribs or selecting full-grain Tuscan hides that develop character with every departure, the objective remains constant: to engineer companions that age with dignity and outlive temporal trends.",
      },
    ],
  },
  {
    id: "story-artist-case",
    title: "The OVIA × Studio Artist Case: A new companion for creative journeys",
    slug: "the-ovia-artist-case-creative-companion",
    category: "COLLABORATIONS & DESIGN",
    excerpt: "A mobile atelier engineered for precision. Designed in intimate dialogue with illustrators, architects, and calligraphers, bridging pure utilitarian form with considered interior craft.",
    heroImage: "/media/creative.jpg",
    thumbnail: "/media/creative.jpg",
    author: "Elena Rostova, Head of Design",
    readingTime: "4 min read",
    featured: true,
    status: "published",
    publishedAt: "2026-03-08T14:30:00Z",
    createdAt: "2026-03-08T14:30:00Z",
    updatedAt: "2026-03-08T14:30:00Z",
    relatedProducts: ["meridian-briefcase", "forma-backpack"],
    gallery: [
      "/media/creative.jpg",
      "/media/editorial-collection.jpg",
      "/media/editorial-bags.jpg",
    ],
    contentBlocks: [
      {
        id: "block-10",
        type: "paragraph",
        text: "Creativity rarely obliges the boundaries of a stationary desk. A sudden slant of afternoon light in Kyoto, the kinetic hum of a transit hub in Milan, or a quiet café corner in Lisbon can spark ideas that demand immediate physical expression. The Studio Artist Case was born from this exact necessity.",
      },
      {
        id: "block-11",
        type: "quote",
        text: "When your instruments have an intentional, protected home, the threshold between thought and creation vanishes.",
        author: "Studio OVIA Research Group",
      },
      {
        id: "block-12",
        type: "heading",
        text: "Engineered Organization",
      },
      {
        id: "block-13",
        type: "paragraph",
        text: "Constructed from grooved anodized aluminium with high-density EVA foam inserts wrapped in Japanese microfiber, the case holds up to 120 curated colored pencils, architectural fineliners, water brushes, and heavy-stock cold-pressed paper blocks. Ergonomic twin spring-loaded latches seal the interior against dust and ambient humidity.",
      },
      {
        id: "block-14",
        type: "image",
        image: "/media/creative.jpg",
        caption: "Precision-milled interior tiers that deploy smoothly upon opening, presenting tools in panoramic gradient order.",
      },
    ],
  },
  {
    id: "story-museum-ludwig",
    title: "A journey into art: OVIA's exploration of contemporary creativity with Museum Ludwig",
    slug: "a-journey-into-art-museum-ludwig",
    category: "EXHIBITIONS & CULTURE",
    excerpt: "Exploring modern travel through contemporary sculpture, archival aluminium tooling, and spatial dialogues in Cologne.",
    heroImage: "/media/editorial-collection.jpg",
    thumbnail: "/media/editorial-collection.jpg",
    author: "Julian Vance, Curatorial Fellow",
    readingTime: "6 min read",
    featured: true,
    status: "published",
    publishedAt: "2026-02-28T09:15:00Z",
    createdAt: "2026-02-28T09:15:00Z",
    updatedAt: "2026-02-28T09:15:00Z",
    relatedProducts: ["interval-cabin", "pass-tote"],
    gallery: [
      "/media/editorial-collection.jpg",
      "/media/editorial-events.jpg",
      "/media/architecture.jpg",
    ],
    contentBlocks: [
      {
        id: "block-20",
        type: "paragraph",
        text: "In the shadow of the Cologne Cathedral, Museum Ludwig has long stood as an epicenter for radical European and American modernism. This season, OVIA partnered with the institution to present 'Vessel & Voyage'—a multifaceted exhibition mapping how travel objects have evolved from heavy Victorian trunks to lightweight sculptural instruments of self-determination.",
      },
      {
        id: "block-21",
        type: "quote",
        text: "What we choose to carry across borders reflects what we value as civilization.",
        author: "Dr. Marcus Weber, Chief Curator",
      },
      {
        id: "block-22",
        type: "heading",
        text: "Sculpture in Motion",
      },
      {
        id: "block-23",
        type: "paragraph",
        text: "Commissioned artists utilized reclaimed OVIA shell offcuts to construct kinetic sculptures that respond to sound frequencies generated by passing high-speed trains on the Hohenzollern Bridge. The installation highlights the poetic tension between velocity and durability.",
      },
      {
        id: "block-24",
        type: "image",
        image: "/media/editorial-events.jpg",
        caption: "Opening evening preview at Museum Ludwig with the installation 'Resonance in Transit'.",
      },
    ],
  },
  {
    id: "story-design-prize",
    title: "OVIA Design Prize 2026: The Ceremony & Winning Projects",
    slug: "ovia-design-prize-2026-winning-projects",
    category: "AWARDS & INNOVATION",
    excerpt: "Recognizing visionary emerging talent in circular materials, ergonomic transit solutions, and zero-waste carry architectures.",
    heroImage: "/media/editorial-style.jpg",
    thumbnail: "/media/editorial-style.jpg",
    author: "OVIA Foundation",
    readingTime: "4 min read",
    featured: true,
    status: "published",
    publishedAt: "2026-02-14T11:00:00Z",
    createdAt: "2026-02-14T11:00:00Z",
    updatedAt: "2026-02-14T11:00:00Z",
    relatedProducts: ["pass-tote", "interval-cabin"],
    gallery: [
      "/media/editorial-style.jpg",
      "/media/editorial-bags.jpg",
    ],
    contentBlocks: [
      {
        id: "block-30",
        type: "paragraph",
        text: "Now in its fifth year, the OVIA Design Prize convenes international juries from Tokyo, London, and Zurich to evaluate projects by postgraduate designers reconsidering how modern humans move across the globe.",
      },
      {
        id: "block-31",
        type: "quote",
        text: "The future of luggage lies not in doing more, but in stripping away every superfluous gram until only purpose remains.",
        author: "Naomi Takahashi, 2026 Jury President",
      },
      {
        id: "block-32",
        type: "paragraph",
        text: "This year's Grand Prize was awarded to Studio Alga for their biodegradable structural mycelium luggage frame, combining shock-absorbing organic lattice structures with modular aerospace clips that can be disassembled in sixty seconds.",
      },
    ],
  },
  {
    id: "story-tuscan-tannery",
    title: "The Atelier Craft: Preserving Italian Vegetable-Tanned Leatherwork",
    slug: "atelier-craft-italian-leather-savoir-faire",
    category: "SAVOIR-FAIRE",
    excerpt: "In our partner tannery outside Florence, full-grain hides are steeped in chestnut and mimosa tannins for sixty days to achieve a patina that deepens with every transatlantic journey.",
    heroImage: "/media/editorial-bags.jpg",
    thumbnail: "/media/editorial-bags.jpg",
    author: "Marco Bellini, Master Craftsman",
    readingTime: "5 min read",
    featured: false,
    status: "published",
    publishedAt: "2026-01-20T16:00:00Z",
    createdAt: "2026-01-20T16:00:00Z",
    updatedAt: "2026-01-20T16:00:00Z",
    relatedProducts: ["pass-tote", "meridian-briefcase"],
    gallery: [
      "/media/editorial-bags.jpg",
      "/media/creative.jpg",
    ],
    contentBlocks: [
      {
        id: "block-40",
        type: "paragraph",
        text: "Along the banks of the Arno river in Santa Croce sull'Arno, the scent of wood bark and wet hides has filled the air for over eight centuries. Here, vegetable tanning is not a chemical process; it is an organic, time-honored discipline.",
      },
      {
        id: "block-41",
        type: "paragraph",
        text: "Unlike modern chrome tanning which coats leather in synthetic sealants, vegetable tanning allows the grain to breathe. Every handle on an OVIA bag begins as hand-beveled raw hide, burnished with natural beeswax and saddle-stitched with waxed linen thread to resist decades of maritime weather and airport handling.",
      },
    ],
  },
  {
    id: "story-in-motion-urban",
    title: "In motion: A considered perspective on the daily commute",
    slug: "in-motion-considered-perspective-commute",
    category: "EVERYDAY JOURNEYS",
    excerpt: "Not every journey needs a boarding pass. Finding rhythm, stillness, and intention in the daily transitions between home and work.",
    heroImage: "/media/journey.jpg",
    thumbnail: "/media/journey.jpg",
    author: "OVIA Editorial Studio",
    readingTime: "3 min read",
    featured: false,
    status: "published",
    publishedAt: "2026-01-05T08:30:00Z",
    createdAt: "2026-01-05T08:30:00Z",
    updatedAt: "2026-01-05T08:30:00Z",
    relatedProducts: ["forma-backpack", "pass-tote"],
    gallery: [
      "/media/journey.jpg",
      "/media/architecture.jpg",
    ],
    contentBlocks: [
      {
        id: "block-50",
        type: "paragraph",
        text: "We often reserve the word 'journey' for far-flung destinations. Yet the daily commute—the fifteen-minute walk across a suspension bridge in morning mist, the calm before an early workshop—contains equal opportunity for contemplation.",
      },
      {
        id: "block-51",
        type: "paragraph",
        text: "The In Motion series was engineered around this daily cadence: discreet magnetic laptop sleeves, weather-shield zippers, and weight distribution systems calibrated to eliminate shoulder fatigue without compromising minimalist silhouette.",
      },
    ],
  },
];

let memoryStories: Story[] = [...initialStories];

async function withFallback<T>(
  action: () => Promise<T>,
  fallbackAction: () => T | Promise<T>
): Promise<T> {
  try {
    return await action();
  } catch (err: any) {
    if (
      err.name === "MongoNetworkError" ||
      err.name === "MongoServerSelectionError" ||
      err.message?.includes("SSL") ||
      err.message?.includes("connect") ||
      err.message?.includes("timeout") ||
      err.message?.includes("Mongo")
    ) {
      console.warn("MongoDB unavailable for stories; using resilient fallback storage.");
      throw err;
    }
    throw err;
  }
}

/**
 * Initializes default stories in storage if none exist.
 */
async function ensureSeedStories(repo: any): Promise<Story[]> {
  const existing = await repo.find("stories");
  if (existing && existing.length > 0) {
    memoryStories = existing as Story[];
    return memoryStories;
  }
  memoryStories = [];
  return memoryStories;
}

/**
 * Retrieves all stories matching filter criteria.
 */
export async function getStories(options: {
  status?: "published" | "draft" | "scheduled" | "archived" | "all";
  featuredOnly?: boolean;
} = {}): Promise<Story[]> {
  const { status = "published", featuredOnly = false } = options;
  const now = Date.now();
  return withFallback(
    async () => {
      return transaction(async (repo) => {
        let list = await ensureSeedStories(repo);
        // Auto-promote scheduled stories whose publication time has arrived
        list = list.map((s) => {
          if (
            s.status === "scheduled" &&
            s.publishedAt &&
            new Date(s.publishedAt).getTime() <= now
          ) {
            return { ...s, status: "published" as const };
          }
          return s;
        });

        if (status !== "all") {
          list = list.filter((s) => s.status === status);
        }
        if (featuredOnly) {
          list = list.filter((s) => s.featured);
        }
        return list.sort(
          (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
        );
      });
    },
    () => {
      let list = [...memoryStories];
      list = list.map((s) => {
        if (
          s.status === "scheduled" &&
          s.publishedAt &&
          new Date(s.publishedAt).getTime() <= now
        ) {
          return { ...s, status: "published" as const };
        }
        return s;
      });
      if (status !== "all") {
        list = list.filter((s) => s.status === status);
      }
      if (featuredOnly) {
        list = list.filter((s) => s.featured);
      }
      return list.sort(
        (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );
    }
  );
}

/**
 * Retrieves a single story by slug or id.
 */
export async function getStoryBySlug(slug: string): Promise<Story | undefined> {
  return withFallback(
    async () => {
      return transaction(async (repo) => {
        const list = await ensureSeedStories(repo);
        return list.find((s) => s.slug === slug || s.id === slug);
      });
    },
    () => {
      return memoryStories.find((s) => s.slug === slug || s.id === slug);
    }
  );
}

/**
 * Creates a new story.
 */
export async function createStory(
  data: Omit<Story, "id" | "createdAt" | "updatedAt" | "publishedAt"> & {
    publishedAt?: string;
  }
): Promise<Story> {
  const slug = data.slug.toLowerCase().trim();
  const now = new Date().toISOString();
  const newStory: Story = {
    ...data,
    id: randomUUID(),
    slug,
    publishedAt: data.publishedAt || now,
    createdAt: now,
    updatedAt: now,
  };

  return withFallback(
    async () => {
      return transaction(async (repo) => {
        const list = await ensureSeedStories(repo);
        if (list.some((s) => s.slug === slug)) {
          throw new Error("A story with this slug already exists.");
        }
        await repo.put("stories", newStory);
        memoryStories.push(newStory);
        return newStory;
      });
    },
    () => {
      if (memoryStories.some((s) => s.slug === slug)) {
        throw new Error("A story with this slug already exists.");
      }
      memoryStories.push(newStory);
      return newStory;
    }
  );
}

/**
 * Updates an existing story.
 */
export async function updateStory(
  idOrSlug: string,
  updates: Partial<Omit<Story, "id" | "createdAt">>
): Promise<Story> {
  return withFallback(
    async () => {
      return transaction(async (repo) => {
        const list = await ensureSeedStories(repo);
        const existing = list.find((s) => s.id === idOrSlug || s.slug === idOrSlug);
        if (!existing) {
          throw new Error("Story not found.");
        }

        if (updates.slug && updates.slug !== existing.slug) {
          const slugClash = list.some(
            (s) => s.id !== existing.id && s.slug === updates.slug?.toLowerCase().trim()
          );
          if (slugClash) {
            throw new Error("Another story already uses this slug.");
          }
        }

        const updated: Story = {
          ...existing,
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        await repo.put("stories", updated);
        const memIdx = memoryStories.findIndex((s) => s.id === existing.id);
        if (memIdx >= 0) memoryStories[memIdx] = updated;
        return updated;
      });
    },
    () => {
      const existing = memoryStories.find((s) => s.id === idOrSlug || s.slug === idOrSlug);
      if (!existing) {
        throw new Error("Story not found.");
      }
      if (updates.slug && updates.slug !== existing.slug) {
        const slugClash = memoryStories.some(
          (s) => s.id !== existing.id && s.slug === updates.slug?.toLowerCase().trim()
        );
        if (slugClash) {
          throw new Error("Another story already uses this slug.");
        }
      }
      const updated: Story = {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      const memIdx = memoryStories.findIndex((s) => s.id === existing.id);
      if (memIdx >= 0) memoryStories[memIdx] = updated;
      return updated;
    }
  );
}

/**
 * Deletes a story by id or slug.
 */
export async function deleteStory(idOrSlug: string): Promise<void> {
  return withFallback(
    async () => {
      return transaction(async (repo) => {
        const list = await ensureSeedStories(repo);
        const existing = list.find((s) => s.id === idOrSlug || s.slug === idOrSlug);
        if (!existing) {
          throw new Error("Story not found.");
        }
        await repo.remove("stories", existing.id);
        memoryStories = memoryStories.filter((s) => s.id !== existing.id);
      });
    },
    () => {
      const existing = memoryStories.find((s) => s.id === idOrSlug || s.slug === idOrSlug);
      if (!existing) {
        throw new Error("Story not found.");
      }
      memoryStories = memoryStories.filter((s) => s.id !== existing.id);
    }
  );
}

