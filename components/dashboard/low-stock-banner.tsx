"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { filterLowStockProducts, type LowStockProduct } from "@/lib/inventory/low-stock";
import { createClient } from "@/lib/supabase/client";

export function LowStockBanner() {
  const [count, setCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("products")
        .select("id, name, stock, min_stock");

      if (cancelled) return;

      if (!error && data) {
        setCount(filterLowStockProducts(data as LowStockProduct[]).length);
      } else {
        setCount(0);
      }
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || count === 0) {
    return null;
  }

  return (
    <div
      className="mb-6 flex flex-col gap-3 rounded-lg border border-amber-300/80 bg-amber-50 px-4 py-3 text-amber-950 sm:flex-row sm:items-center sm:justify-between"
      role="status"
    >
      <p className="flex items-center gap-2 text-sm font-medium">
        <AlertTriangle className="size-4 shrink-0 text-amber-600" aria-hidden />
        {count} προϊόντα έχουν χαμηλό απόθεμα
      </p>
      <Button
        asChild
        size="sm"
        variant="outline"
        className="shrink-0 border-amber-400 bg-white text-amber-950 hover:bg-amber-100"
      >
        <Link href="/inventory">Δείτε Αποθήκη</Link>
      </Button>
    </div>
  );
}
