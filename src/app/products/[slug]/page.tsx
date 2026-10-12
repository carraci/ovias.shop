import { relatedProductsFor } from "@/lib/related-products";
import { notFound, permanentRedirect } from "next/navigation";
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
    all.find((p) => p.slug === slug || p.id === slug || p.slugAliases?.includes(slug)) ||
    all.find(
      (p) => p.slug.startsWith(`${slug}-`) || slug.startsWith(`${p.slug}-`),
    );

  if (!p) {
    return {
      title: "Product not found | OVIA",
      description: "The requested luxury product could not be found.",
    };
  }

  const title = (p as any).ogTitle || (p as any).metaTitle || `${p.name} | OVIA Luxury`;
  const description =
    (p as any).ogDescription ||
    (p as any).metaDescription ||
    p.description ||
    "Discover luxury travel essentials by OVIA.";
  const ogImg = (p as any).ogImage || p.image || "/media/case-flowers.jpg";
  const canonicalPath = (p as any).canonicalUrl || `https://www.ovias.shop/products/${p.slug || slug}`;
  const indexing = (p as any).indexing;
  const robots = indexing === "noindex" ? { index: false, follow: false } : { index: true, follow: true };

  return {
    title,
    description,
    robots,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title,
      description,
      url: canonicalPath,
      siteName: "OVIA Luxury Travel Goods",
      images: [
        {
          url: ogImg,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImg],
    },
  };
}

export default async function ProductPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const all = await catalog();
  const p =
    all.find((p) => p.slug === slug || p.id === slug || p.slugAliases?.includes(slug)) ||
    all.find(
      (p) => p.slug.startsWith(`${slug}-`) || slug.startsWith(`${p.slug}-`),
    );
  if (!p) notFound();
  if (p.slugAliases?.includes(slug)) {
    const variant = (await searchParams).variant;
    permanentRedirect(`/products/${p.slug}${variant ? `?variant=${encodeURIComponent(variant)}` : ""}`);
  }

  const related = relatedProductsFor(p, all);

  const collectionProducts = all.filter(
    (x) =>
      x.collection.toLowerCase() === p.collection.toLowerCase() &&
      x.department === p.department,
  );

  const schemaObj = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    image: (p as any).images?.length ? (p as any).images : [p.image],
    description: (p as any).metaDescription || p.description,
    sku: (p as any).sku || p.id,
    brand: {
      "@type": "Brand",
      name: (p as any).brand || (p as any).specifications?.Brand || "OVIA",
    },
    offers: {
      "@type": "Offer",
      url: (p as any).canonicalUrl || `https://www.ovias.shop/products/${p.slug || slug}`,
      priceCurrency: "INR",
      price: p.price,
      availability: (p.stock ?? 1) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaObj) }}
      />
      <ProductDetail
        key={p.id}
        product={p}
        initialSku={(await searchParams).variant}
        relatedProducts={related}
        collectionProducts={collectionProducts}
      />
    </>
  );
}
