"use client";

import { encodeEan13Modules } from "@/lib/products/identifiers";
import { cn } from "@/lib/utils";

type BarcodePreviewProps = {
  value: string;
  className?: string;
};

export function BarcodePreview({ value, className }: BarcodePreviewProps) {
  const trimmed = value.trim();
  const modules = encodeEan13Modules(trimmed);

  if (!modules) return null;

  const barHeight = 40;
  const moduleWidth = 1.2;

  return (
    <div
      className={cn(
        "rounded-lg border border-gray-200 bg-white px-3 py-2",
        className,
      )}
      aria-label={`Προεπισκόπηση barcode ${trimmed}`}
    >
      <svg
        role="img"
        viewBox={`0 0 ${modules.length * moduleWidth} ${barHeight + 14}`}
        className="mx-auto h-14 w-full max-w-[220px]"
        preserveAspectRatio="xMidYMid meet"
      >
        {modules.split("").map((bit, index) =>
          bit === "1" ? (
            <rect
              key={index}
              x={index * moduleWidth}
              y={0}
              width={moduleWidth}
              height={barHeight}
              fill="#111827"
            />
          ) : null,
        )}
        <text
          x={(modules.length * moduleWidth) / 2}
          y={barHeight + 11}
          textAnchor="middle"
          fontSize={9}
          fontFamily="ui-monospace, monospace"
          fill="#374151"
        >
          {trimmed}
        </text>
      </svg>
    </div>
  );
}
