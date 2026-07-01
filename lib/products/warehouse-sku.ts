/** Warehouse barcode SKU prefix per product category (XXXX-NNNNN). */
export const WAREHOUSE_SKU_PREFIX_BY_CATEGORY: Record<string, string> = {
  Υφάσματα: "0101",
  Πετσέτες: "0401",
  Κουβέρτες: "0402",
  Παπλώματα: "0403",
  Σεντόνια: "0404",
  Μαξιλαροθήκες: "0405",
  Μαξιλάρια: "0406",
  Προστατευτικά: "0407",
  Μπουρνούζια: "0408",
  Πατάκια: "0409",
  Παντόφλες: "0410",
  Παπλωματοθήκες: "0418",
  Τραπεζομάντηλα: "0419",
};

export const WAREHOUSE_SKU_SUFFIX_PAD = 5;

export function getWarehouseSkuPrefix(category: string): string | null {
  return WAREHOUSE_SKU_PREFIX_BY_CATEGORY[category.trim()] ?? null;
}

export function parseWarehouseSkuSuffix(
  sku: string,
  prefix: string,
): number | null {
  const trimmed = sku.trim();
  const match = trimmed.match(new RegExp(`^${prefix}-(\\d+)$`));
  if (!match) return null;
  const parsed = Number.parseInt(match[1]!, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatWarehouseSku(
  prefix: string,
  suffix: number,
  pad = WAREHOUSE_SKU_SUFFIX_PAD,
): string {
  return `${prefix}-${String(suffix).padStart(pad, "0")}`;
}

export function nextWarehouseSkuFromExisting(
  category: string,
  existingSkus: string[],
): { sku: string } | { error: string } {
  const prefix = getWarehouseSkuPrefix(category);
  if (!prefix) {
    return {
      error: `Δεν έχει οριστεί warehouse prefix για την κατηγορία «${category}».`,
    };
  }

  let maxSuffix = 0;
  for (const sku of existingSkus) {
    const suffix = parseWarehouseSkuSuffix(sku, prefix);
    if (suffix != null && suffix > maxSuffix) {
      maxSuffix = suffix;
    }
  }

  return { sku: formatWarehouseSku(prefix, maxSuffix + 1) };
}
