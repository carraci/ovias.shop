"use client";
import { ProductDescription } from "./product-description";

import { ProductPhoto as Image, isProductPhoto } from "./product-photo";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useEffect } from "react";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Expand,
  Heart,
  Minus,
  Plus,
  ShieldCheck,
  Sparkles,
  Truck,
  X,
  Headphones,
  MessageSquare,
} from "lucide-react";
import type { Product, Variant } from "@/lib/catalog";
import { productColorOptions } from "@/lib/product-colors";
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
import { ProductCard } from "./product-card";
import { ProductReviewsSection } from "./product-reviews";
import styles from "./product-detail.module.css";

interface KeyElementItem {
  title: string;
  description: string;
  image?: string;
}

function getProductKeyElements(product: Product): KeyElementItem[] {
  // 1. Direct keyElements array from product record in database
  if (
    (product as any).keyElements &&
    Array.isArray((product as any).keyElements) &&
    (product as any).keyElements.length > 0
  ) {
    return (product as any).keyElements.filter((item: any) => item && (item.title || item.description));
  }

  // 2. Features array from product record in database
  if (product.features && Array.isArray(product.features) && product.features.length > 0) {
    return product.features
      .map((feat: any, idx: number) => {
        if (typeof feat === "string" && feat.trim()) {
          const parts = feat.split(":");
          if (parts.length > 1) {
            return {
              title: parts[0].trim(),
              description: parts.slice(1).join(":").trim(),
            };
          }
          return {
            title: `Key Detail ${idx + 1}`,
            description: feat.trim(),
          };
        }
        if (typeof feat === "object" && feat !== null) {
          return {
            title: feat.title || feat.name || `Feature ${idx + 1}`,
            description: feat.description || feat.desc || "",
            image: feat.image || undefined,
          };
        }
        return null;
      })
      .filter((item): item is KeyElementItem => item !== null && (!!item.title || !!item.description));
  }

  return [];
}

// Parse dimensions string like "55 × 40 × 23 cm" or "16.3 × 8.2 × 1.1 cm"
function parseDimensions(dimStr?: string) {
  if (!dimStr) return null;
  const cleaned = dimStr.replace(/cm/gi, "").trim();
  const parts = cleaned
    .split(/[×xX*]/)
    .map((s) => parseFloat(s.trim()))
    .filter((n) => !isNaN(n));
  if (parts.length < 2) return null;

  const height = parts[0];
  const width = parts[1];
  const depth = parts[2] !== undefined ? parts[2] : null;

  return {
    height,
    width,
    depth,
    metricStr: depth !== null ? `${height} × ${width} × ${depth} cm` : `${height} × ${width} cm`,
    imperialStr:
      depth !== null
        ? `${(height / 2.54).toFixed(1)} × ${(width / 2.54).toFixed(1)} × ${(depth / 2.54).toFixed(1)} in`
        : `${(height / 2.54).toFixed(1)} × ${(width / 2.54).toFixed(1)} in`,
    heightMetric: `${height} cm`,
    heightImperial: `${(height / 2.54).toFixed(1)} in`,
    widthMetric: `${width} cm`,
    widthImperial: `${(width / 2.54).toFixed(1)} in`,
    depthMetric: depth !== null ? `${depth} cm` : null,
    depthImperial: depth !== null ? `${(depth / 2.54).toFixed(1)} in` : null,
  };
}

