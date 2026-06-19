"use client";

import { Loader2, Minus, Plus } from "lucide-react";
import * as React from "react";

import { FieldTooltip } from "@/components/ui/field-tooltip";
import { FIELD_TOOLTIPS } from "@/lib/forms/field-tooltips";
import {
  productFormInput,
  productFormSection,
  productFormSectionTitle,
} from "@/lib/ui/product-form-styles";
import { ColorCircle } from "@/components/ui/color-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  buildInitialColorsFormState,
  totalStockFromFormState,
  type ProductColorsFormState,
} from "@/lib/products/color-form-state";
import { mapProductColor } from "@/lib/products/color-variants";
import type { ProductColor } from "@/lib/products/types";
import type { ColorSelectionInput } from "@/lib/products/color-form-state";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type ProductColorsStockSectionProps = {
  value: ProductColorsFormState;
  onChange: (value: ProductColorsFormState) => void;
  initialSelections?: ColorSelectionInput[];
  unit: string;
  disabled?: boolean;
  onPaletteLoaded?: (colors: ProductColor[]) => void;
};

function PrimaryToggle({
  active,
  disabled,
  onClick,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors",
        active ? "bg-gold-500" : "bg-gray-200",
        disabled && "opacity-50",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform",
          active ? "left-[22px]" : "left-0.5",
        )}
      />
    </button>
  );
}

