"use client";

import { ProductForm } from "@/components/products/product-form/product-form";

export function NewProductForm() {
  return (
    <ProductForm
      mode="new"
      cancelHref="/products"
      successHref="/products"
    />
  );
}
