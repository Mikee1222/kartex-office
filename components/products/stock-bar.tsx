import {
  getStockBarColorClass,
  getStockBarPercent,
  getStockStatus,
} from "@/components/products/types";
import { cn } from "@/lib/utils";

type StockBarProps = {
  stock: number;
  /** When set, bar width is stock / maxStock (e.g. max on current page). */
  maxStock?: number;
  minStock?: number;
  className?: string;
  showLabel?: boolean;
  thin?: boolean;
};

const statusBarColor = {
  adequate: "bg-emerald-500",
  low: "bg-amber-500",
  critical: "bg-red-500",
} as const;

/** Progress bar; color by stock thresholds or minStock when provided. */
export function StockBar({
  stock,
  maxStock,
  minStock,
  className,
  showLabel = true,
  thin = false,
}: StockBarProps) {
  const percent =
    maxStock != null && maxStock > 0
      ? Math.min(Math.round((stock / maxStock) * 100), 100)
      : getStockBarPercent(stock);
  const colorClass =
    minStock != null
      ? statusBarColor[getStockStatus(stock, minStock)]
      : getStockBarColorClass(stock);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {showLabel ? (
        <span className="w-10 shrink-0 tabular-nums text-sm font-medium">{stock}</span>
      ) : null}
      <div
        className={cn(
          "flex-1 overflow-hidden rounded-full bg-muted",
          thin ? "h-1" : "h-2",
        )}
      >
        <div
          className={cn("h-full rounded-full transition-all duration-300", colorClass)}
          style={{ width: `${percent}%` }}
          role="progressbar"
          aria-valuenow={stock}
          aria-valuemin={0}
          aria-valuemax={maxStock ?? 100}
          aria-label={`Απόθεμα ${stock}`}
        />
      </div>
    </div>
  );
}
