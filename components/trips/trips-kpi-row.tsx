"use client";

import { Package, Route, Warehouse } from "lucide-react";

import type { TripsCalendarKpis } from "@/lib/trips/calendar-types";
import { premiumStatCard } from "@/lib/ui/premium-styles";
import { cn } from "@/lib/utils";

type TripsKpiRowProps = {
  kpis: TripsCalendarKpis;
  lastUpdated: Date | null;
  loading?: boolean;
};

export function TripsKpiRow({ kpis, lastUpdated, loading }: TripsKpiRowProps) {
  const cards = [
    {
      key: "trips-today",
      label: "Δρομολόγια σήμερα",
      value: kpis.tripsToday,
      icon: Route,
      accent: "border-l-violet-500",
    },
    {
      key: "unassigned",
      label: "Χωρίς δρομολόγιο",
      value: kpis.unassignedOrders,
      icon: Package,
      accent: "border-l-blue-500",
    },
    {
      key: "picking-backlog",
      label: "Picking backlog",
      value: kpis.pickingBacklog,
      icon: Warehouse,
      accent: "border-l-amber-500",
    },
  ] as const;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Επιχειρησιακή εικόνα
        </p>
        {lastUpdated ? (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" aria-hidden />
            Ενημέρωση {lastUpdated.toLocaleTimeString("el-GR", { hour: "2-digit", minute: "2-digit" })}
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <article
            key={card.key}
            className={cn(premiumStatCard, "border-l-4 p-5", card.accent)}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {card.label}
                </p>
                <p className="mt-2 text-3xl font-semibold tabular-nums text-kartex-navy">
                  {loading ? "—" : card.value}
                </p>
              </div>
              <card.icon className="size-5 shrink-0 text-muted-foreground/70" aria-hidden />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
