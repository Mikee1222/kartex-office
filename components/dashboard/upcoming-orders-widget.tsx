"use client";

import Link from "next/link";
import { addDays, format, parseISO } from "date-fns";
import { el } from "date-fns/locale";
import { Truck, Warehouse } from "lucide-react";
import * as React from "react";

import { fetchScheduleOrders } from "@/lib/schedule/fetch-schedule-orders";
import { type ScheduleOrder } from "@/lib/schedule/types";
import { getAthensDateString } from "@/lib/datetime";
import { formatScheduleDateInput } from "@/lib/schedule/utils";
import { premiumCard } from "@/lib/ui/premium-styles";
import { cn } from "@/lib/utils";

type DaySummary = {
  date: string;
  label: string;
  pickings: number;
  deliveries: number;
  isToday: boolean;
};

function buildNextSevenDays(orders: ScheduleOrder[]): DaySummary[] {
  const todayKey = getAthensDateString();
  const today = parseISO(`${todayKey}T12:00:00`);
  const days: DaySummary[] = [];

  for (let i = 0; i < 7; i++) {
    const date = addDays(today, i);
    const key = formatScheduleDateInput(date);
    let pickings = 0;
    let deliveries = 0;

    for (const order of orders) {
      if (order.pickingDate === key) pickings += 1;
      if (order.deliveryDate === key) deliveries += 1;
    }

    days.push({
      date: key,
      label: format(date, "EEE d/M", { locale: el }),
      pickings,
      deliveries,
      isToday: key === todayKey,
    });
  }

  return days;
}

export function UpcomingOrdersWidget() {
  const [days, setDays] = React.useState<DaySummary[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      const orders = await fetchScheduleOrders();
      if (cancelled) return;
      setDays(buildNextSevenDays(orders));
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className={cn(premiumCard, "p-5 sm:p-6")}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-kartex-navy">Επερχόμενα</h2>
          <p className="text-sm text-muted-foreground">Επόμενες 7 ημέρες</p>
        </div>
        <Link
          href="/schedule"
          className="text-sm font-medium text-kartex-gold hover:underline"
        >
          Πλήρες πρόγραμμα
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Φόρτωση…</p>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {days.map((day) => (
            <Link
              key={day.date}
              href={`/schedule?view=list&date=${day.date}`}
              className={cn(
                "flex min-w-[5.5rem] shrink-0 flex-col items-center rounded-lg border px-3 py-2.5 text-center transition-colors",
                day.isToday
                  ? "border-kartex-gold bg-kartex-gold/15 ring-2 ring-kartex-gold/50"
                  : day.pickings + day.deliveries > 0
                    ? "border-kartex-gold/40 bg-kartex-gold/10 hover:bg-kartex-gold/20"
                    : "border-border bg-[#F8F9FC] hover:border-kartex-gold/30",
              )}
            >
              <span
                className={cn(
                  "text-[10px] font-medium uppercase",
                  day.isToday ? "text-kartex-navy" : "text-muted-foreground",
                )}
              >
                {day.isToday ? "Σήμερα" : day.label}
              </span>
              <span className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Warehouse className="size-3.5 shrink-0" aria-hidden />
                {day.pickings}
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Truck className="size-3.5 shrink-0" aria-hidden />
                {day.deliveries}
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
