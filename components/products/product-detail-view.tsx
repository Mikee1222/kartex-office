"use client";

import {
  Layers,
  Pencil,
  Palette,
  Ruler,
  TrendingUp,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

import { CategoryBadge } from "@/components/products/category-badge";
import { ProductColorStockSection } from "@/components/products/product-color-stock-section";
import {
  DetailField,
  marginBadgeClass,
  premiumGoldButton,
  ProductDetailBackLink,
  ProductDetailHero,
  ProductDetailSkeleton,
  ProductDetailStatCard,
  ProductFinancialsCard,
} from "@/components/products/product-detail-ui";
import { getStockStatus } from "@/components/products/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  fetchProductColorVariants,
  setVariantActive,
  updateVariantStock,
} from "@/lib/products/color-variants";
import type { ProductColorVariant } from "@/lib/products/types";
import { formatDimensionsLabel } from "@/lib/products/form-utils";
import { calcMargin } from "@/lib/reports/compute-analytics";
import { premiumCard } from "@/lib/ui/premium-styles";
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
        <ProductDetailBackLink href="/products" label="Προϊόντα" />
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
      <ProductDetailBackLink href="/products" label="Προϊόντα" />

      <ProductDetailHero
        title={product.cleanName || product.name}
        category={product.category}
        isActive={product.isActive !== false}
        onToggleActive={() => void handleToggleProductActive()}
        toggleBusy={busy === "product-active"}
        badges={
          <span className="rounded-md bg-white/15 px-2.5 py-1 font-mono text-sm font-semibold text-white backdrop-blur-sm">
            {product.sku}
          </span>
        }
        editAction={
          <Button asChild className={premiumGoldButton}>
            <Link href={`/products/${productId}/edit`}>
              <Pencil className="size-4" />
              Επεξεργασία
            </Link>
          </Button>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        <div className={cn(premiumCard, "p-5")}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-bold text-navy-900">
              <Palette size={16} className="text-gold-500" aria-hidden />
              Χρώματα
            </h3>
            <Link
              href={`/products/${productId}/edit`}
              className="text-xs font-medium text-gold-600 transition-colors hover:text-gold-500 hover:underline"
            >
              + Προσθήκη
            </Link>
          </div>
          {variants.length === 0 ? (
            <p className="text-sm text-gray-400">Δεν έχουν οριστεί χρώματα</p>
          ) : (
            <div className="space-y-2">
              {variants.map((variant) => (
                <div key={variant.id} className="flex items-center gap-3">
                  <span
                    className="size-5 shrink-0 rounded-full border border-black/10"
                    style={{ backgroundColor: variant.color?.hexCode ?? "#ccc" }}
                    aria-hidden
                  />
                  <span className="flex-1 truncate text-sm font-medium text-navy-900">
                    {variant.color?.name}
                  </span>
                  <span
                    className={cn(
                      "text-sm font-bold tabular-nums",
                      variant.stock <= 0
                        ? "text-red-600"
                        : variant.stock <= product.minStock
                          ? "text-amber-600"
                          : "text-emerald-700",
                    )}
                  >
                    {variant.stock}
                  </span>
                  <span className="text-xs text-gray-400">τεμ.</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={cn(premiumCard, "p-5")}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-bold text-navy-900">
              <Ruler size={16} className="text-gold-500" aria-hidden />
              Διαστάσεις & Specs
            </h3>
            <Link
              href={`/products/${productId}/edit`}
              className="text-xs font-medium text-gold-600 transition-colors hover:text-gold-500 hover:underline"
            >
              Επεξεργασία
            </Link>
          </div>
          <div className="space-y-3">
            {product.widthCm != null && product.heightCm != null ? (
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-gray-400">Διαστάσεις</span>
                <span className="rounded-lg bg-navy-900/5 px-2.5 py-1 text-sm font-semibold text-navy-900">
                  {product.widthCm}×{product.heightCm} cm
                </span>
              </div>
            ) : null}
            {product.widthCm != null && product.heightCm == null ? (
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-gray-400">Φάρδος</span>
                <span className="rounded-lg bg-navy-900/5 px-2.5 py-1 text-sm font-semibold text-navy-900">
                  Φ{product.widthCm} cm
                </span>
              </div>
            ) : null}
            {product.gsm != null ? (
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-gray-400">Πυκνότητα</span>
                <span className="rounded-lg bg-navy-900/5 px-2.5 py-1 text-sm font-semibold text-navy-900">
                  {product.gsm} gsm
                </span>
              </div>
            ) : null}
            {product.threadCount != null ? (
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-gray-400">Νήματα</span>
                <span className="rounded-lg bg-navy-900/5 px-2.5 py-1 text-sm font-semibold text-navy-900">
                  T{product.threadCount}
                </span>
              </div>
            ) : null}
            {product.unit ? (
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-gray-400">Μονάδα</span>
                <span className="text-sm font-semibold text-navy-900">{product.unit}</span>
              </div>
            ) : null}
            {product.widthCm == null &&
            product.gsm == null &&
            product.threadCount == null ? (
              <p className="text-sm text-gray-400">Δεν έχουν οριστεί διαστάσεις</p>
            ) : null}
          </div>
        </div>

        <div className={cn(premiumCard, "p-5")}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-bold text-navy-900">
              <Layers size={16} className="text-gold-500" aria-hidden />
              Ποιότητα & Υλικό
            </h3>
            <Link
              href={`/products/${productId}/edit`}
              className="text-xs font-medium text-gold-600 transition-colors hover:text-gold-500 hover:underline"
            >
              Επεξεργασία
            </Link>
          </div>
          <div className="space-y-3">
            {product.qualityGrade ? (
              <div>
                <div className="mb-1.5 text-xs text-gray-400">Σειρά / Ποιότητα</div>
                <div className="inline-flex items-center gap-2 rounded-xl border border-gold-500/20 bg-gold-500/10 px-3 py-2">
                  <span className="text-sm font-bold text-navy-900">
                    {product.qualityGrade}
                  </span>
                </div>
              </div>
            ) : null}
            {product.material ? (
              <div>
                <div className="mb-1.5 text-xs text-gray-400">Υλικό</div>
                <div className="rounded-xl bg-navy-900/5 px-3 py-2 text-sm font-medium text-navy-900">
                  {product.material}
                </div>
              </div>
            ) : null}
            {product.subcategory ? (
              <div>
                <div className="mb-1.5 text-xs text-gray-400">Υποκατηγορία</div>
                <div className="rounded-xl bg-navy-900/5 px-3 py-2 text-sm font-medium text-navy-900">
                  {product.subcategory}
                </div>
              </div>
            ) : null}
            {product.category ? (
              <div>
                <div className="mb-1.5 text-xs text-gray-400">Κατηγορία</div>
                <CategoryBadge category={product.category} />
              </div>
            ) : null}
            {!product.qualityGrade && !product.material && !product.subcategory ? (
              <p className="text-sm text-gray-400">Δεν έχουν οριστεί στοιχεία ποιότητας</p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ProductDetailStatCard
          icon={Layers}
          label="Συνολικό Απόθεμα"
          value={product.stock}
          hint={unit}
          valueClassName={stockStatusTone[stockStatus]}
        />
        <ProductDetailStatCard
          icon={Wallet}
          label="Τιμή Αγοράς"
          value={formatCurrencyEl(product.purchasePrice)}
        />
        <ProductDetailStatCard
          icon={TrendingUp}
          label="Τιμή Πώλησης"
          value={formatCurrencyEl(product.salePrice)}
        />
        <ProductDetailStatCard
          icon={TrendingUp}
          label="Περιθώριο %"
          value={
            <span
              className={cn(
                "inline-flex rounded-full px-3 py-1 text-xl font-semibold tabular-nums",
                marginBadgeClass(marginPct),
              )}
            >
              {marginPct.toFixed(1)}%
            </span>
          }
        />
      </section>

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

      <Card className={premiumCard}>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2 text-lg text-navy-900">
            <Palette className="size-5 text-gold-500" aria-hidden />
            Απόθεμα ανά χρώμα
          </CardTitle>
        </CardHeader>
        <CardContent>
          {variants.length === 0 ? (
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

      <ProductFinancialsCard
        items={[
          { label: "Κόστος", value: formatCurrencyEl(product.purchasePrice) },
          { label: "Πώληση", value: formatCurrencyEl(product.salePrice) },
          {
            label: "Περιθώριο %",
            value: (
              <span
                className={cn(
                  "inline-flex rounded-full px-2.5 py-0.5 text-sm font-semibold tabular-nums",
                  marginBadgeClass(marginPct),
                )}
              >
                {marginPct.toFixed(1)}%
              </span>
            ),
          },
          { label: "Κέρδος/τεμ", value: formatCurrencyEl(profitPerUnit) },
          {
            label: "Συνολική Αξία Αποθέματος",
            value: formatCurrencyEl(inventoryValue),
            highlight: true,
          },
        ]}
      />

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
