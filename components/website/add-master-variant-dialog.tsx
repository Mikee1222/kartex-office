"use client";

import { Loader2, Plus } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProductColor } from "@/lib/products/types";
import { fetchActiveProductColors } from "@/lib/products/color-variants";
import { createWebsiteMasterVariant, generateNextWarehouseSkuForCategory } from "@/lib/website/create-master-variant";
import type { WebsiteProductMasterRow, WebsiteProductMasterVariantRow } from "@/lib/website/types";
import {
  CUSTOM_DIMENSION_VALUE,
  CUSTOM_SUBCATEGORY_VALUE,
  fetchCategoryDimensionOptions,
  fetchCategorySubcategoryOptions,
  type DimensionOption,
  type SubcategoryOption,
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

  const [dimensionOptions, setDimensionOptions] = React.useState<DimensionOption[]>(
    [],
  );
  const [subcategoryOptions, setSubcategoryOptions] = React.useState<
    SubcategoryOption[]
  >([]);
  const [colors, setColors] = React.useState<ProductColor[]>([]);
  const [previewSku, setPreviewSku] = React.useState<string>("—");

  const [dimensionKey, setDimensionKey] = React.useState("");
  const [customWidth, setCustomWidth] = React.useState("");
  const [customHeight, setCustomHeight] = React.useState("");
  const [colorId, setColorId] = React.useState("");
  const [subcategoryValue, setSubcategoryValue] = React.useState("");
  const [customSubcategory, setCustomSubcategory] = React.useState("");
  const [stock, setStock] = React.useState("0");
  const [internalPrice, setInternalPrice] = React.useState("");

  const selectedColor = colors.find((color) => color.id === colorId);

  React.useEffect(() => {
    if (!open) return;

    setError(null);
    setDimensionKey("");
    setCustomWidth("");
    setCustomHeight("");
    setColorId("");
    setSubcategoryValue("");
    setCustomSubcategory("");
    setStock("0");
    setInternalPrice("");

    async function loadOptions() {
      setLoadingOptions(true);
      const supabase = createClient();
      const [dimensions, subcategories, colorResult, skuResult] =
        await Promise.all([
          fetchCategoryDimensionOptions(supabase, master.category),
          fetchCategorySubcategoryOptions(supabase, master.category),
          fetchActiveProductColors(supabase),
          generateNextWarehouseSkuForCategory(supabase, master.category),
        ]);

      if (dimensions.error || subcategories.error || colorResult.error) {
        setError(
          dimensions.error ??
            subcategories.error ??
            colorResult.error ??
            "Αποτυχία φόρτωσης επιλογών.",
        );
      }

      setDimensionOptions(dimensions.options);
      setSubcategoryOptions(subcategories.options);
      setColors(colorResult.colors);
      setPreviewSku("error" in skuResult ? "—" : skuResult.sku);
      setLoadingOptions(false);
    }

    void loadOptions();
  }, [open, master.category]);

  function resolveDimensions(): { widthCm: number; heightCm: number } | null {
    if (dimensionKey === CUSTOM_DIMENSION_VALUE) {
      const widthCm = Number.parseFloat(customWidth.replace(",", "."));
      const heightCm = Number.parseFloat(customHeight.replace(",", "."));
      if (!Number.isFinite(widthCm) || widthCm <= 0) return null;
      if (!Number.isFinite(heightCm) || heightCm <= 0) return null;
      return { widthCm, heightCm };
    }

    const option = dimensionOptions.find((item) => item.key === dimensionKey);
    if (!option) return null;
    return { widthCm: option.widthCm, heightCm: option.heightCm };
  }

  function resolveSubcategory(): string | null {
    if (subcategoryValue === CUSTOM_SUBCATEGORY_VALUE) {
      const trimmed = customSubcategory.trim();
      return trimmed || null;
    }
    return subcategoryValue.trim() || null;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const dimensions = resolveDimensions();
    if (!dimensions) {
      setError("Επιλέξτε ή εισάγετε έγκυρες διαστάσεις.");
      return;
    }

    if (!selectedColor) {
      setError("Επιλέξτε χρώμα.");
      return;
    }

    const parsedStock = Number.parseInt(stock, 10);
    if (!Number.isFinite(parsedStock) || parsedStock < 0) {
      setError("Εισάγετε έγκυρο απόθεμα (≥ 0).");
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
      widthCm: dimensions.widthCm,
      heightCm: dimensions.heightCm,
      colorId: selectedColor.id,
      colorName: selectedColor.name,
      subcategory: resolveSubcategory(),
      stock: parsedStock,
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
              <option value={CUSTOM_DIMENSION_VALUE}>Άλλο μέγεθος…</option>
            </select>
            {dimensionKey === CUSTOM_DIMENSION_VALUE ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="custom-width">Πλάτος (cm)</Label>
                  <Input
                    id="custom-width"
                    inputMode="decimal"
                    value={customWidth}
                    onChange={(event) => setCustomWidth(event.target.value)}
                    disabled={pending}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="custom-height">Ύψος (cm)</Label>
                  <Input
                    id="custom-height"
                    inputMode="decimal"
                    value={customHeight}
                    onChange={(event) => setCustomHeight(event.target.value)}
                    disabled={pending}
                    required
                  />
                </div>
              </div>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="variant-color">Χρώμα</Label>
            <select
              id="variant-color"
              value={colorId}
              onChange={(event) => setColorId(event.target.value)}
              className={selectClassName}
              required
              disabled={loadingOptions || pending}
            >
              <option value="">— Επιλέξτε χρώμα —</option>
              {colors.map((color) => (
                <option key={color.id} value={color.id}>
                  {color.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="variant-subcategory">Υποκατηγορία</Label>
            <select
              id="variant-subcategory"
              value={subcategoryValue}
              onChange={(event) => setSubcategoryValue(event.target.value)}
              className={selectClassName}
              disabled={loadingOptions || pending}
            >
              <option value="">— Προαιρετικό —</option>
              {subcategoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
              <option value={CUSTOM_SUBCATEGORY_VALUE}>
                Άλλη υποκατηγορία…
              </option>
            </select>
            {subcategoryValue === CUSTOM_SUBCATEGORY_VALUE ? (
              <Input
                value={customSubcategory}
                onChange={(event) => setCustomSubcategory(event.target.value)}
                placeholder="Νέα υποκατηγορία"
                disabled={pending}
              />
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="variant-stock">Απόθεμα</Label>
              <Input
                id="variant-stock"
                type="number"
                min={0}
                step={1}
                value={stock}
                onChange={(event) => setStock(event.target.value)}
                disabled={pending}
                required
              />
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
