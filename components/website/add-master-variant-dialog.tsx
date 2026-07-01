"use client";

import { Loader2, Plus } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProductColor } from "@/lib/products/types";
import {
  createWebsiteMasterVariant,
  generateNextWarehouseSkuForCategory,
} from "@/lib/website/create-master-variant";
import type {
  WebsiteProductMasterRow,
  WebsiteProductMasterVariantRow,
} from "@/lib/website/types";
import {
  fetchCategoryDimensionOptions,
  fetchCategorySubcategoryOptions,
  fetchCategoryWarehouseColorOptions,
  type DimensionOption,
} from "@/lib/website/variant-catalog-options";
import { premiumGoldButton, premiumSecondaryButton } from "@/lib/ui/premium-styles";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const selectClassName =
  "flex h-10 w-full rounded-input border border-input bg-background px-3 text-sm";

type AddMasterVariantDialogProps = {
  master: WebsiteProductMasterRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (variant: WebsiteProductMasterVariantRow) => void;
};

export function AddMasterVariantDialog({
  master,
  open,
  onOpenChange,
  onCreated,
}: AddMasterVariantDialogProps) {
  const [loadingOptions, setLoadingOptions] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [dimensionOptions, setDimensionOptions] = React.useState<
    DimensionOption[]
  >([]);
  const [colors, setColors] = React.useState<ProductColor[]>([]);
  const [defaultSubcategory, setDefaultSubcategory] = React.useState<
    string | null
  >(null);
  const [previewSku, setPreviewSku] = React.useState<string>("—");

  const [dimensionKey, setDimensionKey] = React.useState("");
  const [colorId, setColorId] = React.useState("");
  const [internalPrice, setInternalPrice] = React.useState("");

  const selectedColor = colors.find((color) => color.id === colorId);

  React.useEffect(() => {
    if (!open) return;

    setError(null);
    setDimensionKey("");
    setColorId("");
    setInternalPrice("");

    async function loadOptions() {
      setLoadingOptions(true);
      const supabase = createClient();
      const [dimensions, colorResult, subcategories, skuResult] =
        await Promise.all([
          fetchCategoryDimensionOptions(supabase, master.category),
          fetchCategoryWarehouseColorOptions(supabase, master.category),
          fetchCategorySubcategoryOptions(supabase, master.category),
          generateNextWarehouseSkuForCategory(supabase, master.category),
        ]);

      if (dimensions.error || colorResult.error || subcategories.error) {
        setError(
          dimensions.error ??
            colorResult.error ??
            subcategories.error ??
            "Αποτυχία φόρτωσης επιλογών.",
        );
      }

      setDimensionOptions(dimensions.options);
      setColors(colorResult.colors);
      setDefaultSubcategory(
        master.subcategory?.trim() ||
          master.variants.find((variant) => variant.subcategory)?.subcategory ||
          subcategories.options[0]?.value ||
          null,
      );
      setPreviewSku("error" in skuResult ? "—" : skuResult.sku);
      setLoadingOptions(false);
    }

    void loadOptions();
  }, [open, master]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const option = dimensionOptions.find((item) => item.key === dimensionKey);
    if (!option) {
      setError("Επιλέξτε διαστάσεις από την αποθήκη.");
      return;
    }

    if (!selectedColor) {
      setError("Επιλέξτε χρώμα.");
      return;
    }

    const trimmedPrice = internalPrice.trim();
    const parsedPrice =
      trimmedPrice === ""
        ? null
        : Number.parseFloat(trimmedPrice.replace(",", "."));
    if (trimmedPrice !== "" && !Number.isFinite(parsedPrice)) {
      setError("Εισάγετε έγκυρη εσωτερική τιμή.");
      return;
    }

    setPending(true);
    const supabase = createClient();
    const result = await createWebsiteMasterVariant(supabase, {
      master,
      widthCm: option.widthCm,
      heightCm: option.heightCm,
      colorId: selectedColor.id,
      colorName: selectedColor.name,
      subcategory: defaultSubcategory,
      stock: 0,
      internalPriceEur: parsedPrice,
    });
    setPending(false);

    if ("error" in result) {
      setError(result.error);
      return;
    }

    onCreated(result.variant);
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Νέα Παραλλαγή"
      description={`${master.cleanName} · ${master.category}`}
      className="max-w-xl"
    >
      <form onSubmit={(event) => void handleSubmit(event)}>
        <DialogBody className="space-y-4">
          {loadingOptions ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="size-4 animate-spin" />
              Φόρτωση επιλογών…
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="variant-dimensions">Διαστάσεις</Label>
            <select
              id="variant-dimensions"
              value={dimensionKey}
              onChange={(event) => setDimensionKey(event.target.value)}
              className={selectClassName}
              required
              disabled={loadingOptions || pending}
            >
              <option value="">— Επιλέξτε μέγεθος —</option>
              {dimensionOptions.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500">
              Μεγέθη που υπάρχουν ήδη στην αποθήκη για την κατηγορία{" "}
              {master.category}.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="variant-color">Χρώμα</Label>
            <select
              id="variant-color"
              value={colorId}
              onChange={(event) => setColorId(event.target.value)}
              className={selectClassName}
              required
              disabled={loadingOptions || pending || colors.length === 0}
            >
              <option value="">— Επιλέξτε χρώμα —</option>
              {colors.map((color) => (
                <option key={color.id} value={color.id}>
                  {color.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500">
              Χρώματα που χρησιμοποιούνται ήδη στην αποθήκη για την κατηγορία{" "}
              {master.category}.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="variant-internal-price">Εσωτ. τιμή (€)</Label>
            <Input
              id="variant-internal-price"
              inputMode="decimal"
              value={internalPrice}
              onChange={(event) => setInternalPrice(event.target.value)}
              placeholder="Προαιρετικό"
              disabled={pending}
            />
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
            <p>
              <span className="font-medium text-navy-900">Απόθεμα:</span> 0
              (διαχείριση από Αποθήκη)
            </p>
            {defaultSubcategory ? (
              <p className="mt-1">
                <span className="font-medium text-navy-900">Υποκατηγορία:</span>{" "}
                {defaultSubcategory}
              </p>
            ) : null}
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              SKU (αυτόματο)
            </p>
            <p className="mt-1 font-mono text-sm text-navy-900">{previewSku}</p>
          </div>

          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}
        </DialogBody>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className={premiumSecondaryButton}
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            Ακύρωση
          </Button>
          <Button
            type="submit"
            className={cn(premiumGoldButton, "gap-1.5")}
            disabled={loadingOptions || pending}
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            Δημιουργία
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
