import type { SupabaseClient } from "@supabase/supabase-js";

export type LookupRow = {
  id: string;
  name: string;
  isActive: boolean;
  sortOrder?: number;
};

export type CustomerTypeOptionRow = {
  id: string;
  label: string;
  dbKey: "hospital" | "hotel" | "walk-in";
  isActive: boolean;
  sortOrder: number;
};

type CategoryDbRow = {
  id: string;
  name: string;
  is_active: boolean;
};

type PaymentTermDbRow = {
  id: string;
  name: string;
  is_active: boolean;
  sort_order: number;
};

type CustomerTypeDbRow = {
  id: string;
  label: string;
  db_key: "hospital" | "hotel" | "walk-in";
  is_active: boolean;
  sort_order: number;
};

function mapCategory(row: CategoryDbRow): LookupRow {
  return {
    id: row.id,
    name: row.name,
    isActive: row.is_active,
  };
}

function mapPaymentTerm(row: PaymentTermDbRow): LookupRow {
  return {
    id: row.id,
    name: row.name,
    isActive: row.is_active,
    sortOrder: row.sort_order,
  };
}

function mapCustomerType(row: CustomerTypeDbRow): CustomerTypeOptionRow {
  return {
    id: row.id,
    label: row.label,
    dbKey: row.db_key,
    isActive: row.is_active,
    sortOrder: row.sort_order,
  };
}

