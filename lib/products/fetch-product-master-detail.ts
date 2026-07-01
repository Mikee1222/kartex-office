import type { SupabaseClient } from "@supabase/supabase-js";

import {
  mapWebsiteProductMasterRow,
  WEBSITE_PRODUCT_MASTER_DETAIL_SELECT,
} from "@/lib/website/product-masters";
import type { WebsiteProductMasterRow } from "@/lib/website/types";

export async function fetchProductMasterDetail(
  supabase: SupabaseClient,
  masterId: string,
): Promise<{ master: WebsiteProductMasterRow | null; error?: string }> {
  const { data, error } = await supabase
    .from("product_masters")
    .select(WEBSITE_PRODUCT_MASTER_DETAIL_SELECT)
    .eq("id", masterId)
    .maybeSingle();

  if (error) {
    return { master: null, error: error.message };
  }

  if (!data) {
    return { master: null };
  }

  return {
    master: mapWebsiteProductMasterRow(
      data as Parameters<typeof mapWebsiteProductMasterRow>[0],
    ),
  };
}

export async function updateProductMasterDetail(
  supabase: SupabaseClient,
  masterId: string,
  patch: {
    cleanName?: string;
    category?: string;
    subcategory?: string | null;
    qualityGrade?: string | null;
    material?: string | null;
    description?: string | null;
  },
): Promise<{ master: WebsiteProductMasterRow | null; error?: string }> {
  const dbPatch: Record<string, unknown> = {};

  if (patch.cleanName !== undefined) {
    const trimmed = patch.cleanName.trim();
    if (!trimmed) {
      return { master: null, error: "Το όνομα είναι υποχρεωτικό." };
    }
    dbPatch.clean_name = trimmed;
  }
  if (patch.category !== undefined) {
    const trimmed = patch.category.trim();
    if (!trimmed) {
      return { master: null, error: "Η κατηγορία είναι υποχρεωτική." };
    }
    dbPatch.category = trimmed;
  }
  if (patch.subcategory !== undefined) {
    dbPatch.subcategory = patch.subcategory?.trim() || null;
  }
  if (patch.qualityGrade !== undefined) {
    dbPatch.quality_grade = patch.qualityGrade?.trim() || null;
  }
  if (patch.material !== undefined) {
    dbPatch.material = patch.material?.trim() || null;
  }
  if (patch.description !== undefined) {
    dbPatch.description = patch.description?.trim() || null;
  }

  if (Object.keys(dbPatch).length === 0) {
    return { master: null, error: "Δεν υπάρχουν αλλαγές προς αποθήκευση." };
  }

  const { error } = await supabase
    .from("product_masters")
    .update(dbPatch)
    .eq("id", masterId);

  if (error) {
    return { master: null, error: error.message };
  }

  return fetchProductMasterDetail(supabase, masterId);
}
