import type { SupabaseClient } from "@supabase/supabase-js";

import {
  syncProductStockFromVariants,
  updateVariantStock as updateColorVariantStock,
} from "@/lib/products/color-variants";

type ColorVariantRow = {
  id: string;
  color_id: string;
  stock: number | null;
  is_active: boolean | null;
  is_primary: boolean | null;
};

export async function updateVariantDimensions(
  supabase: SupabaseClient,
  variantId: string,
  widthCm: number,
  heightCm: number,
): Promise<{ error: string | null }> {
  if (!Number.isFinite(widthCm) || widthCm <= 0) {
    return { error: "Το πλάτος πρέπει να είναι θετικός αριθμός." };
  }
  if (!Number.isFinite(heightCm) || heightCm <= 0) {
    return { error: "Το ύψος πρέπει να είναι θετικός αριθμός." };
  }

  const { error } = await supabase
    .from("products")
    .update({ width_cm: widthCm, height_cm: heightCm })
    .eq("id", variantId);

  return { error: error?.message ?? null };
}

export async function updateVariantSubcategory(
  supabase: SupabaseClient,
  variantId: string,
  subcategory: string | null,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("products")
    .update({ subcategory: subcategory?.trim() || null })
    .eq("id", variantId);

  return { error: error?.message ?? null };
}

async function getActiveColorVariant(
  supabase: SupabaseClient,
  variantId: string,
): Promise<ColorVariantRow | null> {
  const { data, error } = await supabase
    .from("product_color_variants")
    .select("id, color_id, stock, is_active, is_primary")
    .eq("product_id", variantId)
    .eq("is_active", true)
    .order("is_primary", { ascending: false })
    .limit(1);

  if (error || !data?.length) {
    return null;
  }

  return data[0] as ColorVariantRow;
}

export async function updateVariantStock(
  supabase: SupabaseClient,
  variantId: string,
  stock: number,
): Promise<{ stock: number; error: string | null }> {
  if (!Number.isFinite(stock) || stock < 0) {
    return { stock, error: "Το απόθεμα πρέπει να είναι μη αρνητικός αριθμός." };
  }

  const rounded = Math.max(0, Math.round(stock));
  const activeColorVariant = await getActiveColorVariant(supabase, variantId);

  if (activeColorVariant) {
    const result = await updateColorVariantStock(
      supabase,
      activeColorVariant.id,
      variantId,
      rounded,
    );
    return {
      stock: result.totalStock ?? rounded,
      error: result.error,
    };
  }

  const { error } = await supabase
    .from("products")
    .update({ stock: rounded })
    .eq("id", variantId);

  return { stock: rounded, error: error?.message ?? null };
}

export async function updateVariantCatalogColor(
  supabase: SupabaseClient,
  variantId: string,
  colorId: string,
  stock: number,
): Promise<{ colorId: string; colorName: string; error: string | null }> {
  const { data: colorRow, error: colorError } = await supabase
    .from("product_colors")
    .select("id, name, is_active")
    .eq("id", colorId)
    .maybeSingle();

  if (colorError || !colorRow || colorRow.is_active === false) {
    return {
      colorId,
      colorName: "",
      error: colorError?.message ?? "Το χρώμα δεν βρέθηκε ή είναι ανενεργό.",
    };
  }

  const { data: existing, error: fetchError } = await supabase
    .from("product_color_variants")
    .select("id, color_id, stock, is_active, is_primary")
    .eq("product_id", variantId);

  if (fetchError) {
    return { colorId, colorName: colorRow.name, error: fetchError.message };
  }

  const rows = (existing ?? []) as ColorVariantRow[];
  const roundedStock = Math.max(0, Math.round(stock));

  for (const row of rows) {
    if (row.is_active === false) continue;
    const { error } = await supabase
      .from("product_color_variants")
      .update({ is_active: false, is_primary: false })
      .eq("id", row.id);
    if (error) {
      return { colorId, colorName: colorRow.name, error: error.message };
    }
  }

  const existingTarget = rows.find((row) => row.color_id === colorId);
  if (existingTarget) {
    const { error } = await supabase
      .from("product_color_variants")
      .update({
        is_active: true,
        is_primary: true,
        stock: roundedStock,
      })
      .eq("id", existingTarget.id);
    if (error) {
      return { colorId, colorName: colorRow.name, error: error.message };
    }
  } else {
    const { error } = await supabase.from("product_color_variants").insert({
      product_id: variantId,
      color_id: colorId,
      stock: roundedStock,
      is_active: true,
      is_primary: true,
    });
    if (error) {
      return { colorId, colorName: colorRow.name, error: error.message };
    }
  }

  const { error: syncError, totalStock } = await syncProductStockFromVariants(
    supabase,
    variantId,
  );
  if (syncError) {
    return { colorId, colorName: colorRow.name, error: syncError };
  }

  if (totalStock != null && totalStock !== roundedStock) {
    // syncProductStockFromVariants already wrote products.stock
  }

  return { colorId, colorName: colorRow.name, error: null };
}

export async function updateVariantLegacyColor(
  supabase: SupabaseClient,
  variantId: string,
  colorName: string,
): Promise<{ colorId: null; colorName: string; error: string | null }> {
  const trimmed = colorName.trim();
  if (!trimmed) {
    return { colorId: null, colorName: "", error: "Επιλέξτε χρώμα." };
  }

  const { data: existing, error: fetchError } = await supabase
    .from("product_color_variants")
    .select("id, is_active")
    .eq("product_id", variantId);

  if (fetchError) {
    return { colorId: null, colorName: trimmed, error: fetchError.message };
  }

  for (const row of existing ?? []) {
    if (row.is_active === false) continue;
    const { error } = await supabase
      .from("product_color_variants")
      .update({ is_active: false, is_primary: false })
      .eq("id", row.id);
    if (error) {
      return { colorId: null, colorName: trimmed, error: error.message };
    }
  }

  const { error } = await supabase
    .from("products")
    .update({ color: trimmed })
    .eq("id", variantId);

  return {
    colorId: null,
    colorName: trimmed,
    error: error?.message ?? null,
  };
}
