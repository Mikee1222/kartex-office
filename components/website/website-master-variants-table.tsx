"use client";

import * as React from "react";

import { Input } from "@/components/ui/input";
import type { ProductColor } from "@/lib/products/types";
import type { WebsiteProductMasterVariantRow } from "@/lib/website/types";
import {
  fetchCategoryDimensionOptions,
  fetchCategoryWarehouseColorOptions,
  mergeWarehouseColorOptions,
  type DimensionOption,
} from "@/lib/website/variant-catalog-options";
import { premiumTableHead, premiumTableRow } from "@/lib/ui/premium-styles";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const editableInputClass =
  "h-8 border-gray-200 bg-gray-50/80 text-sm transition-colors hover:border-gold-400/60 hover:bg-white focus-visible:border-gold-400/60 focus-visible:bg-white";

const editableSelectClass =
  "flex h-8 w-full min-w-[7rem] rounded-input border border-gray-200 bg-gray-50/80 px-2 text-sm transition-colors hover:border-gold-400/60 hover:bg-white focus-visible:border-gold-400/60 focus-visible:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/30 disabled:cursor-not-allowed disabled:opacity-50";

function blurOnEnter(event: React.KeyboardEvent<HTMLInputElement>) {
  if (event.key === "Enter") {
    event.currentTarget.blur();
  }
}

function dimensionKey(widthCm: number | null, heightCm: number | null): string {
  if (widthCm == null || heightCm == null) return "";
  return `${widthCm}x${heightCm}`;
}

type InternalPriceCellProps = {
  variantId: string;
  value: number | null;
  disabled?: boolean;
  onSave: (variantId: string, value: number | null) => Promise<boolean>;
};

function InternalPriceCell({
  variantId,
  value,
  disabled,
  onSave,
}: InternalPriceCellProps) {
  const [local, setLocal] = React.useState(value?.toString() ?? "");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    setLocal(value?.toString() ?? "");
  }, [value]);

  async function handleBlur() {
    const trimmed = local.trim();
    const parsed =
      trimmed === "" ? null : Number.parseFloat(trimmed.replace(",", "."));

    if (trimmed !== "" && !Number.isFinite(parsed)) {
      setLocal(value?.toString() ?? "");
      return;
    }

    if (parsed === value || (parsed == null && value == null)) {
      return;
    }

    setSaving(true);
    const ok = await onSave(variantId, parsed);
    setSaving(false);
    if (!ok) {
      setLocal(value?.toString() ?? "");
    }
  }

  return (
    <Input
      type="text"
      inputMode="decimal"
      value={local}
      disabled={disabled || saving}
      onChange={(event) => setLocal(event.target.value)}
      onBlur={() => void handleBlur()}
      onKeyDown={blurOnEnter}
      className={cn(editableInputClass, "w-24 text-right tabular-nums")}
      aria-label="Εσωτερική τιμή EUR"
    />
  );
}

type DimensionsSelectCellProps = {
  variantId: string;
  widthCm: number | null;
  heightCm: number | null;
  options: DimensionOption[];
  disabled?: boolean;
  onSave: (
    variantId: string,
    widthCm: number,
    heightCm: number,
  ) => Promise<boolean>;
};

