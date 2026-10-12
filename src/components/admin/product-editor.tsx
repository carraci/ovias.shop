"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import styles from "./product-editor.module.css";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Upload,
  Check,
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
  Star,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Play,
  CheckCircle2,
  Globe,
  Eye,
  Info,
  Layers,
  Sparkles,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote,
  Code,
  Link2,
} from "lucide-react";

export interface ColorVariant {
  sku: string;
  color: string;
  hex: string;
  size?: string;
  price: number;
  stock: number;
  image?: string;
}

export const STANDARD_COLOR_HEX_MAP: Record<string, string> = {
  black: "#222224",
  blue: "#2563eb",
  "royal blue": "#1d4ed8",
  "sky blue": "#0ea5e9",
  navy: "#1e3a8a",
  brown: "#8d5b4c",
  tan: "#c89d66",
  cognac: "#9a4d28",
  grey: "#6b7280",
  gray: "#6b7280",
  silver: "#bec1bd",
  white: "#f4f4f5",
  green: "#15803d",
  olive: "#556b2f",
  red: "#dc2626",
  burgundy: "#7f1d1d",
  maroon: "#800000",
  yellow: "#eab308",
  orange: "#ea580c",
  pink: "#ec4899",
  purple: "#9333ea",
  beige: "#d4c5b9",
  charcoal: "#374151",
  graphite: "#4b5563",
  taupe: "#8b8589",
  champagne: "#fad6a5",
};

export function resolveColorHex(
  colorName?: string,
  customHex?: string,
  fallbackText?: string,
): string {
  if (customHex && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(customHex)) {
    return customHex;
  }
  const normalized = colorName?.toLowerCase().trim() || "";
  if (STANDARD_COLOR_HEX_MAP[normalized]) {
    return STANDARD_COLOR_HEX_MAP[normalized];
  }
  if (fallbackText) {
    const textLower = fallbackText.toLowerCase();
    for (const [key, hex] of Object.entries(STANDARD_COLOR_HEX_MAP)) {
      if (new RegExp(`\\b${key}\\b`, "i").test(textLower)) {
        return hex;
      }
    }
  }
  return "#222224";
}

interface ProductEditorProps {
  initialData?: any;
  isEditing?: boolean;
}

