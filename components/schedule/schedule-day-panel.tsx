"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { format } from "date-fns";
import { el } from "date-fns/locale";

import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { type ScheduleOrder } from "@/lib/schedule/types";

type ScheduleDayPanelProps = {
  date: Date;
  pickings: ScheduleOrder[];
  deliveries: ScheduleOrder[];
  onClose: () => void;
};

function OrderList({
  title,
  orders,
  dotClass,
}: {
  title: string;
  orders: ScheduleOrder[];
  dotClass: string;
}) {
  if (orders.length === 0) return null;

  return (
    <section className="space-y-2">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-kartex-navy">
        <span className={`size-2 rounded-full ${dotClass}`} aria-hidden />
        {title}
        <span className="text-muted-foreground">({orders.length})</span>
      </h3>
      <ul className="space-y-2">
        {orders.map((order) => (
          <li key={`${title}-${order.id}`}>
            <Link
              href={`/orders/${order.id}`}
              className="block rounded-lg border border-border bg-white p-3 transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-kartex-navy">{order.orderNumber}</p>
                  <p className="text-sm text-muted-foreground">{order.customerName}</p>
                </div>
                <OrderStatusBadge status={order.status} />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ScheduleDayPanel({
  date,
  pickings,
  deliveries,
  onClose,
}: ScheduleDayPanelProps) {
  const label = format(date, "EEEE d MMMM yyyy", { locale: el });

  return (
    <aside className="rounded-xl border border-border bg-white p-4 shadow-sm lg:sticky lg:top-4">
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Επιλεγμένη ημέρα
          </p>
          <h2 className="text-lg font-semibold capitalize text-kartex-navy">{label}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-muted-foreground hover:bg-[#F8F9FC] hover:text-kartex-navy"
          aria-label="Κλείσιμο"
        >
          <X className="size-5" />
        </button>
      </div>

      {pickings.length === 0 && deliveries.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Δεν υπάρχουν προγραμματισμένες παραγγελίες αυτή την ημέρα.
        </p>
      ) : (
        <div className="space-y-5">
          <OrderList title="Picking" orders={pickings} dotClass="bg-amber-500" />
          <OrderList
            title="Παράδοση"
            orders={deliveries}
            dotClass="bg-blue-500"
          />
        </div>
      )}
    </aside>
  );
}
