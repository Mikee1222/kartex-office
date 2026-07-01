"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

import { AddMasterVariantDialog } from "@/components/products/add-master-variant-dialog";
import { StockStatusIcon } from "@/components/products/stock-status-icon";
import { getStockStatus } from "@/components/products/types";
import {
  createdVariantToWebsiteRow,
  sortMasterVariants,
  websiteMasterToVariantMaster,
} from "@/lib/products/master-variant/adapters";
import type {
  InventoryMasterVariantRow,
  InventoryProductMasterRow,
} from "@/lib/products/product-master-detail";
import { premiumSecondaryButton, premiumTableHead, premiumTableRow } from "@/lib/ui/premium-styles";
import { cn } from "@/lib/utils";

type InventoryMasterVariantsPanelProps = {
  master: InventoryProductMasterRow;
  disabled?: boolean;
  onVariantsChange: (variants: InventoryMasterVariantRow[]) => void;
};

function formatDimensions(variant: InventoryMasterVariantRow): string {
  if (variant.widthCm != null && variant.heightCm != null) {
    return `${variant.widthCm}×${variant.heightCm}`;
  }
  return "—";
}

export function InventoryMasterVariantsPanel({
  master,
  disabled = false,
  onVariantsChange,
}: InventoryMasterVariantsPanelProps) {
  const [addVariantOpen, setAddVariantOpen] = React.useState(false);

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

  if (master.variants.length === 0) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-gray-500">
          Δεν υπάρχουν παραλλαγές για αυτό το προϊόν.
        </p>
        <div className="flex justify-end">
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
        </div>
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
      <div className="overflow-x-auto rounded-lg border border-gray-200/80 bg-white">
        <table className="w-full min-w-[880px] text-sm">
          <thead>
            <tr className={cn(premiumTableHead, "text-xs")}>
              <th className="px-3 py-2 text-left">Διαστάσεις</th>
              <th className="px-3 py-2 text-left">Χρώμα</th>
              <th className="px-3 py-2 text-left">SKU</th>
              <th className="px-3 py-2 text-right">Απόθεμα</th>
              <th className="px-3 py-2 text-right">Ελάχ. απόθ.</th>
              <th className="px-3 py-2 text-right">Αγορά / Πώληση</th>
              <th className="px-3 py-2 text-left">Προμηθευτής</th>
              <th className="px-3 py-2 text-right">Ενέργειες</th>
            </tr>
          </thead>
          <tbody>
            {master.variants.map((variant) => {
              const status = getStockStatus(variant.stock, variant.minStock);

              return (
                <tr
                  key={variant.id}
                  className={cn(premiumTableRow, "border-t border-gray-100")}
                >
                  <td className="px-3 py-2 font-medium text-navy-900">
                    {formatDimensions(variant)}
                  </td>
                  <td className="px-3 py-2 text-gray-600">{variant.color ?? "—"}</td>
                  <td className="px-3 py-2 font-mono text-xs text-gray-500">
                    {variant.sku || "—"}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-1.5">
                      <StockStatusIcon
                        stock={variant.stock}
                        minStock={variant.minStock}
                      />
                      <span
                        className={cn(
                          "tabular-nums font-semibold",
                          status === "critical"
                            ? "text-red-600"
                            : status === "low"
                              ? "text-amber-600"
                              : "text-emerald-700",
                        )}
                      >
                        {variant.stock}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-gray-600">
                    {variant.minStock}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-gray-600">
                    {variant.purchasePrice.toFixed(2)} / {variant.salePrice.toFixed(2)} €
                  </td>
                  <td className="px-3 py-2 text-gray-600">
                    {variant.supplier ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Link
                      href={`/products/${variant.id}`}
                      className={cn(
                        premiumSecondaryButton,
                        "inline-flex h-8 items-center gap-1.5 px-2.5 text-xs font-semibold",
                      )}
                    >
                      Λεπτομέρειες Τιμολόγησης
                      <ArrowRight className="size-3.5" aria-hidden />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex justify-end">
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
      </div>

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
