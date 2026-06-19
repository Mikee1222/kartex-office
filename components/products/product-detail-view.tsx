"use client";

import {
  ArrowLeft,
  Box,
  Layers,
  Pencil,
  Palette,
  TrendingUp,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

import { CategoryBadge, getCategoryIconClass } from "@/components/products/category-badge";
import { ProductColorStockSection } from "@/components/products/product-color-stock-section";
import { StockStatusBadge } from "@/components/products/stock-status-badge";
import { getStockStatus } from "@/components/products/types";
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
import { calcMargin } from "@/lib/reports/compute-analytics";
import {
  premiumCard,
  premiumGoldButton,
  premiumLabel,
  premiumStatCard,
} from "@/lib/ui/premium-styles";
import { createClient } from "@/lib/supabase/client";
import {
  formatCurrencyEl,
  formatDateEl,
  mapProductRow,
  type ProductRow,
} from "@/types/database";
import { cn } from "@/lib/utils";

type ProductDetailViewProps = {
  productId: string;
};

function marginBadgeClass(marginPct: number): string {
  if (marginPct > 30) return "bg-emerald-100 text-emerald-800";
  if (marginPct > 15) return "bg-amber-100 text-amber-900";
  return "bg-red-100 text-red-800";
}

function DetailField({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className={premiumLabel}>{label}</p>
      <p className="mt-1 text-sm font-medium text-navy-900">{value}</p>
    </div>
  );
}

function ProductDetailSkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-40 w-full rounded-2xl" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-24 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  );
}

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
    return <ProductDetailSkeleton />;
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
  const marginPct = calcMargin(product.purchasePrice, product.salePrice);
  const profitPerUnit = product.salePrice - product.purchasePrice;
  const inventoryValue = product.stock * product.purchasePrice;
  const unit = product.unit?.trim() || "τεμ";
  const stockStatus = getStockStatus(product.stock, product.minStock);

  const stockStatusTone: Record<typeof stockStatus, string> = {
    adequate: "text-emerald-600",
    low: "text-amber-600",
    critical: "text-red-600",
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        href="/products"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-400 transition-colors hover:text-navy-900"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Προϊόντα
      </Link>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 p-6 shadow-card sm:p-8">
        <div
          className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-gold-500/10 blur-3xl"
          aria-hidden
        />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4">
            <span
              className={cn(
                "flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white backdrop-blur-sm",
                getCategoryIconClass(product.category),
              )}
            >
              <Box className="size-7" aria-hidden />
            </span>
            <div className="min-w-0 space-y-3">
              <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                {product.cleanName || product.name}
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-white/15 px-2.5 py-1 font-mono text-sm font-semibold text-white backdrop-blur-sm">
                  {product.sku}
                </span>
                <CategoryBadge category={product.category} />
                <button
                  type="button"
                  disabled={busy === "product-active"}
                  onClick={() => void handleToggleProductActive()}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-semibold transition-colors",
                    product.isActive !== false
                      ? "bg-success/20 text-emerald-200"
                      : "bg-white/10 text-white/60",
                  )}
                >
                  {product.isActive !== false ? "Ενεργό" : "Ανενεργό"}
                </button>
              </div>
            </div>
          </div>
          <Button
            asChild
            className={cn(premiumGoldButton, "shrink-0")}
          >
            <Link href={`/products/${productId}/edit`}>
              <Pencil className="size-4" />
              Επεξεργασία
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article className={cn(premiumStatCard, "p-5")}>
          <div className="flex items-center gap-2 text-gray-400">
            <Layers className="size-4" aria-hidden />
            <p className="text-xs font-medium uppercase tracking-wide">Συνολικό Απόθεμα</p>
          </div>
          <p className={cn("mt-2 text-[28px] font-semibold leading-none tabular-nums", stockStatusTone[stockStatus])}>
            {product.stock}
          </p>
          <p className="mt-1 text-sm text-gray-400">{unit}</p>
        </article>
        <article className={cn(premiumStatCard, "p-5")}>
          <div className="flex items-center gap-2 text-gray-400">
            <Wallet className="size-4" aria-hidden />
            <p className="text-xs font-medium uppercase tracking-wide">Τιμή Αγοράς</p>
          </div>
          <p className="mt-2 text-[28px] font-semibold leading-none text-navy-900">
            {formatCurrencyEl(product.purchasePrice)}
          </p>
        </article>
        <article className={cn(premiumStatCard, "p-5")}>
          <div className="flex items-center gap-2 text-gray-400">
            <TrendingUp className="size-4" aria-hidden />
            <p className="text-xs font-medium uppercase tracking-wide">Τιμή Πώλησης</p>
          </div>
          <p className="mt-2 text-[28px] font-semibold leading-none text-navy-900">
            {formatCurrencyEl(product.salePrice)}
          </p>
        </article>
        <article className={cn(premiumStatCard, "p-5")}>
          <div className="flex items-center gap-2 text-gray-400">
            <TrendingUp className="size-4" aria-hidden />
            <p className="text-xs font-medium uppercase tracking-wide">Περιθώριο %</p>
          </div>
          <p className="mt-2">
            <span
              className={cn(
                "inline-flex rounded-full px-3 py-1 text-xl font-semibold tabular-nums",
                marginBadgeClass(marginPct),
              )}
            >
              {marginPct.toFixed(1)}%
            </span>
          </p>
        </article>
      </section>

      {/* Info grid */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className={premiumCard}>
          <CardHeader>
            <CardTitle className="text-lg text-navy-900">Στοιχεία</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <DetailField label="Barcode" value={product.barcode} />
            <DetailField label="Προμηθευτής" value={product.supplier?.trim() || "—"} />
            <DetailField label="Ελάχιστο απόθεμα" value={String(product.minStock)} />
            <DetailField
              label="Δημιουργία"
              value={product.createdAt ? formatDateEl(product.createdAt) : "—"}
            />
            {product.material ? (
              <DetailField label="Υλικό" value={product.material} />
            ) : null}
            {product.qualityGrade ? (
              <DetailField label="Ποιότητα" value={product.qualityGrade} />
            ) : null}
            {product.gsm != null ? (
              <DetailField label="GSM" value={String(product.gsm)} />
            ) : null}
            {product.threadCount != null ? (
              <DetailField label="Αριθμός νημάτων" value={`T${product.threadCount}`} />
            ) : null}
            {product.subcategory ? (
              <DetailField label="Υποκατηγορία" value={product.subcategory} />
            ) : null}
          </CardContent>
        </Card>

        <Card className={premiumCard}>
          <CardHeader>
            <CardTitle className="text-lg text-navy-900">Διαστάσεις</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <DetailField label="Διαστάσεις" value={dimensionsLabel ?? "—"} />
            <DetailField label="Μονάδα" value={unit} />
            {product.widthCm != null ? (
              <DetailField label="Πλάτος" value={`${product.widthCm} cm`} />
            ) : null}
            {product.heightCm != null ? (
              <DetailField label="Ύψος" value={`${product.heightCm} cm`} />
            ) : null}
            {product.weightKg != null ? (
              <DetailField label="Βάρος" value={`${product.weightKg} kg`} />
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* Color variants */}
      <Card className={premiumCard}>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2 text-lg text-navy-900">
            <Palette className="size-5 text-gold-500" aria-hidden />
            Απόθεμα ανά χρώμα
          </CardTitle>
        </CardHeader>
        <CardContent>
          {variants.length === 0 ? (
            product.color?.trim() ? (
              <div className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:max-w-sm">
                <div className="flex items-start gap-4">
                  <span
                    className="flex size-16 shrink-0 items-center justify-center rounded-full border-2 border-gray-200 bg-gray-100"
                    aria-hidden
                  >
                    <Palette className="size-7 text-gray-400" />
                  </span>
                  <div className="min-w-0 flex-1 pt-1">
                    <p className="text-base font-bold text-navy-900">{product.color.trim()}</p>
                    <StockStatusBadge
                      stock={product.stock}
                      minStock={product.minStock}
                      className="mt-2"
                    />
                  </div>
                </div>
                <div className="mt-5 text-center">
                  <p className="text-4xl font-bold tabular-nums text-navy-900">{product.stock}</p>
                  <p className="text-sm text-gray-400">{unit}</p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 px-6 py-10 text-center">
                <Palette className="mx-auto size-10 text-gray-300" aria-hidden />
                <p className="mt-3 text-sm font-medium text-navy-900">
                  Δεν έχουν οριστεί ενεργά χρώματα
                </p>
                <p className="mt-1 text-sm text-gray-400">
                  Προσθέστε χρώματα και απόθεμα από τη φόρμα επεξεργασίας.
                </p>
                <Button asChild variant="outline" className="mt-4 border-gold-500/40 text-navy-900 hover:bg-gold-500/10">
                  <Link href={`/products/${productId}/edit`}>
                    <Pencil className="size-4" />
                    Επεξεργασία προϊόντος
                  </Link>
                </Button>
              </div>
            )
          ) : (
            <ProductColorStockSection
              totalStock={product.stock}
              minStock={product.minStock}
              variants={variants}
              busyId={busy}
              onSaveStock={(variant, stock) => void handleSaveVariantStock(variant, stock)}
              onToggleActive={(variant) => void handleToggleVariant(variant)}
            />
          )}
        </CardContent>
      </Card>

      {/* Financials */}
      <Card className={premiumCard}>
        <CardHeader>
          <CardTitle className="text-lg text-navy-900">Οικονομικά</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
              <dt className={premiumLabel}>Κόστος</dt>
              <dd className="mt-1 text-lg font-semibold tabular-nums text-navy-900">
                {formatCurrencyEl(product.purchasePrice)}
              </dd>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
              <dt className={premiumLabel}>Πώληση</dt>
              <dd className="mt-1 text-lg font-semibold tabular-nums text-navy-900">
                {formatCurrencyEl(product.salePrice)}
              </dd>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
              <dt className={premiumLabel}>Περιθώριο %</dt>
              <dd className="mt-1">
                <span
                  className={cn(
                    "inline-flex rounded-full px-2.5 py-0.5 text-sm font-semibold tabular-nums",
                    marginBadgeClass(marginPct),
                  )}
                >
                  {marginPct.toFixed(1)}%
                </span>
              </dd>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
              <dt className={premiumLabel}>Κέρδος/τεμ</dt>
              <dd className="mt-1 text-lg font-semibold tabular-nums text-navy-900">
                {formatCurrencyEl(profitPerUnit)}
              </dd>
            </div>
            <div className="rounded-xl border border-gold-500/20 bg-gold-500/5 p-4 sm:col-span-2 lg:col-span-1">
              <dt className={premiumLabel}>Συνολική Αξία Αποθέματος</dt>
              <dd className="mt-1 text-lg font-semibold tabular-nums text-navy-900">
                {formatCurrencyEl(inventoryValue)}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {product.description?.trim() ? (
        <Card className={premiumCard}>
          <CardHeader>
            <CardTitle className="text-lg text-navy-900">Περιγραφή</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-gray-600">{product.description.trim()}</p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