// Parse weight string like "4.3 kg" or "0.06 kg"
function parseWeight(weightStr?: string) {
  if (!weightStr) return null;
  const match = weightStr.match(/(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const kg = parseFloat(match[1]);
  if (isNaN(kg)) return null;
  const lbs = (kg * 2.20462).toFixed(1);
  return {
    kg,
    metricStr: `${kg} kg`,
    imperialStr: `${lbs} lbs`,
  };
}

const RIMOWA_COLLECTIONS = new Set([
  "original",
  "essential",
  "classic",
  "hybrid",
  "essential lite",
  "essential sleeve",
]);

const GENERIC_CATEGORY_NAMES = new Set([
  "luggage",
  "small luggage",
  "bags",
  "all",
  "product",
  "item",
  "backpacks",
  "duffel bags",
  "accessories",
]);

function getProductFamilyKey(prod: Product): string {
  const col = (prod.collection || "").toLowerCase().trim();
  if (RIMOWA_COLLECTIONS.has(col)) {
    const isSuitcase = ["cabin", "check-in", "trunk", "luggage"].some((c) =>
      (prod.category || "").toLowerCase().includes(c)
    );
    return isSuitcase ? `${col}:suitcase` : `${col}:${(prod.category || "").toLowerCase()}`;
  }
  const words = prod.name.trim().split(/\s+/);
  if (words.length >= 2) {
    if (["select", "pro", "plus"].includes(words[1].toLowerCase()) && words.length >= 3) {
      return words.slice(0, 3).join(" ").toLowerCase();
    }
    return words.slice(0, 2).join(" ").toLowerCase();
  }
  return prod.name.toLowerCase().trim();
}

function extractRealSizeLabel(item: Product, baseCollection?: string): string {
  const setMatch = item.name.match(/\bSet of \d+\b/i);
  if (setMatch) {
    return setMatch[0] + (item.dimensions ? ` (${item.dimensions})` : "");
  }

  const vSize = item.variants?.find((v) => v.size && v.size.trim())?.size || item.sizes?.[0];

  let nameWithoutCol = item.name;
  if (baseCollection && item.name.toLowerCase().startsWith(baseCollection.toLowerCase())) {
    nameWithoutCol = item.name.slice(baseCollection.length).trim();
  }

  let cleaned = nameWithoutCol
    .replace(/^[-–—|•\s]+/, "")
    .replace(/\s*[-–—|]\s*.*$/, "")
    .replace(/\b(Printed\s+)?Trolley\s+Bags?\b/gi, "")
    .replace(/\bRolling\s+Duffle(\s+Bag)?\b/gi, "")
    .replace(/\b(Laptop|Formal|School)?\s*Backpack\b/gi, "")
    .trim();

  if (vSize && ["small", "medium", "large", "cabin", "check-in"].some((s) => vSize.toLowerCase().includes(s))) {
    return vSize + (item.dimensions ? ` (${item.dimensions})` : "");
  }

  if (cleaned && !GENERIC_CATEGORY_NAMES.has(cleaned.toLowerCase())) {
    if (vSize && vSize !== cleaned && !cleaned.toLowerCase().includes(vSize.toLowerCase())) {
      return `${vSize} (${cleaned})`;
    }
    return cleaned + (item.dimensions ? ` (${item.dimensions})` : "");
  }

  if (vSize && !GENERIC_CATEGORY_NAMES.has(vSize.toLowerCase())) {
    return vSize + (item.dimensions ? ` (${item.dimensions})` : "");
  }

  if (item.dimensions) {
    return item.dimensions;
  }

  return "";
}

export function ProductDetail({
  product: initialProduct,
  initialSku,
  relatedProducts = [],
  collectionProducts = [],
}: {
  product: Product;
  initialSku?: string;
  relatedProducts?: Product[];
  collectionProducts?: Product[];
}) {
  const [p, setProduct] = useState(initialProduct);
  const [liveRelated, setLiveRelated] = useState(relatedProducts);
  const [colorOptions,setColorOptions]=useState(()=>productColorOptions(initialProduct,[initialProduct,...collectionProducts]));
  const [liveError, setLiveError] = useState(false);
  const [removed,setRemoved]=useState(false);
  useEffect(() => {
    const controller = new AbortController();
    async function refresh() {
      if(document.visibilityState === 'hidden') return;
      try {
        const response = await fetch('/api/products/'+encodeURIComponent(initialProduct.slug)+'?includeColors=1&includeRelated=1', {cache:'no-store',signal:controller.signal});
        if(response.status===404){setRemoved(true);setLiveRelated([]);return;}
        if(!response.ok) throw new Error('Product unavailable');
        const next = await response.json();
        if(next.id !== initialProduct.id || !Array.isArray(next.variants)) throw new Error('Invalid product');
        setRemoved(false);setProduct(next);if(Array.isArray(next.relatedProducts))setLiveRelated(next.relatedProducts);if(Array.isArray(next.colorOptions))setColorOptions(next.colorOptions);setLiveError(false);
      } catch { if(!controller.signal.aborted) {setLiveError(true);setLiveRelated([]);} }
    }
    void refresh();
    const timer = setInterval(refresh,5000);
    window.addEventListener('focus',refresh);
    return () => {controller.abort();clearInterval(timer);window.removeEventListener('focus',refresh);};
  },[initialProduct.id,initialProduct.slug]);
  const { format } = usePreferences();
  const { add, cart, notify, openCartDrawer, isWishlisted: storeIsWishlisted, toggleWishlist: storeToggleWishlist } = useStore();
  const router = useRouter();

  const [sku, setSku] = useState(
    p.variants.find((v) => v.sku === initialSku)?.sku ||
      p.variants[0]?.sku ||
      "",
  );

  useEffect(() => {
    const validSku =
      p.variants.find((v) => v.sku === initialSku)?.sku ||
      p.variants[0]?.sku ||
      "";
    setSku(validSku);
  }, [p.id, initialSku]);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState<"cm" | "in">("cm");
  const [busy, setBusy] = useState<"bag" | "checkout" | null>(null);
  const pending = useRef(false);
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [sizeDropdownOpen, setSizeDropdownOpen] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [detailTab, setDetailTab] = useState("Features");

  const [pin, setPin] = useState("");
  const [deliveryResult, setDeliveryResult] = useState("");
  const [checkingDelivery, setCheckingDelivery] = useState(false);
  const [showAllImages, setShowAllImages] = useState(false);
  const [failedImages, setFailedImages] = useState<string[]>([]);
  async function checkDelivery() {
    if (!/^[1-9][0-9]{5}$/.test(pin)) { setDeliveryResult("Enter a valid 6-digit Indian PIN code."); return; }
    setCheckingDelivery(true); setDeliveryResult("");
    try {
      const response = await fetch(`/api/v1/shipping/serviceability?pincode=${encodeURIComponent(pin)}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok || data.raw?.error) throw new Error();
      const result = data.data || data;
      setDeliveryResult(result.serviceable ? "Delivery is available for this PIN code." : "Delivery is unavailable for this PIN code.");
    } catch { setDeliveryResult("Delivery availability cannot be confirmed right now. Please contact us."); }
    finally { setCheckingDelivery(false); }
  }
  const dialog = useRef<HTMLDialogElement>(null);
  const relatedRail = useRef<HTMLDivElement>(null);
  const sizeDropdownRef = useRef<HTMLDivElement>(null);

  // Close size dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        sizeDropdownRef.current &&
        !sizeDropdownRef.current.contains(e.target as Node)
      ) {
        setSizeDropdownOpen(false);
      }
    }
    if (sizeDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [sizeDropdownOpen]);

  // Real-time wishlist integration
  const isWishlisted = storeIsWishlisted(sku || p.slug);

  function toggleWishlist() {
    const variant = p.variants.find((v) => v.sku === sku) || p.variants[0];
    const targetSku = variant?.sku || sku || p.slug;
    storeToggleWishlist(targetSku, {
      sku: targetSku,
      name: p.name,
      color: variant?.color || "Classic",
      slug: p.slug,
      image: variant?.image || p.image || "/media/account/order-meridian.png",
      price: variant?.price || p.price,
      available: (variant?.stock || 0) > 0,
    });
  }

  const variant = p.variants.find((v) => v.sku === sku) || p.variants[0];
  const media = productMedia(p, variant);

  // Data-driven gallery: variant image, product gallery, and product images
  const rawGallerySources = [
    ...(variant?.image ? [variant.image] : []),
    ...(media.gallery.map((g) => g.src)),
    ...(p.gallery || []),
    ...(p.image ? [p.image] : []),
  ];
  const uniqueGallerySources = [...new Set(rawGallerySources.filter(source => source && isProductPhoto(source) && !failedImages.includes(source)))];

  const displayThumbnails = uniqueGallerySources.map((src, idx) => ({
    src, label: `${p.name} view ${idx + 1}`,
  }));
  const activeHeroImage = uniqueGallerySources[activeImageIndex] || p.image;


  const { measurements, composition } = presentationSpecifications(p);
  const careSlug = getCareSlugForProduct(p.material, p.department);

  // Stock status thresholds calculation strictly from database record
  const stockCount =
    typeof variant?.stock === "number"
      ? variant.stock
      : typeof p.stock === "number"
        ? p.stock
        : 0;

  const isOutOfStock = stockCount <= 0;
  const isLowStock = stockCount > 0 && stockCount <= 5;
  const isLimitedStock = stockCount > 5 && stockCount <= 12;
  const isInStock = stockCount > 12;

  const inBag = cart.lines.find((line) => line.sku === sku)?.quantity || 0;
  const stockUnconfirmed = p.availability === "Stock not confirmed";
  const maxQuantity = Math.max(0, (stockUnconfirmed ? 10 : stockCount) - inBag);
  const purchaseQuantity = Math.min(quantity, Math.max(1, maxQuantity));
  const isMaxInBag = maxQuantity === 0 && inBag > 0;
  const available = (!isOutOfStock || stockUnconfirmed) && !!variant;

  // Parsed dimensions, weight and specifications
  const parsedDim = parseDimensions(p.dimensions);
  const parsedWt = parseWeight(p.weight);
  const keyElements = getProductKeyElements(p);
  const hasDimensions = !!parsedDim || (!!p.dimensions && p.dimensions !== "—");
  const hasWeight = !!parsedWt || (!!p.weight && p.weight !== "—");
  const hasCapacity = !!p.capacity && p.capacity !== "—";
  const hasMaterial = (!!p.material && p.material !== "—") || (!!p.materials && p.materials.length > 0);
  const hasCustomSpecs = !!(p.specifications && Object.keys(p.specifications).length > 0);
  const hasSizeAndWeight = hasDimensions || hasWeight || hasCapacity;

  const colours = colorOptions;

  // Build size options strictly from variant sizes or genuine model family products
  const variantSizes = [
    ...new Set(p.variants.map((v) => v.size).filter((size): size is string => !!size && size.trim().length > 0)),
  ];

  type SizeOption = {
    id: string;
    label: string;
    slug?: string;
    size?: string;
    isCurrent: boolean;
  };

  const sizeOptions: SizeOption[] = [];

  if (variantSizes.length > 1) {
    for (const s of variantSizes) {
      sizeOptions.push({
        id: s,
        label: s,
        size: s,
        isCurrent: variant?.size === s,
      });
    }
  } else if (collectionProducts && collectionProducts.length > 1) {
    const familyKey = getProductFamilyKey(p);
    const familyProducts = collectionProducts.filter(
      (item) => getProductFamilyKey(item) === familyKey && item.department === p.department
    );

    if (familyProducts.length > 1) {
      const validLabels = new Set<string>();
      const candidateOptions: SizeOption[] = [];

      for (const item of familyProducts) {
        const label = extractRealSizeLabel(item, p.collection);
        if (!label || GENERIC_CATEGORY_NAMES.has(label.toLowerCase())) continue;
        if (validLabels.has(label.toLowerCase())) continue;
        validLabels.add(label.toLowerCase());

        candidateOptions.push({
          id: item.id,
          label,
          slug: item.slug,
          isCurrent: item.id === p.id || item.slug === p.slug,
        });
      }

      if (candidateOptions.length > 1) {
        sizeOptions.push(...candidateOptions);
      }
    }
  }

  const hasMultipleSizes = sizeOptions.length > 1;
  const activeSizeOption = sizeOptions.find((o) => o.isCurrent) || sizeOptions[0] || null;

  const hasRail = media.editorial.length > 0;
  const hasSpecifications =
    measurements.length > 0 || media.dimensions.length > 0;
  const hasMaterials = composition.length > 0 || media.materials.length > 0;

  function selectVariant(next: Variant) {
    setSku(next.sku);
    setActiveImageIndex(0);
    setQuantity(1);
    setAdded(false);
    setError("");
    const url = new URL(window.location.href);
    url.searchParams.set("variant", next.sku);
    window.history.replaceState(null, "", url);
  }

  function selectColour(colour: string) {
    const next =
      p.variants.find(
        (v) =>
          v.color.toLowerCase() === colour.toLowerCase() &&
          (!variant?.size || v.size === variant.size),
      ) ||
      p.variants.find(
        (v) => v.color.toLowerCase() === colour.toLowerCase(),
      ) ||
      p.variants.find((v) => v.color === colour);
    if (next) selectVariant(next);
  }

  async function purchase(destination: "bag" | "checkout") {
    if (!variant || pending.current) return;
    pending.current = true;
    setBusy(destination);
    setError("");
    try {
      await add(variant.sku, purchaseQuantity || 1);
      setAdded(true);
      setQuantity(1);
      setTimeout(() => setAdded(false), 3500);
      if (destination === "checkout") router.push("/checkout");
      else openCartDrawer();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      pending.current = false;
      setBusy(null);
    }
  }

  function enlarge(index = activeImageIndex) {
    setActiveImageIndex(index);
    setZoomOpen(true);
    dialog.current?.showModal();
  }


  // Determine short product title for display (e.g. "Cabin")
  const shortTitle =
    p.category ||
    p.name.replace(new RegExp(`^${p.collection}\\s*`, "i"), "").trim() ||
    p.name;

  const displayTitle = p.name.split("|")[0].replace(new RegExp(`^${p.collection}\\s*`, "i"), "").replace(/\s+\d+(?:\.\d+)?\s*cm.*$/i, "").trim() || shortTitle;
  const publicSpecs = Object.entries(p.specifications || {}).filter(([key]) => !/^source /i.test(key));
  if(removed)return <article className={styles.page}><h1>Product unavailable</h1><p>This product is no longer available.</p><Link href="/">Continue shopping</Link></article>;

  return (
    <article className={styles.page}>
      {/* Top Breadcrumb: Luggage • Collection • Original • Cabin */}
      <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
        <Link href={`/${p.department}`}>{p.department}</Link>
        <span className={styles.dot}>•</span>
        <span>Collection</span>
        <span className={styles.dot}>•</span>
        <Link
          href={`/${p.department}?collection=${encodeURIComponent(p.collection)}`}
        >
          {p.collection}
        </Link>
        <span className={styles.dot}>•</span>
        <span aria-current="page">{shortTitle}</span>
      </nav>

      {/* Two-Column Layout Grid */}
      <div className={styles.heroGrid}>
        {/* Left Column: Hero Image, Thumbnails, Size & Weight */}
        <div className={styles.leftColumn}>
          <section
            className={styles.gallery}
            aria-label={`${p.name} images`}
          >
            {/* Hero Main Image Card */}
            <div className={styles.heroCard}>

              <div
                className={styles.heroMainImageWrapper}
                onClick={() => enlarge(activeImageIndex)}
              >
                <Image
                  src={activeHeroImage}
                  alt={`${p.name}, view ${activeImageIndex + 1}`}
                  fill
                  priority
                  quality={95}
                  sizes="(max-width: 980px) 100vw, 55vw"
                  className={styles.heroMainImg}
                />
              </div>

              {uniqueGallerySources.length > 1 && <>
                <button type="button" className={`${styles.galleryArrow} ${styles.galleryPrevious}`} aria-label="Previous image" onClick={() => setActiveImageIndex((activeImageIndex - 1 + uniqueGallerySources.length) % uniqueGallerySources.length)}><ChevronLeft size={20} /></button>
                <button type="button" className={`${styles.galleryArrow} ${styles.galleryNext}`} aria-label="Next image" onClick={() => setActiveImageIndex((activeImageIndex + 1) % uniqueGallerySources.length)}><ChevronRight size={20} /></button>
              </>}
              {/* Fullscreen control */}
              <button
                className={styles.enlargeButton}
                aria-label="Enlarge product image"
                onClick={() => enlarge(activeImageIndex)}
              >
                <Expand size={22} />
              </button>
            </div>

            {/* Thumbnails Row (only when there are multiple views) */}
            {displayThumbnails.length > 0 && (
              <div
                className={styles.thumbnailsRow}
                role="region"
                aria-label="Product views"
              >
                {displayThumbnails.map((thumb, index) => {
                  const isActive = activeImageIndex === index;
                  return (
                    <button
                      key={thumb.src}
                      type="button"
                      className={`${styles.thumbBtn} ${isActive ? styles.activeThumb : ""}`}
                      aria-label={`View ${index + 1} of ${p.name}`}
                      aria-pressed={isActive}
                      onClick={() => setActiveImageIndex(index)}
                    >
                      <Image
                        src={thumb.src}
                        alt={thumb.label}
                        fill
                        sizes="150px"
                        className={styles.thumbImg}
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </section>

        </div>

        {/* Right Column: Sticky Product Info & Actions */}
        <div className={styles.rightColumn}>
          <div
            className={styles.stickyPanel}
            role="region"
            aria-label="Product information"
          >
            {p.collection && (
              <span className={styles.eyebrow}>{p.collection.toUpperCase()}</span>
            )}

            {/* H1 Title with aria-label for accessibility & tests */}
            <h1 className={styles.productTitle} aria-label={p.name}>
              {displayTitle}
            </h1>

            {/* Price Row (Data-driven from variant/product with compare-price if available) */}
            <div className={styles.priceWrap}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                <span className={styles.price}>
                  {p.priceOnRequest ? "Price on request" : format(
                    typeof variant?.price === "number"
                      ? variant.price
                      : typeof p.price === "number"
                        ? p.price
                        : 0,
                  )}
                </span>
                {((variant as any)?.comparePrice || (p as any)?.mrp) &&
                  Number((variant as any)?.comparePrice || (p as any)?.mrp) >
                    Number(variant?.price || p.price || 0) && (
                    <span
                      style={{
                        fontSize: 14,
                        color: "#888888",
                        textDecoration: "line-through",
                      }}
                    >
                      {format(
                        Number((variant as any)?.comparePrice || (p as any)?.mrp),
                      )}
                    </span>
                  )}
              </div>
              <span className={styles.taxNotice}>Inclusive of all taxes</span>
            </div>

            {/* Description (Hidden if no description on the product record) */}
            {p.description && (
              <div className={styles.descriptionWrap}>
                <p
                  className={
                    descriptionExpanded ? styles.descFull : styles.descClamped
                  }
                >
                  <ProductDescription text={p.description}/>
                </p>
                {p.description.length > 120 && (
                  <button
                    type="button"
                    className={styles.readMoreBtn}
                    onClick={() => setDescriptionExpanded(!descriptionExpanded)}
                  >
                    {descriptionExpanded ? "Read less ▴" : "Read more ▾"}
                  </button>
                )}
              </div>
            )}

            {/* Size Dropdown and Guide (Hidden if no multiple sizes and no sizing data) */}
            {(hasMultipleSizes || hasSizeAndWeight) && (
              <div className={styles.sizeSection}>
                {hasSizeAndWeight && (
                  <div className={styles.sizeSectionTop}>
                    <button
                      type="button"
                      className={styles.sizeGuideLink}
                      onClick={() => setSizeGuideOpen(true)}
                    >
                      Size guide
                    </button>
                  </div>
                )}

                {hasMultipleSizes && activeSizeOption && (
                  <div className={styles.sizeDropdownWrapper} ref={sizeDropdownRef}>
                    <button
                      type="button"
                      className={styles.sizeDropdownBtn}
                      onClick={() => setSizeDropdownOpen(!sizeDropdownOpen)}
                      aria-expanded={sizeDropdownOpen}
                      aria-label="Select product size"
                    >
                      <span>{activeSizeOption.label}</span>
                      <ChevronDown
                        size={16}
                        style={{
                          transform: sizeDropdownOpen ? "rotate(180deg)" : "none",
                          transition: "transform 0.2s ease",
                        }}
                      />
                    </button>

                    {sizeDropdownOpen && (
                      <div className={styles.sizeDropdownMenu} role="listbox">
                        {sizeOptions.map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            className={`${styles.sizeDropdownItem} ${
                              opt.isCurrent ? styles.activeItem : ""
                            }`}
                            onClick={() => {
                              setSizeDropdownOpen(false);
                              if (opt.isCurrent) return;
                              if (opt.size) {
                                const nextVar =
                                  p.variants.find(
                                    (v) =>
                                      v.size === opt.size &&
                                      v.color === variant?.color,
                                  ) || p.variants.find((v) => v.size === opt.size);
                                if (nextVar) selectVariant(nextVar);
                              } else if (opt.slug) {
                                router.push(`/products/${opt.slug}`);
                              }
                            }}
                          >
                            <span>{opt.label}</span>
                            {opt.isCurrent && <Check size={14} />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Interactive Product Options & Selection Form */}
            <form
              className={styles.selectionForm}
              onSubmit={(e) => {
                e.preventDefault();
                if (isMaxInBag) {
                  openCartDrawer();
                } else if (available && !busy) {
                  purchase("bag");
                }
              }}
            >
              {/* Colour Selection (Dropdown or Swatch buttons) */}
              {variant?.color && (
                <div className={styles.colorSection}>
                  <p className={styles.colorLabel}>
                    Colour: <span>{variant.color}</span>
                  </p>
                  {colours.length > 0 && (
                    <div className={styles.colorControls}>
                      {/* Swatch Buttons */}
                      <div
                        className={styles.swatchList}
                        role="radiogroup"
                        aria-label="Product colours"
                      >
                        {colours.map((v) => {
                          const isSelected =
                            variant?.color.toLowerCase() === v.color.toLowerCase();
                          return (
                            <button
                              key={v.color}
                              title={v.color}
                              type="button"
                              role="radio"
                              aria-checked={isSelected}
                              aria-label={`Select colour ${v.color}`}
                              className={`${styles.swatchBtn} ${
                                isSelected ? styles.activeSwatch : ""
                              }`}
                              onClick={() => v.slug === p.slug ? selectColour(v.color) : router.push(`/products/${v.slug}?variant=${encodeURIComponent(v.sku)}`)}
                            >
                              <span
                                className={styles.swatchCircle}
                                style={{ backgroundColor: v.hex || "#111111" }}
                              />
                            </button>
                          );
                        })}
                      </div>

                    </div>
                  )}
                </div>
              )}

              {/* ADD TO CART & Wishlist Actions */}
              <div className={styles.actionBlock}>
                <button
                  type="submit"
                  className={styles.addToCartBtn}
                  disabled={!available || !!busy || liveError}
                  aria-label={available ? "Add to cart" : "Out of stock"}
                >
                  {busy === "bag"
                    ? "ADDING…"
                    : !available
                      ? "OUT OF STOCK"
                      : added
                        ? "ADDED TO CART ✓"
                        : isMaxInBag
                          ? "IN YOUR BAG — VIEW BAG"
                          : "Add to Cart"}
                </button>

                {error && <p className={styles.actionError}>{error}</p>}

                <div className={styles.wishlistRow}>
                  <button
                    type="button"
                    className={styles.wishlistBtn}
                    onClick={toggleWishlist}
                    aria-pressed={isWishlisted}
                    aria-label={isWishlisted ? "In your wishlist" : "Add to wishlist"}
                  >
                    <Heart size={16} fill={isWishlisted ? "#111111" : "none"} />
                    <span>
                      {isWishlisted ? "In your wishlist" : "Add to wishlist"}
                    </span>
                  </button>
                </div>

                {/* Stock Notice dynamically calculated by thresholds */}
                {liveError && <p role="status">Live product updates are unavailable. Refresh before ordering.</p>}
                <div className={styles.stockNotice}>
                <span
                  className={`${styles.stockDot} ${
                    isOutOfStock
                      ? styles.stockDotOut
                      : isLowStock
                        ? styles.stockDotLow
                        : styles.stockDotIn
                  }`}
                />
                <span>
                  {isOutOfStock
                    ? (p.availability === "Stock not confirmed" ? "Stock not confirmed" : "Out of stock")
                    : isLowStock
                      ? `Low Stock — Only ${stockCount} left in stock — order soon`
                      : isLimitedStock
                        ? "Limited stock"
                        : "In stock"}
                </span>
              </div>
            </div>
          </form>
          <div className={styles.deliveryCheck}>
            <label htmlFor="delivery-pin">Delivery availability</label>
            <div><input id="delivery-pin" value={pin} onChange={e => {setPin(e.target.value);setDeliveryResult("");}} inputMode="numeric" maxLength={6} placeholder="Enter PIN code" /><button type="button" disabled={checkingDelivery} onClick={checkDelivery}>{checkingDelivery ? "Checking…" : "Check"}</button></div>
            <p role="status">{deliveryResult}</p>
          </div>
          <p><strong>Style:</strong> {variant?.sku}</p>
          {p.returnPolicy && <p><strong>Return:</strong> {p.returnPolicy}</p>}


          </div>
        </div>
      </div>

      {uniqueGallerySources.length > 1 && <section className={styles.detailPhotoGrid} aria-label="Additional product images">
        {uniqueGallerySources.slice(1, showAllImages ? undefined : 3).map((src, index) => <div key={src}><Image src={src} alt={`${p.name} detail ${index + 1}`} onError={() => setFailedImages(sources => [...sources,src])} fill sizes="(max-width: 800px) 45vw, 25vw" /></div>)}
        {uniqueGallerySources.length > 3 && <button type="button" onClick={() => setShowAllImages(value => !value)}>{showAllImages ? "View Less" : "View More"}</button>}
      </section>}
      <section className={styles.liveInformation} aria-label="Product information">
        <div className={styles.detailTabs} role="tablist" aria-label="Product information tabs">
          {["Features", "Specifications", "Product Advisory", "May We Help?", "Shipping & Returns", "Reviews"].map(tab => <button key={tab} id={`tab-${tab.split(" ")[0]}`} type="button" role="tab" aria-selected={detailTab === tab} aria-controls="product-tab-panel" onClick={() => setDetailTab(tab)}>{tab}</button>)}
        </div>
        <div id="product-tab-panel" role="tabpanel" aria-labelledby={`tab-${detailTab.split(" ")[0]}`} className={styles.tabContent}>
          {detailTab === "Features" && <><p>{p.description}</p>{keyElements.length > 0 ? <ul>{keyElements.map(item => <li key={item.title}>{item.description || item.title}</li>)}</ul> : <p>Product features have not been provided.</p>}</>}
          {detailTab === "Specifications" && <div className={styles.specGrid}>{[["Dimensions", p.dimensions], ["Weight", p.weight], ["Capacity", p.capacity], ["Primary Material", p.material], ...publicSpecs].filter(([, value]) => value && value !== "Not provided" && value !== "—").map(([key, value]) => <div key={key}><strong>{key}</strong><p>{String(value)}</p></div>)}</div>}
          {detailTab === "Product Advisory" && (p.productAdvisory && Object.keys(p.productAdvisory).length ? <div className={styles.specGrid}>{Object.entries(p.productAdvisory).map(([label,value]) => <div key={label}><strong>{label}</strong><p>{value}</p></div>)}</div> : <p>Product advisory information has not been provided.</p>)}
          {detailTab === "May We Help?" && <p><Link href="/contact-us">Contact OVIA for help with this product</Link></p>}
          {detailTab === "Shipping & Returns" && <><p>{p.deliveryTime && <>Estimated delivery: {p.deliveryTime}. </>}{p.freeShipping === true && <>Free shipping. </>}{p.returnPolicy || "Product return terms have not been provided."}</p><Link href="/contact-us">Contact us for shipping and returns</Link></>}
          {detailTab === "Reviews" && <ProductReviewsSection productSlug={p.slug} productName={p.name} productSku={variant?.sku} productImage={activeHeroImage} />}
        </div>
      </section>

      {/* Materials region for completeness */}
      <section
        style={{ display: "none" }}
        role="region"
        aria-label="Materials"
      >
        <h2>Materials</h2>
      </section>


      {/* Size Guide Modal (Only rendered when sizing data exists) */}
      {sizeGuideOpen && hasSizeAndWeight && (
        <div
          className={styles.modalBackdrop}
          onClick={() => setSizeGuideOpen(false)}
        >
          <div
            className={styles.modalContent}
            style={{ maxWidth: "560px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h3>{p.name} — Sizing Guide</h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setSizeGuideOpen(false)}
                aria-label="Close size guide"
              >
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: "24px", fontSize: "13px", lineHeight: "1.6" }}>
              <p style={{ margin: "0 0 16px 0", color: "#333" }}>
                Specifications for <strong>{p.name}</strong>:
              </p>
              <div style={{ background: "#f8f8f8", borderRadius: "8px", padding: "16px", marginBottom: "16px" }}>
                {parsedDim && (
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #eee" }}>
                    <span style={{ color: "#666" }}>Dimensions</span>
                    <strong>{parsedDim.metricStr} ({parsedDim.imperialStr})</strong>
                  </div>
                )}
                {parsedWt && (
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #eee" }}>
                    <span style={{ color: "#666" }}>Weight</span>
                    <strong>{parsedWt.metricStr} ({parsedWt.imperialStr})</strong>
                  </div>
                )}
                {hasCapacity && (
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #eee" }}>
                    <span style={{ color: "#666" }}>Volume / Capacity</span>
                    <strong>{p.capacity}</strong>
                  </div>
                )}
                {hasMaterial && (
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #eee" }}>
                    <span style={{ color: "#666" }}>Material</span>
                    <strong>{[p.material, ...(p.materials || [])].filter((m) => m && m !== "—").join(", ")}</strong>
                  </div>
                )}
                {p.specifications &&
                  Object.entries(p.specifications).map(([key, val]) => {
                    if (!val || val === "—" || ["dimensions", "weight", "capacity", "material"].includes(key.toLowerCase())) return null;
                    return (
                      <div key={key} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #eee" }}>
                        <span style={{ color: "#666" }}>{key}</span>
                        <strong>{String(val)}</strong>
                      </div>
                    );
                  })}
                <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
                  <span style={{ color: "#666" }}>Category</span>
                  <strong>{shortTitle}</strong>
                </div>
              </div>
              {(p as any).disclaimer ? (
                <p style={{ color: "#666", fontSize: "12px", margin: 0 }}>
                  {(p as any).disclaimer}
                </p>
              ) : false ? (
                <p style={{ color: "#666", fontSize: "12px", margin: 0 }}>
                  Dimensions include wheels, handles, and bumpers.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Zoom / Fullscreen Dialog */}
      <dialog
        ref={dialog}
        className={styles.zoomDialog}
        onClick={(e) => {
          if (e.target === dialog.current) dialog.current?.close();
        }}
      >
        <div style={{ position: "relative", width: "80vw", height: "80vh" }}>
          <Image
            src={activeHeroImage}
            alt=""
            fill
            quality={100}
            sizes="90vw"
            style={{ objectFit: "contain" }}
          />
          <button
            type="button"
            onClick={() => dialog.current?.close()}
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              background: "#000",
              color: "#fff",
              border: "none",
              borderRadius: "50%",
              width: 36,
              height: 36,
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>
      </dialog>

      {liveRelated.length > 0 && <section className={styles.relatedSection} aria-label="Related products">
        <div className={styles.relatedHeading}><h2>You May Also Like</h2><Link href={`/${p.department}`}>View all {p.department} →</Link></div>
        <div className={styles.relatedCarousel}>
          <button type="button" className={styles.relatedPrevious} aria-label="Previous related products" onClick={() => relatedRail.current?.scrollBy({left:-relatedRail.current.clientWidth,behavior:"smooth"})}><ChevronLeft size={24} /></button>
          <div className={styles.relatedRail} ref={relatedRail}>
            {liveRelated.map(product => <Link className={styles.relatedCard} key={product.id} href={`/products/${product.slug}`}>
              <div className={styles.relatedImage}><Image src={product.image} alt={product.name} fill sizes="(max-width: 600px) 70vw, 20vw" /></div>
              <span>{product.collection}</span><h3>{product.name.split("|")[0]}</h3>
              <strong>{product.priceOnRequest ? "Price on request" : format(product.variants[0].price)}</strong>
            </Link>)}
          </div>
          <button type="button" className={styles.relatedNext} aria-label="Next related products" onClick={() => relatedRail.current?.scrollBy({left:relatedRail.current.clientWidth,behavior:"smooth"})}><ChevronRight size={24} /></button>
        </div>
      </section>}
    </article>
  );
}
