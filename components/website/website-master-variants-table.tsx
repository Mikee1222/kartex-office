"use client";

import * as React from "react";

import { Input } from "@/components/ui/input";
import { fetchActiveProductColors } from "@/lib/products/color-variants";
import type { ProductColor } from "@/lib/products/types";
import type { WebsiteProductMasterVariantRow } from "@/lib/website/types";
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

type DimensionsCellProps = {
  variantId: string;
  widthCm: number | null;
  heightCm: number | null;
  disabled?: boolean;
  onSave: (
    variantId: string,
    widthCm: number,
    heightCm: number,
  ) => Promise<boolean>;
};

function DimensionsCell({
  variantId,
  widthCm,
  heightCm,
  disabled,
  onSave,
}: DimensionsCellProps) {
  const [localWidth, setLocalWidth] = React.useState(widthCm?.toString() ?? "");
  const [localHeight, setLocalHeight] = React.useState(
    heightCm?.toString() ?? "",
  );
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    setLocalWidth(widthCm?.toString() ?? "");
    setLocalHeight(heightCm?.toString() ?? "");
  }, [widthCm, heightCm]);

  async function handleBlur() {
    const parsedWidth = Number.parseFloat(localWidth.replace(",", "."));
    const parsedHeight = Number.parseFloat(localHeight.replace(",", "."));

    if (!Number.isFinite(parsedWidth) || parsedWidth <= 0) {
      setLocalWidth(widthCm?.toString() ?? "");
      setLocalHeight(heightCm?.toString() ?? "");
      return;
    }
    if (!Number.isFinite(parsedHeight) || parsedHeight <= 0) {
      setLocalWidth(widthCm?.toString() ?? "");
      setLocalHeight(heightCm?.toString() ?? "");
      return;
    }

    if (parsedWidth === widthCm && parsedHeight === heightCm) {
      return;
    }

    setSaving(true);
    const ok = await onSave(variantId, parsedWidth, parsedHeight);
    setSaving(false);
    if (!ok) {
      setLocalWidth(widthCm?.toString() ?? "");
      setLocalHeight(heightCm?.toString() ?? "");
    }
  }

  return (
    <div className="flex items-center gap-1">
      <Input
        type="text"
        inputMode="decimal"
        value={localWidth}
        disabled={disabled || saving}
        onChange={(event) => setLocalWidth(event.target.value)}
        onBlur={() => void handleBlur()}
        onKeyDown={blurOnEnter}
        className={cn(editableInputClass, "w-16 tabular-nums")}
        aria-label="Πλάτος cm"
      />
      <span className="text-xs text-gray-400">×</span>
      <Input
        type="text"
        inputMode="decimal"
        value={localHeight}
        disabled={disabled || saving}
        onChange={(event) => setLocalHeight(event.target.value)}
        onBlur={() => void handleBlur()}
        onKeyDown={blurOnEnter}
        className={cn(editableInputClass, "w-16 tabular-nums")}
        aria-label="Ύψος cm"
      />
    </div>
  );
}

type StockCellProps = {
  variantId: string;
  value: number;
  disabled?: boolean;
  onSave: (variantId: string, value: number) => Promise<boolean>;
};

function StockCell({ variantId, value, disabled, onSave }: StockCellProps) {
  const [local, setLocal] = React.useState(value.toString());
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    setLocal(value.toString());
  }, [value]);

  async function handleBlur() {
    const parsed = Number.parseInt(local, 10);
    if (!Number.isFinite(parsed) || parsed < 0) {
      setLocal(value.toString());
      return;
    }
    if (parsed === value) return;

    setSaving(true);
    const ok = await onSave(variantId, parsed);
    setSaving(false);
    if (!ok) {
      setLocal(value.toString());
    }
  }

  return (
    <Input
      type="number"
      min={0}
      step={1}
      value={local}
      disabled={disabled || saving}
      onChange={(event) => setLocal(event.target.value)}
      onBlur={() => void handleBlur()}
      onKeyDown={blurOnEnter}
      className={cn(editableInputClass, "ml-auto w-20 text-right tabular-nums")}
      aria-label="Απόθεμα"
    />
  );
}

type SubcategoryCellProps = {
  variantId: string;
  value: string | null;
  disabled?: boolean;
  onSave: (variantId: string, value: string | null) => Promise<boolean>;
};

function SubcategoryCell({
  variantId,
  value,
  disabled,
  onSave,
}: SubcategoryCellProps) {
  const [local, setLocal] = React.useState(value ?? "");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    setLocal(value ?? "");
  }, [value]);

  async function handleBlur() {
    const trimmed = local.trim();
    const next = trimmed || null;
    const current = value?.trim() || null;
    if (next === current) return;

    setSaving(true);
    const ok = await onSave(variantId, next);
    setSaving(false);
    if (!ok) {
      setLocal(value ?? "");
    }
  }

  return (
    <Input
      type="text"
      value={local}
      disabled={disabled || saving}
      onChange={(event) => setLocal(event.target.value)}
      onBlur={() => void handleBlur()}
      onKeyDown={blurOnEnter}
      className={cn(editableInputClass, "min-w-[8rem]")}
      aria-label="Υποκατηγορία"
      placeholder="—"
    />
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

  return (
    <select
      value={value}
      disabled={disabled || saving || colors.length === 0}
      onChange={(event) => void handleChange(event)}
      className={editableSelectClass}
      aria-label="Χρώμα"
    >
      <option value="">—</option>
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
    | "widthCm"
    | "heightCm"
    | "color"
    | "colorId"
    | "stock"
    | "subcategory"
    | "internalPriceEur"
  >
>;

type WebsiteMasterVariantsTableProps = {
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
  onStockSave: (variantId: string, value: number) => Promise<boolean>;
  onSubcategorySave: (
    variantId: string,
    value: string | null,
  ) => Promise<boolean>;
};

export function WebsiteMasterVariantsTable({
  variants,
  isBusy,
  onInternalPriceSave,
  onDimensionsSave,
  onColorSave,
  onStockSave,
  onSubcategorySave,
}: WebsiteMasterVariantsTableProps) {
  const [colors, setColors] = React.useState<ProductColor[]>([]);

  React.useEffect(() => {
    async function loadColors() {
      const supabase = createClient();
      const result = await fetchActiveProductColors(supabase);
      if (!result.error) {
        setColors(result.colors);
      }
    }
    void loadColors();
  }, []);

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
          {variants.map((variant) => (
            <tr
              key={variant.id}
              className={cn(premiumTableRow, "border-t border-gray-100")}
            >
              <td className="px-3 py-2">
                <DimensionsCell
                  variantId={variant.id}
                  widthCm={variant.widthCm}
                  heightCm={variant.heightCm}
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
                  colors={colors}
                  disabled={isBusy}
                  onSave={onColorSave}
                />
              </td>
              <td className="px-3 py-2 font-mono text-xs text-gray-500">
                {variant.sku || "—"}
              </td>
              <td className="px-3 py-2 text-right">
                <StockCell
                  variantId={variant.id}
                  value={variant.stock}
                  disabled={isBusy}
                  onSave={onStockSave}
                />
              </td>
              <td className="px-3 py-2">
                <SubcategoryCell
                  variantId={variant.id}
                  value={variant.subcategory}
                  disabled={isBusy}
                  onSave={onSubcategorySave}
                />
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
          ))}
        </tbody>
      </table>
    </div>
  );
}