export function ProductColorsStockSection({
  value,
  onChange,
  initialSelections = [],
  unit,
  disabled = false,
  onPaletteLoaded,
}: ProductColorsStockSectionProps) {
  const [colors, setColors] = React.useState<ProductColor[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [fetchKey, setFetchKey] = React.useState(0);

  const onChangeRef = React.useRef(onChange);
  onChangeRef.current = onChange;
  const initialSelectionsRef = React.useRef(initialSelections);
  initialSelectionsRef.current = initialSelections;
  const initializedRef = React.useRef(false);

  const totalStock = totalStockFromFormState(value);

  React.useEffect(() => {
    let cancelled = false;

    async function fetchColors() {
      setLoading(true);
      setError(null);
      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from("product_colors")
        .select("*")
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (cancelled) return;

      if (fetchError) {
        setError(fetchError.message);
        setColors([]);
        setLoading(false);
        return;
      }

      const mapped = (data ?? []).map((row) =>
        mapProductColor(
          row as { id: string; name: string; hex_code: string; is_active: boolean },
        ),
      );
      setColors(mapped);
      onPaletteLoaded?.(mapped);
      setLoading(false);

      if (!initializedRef.current) {
        initializedRef.current = true;
        onChangeRef.current(
          buildInitialColorsFormState(mapped, initialSelectionsRef.current),
        );
      }
    }

    void fetchColors();
    return () => {
      cancelled = true;
    };
  }, [fetchKey, onPaletteLoaded]);

  function patchColor(colorId: string, patch: Partial<ProductColorsFormState[string]>) {
    const current = value[colorId] ?? { selected: false, stock: "0", isPrimary: false };
    onChange({ ...value, [colorId]: { ...current, ...patch } });
  }

  function toggleColor(colorId: string) {
    const current = value[colorId] ?? { selected: false, stock: "0", isPrimary: false };
    const nextSelected = !current.selected;

    if (!nextSelected) {
      const next: ProductColorsFormState = { ...value };
      next[colorId] = { selected: false, stock: "0", isPrimary: false };
      const stillPrimary = Object.values(next).some((e) => e.selected && e.isPrimary);
      if (!stillPrimary) {
        const first = colors.find((c) => next[c.id]?.selected);
        if (first) next[first.id] = { ...next[first.id]!, isPrimary: true };
      }
      onChange(next);
      return;
    }

    const hasPrimary = Object.values(value).some((e) => e.selected && e.isPrimary);
    patchColor(colorId, {
      selected: true,
      stock: current.stock || "0",
      isPrimary: !hasPrimary,
    });
  }

  function adjustStock(colorId: string, delta: number) {
    const current = value[colorId];
    if (!current?.selected) return;
    const next = Math.max(0, (Number.parseInt(current.stock, 10) || 0) + delta);
    patchColor(colorId, { stock: String(next) });
  }

  function setPrimary(colorId: string) {
    const next: ProductColorsFormState = { ...value };
    for (const id of Object.keys(next)) {
      if (!next[id]?.selected) continue;
      next[id] = { ...next[id]!, isPrimary: id === colorId };
    }
    onChange(next);
  }

  const selectedColors = colors
    .filter((color) => value[color.id]?.selected)
    .sort((a, b) => {
      if (value[a.id]?.isPrimary) return -1;
      if (value[b.id]?.isPrimary) return 1;
      return a.name.localeCompare(b.name, "el");
    });

  return (
    <section className={productFormSection}>
      <div>
        <div className="flex items-center gap-1.5">
          <h2 className={productFormSectionTitle}>Χρώματα &amp; Απόθεμα</h2>
          <FieldTooltip content={FIELD_TOOLTIPS.colors} />
        </div>
        <p className="mt-1 text-sm text-gray-400">
          Επιλέξτε χρώματα και ορίστε απόθεμα ανά χρώμα
        </p>
      </div>

      <p className="text-base text-gray-500">
        Σύνολο Αποθέματος:{" "}
        <span className="text-3xl font-semibold tracking-tight text-gold-500">
          {totalStock}
        </span>{" "}
        <span className="text-sm font-medium text-navy-900">{unit}</span>
      </p>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-400" role="status">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Φόρτωση χρωμάτων…
        </div>
      ) : null}

      {error ? (
        <div className="space-y-2" role="alert">
          <p className="text-sm text-destructive">Αποτυχία φόρτωσης χρωμάτων: {error}</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              initializedRef.current = false;
              setFetchKey((key) => key + 1);
            }}
          >
            Δοκιμή ξανά
          </Button>
        </div>
      ) : null}

      {!loading && !error && colors.length === 0 ? (
        <p className="text-sm text-gray-400">
          Δεν υπάρχουν ενεργά χρώματα. Προσθέστε από{" "}
          <a href="/settings/colors" className="font-medium text-navy-900 underline">
            Ρυθμίσεις → Χρώματα
          </a>
          .
        </p>
      ) : null}

      {!loading && !error && colors.length > 0 ? (
        <div className="grid grid-cols-3 gap-5 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
          {colors.map((color) => {
            const entry = value[color.id];
            const selected = Boolean(entry?.selected);
            return (
              <div key={color.id} className="flex flex-col items-center gap-2">
                <ColorCircle
                  color={{ name: color.name, hexCode: color.hexCode }}
                  size={56}
                  selected={selected}
                  onClick={() => toggleColor(color.id)}
                  className={cn(selected && "ring-[3px] ring-gold-500/40")}
                  title={color.name}
                />
                <span className="max-w-[72px] truncate text-center text-[10px] text-gray-600">
                  {color.name}
                </span>
              </div>
            );
          })}
        </div>
      ) : null}

      {selectedColors.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {selectedColors.map((color) => {
            const entry = value[color.id]!;

            return (
              <div
                key={color.id}
                className="rounded-xl border border-gray-200 bg-gray-50/80 p-4"
              >
                <div className="flex items-center gap-3">
                  <ColorCircle
                    color={{ name: color.name, hexCode: color.hexCode }}
                    size={32}
                  />
                  <span className="font-medium text-navy-900">{color.name}</span>
                  {entry.isPrimary ? (
                    <span className="ml-auto rounded-full bg-gold-500/15 px-2 py-0.5 text-[10px] font-semibold text-gold-600">
                      Πρωτεύον
                    </span>
                  ) : null}
                </div>

                <div className="mt-4 flex items-center justify-between gap-2">
                  <span className="text-sm text-gray-500">Απόθεμα</span>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-9"
                      disabled={disabled}
                      onClick={() => adjustStock(color.id, -1)}
                      aria-label={`Μείωση ${color.name}`}
                    >
                      <Minus className="size-4" />
                    </Button>
                    <Input
                      type="number"
                      min={0}
                      disabled={disabled}
                      value={entry.stock}
                      onChange={(event) =>
                        patchColor(color.id, { stock: event.target.value })
                      }
                      className="h-11 w-20 text-center text-xl font-semibold tabular-nums"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-9"
                      disabled={disabled}
                      onClick={() => adjustStock(color.id, 1)}
                      aria-label={`Αύξηση ${color.name}`}
                    >
                      <Plus className="size-4" />
                    </Button>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-gray-200/80 pt-3">
                  <span className="text-sm text-gray-600">Πρωτεύον χρώμα</span>
                  <PrimaryToggle
                    active={entry.isPrimary}
                    disabled={disabled}
                    onClick={() => setPrimary(color.id)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
