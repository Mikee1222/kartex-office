import type { SupabaseClient } from "@supabase/supabase-js";
import { toast } from "sonner";

import type { WebsiteVariantFieldPatch } from "@/components/website/website-master-variants-table";
import {
  updateVariantCatalogColor,
  updateVariantDimensions,
} from "@/lib/website/variant-field-updates";

type VariantFieldSaveContext = {
  supabase: SupabaseClient;
  setBusyVariantId: (id: string | null) => void;
  patchVariant: (variantId: string, patch: WebsiteVariantFieldPatch) => void;
};

export async function saveVariantDimensions(
  ctx: VariantFieldSaveContext,
  variantId: string,
  widthCm: number,
  heightCm: number,
): Promise<boolean> {
  ctx.setBusyVariantId(variantId);
  const result = await updateVariantDimensions(
    ctx.supabase,
    variantId,
    widthCm,
    heightCm,
  );
  ctx.setBusyVariantId(null);

  if (result.error) {
    toast.error(result.error);
    return false;
  }

  ctx.patchVariant(variantId, { widthCm, heightCm });
  toast.success("Οι διαστάσεις αποθηκεύτηκαν.");
  return true;
}

export async function saveVariantColor(
  ctx: VariantFieldSaveContext,
  variantId: string,
  colorId: string,
  colorName: string,
  stock: number,
): Promise<boolean> {
  ctx.setBusyVariantId(variantId);
  const result = await updateVariantCatalogColor(
    ctx.supabase,
    variantId,
    colorId,
    stock,
  );
  ctx.setBusyVariantId(null);

  if (result.error) {
    toast.error(result.error);
    return false;
  }

  ctx.patchVariant(variantId, {
    colorId: result.colorId,
    color: result.colorName,
  });
  toast.success("Το χρώμα αποθηκεύτηκε.");
  return true;
}

export async function saveVariantInternalPrice(
  ctx: VariantFieldSaveContext,
  variantId: string,
  value: number | null,
): Promise<boolean> {
  ctx.setBusyVariantId(variantId);
  const { error } = await ctx.supabase
    .from("products")
    .update({ internal_price_eur: value })
    .eq("id", variantId);
  ctx.setBusyVariantId(null);

  if (error) {
    toast.error(error.message);
    return false;
  }

  ctx.patchVariant(variantId, { internalPriceEur: value });
  toast.success("Εσωτερική τιμή αποθηκεύτηκε.");
  return true;
}
