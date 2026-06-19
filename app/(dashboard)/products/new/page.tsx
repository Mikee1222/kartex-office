import { Suspense } from "react";

import { NewProductForm } from "@/components/products/new-product-form";

export default function NewProductPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-6xl p-8 text-sm text-gray-500">Φόρτωση φόρμας…</div>}>
      <NewProductForm />
    </Suspense>
  );
}
