import type { SupabaseClient } from "@supabase/supabase-js";

import { DEFAULT_MEASUREMENT_UNIT } from "@/lib/products/constants";
import { saveProductColorVariants } from "@/lib/products/color-variants";
import {
  formatWarehouseSku,
  getWarehouseSkuPrefix,
  parseWarehouseSkuSuffix,
} from "@/lib/products/warehouse-sku";
import { isLegacyColorId, toLegacyColorId } from "@/lib/website/legacy-color-options";
import type {
  WebsiteProductMasterRow,
  WebsiteProductMasterVariantRow,
} from "@/lib/website/types";

export type CreateMasterVariantInput = {
  master: WebsiteProductMasterRow;
  widthCm: number;
  heightCm: number;
  colorId: string;
  colorName: string;
  subcategory: string | null;
  stock: number;
  internalPriceEur: number | null;
};

type RawColorVariant = {
  color_id: string;
  is_active?: boolean | null;
  product_colors?: { name: string } | { name: string }[] | null;
};

type RawProductRow = {
  id: string;
  width_cm: number | null;
  height_cm: number | null;
  color: string | null;
  gsm: number | null;
  thread_count: number | null;
  unit: string | null;
  product_color_variants?: RawColorVariant[] | null;
};

function pickJoin<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function generateNextWarehouseSkuForCategory(
  supabase: SupabaseClient,
  category: string,
): Promise<{ sku: string } | { error: string }> {
  const prefix = getWarehouseSkuPrefix(category);
  if (!prefix) {
    return {
      error: `Δεν έχει οριστεί warehouse prefix για την κατηγορία «${category}».`,
    };
  }

  const { data, error } = await supabase
    .from("products")
    .select("sku")
    .like("sku", `${prefix}-%`);

  if (error) {
    return { error: error.message };
  }

  let maxSuffix = 0;
  for (const row of data ?? []) {
    const suffix = parseWarehouseSkuSuffix(String(row.sku ?? ""), prefix);
    if (suffix != null && suffix > maxSuffix) {
      maxSuffix = suffix;
    }
  }

  return { sku: formatWarehouseSku(prefix, maxSuffix + 1) };
}

function variantHasDuplicateColor(
  product: RawProductRow,
  colorId: string,
  colorName: string,
): boolean {
  const activeVariants = (product.product_color_variants ?? []).filter(
    (row) => row.is_active !== false,
  );

  if (activeVariants.length > 0) {
    if (isLegacyColorId(colorId)) {
      return false;
    }
    return activeVariants.some((row) => row.color_id === colorId);
  }

  return (product.color?.trim() ?? "") === colorName.trim();
}

export async function findDuplicateMasterVariant(
  supabase: SupabaseClient,
  masterId: string,
  widthCm: number,
  heightCm: number,
  colorId: string,
  colorName: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("products")
    .select(
      `
      id,
      width_cm,
      height_cm,
      color,
      product_color_variants (
        color_id,
        is_active,
        product_colors ( name )
      )
    `,
    )
    .eq("master_id", masterId)
    .eq("width_cm", widthCm)
    .eq("height_cm", heightCm);

  if (error || !data?.length) {
    return false;
  }

  for (const product of data as RawProductRow[]) {
    if (variantHasDuplicateColor(product, colorId, colorName)) {
      return true;
    }
  }

  return false;
}

function inheritVariantDefaults(
  master: WebsiteProductMasterRow,
  widthCm: number,
  heightCm: number,
  siblings: RawProductRow[],
): {
  gsm: number | null;
  threadCount: number | null;
  unit: string;
} {
  const sameSize = siblings.find(
    (row) => row.width_cm === widthCm && row.height_cm === heightCm,
  );
  const template = sameSize ?? siblings[0];

  return {
    gsm: template?.gsm ?? null,
    threadCount: template?.thread_count ?? null,
    unit: template?.unit?.trim() || DEFAULT_MEASUREMENT_UNIT,
  };
}

