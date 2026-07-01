import type { createClient } from "@/lib/supabase/client";

type SupabaseClient = ReturnType<typeof createClient>;

export type SetMasterActiveResult =
  | { ok: true }
  | { ok: false; error: string };

export async function setMasterActive(
  supabase: SupabaseClient,
  masterId: string,
  isActive: boolean,
): Promise<SetMasterActiveResult> {
  const { error } = await supabase
    .from("product_masters")
    .update({ is_active: isActive })
    .eq("id", masterId);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
