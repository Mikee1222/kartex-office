"use client";

import { useSearchParams } from "next/navigation";

import { ProductForm } from "@/components/products/product-form/product-form";

export function NewProductForm() {
  const searchParams = useSearchParams();
  const presetMasterId = searchParams.get("master");

  return (
    <ProductForm
      mode="new"
      cancelHref="/products"
      successHref="/products"
      presetMasterId={presetMasterId}
    />
  );
}
