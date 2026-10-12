import { slugify } from "@/lib/catalog";

export type TaxonomyCategory = {
  id: string;
  name: string;
  slug: string;
  parent: string | null;
};
export type SavedCategory = {
  id?: string;
  name?: string;
  slug?: string;
  parent?: string | null;
  status?: string;
};
export type CategorizedProduct = {
  department?: string;
  category?: string;
  subcategory?: string;
  catalogCategories?: string[];
};

// Saved categories include empty categories; imported product labels fill gaps.
export function buildProductTaxonomy(
  saved: SavedCategory[],
  products: CategorizedProduct[],
): TaxonomyCategory[] {
  const normalize = (value: string) => value.trim().toLowerCase();
  const active = (category: SavedCategory) =>
    !["inactive", "draft", "archived"].includes(
      normalize(category.status || "active"),
    );
  const findSaved = (reference: string) =>
    saved.find((c) =>
      [c.id, c.slug, c.name].some(
        (value) => value && normalize(value) === normalize(reference),
      ),
    );
  const entries = new Map<string, TaxonomyCategory>();
  const key = (name: string, parent: string | null) =>
    `${normalize(parent || "")}:${slugify(name)}`;
  const add = (name: string, parent: string | null, id?: string) => {
    name = name.trim();
    if (!name) return;
    const known = saved.find(
      (c) =>
        c.name &&
        normalize(c.name) === normalize(name) &&
        normalize(c.parent ? findSaved(c.parent)?.name || c.parent : "") ===
          normalize(parent || ""),
    );
    if (known && !active(known)) return;
    if (
      parent &&
      saved.some(
        (c) =>
          !c.parent &&
          c.name &&
          normalize(c.name) === normalize(parent) &&
          !active(c),
      )
    )
      return;
    const entryKey = key(name, parent);
    if (!entries.has(entryKey))
      entries.set(entryKey, {
        id: id || entryKey,
        name,
        slug: slugify(name),
        parent,
      });
  };
  for (const category of saved) {
    if (!category.name || !active(category)) continue;
    const parent = category.parent
      ? findSaved(category.parent)?.name || category.parent
      : null;
    add(category.name, parent, category.id);
  }
  for (const product of products) {
    const matched = product.category ? findSaved(product.category) : undefined;
    const department = product.department?.trim();
    const parent = matched?.parent
      ? findSaved(matched.parent)?.name || matched.parent
      : matched?.name ||
        (department
          ? findSaved(department)?.name ||
            department[0].toUpperCase() + department.slice(1)
          : product.category);
    if (!parent) continue;
    add(parent, null);
    const labels = [
      ...(product.catalogCategories || []),
      product.subcategory,
      product.category,
    ];
    for (const label of labels) {
      if (!label || slugify(label) === slugify(parent)) continue;
      add(label, parent);
    }
  }
  return [...entries.values()].sort(
    (a, b) =>
      (a.parent || "").localeCompare(b.parent || "") ||
      a.name.localeCompare(b.name),
  );
}
