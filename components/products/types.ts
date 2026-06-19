export const ProductCategory = {
  Towels: "Πετσέτες",
  Sheets: "Σεντόνια",
  Pillowcases: "Μαξιλαροθήκες",
  DuvetCovers: "Παπλωματοθήκες",
  Bathmats: "Πατάκια",
  Tablecloths: "Τραπεζομάντηλα",
  Fabrics: "Υφάσματα",
  Other: "Άλλο",
} as const;

export type ProductCategory =
  (typeof ProductCategory)[keyof typeof ProductCategory];

export type ProductColorSummary = {
  id: string;
  name: string;
  hexCode: string;
};

export type Product = {
  id: string;
  name: string;
  cleanName?: string;
  sku: string;
  barcode: string;
  category: string;
  subcategory?: string;
  masterId?: string;
  stock: number;
  reservedStock: number;
  availableStock: number;
  minStock: number;
  purchasePrice: number;
  salePrice: number;
  supplier?: string;
  description?: string;
  widthCm?: number | null;
  heightCm?: number | null;
  weightKg?: number | null;
  gsm?: number | null;
  threadCount?: number | null;
  unit?: string;
  material?: string;
  qualityGrade?: string;
  imageUrl?: string | null;
  isActive?: boolean;
  createdAt?: string;
  supplierId?: string;
  colors?: ProductColorSummary[];
};

/** Category name, or special filters `all` / `low_stock`. */
export type ProductFilterTab = "all" | "low_stock" | string;

export type StockStatus = "adequate" | "low" | "critical";

export function getStockStatus(stock: number, minStock: number): StockStatus {
  if (stock <= 0 || stock <= Math.floor(minStock * 0.25)) {
    return "critical";
  }
  if (stock <= minStock) {
    return "low";
  }
  return "adequate";
}

/** Bar fill % for list UI: stock value capped at 100 for display width. */
export function getStockBarPercent(stock: number): number {
  return Math.min(Math.max(stock, 0), 100);
}

/** Bar color from absolute stock thresholds (not vs minStock). */
export function getStockBarColorClass(stock: number): string {
  if (stock > 50) return "bg-emerald-500";
  if (stock > 10) return "bg-amber-500";
  return "bg-red-500";
}
