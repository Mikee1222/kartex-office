"use client";

import { Package, Search } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { DataError } from "@/components/dashboard/data-error";
import { OrderRowActions } from "@/components/orders/order-row-actions";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import {
  ORDER_FILTER_TABS,
  OrderStatus,
  type Order,
  type OrderFilterTab,
} from "@/components/orders/types";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { TablePagination } from "@/components/ui/table-pagination";
import {
  premiumFilterTabActive,
  premiumFilterTabActiveGold,
  premiumFilterTabInactive,
  premiumGoldButton,
  premiumInputFocus,
  premiumTableWrap,
} from "@/lib/ui/premium-styles";
import { useNotificationsStore } from "@/lib/notifications-store";
import { createClient } from "@/lib/supabase/client";
import {
  countItemsByOrder,
  formatCurrencyEl,
  mapOrderRow,
  type OrderItemCountRow,
  type OrderRow,
} from "@/types/database";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 5;

function matchesSearch(order: Order, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return (
    order.orderNumber.toLowerCase().includes(normalized) ||
    order.customer.toLowerCase().includes(normalized)
  );
}

function OrdersCardsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-20 rounded-2xl" />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: PAGE_SIZE }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export function OrdersList() {
  const [search, setSearch] = React.useState("");
  const [activeTab, setActiveTab] = React.useState<OrderFilterTab>("all");
  const [page, setPage] = React.useState(1);
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [fetchKey, setFetchKey] = React.useState(0);
  const [highlightedIds, setHighlightedIds] = React.useState<Set<string>>(
    () => new Set(),
  );
  const ordersVersion = useNotificationsStore((state) => state.ordersVersion);
  const lastUpdatedOrderId = useNotificationsStore(
    (state) => state.lastUpdatedOrderId,
  );

  const markHighlighted = React.useCallback((orderId: string) => {
    setHighlightedIds((prev) => new Set(prev).add(orderId));
    window.setTimeout(() => {
      setHighlightedIds((prev) => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
    }, 8000);
  }, []);

  React.useEffect(() => {
    setPage(1);
  }, [search, activeTab]);

  React.useEffect(() => {
    if (ordersVersion === 0) return;
    setFetchKey((key) => key + 1);
    if (lastUpdatedOrderId) {
      markHighlighted(lastUpdatedOrderId);
    }
  }, [ordersVersion, lastUpdatedOrderId, markHighlighted]);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      const supabase = createClient();

      const [ordersResult, itemsResult] = await Promise.all([
        supabase
          .from("orders")
          .select(`
            *,
            customers(name, city),
            order_items(count),
            quote_request:quote_request_id(contact_name, company_name, email)
          `)
          .order("created_at", { ascending: false }),
        supabase.from("order_items").select("order_id"),
      ]);

      if (cancelled) return;

      if (ordersResult.error) {
        setError(
          ordersResult.error.message ||
            "Αποτυχία φόρτωσης παραγγελιών. Ελέγξτε τη σύνδεση και τα δικαιώματα πρόσβασης.",
        );
        setOrders([]);
        setLoading(false);
        return;
      }

      const itemCounts = countItemsByOrder(
        (itemsResult.data ?? []) as OrderItemCountRow[],
      );

      const mapped = (ordersResult.data as OrderRow[]).map((row) => {
        const embedded = row.order_items?.[0]?.count;
        const count =
          typeof embedded === "number"
            ? embedded
            : (itemCounts.get(row.id) ?? 0);
        return mapOrderRow(row, count);
      });

      setOrders(mapped);
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [fetchKey, ordersVersion]);

  const filtered = React.useMemo(() => {
    return orders.filter((order) => {
      const tabMatch = activeTab === "all" || order.status === activeTab;
      return tabMatch && matchesSearch(order, search);
    });
  }, [orders, search, activeTab]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  const stats = [
    {
      label: "Σύνολο",
      value: orders.length,
      color: "text-navy-900",
    },
    {
      label: "Σε Επεξεργασία",
      value: orders.filter((o) => o.status === OrderStatus.Processing).length,
      color: "text-amber-600",
    },
    {
      label: "Αποστολή",
      value: orders.filter((o) => o.status === OrderStatus.Shipped).length,
      color: "text-blue-600",
    },
    {
      label: "Ολοκληρώθηκε",
      value: orders.filter((o) => o.status === OrderStatus.Completed).length,
      color: "text-emerald-600",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Παραγγελίες"
        subtitle="Διαχείριση και παρακολούθηση παραγγελιών"
        action={
          <div className="flex items-center gap-2">
            <Button asChild className={premiumGoldButton}>
              <Link href="/orders/new">Νέα Παραγγελία</Link>
            </Button>
          </div>
        }
      />

      <div className="flex flex-col gap-4">
        <div className="relative max-w-lg flex-1">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-gray-400"
            aria-hidden
          />
          <Input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Αναζήτηση αρ. παραγγελίας ή πελάτη…"
            className={cn(
              "h-11 rounded-full border-gray-200 bg-gray-50 pl-11 shadow-none focus-visible:bg-white",
              premiumInputFocus,
            )}
            aria-label="Αναζήτηση παραγγελιών"
            disabled={loading}
          />
        </div>

        <div
          className="flex flex-wrap gap-2"
          role="tablist"
          aria-label="Φίλτρο κατάστασης"
        >
          {ORDER_FILTER_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  isActive
                    ? tab.id === "all"
                      ? premiumFilterTabActive
                      : premiumFilterTabActiveGold
                    : premiumFilterTabInactive,
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {error ? (
        <DataError message={error} onRetry={() => setFetchKey((k) => k + 1)} />
      ) : null}

      {loading ? <OrdersCardsSkeleton /> : null}

      {!loading && !error ? (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-border bg-card p-4"
              >
                <div
                  className={cn(
                    "text-3xl font-black tabular-nums",
                    stat.color,
                  )}
                >
                  {stat.value}
                </div>
                <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {pageRows.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-12 text-center">
              <Package
                size={40}
                className="mx-auto mb-3 text-muted-foreground/40"
                aria-hidden
              />
              <p className="font-medium text-muted-foreground">
                {orders.length === 0
                  ? "Δεν υπάρχουν παραγγελίες ακόμα."
                  : "Δεν βρέθηκαν παραγγελίες με τα τρέχοντα φίλτρα."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pageRows.map((order) => (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="block no-underline"
                >
                  <div
                    className={cn(
                      "cursor-pointer rounded-2xl border bg-card p-5 transition-all duration-200 hover:border-kartex-gold/30 hover:shadow-md",
                      highlightedIds.has(order.id) &&
                        "border-emerald-300 ring-2 ring-emerald-400",
                      order.status === OrderStatus.PendingPayment &&
                        "border-amber-200",
                      order.status === OrderStatus.Confirmed &&
                        "border-blue-200",
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-start gap-4">
                        <div
                          className={cn(
                            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                            order.status === OrderStatus.Completed
                              ? "bg-emerald-50"
                              : order.status === OrderStatus.Shipped
                                ? "bg-blue-50"
                                : order.status === OrderStatus.PendingPayment
                                  ? "bg-amber-50"
                                  : "bg-kartex-gold/10",
                          )}
                        >
                          <Package
                            size={20}
                            className={cn(
                              order.status === OrderStatus.Completed
                                ? "text-emerald-500"
                                : order.status === OrderStatus.Shipped
                                  ? "text-blue-500"
                                  : order.status === OrderStatus.PendingPayment
                                    ? "text-amber-500"
                                    : "text-kartex-gold",
                            )}
                            aria-hidden
                          />
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-base font-bold text-navy-900">
                              {order.orderNumber}
                            </span>
                            {highlightedIds.has(order.id) ? (
                              <span
                                className="size-2 animate-pulse rounded-full bg-emerald-400"
                                title="Πρόσφατη ενημέρωση"
                                aria-hidden
                              />
                            ) : null}
                          </div>
                          <div className="mt-0.5 font-semibold text-kartex-navy">
                            {order.customer}
                          </div>
                          <div className="mt-0.5 text-xs text-muted-foreground">
                            {order.date} · {order.itemCount}{" "}
                            {order.itemCount === 1 ? "προϊόν" : "προϊόντα"}
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-4">
                        <div className="text-right">
                          <div className="text-lg font-black tabular-nums text-kartex-navy">
                            {formatCurrencyEl(order.totalEur)}
                          </div>
                          <OrderStatusBadge status={order.status} />
                        </div>
                        <div onClick={(event) => event.preventDefault()}>
                          <OrderRowActions
                            order={order}
                            onDeleted={() => setFetchKey((k) => k + 1)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {filtered.length > 0 ? (
            <div className={cn(premiumTableWrap, "overflow-hidden")}>
              <TablePagination
                page={currentPage}
                totalPages={totalPages}
                totalItems={filtered.length}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
              />
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
