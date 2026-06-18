import type { createClient } from "@/lib/supabase/client";

type SupabaseClient = ReturnType<typeof createClient>;

export type DeleteProductResult =
  | { ok: true }
  | { ok: false; error: string };

export async function deleteProduct(
  supabase: SupabaseClient,
  productId: string,
): Promise<DeleteProductResult> {
  const { error: variantsError } = await supabase
    .from("product_color_variants")
    .delete()
    .eq("product_id", productId);

  if (variantsError) {
    return { ok: false, error: variantsError.message };
  }

  const { error: movementsError } = await supabase
    .from("inventory_movements")
    .delete()
    .eq("product_id", productId);

  if (movementsError) {
    return { ok: false, error: movementsError.message };
  }

  const { error: productError } = await supabase
    .from("products")
    .delete()
    .eq("id", productId);

  if (productError) {
    return { ok: false, error: productError.message };
  }

  return { ok: true };
}
