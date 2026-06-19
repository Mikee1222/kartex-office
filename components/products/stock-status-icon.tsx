import { AlertCircle, CheckCircle2, TriangleAlert } from "lucide-react";

import { getStockStatus } from "@/components/products/types";
import { cn } from "@/lib/utils";

type StockStatusIconProps = {
  stock: number;
  minStock: number;
  size?: number;
  className?: string;
};

export function StockStatusIcon({
  stock,
  minStock,
  size = 14,
  className,
}: StockStatusIconProps) {
  const status = getStockStatus(stock, minStock);

  if (status === "critical") {
    return (
      <AlertCircle
        size={size}
        className={cn("shrink-0 text-red-500", className)}
        aria-hidden
      />
    );
  }

  if (status === "low") {
    return (
      <TriangleAlert
        size={size}
        className={cn("shrink-0 text-amber-500", className)}
        aria-hidden
      />
    );
  }

  return (
    <CheckCircle2
      size={size}
      className={cn("shrink-0 text-emerald-500", className)}
      aria-hidden
    />
  );
}
