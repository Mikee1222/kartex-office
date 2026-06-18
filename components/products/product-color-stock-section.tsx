"use client";

import * as React from "react";

import { StockStatusBadge } from "@/components/products/stock-status-badge";
import { getStockStatus } from "@/components/products/types";
import { ColorCircle } from "@/components/ui/color-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ProductColorVariant } from "@/lib/products/types";
import { cn } from "@/lib/utils";

type ProductColorStockSectionProps = {
  totalStock: number;
  minStock: number;
  variants: ProductColorVariant[];
  busyId: string | null;
  onSaveStock: (variant: ProductColorVariant, stock: number) => void;
  onToggleActive: (variant: ProductColorVariant) => void;
};

export function ProductColorStockSection({
  totalStock,
  minStock,
  variants,
  busyId,
  onSaveStock,
  onToggleActive,
}: ProductColorStockSectionProps) {
  const [editingVariantId, setEditingVariantId] = React.useState<string | null>(
    null,
  );
  const [editStock, setEditStock] = React.useState("");

  const colorCount = variants.length;
  const maxVariantStock = Math.max(
    ...variants.map((variant) => variant.stock),
    1,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-5">
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-400">Συνολικό απόθεμα</p>
          <p className="text-5xl font-bold tabular-nums tracking-tight text-navy-900">
            {totalStock}
          </p>
          <p className="text-sm text-gray-500">
            {colorCount} {colorCount === 1 ? "χρώμα" : "χρώματα"}
          </p>
        </div>
        <StockStatusBadge stock={totalStock} minStock={minStock} />
      </div>

      {variants.length === 0 ? (
        <p className="text-sm text-gray-400">Δεν έχουν οριστεί ενεργά χρώματα.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {variants.map((variant) => {
            const color = variant.color!;
            const percent =
              totalStock > 0
                ? Math.round((variant.stock / totalStock) * 100)
                : maxVariantStock > 0
                  ? Math.round((variant.stock / maxVariantStock) * 100)
                  : 0;
            const status = getStockStatus(variant.stock, minStock);
            const isEditing = editingVariantId === variant.id;

            return (
              <div
                key={variant.id}
                className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <ColorCircle
                    color={{ name: color.name, hexCode: color.hexCode }}
                    size={64}
                    className="shrink-0 ring-2 ring-white shadow-md"
                  />
                  <div className="min-w-0 flex-1 pt-1">
                    <p className="text-base font-bold text-navy-900">{color.name}</p>
                    <StockStatusBadge
                      stock={variant.stock}
                      minStock={minStock}
                      className="mt-2"
                    />
                  </div>
                </div>

                <div className="mt-5 text-center">
                  <p className="text-4xl font-bold tabular-nums text-navy-900">
                    {variant.stock}
                  </p>
                  <p className="text-sm text-gray-400">τεμάχια</p>
                </div>

                <div className="mt-4 space-y-1.5">
                  <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(percent, 100)}%`,
                        backgroundColor: color.hexCode,
                      }}
                    />
                  </div>
                  <p className="text-right text-xs font-medium tabular-nums text-gray-500">
                    {percent}%
                  </p>
                </div>

                {isEditing ? (
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      value={editStock}
                      onChange={(event) => setEditStock(event.target.value)}
                      className="w-24"
                    />
                    <Button
                      type="button"
                      size="sm"
                      disabled={busyId === variant.id}
                      onClick={() => {
                        const stock = Math.max(
                          0,
                          Math.round(Number.parseInt(editStock, 10) || 0),
                        );
                        onSaveStock(variant, stock);
                        setEditingVariantId(null);
                      }}
                    >
                      OK
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingVariantId(null)}
                    >
                      Άκυρο
                    </Button>
                  </div>
                ) : (
                  <div className="mt-4 flex justify-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className={cn(
                        status === "critical" && "border-red-200 text-red-700",
                      )}
                      disabled={busyId === variant.id}
                      onClick={() => {
                        setEditingVariantId(variant.id);
                        setEditStock(String(variant.stock));
                      }}
                    >
                      Απόθεμα
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={busyId === variant.id}
                      onClick={() => onToggleActive(variant)}
                    >
                      Απενεργ.
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
