"use client";

import {
  AlertTriangle,
  ShoppingBag,
  TrendingDown,
  TrendingUp,
  Truck,
} from "lucide-react";
import { format } from "date-fns";
import { el } from "date-fns/locale";
import Link from "next/link";
import * as React from "react";

import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { DataError } from "@/components/dashboard/data-error";
import { OrderStatus } from "@/components/orders/types";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  premiumDateLine,
  premiumGreeting,
  premiumStatCard,
  premiumTableHead,
  premiumTableRow,
  premiumTableWrap,
} from "@/lib/ui/premium-styles";
import { createClient } from "@/lib/supabase/client";
import {
  getAthensDateString,
  getAthensYearMonth,
  getPreviousAthensYearMonth,
  isDeliveryOnAthensDay,
  isIsoInAthensMonth,
  isIsoOnAthensDay,
} from "@/lib/datetime";
import {
  formatCurrencyEl,
  formatDateEl,
  mapOrderRow,
  type OrderRow,
  type ProductRow,
} from "@/types/database";
import { cn } from "@/lib/utils";

type DashboardStats = {
  ordersToday: number;
  monthRevenue: number;
  lowStock: number;
  deliveriesToday: number;
};

type StatTrend = {
  direction: "up" | "down";
  label: string;
};

type DashboardTrends = {
  monthOrders: StatTrend | null;
  monthRevenue: StatTrend | null;
};

function parseOrderTotal(row: OrderRow): number {
  const total =
    typeof row.total === "number"
      ? row.total
      : Number.parseFloat(String(row.total));
  return Number.isFinite(total) ? total : 0;
}

function computeMonthMetrics(orders: OrderRow[], yearMonth: string) {
  let orderCount = 0;
  let revenue = 0;

  for (const row of orders) {
    if (!isIsoInAthensMonth(row.created_at, yearMonth)) continue;
    orderCount += 1;
    revenue += parseOrderTotal(row);
  }

  return { orderCount, revenue };
}

function computeTrend(current: number, previous: number): StatTrend | null {
  if (previous <= 0) return null;
  if (current === previous) return null;
  const pct = Math.round((Math.abs(current - previous) / previous) * 100);
  if (current > previous) {
    return { direction: "up", label: `↑ ${pct}%` };
  }
  return { direction: "down", label: `↓ ${pct}%` };
}

type RecentOrderRow = {
  id: string;
  orderNumber: string;
  customer: string;
  status: ReturnType<typeof mapOrderRow>["status"];
  totalEur: number;
  date: string;
};

const statMeta = [
  {
    key: "ordersToday" as const,
    title: "Παραγγελίες",
    icon: ShoppingBag,
    circle: "bg-navy-900 text-white",
    bar: "bg-navy-900",
    trendKey: "monthOrders" as const,
  },
  {
    key: "monthRevenue" as const,
    title: "Έσοδα Μήνα",
    icon: TrendingUp,
    circle: "bg-gold-500/15 text-gold-500",
    bar: "bg-gold-500",
    trendKey: "monthRevenue" as const,
  },
  {
    key: "lowStock" as const,
    title: "Χαμηλό Απόθεμα",
    icon: AlertTriangle,
    circle: "bg-danger/10 text-danger",
    bar: "bg-danger",
    trendKey: null,
  },
  {
    key: "deliveriesToday" as const,
    title: "Παραδόσεις",
    icon: Truck,
    circle: "bg-success/10 text-success",
    bar: "bg-success",
    trendKey: null,
  },
];

function formatStatValue(key: keyof DashboardStats, value: number) {
  if (key === "monthRevenue") {
    return formatCurrencyEl(value).replace(/\s*€/, " €");
  }
  return String(value);
}

function customerInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "—";
}

function displayNameFromEmail(email: string) {
  const local = email.split("@")[0] ?? email;
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

function StatCardsSkeleton() {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {statMeta.map((card) => (
        <div key={card.key} className={cn(premiumStatCard, "p-5")}>
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="mt-4 h-9 w-24" />
          <Skeleton className="mt-2 h-4 w-32" />
        </div>
      ))}
    </section>
  );
}

type DashboardViewProps = {
  userEmail?: string;
};

