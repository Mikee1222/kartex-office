import type { Product } from "@/components/products/types";
import { getStockStatus } from "@/components/products/types";

export type ProductVariant = {
  id: string;
  name: string;
  cleanName?: string;
  sku: string;
  barcode?: string;
  widthCm?: number | null;
  heightCm?: number | null;
  gsm?: number | null;
  threadCount?: number | null;
  stock: number;
  reservedStock: number;
  availableStock: number;
  minStock: number;
  purchasePrice: number;
  salePrice: number;
  isActive?: boolean;
  unit?: string;
};

export type MasterGroup = {
  masterId: string | null;
  cleanName: string;
  category: string;
  subcategory?: string;
  qualityGrade?: string;
  material?: string;
  imageUrl?: string | null;
  variants: ProductVariant[];
  totalStock: number;
  minStock: number;
  hasLowStock: boolean;
  hasCriticalStock: boolean;
};

export function getMasterGroupKey(cleanName: string, category: string): string {
  return `${cleanName}__${category}`;
}

export function resolveMasterGroupKey(group: MasterGroup): string {
  if (group.masterId != null) {
    return `master:${group.masterId}`;
  }
  return getMasterGroupKey(group.cleanName, group.category);
}

function resolveProductGroupDisplay(product: Product): {
  cleanName: string;
  category: string;
} {
  if (product.masterId != null) {
    const cleanName =
      product.masterCleanName?.trim() ||
      product.cleanName?.trim() ||
      product.name;
    const category =
      product.masterCategory?.trim() || product.category;
    return { cleanName, category };
  }

  return {
    cleanName: product.cleanName || product.name,
    category: product.category,
  };
}

export function productToVariant(product: Product): ProductVariant {
  return {
    id: product.id,
    name: product.name,
    cleanName: product.cleanName,
    sku: product.sku,
    barcode: product.barcode,
    widthCm: product.widthCm,
    heightCm: product.heightCm,
    gsm: product.gsm,
    threadCount: product.threadCount,
    stock: product.stock,
    reservedStock: product.reservedStock,
    availableStock: product.availableStock,
    minStock: product.minStock,
    purchasePrice: product.purchasePrice,
    salePrice: product.salePrice,
    isActive: product.isActive,
    unit: product.unit,
  };
}

export function buildMasterGroups(products: Product[]): MasterGroup[] {
  const map = new Map<string, MasterGroup>();

  for (const product of products) {
    const { cleanName, category } = resolveProductGroupDisplay(product);
    const key =
      product.masterId != null
        ? `master:${product.masterId}`
        : getMasterGroupKey(cleanName, category);

    if (!map.has(key)) {
      map.set(key, {
        masterId: product.masterId ?? null,
        cleanName,
        category,
        subcategory: product.subcategory,
        qualityGrade: product.qualityGrade,
        material: product.material,
        imageUrl: product.imageUrl,
        variants: [],
        totalStock: 0,
        minStock: product.minStock,
        hasLowStock: false,
        hasCriticalStock: false,
      });
    }

    const group = map.get(key)!;
    const variant = productToVariant(product);
    group.variants.push(variant);
    group.totalStock += product.stock;

    const status = getStockStatus(product.stock, product.minStock);
    if (status === "critical") {
      group.hasCriticalStock = true;
    } else if (status === "low") {
      group.hasLowStock = true;
    }
  }

  return Array.from(map.values()).sort((a, b) =>
    a.cleanName.localeCompare(b.cleanName, "el"),
  );
}

export function sortMasterGroupsCriticalFirst(groups: MasterGroup[]): MasterGroup[] {
  return [...groups].sort((a, b) => {
    const priority = (group: MasterGroup) => {
      if (group.hasCriticalStock) return 0;
      if (group.hasLowStock) return 1;
      return 2;
    };
    const diff = priority(a) - priority(b);
    if (diff !== 0) return diff;
    return a.cleanName.localeCompare(b.cleanName, "el");
  });
}

export function stockBarColorClass(stock: number, minStock: number): string {
  const status = getStockStatus(stock, minStock);
  if (status === "critical") return "bg-red-500";
  if (status === "low") return "bg-amber-500";
  return "bg-emerald-500";
}

export function variantLabel(variant: ProductVariant): string {
  const parts: string[] = [];
  if (variant.widthCm && variant.heightCm) {
    parts.push(`${variant.widthCm}×${variant.heightCm}cm`);
  } else if (variant.widthCm) {
    parts.push(`Φ${variant.widthCm}cm`);
  }
  if (variant.gsm) parts.push(`${variant.gsm}gsm`);
  if (variant.threadCount) parts.push(`T${variant.threadCount}`);
  return parts.join(" · ") || variant.cleanName || variant.name;
}

export function countMasterGroupStats(groups: MasterGroup[]) {
  let criticalCount = 0;
  let lowCount = 0;
  let okCount = 0;

  for (const group of groups) {
    if (group.hasCriticalStock) {
      criticalCount += 1;
    } else if (group.hasLowStock) {
      lowCount += 1;
    } else {
      okCount += 1;
    }
  }

  return { criticalCount, lowCount, okCount };
}

export type MasterGroupStockLevel = "critical" | "low" | "ok";

export function getMasterGroupStockLevel(group: MasterGroup): MasterGroupStockLevel {
  if (group.hasCriticalStock) return "critical";
  if (group.hasLowStock) return "low";
  return "ok";
}

export function masterGroupStockBarPercent(group: MasterGroup): number {
  const threshold = Math.max(group.minStock * group.variants.length * 2, 1);
  return Math.min(Math.round((group.totalStock / threshold) * 100), 100);
}

export function variantStockBarPercent(stock: number, minStock: number): number {
  return Math.min(Math.round((stock / Math.max(minStock * 2, 10)) * 100), 100);
}
