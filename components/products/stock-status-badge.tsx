import {
  getStockStatus,
  type StockStatus,
} from "@/components/products/types";
import { cn } from "@/lib/utils";

const statusLabels: Record<StockStatus, string> = {
  adequate: "Επαρκές",
  low: "Χαμηλό",
  critical: "Κρίσιμο",
};

const statusStyles: Record<StockStatus, string> = {
  adequate: "bg-emerald-100 text-emerald-800",
  low: "bg-amber-100 text-amber-900",
  critical: "bg-red-100 text-red-800",
};

type StockStatusBadgeProps = {
  stock: number;
  minStock: number;
  className?: string;
};

export function StockStatusBadge({
  stock,
  minStock,
  className,
}: StockStatusBadgeProps) {
  const status = getStockStatus(stock, minStock);
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
        statusStyles[status],
        className,
      )}
    >
      {statusLabels[status]}
    </span>
  );
}