export async function fetchProductCategories(
  supabase: SupabaseClient,
  activeOnly = false,
): Promise<{ items: LookupRow[]; error: string | null }> {
  let query = supabase
    .from("product_categories")
    .select("id, name, is_active")
    .order("name", { ascending: true });

  if (activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;
  if (error) return { items: [], error: error.message };
  return { items: (data as CategoryDbRow[]).map(mapCategory), error: null };
}

export async function insertProductCategory(
  supabase: SupabaseClient,
  name: string,
): Promise<{ item: LookupRow | null; error: string | null }> {
  const trimmed = name.trim();
  if (!trimmed) return { item: null, error: "Το όνομα είναι υποχρεωτικό." };

  const { data, error } = await supabase
    .from("product_categories")
    .insert({ name: trimmed, is_active: true })
    .select("id, name, is_active")
    .single();

  if (error) return { item: null, error: error.message };
  return { item: mapCategory(data as CategoryDbRow), error: null };
}

export async function updateLookupName(
  supabase: SupabaseClient,
  table: "product_categories" | "payment_term_options",
  id: string,
  name: string,
): Promise<{ error: string | null }> {
  const trimmed = name.trim();
  if (!trimmed) return { error: "Το όνομα είναι υποχρεωτικό." };

  const column = table === "product_categories" ? "name" : "name";
  const { error } = await supabase.from(table).update({ [column]: trimmed }).eq("id", id);
  return { error: error?.message ?? null };
}

export async function toggleLookupActive(
  supabase: SupabaseClient,
  table: "product_categories" | "payment_term_options" | "customer_type_options",
  id: string,
  isActive: boolean,
): Promise<{ error: string | null }> {
  const { error } = await supabase.from(table).update({ is_active: isActive }).eq("id", id);
  return { error: error?.message ?? null };
}

export async function deleteLookupRow(
  supabase: SupabaseClient,
  table: "product_categories" | "payment_term_options",
  id: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase.from(table).delete().eq("id", id);
  return { error: error?.message ?? null };
}

export async function fetchPaymentTermOptions(
  supabase: SupabaseClient,
  activeOnly = false,
): Promise<{ items: LookupRow[]; error: string | null }> {
  let query = supabase
    .from("payment_term_options")
    .select("id, name, is_active, sort_order")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;
  if (error) return { items: [], error: error.message };
  return { items: (data as PaymentTermDbRow[]).map(mapPaymentTerm), error: null };
}

export async function insertPaymentTermOption(
  supabase: SupabaseClient,
  name: string,
): Promise<{ item: LookupRow | null; error: string | null }> {
  const trimmed = name.trim();
  if (!trimmed) return { item: null, error: "Το όνομα είναι υποχρεωτικό." };

  const { data, error } = await supabase
    .from("payment_term_options")
    .insert({ name: trimmed, is_active: true })
    .select("id, name, is_active, sort_order")
    .single();

  if (error) return { item: null, error: error.message };
  return { item: mapPaymentTerm(data as PaymentTermDbRow), error: null };
}

export async function fetchCustomerTypeOptions(
  supabase: SupabaseClient,
  activeOnly = false,
): Promise<{ items: CustomerTypeOptionRow[]; error: string | null }> {
  let query = supabase
    .from("customer_type_options")
    .select("id, label, db_key, is_active, sort_order")
    .order("sort_order", { ascending: true })
    .order("label", { ascending: true });

  if (activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;
  if (error) return { items: [], error: error.message };
  return { items: (data as CustomerTypeDbRow[]).map(mapCustomerType), error: null };
}

export async function insertCustomerTypeOption(
  supabase: SupabaseClient,
  label: string,
  dbKey: "hospital" | "hotel" | "walk-in",
): Promise<{ item: CustomerTypeOptionRow | null; error: string | null }> {
  const trimmed = label.trim();
  if (!trimmed) return { item: null, error: "Η ετικέτα είναι υποχρεωτική." };

  const { data, error } = await supabase
    .from("customer_type_options")
    .insert({ label: trimmed, db_key: dbKey, is_active: true })
    .select("id, label, db_key, is_active, sort_order")
    .single();

  if (error) return { item: null, error: error.message };
  return { item: mapCustomerType(data as CustomerTypeDbRow), error: null };
}

export async function updateCustomerTypeLabel(
  supabase: SupabaseClient,
  id: string,
  label: string,
): Promise<{ error: string | null }> {
  const trimmed = label.trim();
  if (!trimmed) return { error: "Η ετικέτα είναι υποχρεωτική." };

  const { error } = await supabase
    .from("customer_type_options")
    .update({ label: trimmed })
    .eq("id", id);

  return { error: error?.message ?? null };
}

export async function deleteCustomerTypeOption(
  supabase: SupabaseClient,
  id: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("customer_type_options").delete().eq("id", id);
  return { error: error?.message ?? null };
}

type SimpleLookupDbRow = {
  id: string;
  name: string;
  is_active: boolean;
};

function mapSimpleLookup(row: SimpleLookupDbRow): LookupRow {
  return {
    id: row.id,
    name: row.name,
    isActive: row.is_active,
  };
}

async function fetchSimpleLookup(
  supabase: SupabaseClient,
  table: "materials" | "quality_grades",
  activeOnly: boolean,
): Promise<{ items: LookupRow[]; error: string | null }> {
  let query = supabase
    .from(table)
    .select("id, name, is_active")
    .order("name", { ascending: true });

  if (activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;
  if (error) return { items: [], error: error.message };
  return { items: (data as SimpleLookupDbRow[]).map(mapSimpleLookup), error: null };
}

async function insertSimpleLookup(
  supabase: SupabaseClient,
  table: "materials" | "quality_grades",
  name: string,
): Promise<{ item: LookupRow | null; error: string | null }> {
  const trimmed = name.trim();
  if (!trimmed) return { item: null, error: "Το όνομα είναι υποχρεωτικό." };

  const { data, error } = await supabase
    .from(table)
    .insert({ name: trimmed, is_active: true })
    .select("id, name, is_active")
    .single();

  if (error) return { item: null, error: error.message };
  return { item: mapSimpleLookup(data as SimpleLookupDbRow), error: null };
}

export async function fetchMaterials(
  supabase: SupabaseClient,
  activeOnly = false,
): Promise<{ items: LookupRow[]; error: string | null }> {
  return fetchSimpleLookup(supabase, "materials", activeOnly);
}

export async function insertMaterial(
  supabase: SupabaseClient,
  name: string,
): Promise<{ item: LookupRow | null; error: string | null }> {
  return insertSimpleLookup(supabase, "materials", name);
}

export async function fetchQualityGrades(
  supabase: SupabaseClient,
  activeOnly = false,
): Promise<{ items: LookupRow[]; error: string | null }> {
  return fetchSimpleLookup(supabase, "quality_grades", activeOnly);
}

export async function insertQualityGrade(
  supabase: SupabaseClient,
  name: string,
): Promise<{ item: LookupRow | null; error: string | null }> {
  return insertSimpleLookup(supabase, "quality_grades", name);
}

export async function updateSimpleLookupName(
  supabase: SupabaseClient,
  table: "materials" | "quality_grades" | "product_categories" | "payment_term_options",
  id: string,
  name: string,
): Promise<{ error: string | null }> {
  const trimmed = name.trim();
  if (!trimmed) return { error: "Το όνομα είναι υποχρεωτικό." };

  const { error } = await supabase.from(table).update({ name: trimmed }).eq("id", id);
  return { error: error?.message ?? null };
}

export async function toggleSimpleLookupActive(
  supabase: SupabaseClient,
  table:
    | "materials"
    | "quality_grades"
    | "product_categories"
    | "payment_term_options"
    | "customer_type_options",
  id: string,
  isActive: boolean,
): Promise<{ error: string | null }> {
  const { error } = await supabase.from(table).update({ is_active: isActive }).eq("id", id);
  return { error: error?.message ?? null };
}

export async function deleteSimpleLookupRow(
  supabase: SupabaseClient,
  table: "materials" | "quality_grades" | "product_categories" | "payment_term_options",
  id: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase.from(table).delete().eq("id", id);
  return { error: error?.message ?? null };
}
