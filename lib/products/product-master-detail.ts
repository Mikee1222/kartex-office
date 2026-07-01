import {
  mapWebsiteProductMasterRow,
} from "@/lib/website/product-masters";
import type { WebsiteProductMasterRow } from "@/lib/website/types";

export const INVENTORY_PRODUCT_MASTER_DETAIL_SELECT = `
  id, clean_name, category, subcategory, quality_grade, material, description, image_url, is_active,
  product_master_images ( id, master_id, url, sort_order, alt_text, created_at ),
  products!products_master_id_fkey (
    id, width_cm, height_cm, gsm, thread_count, color, sku, stock, subcategory, internal_price_eur, is_active,
    min_stock, purchase_price, sale_price, supplier, reserved_stock,
    product_color_variants (
      id, color_id, stock, is_active, is_primary,
      product_colors ( id, name, hex_code, is_active )
    )
  )
`;

export type InventoryMasterVariantRow = WebsiteProductMasterRow["variants"][number] & {
  minStock: number;
  purchasePrice: number;
  salePrice: number;
  supplier: string | null;
  reservedStock: number;
};

export type InventoryProductMasterRow = Omit<
  WebsiteProductMasterRow,
  "variants"
> & {
  variants: InventoryMasterVariantRow[];
};

type RawInventoryVariant = {
  id: string;
  min_stock?: number | null;
  purchase_price?: number | string | null;
  sale_price?: number | string | null;
  supplier?: string | null;
  reserved_stock?: number | null;
};

function toNumber(value: number | string | null | undefined): number {
  if (value == null || value === "") return 0;
  const parsed = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function mapInventoryProductMasterRow(
  row: Parameters<typeof mapWebsiteProductMasterRow>[0] & {
    products?: (RawInventoryVariant &
      NonNullable<
        Parameters<typeof mapWebsiteProductMasterRow>[0]["products"]
      >[number])[];
  },
): InventoryProductMasterRow {
  const base = mapWebsiteProductMasterRow(row);

  const variantsById = new Map<string, RawInventoryVariant>(
    (row.products ?? []).map((variant) => [variant.id, variant as RawInventoryVariant]),
  );

  return {
    ...base,
    variants: base.variants.map((variant) => {
      const raw = variantsById.get(variant.id);
      return {
        ...variant,
        minStock: raw?.min_stock ?? 0,
        purchasePrice: toNumber(raw?.purchase_price),
        salePrice: toNumber(raw?.sale_price),
        supplier: raw?.supplier?.trim() || null,
        reservedStock: raw?.reserved_stock ?? 0,
      };
    }),
  };
}

export function countInventoryMasterStockStats(variants: InventoryMasterVariantRow[]) {
  let criticalCount = 0;
  let lowCount = 0;
  let okCount = 0;

  for (const variant of variants) {
    const stock = variant.stock;
    const minStock = variant.minStock;
    if (stock <= 0 || (minStock > 0 && stock <= minStock * 0.5)) {
      criticalCount += 1;
    } else if (minStock > 0 && stock <= minStock) {
      lowCount += 1;
    } else {
      okCount += 1;
    }
  }

  return { criticalCount, lowCount, okCount };
}

export type MasterColorSummary = {
  id: string;
  name: string;
  hexCode: string;
  totalStock: number;
};

export type MasterInventoryStats = {
  totalStock: number;
  variantCount: number;
  minInternalPrice: number | null;
  maxInternalPrice: number | null;
  avgInternalPrice: number | null;
  avgPurchasePrice: number;
  avgSalePrice: number;
  avgMarginPct: number;
  avgProfitPerUnit: number;
  totalInventoryValue: number;
  totalSaleValue: number;
};

function weightedAverage(
  items: { value: number; weight: number }[],
): number {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight <= 0) return 0;
  const weightedSum = items.reduce((sum, item) => sum + item.value * item.weight, 0);
  return weightedSum / totalWeight;
}

export function computeMasterInventoryStats(
  variants: InventoryMasterVariantRow[],
): MasterInventoryStats {
  const totalStock = variants.reduce((sum, variant) => sum + variant.stock, 0);
  const variantCount = variants.length;

  const internalPrices = variants
    .map((variant) => variant.internalPriceEur)
    .filter((price): price is number => price != null && price > 0);

  const minInternalPrice =
    internalPrices.length > 0 ? Math.min(...internalPrices) : null;
  const maxInternalPrice =
    internalPrices.length > 0 ? Math.max(...internalPrices) : null;
  const avgInternalPrice =
    internalPrices.length > 0
      ? internalPrices.reduce((sum, price) => sum + price, 0) / internalPrices.length
      : null;

  const purchaseItems = variants
    .filter((variant) => variant.purchasePrice > 0)
    .map((variant) => ({ value: variant.purchasePrice, weight: variant.stock || 1 }));
  const saleItems = variants
    .filter((variant) => variant.salePrice > 0)
    .map((variant) => ({ value: variant.salePrice, weight: variant.stock || 1 }));

  const avgPurchasePrice = weightedAverage(purchaseItems);
  const avgSalePrice = weightedAverage(saleItems);
  const avgProfitPerUnit = avgSalePrice - avgPurchasePrice;
  const avgMarginPct =
    avgSalePrice > 0 ? (avgProfitPerUnit / avgSalePrice) * 100 : 0;

  const totalInventoryValue = variants.reduce(
    (sum, variant) => sum + variant.stock * variant.purchasePrice,
    0,
  );
  const totalSaleValue = variants.reduce(
    (sum, variant) => sum + variant.stock * variant.salePrice,
    0,
  );

  return {
    totalStock,
    variantCount,
    minInternalPrice,
    maxInternalPrice,
    avgInternalPrice,
    avgPurchasePrice,
    avgSalePrice,
    avgMarginPct,
    avgProfitPerUnit,
    totalInventoryValue,
    totalSaleValue,
  };
}

export function formatInternalPriceRange(
  min: number | null,
  max: number | null,
  formatCurrency: (value: number) => string,
): string {
  if (min == null || max == null) return "—";
  if (min === max) return formatCurrency(min);
  return `${formatCurrency(min)} – ${formatCurrency(max)}`;
}
