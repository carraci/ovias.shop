import { notFound } from "next/navigation";
import { storefrontCatalog as catalog } from "@/server/storefront-catalog";
import { newEdits, newProducts } from "@/lib/new-collection";
import { CatalogView } from "@/components/catalog-view";
import { ArtistCaseShowcase } from "@/components/artist-case-showcase";
import { NewArrivalsLanding } from "@/components/new-arrivals-landing";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ edit?: string[] }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props) {
  const { edit } = await params;
  if (edit?.[0] === "artist-case") {
    return {
      title: "Studio Artist Case — Edition 97390043 | OVIA",
      description:
        "The OVIA Studio Artist Case: precision grooved anodized aluminium, two-tiered solid beechwood trays, 120 Polychromos pencils, and platinum drawing instruments.",
      alternates: { canonical: "/new/artist-case" },
    };
  }

  return {
    title: edit?.[0]
      ? newEdits[edit[0]]?.title || "New collection"
      : "OVIA New Arrivals — New Horizons, New Journeys",
    alternates: { canonical: edit ? `/new/${edit.join("/")}` : "/new" },
  };
}

export default async function NewCollection({ params, searchParams }: Props) {
  const { edit } = await params;
  const sp = searchParams ? await searchParams : {};
  const selected = edit?.[0] ? newEdits[edit[0]] : undefined;
  if (edit && (edit.length !== 1 || !selected)) notFound();

  // If visiting /new without sub-route and no filter params, display the editorial landing page
  if (!edit || edit.length === 0) {
    const hasFilter = Boolean(
      sp.view === "catalog" ||
      sp.category ||
      sp.subCategory ||
      sp.material ||
      sp.colour ||
      sp.collection ||
      sp.q ||
      sp.sort ||
      sp.page
    );
    if (!hasFilter) {
      return <NewArrivalsLanding />;
    }
  }

  const all = await catalog();

  if (edit?.[0] === "artist-case") {
    const artistProduct =
      all.find((p) => p.slug === "studio-artist-case") ||
      newProducts.find((p) => p.slug === "studio-artist-case");

    if (artistProduct) {
      const pairings = all.filter(
        (p) =>
          p.slug !== "studio-artist-case" &&
          (p.department === "luggage" || p.tags.includes("new-arrivals")),
      );
      return <ArtistCaseShowcase product={artistProduct} pairings={pairings} />;
    }
  }

  return (
    <CatalogView
      products={all.filter((p) =>
        selected
          ? selected.matches(p)
          : p.tags.includes("new-arrivals") ||
            (p.department === "bags" && p.collection === "Meridian"),
      )}
      title={selected?.title || "A new point of view."}
      description={
        selected?.description ||
        "Discover the latest OVIA design studies: new shapes, new shades, and a fresh perspective on the journey."
      }
    />
  );
}


