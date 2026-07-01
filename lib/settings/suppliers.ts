import type { SupabaseClient } from "@supabase/supabase-js";

export type SupplierRow = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  region: string | null;
  country: string;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
};

type SupplierDbRow = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  region: string | null;
  country: string;
  notes: string | null;
  is_active: boolean;
  created_at: string;
};

export type SupplierInput = {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  region?: string;
  country?: string;
  notes?: string;
};

function mapSupplier(row: SupplierDbRow): SupplierRow {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    address: row.address,
    region: row.region,
    country: row.country,
    notes: row.notes,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

export async function fetchSuppliers(
  supabase: SupabaseClient,
  activeOnly = false,
): Promise<{ items: SupplierRow[]; error: string | null }> {
  let query = supabase
    .from("suppliers")
    .select(
      "id, name, phone, email, address, region, country, notes, is_active, created_at",
    )
    .order("name", { ascending: true });

  if (activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;
  if (error) return { items: [], error: error.message };
  return { items: (data as SupplierDbRow[]).map(mapSupplier), error: null };
}

export async function insertSupplier(
  supabase: SupabaseClient,
  input: SupplierInput,
): Promise<{ item: SupplierRow | null; error: string | null }> {
  const name = input.name.trim();
  if (!name) return { item: null, error: "Το όνομα είναι υποχρεωτικό." };

  const { data, error } = await supabase
    .from("suppliers")
    .insert({
      name,
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      address: input.address?.trim() || null,
      region: input.region?.trim() || null,
      country: input.country?.trim() || "Ελλάδα",
      notes: input.notes?.trim() || null,
      is_active: true,
    })
    .select(
      "id, name, phone, email, address, region, country, notes, is_active, created_at",
    )
    .single();

  if (error) return { item: null, error: error.message };
  return { item: mapSupplier(data as SupplierDbRow), error: null };
}

export async function updateSupplier(
  supabase: SupabaseClient,
  id: string,
  input: SupplierInput,
): Promise<{ error: string | null }> {
  const name = input.name.trim();
  if (!name) return { error: "Το όνομα είναι υποχρεωτικό." };

  const { error } = await supabase
    .from("suppliers")
    .update({
      name,
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      address: input.address?.trim() || null,
      region: input.region?.trim() || null,
      country: input.country?.trim() || "Ελλάδα",
      notes: input.notes?.trim() || null,
    })
    .eq("id", id);

  return { error: error?.message ?? null };
}

export async function toggleSupplierActive(
  supabase: SupabaseClient,
  id: string,
  isActive: boolean,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("suppliers")
    .update({ is_active: isActive })
    .eq("id", id);
  return { error: error?.message ?? null };
}

export async function deleteSupplier(
  supabase: SupabaseClient,
  id: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("suppliers").delete().eq("id", id);
  return { error: error?.message ?? null };
}

export async function getSupplierById(
  supabase: SupabaseClient,
  id: string,
): Promise<{ item: SupplierRow | null; error: string | null }> {
  const { data, error } = await supabase
    .from("suppliers")
    .select(
      "id, name, phone, email, address, region, country, notes, is_active, created_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) return { item: null, error: error.message };
  if (!data) return { item: null, error: null };
  return { item: mapSupplier(data as SupplierDbRow), error: null };
}
