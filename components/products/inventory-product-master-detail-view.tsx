"use client";

import { Box, Layers, Pencil, TrendingUp, Wallet } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { InventoryMasterVariantsPanel } from "@/components/products/inventory-master-variants-panel";
import {
  marginBadgeClass,
  premiumGoldButton,
  ProductColorsSummaryCard,
  ProductDetailBackLink,
  ProductDetailHero,
  ProductDetailSkeleton,
  ProductDetailStatCard,
  ProductFinancialsCard,
  ProductImagesCard,
  ProductQualityMaterialCard,
} from "@/components/products/product-detail-ui";
import {
  ProductMasterEditDialog,
  type ProductMasterEditFormValues,
} from "@/components/products/product-master-edit-dialog";
import { WebsiteMasterImagesEditor } from "@/components/website/website-master-images-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchVariantsForProducts } from "@/lib/products/color-variants";
import {
  computeMasterInventoryStats,
  formatInternalPriceRange,
  INVENTORY_PRODUCT_MASTER_DETAIL_SELECT,
  mapInventoryProductMasterRow,
  type InventoryProductMasterRow,
  type MasterColorSummary,
} from "@/lib/products/product-master-detail";
import { setMasterActive } from "@/lib/products/set-master-active";
import { premiumCard } from "@/lib/ui/premium-styles";
import { createClient } from "@/lib/supabase/client";
import type { ProductColorVariant } from "@/lib/products/types";
import { formatCurrencyEl } from "@/types/database";
import { cn } from "@/lib/utils";

type InventoryProductMasterDetailViewProps = {
  master: InventoryProductMasterRow;
  onMasterChange: (master: InventoryProductMasterRow) => void;
};

function collectMasterColors(
  variantsByProduct: Map<string, ProductColorVariant[]>,
): MasterColorSummary[] {
  const colorMap = new Map<string, MasterColorSummary>();

  for (const variants of variantsByProduct.values()) {
    for (const variant of variants) {
      if (!variant.isActive || !variant.color) continue;
      const existing = colorMap.get(variant.color.id);
      if (existing) {
        existing.totalStock += variant.stock;
        continue;
      }
      colorMap.set(variant.color.id, {
        id: variant.color.id,
        name: variant.color.name,
        hexCode: variant.color.hexCode ?? "#ccc",
        totalStock: variant.stock,
      });
    }
  }

  return Array.from(colorMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name, "el"),
  );
}

