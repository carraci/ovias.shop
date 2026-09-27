import type { Product } from "./catalog";
import { productSpecifications } from "./product-media";

const materialKey =
  /^(material|materials|exterior|interior|lining|hardware|strap|shell|fabric|composition)$/i;

export function presentationSpecifications(product: Product) {
  const specifications = productSpecifications(product);
  const measurements = specifications.filter(
    ([label]) => !materialKey.test(label),
  );
  const composition = specifications.filter(([label]) =>
    materialKey.test(label),
  );
  if (!composition.length) {
    for (const material of [
      ...new Set(
        [product.material, ...(product.materials || [])].filter(Boolean),
      ),
    ]) {
      composition.push(["Material", material]);
    }
  }
  return { measurements, composition };
}

export function displayMeasurement(value: string, unit: "cm" | "in") {
  // Convert only unambiguous metric dimensions. Weight and capacity stay untouched.
  if (
    unit === "cm" ||
    !/^\s*\d+(?:\.\d+)?(?:\s*[×xX]\s*\d+(?:\.\d+)?)*\s*cm\s*$/i.test(value)
  )
    return value;
  return value
    .replace(/\d+(?:\.\d+)?/g, (number) =>
      String(Math.round((Number(number) / 2.54) * 10) / 10),
    )
    .replace(/cm/i, "in");
}

export function detailCaption(src: string, product: Product, index: number) {
  const file = src.split(/[?#]/)[0].split("/").pop() || "";
  const label = file.match(
    /(?:^|[-_.])(interior|strap|closure|hardware|craftsmanship|stitching|lining|handle|wheels?|lock)(?:[-_.]|$)/i,
  )?.[1];
  if (!label)
    return {
      title: `Detail ${String(index + 1).padStart(2, "0")}`,
      description: "",
    };
  return {
    title: label.charAt(0).toUpperCase() + label.slice(1),
    description:
      Object.entries(product.specifications || {}).find(
        ([key]) => key.toLowerCase() === label.toLowerCase(),
      )?.[1] || "",
  };
}
