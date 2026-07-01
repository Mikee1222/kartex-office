import { notFound } from "next/navigation";

import { ProductEditForm } from "@/components/products/product-edit-form";
import { fetchProductColorVariants } from "@/lib/products/color-variants";
import { createClient } from "@/lib/supabase/server";
import { mapProductRowToEditInitial, type ProductRow } from "@/types/database";

type ProductEditPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProductEditPage({ params }: ProductEditPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase.from("products").select("*").eq("id", id).single();

  if (error || !data) {
    notFound();
  }

  const { variants } = await fetchProductColorVariants(supabase, id, true);
  const colorSelections = variants
    .filter((variant) => variant.isActive)
    .map((variant) => ({
      colorId: variant.colorId,
      stock: variant.stock,
      isPrimary: variant.isPrimary,
    }));

  const initial = mapProductRowToEditInitial(data as ProductRow, colorSelections);

  return <ProductEditForm productId={id} initial={initial} />;
}