export function InventoryProductMasterDetailView({
  master,
  onMasterChange,
}: InventoryProductMasterDetailViewProps) {
  const [saving, setSaving] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [variantsByProduct, setVariantsByProduct] = React.useState<
    Map<string, ProductColorVariant[]>
  >(new Map());
  const [formValues, setFormValues] = React.useState<ProductMasterEditFormValues>({
    cleanName: master.cleanName,
    category: master.category,
    subcategory: master.subcategory ?? "",
    qualityGrade: master.qualityGrade ?? "",
    materialId: master.materialId ?? null,
    materialName: master.materialName ?? master.material ?? null,
    description: master.description ?? "",
  });

  const variantIds = React.useMemo(
    () => master.variants.map((variant) => variant.id).join(","),
    [master.variants],
  );

  React.useEffect(() => {
    setFormValues({
      cleanName: master.cleanName,
      category: master.category,
      subcategory: master.subcategory ?? "",
      qualityGrade: master.qualityGrade ?? "",
      materialId: master.materialId ?? null,
      materialName: master.materialName ?? master.material ?? null,
      description: master.description ?? "",
    });
  }, [master]);

  React.useEffect(() => {
    let cancelled = false;

    async function loadColorVariants() {
      const ids = variantIds.length > 0 ? variantIds.split(",") : [];
      if (ids.length === 0) {
        setVariantsByProduct(new Map());
        return;
      }

      const supabase = createClient();
      const map = await fetchVariantsForProducts(supabase, ids);
      if (!cancelled) {
        setVariantsByProduct(map);
      }
    }

    void loadColorVariants();
    return () => {
      cancelled = true;
    };
  }, [variantIds]);

  const stats = computeMasterInventoryStats(master.variants);
  const masterColors = collectMasterColors(variantsByProduct);
  const variantLabel =
    stats.variantCount === 1
      ? "1 παραλλαγή"
      : `${stats.variantCount} παραλλαγές`;

  async function handleToggleActive() {
    setSaving(true);
    const supabase = createClient();
    const result = await setMasterActive(supabase, master.id, !master.isActive);
    setSaving(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    onMasterChange({ ...master, isActive: !master.isActive });
    toast.success(master.isActive ? "Το προϊόν απενεργοποιήθηκε." : "Το προϊόν ενεργοποιήθηκε.");
  }

  async function handleSaveDetails() {
    setSaving(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("product_masters")
      .update({
        clean_name: formValues.cleanName.trim(),
        category: formValues.category.trim(),
        subcategory: formValues.subcategory.trim() || null,
        quality_grade: formValues.qualityGrade.trim() || null,
        material_id: formValues.materialId,
        description: formValues.description.trim() || null,
      })
      .eq("id", master.id)
      .select(INVENTORY_PRODUCT_MASTER_DETAIL_SELECT)
      .single();

    setSaving(false);

    if (error || !data) {
      toast.error(error?.message ?? "Αποτυχία αποθήκευσης.");
      return;
    }

    const mapped = mapInventoryProductMasterRow(
      data as Parameters<typeof mapInventoryProductMasterRow>[0],
    );
    onMasterChange(mapped);
    setEditOpen(false);
    toast.success("Οι αλλαγές αποθηκεύτηκαν.");
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      <ProductDetailBackLink href="/products" label="Προϊόντα" />

      <ProductDetailHero
        title={master.cleanName}
        category={master.category}
        isActive={master.isActive}
        onToggleActive={() => void handleToggleActive()}
        toggleBusy={saving}
        badges={
          <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
            {variantLabel}
          </span>
        }
        editAction={
          <Button
            type="button"
            className={premiumGoldButton}
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="size-4" />
            Επεξεργασία
          </Button>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        <ProductQualityMaterialCard
          qualityGrade={master.qualityGrade}
          materialName={master.materialName}
          materialSpec={
            master.materialName
              ? master.material &&
                master.material.trim() !== master.materialName.trim()
                ? master.material
                : null
              : master.material
          }
          subcategory={master.subcategory}
          description={master.description}
          onEdit={() => setEditOpen(true)}
        />

        <ProductImagesCard>
          <WebsiteMasterImagesEditor
            masterId={master.id}
            cleanName={master.cleanName}
            images={master.images}
            disabled={saving}
            apiBasePath="/api/products/product-masters"
            onChange={(images, imageUrl) =>
              onMasterChange({ ...master, images, imageUrl })
            }
          />
        </ProductImagesCard>

        <ProductColorsSummaryCard
          colors={masterColors.map((color) => ({
            id: color.id,
            name: color.name,
            hexCode: color.hexCode,
            stock: color.totalStock,
          }))}
        />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ProductDetailStatCard
          icon={Layers}
          label="Συνολικό Απόθεμα"
          value={stats.totalStock}
          hint="τεμ."
        />
        <ProductDetailStatCard
          icon={Box}
          label="Παραλλαγές"
          value={stats.variantCount}
        />
        <ProductDetailStatCard
          icon={Wallet}
          label="Εύρος Τιμής"
          value={formatInternalPriceRange(
            stats.minInternalPrice,
            stats.maxInternalPrice,
            formatCurrencyEl,
          )}
        />
        <ProductDetailStatCard
          icon={TrendingUp}
          label="Μέση Τιμή"
          value={
            stats.avgInternalPrice != null
              ? formatCurrencyEl(stats.avgInternalPrice)
              : "—"
          }
        />
      </section>

      <Card className={premiumCard}>
        <CardHeader>
          <CardTitle className="text-lg text-navy-900">
            Παραλλαγές ({master.variants.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <InventoryMasterVariantsPanel
            master={master}
            disabled={saving}
            onVariantsChange={(variants) => onMasterChange({ ...master, variants })}
          />
        </CardContent>
      </Card>

      <ProductFinancialsCard
        items={[
          {
            label: "Μέσο Κόστος",
            value: formatCurrencyEl(stats.avgPurchasePrice),
          },
          {
            label: "Μέση Πώληση",
            value: formatCurrencyEl(stats.avgSalePrice),
          },
          {
            label: "Μέσο Περιθώριο %",
            value: (
              <span
                className={cn(
                  "inline-flex rounded-full px-2.5 py-0.5 text-sm font-semibold tabular-nums",
                  marginBadgeClass(stats.avgMarginPct),
                )}
              >
                {stats.avgMarginPct.toFixed(1)}%
              </span>
            ),
          },
          {
            label: "Μέσο Κέρδος/τεμ",
            value: formatCurrencyEl(stats.avgProfitPerUnit),
          },
          {
            label: "Συνολική Αξία Αποθέματος",
            value: formatCurrencyEl(stats.totalInventoryValue),
            highlight: true,
          },
        ]}
      />

      <ProductMasterEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        values={formValues}
        onChange={setFormValues}
        onSave={handleSaveDetails}
        saving={saving}
      />
    </div>
  );
}

export function InventoryProductMasterDetailSkeleton() {
  return <ProductDetailSkeleton />;
}
