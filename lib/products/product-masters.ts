import type { SupabaseClient } from "@supabase/supabase-js";

export type ProductMasterOption = {
  id: string;
  cleanName: string;
  category: string;
  subcategory?: string;
  qualityGrade?: string;
  material?: string;
};

type ProductMasterRow = {
  id: string;
  clean_name: string;
  category: string;
  subcategory?: string | null;
  quality_grade?: string | null;
  material?: string | null;
};

function mapProductMasterRow(row: ProductMasterRow): ProductMasterOption {
  return {
    id: row.id,
    cleanName: row.clean_name,
    category: row.category,
    subcategory: row.subcategory?.trim() || undefined,
    qualityGrade: row.quality_grade?.trim() || undefined,
    material: row.material?.trim() || undefined,
  };
}

export async function fetchProductMasters(
  supabase: SupabaseClient,
): Promise<{ masters: ProductMasterOption[]; error?: string }> {
  const { data, error } = await supabase
    .from("product_masters")
    .select("id, clean_name, category, subcategory, quality_grade, material")
    .eq("is_active", true)
    .order("clean_name", { ascending: true });

  if (error) {
    return { masters: [], error: error.message };
  }

  return {
    masters: (data ?? []).map((row) => mapProductMasterRow(row as ProductMasterRow)),
  };
}

export async function findOrCreateProductMaster(
  supabase: SupabaseClient,
  input: {
    cleanName: string;
    category: string;
    subcategory: string;
    qualityGrade: string;
    material: string;
  },
): Promise<{ masterId: string; cleanName: string; error?: string }> {
  const trimmedCleanName = input.cleanName.trim();
  const trimmedCategory = input.category.trim();

  if (!trimmedCleanName) {
    return { masterId: "", cleanName: "", error: "Δεν δημιουργήθηκε clean name." };
  }
  if (!trimmedCategory) {
    return { masterId: "", cleanName: "", error: "Η κατηγορία είναι υποχρεωτική." };
  }

  const { data: existing, error: findError } = await supabase
    .from("product_masters")
    .select("id, clean_name")
    .eq("clean_name", trimmedCleanName)
    .eq("category", trimmedCategory)
    .maybeSingle();

  if (findError) {
    return { masterId: "", cleanName: "", error: findError.message };
  }

  if (existing) {
    return { masterId: existing.id, cleanName: existing.clean_name };
  }

  const { data, error } = await supabase
    .from("product_masters")
    .insert({
      clean_name: trimmedCleanName,
      category: trimmedCategory,
      subcategory: input.subcategory.trim() || null,
      quality_grade: input.qualityGrade.trim() || null,
      material: input.material.trim() || null,
    })
    .select("id, clean_name")
    .single();

  if (error || !data) {
    return {
      masterId: "",
      cleanName: "",
      error: error?.message || "Αποτυχία δημιουργίας master προϊόντος.",
    };
  }

  return { masterId: data.id, cleanName: data.clean_name };
}