function DimensionsSelectCell({
  variantId,
  widthCm,
  heightCm,
  options,
  disabled,
  onSave,
}: DimensionsSelectCellProps) {
  const [saving, setSaving] = React.useState(false);
  const currentKey = dimensionKey(widthCm, heightCm);
  const mergedOptions = React.useMemo(() => {
    if (!currentKey || options.some((option) => option.key === currentKey)) {
      return options;
    }
    if (widthCm == null || heightCm == null) {
      return options;
    }
    return [
      ...options,
      {
        key: currentKey,
        widthCm,
        heightCm,
        label: `${widthCm}×${heightCm}`,
      },
    ].sort((a, b) => {
      if (a.widthCm !== b.widthCm) return a.widthCm - b.widthCm;
      return a.heightCm - b.heightCm;
    });
  }, [options, currentKey, widthCm, heightCm]);

  async function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const nextKey = event.target.value;
    if (!nextKey || nextKey === currentKey) return;

    const selected = mergedOptions.find((option) => option.key === nextKey);
    if (!selected) return;

    setSaving(true);
    await onSave(variantId, selected.widthCm, selected.heightCm);
    setSaving(false);
  }

  if (mergedOptions.length === 0) {
    return (
      <span className="text-sm text-gray-500">
        {widthCm != null && heightCm != null
          ? `${widthCm}×${heightCm}`
          : "—"}
      </span>
    );
  }

  return (
    <select
      value={currentKey}
      disabled={disabled || saving}
      onChange={(event) => void handleChange(event)}
      className={editableSelectClass}
      aria-label="Διαστάσεις"
    >
      {!currentKey ? <option value="">—</option> : null}
      {mergedOptions.map((option) => (
        <option key={option.key} value={option.key}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

type ColorCellProps = {
  variantId: string;
  colorId: string | null;
  colorName: string | null;
  stock: number;
  colors: ProductColor[];
  disabled?: boolean;
  onSave: (
    variantId: string,
    colorId: string,
    colorName: string,
    stock: number,
  ) => Promise<boolean>;
};

function ColorCell({
  variantId,
  colorId,
  colorName,
  stock,
  colors,
  disabled,
  onSave,
}: ColorCellProps) {
  const [saving, setSaving] = React.useState(false);
  const value = colorId ?? "";

  async function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const nextColorId = event.target.value;
    if (!nextColorId || nextColorId === colorId) return;

    const selected = colors.find((color) => color.id === nextColorId);
    if (!selected) return;

    setSaving(true);
    await onSave(variantId, selected.id, selected.name, stock);
    setSaving(false);
  }

  if (colors.length === 0) {
    return (
      <span className="text-sm text-gray-600">{colorName ?? "—"}</span>
    );
  }

  return (
    <select
      value={value}
      disabled={disabled || saving}
      onChange={(event) => void handleChange(event)}
      className={editableSelectClass}
      aria-label="Χρώμα"
    >
      {!colorId ? <option value="">—</option> : null}
      {colors.map((color) => (
        <option key={color.id} value={color.id}>
          {color.name}
        </option>
      ))}
    </select>
  );
}

export type WebsiteVariantFieldPatch = Partial<
  Pick<
    WebsiteProductMasterVariantRow,
    "widthCm" | "heightCm" | "color" | "colorId" | "internalPriceEur"
  >
>;

type WebsiteMasterVariantsTableProps = {
  category: string;
  variants: WebsiteProductMasterVariantRow[];
  isBusy: boolean;
  onInternalPriceSave: (
    variantId: string,
    value: number | null,
  ) => Promise<boolean>;
  onDimensionsSave: (
    variantId: string,
    widthCm: number,
    heightCm: number,
  ) => Promise<boolean>;
  onColorSave: (
    variantId: string,
    colorId: string,
    colorName: string,
    stock: number,
  ) => Promise<boolean>;
};

export function WebsiteMasterVariantsTable({
  category,
  variants,
  isBusy,
  onInternalPriceSave,
  onDimensionsSave,
  onColorSave,
}: WebsiteMasterVariantsTableProps) {
  const [dimensionOptions, setDimensionOptions] = React.useState<
    DimensionOption[]
  >([]);
  const [warehouseColors, setWarehouseColors] = React.useState<ProductColor[]>(
    [],
  );

  React.useEffect(() => {
    async function loadOptions() {
      const supabase = createClient();
      const [dimensions, colors] = await Promise.all([
        fetchCategoryDimensionOptions(supabase, category),
        fetchCategoryWarehouseColorOptions(supabase, category),
      ]);
      if (!dimensions.error) {
        setDimensionOptions(dimensions.options);
      }
      if (!colors.error) {
        setWarehouseColors(colors.colors);
      }
    }
    void loadOptions();
  }, [category]);

  if (variants.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        Δεν υπάρχουν παραλλαγές για αυτό το master.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200/80 bg-white">
      <table className="w-full min-w-[760px] text-sm">
        <thead>
          <tr className={cn(premiumTableHead, "text-xs")}>
            <th className="px-3 py-2 text-left">Διαστάσεις</th>
            <th className="px-3 py-2 text-left">Χρώμα</th>
            <th className="px-3 py-2 text-left">SKU</th>
            <th className="px-3 py-2 text-right">Απόθεμα</th>
            <th className="px-3 py-2 text-left">Υποκατηγορία</th>
            <th className="px-3 py-2 text-right">Εσωτ. τιμή (€)</th>
          </tr>
        </thead>
        <tbody>
          {variants.map((variant) => {
            const colorOptions = mergeWarehouseColorOptions(
              warehouseColors,
              variant.colorId,
              variant.color,
            );

            return (
              <tr
                key={variant.id}
                className={cn(premiumTableRow, "border-t border-gray-100")}
              >
                <td className="px-3 py-2">
                  <DimensionsSelectCell
                    variantId={variant.id}
                    widthCm={variant.widthCm}
                    heightCm={variant.heightCm}
                    options={dimensionOptions}
                    disabled={isBusy}
                    onSave={onDimensionsSave}
                  />
                </td>
                <td className="px-3 py-2">
                  <ColorCell
                    variantId={variant.id}
                    colorId={variant.colorId}
                    colorName={variant.color}
                    stock={variant.stock}
                    colors={colorOptions}
                    disabled={isBusy}
                    onSave={onColorSave}
                  />
                </td>
                <td className="px-3 py-2 font-mono text-xs text-gray-500">
                  {variant.sku || "—"}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-navy-900">
                  {variant.stock}
                </td>
                <td className="px-3 py-2 text-gray-600">
                  {variant.subcategory ?? "—"}
                </td>
                <td className="px-3 py-2 text-right">
                  <InternalPriceCell
                    variantId={variant.id}
                    value={variant.internalPriceEur}
                    disabled={isBusy}
                    onSave={onInternalPriceSave}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
