import type { SupabaseClient } from "@supabase/supabase-js";

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

export async function fetchCategoryDimensionOptions(
  supabase: SupabaseClient,
  category: string,
): Promise<{ options: DimensionOption[]; error: string | null }> {
  const { data, error } = await supabase
    .from("products")
    .select("width_cm, height_cm, product_masters!inner(category)")
    .eq("product_masters.category", category)
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

export async function fetchCategorySubcategoryOptions(
  supabase: SupabaseClient,
  category: string,
): Promise<{ options: SubcategoryOption[]; error: string | null }> {
  const { data, error } = await supabase
    .from("products")
    .select("subcategory, product_masters!inner(category)")
    .eq("product_masters.category", category)
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
