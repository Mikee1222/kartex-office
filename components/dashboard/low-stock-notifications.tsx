"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  filterLowStockProducts,
  type LowStockProduct,
} from "@/lib/inventory/low-stock";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const MAX_VISIBLE = 5;

type LowStockNotificationsProps = {
  variant?: "dark" | "light";
};

export function LowStockNotifications({
  variant = "dark",
}: LowStockNotificationsProps) {
  const [products, setProducts] = React.useState<LowStockProduct[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from("products")
        .select("id, name, stock, min_stock");

      if (cancelled) return;

      if (!error && data) {
        setProducts(filterLowStockProducts(data as LowStockProduct[]));
      } else {
        setProducts([]);
      }
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const count = products.length;
  const visible = products.slice(0, MAX_VISIBLE);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "relative",
            variant === "light"
              ? "text-[#64748B] hover:bg-[#F8F9FC] hover:text-kartex-navy"
              : "text-white/80 hover:bg-white/10 hover:text-white",
          )}
          aria-label={
            count > 0
              ? `Ειδοποιήσεις: ${count} προϊόντα με χαμηλό απόθεμα`
              : "Ειδοποιήσεις αποθέματος"
          }
        >
          <Bell className="size-5" />
          {count > 0 ? (
            <span
              className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white"
              aria-hidden
            >
              {count > 99 ? "99+" : count}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="z-50 w-80">
        <div className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Χαμηλό απόθεμα
        </div>
        {loading ? (
          <p className="px-2 py-3 text-sm text-muted-foreground">Φόρτωση…</p>
        ) : count === 0 ? (
          <p className="px-2 py-3 text-sm text-muted-foreground">
            Όλα τα προϊόντα είναι εντός ορίων.
          </p>
        ) : (
          <>
            {visible.map((product) => (
              <DropdownMenuItem key={product.id} asChild>
                <Link href="/inventory" className="cursor-pointer">
                  Χαμηλό απόθεμα: {product.name} ({product.stock} τεμ. απομένουν)
                </Link>
              </DropdownMenuItem>
            ))}
            {count > MAX_VISIBLE ? (
              <p className="px-2 py-1 text-xs text-muted-foreground">
                +{count - MAX_VISIBLE} ακόμα
              </p>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                href="/inventory"
                className={cn("w-full justify-center font-medium text-kartex-navy")}
              >
                Δείτε όλα
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
