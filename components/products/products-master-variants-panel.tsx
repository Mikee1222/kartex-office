"use client";

import * as React from "react";
import { toast } from "sonner";

import { AddMasterVariantDialog } from "@/components/products/add-master-variant-dialog";
import {
  createdVariantToWebsiteRow,
  websiteMasterToVariantMaster,
} from "@/lib/products/master-variant/adapters";
import {
  WebsiteMasterVariantsTable,
  type WebsiteVariantFieldPatch,
} from "@/components/website/website-master-variants-table";
import type {
  WebsiteProductMasterRow,
  WebsiteProductMasterVariantRow,
} from "@/lib/website/types";
import {
  saveVariantColor,
  saveVariantDimensions,
} from "@/lib/website/variant-field-save-actions";
import { premiumSecondaryButton } from "@/lib/ui/premium-styles";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type ProductsMasterVariantsPanelProps = {
  master: WebsiteProductMasterRow;
  disabled?: boolean;
  onVariantsChange: (variants: WebsiteProductMasterVariantRow[]) => void;
};

export function ProductsMasterVariantsPanel({
  master,
  disabled = false,
  onVariantsChange,
}: ProductsMasterVariantsPanelProps) {
  const [addVariantOpen, setAddVariantOpen] = React.useState(false);
  const [busyVariantId, setBusyVariantId] = React.useState<string | null>(null);

  const isBusy = disabled || busyVariantId !== null;

  function patchVariant(variantId: string, patch: WebsiteVariantFieldPatch) {
    onVariantsChange(
      master.variants.map((variant) =>
        variant.id === variantId ? { ...variant, ...patch } : variant,
      ),
    );
  }

  function variantSaveContext() {
    return {
      supabase: createClient(),
      setBusyVariantId,
      patchVariant,
    };
  }

  function handleVariantCreated(variant: WebsiteProductMasterVariantRow) {
    onVariantsChange(
      [...master.variants, variant].sort((a, b) => {
        const widthDiff = (a.widthCm ?? 0) - (b.widthCm ?? 0);
        if (widthDiff !== 0) return widthDiff;
        return (a.heightCm ?? 0) - (b.heightCm ?? 0);
      }),
    );
    toast.success("Η παραλλαγή δημιουργήθηκε.");
  }

  return (
    <>
      <WebsiteMasterVariantsTable
        category={master.category}
        variants={master.variants}
        isBusy={isBusy}
        showInternalPrice={false}
        variantDetailHrefPrefix="/products"
        onInternalPriceSave={async () => false}
        onDimensionsSave={(variantId, widthCm, heightCm) =>
          saveVariantDimensions(
            variantSaveContext(),
            variantId,
            widthCm,
            heightCm,
          )
        }
        onColorSave={(variantId, colorId, colorName, stock) =>
          saveVariantColor(
            variantSaveContext(),
            variantId,
            colorId,
            colorName,
            stock,
          )
        }
      />
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={() => setAddVariantOpen(true)}
          disabled={isBusy}
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
        onCreated={(variant) =>
          handleVariantCreated(createdVariantToWebsiteRow(variant))
        }
      />
    </>
  );
}
