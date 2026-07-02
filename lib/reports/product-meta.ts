import type { Product } from "@/components/products/types";
import { normalizeProductCategory } from "@/types/database";

import { normalizeJoin, toNumber } from "@/lib/reports/compute-reports";

export type ReportProductJoin = {
  id?: string;
  name: string;
  sku?: string | null;
  clean_name?: string | null;
  category?: string | null;
  master_id?: string | null;
  purchase_price?: number | string;
  sale_price?: number | string;
  internal_price_eur?: number | string | null;
  product_masters?:
    | { clean_name: string; category: string }
    | { clean_name: string; category: string }[]
    | null;
};

export type ReportProductMeta = {
  displayName: string;
  category: string;
  purchasePrice: number;
  salePrice: number;
  internalPrice: number;
  masterKey: string;
};

function toProductLike(join: ReportProductJoin): Pick<
  Product,
  "name" | "cleanName" | "masterId" | "masterCleanName" | "masterCategory" | "category"
> {
  const master = normalizeJoin(join.product_masters);
  return {
    name: join.name,
    cleanName: join.clean_name?.trim() || undefined,
    masterId: join.master_id ?? undefined,
    masterCleanName: master?.clean_name?.trim() || undefined,
    masterCategory: master?.category?.trim() || undefined,
    category: normalizeProductCategory(join.category),
  };
}

function resolveMasterGroupMeta(product: Pick<
  Product,
  "name" | "cleanName" | "masterId" | "masterCleanName" | "masterCategory" | "category"
>): {
  cleanName: string;
  category: string;
} {
  if (
    product.masterId != null &&
    product.masterCleanName != null &&
    product.masterCleanName.trim().length > 0
  ) {
    return {
      cleanName: product.masterCleanName.trim(),
      category: normalizeProductCategory(product.masterCategory),
    };
  }
  return {
    cleanName: product.cleanName?.trim() || product.name,
    category: normalizeProductCategory(product.category),
  };
}

export function resolveReportProductMeta(
  join: ReportProductJoin | null | undefined,
  fallbackName = "—",
): ReportProductMeta {
  if (!join) {
    return {
      displayName: fallbackName,
      category: normalizeProductCategory(null),
      purchasePrice: 0,
      salePrice: 0,
      internalPrice: 0,
      masterKey: "unknown",
    };
  }

  const { cleanName, category } = resolveMasterGroupMeta(toProductLike(join));
  const purchasePrice = toNumber(join.purchase_price);
  const salePrice = toNumber(join.sale_price);
  const internalPrice = toNumber(join.internal_price_eur);
  const masterId = join.master_id;

  return {
    displayName: cleanName,
    category,
    purchasePrice: purchasePrice > 0 ? purchasePrice : internalPrice,
    salePrice: salePrice > 0 ? salePrice : internalPrice,
    internalPrice,
    masterKey:
      masterId != null ? `master:${masterId}` : `${cleanName}__${category}`,
  };
}

export function resolveReportProductCategory(
  join: ReportProductJoin | null | undefined,
): string {
  return resolveReportProductMeta(join).category;
}
