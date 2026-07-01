"use client";

import { Pencil } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { AddMasterVariantDialog } from "@/components/products/add-master-variant-dialog";
import {
  VariantColorStockBars,
  VariantDimensionBadges,
} from "@/components/products/master-group-ui";
import { StockStatusIcon } from "@/components/products/stock-status-icon";
import { getStockStatus } from "@/components/products/types";
import { fetchVariantsForProducts } from "@/lib/products/color-variants";
import type { ProductVariant } from "@/lib/products/master-groups";
import { stockBarColorClass } from "@/lib/products/master-groups";
import {
  createdVariantToWebsiteRow,
  sortMasterVariants,
  websiteMasterToVariantMaster,
} from "@/lib/products/master-variant/adapters";
import type {
  InventoryMasterVariantRow,
  InventoryProductMasterRow,
} from "@/lib/products/product-master-detail";
import type { ProductColorVariant } from "@/lib/products/types";
import { premiumSecondaryButton } from "@/lib/ui/premium-styles";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type InventoryMasterVariantsPanelProps = {
  master: InventoryProductMasterRow;
  disabled?: boolean;
  onVariantsChange: (variants: InventoryMasterVariantRow[]) => void;
};

function toProductVariant(variant: InventoryMasterVariantRow): ProductVariant {
  return {
    id: variant.id,
    name: "",
    sku: variant.sku,
    widthCm: variant.widthCm,
    heightCm: variant.heightCm,
    gsm: variant.gsm,
    threadCount: variant.threadCount,
    stock: variant.stock,
    reservedStock: variant.reservedStock,
    availableStock: Math.max(0, variant.stock - variant.reservedStock),
    minStock: variant.minStock,
    purchasePrice: variant.purchasePrice,
    salePrice: variant.salePrice,
  };
}

export function InventoryMasterVariantsPanel({
  master,
  disabled = false,
  onVariantsChange,
}: InventoryMasterVariantsPanelProps) {
  const router = useRouter();
  const [addVariantOpen, setAddVariantOpen] = React.useState(false);
  const [variantsByProduct, setVariantsByProduct] = React.useState<
    Map<string, ProductColorVariant[]>
  >(new Map());

  const variantIds = React.useMemo(
    () => master.variants.map((variant) => variant.id).join(","),
    [master.variants],
  );

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

  const maxStock = Math.max(...master.variants.map((variant) => variant.stock), 1);

  function handleVariantCreated(variant: ReturnType<typeof createdVariantToWebsiteRow>) {
    const nextVariant: InventoryMasterVariantRow = {
      ...variant,
      minStock: 0,
      purchasePrice: 0,
      salePrice: 0,
      supplier: null,
      reservedStock: 0,
    };
    onVariantsChange(sortMasterVariants([...master.variants, nextVariant]));
    toast.success("Η παραλλαγή δημιουργήθηκε.");
  }

  const addVariantButton = (
    <button
      type="button"
      onClick={() => setAddVariantOpen(true)}
      disabled={disabled}
      className={cn(
        premiumSecondaryButton,
        "inline-flex h-9 items-center gap-1.5 px-3 text-xs font-semibold disabled:opacity-50",
      )}
    >
      + Νέα Παραλλαγή
    </button>
  );

  if (master.variants.length === 0) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-gray-500">
          Δεν υπάρχουν παραλλαγές για αυτό το προϊόν.
        </p>
        <div className="flex justify-end">{addVariantButton}</div>
        <AddMasterVariantDialog
          master={websiteMasterToVariantMaster(master)}
          mode="products"
          open={addVariantOpen}
          onOpenChange={setAddVariantOpen}
          onCreated={(variant) => handleVariantCreated(createdVariantToWebsiteRow(variant))}
        />
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-gray-200/80 bg-gray-50/50">
        {master.variants.map((variant, index) => {
          const productVariant = toProductVariant(variant);
          const barPct = Math.round((variant.stock / maxStock) * 100);
          const status = getStockStatus(variant.stock, variant.minStock);

          return (
            <div
              key={variant.id}
              className={cn(
                "flex items-center gap-3 bg-white/80 px-4 py-3 transition-colors hover:bg-white",
                index < master.variants.length - 1 && "border-b border-gray-100/80",
              )}
            >
              <button
                type="button"
                className="min-w-0 flex-1 space-y-1.5 text-left"
                onClick={() => router.push(`/products/${variant.id}`)}
              >
                <VariantDimensionBadges variant={productVariant} />
                <VariantColorStockBars
                  productId={variant.id}
                  variantsByProduct={variantsByProduct}
                  maxStock={maxStock}
                />
                <div className="flex items-center gap-2">
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        stockBarColorClass(variant.stock, variant.minStock),
                      )}
                      style={{ width: `${Math.min(barPct, 100)}%` }}
                    />
                  </div>
                  <span className="shrink-0 font-mono text-[10px] text-gray-400">
                    {variant.sku}
                  </span>
                </div>
              </button>
              <div className="flex shrink-0 items-center gap-1.5">
                <StockStatusIcon stock={variant.stock} minStock={variant.minStock} />
                <span
                  className={cn(
                    "text-base font-bold tabular-nums",
                    status === "critical"
                      ? "text-red-600"
                      : status === "low"
                        ? "text-amber-600"
                        : "text-emerald-700",
                  )}
                >
                  {variant.stock}
                </span>
                <Link
                  href={`/products/${variant.id}`}
                  className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gold-500/10 hover:text-gold-500"
                  aria-label="Λεπτομέρειες τιμολόγησης"
                  onClick={(event) => event.stopPropagation()}
                >
                  <Pencil size={13} />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex justify-end">{addVariantButton}</div>

      <AddMasterVariantDialog
        master={websiteMasterToVariantMaster(master)}
        mode="products"
        open={addVariantOpen}
        onOpenChange={setAddVariantOpen}
        onCreated={(variant) => handleVariantCreated(createdVariantToWebsiteRow(variant))}
      />
    </>
  );
}