export async function createWebsiteMasterVariant(
  supabase: SupabaseClient,
  input: CreateMasterVariantInput,
): Promise<{ variant: WebsiteProductMasterVariantRow } | { error: string }> {
  const {
    master,
    widthCm,
    heightCm,
    colorId,
    colorName,
    subcategory,
    stock,
    internalPriceEur,
  } = input;

  if (!Number.isFinite(widthCm) || widthCm <= 0) {
    return { error: "Εισάγετε έγκυρο πλάτος (cm)." };
  }
  if (!Number.isFinite(heightCm) || heightCm <= 0) {
    return { error: "Εισάγετε έγκυρο ύψος (cm)." };
  }
  if (!colorId.trim()) {
    return { error: "Επιλέξτε χρώμα." };
  }
  if (!master.cleanName.trim()) {
    return { error: "Το master προϊόν δεν έχει όνομα (clean_name)." };
  }
  if (!master.category.trim()) {
    return { error: "Το master προϊόν δεν έχει κατηγορία." };
  }

  const isDuplicate = await findDuplicateMasterVariant(
    supabase,
    master.id,
    widthCm,
    heightCm,
    colorId,
    colorName,
  );
  if (isDuplicate) {
    return {
      error: `Υπάρχει ήδη παραλλαγή ${widthCm}×${heightCm} cm με χρώμα «${colorName}» για αυτό το master.`,
    };
  }

  const skuResult = await generateNextWarehouseSkuForCategory(
    supabase,
    master.category,
  );
  if ("error" in skuResult) {
    return { error: skuResult.error };
  }

  const { data: siblingRows, error: siblingsError } = await supabase
    .from("products")
    .select("width_cm, height_cm, gsm, thread_count, unit")
    .eq("master_id", master.id);

  if (siblingsError) {
    return { error: siblingsError.message };
  }

  const inherited = inheritVariantDefaults(
    master,
    widthCm,
    heightCm,
    (siblingRows as RawProductRow[] | null) ?? [],
  );

  const productName = `${master.cleanName} ${widthCm}×${heightCm}`;

  const { data: inserted, error: insertError } = await supabase
    .from("products")
    .insert({
      name: productName,
      clean_name: master.cleanName,
      master_id: master.id,
      category: master.category,
      subcategory: subcategory?.trim() || null,
      sku: skuResult.sku,
      width_cm: widthCm,
      height_cm: heightCm,
      gsm: inherited.gsm,
      thread_count: inherited.threadCount,
      unit: inherited.unit,
      material: master.material,
      quality_grade: master.qualityGrade,
      stock: Math.max(0, Math.round(stock)),
      internal_price_eur: internalPriceEur,
      purchase_price: 0,
      sale_price: 0,
      min_stock: 0,
      is_active: true,
      color: isLegacyColorId(colorId) ? colorName.trim() : null,
    })
    .select(
      "id, width_cm, height_cm, gsm, thread_count, color, sku, stock, subcategory, internal_price_eur",
    )
    .single();

  if (insertError || !inserted) {
    return { error: insertError?.message ?? "Αποτυχία δημιουργίας παραλλαγής." };
  }

  if (isLegacyColorId(colorId)) {
    return {
      variant: {
        id: inserted.id,
        widthCm: inserted.width_cm,
        heightCm: inserted.height_cm,
        gsm: inserted.gsm,
        threadCount: inserted.thread_count,
        color: colorName,
        colorId: toLegacyColorId(colorName),
        sku: inserted.sku?.trim() ?? skuResult.sku,
        stock: inserted.stock ?? Math.max(0, Math.round(stock)),
        subcategory: inserted.subcategory?.trim() || subcategory?.trim() || null,
        internalPriceEur:
          inserted.internal_price_eur != null
            ? Number(inserted.internal_price_eur)
            : internalPriceEur,
        isActive: true,
      },
    };
  }

  const { error: colorError, totalStock } = await saveProductColorVariants(
    supabase,
    inserted.id,
    [
      {
        colorId,
        stock: Math.max(0, Math.round(stock)),
        isPrimary: true,
      },
    ],
  );

  if (colorError) {
    await supabase.from("products").delete().eq("id", inserted.id);
    return { error: colorError };
  }

  return {
    variant: {
      id: inserted.id,
      widthCm: inserted.width_cm,
      heightCm: inserted.height_cm,
      gsm: inserted.gsm,
      threadCount: inserted.thread_count,
      color: colorName,
      colorId,
      sku: inserted.sku?.trim() ?? skuResult.sku,
      stock: totalStock ?? Math.max(0, Math.round(stock)),
      subcategory: inserted.subcategory?.trim() || subcategory?.trim() || null,
      internalPriceEur:
        inserted.internal_price_eur != null
          ? Number(inserted.internal_price_eur)
          : internalPriceEur,
      isActive: true,
    },
  };
}
