import type { SupabaseClient } from "@supabase/supabase-js";

import type { ProductColor } from "@/lib/products/types";

import { toLegacyColorId } from "@/lib/website/legacy-color-options";

export type DimensionOption = {
  key: string;
  widthCm: number;
  heightCm: number;
  label: string;
};

export type SubcategoryOption = {
  value: string;
  label: string;
};

export const CUSTOM_DIMENSION_VALUE = "__custom__";
export const CUSTOM_SUBCATEGORY_VALUE = "__custom__";

function formatDimensionLabel(widthCm: number, heightCm: number): string {
  return `${widthCm}×${heightCm}`;
}

function pickJoin<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

type RawColorVariant = {
  is_active?: boolean | null;
  product_colors?: {
    id: string;
    name: string;
    hex_code: string;
    is_active?: boolean | null;
  } | {
    id: string;
    name: string;
    hex_code: string;
    is_active?: boolean | null;
  }[] | null;
};

export async function fetchCategoryDimensionOptions(
  supabase: SupabaseClient,
  category: string,
): Promise<{ options: DimensionOption[]; error: string | null }> {
  const { data, error } = await supabase
    .from("products")
    .select("width_cm, height_cm, is_active, product_masters!inner(category)")
    .eq("product_masters.category", category)
    .eq("is_active", true)
    .not("width_cm", "is", null)
    .not("height_cm", "is", null);

  if (error) {
    return { options: [], error: error.message };
  }

  const seen = new Map<string, DimensionOption>();
  for (const row of data ?? []) {
    const widthCm = Number(row.width_cm);
    const heightCm = Number(row.height_cm);
    if (!Number.isFinite(widthCm) || !Number.isFinite(heightCm)) continue;
    const key = `${widthCm}x${heightCm}`;
    if (!seen.has(key)) {
      seen.set(key, {
        key,
        widthCm,
        heightCm,
        label: formatDimensionLabel(widthCm, heightCm),
      });
    }
  }

  const options = [...seen.values()].sort((a, b) => {
    if (a.widthCm !== b.widthCm) return a.widthCm - b.widthCm;
    return a.heightCm - b.heightCm;
  });

  return { options, error: null };
}

/** Colors that already appear in warehouse data for this category (catalog-backed). */
export async function fetchCategoryWarehouseColorOptions(
  supabase: SupabaseClient,
  category: string,
): Promise<{ colors: ProductColor[]; error: string | null }> {
  const { data, error } = await supabase
    .from("products")
    .select(
      `
      color,
      is_active,
      product_masters!inner(category),
      product_color_variants (
        is_active,
        product_colors ( id, name, hex_code, is_active )
      )
    `,
    )
    .eq("product_masters.category", category)
    .eq("is_active", true);

  if (error) {
    return { colors: [], error: error.message };
  }

  const byId = new Map<string, ProductColor>();
  const legacyNames = new Set<string>();

  for (const row of data ?? []) {
    let hasCatalogColor = false;
    for (const colorVariant of (row.product_color_variants ??
      []) as RawColorVariant[]) {
      if (colorVariant.is_active === false) continue;
      const catalog = pickJoin(colorVariant.product_colors);
      if (!catalog || catalog.is_active === false) continue;
      hasCatalogColor = true;
      byId.set(catalog.id, {
        id: catalog.id,
        name: catalog.name,
        hexCode: catalog.hex_code,
        isActive: true,
      });
    }
    const legacy = row.color?.trim();
    if (!hasCatalogColor && legacy) {
      legacyNames.add(legacy);
    }
  }

  if (legacyNames.size > 0) {
    const { data: catalogRows, error: catalogError } = await supabase
      .from("product_colors")
      .select("id, name, hex_code, is_active")
      .eq("is_active", true);

    if (catalogError) {
      return { colors: [], error: catalogError.message };
    }

    const catalogByName = new Map(
      (catalogRows ?? []).map((row) => [row.name.trim(), row]),
    );

    for (const legacyName of legacyNames) {
      const catalog = catalogByName.get(legacyName);
      if (catalog && !byId.has(catalog.id)) {
        byId.set(catalog.id, {
          id: catalog.id,
          name: catalog.name,
          hexCode: catalog.hex_code,
          isActive: true,
        });
        continue;
      }

      const legacyId = toLegacyColorId(legacyName);
      if (!byId.has(legacyId)) {
        byId.set(legacyId, {
          id: legacyId,
          name: legacyName,
          hexCode: "",
          isActive: true,
        });
      }
    }
  }

  const colors = [...byId.values()].sort((a, b) =>
    a.name.localeCompare(b.name, "el"),
  );

  return { colors, error: null };
}

export { mergeWarehouseColorOptions } from "@/lib/website/legacy-color-options";

export async function fetchCategorySubcategoryOptions(
  supabase: SupabaseClient,
  category: string,
): Promise<{ options: SubcategoryOption[]; error: string | null }> {
  const { data, error } = await supabase
    .from("products")
    .select("subcategory, is_active, product_masters!inner(category)")
    .eq("product_masters.category", category)
    .eq("is_active", true)
    .not("subcategory", "is", null);

  if (error) {
    return { options: [], error: error.message };
  }

  const seen = new Set<string>();
  const options: SubcategoryOption[] = [];

  for (const row of data ?? []) {
    const value = String(row.subcategory ?? "").trim();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    options.push({ value, label: value });
  }

  options.sort((a, b) => a.label.localeCompare(b.label, "el"));
  return { options, error: null };
}