export function ProductEditor({
  initialData,
  isEditing = false,
}: ProductEditorProps) {
  const router = useRouter();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [shortDescription, setShortDescription] = useState(
    initialData?.shortDesc || "",
  );
  const [publishAt, setPublishAt] = useState(
    initialData?.publishAt
      ? new Date(Date.parse(initialData.publishAt)-new Date(initialData.publishAt).getTimezoneOffset()*60000).toISOString().slice(0,16)
      : "",
  );
  const [scheduled, setScheduled] = useState(
    Boolean(
      initialData?.publishAt && Date.parse(initialData.publishAt) > Date.now(),
    ),
  );
  const [oldPrice, setOldPrice] = useState<number>(initialData?.oldPrice ?? 0);


  const [step, setStep] = useState(1);
  const steps = [
    "Overview",
    "Basic Information",
    "Media",
    "Pricing & Inventory",
    "Variants",
    "Description & Specifications",
    "Shipping",
    "SEO & Sharing",
  ];
  const [identity, setIdentity] = useState<Record<string, string>>(
    initialData?.identity || {},
  );
  const [selectedImage, setSelectedImage] = useState(initialData?.image || "");
  const [imageAltMap, setImageAltMap] = useState<Record<string, string>>(
    initialData?.imageAltMap || {},
  );

  const [imageVariantAssignments, setImageVariantAssignments] = useState<
    Record<string, string>
  >(initialData?.imageVariantAssignments || {});
  const [imageTitleMap, setImageTitleMap] = useState<Record<string, string>>(
    initialData?.imageTitleMap || {},
  );
  const [imageColorMap, setImageColorMap] = useState<
    Record<string, { name: string; hex: string }>
  >(initialData?.imageColorMap || {});
  const [customVariant, setCustomVariant] = useState({
    sku: "",
    color: "",
    size: "",
  });
  const [showCustomVariant, setShowCustomVariant] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replacementInputRef = useRef<HTMLInputElement>(null);
  const singleReplaceInputRef = useRef<HTMLInputElement>(null);
  const [imageMetaMap, setImageMetaMap] = useState<
    Record<
      string,
      {
        dimensions?: string;
        size?: string;
        isWebp?: boolean;
        width?: number;
        height?: number;
      }
    >
  >({});
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(
    null,
  );
  const [dragOverImageIndex, setDragOverImageIndex] = useState<number | null>(
    null,
  );
  const [replaceTargetIndex, setReplaceTargetIndex] = useState<number | null>(
    null,
  );
  const [isDropActive, setIsDropActive] = useState(false);
  const [compressionStatus, setCompressionStatus] = useState<string>("");
  const [sale, setSale] = useState(
    initialData?.sale || {
      enabled: false,
      price: 0,
      startDate: "",
      endDate: "",
    },
  );
  const [shippingRules, setShippingRules] = useState<{
    standardShippingFee: number;
    freeShippingThreshold: number;
  } | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/admin/settings", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((result) => {
        if (
          Number.isFinite(result?.shipping?.standardShippingFee) &&
          Number.isFinite(result?.shipping?.freeShippingThreshold)
        )
          setShippingRules(result.shipping);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);
  const [customSpecifications, setCustomSpecifications] = useState<
    [string, string][]
  >(Object.entries(initialData?.specifications || {}));
  const ogFileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Accordion open/collapse states (all open by default for "everything in one place" experience)
  const [openSections, setOpenSections] = useState<Record<number, boolean>>({
    1: true,
    2: true,
    3: true,
    4: true,
    5: true,
    6: true,
    7: true,
  });

  const toggleSection = (num: number) => {
    setOpenSections((prev) => ({ ...prev, [num]: !prev[num] }));
  };

  // Section 1: Basic Information
  const [name, setName] = useState(initialData?.name || "");
  const [sku, setSku] = useState(initialData?.sku || "");
  const [brand, setBrand] = useState(
    initialData?.brand || initialData?.collection || "OVIA",
  );
  const [productType, setProductType] = useState<
    "Physical Product" | "Digital Product"
  >(initialData?.productType || "Physical Product");
  const [category, setCategory] = useState(initialData?.category || "Luggage");
  const [subcategory, setSubcategory] = useState(
    initialData?.subcategory || "",
  );
  const [collection, setCollection] = useState(initialData?.collection || "");
  const [status, setStatus] = useState<"Active" | "Draft" | "Archived">(
    initialData?.status === "Draft" || initialData?.status === "Archived"
      ? initialData.status
      : "Active",
  );
  const [dbCategories, setDbCategories] = useState<
    Array<{ id: string; name: string; slug: string; parent: string | null }>
  >([]);

  const [taxonomyLoading, setTaxonomyLoading] = useState(true);
  const [taxonomyError, setTaxonomyError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    let inFlight = false;
    async function refresh() {
      if (inFlight || controller.signal.aborted) return;
      inFlight = true;
      try {
        const res = await fetch("/api/admin/product-taxonomy", {
          cache: "no-store",
          signal: controller.signal,
        });
        const data = await res.json();
        if (!res.ok || !data.success || !Array.isArray(data.categories))
          throw new Error(data.error || "Unable to refresh categories.");
        setDbCategories(data.categories);
        setTaxonomyError("");
      } catch (error) {
        if (!controller.signal.aborted)
          setTaxonomyError(
            error instanceof Error
              ? error.message
              : "Unable to refresh categories.",
          );
      } finally {
        inFlight = false;
        if (!controller.signal.aborted) setTaxonomyLoading(false);
      }
    }
    void refresh();
    const timer = setInterval(refresh, 5000);
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      controller.abort();
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
  const taxonomyInitialized = useRef(false);
  useEffect(() => {
    if (taxonomyInitialized.current || !dbCategories.length) return;
    taxonomyInitialized.current = true;
    const storedCategory = dbCategories.find(
      (c) =>
        c.name.toLowerCase() ===
        String(initialData?.category || category).toLowerCase(),
    );
    if (storedCategory?.parent) {
      setCategory(storedCategory.parent);
      setSubcategory(initialData?.subcategory || storedCategory.name);
    }
  }, [dbCategories, initialData, category]);
  const dynamicCategories = useMemo(
    () => dbCategories.filter((c) => !c.parent).map((c) => c.name),
    [dbCategories],
  );
  const dynamicSubcategories = useMemo(() => {
    const belongsToCategory = (parent: string | null) => {
      const visited = new Set<string>();
      while (parent && !visited.has(parent.toLowerCase())) {
        if (parent.toLowerCase() === category.toLowerCase()) return true;
        visited.add(parent.toLowerCase());
        parent =
          dbCategories.find(
            (c) => c.name.toLowerCase() === parent!.toLowerCase(),
          )?.parent || null;
      }
      return false;
    };
    return [
      ...new Set(
        dbCategories
          .filter((c) => c.parent && belongsToCategory(c.parent))
          .map((c) => c.name),
      ),
    ].sort();
  }, [dbCategories, category]);
  const [tags, setTags] = useState<string[]>(() => {
    if (
      initialData?.tags &&
      Array.isArray(initialData.tags) &&
      initialData.tags.length > 0
    ) {
      return initialData.tags;
    }
    return [];
  });
  const [tagInput, setTagInput] = useState("");

  // Section 2: Images & Video
  const [mainImage, setMainImage] = useState(initialData?.image || "");
  const [gallery, setGallery] = useState<string[]>(() => {
    if (
      initialData?.gallery &&
      Array.isArray(initialData.gallery) &&
      initialData.gallery.length > 0
    ) {
      return initialData.gallery;
    }
    return initialData?.image ? [initialData.image] : [];
  });
  const [videoUrl, setVideoUrl] = useState<string>(initialData?.videoUrl || "");
  const [uploading, setUploading] = useState(false);
  const [uploadingOg, setUploadingOg] = useState(false);

  // Section 3: Pricing & Inventory
  const [price, setPrice] = useState<number>(initialData?.price ?? 0);
  const [stock, setStock] = useState<number>(initialData?.stock ?? 0);
  const [lowStockAlert, setLowStockAlert] = useState<number>(
    initialData?.lowStockThreshold ?? 5,
  );
  const [barcode, setBarcode] = useState<string>(initialData?.barcode || "");
  const [allowBackorders, setAllowBackorders] = useState<boolean>(
    initialData?.allowBackorders ?? false,
  );
  const [autoRestock, setAutoRestock] = useState<boolean>(
    initialData?.autoRestockOnCancellation ?? true,
  );
  const [reservedStock, setReservedStock] = useState<number>(0);
  const [stockHistory, setStockHistory] = useState<
    Array<{
      type: string;
      quantity: number;
      date: string;
      reason: string;
    }>
  >([]);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<
    | "RESTOCK"
    | "SALE"
    | "RETURN"
    | "CANCELLATION"
    | "MANUAL_ADJUSTMENT"
    | "RESERVATION"
    | "RELEASE"
  >("RESTOCK");
  const [adjustNotes, setAdjustNotes] = useState("");
  const [isAdjustingStock, setIsAdjustingStock] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadInventoryData() {
      try {
        const res = await fetch("/api/admin/inventory");
        if (!res.ok) return;
        const data = await res.json();
        if (!active || !data.success || !Array.isArray(data.inventory)) return;

        const match = data.inventory.find(
          (item: any) =>
            (sku && item.sku?.toLowerCase() === sku.toLowerCase()) ||
            (initialData?.id && item.productId === initialData.id),
        );
        if (match) {
          if (typeof match.reserved === "number") setReservedStock(match.reserved);
          if (Array.isArray(match.history) && match.history.length > 0) {
            setStockHistory(match.history);
          }
        }
      } catch (e) {
        // Silently catch in demo/offline
      }
    }
    loadInventoryData();
    return () => {
      active = false;
    };
  }, [sku, initialData?.id]);

  // Section 4: Variants
  const [colors, setColors] = useState<{ name: string; hex: string }[]>(() => {
    const fromVariants = (initialData?.variants || [])
      .filter(
        (v: any, i: number, all: any[]) =>
          all.findIndex((x) => x.color === v.color) === i,
      )
      .map((v: any) => ({
        name: v.color,
        hex: v.hex || resolveColorHex(v.color),
      }));
    if (fromVariants.length > 0) return fromVariants;
    return [
      { name: "Black", hex: "#222224" },
      { name: "Brown", hex: "#8d5b4c" },
      { name: "Tan", hex: "#c89d66" },
    ];
  });
  const [sizes, setSizes] = useState<string[]>(() => {
    const fromVariants = [
      ...new Set<string>(
        (initialData?.variants || []).map((v: any) => v.size).filter(Boolean),
      ),
    ];
    if (fromVariants.length > 0) return fromVariants;
    return ["One Size", "Cabin (35L)", "Medium Check-In (65L)", "Trunk Large (95L)"];
  });
  const [activeSize, setActiveSize] = useState<string>(() => {
    const fromVariants = (initialData?.variants || []).map((v: any) => v.size).filter(Boolean);
    if (fromVariants.length > 0) return fromVariants[0];
    return "One Size";
  });
  const [variants, setVariants] = useState<ColorVariant[]>(() =>
    (initialData?.variants || []).map((v: any) => ({
      ...v,
      hex: v.hex || resolveColorHex(v.color),
      price: v.price ?? 0,
      stock: v.stock ?? 0,
      image: v.image || initialData?.image || "",
    })),
  );

  const [customColorName, setCustomColorName] = useState("");
  const [customColorHex, setCustomColorHex] = useState("#2563eb");
  const [showAddCustomColor, setShowAddCustomColor] = useState(false);
  const [editingColorIndex, setEditingColorIndex] = useState<number | null>(null);
  const [editingColorValue, setEditingColorValue] = useState("");
  const [showAddColorModal, setShowAddColorModal] = useState(false);
  const [newColorName, setNewColorName] = useState("");
  const [newColorHex, setNewColorHex] = useState("#BFC2BE");

  const [customSizeName, setCustomSizeName] = useState("");
  const [showAddCustomSize, setShowAddCustomSize] = useState(false);
  const [editingSizeIndex, setEditingSizeIndex] = useState<number | null>(null);
  const [editingSizeValue, setEditingSizeValue] = useState("");
  const [showAddSizeModal, setShowAddSizeModal] = useState(false);
  const [newSizeName, setNewSizeName] = useState("");

  // Section 5: Description & Product Content
  const [fullDesc, setFullDesc] = useState(
    initialData?.fullDesc || initialData?.description || "",
  );
  const [bulletPoints, setBulletPoints] = useState<string[]>(() => {
    if (
      (initialData?.bulletPoints || initialData?.features) &&
      Array.isArray(initialData.bulletPoints || initialData.features)
    ) {
      return initialData.bulletPoints || initialData.features;
    }
    return [];
  });
  const [newBulletText, setNewBulletText] = useState("");

  const [specMaterial, setSpecMaterial] = useState(initialData?.material || "");
  const [specCapacity, setSpecCapacity] = useState(initialData?.capacity || "");
  const [specWeight, setSpecWeight] = useState(initialData?.weight || "");
  const [specDimensions, setSpecDimensions] = useState(
    initialData?.dimensions || "",
  );

  // Section 6: Shipping & Dimensions
  const [shipWeight, setShipWeight] = useState<string>(
    initialData?.packageDimensions?.weight || "",
  );
  const [shipLength, setShipLength] = useState<string>(
    initialData?.packageDimensions?.length || "",
  );
  const [shipWidth, setShipWidth] = useState<string>(
    initialData?.packageDimensions?.width || "",
  );
  const [shipHeight, setShipHeight] = useState<string>(
    initialData?.packageDimensions?.height || "",
  );
  const [shippingClass, setShippingClass] = useState(
    initialData?.shippingClass || "",
  );
  const [productInformation, setProductInformation] = useState<
    Record<string, string>
  >({
    maintenanceCare: initialData?.maintenanceCare || "",
    sustainability: initialData?.sustainability || "",
    returnPolicy: initialData?.returnPolicy || "",
    productAdvisory: Object.entries(initialData?.productAdvisory || {})
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n"),
  });
  const [deliveryTime, setDeliveryTime] = useState(
    initialData?.deliveryTime || "",
  );
  const [freeShipping, setFreeShipping] = useState(
    initialData?.freeShipping === true,
  );

  // Section 7: SEO & GEO
  const [seoTitle, setSeoTitle] = useState(initialData?.metaTitle || "");
  const [metaDesc, setMetaDesc] = useState(initialData?.metaDescription || "");
  const [urlSlug, setUrlSlug] = useState(initialData?.slug || "");
  const [isEditingSlug, setIsEditingSlug] = useState(false);
  const [primaryPhrase, setPrimaryPhrase] = useState(
    initialData?.primarySearchPhrase || "",
  );
  const [secondaryKeywords, setSecondaryKeywords] = useState(
    initialData?.searchTags || "",
  );
  const [canonicalUrl, setCanonicalUrl] = useState(
    initialData?.canonicalUrl || "",
  );
  const [indexProduct, setIndexProduct] = useState(
    initialData?.indexing ? initialData.indexing !== "noindex" : true,
  );
  const [showInSitemap, setShowInSitemap] = useState(
    initialData?.inSitemap !== false,
  );
  const [showSchemaPreview, setShowSchemaPreview] = useState(false);
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [selectedSeoVariant, setSelectedSeoVariant] = useState<number>(1);
  const [variantSeoOverrides, setVariantSeoOverrides] = useState<
    Record<
      number,
      {
        colorName?: string;
        hex?: string;
        pageTitle?: string;
        metaDesc?: string;
        slug?: string;
        indexing?: boolean;
      }
    >
  >({
    0: {
      colorName: "Black",
      hex: "#222224",
      pageTitle: "Black Leather Travel Bag | OVIA",
      metaDesc: "Discover the black leather travel bag, crafted for timeless style and travel.",
      slug: "black-leather-travel-bag",
      indexing: true,
    },
    1: {
      colorName: "Brown",
      hex: "#8d5b4c",
      pageTitle: "Brown Leather Travel Bag | OVIA",
      metaDesc: "Discover the brown leather travel bag, crafted for timeless style and travel.",
      slug: "brown-leather-travel-bag",
      indexing: true,
    },
    2: {
      colorName: "Tan",
      hex: "#c89d66",
      pageTitle: "Tan Leather Travel Bag | OVIA",
      metaDesc: "Explore the tan leather travel bag with elegant design and premium details.",
      slug: "tan-leather-travel-bag",
      indexing: true,
    },
  });

  const addCustomColor = (colorName: string, hexCode: string) => {
    const trimmed = colorName.trim();
    if (!trimmed) return;
    const resolvedHex = resolveColorHex(trimmed, hexCode);
    const existingIndex = colors.findIndex(
      (c) => c.name.toLowerCase() === trimmed.toLowerCase(),
    );
    let nextColors: { name: string; hex: string }[];
    if (existingIndex >= 0) {
      nextColors = [...colors];
      nextColors[existingIndex] = { name: trimmed, hex: resolvedHex };
    } else {
      nextColors = [...colors, { name: trimmed, hex: resolvedHex }];
    }
    setColors(nextColors);
    setVariants((prev) => {
      const exists = prev.some((v) => v.color?.toLowerCase() === trimmed.toLowerCase());
      if (exists) {
        return prev.map((v) =>
          v.color?.toLowerCase() === trimmed.toLowerCase()
            ? { ...v, hex: resolvedHex }
            : v,
        );
      }
      return [
        ...prev,
        {
          sku: `${sku || "BAG"}-${trimmed.toUpperCase().slice(0, 3)}-${prev.length + 1}`,
          color: trimmed,
          hex: resolvedHex,
          size: activeSize || "One Size",
          price: price || 0,
          stock: stock || 0,
          image: mainImage || "",
        },
      ];
    });
    setCustomColorName("");
    setCustomColorHex("#2563eb");
    setShowAddCustomColor(false);
  };

  const updateColorHex = (indexOrColorName: number | string, newHex: string) => {
    if (typeof indexOrColorName === "number") {
      setVariantSeoOverrides((prev) => ({
        ...prev,
        [indexOrColorName]: {
          ...prev[indexOrColorName],
          hex: newHex,
        },
      }));
      setVariants((prev) =>
        prev.map((v, i) => (i === indexOrColorName ? { ...v, hex: newHex } : v)),
      );
      if (colors[indexOrColorName]) {
        setColors((prev) =>
          prev.map((c, i) => (i === indexOrColorName ? { ...c, hex: newHex } : c)),
        );
      }
    } else {
      setColors((prev) =>
        prev.map((c) =>
          c.name.toLowerCase() === indexOrColorName.toLowerCase()
            ? { ...c, hex: newHex }
            : c,
        ),
      );
      setVariants((prev) =>
        prev.map((v) =>
          v.color?.toLowerCase() === indexOrColorName.toLowerCase()
            ? { ...v, hex: newHex }
            : v,
        ),
      );
      setVariantSeoOverrides((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((k) => {
          const keyNum = Number(k);
          if (next[keyNum]?.colorName?.toLowerCase() === indexOrColorName.toLowerCase()) {
            next[keyNum] = { ...next[keyNum], hex: newHex };
          }
        });
        return next;
      });
    }
  };

  const updateColorName = (index: number, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const resolvedHex = resolveColorHex(trimmed, variantSeoOverrides[index]?.hex || colors[index]?.hex);
    setVariantSeoOverrides((prev) => ({
      ...prev,
      [index]: {
        ...prev[index],
        colorName: trimmed,
        hex: resolvedHex,
        pageTitle: `${trimmed} Leather Travel Bag | OVIA`,
      },
    }));
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, color: trimmed, hex: resolvedHex } : v)),
    );
    if (colors[index]) {
      setColors((prev) =>
        prev.map((c, i) => (i === index ? { ...c, name: trimmed, hex: resolvedHex } : c)),
      );
    }
  };

  const removeColor = (colorName: string) => {
    setColors((prev) => prev.filter((c) => c.name.toLowerCase() !== colorName.toLowerCase()));
    setVariants((prev) => prev.filter((v) => v.color?.toLowerCase() !== colorName.toLowerCase()));
    setVariantSeoOverrides((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        const keyNum = Number(k);
        if (next[keyNum]?.colorName?.toLowerCase() === colorName.toLowerCase()) {
          delete next[keyNum];
        }
      });
      return next;
    });
  };

  const addCustomSize = (sizeName: string) => {
    const trimmed = sizeName.trim();
    if (!trimmed) return;
    if (!sizes.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setSizes((prev) => [...prev, trimmed]);
      if (!activeSize) setActiveSize(trimmed);
    }
    setCustomSizeName("");
    setShowAddCustomSize(false);
  };

  const removeSize = (sizeToRemove: string) => {
    setSizes((prev) => {
      const next = prev.filter((s) => s.toLowerCase() !== sizeToRemove.toLowerCase());
      if (activeSize.toLowerCase() === sizeToRemove.toLowerCase()) {
        setActiveSize(next[0] || "");
      }
      return next;
    });
    setVariants((prev) => prev.filter((v) => v.size?.toLowerCase() !== sizeToRemove.toLowerCase()));
  };

  const updateSizeName = (oldSize: string, newSize: string) => {
    const trimmed = newSize.trim();
    if (!trimmed || trimmed === oldSize) return;
    setSizes((prev) => prev.map((s) => (s === oldSize ? trimmed : s)));
    if (activeSize === oldSize) setActiveSize(trimmed);
    setVariants((prev) =>
      prev.map((v) => (v.size === oldSize ? { ...v, size: trimmed } : v)),
    );
  };


  // Open Graph
  const [ogTitle, setOgTitle] = useState(initialData?.ogTitle || "");
  const [ogDescription, setOgDescription] = useState(
    initialData?.ogDescription || "",
  );
  const [ogImage, setOgImage] = useState(initialData?.ogImage || "");
  const [searchPreviewMode, setSearchPreviewMode] = useState<
    "mobile" | "desktop"
  >("desktop");

  // GEO (AI Search Optimization)
  const [aiSummary, setAiSummary] = useState(
    initialData?.aiProductSummary || "",
  );
  const [aiFacts, setAiFacts] = useState<string[]>(
    initialData?.aiKeyFacts
      ? String(initialData.aiKeyFacts).split("\n").filter(Boolean)
      : [],
  );
  const [targetAudience, setTargetAudience] = useState(
    "Business travel, leisure travel, frequent flyers, students",
  );
  const [aiFaqs, setAiFaqs] = useState<{ q: string; a: string }[]>(
    initialData?.aiFaqs || [],
  );

  const [loading, setLoading] = useState(false);

  // Sync state if initialData is provided
  useEffect(() => {
    if (initialData) {
      if (initialData.name) setName(initialData.name);
      if (initialData.sku) setSku(initialData.sku);
      if (initialData.brand) setBrand(initialData.brand);
      if (initialData.category) setCategory(initialData.category);
      if (initialData.subcategory) setSubcategory(initialData.subcategory);
      if (initialData.price !== undefined) setPrice(Number(initialData.price));
      if (initialData.stock !== undefined) setStock(Number(initialData.stock));
      if (initialData.image) setMainImage(initialData.image);
      if (
        initialData.gallery &&
        Array.isArray(initialData.gallery) &&
        initialData.gallery.length > 0
      ) {
        setGallery(initialData.gallery);
      }
      if (initialData.slug) {
        setUrlSlug(initialData.slug);
        setCanonicalUrl(`https://www.ovias.shop/products/${initialData.slug}`);
      }
      if (initialData.metaTitle) setSeoTitle(initialData.metaTitle);
      if (initialData.metaDescription) setMetaDesc(initialData.metaDescription);
      if (initialData.ogTitle) setOgTitle(initialData.ogTitle);
      if (initialData.ogDescription)
        setOgDescription(initialData.ogDescription);
      if (initialData.ogImage) setOgImage(initialData.ogImage);
    }
  }, [initialData]);

  // Handlers for tags
  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const trimmed = tagInput.trim().replace(/^,+|,+$/g, "");
      if (trimmed && !tags.includes(trimmed)) {
        setTags([...tags, trimmed]);
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // WebP Image Processing & Compression
  async function processAndCompressImage(file: File): Promise<{
    file: File;
    width: number;
    height: number;
    originalSize: number;
    compressedSize: number;
    isWebp: boolean;
  }> {
    if (!file.type.startsWith("image/")) {
      return {
        file,
        width: 0,
        height: 0,
        originalSize: file.size,
        compressedSize: file.size,
        isWebp: false,
      };
    }

    return new Promise((resolve) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const width = img.naturalWidth;
        const height = img.naturalHeight;
        const maxDim = 2400;
        let targetWidth = width;
        let targetHeight = height;
        if (targetWidth > maxDim || targetHeight > maxDim) {
          if (targetWidth > targetHeight) {
            targetHeight = Math.round((targetHeight * maxDim) / targetWidth);
            targetWidth = maxDim;
          } else {
            targetWidth = Math.round((targetWidth * maxDim) / targetHeight);
            targetHeight = maxDim;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve({
            file,
            width,
            height,
            originalSize: file.size,
            compressedSize: file.size,
            isWebp: false,
          });
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve({
                file,
                width,
                height,
                originalSize: file.size,
                compressedSize: file.size,
                isWebp: false,
              });
              return;
            }
            const cleanName =
              file.name.replace(/\.[^/.]+$/, "") + ".webp";
            const compressedFile = new File([blob], cleanName, {
              type: "image/webp",
            });
            resolve({
              file: compressedFile,
              width,
              height,
              originalSize: file.size,
              compressedSize: compressedFile.size,
              isWebp: true,
            });
          },
          "image/webp",
          0.88,
        );
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve({
          file,
          width: 0,
          height: 0,
          originalSize: file.size,
          compressedSize: file.size,
          isWebp: false,
        });
      };
      img.src = objectUrl;
    });
  }

  // Upload handlers
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    await uploadImages(Array.from(e.target.files || []));
  }

  function removeImage(image: string) {
    const remaining = gallery.filter((item) => item !== image);
    setGallery(remaining);
    if (mainImage === image) setMainImage(remaining[0] || "");
    if (selectedImage === image) setSelectedImage(remaining[0] || "");
    setVariants((prev) =>
      prev.map((variant) =>
        variant.image === image
          ? { ...variant, image: remaining[0] || "" }
          : variant,
      ),
    );
    setImageAltMap((prev) => {
      const next = { ...prev };
      delete next[image];
      return next;
    });
    setImageVariantAssignments((prev) => {
      const next = { ...prev };
      delete next[image];
      return next;
    });
  }

  function makePrimaryImage(image: string) {
    const remaining = gallery.filter((item) => item !== image);
    const next = [image, ...remaining];
    setGallery(next);
    setMainImage(image);
  }

  function moveImage(from: number, to: number) {
    if (to < 0 || to >= gallery.length) return;
    const next = [...gallery];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setGallery(next);
    setMainImage(next[0] || "");
  }

  function handleDragStart(index: number) {
    setDraggedImageIndex(index);
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    if (dragOverImageIndex !== index) setDragOverImageIndex(index);
  }

  function handleDrop(targetIndex: number) {
    if (draggedImageIndex === null || draggedImageIndex === targetIndex) {
      setDraggedImageIndex(null);
      setDragOverImageIndex(null);
      return;
    }
    const next = [...gallery];
    const [draggedItem] = next.splice(draggedImageIndex, 1);
    next.splice(targetIndex, 0, draggedItem);
    setGallery(next);
    setMainImage(next[0] || "");
    setDraggedImageIndex(null);
    setDragOverImageIndex(null);
  }

  function triggerReplace(index: number) {
    setReplaceTargetIndex(index);
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e: any) => {
      handleSingleReplacement(e);
    };
    input.click();
  }

  async function handleSingleReplacement(
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = e.target.files?.[0];
    if (
      !file ||
      replaceTargetIndex === null ||
      !gallery[replaceTargetIndex]
    )
      return;
    const original = gallery[replaceTargetIndex];
    setUploading(true);
    setCompressionStatus("Compressing & replacing image to WebP...");
    try {
      const processed = await processAndCompressImage(file);
      const form = new FormData();
      form.append("file", processed.file);
      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: form,
      });
      const result = await response.json();
      if (!response.ok || !result.url)
        throw new Error(result.error || "Replacement failed");
      const image = String(result.url);
      setGallery((prev) =>
        prev.map((item, i) => (i === replaceTargetIndex ? image : item)),
      );
      if (mainImage === original) setMainImage(image);
      if (selectedImage === original) setSelectedImage(image);
      setVariants((prev) =>
        prev.map((variant) =>
          variant.image === original ? { ...variant, image } : variant,
        ),
      );
      setImageAltMap((prev) => {
        const next = { ...prev, [image]: prev[original] || "" };
        delete next[original];
        return next;
      });
      setImageVariantAssignments((prev) => {
        const next = { ...prev, [image]: prev[original] || "" };
        delete next[original];
        return next;
      });
      setImageMetaMap((prev) => ({
        ...prev,
        [image]: {
          dimensions:
            processed.width && processed.height
              ? `${processed.width} × ${processed.height} px`
              : undefined,
          width: processed.width,
          height: processed.height,
          size: `${Math.round(processed.compressedSize / 1024)} KB`,
          isWebp: processed.isWebp,
        },
      }));
    } catch (error) {
      alert(error instanceof Error ? error.message : "Replacement failed");
    } finally {
      setUploading(false);
      setCompressionStatus("");
      setReplaceTargetIndex(null);
    }
  }

  async function replaceImage(file?: File) {
    if (!file || !selectedImage) return;
    const original = selectedImage;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: form,
      });
      const result = await response.json();
      if (!response.ok || !result.url)
        throw new Error(result.error || "Replacement failed");
      const image = String(result.url);
      setGallery((prev) =>
        prev.map((item) => (item === original ? image : item)),
      );
      if (mainImage === original) setMainImage(image);
      setSelectedImage(image);
      setVariants((prev) =>
        prev.map((variant) =>
          variant.image === original ? { ...variant, image } : variant,
        ),
      );
      setImageAltMap((prev) => {
        const next = { ...prev, [image]: prev[original] || "" };
        delete next[original];
        return next;
      });
      setImageVariantAssignments((prev) => {
        const next = { ...prev, [image]: prev[original] || "" };
        delete next[original];
        return next;
      });
    } catch (error) {
      alert(error instanceof Error ? error.message : "Replacement failed");
    } finally {
      setUploading(false);
      if (replacementInputRef.current) replacementInputRef.current.value = "";
    }
  }

  async function uploadImages(files: File[]) {
    if (!files.length) return;

    setUploading(true);
    setCompressionStatus(`Processing ${files.length} image(s)...`);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 5 * 1024 * 1024) {
          alert(`File "${file.name}" exceeds 5MB size limit.`);
          continue;
        }
        setCompressionStatus(`Compressing to WebP (${i + 1}/${files.length})...`);
        const processed = await processAndCompressImage(file);
        const formData = new FormData();
        formData.append("file", processed.file);

        const res = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        });
        const json = await res.json();
        if (!res.ok || !json.success || !json.url)
          throw new Error(json.error || "Image upload failed");
        if (json.success && json.url) {
          const uploadedUrl = json.url;
          setGallery((prev) =>
            prev.includes(uploadedUrl) ? prev : [...prev, uploadedUrl],
          );
          if (i === 0 && !mainImage) {
            setMainImage(uploadedUrl);
          }
          if (i === 0) setSelectedImage(uploadedUrl);
          setImageMetaMap((prev) => ({
            ...prev,
            [uploadedUrl]: {
              dimensions:
                processed.width && processed.height
                  ? `${processed.width} × ${processed.height} px`
                  : undefined,
              width: processed.width,
              height: processed.height,
              size: `${Math.round(processed.compressedSize / 1024)} KB`,
              isWebp: processed.isWebp,
            },
          }));
        }
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      alert("Upload failed. You can also specify an image URL directly.");
    } finally {
      setUploading(false);
      setCompressionStatus("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function generateSku() {
    const brandPrefix = (brand || "OVIA")
      .replace(/[^A-Za-z0-9]/g, "")
      .slice(0, 3)
      .toUpperCase();
    const namePrefix = (name || "PROD")
      .replace(/[^A-Za-z0-9]/g, "")
      .slice(0, 4)
      .toUpperCase();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    setSku(`${brandPrefix}-${namePrefix}-${randomSuffix}`);
  }

  async function handleAdjustStockSubmit(e: React.FormEvent) {
    e.preventDefault();
    const currentSku = sku.trim();
    if (!currentSku) {
      alert("Please enter or generate a SKU first before adjusting inventory.");
      return;
    }
    if (adjustAmount === 0 || !Number.isInteger(adjustAmount)) {
      alert("Please enter a non-zero whole number for the stock adjustment (e.g., +10 or -5).");
      return;
    }
    setIsAdjustingStock(true);
    try {
      const res = await fetch("/api/admin/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku: currentSku,
          adjustment: adjustAmount,
          reason: adjustReason,
          notes: adjustNotes.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to adjust inventory.");

      setStock((prev) => Math.max(0, prev + adjustAmount));
      setStockHistory((prev) => [
        {
          type: adjustReason,
          quantity: adjustAmount,
          date: new Date().toISOString(),
          reason: adjustNotes.trim() || adjustReason,
        },
        ...prev,
      ]);
      setShowAdjustModal(false);
      setAdjustAmount(0);
      setAdjustNotes("");
      alert(
        `Successfully adjusted inventory by ${
          adjustAmount > 0 ? "+" + adjustAmount : adjustAmount
        } units.`,
      );
    } catch (err: any) {
      alert(`Error adjusting stock: ${err.message}`);
    } finally {
      setIsAdjustingStock(false);
    }
  }

  // OG Image Upload
  async function handleOgFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingOg(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (json.success && json.url) {
        setOgImage(json.url);
      }
    } catch (err: any) {
      console.error("OG upload error:", err);
    } finally {
      setUploadingOg(false);
      if (ogFileInputRef.current) ogFileInputRef.current.value = "";
    }
  }

  // Variants handlers
  const handleAddColor = () => {
    if (!newColorName.trim()) return;
    const exists = colors.some(
      (c) => c.name.toLowerCase() === newColorName.trim().toLowerCase(),
    );
    if (!exists) {
      const added = { name: newColorName.trim(), hex: newColorHex };
      setColors([...colors, added]);
      // Add variant entry
      const newSku = `${sku || "PRODUCT"}-${added.name.slice(0, 2).toUpperCase()}`;
      setVariants((prev) => [
        ...prev,
        {
          sku: newSku,
          color: added.name,
          size: activeSize.replace(/\s*\(.*?\)/, ""),
          hex: added.hex,
          price: price,
          stock: 0,
          image: mainImage,
        },
      ]);
    }
    setNewColorName("");
    setShowAddColorModal(false);
  };

  const handleRemoveColor = (nameToRemove: string) => {
    setColors(colors.filter((c) => c.name !== nameToRemove));
    setVariants(variants.filter((v) => v.color !== nameToRemove));
  };

  const handleAddSize = () => {
    if (!newSizeName.trim()) return;
    if (!sizes.includes(newSizeName.trim())) {
      setSizes([...sizes, newSizeName.trim()]);
    }
    setNewSizeName("");
    setShowAddSizeModal(false);
  };

  const handleUpdateVariant = (index: number, patch: Partial<ColorVariant>) => {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, ...patch } : v)),
    );
  };

  const handleRemoveVariant = (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddVariantRow = () => {
    const firstColor = colors[0] || { name: "Standard", hex: "#333333" };
    setVariants((prev) => [
      ...prev,
      {
        sku: `${sku || "PRODUCT"}-${Date.now().toString().slice(-4)}`,
        color: firstColor.name,
        size: activeSize.replace(/\s*\(.*?\)/, ""),
        hex: firstColor.hex,
        price: price,
        stock: 0,
        image: mainImage,
      },
    ]);
  };

  // Bullet point handlers
  const handleAddBullet = () => {
    if (!newBulletText.trim()) return;
    setBulletPoints([...bulletPoints, newBulletText.trim()]);
    setNewBulletText("");
  };

  const handleRemoveBullet = (idx: number) => {
    setBulletPoints(bulletPoints.filter((_, i) => i !== idx));
  };

  // AI Fact handlers
  const handleAddFact = () => {
    const prompt = window.prompt("Enter new key product fact for AI search:");
    if (prompt && prompt.trim()) {
      setAiFacts([...aiFacts, prompt.trim()]);
    }
  };

  // AI FAQ handlers
  const handleAddFaq = () => {
    const q = window.prompt("Enter AI FAQ Question:");
    if (!q || !q.trim()) return;
    const a = window.prompt("Enter AI FAQ Answer:");
    if (!a || !a.trim()) return;
    setAiFaqs([...aiFaqs, { q: q.trim(), a: a.trim() }]);
  };

  // Submit / Save
  async function handleSave(
    statusToSet: "Active" | "Draft" | "Archived",
    duplicate = false,
  ) {
    if (taxonomyLoading || taxonomyError) {
      alert("Wait for live categories to load before saving.");
      return;
    }
    if (
      !dynamicCategories.includes(category) ||
      (subcategory && !dynamicSubcategories.includes(subcategory))
    ) {
      alert("Select an available category and subcategory before saving.");
      return;
    }
    if (!name.trim() || !sku.trim() || !category || !urlSlug.trim()) {
      alert(
        "Enter product name, SKU, category and product handle before saving.",
      );
      return;
    }
    if (
      ![price,oldPrice].every((value) => Number.isFinite(value) && value >= 0) ||
      !Number.isInteger(stock) ||
      stock < 0 ||
      variants.some(
        (v) =>
          !Number.isFinite(v.price) ||
          v.price < 0 ||
          !Number.isInteger(v.stock) ||
          v.stock < 0,
      )
    ) {
      alert(
        "Prices must be nonnegative numbers and stock must be a nonnegative whole number.",
      );
      return;
    }
    if (
      new Set(variants.map((v) => v.sku.trim())).size !== variants.length ||
      variants.some((v) => !v.sku.trim())
    ) {
      alert("Each variant needs a unique SKU.");
      return;
    }
    if (!Number.isInteger(lowStockAlert) || lowStockAlert < 0) {
      alert("Low Stock Alert must be a nonnegative whole number.");
      return;
    }
    if (
      sale.enabled &&
      (!Number.isFinite(Number(sale.price)) ||
        Number(sale.price) <= 0 ||
        Number(sale.price) >= price ||
        !sale.startDate ||
        !sale.endDate ||
        sale.startDate > sale.endDate)
    ) {
      alert(
        "Enter a sale price below the selling price and a valid start/end date range.",
      );
      return;
    }
    if (scheduled && (!publishAt || !Number.isFinite(Date.parse(publishAt)))) {
      alert("Enter a valid publication date.");
      return;
    }
    setLoading(true);
    try {
      const copySuffix = duplicate ? `-copy-${Date.now()}` : "";
      const url =
        isEditing && !duplicate
          ? `/api/admin/products/${initialData.id}`
          : "/api/admin/products";
      const method = isEditing && !duplicate ? "PATCH" : "POST";

      const totalStock = variants.length
        ? variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)
        : Number(stock);
      const cleanPrice = Number(price);

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: duplicate ? `${name} (copy)` : name,
          sku: sku + copySuffix,
          brand,
          category,
          subcategory,
          collection,
          productType,
          tags,
          status: duplicate ? "Draft" : statusToSet,
          publishAt:
            !duplicate && scheduled && statusToSet === "Active"
              ? new Date(publishAt).toISOString()
              : null,
          shortDescription,
          oldPrice,
          price: cleanPrice,
          sale,
          specifications: Object.fromEntries(
            customSpecifications
              .filter(([key]) => key.trim())
              .map(([key, value]) => [key.trim(), value]),
          ),
          stock: totalStock,
          lowStockThreshold: Number(lowStockAlert),
          barcode: barcode.trim(),
          allowBackorders,
          autoRestockOnCancellation: autoRestock,
          image: mainImage,
          gallery,
          videoUrl,
          imageAltMap,
          imageVariantAssignments,
          imageTitleMap,
          imageColorMap,
          identity,
          packageDimensions: {
            weight: shipWeight,
            length: shipLength,
            width: shipWidth,
            height: shipHeight,
          },
          variants: duplicate
            ? variants.map((variant) => ({
                ...variant,
                sku: variant.sku + copySuffix,
              }))
            : variants,
          fullDesc,
          bulletPoints,
          material: specMaterial,
          capacity: specCapacity,
          weight: specWeight || (shipWeight ? `${shipWeight} kg` : ""),
          dimensions:
            specDimensions ||
            (shipLength && shipWidth && shipHeight
              ? `${shipLength} x ${shipWidth} x ${shipHeight} cm`
              : ""),
          maintenanceCare: productInformation.maintenanceCare,
          sustainability: productInformation.sustainability,
          freeShipping,
          metaTitle: seoTitle,
          metaDescription: metaDesc,
          slug: urlSlug + copySuffix,
          primarySearchPhrase: primaryPhrase,
          searchTags: secondaryKeywords,
          canonicalUrl,
          indexing: indexProduct ? "index" : "noindex",
          inSitemap: showInSitemap,
          ogTitle,
          ogDescription,
          ogImage,
          aiProductSummary: aiSummary,
          aiKeyFacts: aiFacts.join("\n• "),
          aiFaqs,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to save product.");
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("ovia_category_updated"));
        try {
          localStorage.setItem("ovia_category_updated", Date.now().toString());
        } catch {}
      }

      alert(
        `Product successfully ${statusToSet === "Active" ? "published" : statusToSet === "Archived" ? "archived" : "saved as draft"}!`,
      );
      router.push("/admin/products");
      router.refresh();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  if (!showAdvanced)
    return (
      <div className="admin-product-reference">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="image/*"
          multiple
          hidden
        />
        <header className="admin-product-reference-heading">
          <div>
            <small>
              <Link href="/admin">Dashboard</Link> /{" "}
              <Link href="/admin/products">Products</Link> /{" "}
              {isEditing ? "Edit Product" : "New Product"}
            </small>
            <h1>{isEditing ? "Edit Product" : "New Product"}</h1>
          </div>
          <div>
            {isEditing && (
              <button
                type="button"
                className="secondary"
                disabled={loading}
                onClick={() => void handleSave("Draft", true)}
              >
                Duplicate
              </button>
            )}
            <button
              type="button"
              disabled={loading}
              onClick={() => void handleSave(status)}
            >
              {loading ? "Saving…" : "Save"}
            </button>
          </div>
        </header>
        <div className="admin-product-reference-columns">
          <main>
            <section data-editor-section="1" className="admin-dark-section">
              <h2 className="admin-dark-section-title">
                <span className="admin-dark-section-icon">📋</span> Basic Information
              </h2>
              <label>
                Name
                <input
                  aria-label="Product name"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    if (!isEditing)
                      setUrlSlug(
                        event.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, "-")
                          .replace(/^-|-$/g, ""),
                      );
                  }}
                />
              </label>
              <label>
                Slug
                <div className="admin-slug-input">
                  <span>/products/</span>
                  <input
                    aria-label="Product slug"
                    value={urlSlug}
                    maxLength={255}
                    onChange={(event) => setUrlSlug(event.target.value)}
                  />
                </div>
                <small>
                  Unique product identifier. No longer than 255 characters.
                </small>
              </label>
              <label>
                Description
                <textarea
                  aria-label="Product description"
                  rows={12}
                  value={fullDesc}
                  onChange={(event) => setFullDesc(event.target.value)}
                />
              </label>
              <label>
                Short description
                <textarea
                  aria-label="Short description"
                  rows={3}
                  value={shortDescription}
                  onChange={(event) => setShortDescription(event.target.value)}
                />
              </label>
            </section>
            {/* 02 — Pricing */}
            <section data-editor-section="3" className="admin-dark-section">
              <h2 className="admin-dark-section-title">
                <span className="admin-dark-section-icon">🗂</span> 02 — Pricing
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <label>
                  <span>Selling Price (₹) *</span>
                  <input
                    aria-label="Price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={price || ""}
                    placeholder="25000"
                    onChange={(event) => setPrice(Number(event.target.value))}
                  />
                </label>
                <label>
                  <span>Old price (₹)</span>
                  <input
                    aria-label="Old price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={oldPrice || ""}
                    placeholder="Optional compare-at price"
                    onChange={(event) =>
                      setOldPrice(Number(event.target.value))
                    }
                  />
                </label>
              </div>
              <p className="admin-dark-field-note">
                Single clean price shown to customers, inclusive of applicable taxes.
              </p>
            </section>

            {/* 03 — Inventory */}
            <section className="admin-dark-section">
              <h2 className="admin-dark-section-title">
                <span className="admin-dark-section-icon">⚛</span> 03 — Inventory
              </h2>
              <label>
                <span>SKU *</span>
                <input
                  aria-label="SKU"
                  value={sku}
                  placeholder="BAG-001"
                  onChange={(event) => setSku(event.target.value)}
                />
              </label>
              <label>
                <span>Stock Quantity *</span>
                <input
                  aria-label="Stock quantity"
                  type="number"
                  min="0"
                  step="1"
                  value={stock}
                  placeholder="20"
                  onChange={(event) => setStock(Math.max(0, Number(event.target.value)))}
                />
              </label>
              <div className="admin-dark-stock-status-row">
                <span>Stock Status</span>
                <span className={`admin-dark-stock-pill ${stock > 0 ? "in-stock" : "out-of-stock"}`}>
                  {stock > 0 ? "In Stock" : "Out of Stock"}
                </span>
              </div>
            </section>

            {/* 04 — Product Variants */}
            <section className="admin-dark-section">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
                <h2 className="admin-dark-section-title" style={{ margin: 0 }}>
                  <span className="admin-dark-section-icon">💼</span> 04 — Product Variants
                </h2>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddCustomColor(!showAddCustomColor);
                      if (showAddCustomSize) setShowAddCustomSize(false);
                    }}
                    style={{
                      background: showAddCustomColor ? "#f1f5f9" : "#ffffff",
                      border: "1px solid #cbd5df",
                      color: "#1e293b",
                      borderRadius: "6px",
                      padding: "6px 14px",
                      fontSize: "12px",
                      fontWeight: 500,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    {showAddCustomColor ? "Close Color Studio" : "+ Custom Color"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddCustomSize(!showAddCustomSize);
                      if (showAddCustomColor) setShowAddCustomColor(false);
                    }}
                    style={{
                      background: showAddCustomSize ? "#f1f5f9" : "#ffffff",
                      border: "1px solid #cbd5df",
                      color: "#1e293b",
                      borderRadius: "6px",
                      padding: "6px 14px",
                      fontSize: "12px",
                      fontWeight: 500,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    {showAddCustomSize ? "Close Size Studio" : "+ Custom Size"}
                  </button>
                </div>
              </div>

              {/* Active Color Badges */}
              <div style={{ marginBottom: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>
                    Product Colors (Click swatch to customize shade, double-click name to edit)
                  </span>
                  {colors.length === 0 && (
                    <span style={{ fontSize: "11px", color: "#ef4444" }}>No colors added</span>
                  )}
                </div>
                <div className="admin-dark-color-chips">
                  {colors.map((c, i) => (
                    <div key={c.name + i} className="admin-dark-color-chip">
                      <label
                        style={{ cursor: "pointer", position: "relative", display: "inline-flex", alignItems: "center" }}
                        title={`Click to pick custom shade for ${c.name}`}
                      >
                        <span
                          className="admin-dark-color-chip-dot"
                          style={{ backgroundColor: c.hex }}
                        />
                        <input
                          type="color"
                          value={c.hex}
                          onChange={(e) => updateColorHex(c.name, e.target.value)}
                          style={{ position: "absolute", opacity: 0, width: 0, height: 0, pointerEvents: "none" }}
                        />
                      </label>
                      {editingColorIndex === i ? (
                        <input
                          autoFocus
                          value={editingColorValue}
                          onChange={(e) => setEditingColorValue(e.target.value)}
                          onBlur={() => {
                            if (editingColorValue.trim()) {
                              updateColorName(i, editingColorValue.trim());
                            }
                            setEditingColorIndex(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              if (editingColorValue.trim()) {
                                updateColorName(i, editingColorValue.trim());
                              }
                              setEditingColorIndex(null);
                            } else if (e.key === "Escape") {
                              setEditingColorIndex(null);
                            }
                          }}
                          style={{
                            background: "#ffffff",
                            border: "1px solid #3b82f6",
                            color: "#0f172a",
                            borderRadius: "4px",
                            padding: "2px 6px",
                            fontSize: "12px",
                            width: "90px",
                          }}
                        />
                      ) : (
                        <span
                          style={{ fontWeight: 500, cursor: "pointer" }}
                          onDoubleClick={() => {
                            setEditingColorIndex(i);
                            setEditingColorValue(c.name);
                          }}
                          title="Double-click to rename color"
                        >
                          {c.name}
                        </span>
                      )}
                      <span style={{ fontSize: "11px", color: "#71717a", fontFamily: "monospace" }}>{c.hex}</span>
                      <button
                        type="button"
                        className="admin-dark-color-chip-remove"
                        title={`Delete color ${c.name}`}
                        aria-label={`Delete color ${c.name}`}
                        onClick={() => removeColor(c.name)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {colors.length === 0 && (
                    <button
                      type="button"
                      onClick={() => setShowAddCustomColor(true)}
                      style={{
                        background: "#ffffff",
                        border: "1px dashed #cbd5df",
                        color: "#64748b",
                        borderRadius: "9999px",
                        padding: "6px 14px",
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                    >
                      + Add a Color
                    </button>
                  )}
                </div>
              </div>

              {/* Add Custom Color Box */}
              {showAddCustomColor && (
                <div className="admin-dark-custom-color-box">
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", marginBottom: "8px" }}>
                    Create Custom Color
                  </div>

                  {/* Preset quick picks */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "11px", color: "#64748b" }}>Quick presets:</span>
                    {[
                      { name: "Blue", hex: "#2563eb" },
                      { name: "Navy", hex: "#1e3a8a" },
                      { name: "Black", hex: "#222224" },
                      { name: "Brown", hex: "#8d5b4c" },
                      { name: "Tan", hex: "#c89d66" },
                      { name: "Cognac", hex: "#9a4d28" },
                      { name: "Olive", hex: "#556b2f" },
                      { name: "Green", hex: "#16a34a" },
                      { name: "Red", hex: "#dc2626" },
                      { name: "Grey", hex: "#6b7280" },
                      { name: "Champagne", hex: "#fad6a5" },
                    ].map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        className="admin-palette-btn"
                        style={{ backgroundColor: preset.hex }}
                        title={`${preset.name} (${preset.hex})`}
                        onClick={() => {
                          setCustomColorName(preset.name);
                          setCustomColorHex(preset.hex);
                        }}
                      />
                    ))}
                  </div>

                  <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                    <label style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }} title="Click circle to pick custom color">
                      <span
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          backgroundColor: customColorHex,
                          border: "2px solid #94a3b8",
                          display: "inline-block",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                        }}
                      />
                      <input
                        type="color"
                        value={customColorHex}
                        onChange={(e) => setCustomColorHex(e.target.value)}
                        style={{ display: "none" }}
                      />
                    </label>
                    <input
                      placeholder="Color Name (e.g. Royal Blue)"
                      value={customColorName}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomColorName(val);
                        const autoHex = resolveColorHex(val);
                        if (autoHex !== "#222224") setCustomColorHex(autoHex);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addCustomColor(customColorName, customColorHex);
                        }
                      }}
                      style={{
                        flex: 1,
                        minWidth: "140px",
                        background: "#ffffff",
                        border: "1px solid #cbd5df",
                        color: "#0f172a",
                        borderRadius: "6px",
                        padding: "8px 12px",
                        fontSize: "13px",
                      }}
                    />
                    <input
                      placeholder="#2563eb"
                      value={customColorHex}
                      onChange={(e) => setCustomColorHex(e.target.value)}
                      style={{
                        width: "85px",
                        background: "#ffffff",
                        border: "1px solid #cbd5df",
                        color: "#0f172a",
                        borderRadius: "6px",
                        padding: "8px 10px",
                        fontSize: "13px",
                        fontFamily: "monospace",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => addCustomColor(customColorName, customColorHex)}
                      style={{
                        background: "#ffd333",
                        color: "#20262b",
                        border: "none",
                        borderRadius: "6px",
                        padding: "8px 16px",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      + Add
                    </button>
                  </div>
                </div>
              )}

              {/* Active Size Badges */}
              <div style={{ marginBottom: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>
                    Product Sizes (Click size to select, double-click name to edit, click × to delete)
                  </span>
                  {sizes.length === 0 && (
                    <span style={{ fontSize: "11px", color: "#ef4444" }}>No sizes added</span>
                  )}
                </div>
                <div className="admin-dark-color-chips">
                  {sizes.map((s, i) => {
                    const isActive = s === activeSize;
                    const isEditing = editingSizeIndex === i;
                    return (
                      <div
                        key={s + i}
                        className={`admin-dark-color-chip ${isActive ? "active-chip" : ""}`}
                        style={{
                          cursor: "pointer",
                          borderColor: isActive ? "#3b82f6" : "#e2e8f0",
                          backgroundColor: isActive ? "#eff6ff" : "#f8fafc",
                          color: isActive ? "#1d4ed8" : "#1e293b",
                        }}
                      >
                        {isEditing ? (
                          <input
                            autoFocus
                            value={editingSizeValue}
                            onChange={(e) => setEditingSizeValue(e.target.value)}
                            onBlur={() => {
                              if (editingSizeValue.trim()) {
                                updateSizeName(s, editingSizeValue.trim());
                              }
                              setEditingSizeIndex(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                if (editingSizeValue.trim()) {
                                  updateSizeName(s, editingSizeValue.trim());
                                }
                                setEditingSizeIndex(null);
                              } else if (e.key === "Escape") {
                                setEditingSizeIndex(null);
                              }
                            }}
                            style={{
                              background: "#ffffff",
                              border: "1px solid #3b82f6",
                              color: "#0f172a",
                              borderRadius: "4px",
                              padding: "2px 6px",
                              fontSize: "12px",
                              width: "100px",
                            }}
                          />
                        ) : (
                          <span
                            onClick={() => setActiveSize(s)}
                            onDoubleClick={() => {
                              setEditingSizeIndex(i);
                              setEditingSizeValue(s);
                            }}
                            title="Click to select size, double click to edit name"
                            style={{
                              fontWeight: isActive ? 600 : 500,
                              color: isActive ? "#1d4ed8" : "#1e293b",
                            }}
                          >
                            {s}
                          </span>
                        )}
                        <button
                          type="button"
                          className="admin-dark-color-chip-remove"
                          title={`Delete size ${s}`}
                          aria-label={`Delete size ${s}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSize(s);
                          }}
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                  {sizes.length === 0 && (
                    <button
                      type="button"
                      onClick={() => setShowAddCustomSize(true)}
                      style={{
                        background: "#ffffff",
                        border: "1px dashed #cbd5df",
                        color: "#64748b",
                        borderRadius: "9999px",
                        padding: "6px 14px",
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                    >
                      + Add a Size
                    </button>
                  )}
                </div>
              </div>

              {/* Add Custom Size Box */}
              {showAddCustomSize && (
                <div className="admin-dark-custom-color-box">
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", marginBottom: "8px" }}>
                    Create Custom Size
                  </div>

                  {/* Preset quick picks */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "11px", color: "#64748b" }}>Quick presets:</span>
                    {[
                      "One Size",
                      "Small (S)",
                      "Medium (M)",
                      "Large (L)",
                      "XL",
                      "Cabin (35L)",
                      "Medium Check-In (65L)",
                      "Trunk Large (95L)",
                    ].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setCustomSizeName(preset)}
                        style={{
                          background: "#ffffff",
                          border: "1px solid #cbd5df",
                          color: "#334155",
                          borderRadius: "6px",
                          padding: "5px 12px",
                          fontSize: "12px",
                          cursor: "pointer",
                          fontWeight: 500,
                        }}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>

                  <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                    <input
                      placeholder="Size Name (e.g. Carry-On, 40L, XL)"
                      value={customSizeName}
                      onChange={(e) => setCustomSizeName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addCustomSize(customSizeName);
                        }
                      }}
                      style={{
                        flex: 1,
                        minWidth: "160px",
                        background: "#ffffff",
                        border: "1px solid #cbd5df",
                        color: "#0f172a",
                        borderRadius: "6px",
                        padding: "8px 12px",
                        fontSize: "13px",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => addCustomSize(customSizeName)}
                      style={{
                        background: "#ffd333",
                        color: "#20262b",
                        border: "none",
                        borderRadius: "6px",
                        padding: "8px 16px",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      + Add Size
                    </button>
                  </div>
                </div>
              )}

              {/* Primary Color & Size Selectors matching Screenshot 1 */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "14px" }}>
                <label>
                  <span>Primary Color</span>
                  <select
                    value={colors[0]?.name || ""}
                    onChange={(e) => {
                      const selected = e.target.value;
                      const found = colors.find((c) => c.name === selected);
                      if (found) {
                        setColors([found, ...colors.filter((c) => c.name !== selected)]);
                      }
                    }}
                  >
                    {colors.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name} ({c.hex})
                      </option>
                    ))}
                    {!colors.length && <option value="">(No colors added)</option>}
                  </select>
                </label>
                <label>
                  <span>Size</span>
                  <select
                    value={activeSize || (sizes[0] || "")}
                    onChange={(e) => setActiveSize(e.target.value)}
                  >
                    {sizes.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                    {!sizes.length && <option value="">(No sizes added)</option>}
                  </select>
                </label>
              </div>
            </section>
            <section
              className="admin-product-images"
              data-editor-section="2"
              onDragOver={(e) => {
                e.preventDefault();
                setIsDropActive(true);
              }}
              onDragLeave={() => setIsDropActive(false)}
              onDrop={async (e) => {
                e.preventDefault();
                setIsDropActive(false);
                const files = Array.from(e.dataTransfer.files || []).filter(
                  (f) => f.type.startsWith("image/"),
                );
                if (files.length) await uploadImages(files);
              }}
            >
              <h2>Images</h2>
              <div className="admin-product-images-table">
                <table>
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Alt text</th>
                      <th>Order</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {gallery.map((image, index) => (
                      <tr key={image}>
                        <td>
                          <img src={image} alt={imageAltMap[image] || ""} />
                        </td>
                        <td>
                          <input
                            type="text"
                            aria-label={`Image ${index + 1} alt text`}
                            value={imageAltMap[image] || ""}
                            onChange={(event) =>
                              setImageAltMap((previous) => ({
                                ...previous,
                                [image]: event.target.value,
                              }))
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            aria-label={`Image ${index + 1} order`}
                            value={index}
                            min="0"
                            max={Math.max(0, gallery.length - 1)}
                            onChange={(event) => {
                              const target = Math.max(
                                0,
                                Math.min(
                                  gallery.length - 1,
                                  Number(event.target.value),
                                ),
                              );
                              const next = [...gallery];
                              next.splice(index, 1);
                              next.splice(target, 0, image);
                              setGallery(next);
                              setMainImage(next[0] || "");
                            }}
                          />
                        </td>
                        <td>
                          <button
                            type="button"
                            aria-label={`Remove image ${index + 1}`}
                            onClick={() => removeImage(image)}
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                type="button"
                className="admin-text-link"
                onClick={() => fileInputRef.current?.click()}
              >
                Upload new image
              </button>
            </section>
            <section data-editor-section="7">
              <h2>Search Engine Optimization</h2>
              <label>
                <span>Page title</span>
                <input
                  aria-label="Page title"
                  placeholder={`${name || "Product Name"} | OVIA`}
                  value={seoTitle}
                  onChange={(event) => setSeoTitle(event.target.value)}
                />
              </label>
              <label>
                <span>Meta description</span>
                <textarea
                  aria-label="Meta description"
                  rows={4}
                  placeholder="Brief description for search engines..."
                  value={metaDesc}
                  onChange={(event) => setMetaDesc(event.target.value)}
                />
              </label>
              <label>
                <span>URL slug</span>
                <div className="admin-slug-input">
                  <span>/products/</span>
                  <input
                    aria-label="URL slug"
                    value={urlSlug}
                    onChange={(event) =>
                      setUrlSlug(
                        event.target.value
                          .toLowerCase()
                          .replace(/\s+/g, "-")
                          .replace(/[^a-z0-9-_]/g, ""),
                      )
                    }
                  />
                </div>
              </label>
              {/* Google search preview */}
              <div style={{ marginTop: "24px", display: "flow-root", padding: "18px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "4px" }}>
                <div style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: "#64748b", marginBottom: "8px" }}>
                  Google search preview
                </div>
                {mainImage && <img src={mainImage} alt={imageAltMap[mainImage] || name || "Product search preview"} style={{float:"right",width:88,height:88,objectFit:"contain",marginLeft:16,borderRadius:4,background:"white"}} />}
                <div style={{ color: "#1a0dab", fontSize: "18px", lineHeight: 1.3, fontWeight: 500 }}>
                  {seoTitle || (name ? `${name} | OVIA` : "Product Name | OVIA")}
                </div>
                <div style={{ color: "#006621", fontSize: "13px", marginTop: "3px" }}>
                  https://www.ovias.shop/products/{urlSlug || "product-url"}
                </div>
                <div style={{ color: "#4d5156", fontSize: "13px", marginTop: "4px", lineHeight: 1.4 }}>
                  {metaDesc || shortDescription || fullDesc || "Discover luxury travel cases handcrafted for extraordinary journeys."}
                </div>
              </div>

              {/* Canonical URL */}
              <div style={{ marginTop: "20px" }}>
                <label>
                  <span>Canonical URL</span>
                  <input
                    aria-label="Canonical URL"
                    placeholder={`https://www.ovias.shop/products/${urlSlug || "product-slug"}`}
                    value={canonicalUrl}
                    onChange={(event) => setCanonicalUrl(event.target.value)}
                  />
                </label>
              </div>

              {/* XML Sitemap */}
              <div style={{ marginTop: "16px" }}>
                <label className="admin-product-radio">
                  <input
                    type="checkbox"
                    checked={showInSitemap}
                    onChange={(event) => setShowInSitemap(event.target.checked)}
                  />
                  Include this product in Google XML Sitemap (<code>/sitemap.xml</code>)
                </label>
              </div>

              {/* Structured JSON-LD Preview */}
              <div style={{ marginTop: "16px", display: "flex", gap: "10px", alignItems: "center" }}>
                <button
                  type="button"
                  className="secondary"
                  style={{ fontSize: "13px", padding: "6px 14px", border: "1px solid #cbd5df", background: "#f8fafc", cursor: "pointer", borderRadius: "2px" }}
                  onClick={() => setShowSchemaPreview(!showSchemaPreview)}
                >
                  {showSchemaPreview ? "Hide Structured Data" : "Preview Structured Data (JSON-LD)"}
                </button>
              </div>
              {showSchemaPreview && (
                <pre style={{ background: "#f1f5f9", border: "1px solid #cbd5df", borderRadius: "4px", padding: "12px", fontSize: "12px", color: "#334155", marginTop: "10px", overflowX: "auto" }}>
                  {JSON.stringify(
                    {
                      "@context": "https://schema.org",
                      "@type": "Product",
                      name: name || "Product Name",
                      image: mainImage ? (mainImage.startsWith("http") ? mainImage : `https://www.ovias.shop${mainImage}`) : "https://www.ovias.shop/media/default.jpg",
                      description: metaDesc || shortDescription || fullDesc || "",
                      sku: sku || "OVIA-SKU",
                      brand: { "@type": "Brand", name: brand || "OVIA" },
                      offers: {
                        "@type": "Offer",
                        url: canonicalUrl || `https://www.ovias.shop/products/${urlSlug || "product"}`,
                        priceCurrency: "INR",
                        price: price || 0,
                        availability: (stock ?? 1) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                        itemCondition: "https://schema.org/NewCondition",
                      },
                    },
                    null,
                    2,
                  )}
                </pre>
              )}
            </section>

          </main>
          <aside>
            <section>
              <h2>Visibility</h2>
              {[
                ["published", "Published"],
                ["scheduled", "Scheduled"],
                ["hidden", "Hidden"],
              ].map(([value, label]) => (
                <label className="admin-product-radio" key={value}>
                  <input
                    type="radio"
                    name="product-visibility"
                    checked={
                      value === "hidden"
                        ? status !== "Active"
                        : value === "scheduled"
                          ? status === "Active" && scheduled
                          : status === "Active" && !scheduled
                    }
                    onChange={() => {
                      setStatus(value === "hidden" ? "Draft" : "Active");
                      setScheduled(value === "scheduled");
                    }}
                  />
                  {label}
                </label>
              ))}
              {scheduled && (
                <label>
                  Publish date
                  <input
                    aria-label="Publish date"
                    type="datetime-local"
                    value={publishAt}
                    onChange={(event) => setPublishAt(event.target.value)}
                  />
                </label>
              )}
            </section>
            <section>
              <h2>Categories</h2>
              {taxonomyError && <p role="alert">{taxonomyError}</p>}
              <label>
                Category
                <select
                  aria-label="Product category"
                  value={category}
                  onChange={(event) => {
                    setCategory(event.target.value);
                    setSubcategory("");
                  }}
                >
                  {!dynamicCategories.includes(category) && (
                    <option value={category}>{category} (unavailable)</option>
                  )}
                  {dynamicCategories.map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </label>
              {dynamicSubcategories.length > 0 && (
                <label>
                  Subcategory
                  <select
                    value={subcategory}
                    onChange={(event) => setSubcategory(event.target.value)}
                  >
                    <option value="">None</option>
                    {dynamicSubcategories.map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                </label>
              )}
              <Link
                href="/admin/categories/new"
                target="_blank"
                rel="noreferrer"
              >
                Add new category
              </Link>
            </section>
            <section>
              <h2>Tags</h2>
              <div className="admin-product-tags">
                {tags.map((tag) => (
                  <button
                    type="button"
                    key={tag}
                    aria-label={`Remove tag ${tag}`}
                    onClick={() =>
                      setTags((previous) =>
                        previous.filter((value) => value !== tag),
                      )
                    }
                  >
                    × {tag}
                  </button>
                ))}
                <input
                  aria-label="Add tag"
                  placeholder="Add tag and press Enter"
                  value={tagInput}
                  onChange={(event) => setTagInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      if (tagInput.trim())
                        setTags((previous) =>
                          Array.from(new Set([...previous, tagInput.trim()])),
                        );
                      setTagInput("");
                    }
                  }}
                />
              </div>
            </section>
          </aside>
        </div>
      </div>
    );
  return (
    <div
      className={`${styles.editor} admin-reference-product-editor`}
      data-step={step}
      style={{ paddingBottom: 60, color: "#111111", fontFamily: "inherit" }}
    >
      <button type="button" onClick={() => setShowAdvanced(false)}>
        ← Back to product editor
      </button>
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={replacementInputRef}
        accept="image/jpeg,image/png,image/webp"
        style={{ display: "none" }}
        onChange={(event) => void replaceImage(event.target.files?.[0])}
      />
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        multiple
        style={{ display: "none" }}
      />
      <input
        type="file"
        ref={ogFileInputRef}
        onChange={handleOgFileUpload}
        accept="image/*"
        style={{ display: "none" }}
      />
      <input
        type="file"
        ref={videoInputRef}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setUploading(true);
          try {
            const form = new FormData();
            form.append("file", file);
            const response = await fetch("/api/admin/upload", {
              method: "POST",
              body: form,
            });
            const result = await response.json();
            if (!response.ok || !result.url)
              throw new Error(result.error || "Video upload failed");
            setVideoUrl(result.url);
          } catch (err) {
            alert(err instanceof Error ? err.message : "Video upload failed");
          } finally {
            setUploading(false);
          }
        }}
        accept="video/*"
        style={{ display: "none" }}
      />

      {/* Top Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 24,
          paddingBottom: 16,
          borderBottom: "1px solid #E5E7EB",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              margin: "0 0 4px",
              color: "#111111",
            }}
          >
            {isEditing ? "Edit Product" : "Add New Product"}
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: "#6B7280" }}>
            {isEditing
              ? name
              : "Manage product details, media, pricing and publishing."}
          </p>
        </div>

        {/* Top Action Buttons */}
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            type="button"
            onClick={() => handleSave("Draft")}
            disabled={loading}
            style={{
              padding: "9px 20px",
              backgroundColor: "#FFFFFF",
              border: "1px solid #D1D5DB",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 500,
              color: "#374151",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#F9FAFB")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "#FFFFFF")
            }
          >
            Save as Draft
          </button>
          <button
            type="button"
            onClick={() => handleSave(status)}
            disabled={loading}
            style={{
              padding: "9px 22px",
              backgroundColor: "#111111",
              border: "1px solid #111111",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              color: "#FFFFFF",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#262626")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "#111111")
            }
          >
            {loading && <RefreshCw size={14} className="animate-spin" />}
            {loading
              ? "Publishing..."
              : isEditing
                ? "Save Changes"
                : "Publish Product"}
          </button>
        </div>
      </div>

      <p className={styles.breadcrumb}>
        <Link href="/admin/products">Products</Link> /{" "}
        {isEditing ? "Edit Product" : "Add Product"}
      </p>
      {/* Main product workspace */}
      <div
        className={styles.layout}
        style={{
          display: "grid",
          gridTemplateColumns: "150px minmax(0, 1fr) 260px",
          gap: 28,
          alignItems: "start",
        }}
      >
        <nav className={styles.stepNav} aria-label="Product sections">
          {steps.map((label, index) => (
            <button
              type="button"
              key={label}
              aria-current={step === index ? "step" : undefined}
              onClick={() => {
                setStep(index);
                document
                  .querySelector(`[data-editor-section="${index}"]`)
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
                setOpenSections((prev) => ({ ...prev, [index]: true }));
              }}
            >
              <span>{index || "•"}</span>
              {label}
            </button>
          ))}
        </nav>
        {/* Editable product sections */}
        <div
          className={styles.sections}
          style={{ display: "flex", flexDirection: "column", gap: 20 }}
        >
          {step === 0 && (
            <section className={styles.overview}>
              <div>
                {mainImage ? (
                  <img
                    className={styles.heroImage}
                    src={mainImage}
                    alt={imageAltMap[mainImage] || name}
                  />
                ) : (
                  <p>No product image uploaded</p>
                )}
                <div className={styles.thumbnails}>
                  {gallery.map((img) => (
                    <button
                      type="button"
                      key={img}
                      onClick={() => setMainImage(img)}
                    >
                      <img src={img} alt={imageAltMap[img] || name} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h2>Product Information</h2>
                <dl>
                  {[
                    ["Brand", brand],
                    ["Category", category],
                    ["Subcategory", subcategory],
                    ["Collection", collection],
                    ["SKU", sku],
                    ["Status", status],
                    ["Price", `INR ${price.toLocaleString("en-IN")}`],
                    ["Stock", stock],
                    ["Variants", variants.length],
                    [
                      "Last updated",
                      initialData?.updatedAt
                        ? new Date(initialData.updatedAt).toLocaleString(
                            "en-IN",
                          )
                        : isEditing
                          ? "Not recorded"
                          : "Not saved",
                    ],
                  ].map(([label, value]) => (
                    <React.Fragment key={label}>
                      <dt>{label}</dt>
                      <dd>{value === "" || value == null ? "—" : value}</dd>
                    </React.Fragment>
                  ))}
                </dl>
              </div>
            </section>
          )}

          {/* ======================================================== */}
          {/* SECTION 1: BASIC INFORMATION */}
          {/* ======================================================== */}
          <div
            data-editor-section="1"
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E5E7EB",
              borderRadius: 8,
              boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
              overflow: "hidden",
            }}
          >
            <div
              onClick={() => toggleSection(1)}
              style={{
                padding: "16px 20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
                backgroundColor: "#FFFFFF",
                borderBottom: openSections[1] ? "1px solid #F3F4F6" : "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    backgroundColor: "#6B5A4B",
                    color: "#FFFFFF",
                    fontSize: 12,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  1
                </span>
                <span
                  style={{ fontSize: 15, fontWeight: 700, color: "#111111" }}
                >
                  Basic Information
                </span>
              </div>
              <button
                type="button"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#6B7280",
                }}
              >
                {openSections[1] ? (
                  <ChevronUp size={18} />
                ) : (
                  <ChevronDown size={18} />
                )}
              </button>
            </div>

            {openSections[1] && (
              <div
                style={{
                  padding: "20px 24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 18,
                }}
              >
                {/* Row 1: Product Name & SKU */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 18,
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#374151",
                        marginBottom: 6,
                      }}
                    >
                      Product Name <span style={{ color: "#EF4444" }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (!isEditing) {
                          const slugified = e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, "-")
                            .replace(/(^-|-$)/g, "");
                          setUrlSlug(slugified);
                          setCanonicalUrl(
                            `https://www.ovias.shop/products/${slugified}`,
                          );
                          setSeoTitle(
                            `OVIA ${e.target.value} | Premium Travel Case`,
                          );
                        }
                      }}
                      placeholder="e.g. Cabin Luggage 55cm"
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: 6,
                        border: "1px solid #D1D5DB",
                        fontSize: 13,
                        outline: "none",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#374151",
                        marginBottom: 6,
                      }}
                    >
                      SKU <span style={{ color: "#EF4444" }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      placeholder="e.g. OV-LUG-001"
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: 6,
                        border: "1px solid #D1D5DB",
                        fontSize: 13,
                        outline: "none",
                      }}
                    />
                  </div>
                </div>

                {taxonomyError && (
                  <p role="alert" style={{ color: "#b33", fontSize: 12 }}>
                    {taxonomyError} Retrying automatically.
                  </p>
                )}
                {/* Row 3: Category & Tags */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 18,
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#374151",
                        marginBottom: 6,
                      }}
                    >
                      Category <span style={{ color: "#EF4444" }}>*</span>
                    </label>
                    <select
                      value={category}
                      aria-label="Product category"
                      disabled={taxonomyLoading}
                      aria-busy={taxonomyLoading}
                      onChange={(e) => {
                        setCategory(e.target.value);
                        setSubcategory("");
                      }}
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: 6,
                        border: "1px solid #D1D5DB",
                        fontSize: 13,
                        outline: "none",
                        backgroundColor: "#FFFFFF",
                      }}
                    >
                      <option value="">
                        {taxonomyLoading
                          ? "Loading live categories…"
                          : "Select category"}
                      </option>
                      {category && !dynamicCategories.includes(category) && (
                        <option value={category} disabled>
                          {category} (unavailable)
                        </option>
                      )}
                      {dynamicCategories.map((catName) => (
                        <option key={catName} value={catName}>
                          {catName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#374151",
                        marginBottom: 6,
                      }}
                    >
                      Tags
                    </label>
                    <div
                      style={{
                        minHeight: 40,
                        padding: "4px 8px",
                        borderRadius: 6,
                        border: "1px solid #D1D5DB",
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "center",
                        gap: 6,
                        backgroundColor: "#FFFFFF",
                      }}
                    >
                      {tags.map((t) => (
                        <span
                          key={t}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            backgroundColor: "#F3F4F6",
                            color: "#374151",
                            padding: "3px 8px",
                            borderRadius: 4,
                            fontSize: 12,
                          }}
                        >
                          {t}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(t)}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              padding: 0,
                              fontSize: 12,
                              color: "#6B7280",
                              lineHeight: 1,
                            }}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleAddTag}
                        placeholder={
                          tags.length === 0 ? "Add tags (press Enter)" : ""
                        }
                        style={{
                          border: "none",
                          outline: "none",
                          fontSize: 12,
                          flex: 1,
                          minWidth: 100,
                          padding: "4px 2px",
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Row 4: Subcategory & Collection */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 18,
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#374151",
                        marginBottom: 6,
                      }}
                    >
                      Subcategory
                    </label>
                    <select
                      value={subcategory}
                      aria-label="Product subcategory"
                      disabled={taxonomyLoading || !category}
                      onChange={(e) => setSubcategory(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: 6,
                        border: "1px solid #D1D5DB",
                        fontSize: 13,
                        outline: "none",
                        backgroundColor: "#FFFFFF",
                      }}
                    >
                      <option value="">
                        {taxonomyLoading
                          ? "Loading live subcategories…"
                          : "Select subcategory"}
                      </option>
                      {subcategory &&
                        !dynamicSubcategories.includes(subcategory) && (
                          <option value={subcategory} disabled>
                            {subcategory} (unavailable)
                          </option>
                        )}
                      {dynamicSubcategories.map((subName) => (
                        <option key={subName} value={subName}>
                          {subName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#374151",
                        marginBottom: 6,
                      }}
                    >
                      Collection
                    </label>
                    <input
                      value={collection}
                      aria-label="Collection"
                      placeholder="Collection name"
                      onChange={(e) => setCollection(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        border: "1px solid #D1D5DB",
                        borderRadius: 6,
                        fontSize: 13,
                      }}
                    />
                  </div>
                </div>

                <div className={styles.identityFields}>
                  <label>
                    Product Handle / URL{" "}
                    <span style={{ color: "#EF4444" }}>*</span>
                    <input
                      required
                      value={urlSlug}
                      onChange={(e) =>
                        setUrlSlug(
                          e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9-]/g, "-"),
                        )
                      }
                      placeholder="product-name"
                    />
                  </label>
                </div>
                {/* Row 5: Status */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#374151",
                      marginBottom: 6,
                    }}
                  >
                    Status <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <div style={{ display: "flex", gap: 24, paddingTop: 4 }}>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 13,
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="radio"
                        name="productStatus"
                        checked={status === "Active"}
                        onChange={() => setStatus("Active")}
                        style={{ accentColor: "#111111", cursor: "pointer" }}
                      />
                      <span>Active</span>
                    </label>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 13,
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="radio"
                        name="productStatus"
                        checked={status === "Draft"}
                        onChange={() => setStatus("Draft")}
                        style={{ accentColor: "#111111", cursor: "pointer" }}
                      />
                      <span>Draft</span>
                    </label>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 13,
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="radio"
                        name="productStatus"
                        checked={status === "Archived"}
                        onChange={() => setStatus("Archived")}
                        style={{ accentColor: "#111111", cursor: "pointer" }}
                      />
                      <span>Archived</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* SECTION 2: IMAGES & VIDEO */}
          {/* ======================================================== */}
          <div
            data-editor-section="2"
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E5E7EB",
              borderRadius: 8,
              boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
              overflow: "hidden",
            }}
          >
            <div
              onClick={() => toggleSection(2)}
              style={{
                padding: "16px 20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
                backgroundColor: "#FFFFFF",
                borderBottom: openSections[2] ? "1px solid #F3F4F6" : "none",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      backgroundColor: "#6B5A4B",
                      color: "#FFFFFF",
                      fontSize: 12,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    2
                  </span>
                  <span
                    style={{ fontSize: 15, fontWeight: 700, color: "#111111" }}
                  >
                    Images & Video
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "#6B7280",
                    marginTop: 4,
                    marginLeft: 38,
                  }}
                >
                  Upload high quality images and one video. First image will be
                  used as main image.
                </div>
              </div>
              <button
                type="button"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#6B7280",
                }}
              >
                {openSections[2] ? (
                  <ChevronUp size={18} />
                ) : (
                  <ChevronDown size={18} />
                )}
              </button>
            </div>

            {openSections[2] && (
              <div
                style={{
                  padding: "20px 24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                }}
              >
                {/* Horizontal gallery / upload strip */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(110px, 1fr))",
                    gap: 12,
                  }}
                >
                  {/* Upload Images dropzone card */}
                  <div
                    role="button"
                    tabIndex={0}
                    aria-label="Upload product images"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        fileInputRef.current?.click();
                      }
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      void uploadImages(Array.from(e.dataTransfer.files));
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      height: 120,
                      border: "1.5px dashed #D1D5DB",
                      borderRadius: 8,
                      backgroundColor: "#FAFAFA",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      padding: 8,
                      textAlign: "center",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#111111";
                      e.currentTarget.style.backgroundColor = "#F5F5F4";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#D1D5DB";
                      e.currentTarget.style.backgroundColor = "#FAFAFA";
                    }}
                  >
                    <Upload
                      size={22}
                      color="#6B7280"
                      style={{ marginBottom: 4 }}
                    />
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#111111",
                      }}
                    >
                      Upload Images
                    </div>
                    <div
                      style={{ fontSize: 9, color: "#9CA3AF", marginTop: 2 }}
                    >
                      Click or drag & drop
                    </div>
                    <div style={{ fontSize: 8, color: "#9CA3AF" }}>
                      JPG, PNG, WebP (Max 5MB)
                    </div>
                  </div>

                  {/* Render Gallery Images */}
                  {gallery.map((img, idx) => {
                    const isMain =
                      mainImage === img ||
                      (idx === 0 && !gallery.includes(mainImage));
                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedImage(img)}
                        style={{
                          height: 120,
                          borderRadius: 8,
                          border: isMain
                            ? "2px solid #111111"
                            : "1px solid #E5E7EB",
                          backgroundColor: "#F9FAFB",
                          position: "relative",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          overflow: "hidden",
                          cursor: "pointer",
                          padding: 4,
                        }}
                      >
                        {isMain && (
                          <span
                            style={{
                              position: "absolute",
                              top: 6,
                              left: 6,
                              backgroundColor: "#111111",
                              color: "#FFFFFF",
                              fontSize: 9,
                              fontWeight: 700,
                              padding: "2px 6px",
                              borderRadius: 4,
                              zIndex: 2,
                            }}
                          >
                            Main
                          </span>
                        )}
                        <img
                          src={img}
                          alt={imageAltMap[img] || name || "Product image"}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                          }}
                        />
                        {/* Hover delete button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage(img);
                          }}
                          title="Delete image"
                          style={{
                            position: "absolute",
                            top: 6,
                            right: 6,
                            backgroundColor: "rgba(255,255,255,0.9)",
                            border: "none",
                            borderRadius: "50%",
                            width: 20,
                            height: 20,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            color: "#EF4444",
                          }}
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}

                  {/* Upload Video card */}
                  <div
                    role="button"
                    tabIndex={0}
                    aria-label="Upload product video"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        videoInputRef.current?.click();
                      }
                    }}
                    onClick={() => videoInputRef.current?.click()}
                    style={{
                      height: 120,
                      border: "1.5px dashed #D1D5DB",
                      borderRadius: 8,
                      backgroundColor: "#FAFAFA",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      padding: 8,
                      textAlign: "center",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#111111";
                      e.currentTarget.style.backgroundColor = "#F5F5F4";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#D1D5DB";
                      e.currentTarget.style.backgroundColor = "#FAFAFA";
                    }}
                  >
                    <Play
                      size={20}
                      color="#6B7280"
                      style={{ marginBottom: 4 }}
                    />
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#111111",
                      }}
                    >
                      Upload Video
                    </div>
                    <div
                      style={{ fontSize: 8, color: "#9CA3AF", marginTop: 2 }}
                    >
                      MP4, WebM (Max 100MB)
                    </div>
                  </div>
                </div>

                {selectedImage && gallery.includes(selectedImage) && (
                  <div className={styles.selectedMedia}>
                    <h3>Selected Image Details</h3>
                    <img
                      src={selectedImage}
                      alt={imageAltMap[selectedImage] || name}
                    />
                    <label>
                      Alt Text
                      <input
                        value={imageAltMap[selectedImage] || ""}
                        onChange={(e) =>
                          setImageAltMap((prev) => ({
                            ...prev,
                            [selectedImage]: e.target.value,
                          }))
                        }
                      />
                    </label>
                    <label>
                      Assign to Variant
                      <select
                        value={
                          imageVariantAssignments[selectedImage] ??
                          variants.find((v) => v.image === selectedImage)
                            ?.sku ??
                          ""
                        }
                        onChange={(e) => {
                          const selectedSku = e.target.value;
                          if (selectedSku === "__custom__") {
                            setShowCustomVariant(true);
                            return;
                          }
                          setImageVariantAssignments((prev) => {
                            const next = { ...prev };
                            for (const [image, sku] of Object.entries(next)) {
                              if (selectedSku && sku === selectedSku)
                                next[image] = "";
                            }
                            next[selectedImage] = selectedSku;
                            return next;
                          });
                          setVariants((prev) =>
                            prev.map((v) =>
                              v.sku === selectedSku
                                ? { ...v, image: selectedImage }
                                : v.image === selectedImage
                                  ? { ...v, image: "" }
                                  : v,
                            ),
                          );
                        }}
                      >
                        <option value="">No variant</option>
                        {variants.map((v) => (
                          <option key={v.sku} value={v.sku}>
                            {[v.color, v.size].filter(Boolean).join(" / ")} (
                            {v.sku})
                          </option>
                        ))}
                        <option value="__custom__">
                          + Create your own variant
                        </option>
                      </select>
                    </label>
                    <button
                      type="button"
                      disabled={uploading}
                      onClick={() => replacementInputRef.current?.click()}
                    >
                      Replace image
                    </button>
                    <button
                      type="button"
                      onClick={() => removeImage(selectedImage)}
                    >
                      Delete image
                    </button>
                    <button
                      type="button"
                      disabled={gallery.indexOf(selectedImage) === 0}
                      onClick={() =>
                        setGallery((prev) => {
                          const next = [...prev];
                          const index = next.indexOf(selectedImage);
                          if (index > 0)
                            [next[index - 1], next[index]] = [
                              next[index],
                              next[index - 1],
                            ];
                          return next;
                        })
                      }
                    >
                      Move earlier
                    </button>
                    <button
                      type="button"
                      disabled={
                        gallery.indexOf(selectedImage) === gallery.length - 1
                      }
                      onClick={() =>
                        setGallery((prev) => {
                          const next = [...prev];
                          const index = next.indexOf(selectedImage);
                          if (index >= 0 && index < next.length - 1)
                            [next[index + 1], next[index]] = [
                              next[index],
                              next[index + 1],
                            ];
                          return next;
                        })
                      }
                    >
                      Move later
                    </button>
                    <label>
                      <input
                        type="checkbox"
                        checked={mainImage === selectedImage}
                        onChange={(e) => {
                          if (e.target.checked) setMainImage(selectedImage);
                          else {
                            const alternative = gallery.find(
                              (image) => image !== selectedImage,
                            );
                            if (alternative) setMainImage(alternative);
                            else
                              alert(
                                "Upload another image before changing the main image.",
                              );
                          }
                        }}
                      />{" "}
                      Set as main image
                    </label>
                    {showCustomVariant && (
                      <fieldset className={styles.customVariant}>
                        <legend>Create your own variant</legend>
                        {[
                          ["sku", "SKU"],
                          ["color", "Colour"],
                          ["size", "Size (optional)"],
                        ].map(([field, label]) => (
                          <label key={field}>
                            {label}
                            <input
                              value={
                                customVariant[
                                  field as keyof typeof customVariant
                                ]
                              }
                              onChange={(e) =>
                                setCustomVariant((prev) => ({
                                  ...prev,
                                  [field]: e.target.value,
                                }))
                              }
                            />
                          </label>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            const variantSku = customVariant.sku.trim(),
                              color = customVariant.color.trim();
                            if (!variantSku || !color) {
                              alert("Enter a SKU and colour.");
                              return;
                            }
                            if (variants.some((v) => v.sku === variantSku)) {
                              alert(
                                "This SKU already exists. Choose another SKU.",
                              );
                              return;
                            }
                            setVariants((prev) => [
                              ...prev,
                              {
                                sku: variantSku,
                                color,
                                size: customVariant.size.trim(),
                                hex: "#333333",
                                price,
                                stock: 0,
                                image: selectedImage,
                              },
                            ]);
                            setColors((prev) =>
                              prev.some((c) => c.name === color)
                                ? prev
                                : [...prev, { name: color, hex: "#333333" }],
                            );
                            setImageVariantAssignments((prev) => ({
                              ...prev,
                              [selectedImage]: variantSku,
                            }));
                            setCustomVariant({ sku: "", color: "", size: "" });
                            setShowCustomVariant(false);
                          }}
                        >
                          Add Variant
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowCustomVariant(false)}
                        >
                          Cancel
                        </button>
                      </fieldset>
                    )}
                  </div>
                )}
                {videoUrl && (
                  <div>
                    <video
                      src={videoUrl}
                      controls
                      style={{ width: "100%", maxHeight: 240 }}
                    />
                    <button
                      type="button"
                      onClick={() => videoInputRef.current?.click()}
                    >
                      Replace video
                    </button>
                    <button type="button" onClick={() => setVideoUrl("")}>
                      Remove video
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* SECTION 3: PRICING & INVENTORY */}
          {/* ======================================================== */}
          <div
            data-editor-section="3"
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E5E7EB",
              borderRadius: 8,
              boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
              overflow: "hidden",
            }}
          >
            <div
              onClick={() => toggleSection(3)}
              style={{
                padding: "16px 20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
                backgroundColor: "#FFFFFF",
                borderBottom: openSections[3] ? "1px solid #F3F4F6" : "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    backgroundColor: "#6B5A4B",
                    color: "#FFFFFF",
                    fontSize: 12,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  3
                </span>
                <span
                  style={{ fontSize: 15, fontWeight: 700, color: "#111111" }}
                >
                  Pricing & Inventory
                </span>
              </div>
              <button
                type="button"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#6B7280",
                }}
              >
                {openSections[3] ? (
                  <ChevronUp size={18} />
                ) : (
                  <ChevronDown size={18} />
                )}
              </button>
            </div>

            {openSections[3] && (
              <div style={{ padding: "20px 24px" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                    gap: 16,
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#374151",
                        marginBottom: 6,
                      }}
                    >
                      Selling Price (₹){" "}
                      <span style={{ color: "#EF4444" }}>*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      step="0.01"
                      aria-label="Selling Price"
                      value={price}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setPrice(val);
                        // Also update primary variant price
                        if (variants.length > 0) {
                          handleUpdateVariant(0, { price: val });
                        }
                      }}
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: 6,
                        border: "1px solid #D1D5DB",
                        fontSize: 13,
                        outline: "none",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#374151",
                        marginBottom: 6,
                      }}
                    >
                      Stock Quantity <span style={{ color: "#EF4444" }}>*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      step={1}
                      aria-label="Stock Quantity"
                      value={
                        variants.length
                          ? variants.reduce((sum, v) => sum + v.stock, 0)
                          : stock
                      }
                      readOnly={variants.length > 1}
                      onChange={(e) => {
                        setStock(Number(e.target.value));
                        if (variants.length === 1)
                          handleUpdateVariant(0, {
                            stock: Number(e.target.value),
                          });
                      }}
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: 6,
                        border: "1px solid #D1D5DB",
                        fontSize: 13,
                        outline: "none",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#374151",
                        marginBottom: 6,
                      }}
                    >
                      Low Stock Alert
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      aria-label="Low Stock Alert"
                      value={lowStockAlert}
                      onChange={(e) => setLowStockAlert(Number(e.target.value))}
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: 6,
                        border: "1px solid #D1D5DB",
                        fontSize: 13,
                        outline: "none",
                      }}
                    />
                  </div>
                </div>
                <fieldset
                  style={{
                    marginTop: 24,
                    padding: 16,
                    border: "1px solid #E5E7EB",
                    borderRadius: 6,
                  }}
                >
                  <legend>Sale Price (optional)</legend>
                  <label>
                    <input
                      type="checkbox"
                      checked={sale.enabled}
                      onChange={(event) =>
                        setSale({ ...sale, enabled: event.target.checked })
                      }
                    />{" "}
                    Enable sale price
                  </label>
                  {sale.enabled && (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3,minmax(0,1fr))",
                        gap: 12,
                        marginTop: 16,
                      }}
                    >
                      <label>
                        Sale Price (₹) *
                        <input
                          aria-label="Sale Price"
                          type="number"
                          min="0.01"
                          step="0.01"
                          required
                          value={sale.price}
                          onChange={(event) =>
                            setSale({
                              ...sale,
                              price: Number(event.target.value),
                            })
                          }
                        />
                      </label>
                      <label>
                        Start Date *
                        <input
                          aria-label="Sale Start Date"
                          type="date"
                          required
                          value={sale.startDate}
                          onChange={(event) =>
                            setSale({ ...sale, startDate: event.target.value })
                          }
                        />
                      </label>
                      <label>
                        End Date *
                        <input
                          aria-label="Sale End Date"
                          type="date"
                          required
                          min={sale.startDate}
                          value={sale.endDate}
                          onChange={(event) =>
                            setSale({ ...sale, endDate: event.target.value })
                          }
                        />
                      </label>
                    </div>
                  )}
                </fieldset>
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* SECTION 4: VARIANTS (COLOR, SIZE, ETC.) */}
          {/* ======================================================== */}
          <div
            data-editor-section="4"
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E5E7EB",
              borderRadius: 8,
              boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
              overflow: "hidden",
            }}
          >
            <div
              onClick={() => toggleSection(4)}
              style={{
                padding: "16px 20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
                backgroundColor: "#FFFFFF",
                borderBottom: openSections[4] ? "1px solid #F3F4F6" : "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    backgroundColor: "#6B5A4B",
                    color: "#FFFFFF",
                    fontSize: 12,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  4
                </span>
                <span
                  style={{ fontSize: 15, fontWeight: 700, color: "#111111" }}
                >
                  Variants (Color, Size, etc.)
                </span>
              </div>
              <button
                type="button"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#6B7280",
                }}
              >
                {openSections[4] ? (
                  <ChevronUp size={18} />
                ) : (
                  <ChevronDown size={18} />
                )}
              </button>
            </div>

            {openSections[4] && (
              <div
                style={{
                  padding: "20px 24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 20,
                }}
              >
                {/* 3 Columns: Color | Size | Manage Variants Table */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "190px 170px 1fr",
                    gap: 20,
                  }}
                >
                  {/* Column 1: Color */}
                  <div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 8,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#374151",
                        }}
                      >
                        Color
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowAddColorModal(!showAddColorModal)}
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: "#111111",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 2,
                        }}
                      >
                        + Add Color
                      </button>
                    </div>

                    {showAddColorModal && (
                      <div
                        style={{
                          backgroundColor: "#F9FAFB",
                          padding: 10,
                          borderRadius: 6,
                          border: "1px solid #E5E7EB",
                          marginBottom: 10,
                          display: "flex",
                          flexDirection: "column",
                          gap: 6,
                        }}
                      >
                        <input
                          type="text"
                          value={newColorName}
                          onChange={(e) => setNewColorName(e.target.value)}
                          placeholder="Color name"
                          style={{
                            padding: "4px 8px",
                            fontSize: 12,
                            borderRadius: 4,
                            border: "1px solid #D1D5DB",
                          }}
                        />
                        <div
                          style={{
                            display: "flex",
                            gap: 6,
                            alignItems: "center",
                          }}
                        >
                          <input
                            type="color"
                            value={newColorHex}
                            onChange={(e) => setNewColorHex(e.target.value)}
                            style={{
                              width: 28,
                              height: 28,
                              border: "none",
                              cursor: "pointer",
                              padding: 0,
                            }}
                          />
                          <button
                            type="button"
                            onClick={handleAddColor}
                            style={{
                              flex: 1,
                              backgroundColor: "#111111",
                              color: "#FFFFFF",
                              border: "none",
                              borderRadius: 4,
                              fontSize: 11,
                              padding: "6px",
                              cursor: "pointer",
                            }}
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    )}

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                      }}
                    >
                      {colors.map((c) => (
                        <div
                          key={c.name}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "6px 10px",
                            backgroundColor: "#F9FAFB",
                            border: "1px solid #E5E7EB",
                            borderRadius: 6,
                            fontSize: 12,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <span
                              style={{
                                width: 14,
                                height: 14,
                                borderRadius: "50%",
                                backgroundColor: c.hex,
                                border: "1px solid rgba(0,0,0,0.15)",
                              }}
                            />
                            <span>{c.name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveColor(c.name)}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              color: "#9CA3AF",
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Column 2: Size */}
                  <div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 8,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#374151",
                        }}
                      >
                        Size
                      </span>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                      }}
                    >
                      {sizes.map((sz) => {
                        const isSelected = activeSize === sz;
                        return (
                          <div
                            key={sz}
                            onClick={() => setActiveSize(sz)}
                            style={{
                              padding: "8px 12px",
                              borderRadius: 6,
                              border: isSelected
                                ? "1.5px solid #111111"
                                : "1px solid #E5E7EB",
                              backgroundColor: isSelected
                                ? "#FFFFFF"
                                : "#F9FAFB",
                              fontSize: 12,
                              fontWeight: isSelected ? 600 : 400,
                              cursor: "pointer",
                              textAlign: "center",
                            }}
                          >
                            {sz}
                          </div>
                        );
                      })}

                      {showAddSizeModal ? (
                        <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                          <input
                            type="text"
                            value={newSizeName}
                            onChange={(e) => setNewSizeName(e.target.value)}
                            placeholder="e.g. XL (86cm)"
                            style={{
                              width: "100%",
                              padding: "4px 8px",
                              fontSize: 11,
                              borderRadius: 4,
                              border: "1px solid #D1D5DB",
                            }}
                          />
                          <button
                            type="button"
                            onClick={handleAddSize}
                            style={{
                              backgroundColor: "#111111",
                              color: "#FFFFFF",
                              border: "none",
                              borderRadius: 4,
                              fontSize: 11,
                              padding: "4px 8px",
                              cursor: "pointer",
                            }}
                          >
                            Add
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowAddSizeModal(true)}
                          style={{
                            padding: "8px 12px",
                            borderRadius: 6,
                            border: "1px dashed #D1D5DB",
                            backgroundColor: "#FFFFFF",
                            fontSize: 12,
                            color: "#6B7280",
                            cursor: "pointer",
                            textAlign: "center",
                          }}
                        >
                          + Add Size
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Column 3: Manage Variants Table */}
                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#374151",
                        marginBottom: 8,
                      }}
                    >
                      Manage Variants
                      <button
                        type="button"
                        className={styles.generate}
                        onClick={() => {
                          if (!colors.length || !sizes.length) {
                            alert("Add colors and sizes first.");
                            return;
                          }
                          setVariants((prev) => {
                            const result = [...prev];
                            for (const color of colors)
                              for (const size of sizes)
                                if (
                                  !result.some(
                                    (v) =>
                                      v.color === color.name && v.size === size,
                                  )
                                )
                                  result.push({
                                    sku: `${sku || "PRODUCT"}-${result.length + 1}`,
                                    color: color.name,
                                    hex: color.hex,
                                    size,
                                    price,
                                    stock: 0,
                                    image: mainImage,
                                  });
                            return result;
                          });
                        }}
                      >
                        Generate Variants
                      </button>
                    </div>

                    <div
                      style={{
                        border: "1px solid #E5E7EB",
                        borderRadius: 6,
                        overflow: "hidden",
                      }}
                    >
                      <table
                        style={{
                          width: "100%",
                          borderCollapse: "collapse",
                          fontSize: 12,
                        }}
                      >
                        <thead>
                          <tr
                            style={{
                              backgroundColor: "#F9FAFB",
                              borderBottom: "1px solid #E5E7EB",
                              textAlign: "left",
                            }}
                          >
                            <th
                              style={{
                                padding: "8px 10px",
                                fontWeight: 600,
                                color: "#4B5563",
                              }}
                            >
                              Color
                            </th>
                            <th
                              style={{
                                padding: "8px 10px",
                                fontWeight: 600,
                                color: "#4B5563",
                              }}
                            >
                              Size
                            </th>
                            <th
                              style={{
                                padding: "8px 10px",
                                fontWeight: 600,
                                color: "#4B5563",
                              }}
                            >
                              SKU
                            </th>
                            <th
                              style={{
                                padding: "8px 10px",
                                fontWeight: 600,
                                color: "#4B5563",
                              }}
                            >
                              Price (₹)
                            </th>
                            <th
                              style={{
                                padding: "8px 10px",
                                fontWeight: 600,
                                color: "#4B5563",
                              }}
                            >
                              Stock
                            </th>
                            <th>Image</th>
                            <th
                              style={{
                                padding: "8px 10px",
                                fontWeight: 600,
                                color: "#4B5563",
                                width: 50,
                              }}
                            ></th>
                          </tr>
                        </thead>
                        <tbody>
                          {variants.map((v, idx) => (
                            <tr
                              key={idx}
                              style={{
                                borderBottom:
                                  idx !== variants.length - 1
                                    ? "1px solid #F3F4F6"
                                    : "none",
                              }}
                            >
                              <td style={{ padding: "8px 10px" }}>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                  }}
                                >
                                  <input
                                    type="color"
                                    aria-label={`Colour swatch for ${v.sku}`}
                                    title="Choose variant colour"
                                    value={
                                      /^#[0-9a-f]{6}$/i.test(v.hex)
                                        ? v.hex
                                        : "#333333"
                                    }
                                    onChange={(event) =>
                                      handleUpdateVariant(idx, {
                                        hex: event.target.value,
                                      })
                                    }
                                    style={{
                                      width: 30,
                                      height: 30,
                                      padding: 2,
                                      border: "1px solid #D1D5DB",
                                      borderRadius: 5,
                                      cursor: "pointer",
                                      flexShrink: 0,
                                    }}
                                  />
                                  <input
                                    aria-label={`Colour for ${v.sku}`}
                                    value={v.color}
                                    style={{
                                      width: 90,
                                      minWidth: 0,
                                      padding: 6,
                                      border: "1px solid #ddd",
                                      borderRadius: 4,
                                    }}
                                    onChange={(event) =>
                                      handleUpdateVariant(idx, {
                                        color: event.target.value,
                                      })
                                    }
                                  />
                                </div>
                              </td>
                              <td
                                style={{
                                  padding: "8px 10px",
                                  color: "#6B7280",
                                }}
                              >
                                <input
                                  value={v.size || ""}
                                  aria-label={`Size for ${v.sku}`}
                                  onChange={(e) =>
                                    handleUpdateVariant(idx, {
                                      size: e.target.value,
                                    })
                                  }
                                  style={{
                                    width: 80,
                                    padding: 4,
                                    border: "1px solid #ddd",
                                  }}
                                />
                              </td>
                              <td style={{ padding: "8px 10px" }}>
                                <input
                                  type="text"
                                  value={v.sku}
                                  onChange={(e) =>
                                    handleUpdateVariant(idx, {
                                      sku: e.target.value,
                                    })
                                  }
                                  style={{
                                    width: "100%",
                                    padding: "3px 6px",
                                    fontSize: 11,
                                    borderRadius: 4,
                                    border: "1px solid #E5E7EB",
                                  }}
                                />
                              </td>
                              <td style={{ padding: "8px 10px" }}>
                                <input
                                  type="number"
                                  value={v.price}
                                  onChange={(e) => {
                                    handleUpdateVariant(idx, {
                                      price: Number(e.target.value),
                                    });
                                    if (idx === 0)
                                      setPrice(Number(e.target.value));
                                  }}
                                  style={{
                                    width: 70,
                                    padding: "3px 6px",
                                    fontSize: 11,
                                    borderRadius: 4,
                                    border: "1px solid #E5E7EB",
                                  }}
                                />
                              </td>
                              <td style={{ padding: "8px 10px" }}>
                                <input
                                  type="number"
                                  value={v.stock}
                                  onChange={(e) =>
                                    handleUpdateVariant(idx, {
                                      stock: Number(e.target.value),
                                    })
                                  }
                                  style={{
                                    width: 50,
                                    padding: "3px 6px",
                                    fontSize: 11,
                                    borderRadius: 4,
                                    border: "1px solid #E5E7EB",
                                  }}
                                />
                              </td>
                              <td>
                                <select
                                  aria-label={`Image for ${v.sku}`}
                                  value={v.image || ""}
                                  onChange={(e) =>
                                    handleUpdateVariant(idx, {
                                      image: e.target.value,
                                    })
                                  }
                                >
                                  <option value="">No image</option>
                                  {gallery.map((image, i) => (
                                    <option key={image} value={image}>
                                      Image {i + 1}
                                    </option>
                                  ))}
                                </select>
                                {v.image && (
                                  <img
                                    src={v.image}
                                    alt={v.color}
                                    style={{
                                      width: 30,
                                      height: 40,
                                      objectFit: "contain",
                                    }}
                                  />
                                )}
                              </td>
                              <td
                                style={{
                                  padding: "8px 10px",
                                  textAlign: "right",
                                }}
                              >
                                <button
                                  type="button"
                                  onClick={() => handleRemoveVariant(idx)}
                                  title="Delete variant"
                                  style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    color: "#EF4444",
                                  }}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddVariantRow}
                      style={{
                        marginTop: 10,
                        backgroundColor: "#FFFFFF",
                        border: "1px dashed #D1D5DB",
                        borderRadius: 6,
                        padding: "6px 12px",
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#374151",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <Plus size={12} /> Add Variant Combination
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* SECTION 5: DESCRIPTION & PRODUCT CONTENT */}
          {/* ======================================================== */}
          <div
            data-editor-section="5"
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E5E7EB",
              borderRadius: 8,
              boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
              overflow: "hidden",
            }}
          >
            <div
              onClick={() => toggleSection(5)}
              style={{
                padding: "16px 20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
                backgroundColor: "#FFFFFF",
                borderBottom: openSections[5] ? "1px solid #F3F4F6" : "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    backgroundColor: "#6B5A4B",
                    color: "#FFFFFF",
                    fontSize: 12,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  5
                </span>
                <span
                  style={{ fontSize: 15, fontWeight: 700, color: "#111111" }}
                >
                  Description & Product Content
                </span>
              </div>
              <button
                type="button"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#6B7280",
                }}
              >
                {openSections[5] ? (
                  <ChevronUp size={18} />
                ) : (
                  <ChevronDown size={18} />
                )}
              </button>
            </div>

            {openSections[5] && (
              <div style={{ padding: "20px 24px" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.2fr 1fr 1fr",
                    gap: 20,
                  }}
                >
                  {/* Column 1: Product Description */}
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#374151",
                        marginBottom: 6,
                      }}
                    >
                      Product Description{" "}
                      <span style={{ color: "#EF4444" }}>*</span>
                    </label>
                    <textarea
                      rows={7}
                      value={fullDesc}
                      onChange={(e) => setFullDesc(e.target.value)}
                      placeholder="Write a detailed product description..."
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "0 0 6px 6px",
                        border: "1px solid #D1D5DB",
                        fontSize: 12,
                        outline: "none",
                        lineHeight: 1.5,
                        resize: "vertical",
                      }}
                    />
                  </div>

                  {/* Column 2: Key Features (Bullet Points) */}
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#374151",
                        marginBottom: 6,
                      }}
                    >
                      Key Features (Bullet Points)
                    </label>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                      }}
                    >
                      {bulletPoints.map((bp, i) => (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "6px 8px",
                            backgroundColor: "#F9FAFB",
                            border: "1px solid #E5E7EB",
                            borderRadius: 6,
                            fontSize: 11,
                          }}
                        >
                          <span style={{ color: "#9CA3AF" }}>○</span>
                          <input
                            aria-label={`Key feature ${i + 1}`}
                            value={bp}
                            style={{
                              flex: 1,
                              minWidth: 0,
                              border: "1px solid #ddd",
                              padding: 6,
                              borderRadius: 4,
                            }}
                            onChange={(event) =>
                              setBulletPoints((prev) =>
                                prev.map((item, index) =>
                                  index === i ? event.target.value : item,
                                ),
                              )
                            }
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveBullet(i)}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              color: "#9CA3AF",
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}

                      {/* Add bullet input */}
                      <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                        <input
                          type="text"
                          value={newBulletText}
                          onChange={(e) => setNewBulletText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddBullet();
                            }
                          }}
                          placeholder="e.g. 5-year warranty"
                          style={{
                            flex: 1,
                            padding: "6px 8px",
                            fontSize: 11,
                            borderRadius: 4,
                            border: "1px solid #D1D5DB",
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleAddBullet}
                          style={{
                            backgroundColor: "#F3F4F6",
                            border: "1px solid #D1D5DB",
                            borderRadius: 4,
                            padding: "6px 10px",
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          + Add
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Column 3: Specifications */}
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#374151",
                        marginBottom: 6,
                      }}
                    >
                      Specifications
                    </label>
                    {customSpecifications.map(([key, value], index) => (
                      <div
                        key={index}
                        style={{ display: "flex", gap: 6, marginBottom: 8 }}
                      >
                        <input
                          aria-label={`Specification name ${index + 1}`}
                          placeholder="Specification name"
                          value={key}
                          onChange={(event) =>
                            setCustomSpecifications((prev) =>
                              prev.map((row, i) =>
                                i === index
                                  ? [event.target.value, row[1]]
                                  : row,
                              ),
                            )
                          }
                        />
                        <input
                          aria-label={`Specification value ${index + 1}`}
                          placeholder="Value"
                          value={value}
                          onChange={(event) =>
                            setCustomSpecifications((prev) =>
                              prev.map((row, i) =>
                                i === index
                                  ? [row[0], event.target.value]
                                  : row,
                              ),
                            )
                          }
                        />
                        <button
                          type="button"
                          aria-label={`Remove specification ${index + 1}`}
                          onClick={() =>
                            setCustomSpecifications((prev) =>
                              prev.filter((_, i) => i !== index),
                            )
                          }
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        setCustomSpecifications((prev) => [...prev, ["", ""]])
                      }
                    >
                      + Add Specification
                    </button>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      <div>
                        <span
                          style={{
                            display: "block",
                            fontSize: 11,
                            color: "#6B7280",
                            marginBottom: 3,
                          }}
                        >
                          Material
                        </span>
                        <input
                          type="text"
                          value={specMaterial}
                          onChange={(e) => setSpecMaterial(e.target.value)}
                          placeholder="e.g. Polycarbonate"
                          style={{
                            width: "100%",
                            padding: "6px 10px",
                            fontSize: 12,
                            borderRadius: 4,
                            border: "1px solid #D1D5DB",
                          }}
                        />
                      </div>
                      <div>
                        <span
                          style={{
                            display: "block",
                            fontSize: 11,
                            color: "#6B7280",
                            marginBottom: 3,
                          }}
                        >
                          Capacity
                        </span>
                        <input
                          type="text"
                          value={specCapacity}
                          onChange={(e) => setSpecCapacity(e.target.value)}
                          placeholder="e.g. 35 Litres"
                          style={{
                            width: "100%",
                            padding: "6px 10px",
                            fontSize: 12,
                            borderRadius: 4,
                            border: "1px solid #D1D5DB",
                          }}
                        />
                      </div>
                      <div>
                        <span
                          style={{
                            display: "block",
                            fontSize: 11,
                            color: "#6B7280",
                            marginBottom: 3,
                          }}
                        >
                          Weight
                        </span>
                        <input
                          type="text"
                          value={specWeight}
                          onChange={(e) => setSpecWeight(e.target.value)}
                          placeholder="e.g. 3.2 kg"
                          style={{
                            width: "100%",
                            padding: "6px 10px",
                            fontSize: 12,
                            borderRadius: 4,
                            border: "1px solid #D1D5DB",
                          }}
                        />
                      </div>
                      <div>
                        <span
                          style={{
                            display: "block",
                            fontSize: 11,
                            color: "#6B7280",
                            marginBottom: 3,
                          }}
                        >
                          Dimensions (L × W × H)
                        </span>
                        <input
                          type="text"
                          value={specDimensions}
                          onChange={(e) => setSpecDimensions(e.target.value)}
                          placeholder="e.g. 55 x 40 x 20 cm"
                          style={{
                            width: "100%",
                            padding: "6px 10px",
                            fontSize: 12,
                            borderRadius: 4,
                            border: "1px solid #D1D5DB",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2,minmax(0,1fr))",
                    gap: 16,
                    marginTop: 24,
                  }}
                >
                  {[
                    ["maintenanceCare", "Maintenance & Care"],
                    ["sustainability", "Sustainability"],
                  ].map(([field, label]) => (
                    <label
                      key={field}
                      style={{ fontSize: 12, fontWeight: 600 }}
                    >
                      {label}
                      <textarea
                        aria-label={label}
                        rows={3}
                        value={productInformation[field]}
                        onChange={(event) =>
                          setProductInformation((prev) => ({
                            ...prev,
                            [field]: event.target.value,
                          }))
                        }
                        style={{
                          display: "block",
                          width: "100%",
                          marginTop: 6,
                          padding: 8,
                          border: "1px solid #D1D5DB",
                          borderRadius: 6,
                        }}
                      />
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* SECTION 6: SHIPPING & DIMENSIONS */}
          {/* ======================================================== */}
          <div
            data-editor-section="6"
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E5E7EB",
              borderRadius: 8,
              boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
              overflow: "hidden",
            }}
          >
            <div
              onClick={() => toggleSection(6)}
              style={{
                padding: "16px 20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
                backgroundColor: "#FFFFFF",
                borderBottom: openSections[6] ? "1px solid #F3F4F6" : "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    backgroundColor: "#6B5A4B",
                    color: "#FFFFFF",
                    fontSize: 12,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  6
                </span>
                <span
                  style={{ fontSize: 15, fontWeight: 700, color: "#111111" }}
                >
                  Shipping & Dimensions
                </span>
              </div>
              <button
                type="button"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#6B7280",
                }}
              >
                {openSections[6] ? (
                  <ChevronUp size={18} />
                ) : (
                  <ChevronDown size={18} />
                )}
              </button>
            </div>

            {openSections[6] && (
              <div
                className={styles.shippingSection}
                style={{ padding: "20px 24px" }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 2fr",
                    gap: 20,
                    alignItems: "start",
                  }}
                >
                  {/* Weight */}
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#374151",
                        marginBottom: 6,
                      }}
                    >
                      Weight (kg)
                    </label>
                    <input
                      type="text"
                      value={shipWeight}
                      onChange={(e) => setShipWeight(e.target.value)}
                      placeholder="3.2"
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: 6,
                        border: "1px solid #D1D5DB",
                        fontSize: 13,
                      }}
                    />
                  </div>

                  {/* Dimensions Length, Width, Height */}
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#374151",
                        marginBottom: 6,
                      }}
                    >
                      Dimensions (cm)
                    </label>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr 1fr",
                        gap: 10,
                      }}
                    >
                      <div>
                        <span style={{ fontSize: 10, color: "#6B7280" }}>
                          Length
                        </span>
                        <input
                          type="text"
                          value={shipLength}
                          onChange={(e) => setShipLength(e.target.value)}
                          placeholder="55"
                          style={{
                            width: "100%",
                            padding: "8px 10px",
                            borderRadius: 4,
                            border: "1px solid #D1D5DB",
                            fontSize: 12,
                          }}
                        />
                      </div>
                      <div>
                        <span style={{ fontSize: 10, color: "#6B7280" }}>
                          Width
                        </span>
                        <input
                          type="text"
                          value={shipWidth}
                          onChange={(e) => setShipWidth(e.target.value)}
                          placeholder="40"
                          style={{
                            width: "100%",
                            padding: "8px 10px",
                            borderRadius: 4,
                            border: "1px solid #D1D5DB",
                            fontSize: 12,
                          }}
                        />
                      </div>
                      <div>
                        <span style={{ fontSize: 10, color: "#6B7280" }}>
                          Height
                        </span>
                        <input
                          type="text"
                          value={shipHeight}
                          onChange={(e) => setShipHeight(e.target.value)}
                          placeholder="20"
                          style={{
                            width: "100%",
                            padding: "8px 10px",
                            borderRadius: 4,
                            border: "1px solid #D1D5DB",
                            fontSize: 12,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Shipping Options */}
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#374151",
                        marginBottom: 6,
                      }}
                    >
                      Shipping Options
                    </label>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          fontSize: 12,
                          cursor: "pointer",
                          marginTop: 4,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={freeShipping}
                          onChange={(e) => setFreeShipping(e.target.checked)}
                          style={{ accentColor: "#111111", cursor: "pointer" }}
                        />
                        <span style={{ fontWeight: 500, color: "#374151" }}>
                          Free Shipping for this product
                        </span>
                      </label>
                      <div className={styles.shippingRule}>
                        {freeShipping ? (
                          <p>
                            This product ships free. Other products in the cart
                            follow the store shipping rule.
                          </p>
                        ) : shippingRules ? (
                          <p>
                            Standard shipping: ₹
                            {shippingRules.standardShippingFee.toLocaleString(
                              "en-IN",
                            )}
                            . Free shipping on carts of ₹
                            {shippingRules.freeShippingThreshold.toLocaleString(
                              "en-IN",
                            )}{" "}
                            or more.
                          </p>
                        ) : (
                          <p>Shipping follows your store settings.</p>
                        )}
                        <Link href="/admin/settings?section=shipping">
                          Customize shipping charge and free-shipping threshold
                          →
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* SECTION 7: SEO & GEO (SEARCH ENGINE & AI OPTIMIZATION) */}
          {/* ======================================================== */}
          <div
            data-editor-section="7"
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E5E7EB",
              borderRadius: 8,
              boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
              overflow: "hidden",
            }}
          >
            <div
              onClick={() => toggleSection(7)}
              style={{
                padding: "16px 20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
                backgroundColor: "#FFFFFF",
                borderBottom: openSections[7] ? "1px solid #F3F4F6" : "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    backgroundColor: "#6B5A4B",
                    color: "#FFFFFF",
                    fontSize: 12,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  7
                </span>
                <span
                  style={{ fontSize: 15, fontWeight: 700, color: "#111111" }}
                >
                  SEO & GEO (Search Engine & AI Optimization)
                </span>
              </div>
              <button
                type="button"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#6B7280",
                }}
              >
                {openSections[7] ? (
                  <ChevronUp size={18} />
                ) : (
                  <ChevronDown size={18} />
                )}
              </button>
            </div>

            {openSections[7] && (
              <div style={{ padding: "20px 24px" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.1fr 1fr 1fr",
                    gap: 20,
                  }}
                >
                  {/* Column 1: SEO Settings */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#111111",
                      }}
                    >
                      SEO Settings
                    </div>

                    <div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: 11,
                          marginBottom: 4,
                        }}
                      >
                        <span style={{ fontWeight: 600, color: "#374151" }}>
                          SEO Title *
                        </span>
                        <span style={{ color: "#6B7280" }}>
                          {seoTitle.length}/60
                        </span>
                      </div>
                      <input
                        type="text"
                        value={seoTitle}
                        onChange={(e) => setSeoTitle(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "7px 10px",
                          fontSize: 12,
                          borderRadius: 4,
                          border: "1px solid #D1D5DB",
                        }}
                      />
                    </div>

                    <div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: 11,
                          marginBottom: 4,
                        }}
                      >
                        <span style={{ fontWeight: 600, color: "#374151" }}>
                          Meta Description *
                        </span>
                        <span style={{ color: "#6B7280" }}>
                          {metaDesc.length}/160
                        </span>
                      </div>
                      <textarea
                        rows={3}
                        value={metaDesc}
                        onChange={(e) => setMetaDesc(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "7px 10px",
                          fontSize: 12,
                          borderRadius: 4,
                          border: "1px solid #D1D5DB",
                          resize: "none",
                        }}
                      />
                    </div>

                    <div>
                      <span
                        style={{
                          display: "block",
                          fontSize: 11,
                          fontWeight: 600,
                          color: "#374151",
                          marginBottom: 4,
                        }}
                      >
                        URL Slug *
                      </span>
                      {isEditingSlug ? (
                        <input
                          type="text"
                          value={urlSlug}
                          onChange={(e) => {
                            setUrlSlug(e.target.value);
                            setCanonicalUrl(
                              `https://www.ovias.shop/products/${e.target.value}`,
                            );
                          }}
                          onBlur={() => setIsEditingSlug(false)}
                          autoFocus
                          style={{
                            width: "100%",
                            padding: "6px 10px",
                            fontSize: 12,
                            borderRadius: 4,
                            border: "1px solid #111111",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            fontSize: 11,
                            color: "#6B7280",
                          }}
                        >
                          <span style={{ wordBreak: "break-all" }}>
                            https://www.ovias.shop/products/{urlSlug}
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsEditingSlug(true)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#111111",
                              cursor: "pointer",
                              fontWeight: 600,
                              fontSize: 11,
                            }}
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </div>

                    <div>
                      <span
                        style={{
                          display: "block",
                          fontSize: 11,
                          fontWeight: 600,
                          color: "#374151",
                          marginBottom: 4,
                        }}
                      >
                        Primary Search Phrase
                      </span>
                      <input
                        type="text"
                        value={primaryPhrase}
                        onChange={(e) => setPrimaryPhrase(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "7px 10px",
                          fontSize: 12,
                          borderRadius: 4,
                          border: "1px solid #D1D5DB",
                        }}
                      />
                    </div>

                    <div>
                      <span
                        style={{
                          display: "block",
                          fontSize: 11,
                          fontWeight: 600,
                          color: "#374151",
                          marginBottom: 4,
                        }}
                      >
                        Secondary Keywords (comma separated)
                      </span>
                      <input
                        type="text"
                        value={secondaryKeywords}
                        onChange={(e) => setSecondaryKeywords(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "7px 10px",
                          fontSize: 12,
                          borderRadius: 4,
                          border: "1px solid #D1D5DB",
                        }}
                      />
                    </div>

                    <div>
                      <span
                        style={{
                          display: "block",
                          fontSize: 11,
                          fontWeight: 600,
                          color: "#374151",
                          marginBottom: 4,
                        }}
                      >
                        Canonical URL
                      </span>
                      <input
                        type="text"
                        value={canonicalUrl}
                        onChange={(e) => setCanonicalUrl(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "7px 10px",
                          fontSize: 12,
                          borderRadius: 4,
                          border: "1px solid #D1D5DB",
                        }}
                      />
                    </div>

                    {/* Search Engine Indexing toggles */}
                    <div
                      style={{
                        paddingTop: 6,
                        borderTop: "1px solid #F3F4F6",
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: "#374151",
                        }}
                      >
                        Search Engine Indexing
                      </span>
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          fontSize: 12,
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={indexProduct}
                          onChange={(e) => setIndexProduct(e.target.checked)}
                          style={{ accentColor: "#111111", cursor: "pointer" }}
                        />
                        <span>Index this product</span>
                      </label>
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          fontSize: 12,
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={showInSitemap}
                          onChange={(e) => setShowInSitemap(e.target.checked)}
                          style={{ accentColor: "#111111", cursor: "pointer" }}
                        />
                        <span>Show in Sitemap</span>
                      </label>
                    </div>
                  </div>

                  {/* Column 2: Open Graph / Social Media & Google Search Preview */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#111111",
                      }}
                    >
                      Open Graph / Social Media
                    </div>

                    <div>
                      <span
                        style={{
                          display: "block",
                          fontSize: 11,
                          fontWeight: 600,
                          color: "#374151",
                          marginBottom: 4,
                        }}
                      >
                        OG Title
                      </span>
                      <input
                        type="text"
                        value={ogTitle}
                        onChange={(e) => setOgTitle(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "7px 10px",
                          fontSize: 12,
                          borderRadius: 4,
                          border: "1px solid #D1D5DB",
                        }}
                      />
                    </div>

                    <div>
                      <span
                        style={{
                          display: "block",
                          fontSize: 11,
                          fontWeight: 600,
                          color: "#374151",
                          marginBottom: 4,
                        }}
                      >
                        OG Description
                      </span>
                      <textarea
                        rows={2}
                        value={ogDescription}
                        onChange={(e) => setOgDescription(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "7px 10px",
                          fontSize: 12,
                          borderRadius: 4,
                          border: "1px solid #D1D5DB",
                          resize: "none",
                        }}
                      />
                    </div>

                    {/* OG Image */}
                    <div>
                      <span
                        style={{
                          display: "block",
                          fontSize: 11,
                          fontWeight: 600,
                          color: "#374151",
                          marginBottom: 4,
                        }}
                      >
                        OG Image
                      </span>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            width: 60,
                            height: 60,
                            borderRadius: 4,
                            border: "1px solid #E5E7EB",
                            backgroundColor: "#F9FAFB",
                            overflow: "hidden",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {ogImage ? (
                            <img
                              src={ogImage}
                              alt="Social sharing image"
                              style={{
                                maxWidth: 60,
                                height: 60,
                                objectFit: "contain",
                              }}
                            />
                          ) : (
                            <span style={{ color: "#999", fontSize: 10 }}>
                              No social image
                            </span>
                          )}
                        </div>
                        <div>
                          <button
                            type="button"
                            onClick={() => ogFileInputRef.current?.click()}
                            style={{
                              padding: "4px 10px",
                              backgroundColor: "#FFFFFF",
                              border: "1px solid #D1D5DB",
                              borderRadius: 4,
                              fontSize: 11,
                              fontWeight: 500,
                              cursor: "pointer",
                            }}
                          >
                            Change Image
                          </button>
                          <div
                            style={{
                              fontSize: 9,
                              color: "#9CA3AF",
                              marginTop: 4,
                            }}
                          >
                            Recommended: 1200 x 630 px (JPG, PNG)
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Social Preview Card */}
                    <div>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: "#374151",
                          marginBottom: 4,
                        }}
                      >
                        Social Preview{" "}
                        <span style={{ color: "#9CA3AF" }}>ⓘ</span>
                      </div>
                      <div
                        style={{
                          border: "1px solid #E5E7EB",
                          borderRadius: 6,
                          overflow: "hidden",
                          backgroundColor: "#FAFAFA",
                          fontSize: 11,
                        }}
                      >
                        <div
                          style={{
                            padding: "8px 10px",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            borderBottom: "1px solid #E5E7EB",
                          }}
                        >
                          <span
                            style={{
                              fontWeight: 700,
                              fontSize: 10,
                              color: "#111111",
                            }}
                          >
                            OVIA
                          </span>
                          <span style={{ color: "#9CA3AF", fontSize: 9 }}>
                            https://www.ovias.shop &gt; products &gt; {urlSlug}
                          </span>
                        </div>
                        <div
                          style={{
                            padding: "8px 10px",
                            display: "flex",
                            gap: 10,
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                fontWeight: 600,
                                color: "#111111",
                                fontSize: 11,
                                lineHeight: 1.25,
                              }}
                            >
                              {ogTitle}
                            </div>
                            <div
                              style={{
                                color: "#6B7280",
                                fontSize: 10,
                                marginTop: 4,
                                lineHeight: 1.3,
                              }}
                            >
                              {ogDescription.slice(0, 90)}...
                            </div>
                          </div>
                          {ogImage ? (
                            <img
                              src={ogImage}
                              alt="Social sharing image"
                              style={{
                                maxWidth: 60,
                                height: 60,
                                objectFit: "contain",
                              }}
                            />
                          ) : (
                            <span style={{ color: "#999", fontSize: 10 }}>
                              No social image
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Google Search Preview */}
                    <div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 4,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: "#374151",
                          }}
                        >
                          Google Search Preview
                        </span>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button
                            type="button"
                            onClick={() => setSearchPreviewMode("mobile")}
                            style={{
                              padding: "2px 6px",
                              fontSize: 9,
                              borderRadius: 3,
                              border: "1px solid #D1D5DB",
                              backgroundColor:
                                searchPreviewMode === "mobile"
                                  ? "#111111"
                                  : "#FFFFFF",
                              color:
                                searchPreviewMode === "mobile"
                                  ? "#FFFFFF"
                                  : "#374151",
                              cursor: "pointer",
                            }}
                          >
                            Mobile
                          </button>
                          <button
                            type="button"
                            onClick={() => setSearchPreviewMode("desktop")}
                            style={{
                              padding: "2px 6px",
                              fontSize: 9,
                              borderRadius: 3,
                              border: "1px solid #D1D5DB",
                              backgroundColor:
                                searchPreviewMode === "desktop"
                                  ? "#111111"
                                  : "#FFFFFF",
                              color:
                                searchPreviewMode === "desktop"
                                  ? "#FFFFFF"
                                  : "#374151",
                              cursor: "pointer",
                            }}
                          >
                            Desktop
                          </button>
                        </div>
                      </div>
                      <div
                        style={{
                          padding: 10,
                          backgroundColor: "#FFFFFF",
                          border: "1px solid #E5E7EB",
                          borderRadius: 6,
                          fontSize: 11,
                        }}
                      >
                        <div style={{ fontSize: 9, color: "#4B5563" }}>
                          https://www.ovias.shop &gt; products &gt; {urlSlug}
                        </div>
                        <div
                          style={{
                            color: "#1A0DAB",
                            fontSize: 13,
                            fontWeight: 600,
                            marginTop: 2,
                            cursor: "pointer",
                          }}
                        >
                          {seoTitle}
                        </div>
                        <div
                          style={{
                            color: "#4D5156",
                            fontSize: 11,
                            marginTop: 2,
                            lineHeight: 1.35,
                          }}
                        >
                          {metaDesc.slice(0, 110)}...
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Column 3: GEO (AI Search Optimization) */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#111111",
                        }}
                      >
                        GEO (AI Search Optimization)
                      </span>
                      <span
                        style={{
                          backgroundColor: "#DCFCE7",
                          color: "#15803D",
                          fontSize: 10,
                          fontWeight: 600,
                          padding: "2px 6px",
                          borderRadius: 12,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 3,
                        }}
                      >
                        ✓ AI Friendly
                      </span>
                    </div>

                    <div>
                      <span
                        style={{
                          display: "block",
                          fontSize: 11,
                          fontWeight: 600,
                          color: "#374151",
                          marginBottom: 4,
                        }}
                      >
                        Short AI Summary
                      </span>
                      <textarea
                        rows={3}
                        value={aiSummary}
                        onChange={(e) => setAiSummary(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "7px 10px",
                          fontSize: 11,
                          borderRadius: 4,
                          border: "1px solid #D1D5DB",
                          resize: "none",
                        }}
                      />
                    </div>

                    <div>
                      <span
                        style={{
                          display: "block",
                          fontSize: 11,
                          fontWeight: 600,
                          color: "#374151",
                          marginBottom: 4,
                        }}
                      >
                        Key Product Facts (for AI)
                      </span>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 4,
                        }}
                      >
                        {aiFacts.map((fact, i) => (
                          <div
                            key={i}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              fontSize: 11,
                              color: "#4B5563",
                            }}
                          >
                            <span style={{ color: "#9CA3AF" }}>○</span>
                            <span>{fact}</span>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={handleAddFact}
                          style={{
                            alignSelf: "flex-start",
                            marginTop: 4,
                            background: "none",
                            border: "none",
                            color: "#111111",
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          + Add Fact
                        </button>
                      </div>
                    </div>

                    <div>
                      <span
                        style={{
                          display: "block",
                          fontSize: 11,
                          fontWeight: 600,
                          color: "#374151",
                          marginBottom: 4,
                        }}
                      >
                        Target Audience / Use Cases
                      </span>
                      <input
                        type="text"
                        value={targetAudience}
                        onChange={(e) => setTargetAudience(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "7px 10px",
                          fontSize: 11,
                          borderRadius: 4,
                          border: "1px solid #D1D5DB",
                        }}
                      />
                    </div>

                    {/* FAQs for AI (Q&A Schema) */}
                    <div>
                      <span
                        style={{
                          display: "block",
                          fontSize: 11,
                          fontWeight: 600,
                          color: "#374151",
                          marginBottom: 4,
                        }}
                      >
                        FAQs for AI (Q&A Schema)
                      </span>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 6,
                        }}
                      >
                        {aiFaqs.map((faq, i) => (
                          <div
                            key={i}
                            style={{
                              backgroundColor: "#F9FAFB",
                              padding: "6px 8px",
                              borderRadius: 4,
                              border: "1px solid #E5E7EB",
                              fontSize: 10,
                            }}
                          >
                            <div style={{ fontWeight: 600, color: "#111111" }}>
                              Q: {faq.q}
                            </div>
                            <div style={{ color: "#4B5563", marginTop: 2 }}>
                              A: {faq.a}
                            </div>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={handleAddFaq}
                          style={{
                            alignSelf: "flex-start",
                            marginTop: 2,
                            background: "none",
                            border: "none",
                            color: "#111111",
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          + Add FAQ
                        </button>
                      </div>
                    </div>

                    {/* Structured Data (Schema) Badges */}
                    <div
                      style={{
                        marginTop: 6,
                        paddingTop: 8,
                        borderTop: "1px solid #F3F4F6",
                      }}
                    >
                      <span
                        style={{
                          display: "block",
                          fontSize: 11,
                          fontWeight: 600,
                          color: "#374151",
                          marginBottom: 6,
                        }}
                      >
                        Structured Data (Schema)
                      </span>
                      <div
                        style={{ display: "flex", flexWrap: "wrap", gap: 6 }}
                      >
                        {[
                          "Product Schema",
                          "FAQ Schema",
                          "Breadcrumbs",
                          "Review Schema",
                        ].map((schema) => (
                          <span
                            key={schema}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              fontSize: 10,
                              color: "#059669",
                              backgroundColor: "#ECFDF5",
                              padding: "2px 6px",
                              borderRadius: 4,
                            }}
                          >
                            <CheckCircle2 size={10} color="#059669" /> {schema}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Sticky "Product Preview" Card (Matches Screenshot 2) */}
        <div
          style={{
            position: "sticky",
            top: 20,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E5E7EB",
              borderRadius: 8,
              padding: "16px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#111111",
                marginBottom: 12,
              }}
            >
              Product Preview
            </div>

            {/* High-Resolution Crystal Clear Product Image Container */}
            <div
              style={{
                width: "100%",
                height: 250,
                backgroundColor: "#F9FAFB",
                borderRadius: 6,
                border: "1px solid #E5E7EB",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                position: "relative",
                padding: 14,
              }}
            >
              {mainImage ? (
                <img
                  src={mainImage}
                  alt={imageAltMap[mainImage] || name}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                  }}
                />
              ) : (
                <span style={{ color: "#999" }}>Upload a product image</span>
              )}
            </div>

            {/* Product Meta Details */}
            <div style={{ marginTop: 14 }}>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#111111",
                  lineHeight: 1.3,
                  marginBottom: 4,
                }}
              >
                {name || "Untitled Product"}
              </div>

              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#111111",
                  marginBottom: 6,
                }}
              >
                ₹{Number(price).toLocaleString("en-IN")}
              </div>

              {/* View on Store Link Button */}
              <Link
                href={isEditing && urlSlug ? `/products/${urlSlug}` : "#"}
                aria-disabled={!isEditing || !urlSlug}
                onClick={(e) => {
                  if (!isEditing || !urlSlug) e.preventDefault();
                }}
                target="_blank"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  width: "100%",
                  padding: "9px 0",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #D1D5DB",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#374151",
                  textDecoration: "none",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#F9FAFB")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "#FFFFFF")
                }
              >
                View on Store <ExternalLink size={13} />
              </Link>
            </div>
          </div>
        </div>
      </div>
      <footer className={styles.stepFooter}>
        <Link href="/admin/products">Back to Products</Link>
        <div>
          <button
            type="button"
            disabled={step === 0}
            onClick={() => {
              setStep(step - 1);
              setOpenSections((prev) => ({ ...prev, [step - 1]: true }));
            }}
          >
            ← Back
          </button>
          <button
            type="button"
            disabled={step === 7}
            onClick={() => {
              setStep(step + 1);
              setOpenSections((prev) => ({ ...prev, [step + 1]: true }));
            }}
          >
            Next →
          </button>
        </div>
      </footer>
    </div>
  );
}