export function DashboardView({ userEmail }: DashboardViewProps) {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [fetchKey, setFetchKey] = React.useState(0);
  const [stats, setStats] = React.useState<DashboardStats>({
    ordersToday: 0,
    monthRevenue: 0,
    lowStock: 0,
    deliveriesToday: 0,
  });
  const [trends, setTrends] = React.useState<DashboardTrends>({
    monthOrders: null,
    monthRevenue: null,
  });
  const [recentOrders, setRecentOrders] = React.useState<RecentOrderRow[]>([]);
  const [allOrders, setAllOrders] = React.useState<OrderRow[]>([]);

  const greetingName = userEmail ? displayNameFromEmail(userEmail) : "σας";
  const todayLabel = format(new Date(), "EEEE, d MMMM yyyy", { locale: el });

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      const supabase = createClient();
      const todayStr = getAthensDateString();

      const [ordersResult, productsResult] = await Promise.all([
        supabase
          .from("orders")
          .select("*, customers(name)")
          .order("created_at", { ascending: false })
          .limit(200),
        supabase.from("products").select("id, stock, min_stock"),
      ]);

      if (cancelled) return;

      if (ordersResult.error || productsResult.error) {
        const message =
          ordersResult.error?.message ||
          productsResult.error?.message ||
          "Αποτυχία φόρτωσης πίνακα ελέγχου.";
        setError(message);
        setLoading(false);
        return;
      }

      const orders = (ordersResult.data ?? []) as OrderRow[];
      const products = (productsResult.data ?? []) as Pick<
        ProductRow,
        "id" | "stock" | "min_stock"
      >[];

      let ordersToday = 0;
      let deliveriesToday = 0;

      for (const row of orders) {
        if (isIsoOnAthensDay(row.created_at, todayStr)) {
          ordersToday += 1;
        }
        if (
          row.status === OrderStatus.Shipped &&
          isDeliveryOnAthensDay(row.delivery_date, todayStr)
        ) {
          deliveriesToday += 1;
        }
      }

      const currentMonth = computeMonthMetrics(orders, getAthensYearMonth());
      const previousMonth = computeMonthMetrics(
        orders,
        getPreviousAthensYearMonth(),
      );

      const lowStock = products.filter((p) => p.stock < p.min_stock).length;

      const recent = orders.slice(0, 5).map((row) => {
        const mapped = mapOrderRow(row);
        return {
          id: mapped.id,
          orderNumber: mapped.orderNumber,
          customer: mapped.customer,
          status: mapped.status,
          totalEur: mapped.totalEur,
          date: formatDateEl(row.created_at),
        };
      });

      setStats({
        ordersToday,
        monthRevenue: currentMonth.revenue,
        lowStock,
        deliveriesToday,
      });
      setTrends({
        monthOrders: computeTrend(
          currentMonth.orderCount,
          previousMonth.orderCount,
        ),
        monthRevenue: computeTrend(
          currentMonth.revenue,
          previousMonth.revenue,
        ),
      });
      setRecentOrders(recent);
      setAllOrders(orders);
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [fetchKey]);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header>
        <h1 className={premiumGreeting}>Καλημέρα, {greetingName}</h1>
        <p className={cn(premiumDateLine, "mt-1 capitalize")}>{todayLabel}</p>
      </header>

      {error ? (
        <DataError message={error} onRetry={() => setFetchKey((k) => k + 1)} />
      ) : null}

      {loading ? <StatCardsSkeleton /> : null}

      {!loading && !error ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {statMeta.map((card) => {
              const Icon = card.icon;
              const value = stats[card.key];
              const trend = card.trendKey ? trends[card.trendKey] : null;
              const progress =
                card.key === "monthRevenue"
                  ? Math.min(100, (value / 50000) * 100)
                  : Math.min(100, value * 12);

              return (
                <article
                  key={card.key}
                  className={cn(premiumStatCard, "group p-5")}
                >
                  <div className="flex items-start justify-between">
                    <span
                      className={cn(
                        "flex size-10 items-center justify-center rounded-full",
                        card.circle,
                      )}
                    >
                      <Icon className="size-5" aria-hidden />
                    </span>
                    {trend ? (
                      <span
                        className={cn(
                          "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                          trend.direction === "up"
                            ? "bg-success/10 text-success"
                            : "bg-danger/10 text-danger",
                        )}
                      >
                        {trend.direction === "up" ? (
                          <TrendingUp className="size-3" aria-hidden />
                        ) : (
                          <TrendingDown className="size-3" aria-hidden />
                        )}
                        {trend.label}
                      </span>
                    ) : card.trendKey ? (
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold text-gray-400">
                        —
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-4 text-[36px] font-semibold leading-none tracking-tight text-navy-900">
                    {formatStatValue(card.key, value)}
                  </p>
                  <p className="mt-1 text-[13px] text-gray-400">{card.title}</p>
                  <div className="mt-4 h-1 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={cn("h-full rounded-full transition-all", card.bar)}
                      style={{ width: `${Math.max(progress, 8)}%` }}
                    />
                  </div>
                </article>
              );
            })}
          </section>

          <DashboardCharts orders={allOrders} />
        </>
      ) : null}

      {loading ? (
        <div className={cn(premiumTableWrap, "p-6")}>
          <Skeleton className="h-6 w-48" />
          <div className="mt-6 space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        </div>
      ) : null}

      {!loading && !error ? (
        <section className={premiumTableWrap}>
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <div>
              <h2 className="text-base font-semibold text-navy-900">
                Πρόσφατες Παραγγελίες
              </h2>
              <p className="text-xs text-gray-400">Τελευταίες 5 καταχωρήσεις</p>
            </div>
            <Link
              href="/orders"
              className="text-sm font-medium text-gold-500 transition-colors hover:text-gold-400"
            >
              Δείτε όλες →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className={premiumTableHead}>
                  <th className="px-6 py-3">Παραγγελία</th>
                  <th className="px-4 py-3">Πελάτης</th>
                  <th className="px-4 py-3">Κατάσταση</th>
                  <th className="px-4 py-3">Ποσό</th>
                  <th className="px-4 py-3 pr-6">Ημερομηνία</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-gray-400"
                    >
                      Δεν υπάρχουν παραγγελίες ακόμα.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr key={order.id} className={premiumTableRow}>
                      <td className="px-6 py-3.5">
                        <Link
                          href={`/orders/${order.id}`}
                          className="font-mono font-semibold text-navy-900 transition-colors hover:text-gold-500"
                        >
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-navy-900/5 text-xs font-bold text-navy-900">
                            {customerInitials(order.customer)}
                          </span>
                          <span className="font-medium text-navy-900">
                            {order.customer}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <OrderStatusBadge status={order.status} />
                      </td>
                      <td className="px-4 py-3.5 font-semibold tabular-nums text-navy-900">
                        {formatCurrencyEl(order.totalEur)}
                      </td>
                      <td className="px-4 py-3.5 pr-6 text-gray-400">
                        {order.date}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
