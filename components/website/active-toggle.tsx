"use client";

import { cn } from "@/lib/utils";

type ActiveToggleProps = {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  label?: string;
};

export function ActiveToggle({
  active,
  disabled,
  onClick,
  label,
}: ActiveToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      aria-label={label}
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
