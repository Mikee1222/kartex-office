import type { SupabaseClient } from "@supabase/supabase-js";

import type { ProductColor, ProductColorSelection, ProductColorVariant } from "@/lib/products/types";

type ColorRow = {
  id: string;
  name: string;
  hex_code: string;
  is_active: boolean;
};

type VariantRow = {
  id: string;
  product_id: string;
  color_id: string;
  stock: number;
  is_active: boolean;
  is_primary?: boolean;
  product_colors?: ColorRow | ColorRow[] | null;
};

export function mapProductColor(row: ColorRow): ProductColor {
  return {
    id: row.id,
    name: row.name,
    hexCode: row.hex_code,
    isActive: row.is_active,
  };
}

function pickColorJoin(value: VariantRow["product_colors"]): ColorRow | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export function mapProductColorVariant(row: VariantRow): ProductColorVariant {
  const colorRow = pickColorJoin(row.product_colors);
  return {
    id: row.id,
    productId: row.product_id,
    colorId: row.color_id,
    stock: row.stock ?? 0,
    isActive: row.is_active,
    isPrimary: row.is_primary ?? false,
    color: colorRow ? mapProductColor(colorRow) : undefined,
  };
}

export async function fetchActiveProductColors(
  supabase: SupabaseClient,
): Promise<{ colors: ProductColor[]; error: string | null }> {
  const { data, error } = await supabase
    .from("product_colors")
    .select("id, name, hex_code, is_active")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    return { colors: [], error: error.message };
  }

  return {
    colors: (data as ColorRow[]).map(mapProductColor),
    error: null,
  };
}

export async function syncProductStockFromVariants(
  supabase: SupabaseClient,
  productId: string,
): Promise<{ totalStock: number; error: string | null }> {
  const { data, error } = await supabase
    .from("product_color_variants")
    .select("stock")
    .eq("product_id", productId)
    .eq("is_active", true);

  if (error) {
    return { totalStock: 0, error: error.message };
  }

  const totalStock =
    (data ?? []).reduce((sum, row) => sum + (row.stock ?? 0), 0) ?? 0;

  const { error: updateError } = await supabase
    .from("products")
    .update({ stock: totalStock })
    .eq("id", productId);

  if (updateError) {
    return { totalStock: 0, error: updateError.message };
  }

  return { totalStock, error: null };
}

export async function saveProductColorVariants(
  supabase: SupabaseClient,
  productId: string,
  selections: ProductColorSelection[],
): Promise<{ error: string | null; totalStock?: number }> {
  const { error: deleteError } = await supabase
    .from("product_color_variants")
    .delete()
    .eq("product_id", productId);

  if (deleteError) {
    return { error: deleteError.message };
  }

  if (selections.length > 0) {
    const { error: insertError } = await supabase.from("product_color_variants").insert(
      selections.map((selection) => ({
        product_id: productId,
        color_id: selection.colorId,
        stock: Math.max(0, Math.round(selection.stock)),
        is_active: true,
        is_primary: selection.isPrimary ?? false,
      })),
    );

    if (insertError) {
      return { error: insertError.message };
    }
  }

  const { totalStock, error: syncError } = await syncProductStockFromVariants(
    supabase,
    productId,
  );

  if (syncError) {
    return { error: syncError };
  }

  return { error: null, totalStock };
}

export async function fetchProductColorVariants(
  supabase: SupabaseClient,
  productId: string,
  activeOnly = false,
): Promise<{ variants: ProductColorVariant[]; error: string | null }> {
  let query = supabase
    .from("product_color_variants")
    .select(
      `
      id,
      product_id,
      color_id,
      stock,
      is_active,
      is_primary,
      product_colors ( id, name, hex_code, is_active )
    `,
    )
    .eq("product_id", productId)
    .order("created_at", { ascending: true });

  if (activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;

  if (error) {
    return { variants: [], error: error.message };
  }

  return {
    variants: (data as VariantRow[]).map(mapProductColorVariant),
    error: null,
  };
}

export async function fetchVariantsForProducts(
  supabase: SupabaseClient,
  productIds: string[],
): Promise<Map<string, ProductColorVariant[]>> {
  const map = new Map<string, ProductColorVariant[]>();
  if (productIds.length === 0) return map;

  const { data, error } = await supabase
    .from("product_color_variants")
    .select(
      `
      id,
      product_id,
      color_id,
      stock,
      is_active,
      is_primary,
      product_colors ( id, name, hex_code, is_active )
    `,
    )
    .in("product_id", productIds)
    .eq("is_active", true);

  if (error || !data) return map;

  for (const row of data as VariantRow[]) {
    const color = pickColorJoin(row.product_colors);
    if (!color?.is_active) continue;
    const variant = mapProductColorVariant(row);
    const list = map.get(row.product_id) ?? [];
    list.push(variant);
    list.sort((a, b) => {
      if (a.isPrimary) return -1;
      if (b.isPrimary) return 1;
      return 0;
    });
    map.set(row.product_id, list);
  }

  return map;
}

export async function updateVariantStock(
  supabase: SupabaseClient,
  variantId: string,
  productId: string,
  stock: number,
): Promise<{ error: string | null; totalStock?: number }> {
  const { error } = await supabase
    .from("product_color_variants")
    .update({ stock: Math.max(0, Math.round(stock)) })
    .eq("id", variantId);

  if (error) {
    return { error: error.message };
  }

  const { totalStock, error: syncError } = await syncProductStockFromVariants(
    supabase,
    productId,
  );

  if (syncError) {
    return { error: syncError };
  }

  return { error: null, totalStock };
}

export async function setVariantActive(
  supabase: SupabaseClient,
  variantId: string,
  productId: string,
  isActive: boolean,
): Promise<{ error: string | null; totalStock?: number }> {
  const { error } = await supabase
    .from("product_color_variants")
    .update({ is_active: isActive })
    .eq("id", variantId);

  if (error) {
    return { error: error.message };
  }

  const { totalStock, error: syncError } = await syncProductStockFromVariants(
    supabase,
    productId,
  );

  if (syncError) {
    return { error: syncError };
  }

  return { error: null, totalStock };
}
