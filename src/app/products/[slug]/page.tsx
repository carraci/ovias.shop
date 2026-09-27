import { notFound } from "next/navigation";
import { storefrontCatalog as catalog } from "@/server/storefront-catalog";
import { ProductDetail } from "@/components/product-detail";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ variant?: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const all = await catalog();
  const p =
    all.find((p) => p.slug === slug || p.id === slug) ||
    all.find(
      (p) => p.slug.startsWith(`${slug}-`) || slug.startsWith(`${p.slug}-`),
    );
  return {
    title: p?.name || "Product not found",
    description: p?.description,
    alternates: { canonical: `/products/${slug}` },
  };
}

export default async function ProductPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const all = await catalog();
  const p =
    all.find((p) => p.slug === slug || p.id === slug) ||
    all.find(
      (p) => p.slug.startsWith(`${slug}-`) || slug.startsWith(`${p.slug}-`),
    );
  if (!p) notFound();

  const related = all
    .filter((x) => x.id !== p.id && x.department === p.department)
    .slice(0, 8);

  return (
    <ProductDetail
      key={p.id}
      product={p}
      initialSku={(await searchParams).variant}
      relatedProducts={
        related.length > 0
          ? related
          : all.filter((x) => x.id !== p.id).slice(0, 8)
      }
    />
  );
}
