"use client";

import { ArrowLeft, Pencil } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

import { CategoryBadge } from "@/components/products/category-badge";
import { ProductColorStockSection } from "@/components/products/product-color-stock-section";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchProductColorVariants,
  setVariantActive,
  updateVariantStock,
} from "@/lib/products/color-variants";
import type { ProductColorVariant } from "@/lib/products/types";
import { formatDimensionsLabel } from "@/lib/products/form-utils";
import { premiumCard, premiumGoldButton } from "@/lib/ui/premium-styles";
import { createClient } from "@/lib/supabase/client";
import { formatCurrencyEl, mapProductRow, type ProductRow } from "@/types/database";
import { cn } from "@/lib/utils";

type ProductDetailViewProps = {
  productId: string;
};

export function ProductDetailView({ productId }: ProductDetailViewProps) {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [product, setProduct] = React.useState<ReturnType<typeof mapProductRow> | null>(
    null,
  );
  const [variants, setVariants] = React.useState<ProductColorVariant[]>([]);
  const [busy, setBusy] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();

    const { data, error: productError } = await supabase
      .from("products")
      .select("*")
      .eq("id", productId)
      .maybeSingle();

    if (productError || !data) {
      setError(productError?.message ?? "Το προϊόν δεν βρέθηκε.");
      setProduct(null);
      setVariants([]);
      setLoading(false);
      return;
    }

    const mapped = mapProductRow(data as ProductRow);
    const { variants: variantRows, error: variantError } =
      await fetchProductColorVariants(supabase, productId);

    if (variantError) {
      setError(variantError);
    }

    setProduct(mapped);
    setVariants(variantRows.filter((variant) => variant.isActive && variant.color));
    setLoading(false);
  }, [productId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function handleToggleProductActive() {
    if (!product) return;
    setBusy("product-active");
    const supabase = createClient();
    const next = !(product.isActive ?? true);
    const { error: updateError } = await supabase
      .from("products")
      .update({ is_active: next })
      .eq("id", productId);
    setBusy(null);
    if (updateError) {
      toast.error(updateError.message);
      return;
    }
    setProduct({ ...product, isActive: next });
  }

  async function handleSaveVariantStock(
    variant: ProductColorVariant,
    stock: number,
  ) {
    setBusy(variant.id);
    const supabase = createClient();
    const { error: updateError, totalStock } = await updateVariantStock(
      supabase,
      variant.id,
      productId,
      stock,
    );
    setBusy(null);
    if (updateError) {
      toast.error(updateError);
      return;
    }
    if (product && totalStock != null) {
      setProduct({ ...product, stock: totalStock });
    }
    void load();
  }

  async function handleToggleVariant(variant: ProductColorVariant) {
    setBusy(variant.id);
    const supabase = createClient();
    const { error: updateError, totalStock } = await setVariantActive(
      supabase,
      variant.id,
      productId,
      !variant.isActive,
    );
    setBusy(null);
    if (updateError) {
      toast.error(updateError);
      return;
    }
    if (product && totalStock != null) {
      setProduct({ ...product, stock: totalStock });
    }
    void load();
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Link
          href="/products"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-navy-900"
        >
          <ArrowLeft className="size-4" />
          Προϊόντα
        </Link>
        <p className="text-destructive">{error ?? "Το προϊόν δεν βρέθηκε."}</p>
      </div>
    );
  }

  const dimensionsLabel = formatDimensionsLabel(product);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        href="/products"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-navy-900"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Προϊόντα
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-navy-900">
            {product.name}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-gray-100 px-2 py-1 font-mono text-sm font-semibold text-navy-900">
              {product.sku}
            </span>
            <CategoryBadge category={product.category} />
            <button
              type="button"
              disabled={busy === "product-active"}
              onClick={() => void handleToggleProductActive()}
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-semibold",
                product.isActive !== false
                  ? "bg-success/10 text-success"
                  : "bg-gray-100 text-gray-500",
              )}
            >
              {product.isActive !== false ? "Ενεργό" : "Ανενεργό"}
            </button>
          </div>
        </div>
        <Button asChild className={premiumGoldButton}>
          <Link href={`/products/${productId}/edit`}>
            <Pencil className="size-4" />
            Επεξεργασία
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className={premiumCard}>
          <CardHeader>
            <CardTitle>Στοιχεία</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <p>
              <span className="text-gray-400">Barcode: </span>
              {product.barcode}
            </p>
            <p>
              <span className="text-gray-400">Τιμή αγοράς: </span>
              {formatCurrencyEl(product.purchasePrice)}
            </p>
            <p>
              <span className="text-gray-400">Τιμή πώλησης: </span>
              {formatCurrencyEl(product.salePrice)}
            </p>
            <p>
              <span className="text-gray-400">Ελάχιστο απόθεμα: </span>
              {product.minStock}
            </p>
            <p>
              <span className="text-gray-400">Προμηθευτής: </span>
              {product.supplier ?? "—"}
            </p>
          </CardContent>
        </Card>

        <Card className={premiumCard}>
          <CardHeader>
            <CardTitle>Διαστάσεις</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-gray-400">Διαστάσεις: </span>
              {dimensionsLabel ?? "—"}
            </p>
            <p>
              <span className="text-gray-400">Μονάδα: </span>
              {product.unit ?? "τεμ"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className={premiumCard}>
        <CardHeader>
          <CardTitle>Απόθεμα ανά χρώμα</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductColorStockSection
            totalStock={product.stock}
            minStock={product.minStock}
            variants={variants}
            busyId={busy}
            onSaveStock={(variant, stock) => void handleSaveVariantStock(variant, stock)}
            onToggleActive={(variant) => void handleToggleVariant(variant)}
          />
        </CardContent>
      </Card>

      {product.description ? (
        <Card className={premiumCard}>
          <CardHeader>
            <CardTitle>Περιγραφή</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">{product.description}</p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
