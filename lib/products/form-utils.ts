import type { ProductDimensionsFormState } from "@/components/products/product-form/product-form-dimensions-section";
import { DEFAULT_MEASUREMENT_UNIT } from "@/lib/products/constants";

/**
 * Product category is plain text on `products.category`.
 * The form dropdown reads from `website_categories` — never insert that table on save.
 */
export function productCategoryToPayload(category: string): string | null {
  const trimmed = category.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function parseOptionalNumber(value: string, fallback = 0) {
  if (!value.trim()) return fallback;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : fallback;
}

export function parseOptionalDimension(value: string): number | null {
  if (!value.trim()) return null;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

export function dimensionsToPayload(
  dimensions: ProductDimensionsFormState,
  unit: string,
  material: string,
  qualityGrade: string,
) {
  return {
    width_cm: parseOptionalDimension(dimensions.widthCm),
    height_cm: parseOptionalDimension(dimensions.heightCm),
    weight_kg: parseOptionalDimension(dimensions.weightKg),
    material: material.trim() || null,
    quality_grade: qualityGrade.trim() || null,
    unit: unit.trim() || DEFAULT_MEASUREMENT_UNIT,
  };
}

export function formatDimensionsLabel(product: {
  widthCm?: number | null;
  heightCm?: number | null;
  weightKg?: number | null;
  unit?: string;
}): string | null {
  const parts: string[] = [];
  if (product.widthCm != null && product.heightCm != null) {
    parts.push(`${product.widthCm}×${product.heightCm} cm`);
  } else if (product.widthCm != null) {
    parts.push(`Φ${product.widthCm} cm`);
  } else if (product.heightCm != null) {
    parts.push(`Υψ. ${product.heightCm} cm`);
  }
  if (product.weightKg != null) {
    parts.push(`${product.weightKg} kg`);
  }
  if (parts.length === 0) return null;
  const unit = product.unit?.trim();
  return unit ? `${parts.join(" | ")} · ${unit}` : parts.join(" | ");
}
