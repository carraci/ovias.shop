import { DisplayPrice } from "./display-price";
import { ProductPhoto as Image } from "./product-photo";
import { ArrowUpRight } from "lucide-react";
import { money } from "@/lib/catalog-helpers";
import type { Product } from "@/lib/catalog";
export function ProductCard({
  product: p,
  index = 0,
}: {
  product: Product;
  index?: number;
}) {
  const displayImage = p.image || p.images?.main || p.variants?.find((v) => v.image)?.image || p.gallery?.[0];
  if (!displayImage) return null;
  return (
    <article className="product-card">
      <a
        data-store-navigation
        href={`/products/${p.slug}`}
        className={`product-image tone-${index % 4}`}
      >
        <span className="product-badge">{p.collection}</span>
        <Image
          src={displayImage}
          fallbackSources={[p.images?.main || "", ...(p.images?.gallery || []), ...(p.gallery || []), ...p.variants.map(v => v.image || "")]}
          alt={`${p.name} — ${p.imageKind === "illustration" ? "illustrative design study" : "product view"}`}
          fill
          sizes="(max-width: 600px) 50vw, (max-width: 1000px) 33vw, 25vw"
          className={`product-art ${p.department === "luggage" ? "luggage-art" : ""}`}
        />
        <span className="card-arrow">
          <ArrowUpRight size={20} />
        </span>
        {p.imageKind === "illustration" && (
          <span className="image-caption">DESIGN STUDY</span>
        )}
      </a>
      <div className="product-info">
        <div>
          <a data-store-navigation href={`/products/${p.slug}`}>
            <h3>{p.name}</h3>
          </a>
          <p>
            {[p.material, p.department === "luggage" ? p.capacity : p.category].filter(Boolean).join(" · ")}
          </p>
        </div>
        <span className="price">{p.priceOnRequest ? "Price on request" : <DisplayPrice amount={p.variants[0].price}/>}</span>
      </div>
      <div className="swatches" aria-label="Available colors">
        {p.variants.map((v) => (
          <a
            data-store-navigation
            key={v.sku}
            href={`/products/${p.slug}?variant=${encodeURIComponent(v.sku)}`}
            title={v.color}
            aria-label={`${p.name} in ${v.color}`}
            style={{ background: v.hex }}
          />
        ))}
        <span>{p.variants.length} colours</span>
      </div>
    </article>
  );
}
