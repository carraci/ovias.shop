export function lowStockThreshold(value: unknown): number {
  const threshold = Number(value ?? 5);
  return Number.isInteger(threshold) && threshold >= 0 ? threshold : 5;
}

export function inventoryStatus(
  quantity: number,
  threshold: unknown,
): "Out of Stock" | "Low Stock" | "In Stock" {
  return quantity <= 0
    ? "Out of Stock"
    : quantity <= lowStockThreshold(threshold)
      ? "Low Stock"
      : "In Stock";
}
