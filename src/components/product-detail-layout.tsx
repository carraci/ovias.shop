"use client";

import { ProductPhoto as Image } from "./product-photo";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Expand,
  Heart,
  Headphones,
  MessageSquare,
  Minus,
  Plus,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Truck,
  X,
} from "lucide-react";
import type { Product, Variant } from "@/lib/catalog";
import { productMedia } from "@/lib/product-media";
import {
  detailCaption,
  displayMeasurement,
  presentationSpecifications,
} from "@/lib/product-presentation";
import { getCareSlugForProduct } from "@/lib/care-data";
import { usePreferences } from "./preferences";
import { useStore } from "./store-provider";
import { ContactDrawerButton } from "./contact-drawer-button";
import styles from "./product-detail.module.css";

export function ProductDetail({
  product: p,
  initialSku,
  relatedProducts = [],
}: {
  product: Product;
  initialSku?: string;
  relatedProducts?: Product[];
}) {
  const { format } = usePreferences();
  const { add, cart } = useStore();
  const router = useRouter();
  const [sku, setSku] = useState(
    p.variants.find((v) => v.sku === initialSku)?.sku ||
      p.variants[0]?.sku ||
      "",
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState<"cm" | "in">("cm");
  const [busy, setBusy] = useState<"bag" | "checkout" | null>(null);
  const pending = useRef(false);
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const relatedRail = useRef<HTMLDivElement>(null);
  const variant = p.variants.find((v) => v.sku === sku);
  const media = productMedia(p, variant);
  const active = media.gallery[activeIndex] || media.gallery[0];
  const { measurements, composition } = presentationSpecifications(p);
  const careSlug = getCareSlugForProduct(p.material, p.department);
  const inBag = cart.lines.find((line) => line.sku === sku)?.quantity || 0;
  const maxQuantity = Math.max(0, Math.min(10, variant?.stock || 0) - inBag);
  const purchaseQuantity = Math.min(quantity, Math.max(1, maxQuantity));
  const available = !!variant && maxQuantity > 0;
  const sizes = [
    ...new Set([
      ...p.variants.map((v) => v.size).filter((size): size is string => !!size),
      ...(p.sizes || []),
    ]),
  ];
  const selectedSize = variant?.size || (sizes.length === 1 ? sizes[0] : "");
  const colours = [...new Map(p.variants.map((v) => [v.color, v])).values()];
  const canConvert = measurements.some(
    ([, value]) => displayMeasurement(value, "in") !== value,
  );
  const hasRail = media.editorial.length > 0;
  const hasSpecifications =
    measurements.length > 0 || media.dimensions.length > 0;
  const hasMaterials = composition.length > 0 || media.materials.length > 0;

  function selectVariant(next: Variant) {
    setSku(next.sku);
    setActiveIndex(0);
    setQuantity(1);
    setAdded(false);
    setError("");
    const url = new URL(window.location.href);
    url.searchParams.set("variant", next.sku);
    window.history.replaceState(null, "", url);
  }
  function selectColour(colour: string) {
    const next =
      p.variants.find((v) => v.color === colour && v.size === variant?.size) ||
      p.variants.find((v) => v.color === colour);
    if (next) selectVariant(next);
  }
  async function purchase(destination: "bag" | "checkout") {
    if (!variant || !available || pending.current) return;
    pending.current = true;
    setBusy(destination);
    setError("");
    try {
      await add(variant.sku, purchaseQuantity);
      setAdded(true);
      setQuantity(1);
      if (destination === "checkout") router.push("/checkout");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      pending.current = false;
      setBusy(null);
    }
  }
  function moveImage(direction: number) {
    setActiveIndex(
      (index) =>
        (index + direction + media.gallery.length) % media.gallery.length,
    );
  }
  function enlarge(index = activeIndex) {
    setActiveIndex(index);
    setZoomOpen(true);
    dialog.current?.showModal();
  }

  return (
    <article className={`${styles.page} ${hasRail ? styles.withRail : ""}`}>
      <div className={styles.mainContent}>
        <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
          <Link href="/">Home</Link>
          <ChevronRight size={10} />
          <Link href={`/${p.department}`}>{p.department}</Link>
          <ChevronRight size={10} />
          {p.category && (
            <>
              <Link
                href={`/${p.department}?category=${encodeURIComponent(p.category)}`}
              >
                {p.category}
              </Link>
              <ChevronRight size={10} />
            </>
          )}
          <span aria-current="page">{p.name}</span>
        </nav>

        <div className={styles.hero}>
          <div className={styles.visualColumn}>
            <section className={styles.gallery} aria-label={`${p.name} images`}>
              {media.gallery.length > 1 && (
                <div
                  className={styles.thumbnails}
                  aria-label="Product views"
                  data-lenis-prevent
                >
                  {media.gallery.map((item, index) => (
                    <button
                      key={item.src}
                      className={
                        index === activeIndex ? styles.selectedThumbnail : ""
                      }
                      aria-label={`View ${index + 1} of ${p.name}`}
                      aria-pressed={index === activeIndex}
                      onClick={() => setActiveIndex(index)}
                    >
                      <Image src={item.thumbnail} alt="" fill sizes="90px" />
                    </button>
                  ))}
                </div>
              )}
              <div className={styles.galleryBody}>
                <div className={styles.mainImage}>
                  {active ? (
                    <Image
                      src={active.src}
                      alt={`${p.name}${variant && activeIndex === 0 ? ` in ${variant.color}` : ""}, view ${activeIndex + 1}`}
                      fill
                      preload
                      quality={90}
                      sizes="(max-width: 760px) 100vw, (max-width: 1100px) 62vw, 57vw"
                    />
                  ) : (
                    <p className={styles.noImage}>
                      Product imagery coming soon
                    </p>
                  )}
                  {active && (
                    <button
                      className={styles.zoomButton}
                      aria-label="Enlarge product image"
                      onClick={() => enlarge()}
                    >
                      <Expand size={19} />
                    </button>
                  )}
                  {media.gallery.length > 1 && (
                    <>
                      <button
                        className={`${styles.galleryArrow} ${styles.previous}`}
                        aria-label="Previous product image"
                        onClick={() => moveImage(-1)}
                      >
                        <ChevronLeft size={22} />
                      </button>
                      <button
                        className={`${styles.galleryArrow} ${styles.next}`}
                        aria-label="Next product image"
                        onClick={() => moveImage(1)}
                      >
                        <ChevronRight size={22} />
                      </button>
                    </>
                  )}
                </div>
                <div className={styles.galleryFooter}>
                  <span>
                    {p.imageKind === "illustration"
                      ? "ILLUSTRATIVE DESIGN STUDY"
                      : p.collection}
                  </span>
                  <span aria-live="polite">
                    {active ? activeIndex + 1 : 0} / {media.gallery.length}
                  </span>
                </div>
              </div>
            </section>
            {media.details.length > 0 && (
              <section
                className={styles.detailStrip}
                aria-label="Product details"
              >
                {media.details.map((src, index) => {
                  const caption = detailCaption(src, p, index);
                  return (
                    <figure key={src}>
                      <button
                        className={styles.detailImage}
                        onClick={() =>
                          enlarge(
                            media.gallery.findIndex(
                              (image) => image.src === src,
                            ),
                          )
                        }
                        aria-label={`Enlarge ${caption.title.toLowerCase()}`}
                      >
                        <Image
                          src={src}
                          alt={`${p.name} — ${caption.title}`}
                          fill
                          quality={90}
                          sizes="(max-width: 760px) 40vw, 15vw"
                        />
                      </button>
                      <figcaption>
                        <strong>{caption.title}</strong>
                        {caption.description && (
                          <span>{caption.description}</span>
                        )}
                      </figcaption>
                    </figure>
                  );
                })}
              </section>
            )}
          </div>

          <section className={styles.info} aria-label="Product information">
            <p className={styles.eyebrow}>{p.collection}</p>
            <div className={styles.titleRow}>
              <h1>{p.name}</h1>
              <Link
                href="/account/wishlist"
                className={styles.wishlist}
                aria-label="Open your wishlist"
              >
                <Heart size={22} strokeWidth={1.25} />
              </Link>
            </div>
            {variant && <p className={styles.price}>{format(variant.price)}</p>}
            {p.description && (
              <p className={styles.description}>{p.description}</p>
            )}
            {!!p.variants.length && (
              <fieldset className={styles.variants}>
                <legend>
                  Colour <span>{variant?.color}</span>
                </legend>
                <div className={styles.swatches}>
                  {colours.map((v) => (
                    <button
                      key={v.color}
                      aria-label={v.color}
                      aria-pressed={variant?.color === v.color}
                      disabled={!!busy}
                      className={
                        variant?.color === v.color ? styles.selectedSwatch : ""
                      }
                      onClick={() => selectColour(v.color)}
                    >
                      <span style={{ backgroundColor: v.hex }} />
                    </button>
                  ))}
                </div>
                {colours.some((v) => v.image) && (
                  <div className={styles.variantImages}>
                    {colours
                      .filter((v) => v.image)
                      .map((v) => (
                        <button
                          key={v.color}
                          aria-label={`Select ${v.color} product image`}
                          aria-pressed={variant?.color === v.color}
                          disabled={!!busy}
                          className={
                            variant?.color === v.color
                              ? styles.selectedVariantImage
                              : ""
                          }
                          onClick={() => selectColour(v.color)}
                        >
                          <Image
                            src={v.image!}
                            alt={`${p.name} in ${v.color}`}
                            fill
                            sizes="90px"
                          />
                        </button>
                      ))}
                  </div>
                )}
              </fieldset>
            )}
            {sizes.length > 0 && (
              <fieldset className={styles.sizes}>
                <legend>
                  Size <span>{selectedSize}</span>
                </legend>
                <div>
                  {sizes.map((size) => {
                    const matching = p.variants.find(
                      (v) => v.size === size && v.color === variant?.color,
                    );
                    // Product-level sizes without a SKU mapping are descriptive, not purchasable variants.
                    return matching || sizes.length === 1 ? (
                      <button
                        key={size}
                        aria-pressed={selectedSize === size}
                        disabled={
                          !!busy || (matching ? matching.stock <= 0 : false)
                        }
                        onClick={() => {
                          if (matching) selectVariant(matching);
                        }}
                      >
                        {size}
                      </button>
                    ) : (
                      <span key={size} className={styles.sizeLabel}>
                        {size}
                      </span>
                    );
                  })}
                </div>
              </fieldset>
            )}
            <p className={styles.availability}>
              <span
                className={available ? styles.stockDot : styles.unavailableDot}
              />
              {available
                ? "In stock"
                : variant?.stock
                  ? "Maximum quantity already in your bag"
                  : "This variation is unavailable"}
            </p>
            <div className={styles.quantity} aria-label="Quantity">
              <button
                aria-label="Decrease quantity"
                disabled={purchaseQuantity <= 1 || !!busy}
                onClick={() => setQuantity(purchaseQuantity - 1)}
              >
                <Minus size={13} />
              </button>
              <output aria-label="Selected quantity" aria-live="polite">
                {purchaseQuantity}
              </output>
              <button
                aria-label="Increase quantity"
                disabled={purchaseQuantity >= maxQuantity || !!busy}
                onClick={() => setQuantity(purchaseQuantity + 1)}
              >
                <Plus size={13} />
              </button>
            </div>
            <div className={styles.actions}>
              <button
                className={styles.addToBag}
                onClick={() => purchase("bag")}
                disabled={!available || !!busy}
              >
                {busy === "bag"
                  ? "Adding…"
                  : added
                    ? "Add another"
                    : "Add to bag"}
                {added && <Check size={14} />}
              </button>
              <button
                onClick={() => purchase("checkout")}
                disabled={!available || !!busy}
              >
                {busy === "checkout" ? "Preparing checkout…" : "Buy now"}
              </button>
              <Link href="/personalise">Personalise</Link>
            </div>
            {added && (
              <Link href="/cart" className={styles.added}>
                View your bag <ArrowRight size={13} />
              </Link>
            )}
            {error && (
              <p role="alert" className="form-error">
                {error}
              </p>
            )}
            <div className={styles.purchaseServices}>
              <Link href="/faq/delivery">
                <Truck />
                <span>
                  Delivery<small>Explore delivery options</small>
                </span>
              </Link>
              <Link href="/faq/exchange-returns">
                <RotateCcw />
                <span>
                  Returns<small>Read our returns policy</small>
                </span>
              </Link>
              <Link href={`/care-service/${careSlug}`}>
                <ShieldCheck />
                <span>
                  Product care<small>Care for your piece</small>
                </span>
              </Link>
              <ContactDrawerButton
                variant="link"
                className={styles.serviceButton}
              >
                <Headphones />
                <span>
                  Client service<small>Speak to our team</small>
                </span>
              </ContactDrawerButton>
            </div>
            <p className={styles.note}>
              Concept store · fictional inventory · no real purchases
            </p>
          </section>
        </div>

        {(hasSpecifications ||
          hasMaterials ||
          media.craftsmanship.length > 0) && (
          <div className={styles.specBand}>
            {hasSpecifications && (
              <section
                className={styles.specSection}
                aria-labelledby="product-specifications-title"
              >
                <div className={styles.panelHeading}>
                  <h2 id="product-specifications-title">Size & weight</h2>
                  {canConvert && (
                    <div
                      className={styles.units}
                      aria-label="Measurement units"
                    >
                      <button
                        aria-pressed={unit === "cm"}
                        onClick={() => setUnit("cm")}
                      >
                        CM
                      </button>
                      <button
                        aria-pressed={unit === "in"}
                        onClick={() => setUnit("in")}
                      >
                        IN
                      </button>
                    </div>
                  )}
                </div>
                <div className={styles.specBody}>
                  {media.dimensions.length > 0 && (
                    <div className={styles.specImages}>
                      {media.dimensions.map((src) => (
                        <div className={styles.dimensionImage} key={src}>
                          <Image
                            src={src}
                            alt={`${p.name} — dimensions`}
                            fill
                            sizes="(max-width: 760px) 45vw, 18vw"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  {measurements.length > 0 && (
                    <dl className={styles.specTable}>
                      {measurements.map(([label, value]) => (
                        <div key={label}>
                          <dt>{label}</dt>
                          <dd>{displayMeasurement(value, unit)}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </div>
              </section>
            )}
            {hasMaterials && (
              <section
                className={styles.materialSection}
                aria-labelledby="product-materials-title"
              >
                <div className={styles.panelHeading}>
                  <h2 id="product-materials-title">Materials</h2>
                </div>
                <div className={styles.materialBody}>
                  {media.materials.length > 0 && (
                    <div className={styles.materialImages}>
                      {media.materials.map((src) => (
                        <div className={styles.materialImage} key={src}>
                          <Image
                            src={src}
                            alt={`${p.name} — material close-up`}
                            fill
                            quality={90}
                            sizes="(max-width: 760px) 40vw, 14vw"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  <dl>
                    {composition.map(([label, value], index) => (
                      <div key={`${label}-${index}`}>
                        <dt>{label}</dt>
                        <dd>{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </section>
            )}
            {media.craftsmanship.length > 0 && (
              <section
                className={styles.craftSection}
                aria-labelledby="product-craft-title"
              >
                <Image
                  src={media.craftsmanship[0]}
                  alt={`${p.name} — craftsmanship`}
                  fill
                  quality={90}
                  sizes="(max-width: 760px) 100vw, 35vw"
                />
                <div className={styles.craftCopy}>
                  <h2 id="product-craft-title">Craftsmanship.</h2>
                  <p className={styles.craftTitle}>{p.collection}</p>
                  {p.features?.find((feature) =>
                    /craft|stitch|artisan|handmade/i.test(feature),
                  ) && (
                    <p>
                      {p.features.find((feature) =>
                        /craft|stitch|artisan|handmade/i.test(feature),
                      )}
                    </p>
                  )}
                  <button
                    onClick={() =>
                      enlarge(
                        media.gallery.findIndex(
                          (image) => image.src === media.craftsmanship[0],
                        ),
                      )
                    }
                  >
                    Explore the details <ArrowRight size={13} />
                  </button>
                </div>
              </section>
            )}
          </div>
        )}

        {!!p.features?.length && (
          <div className={styles.features} aria-label="Product features">
            {p.features.map((feature, index) => (
              <span key={`${feature}-${index}`}>
                <Check size={12} />
                {feature}
              </span>
            ))}
          </div>
        )}

        <div className={styles.bottomBand}>
          <section
            className={styles.services}
            aria-labelledby="product-services-title"
          >
            <h2 id="product-services-title">Services</h2>
            <div className={styles.servicesGrid}>
              <Link href="/care-service/request-assistance">
                <ShieldCheck />
                <span>
                  Care & repair<small>Our commitment to you</small>
                </span>
              </Link>
              <Link href="/faq/delivery">
                <Truck />
                <span>
                  Shipping & delivery<small>Plan your delivery</small>
                </span>
              </Link>
              <Link href="/faq/exchange-returns">
                <RotateCcw />
                <span>
                  Returns<small>Find out more</small>
                </span>
              </Link>
              <Link href={`/care-service/${careSlug}`}>
                <Sparkles />
                <span>
                  Product care<small>Tips and guidance</small>
                </span>
              </Link>
              <ContactDrawerButton
                variant="link"
                className={styles.serviceButton}
              >
                <Headphones />
                <span>
                  Client service<small>Here to help</small>
                </span>
              </ContactDrawerButton>
              <Link href="/faq">
                <MessageSquare />
                <span>
                  FAQ<small>Find your answers</small>
                </span>
              </Link>
            </div>
          </section>
          {relatedProducts.length > 0 && (
            <section
              className={styles.related}
              aria-labelledby="product-related-title"
            >
              <div className={styles.panelHeading}>
                <h2 id="product-related-title">You may also like</h2>
                <div className={styles.relatedControls}>
                  <button
                    aria-label="Previous recommendations"
                    onClick={() =>
                      relatedRail.current?.scrollBy({
                        left: -300,
                        behavior: "smooth",
                      })
                    }
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    aria-label="Next recommendations"
                    onClick={() =>
                      relatedRail.current?.scrollBy({
                        left: 300,
                        behavior: "smooth",
                      })
                    }
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
              <div
                ref={relatedRail}
                className={styles.relatedRail}
                data-lenis-prevent
              >
                {relatedProducts.map((product) => (
                  <Link
                    href={`/products/${product.slug}`}
                    key={product.id}
                    className={styles.relatedCard}
                  >
                    <div>
                      <Image
                        src={product.images?.main || product.image}
                        fallbackSources={product.gallery}
                        alt={product.name}
                        fill
                        sizes="140px"
                      />
                    </div>
                    <h3>{product.name}</h3>
                    {product.variants[0] && (
                      <span>{format(product.variants[0].price)}</span>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {hasRail && (
        <aside className={styles.storyRail} aria-label="Editorial story">
          {media.editorial.map((src, index) => (
            <figure
              key={src}
              className={index === 0 ? styles.storyHero : styles.storyCard}
            >
              <Image
                src={src}
                alt={`${p.name} — editorial photograph ${index + 1}`}
                fill
                quality={90}
                sizes="(max-width: 760px) 100vw, 22vw"
              />
              <figcaption>
                {index === 0 && (
                  <span className={styles.railWordmark}>OVIA</span>
                )}
                <p className={styles.eyebrow}>{p.collection}</p>
                <h2>{p.name}</h2>
                <Link
                  href={`/${p.department}?collection=${encodeURIComponent(p.collection)}`}
                >
                  Explore the collection <ArrowRight size={14} />
                </Link>
              </figcaption>
            </figure>
          ))}
          {media.craftsmanship.slice(1).map((src) => (
            <figure key={src} className={styles.storyCard}>
              <Image
                src={src}
                alt={`${p.name} — craftsmanship detail`}
                fill
                quality={90}
                sizes="(max-width: 760px) 100vw, 22vw"
              />
              <figcaption>
                <h2>{p.collection}</h2>
                <button
                  onClick={() =>
                    enlarge(
                      media.gallery.findIndex((image) => image.src === src),
                    )
                  }
                >
                  A closer look <ArrowRight size={14} />
                </button>
              </figcaption>
            </figure>
          ))}
        </aside>
      )}

      <dialog
        ref={dialog}
        className={styles.dialog}
        aria-label={`${p.name} enlarged image`}
        onClose={() => setZoomOpen(false)}
        data-lenis-prevent
        onKeyDown={(event) => {
          if (media.gallery.length > 1 && event.key === "ArrowLeft")
            moveImage(-1);
          if (media.gallery.length > 1 && event.key === "ArrowRight")
            moveImage(1);
        }}
      >
        <button
          className={styles.closeDialog}
          aria-label="Close enlarged image"
          onClick={() => dialog.current?.close()}
        >
          <X />
        </button>
        {zoomOpen && active && (
          <Image
            src={active.src}
            alt={`${p.name} — original resolution view`}
            width={2400}
            height={2400}
            unoptimized
          />
        )}
        {media.gallery.length > 1 && (
          <div className={styles.dialogControls}>
            <button
              aria-label="Previous enlarged image"
              onClick={() => moveImage(-1)}
            >
              <ChevronLeft />
            </button>
            <span>
              {activeIndex + 1} / {media.gallery.length}
            </span>
            <button
              aria-label="Next enlarged image"
              onClick={() => moveImage(1)}
            >
              <ChevronRight />
            </button>
          </div>
        )}
      </dialog>
      <div className={styles.mobileBar}>
        <div>
          <span>{p.name}</span>
          {variant && <strong>{format(variant.price)}</strong>}
        </div>
        <button
          onClick={() => purchase("bag")}
          disabled={!available || !!busy}
          aria-label={`Add ${p.name} to bag`}
        >
          <Plus size={18} />
          <span>Bag</span>
        </button>
        <button
          className={styles.mobileBuy}
          onClick={() => purchase("checkout")}
          disabled={!available || !!busy}
        >
          {busy ? "Please wait…" : "Buy now"}
        </button>
      </div>
    </article>
  );
}
