import type { Product } from "./catalog";
import { slugify, canonicalCategory as categoryKey } from "./catalog-helpers";

export type Filters = {
  department?: string;
  category?: string;
  subCategory?: string;
  subcategory?: string;
  q?: string;
  material?: string;
  color?: string;
  collection?: string;
  sort?: string;
  page?: string;
  limit?: string;
  tag?: string;
  use?: string;
};

function matchesLuggageSize(product: Product, size: "small" | "medium" | "large") {
  if (product.department !== "luggage") return false;
  const sizeFields = [
    ...(product.sizes || []),
    ...product.variants.flatMap(variant => "size" in variant && typeof variant.size === "string" ? [variant.size] : []),
    ...Object.entries(product.specifications || {}).filter(([key]) => /\bsize\b/i.test(key)).map(([, value]) => value),
  ];
  const assignedValues = [
    product.category, product.subcategory || "", ...(product.catalogCategories || []),
    ...product.tags, ...sizeFields,
  ];
  const abbreviations: Record<string, string> = { small: "s", medium: "m", large: "l" };
  const assignedSizes = ["small", "medium", "large"].filter(value =>
    assignedValues.some(label => new RegExp(`\\b${value}\\b`, "i").test(label)) ||
    sizeFields.some(label => label.trim().toLowerCase() === abbreviations[value])
  );
  if (assignedSizes.length) return assignedSizes.includes(size);

  // Dimensions classify cases only when the source provides a unit and no size label.
  // Non-case products in the luggage department retain their original categories.
  const isCase = [product.category, product.subcategory || "", ...(product.catalogCategories || [])].some(value => ["cabin", "check-in", "trunk", "luggage", "cabin-luggage", "check-in-luggage"].includes(slugify(value)));
  if (!isCase || /\b(briefcase|chess|mahjong|poker|backpack|duffel|duffle|tote|cross[- ]?body|shoulder|iphone|phone|stickers|sunglasses|toiletry)\b/i.test(product.name)) return false;
  const dimensions = (product.dimensions || "").trim();
  if (!/^\d+(?:\.\d+)?(?:\s*[x×]\s*\d+(?:\.\d+)?){0,2}\s*(?:cm|mm|inches|inch|in|″|")$/i.test(dimensions)) return false;
  const unit = dimensions.match(/(?:cm|mm|inches|inch|in|″|")$/i)?.[0].toLowerCase();
  const values = dimensions.match(/\d+(?:\.\d+)?/g)?.map(Number) || [];
  const height = Math.max(...values) * (unit === "mm" ? 0.1 : unit === "cm" ? 1 : 2.54);
  if (height < 40) return false;
  return size === "small" ? height <= 56 : size === "medium" ? height > 56 && height < 70 : height >= 70;
}

export function filterProducts(catalog: Product[], f: Filters) {
  const subcat = categoryKey(f.subcategory || f.subCategory || "");
  let result = catalog.filter(
    (p) => {
      // Department filter
      if (f.department && p.department !== f.department) return false;

      // Category filter
      if (f.category) {
        const cat = categoryKey(f.category);
        const pCat = p.category.toLowerCase();
        const luggageSize = cat === "small-luggage" ? "small" : cat === "medium-luggage" ? "medium" : cat === "large-luggage" ? "large" : null;
        const isWeekendCategory = ["weekend-bags", "weekends-bags", "weekender-bags"].includes(cat);
        const isWeekendBag = isWeekendCategory && p.department === "bags" && (
          [p.category, p.subcategory || "", ...(p.catalogCategories || []), ...p.tags].some(value =>
            ["weekend", "weekends", "weekender", "weekenders", "weekend-bags", "weekends-bags", "weekender-bags"].includes(slugify(value))
          ) || /\bweekend(?:er|s)?\b/i.test(p.name)
        );
        const isTrunk = (cat === "trunk" || cat === "trunks" || cat === "large") && (pCat.includes("trunk") || p.tags.includes("trunk"));
        const isCabin = cat === "cabin" && (pCat === "cabin" || p.tags.includes("cabin"));
        const isCheckIn = (cat === "check-in" || cat === "checkin") && (pCat.includes("check") || p.tags.includes("check-in"));
        const isEmblematic = cat === "emblematic-pieces" && (p.tags.includes("emblematic") || p.tags.includes("best-sellers"));
        const isPhoneCase = (cat === "iphone-cases" || cat === "phone-cases") && (pCat.includes("phone") || p.subcategory === "iphone-cases" || p.tags.includes("iphone-cases"));
        const isHat = (cat === "hats" || cat === "hat") && (pCat.includes("hat") || p.tags.includes("hats"));
        const isGlasses = (cat === "sunglasses" || cat === "eyewear") && (pCat.includes("sunglass") || p.tags.includes("sunglasses"));
        const isBelt = (cat === "belts" || cat === "belt") && (pCat.includes("belt") || p.tags.includes("belts"));
        const isCardHolder = (cat === "card-holders" || cat === "card-holder") && (pCat.includes("card") || p.tags.includes("card-holders"));
        const isAddressTag = (cat === "address-tags" || cat === "address-tag" || cat === "leather-luggage-tags") && (pCat.includes("tag") || p.tags.includes("address-tags"));
        const isStickers = (cat === "stickers" || cat === "sticker" || cat === "all-stickers" || cat === "city-stickers") && (pCat.includes("sticker") || p.tags.includes("stickers"));
        const isBagStrap = (cat === "bag-straps" || cat === "bag-strap" || cat === "bags-straps" || cat === "straps") && (pCat.includes("strap") || p.tags.includes("bag-straps"));
        const isWheels = (cat === "wheels" || cat === "wheel" || cat === "classic-wheels") && (pCat.includes("wheel") || p.tags.includes("wheels"));
        const isCustomisation = (cat === "customisation" || cat === "customization") && (p.tags.includes("customisation") || p.tags.includes("customization") || isAddressTag || isStickers || isBagStrap || isWheels);
        const mappedCategory = p.catalogCategories && ["trunk", "trunks", "check-in", "checkin", "cabin", "luggage", "cabin-bags", "backpacks", "duffle-bags", "briefcases", "crossbodies", "totes", "shoulder-bags", "hand-carry", "bags", "travel-bags"].includes(cat);
        const canonicalCategory = cat === "trunks" ? "trunk" : cat === "checkin" ? "check-in" : cat;
        const matchesCat = luggageSize ? matchesLuggageSize(p, luggageSize) : isWeekendCategory ? isWeekendBag : mappedCategory ? p.catalogCategories!.some(value => categoryKey(value) === canonicalCategory) : isTrunk || isCabin || isCheckIn || isEmblematic || isPhoneCase || isHat || isGlasses || isBelt || isCardHolder || isAddressTag || isStickers || isBagStrap || isWheels || isCustomisation ||
          categoryKey(p.category) === cat ||
          p.tags.includes(cat) ||
          p.name.toLowerCase().includes(cat);
        if (!matchesCat) return false;
      }

      // Subcategory filter
      if (subcat) {
        const luggageSubSize = subcat === "small-luggage" ? "small" : subcat === "medium-luggage" ? "medium" : subcat === "large-luggage" ? "large" : null;
        const isTrunkSub = (subcat === "trunk" || subcat === "trunks" || subcat === "large-luggage" || subcat === "large") && (p.category.toLowerCase().includes("trunk") || p.tags.includes("trunk"));
        const isCabinSub = subcat === "cabin" && (p.category.toLowerCase() === "cabin" || p.tags.includes("cabin"));
        const isCheckInSub = (subcat === "check-in" || subcat === "checkin") && (p.category.toLowerCase().includes("check") || p.tags.includes("check-in"));
        const isBestSellers = subcat === "best-sellers" && (p.tags.includes("best-sellers") || p.tags.includes("emblematic"));
        const isNewArrivals = subcat === "new-arrivals" && p.tags.includes("new-arrivals");
        const isShortTrips = (subcat === "short-trips" || subcat === "short-trip") && (p.tags.includes("short-trips") || p.tags.includes("cabin"));
        const isLongJourneys = (subcat === "long-journeys" || subcat === "long-haul") && (p.tags.includes("long-haul") || p.tags.includes("long-journeys") || p.category.toLowerCase().includes("check") || p.category.toLowerCase().includes("trunk"));
        const isBusiness = (subcat === "business-selection" || subcat === "business") && (p.tags.includes("business-selection") || p.tags.includes("business-bags"));
        const isCustomisationSub = (subcat === "customisation" || subcat === "customization") && (p.tags.includes("customisation") || p.tags.includes("customization"));
        const isAddressTagSub = (subcat === "address-tags" || subcat === "address-tag") && (p.category.toLowerCase().includes("tag") || p.tags.includes("address-tags"));
        const isStickersSub = (subcat === "stickers" || subcat === "all-stickers") && (p.category.toLowerCase().includes("sticker") || p.tags.includes("stickers"));
        const isBagStrapSub = (subcat === "bag-straps" || subcat === "bag-strap") && (p.category.toLowerCase().includes("strap") || p.tags.includes("bag-straps"));
        const isWheelsSub = (subcat === "wheels" || subcat === "wheel") && (p.category.toLowerCase().includes("wheel") || p.tags.includes("wheels"));
        const mappedSubcategory = p.catalogCategories && ["trunk", "trunks", "check-in", "checkin", "cabin", "luggage", "cabin-bags", "cabin bags", "backpacks", "duffle-bags", "briefcases", "crossbodies", "totes", "shoulder-bags", "hand-carry", "bags", "travel-bags"].includes(subcat);
        const canonicalSubcategory = subcat === "trunks" ? "trunk" : subcat === "checkin" ? "check-in" : slugify(subcat);
        const assignedTravelSub = p.travelTypes && ["long-haul", "long-journeys", "short-trips", "business-selection", "business"].includes(subcat);
        const travelSubKey = subcat === "long-journeys" ? "long-haul" : subcat === "business" ? "business-selection" : subcat;
        const matchesSubcat = luggageSubSize ? matchesLuggageSize(p, luggageSubSize) : assignedTravelSub ? p.travelTypes!.includes(travelSubKey) : mappedSubcategory ? p.catalogCategories!.some(value => categoryKey(value) === canonicalSubcategory) : isTrunkSub || isCabinSub || isCheckInSub || isBestSellers || isNewArrivals || isShortTrips || isLongJourneys || isBusiness ||
          isCustomisationSub || isAddressTagSub || isStickersSub || isBagStrapSub || isWheelsSub ||
          p.name.toLowerCase().includes(subcat) ||
          p.tags.includes(slugify(subcat)) ||
          (p.subcategory && categoryKey(p.subcategory) === subcat);
        if (!matchesSubcat) return false;
      }

      // Search query
      if (f.q && !`${p.name} ${p.material} ${p.category} ${p.description}`.toLowerCase().includes(f.q.toLowerCase().slice(0, 100))) {
        return false;
      }

      // Material
      if (f.material) {
        const mat = f.material.toLowerCase();
        const pMat = p.material.toLowerCase();
        if (pMat !== mat && !pMat.includes(mat) && !(p.materials && p.materials.some(m => m.toLowerCase().includes(mat)))) {
          return false;
        }
      }

      // Color
      if (f.color) {
        const fc = f.color.toLowerCase();
        const hasColor = p.variants.some((v) => {
          const vc = v.color.toLowerCase();
          if (vc === fc || vc.includes(fc)) return true;
          if (fc === "black" && (vc.includes("black") || vc.includes("graphite"))) return true;
          if (fc === "grey" && (vc.includes("grey") || vc.includes("graphite") || vc.includes("titanium"))) return true;
          if (fc === "silver" && vc.includes("silver")) return true;
          if ((fc === "blue" || fc === "midnight blue") && (vc.includes("blue") || vc.includes("midnight") || vc.includes("indigo") || vc.includes("navy"))) return true;
          if (fc === "green" && vc.includes("green")) return true;
          if (fc === "white" && vc.includes("white")) return true;
          if (fc === "brown" && (vc.includes("brown") || vc.includes("dune") || vc.includes("clay") || vc.includes("cognac"))) return true;
          return false;
        }) || (p.colors && p.colors.some(c => c.toLowerCase().includes(fc))) ||
          (p.tags && ((fc === "blue" || fc === "midnight blue") ? (p.tags.includes("blue") || p.tags.includes("midnight-blue")) : p.tags.includes(fc)));
        if (!hasColor) return false;
      }

      // Collection
      if (f.collection) {
        const col = f.collection.toLowerCase();
        const pCol = p.collection.toLowerCase();
        const matchesCol = pCol === col || (col === "emblematic" && (p.tags.includes("emblematic") || p.tags.includes("best-sellers"))) || (p.collections && p.collections.some(c => c.toLowerCase() === col));
        if (!matchesCol) return false;
      }

      // Tag
      if (f.tag) {
        const t = f.tag.toLowerCase();
        const assignedTravel = p.travelTypes && ["long-haul", "long-journeys", "short-trips", "business-selection", "business"].includes(t);
        const travelKey = t === "long-journeys" ? "long-haul" : t === "business" ? "business-selection" : t;
        const matchesTag = assignedTravel ? p.travelTypes!.includes(travelKey) : p.tags.includes(t) ||
          (t === "emblematic" && (p.tags.includes("emblematic") || p.tags.includes("best-sellers") || p.tags.includes("signature-pieces"))) ||
          ((t === "long-journeys" || t === "long-haul") && (p.tags.includes("long-haul") || p.tags.includes("long-journeys") || p.category.toLowerCase().includes("check") || p.category.toLowerCase().includes("trunk"))) ||
          (t === "short-trips" && (p.tags.includes("short-trips") || p.tags.includes("cabin"))) ||
          ((t === "business-selection" || t === "business") && (p.tags.includes("business-selection") || p.tags.includes("business-bags"))) ||
          (t === "gifts" && p.tags.includes("gifts"));
        if (!matchesTag) return false;
      }

      // Use
      if (f.use) {
        if (f.use === "business" && !(p.tags.includes("business-bags") || p.tags.includes("business-selection"))) return false;
        if (f.use === "travel" && !p.tags.includes("travel-bags")) return false;
      }

      return true;
    }
  );

  if (f.sort === "price-asc")
    result = result.sort((a, b) => (a.variants[0]?.price || 0) - (b.variants[0]?.price || 0));
  if (f.sort === "price-desc")
    result = result.sort((a, b) => (b.variants[0]?.price || 0) - (a.variants[0]?.price || 0));
  if (f.sort === "name")
    result = result.sort((a, b) => a.name.localeCompare(b.name));
  if (!f.sort)
    result = result.sort((a, b) => (a.catalogOrder ?? Number.MAX_SAFE_INTEGER) - (b.catalogOrder ?? Number.MAX_SAFE_INTEGER));

  const total = result.length;
  const pageSize = f.limit ? Math.max(1, Number(f.limit) || 24) : 36;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(
    pages,
    Math.max(1, Number.parseInt(f.page || "1") || 1),
  );
  return {
    items: result.slice((page - 1) * pageSize, page * pageSize),
    total,
    page,
    limit: pageSize,
    pages,
  };
}
