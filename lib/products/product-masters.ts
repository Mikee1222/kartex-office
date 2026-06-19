import type { SupabaseClient } from "@supabase/supabase-js";

export type ProductMasterRow = {
  id: string;
  clean_name: string;
  category: string;
  subcategory?: string | null;
  quality_grade?: string | null;
  material?: string | null;
};

export type ProductMasterOption = {
  id: string;
  cleanName: string;
  category: string;
  subcategory?: string;
  qualityGrade?: string;
  material?: string;
};

export function mapProductMasterRow(row: ProductMasterRow): ProductMasterOption {
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

export type ResolveProductMasterInput = {
  mode: "new" | "existing";
  masterId: string | null;
  cleanName: string;
  category: string;
  subcategory: string;
  qualityGrade: string;
  material: string;
};

export async function resolveProductMasterId(
  supabase: SupabaseClient,
  input: ResolveProductMasterInput,
): Promise<{ masterId: string; cleanName: string; error?: string }> {
  const trimmedCleanName = input.cleanName.trim();
  const trimmedCategory = input.category.trim();

  if (input.mode === "existing") {
    if (!input.masterId) {
      return { masterId: "", cleanName: "", error: "Επιλέξτε master προϊόν." };
    }

    const { data, error } = await supabase
      .from("product_masters")
      .select("id, clean_name")
      .eq("id", input.masterId)
      .maybeSingle();

    if (error || !data) {
      return {
        masterId: "",
        cleanName: "",
        error: error?.message || "Το επιλεγμένο master προϊόν δεν βρέθηκε.",
      };
    }

    return { masterId: data.id, cleanName: data.clean_name };
  }

  if (!trimmedCleanName) {
    return { masterId: "", cleanName: "", error: "Το clean name του master είναι υποχρεωτικό." };
  }
  if (!trimmedCategory) {
    return { masterId: "", cleanName: "", error: "Η κατηγορία του master είναι υποχρεωτική." };
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

export function resolveProductCleanName(
  selectedMaster: string,
  newMasterName: string,
  cleanName: string,
  masters: ProductMasterRow[],
): string | null {
  if (selectedMaster === "new") {
    const trimmed = newMasterName.trim() || cleanName.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (selectedMaster) {
    const master = masters.find((item) => item.id === selectedMaster);
    const trimmed = master?.clean_name ?? cleanName.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  const trimmed = cleanName.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function ensureProductMaster(
  supabase: SupabaseClient,
  input: {
    selectedMaster: string;
    newMasterName: string;
    category: string;
    subcategory: string;
    qualityGrade: string;
    material: string;
    masters: ProductMasterRow[];
  },
): Promise<{ masterId: string | null; cleanName: string | null; error?: string }> {
  if (input.selectedMaster === "new") {
    const result = await resolveProductMasterId(supabase, {
      mode: "new",
      masterId: null,
      cleanName: input.newMasterName,
      category: input.category,
      subcategory: input.subcategory,
      qualityGrade: input.qualityGrade,
      material: input.material,
    });
    if (result.error) {
      return { masterId: null, cleanName: null, error: result.error };
    }
    return { masterId: result.masterId, cleanName: result.cleanName };
  }

  const result = await resolveProductMasterId(supabase, {
    mode: "existing",
    masterId: input.selectedMaster,
    cleanName: "",
    category: input.category,
    subcategory: input.subcategory,
    qualityGrade: input.qualityGrade,
    material: input.material,
  });
  if (result.error) {
    return { masterId: null, cleanName: null, error: result.error };
  }
  return { masterId: result.masterId, cleanName: result.cleanName };
}

export async function fetchProductMastersAsRows(
  supabase: SupabaseClient,
): Promise<{ data: ProductMasterRow[]; error?: string }> {
  const { masters, error } = await fetchProductMasters(supabase);
  return {
    data: masters.map((master) => ({
      id: master.id,
      clean_name: master.cleanName,
      category: master.category,
      subcategory: master.subcategory ?? null,
      quality_grade: master.qualityGrade ?? null,
      material: master.material ?? null,
    })),
    error,
  };
}
