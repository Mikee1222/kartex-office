import type { createClient } from "@/lib/supabase/client";

type SupabaseClient = ReturnType<typeof createClient>;

export type SetProductActiveResult =
  | { ok: true }
  | { ok: false; error: string };

export async function setProductActive(
  supabase: SupabaseClient,
  productId: string,
  isActive: boolean,
): Promise<SetProductActiveResult> {
  const { error } = await supabase
    .from("products")
    .update({ is_active: isActive })
    .eq("id", productId);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
