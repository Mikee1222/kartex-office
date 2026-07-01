import type { WebsiteProductMasterRow } from "@/lib/website/types";

export const WEBSITE_PRODUCT_MASTERS_SELECT = `
  id, clean_name, category, subcategory, quality_grade, material, image_url, is_active,
  products!products_master_id_fkey (
    id, width_cm, height_cm, gsm, thread_count, color, sku, stock, subcategory, internal_price_eur
  )
`;

type RawVariant = {
  id: string;
  width_cm?: number | string | null;
  height_cm?: number | string | null;
  gsm?: number | string | null;
  thread_count?: number | string | null;
  color?: string | null;
  sku?: string | null;
  stock?: number | null;
  subcategory?: string | null;
  internal_price_eur?: number | string | null;
};

type RawMaster = {
  id: string;
  clean_name: string;
  category: string;
  subcategory?: string | null;
  quality_grade?: string | null;
  material?: string | null;
  image_url?: string | null;
  is_active?: boolean | null;
  products?: RawVariant[] | null;
};

function toNumber(value: number | string | null | undefined): number | null {
  if (value == null || value === "") return null;
  const parsed = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function mapWebsiteProductMasterRow(row: RawMaster): WebsiteProductMasterRow {
  const variants = (row.products ?? []).map((variant) => ({
    id: variant.id,
    widthCm: toNumber(variant.width_cm),
    heightCm: toNumber(variant.height_cm),
    gsm: toNumber(variant.gsm),
    threadCount: toNumber(variant.thread_count),
    color: variant.color?.trim() || null,
    sku: variant.sku?.trim() || "",
    stock: variant.stock ?? 0,
    subcategory: variant.subcategory?.trim() || null,
    internalPriceEur: toNumber(variant.internal_price_eur),
  }));

  return {
    id: row.id,
    cleanName: row.clean_name,
    category: row.category,
    subcategory: row.subcategory?.trim() || null,
    qualityGrade: row.quality_grade?.trim() || null,
    material: row.material?.trim() || null,
    imageUrl: row.image_url?.trim() || null,
    isActive: row.is_active ?? true,
    variants,
  };
}
