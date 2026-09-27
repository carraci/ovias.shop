import type { Product, Variant } from "./catalog";

export const mediaRoles = [
  "editorial",
  "details",
  "dimensions",
  "materials",
  "craftsmanship",
] as const;
export type MediaRole = (typeof mediaRoles)[number];

function unique(values: (string | undefined)[]) {
  return [
    ...new Set(
      values.filter(
        (value): value is string =>
          typeof value === "string" && value.trim().length > 0,
      ),
    ),
  ];
}

// Classify only descriptive filenames, never gallery positions or CDN hashes.
// Explicit roles in images take precedence over legacy filename conventions.
function legacyRole(src: string): MediaRole | undefined {
  const filename = src.split(/[?#]/)[0].split("/").pop() || "";
  if (/(?:^|[-_.])(editorial|lifestyle|story)(?:[-_.]|$)/i.test(filename))
    return "editorial";
  if (/(?:^|[-_.])(dimensions?|measurements?)(?:[-_.]|$)/i.test(filename))
    return "dimensions";
  if (/(?:^|[-_.])(craftsmanship|artisan|craft)(?:[-_.]|$)/i.test(filename))
    return "craftsmanship";
  if (/(?:^|[-_.])(materials?|texture)(?:[-_.]|$)/i.test(filename))
    return "materials";
  if (/(?:^|[-_.])(details?|close-?up)(?:[-_.]|$)/i.test(filename))
    return "details";
}

export function productMedia(product: Product, variant?: Variant) {
  const roles = Object.fromEntries(
    mediaRoles.map((role) => [role, unique(product.images?.[role] || [])]),
  ) as Record<MediaRole, string[]>;
  const assigned = new Set(Object.values(roles).flat());
  const swatches = new Set(product.images?.swatches || []);
  const main = variant?.image || product.images?.main || product.image;
  const gallery = unique([
    main,
    ...(product.images?.gallery || []),
    ...(product.gallery || []),
  ]).filter((src) => src === main || !swatches.has(src));
  for (const src of gallery) {
    if (src === main || assigned.has(src)) continue;
    const role = legacyRole(src);
    if (role) roles[role].push(src);
  }
  const all = unique([...gallery, ...Object.values(roles).flat()]);
  return {
    main,
    gallery: all.map((src) => {
      // Only use explicit thumbnails when paired with the canonical gallery.
      const index = product.images?.gallery?.indexOf(src) ?? -1;
      return {
        src,
        thumbnail:
          index >= 0 ? product.images?.thumbnails?.[index] || src : src,
      };
    }),
    ...roles,
  };
}

export function productSpecifications(product: Product) {
  const values = Object.entries({
    Dimensions: product.dimensions,
    Capacity: product.capacity,
    Weight: product.weight,
    ...product.specifications,
  }).filter(
    ([, value]) =>
      typeof value === "string" &&
      value.trim() &&
      !/^(—|-|n\/a|see product notes)$/i.test(value.trim()),
  );
  const normalized = new Map<string, [string, string]>();
  for (const [label, value] of values) {
    const key = label.trim().toLowerCase();
    if (key === "material" && value === product.material) continue;
    normalized.set(key, [
      label.charAt(0).toUpperCase() + label.slice(1),
      value,
    ]);
  }
  return [...normalized.values()];
}
