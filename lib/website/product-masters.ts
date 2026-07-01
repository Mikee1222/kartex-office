import type { WebsiteProductMasterRow } from "@/lib/website/types";
import {
  mapProductMasterImageRow,
  primaryImageUrl,
  sortImages,
  type RawProductMasterImage,
} from "@/lib/website/product-master-images";

export const WEBSITE_PRODUCT_VARIANT_SELECT = `
  id, width_cm, height_cm, gsm, thread_count, color, sku, stock, subcategory, internal_price_eur, is_active,
  product_color_variants (
    id, color_id, stock, is_active, is_primary,
    product_colors ( id, name, hex_code, is_active )
  )
`;

export const WEBSITE_PRODUCT_MASTERS_SELECT = `
  id, clean_name, category, subcategory, quality_grade, material, description, image_url, is_active,
  product_master_images ( id, master_id, url, sort_order, alt_text, created_at ),
  products!products_master_id_fkey (
    ${WEBSITE_PRODUCT_VARIANT_SELECT}
  )
`;

export const WEBSITE_PRODUCT_MASTER_DETAIL_SELECT = WEBSITE_PRODUCT_MASTERS_SELECT;

type RawColorCatalog = {
  id: string;
  name: string;
  hex_code?: string | null;
  is_active?: boolean | null;
};

type RawColorVariant = {
  id: string;
  color_id: string;
  stock?: number | null;
  is_active?: boolean | null;
  is_primary?: boolean | null;
  product_colors?: RawColorCatalog | RawColorCatalog[] | null;
};

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
  is_active?: boolean | null;
  product_color_variants?: RawColorVariant[] | null;
};

type RawMaster = {
  id: string;
  clean_name: string;
  category: string;
  subcategory?: string | null;
  quality_grade?: string | null;
  material?: string | null;
  description?: string | null;
  image_url?: string | null;
  is_active?: boolean | null;
  product_master_images?: RawProductMasterImage[] | null;
  products?: RawVariant[] | null;
};

function toNumber(value: number | string | null | undefined): number | null {
  if (value == null || value === "") return null;
  const parsed = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function pickJoin<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function resolveCatalogColor(rawVariants: RawColorVariant[] | null | undefined): {
  colorId: string | null;
  colorName: string | null;
} {
  const active = (rawVariants ?? [])
    .filter((row) => row.is_active !== false)
    .map((row) => {
      const catalog = pickJoin(row.product_colors);
      if (!catalog || catalog.is_active === false) return null;
      return {
        colorId: catalog.id,
        colorName: catalog.name?.trim() || null,
        isPrimary: row.is_primary ?? false,
      };
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row));

  if (active.length === 0) {
    return { colorId: null, colorName: null };
  }

  active.sort((a, b) => {
    if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
    return (a.colorName ?? "").localeCompare(b.colorName ?? "", "el");
  });

  return {
    colorId: active[0]!.colorId,
    colorName: active[0]!.colorName,
  };
}

function mapWebsiteVariant(variant: RawVariant) {
  const catalogColor = resolveCatalogColor(variant.product_color_variants);

  return {
    id: variant.id,
    widthCm: toNumber(variant.width_cm),
    heightCm: toNumber(variant.height_cm),
    gsm: toNumber(variant.gsm),
    threadCount: toNumber(variant.thread_count),
    color: catalogColor.colorName ?? (variant.color?.trim() || null),
    colorId: catalogColor.colorId,
    sku: variant.sku?.trim() || "",
    stock: variant.stock ?? 0,
    subcategory: variant.subcategory?.trim() || null,
    internalPriceEur: toNumber(variant.internal_price_eur),
    isActive: variant.is_active ?? true,
  };
}

export function mapWebsiteProductMasterRow(row: RawMaster): WebsiteProductMasterRow {
  const variants = (row.products ?? [])
    .map((variant) => mapWebsiteVariant(variant))
    .filter((variant) => variant.isActive);

  const images = sortImages(
    (row.product_master_images ?? []).map((image) =>
      mapProductMasterImageRow(image),
    ),
  );

  const imageUrl =
    primaryImageUrl(images, row.image_url?.trim() || null) ?? null;

  return {
    id: row.id,
    cleanName: row.clean_name,
    category: row.category,
    subcategory: row.subcategory?.trim() || null,
    qualityGrade: row.quality_grade?.trim() || null,
    material: row.material?.trim() || null,
    description: row.description?.trim() || null,
    imageUrl,
    isActive: row.is_active ?? true,
    images,
    variants,
  };
}
