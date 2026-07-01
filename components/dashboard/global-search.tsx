"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

import { Input } from "@/components/ui/input";
import { searchAll } from "@/lib/dashboard/search-all";
import { createClient } from "@/lib/supabase/client";
import { mapDbCustomerType, formatCurrencyEl } from "@/types/database";
import { cn } from "@/lib/utils";

type SearchResultGroup = {
  title: string;
  items: { id: string; href: string; label: string }[];
};

type GlobalSearchProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [query, setQuery] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [groups, setGroups] = React.useState<SearchResultGroup[]>([]);

  React.useEffect(() => {
    if (!open) {
      setQuery("");
      setGroups([]);
      return;
    }
    const timer = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [open]);

  React.useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onOpenChange(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  React.useEffect(() => {
    if (!open) return;

    const q = query.trim();
    if (q.length < 2) {
      setGroups([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        setLoading(true);
        const supabase = createClient();
        const { orders, customers, products } = await searchAll(supabase, q);

        if (cancelled) return;

        const nextGroups: SearchResultGroup[] = [];

        if (orders.length > 0) {
          nextGroups.push({
            title: "ΠΑΡΑΓΓΕΛΙΕΣ",
            items: orders.map((order) => {
              const customerJoin = order.customers;
              const customerName = Array.isArray(customerJoin)
                ? customerJoin[0]?.name
                : customerJoin?.name;
              const total =
                typeof order.total === "number"
                  ? order.total
                  : Number.parseFloat(String(order.total));
              const totalLabel = Number.isFinite(total)
                ? formatCurrencyEl(total)
                : "—";
              return {
                id: order.id,
                href: `/orders/${order.id}`,
                label: `${order.order_number} — ${customerName?.trim() || "—"} — ${totalLabel}`,
              };
            }),
          });
        }

        if (customers.length > 0) {
          nextGroups.push({
            title: "ΠΕΛΑΤΕΣ",
            items: customers.map((customer) => ({
              id: customer.id,
              href: `/customers/${customer.id}`,
              label: `${customer.name} — ${mapDbCustomerType(customer.type)} — ${customer.city?.trim() || "—"}`,
            })),
          });
        }

        if (products.length > 0) {
          nextGroups.push({
            title: "ΠΡΟΪΟΝΤΑ",
            items: products.map((product) => ({
              id: product.id,
              href: `/products/${product.id}`,
              label: `${product.name} — ${product.sku} — ${product.stock} τεμ.`,
            })),
          });
        }

        setGroups(nextGroups);
        setLoading(false);
      })();
    }, 280);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, open]);

  function navigate(href: string) {
    onOpenChange(false);
    router.push(href);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 px-4 pt-[12vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Καθολική αναζήτηση"
    >
      <button
        type="button"
        className="absolute inset-0"
        aria-label="Κλείσιμο"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-lg border border-border bg-card shadow-2xl">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Search className="size-5 shrink-0 text-muted-foreground" aria-hidden />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Αναζήτηση παραγγελιών, πελατών, προϊόντων…"
            className="border-0 bg-transparent shadow-none focus-visible:ring-0"
            autoComplete="off"
          />
          <kbd className="hidden shrink-0 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground sm:inline">
            ESC
          </kbd>
        </div>
        <div className="max-h-[min(60vh,480px)] overflow-y-auto p-2">
          {query.trim().length < 2 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              Πληκτρολογήστε τουλάχιστον 2 χαρακτήρες.
            </p>
          ) : loading ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              Αναζήτηση…
            </p>
          ) : groups.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              Δεν βρέθηκαν αποτελέσματα.
            </p>
          ) : (
            groups.map((group) => (
              <div key={group.title} className="mb-3 last:mb-0">
                <p className="px-3 py-1.5 text-xs font-semibold tracking-wide text-kartex-gold">
                  {group.title}
                </p>
                <ul>
                  {group.items.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        className={cn(
                          "w-full rounded-md px-3 py-2 text-left text-sm text-foreground",
                          "hover:bg-muted focus-visible:bg-muted focus-visible:outline-none",
                        )}
                        onClick={() => navigate(item.href)}
                      >
                        {item.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export function useGlobalSearchShortcut(onOpen: () => void) {
  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onOpen();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onOpen]);
}
