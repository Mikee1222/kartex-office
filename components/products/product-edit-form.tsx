"use client";

import { ProductForm } from "@/components/products/product-form/product-form";
import { type ProductEditInitial } from "@/types/database";

type ProductEditFormProps = {
  productId: string;
  initial: ProductEditInitial;
};

export function ProductEditForm({ productId, initial }: ProductEditFormProps) {
  return (
    <ProductForm
      mode="edit"
      title="Επεξεργασία προϊόντος"
      cancelHref={`/products/${productId}`}
      successHref={`/products/${productId}`}
      productId={productId}
      initial={initial}
    />
  );
}
