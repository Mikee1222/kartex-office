"use client";

import * as React from "react";
import { Check } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { premiumLabel } from "@/lib/ui/premium-styles";
import { cn } from "@/lib/utils";

function normalizeHex(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "#000000";
  const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  if (/^#[0-9A-Fa-f]{6}$/.test(withHash)) return withHash.toUpperCase();
  if (/^#[0-9A-Fa-f]{3}$/.test(withHash)) {
    const h = withHash.slice(1);
    return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`.toUpperCase();
  }
  return "#000000";
}

export type ColorPickerValue = {
  hex: string;
  name?: string;
};

type ColorPickerProps = {
  value: ColorPickerValue;
  onChange: (value: ColorPickerValue) => void;
  showName?: boolean;
  nameLabel?: string;
  className?: string;
  disabled?: boolean;
};

export function ColorPicker({
  value,
  onChange,
  showName = false,
  nameLabel = "Όνομα χρώματος",
  className,
  disabled = false,
}: ColorPickerProps) {
  const hex = normalizeHex(value.hex);

  function updateHex(next: string) {
    onChange({ ...value, hex: normalizeHex(next) });
  }

  return (
    <div className={cn("space-y-4", className)}>
      {showName ? (
        <div className="space-y-2">
          <Label className={premiumLabel}>{nameLabel}</Label>
          <Input
            value={value.name ?? ""}
            onChange={(event) =>
              onChange({ ...value, name: event.target.value })
            }
            disabled={disabled}
            placeholder="π.χ. Λευκό"
          />
        </div>
      ) : null}

      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-2">
          <Label className={premiumLabel}>Επιλογή χρώματος</Label>
          <input
            type="color"
            value={hex}
            disabled={disabled}
            onChange={(event) => updateHex(event.target.value)}
            className="h-11 w-14 cursor-pointer rounded-lg border border-gray-200 bg-white p-1"
            aria-label="Επιλογή χρώματος"
          />
        </div>

        <div className="min-w-[140px] flex-1 space-y-2">
          <Label className={premiumLabel}>Hex</Label>
          <Input
            value={hex}
            disabled={disabled}
            onChange={(event) => updateHex(event.target.value)}
            className="font-mono text-sm uppercase"
            placeholder="#D4AF37"
          />
        </div>

        <div className="flex flex-col items-center gap-2">
          <Label className={premiumLabel}>Προεπισκόπηση</Label>
          <span
            className="size-10 rounded-full border-2 border-gray-200 shadow-inner"
            style={{ backgroundColor: hex }}
            aria-hidden
          />
        </div>
      </div>
    </div>
  );
}

type ColorCircleProps = {
  color: { name: string; hexCode: string };
  size?: number;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
  title?: string;
};

export function ColorCircle({
  color,
  size = 40,
  selected = false,
  onClick,
  className,
  title,
}: ColorCircleProps) {
  const Comp = onClick ? "button" : "span";

  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      title={title ?? color.name}
      className={cn(
        "relative shrink-0 rounded-full border-2 transition-all",
        selected
          ? "border-gold-500 ring-[3px] ring-gold-500/40"
          : "border-gray-200 hover:border-gray-300",
        onClick && "cursor-pointer",
        className,
      )}
      style={{
        width: size,
        height: size,
        backgroundColor: color.hexCode,
      }}
    >
      {selected ? (
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/25 text-white">
          <Check className="size-3.5 stroke-[3]" aria-hidden />
        </span>
      ) : null}
    </Comp>
  );
}

type ColorCirclesRowProps = {
  colors: { id: string; name: string; hexCode: string }[];
  maxVisible?: number;
  size?: number;
};

export function ColorCirclesRow({
  colors,
  maxVisible = 5,
  size = 20,
}: ColorCirclesRowProps) {
  if (colors.length === 0) return null;

  const visible = colors.slice(0, maxVisible);
  const extra = colors.length - visible.length;

  return (
    <div
      className="flex items-center gap-1"
      title={colors.map((color) => color.name).join(", ")}
    >
      {visible.map((color) => (
        <span
          key={color.id}
          className="rounded-full border border-white shadow-sm ring-1 ring-gray-200"
          style={{
            width: size,
            height: size,
            backgroundColor: color.hexCode,
          }}
          aria-hidden
        />
      ))}
      {extra > 0 ? (
        <span className="text-xs font-medium text-gray-400">+{extra}</span>
      ) : null}
    </div>
  );
}
