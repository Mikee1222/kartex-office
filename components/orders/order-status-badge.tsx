import { OrderStatus, type OrderStatus as OrderStatusType } from "@/components/orders/types";
import { cn } from "@/lib/utils";

const ACTIVE_STATUSES: OrderStatusType[] = [
  OrderStatus.Processing,
  OrderStatus.Confirmed,
  OrderStatus.ReadyForShipment,
  OrderStatus.Shipped,
];

export const statusStyles: Record<OrderStatusType, { pill: string; dot: string }> = {
  "Σε Επεξεργασία": {
    pill: "bg-slate-100 text-slate-700",
    dot: "bg-slate-500",
  },
  Προγραμματισμένη: {
    pill: "bg-purple-50 text-purple-800",
    dot: "bg-purple-500",
  },
  Επιβεβαιώθηκε: {
    pill: "bg-blue-50 text-blue-800",
    dot: "bg-info",
  },
  "Έτοιμο για Αποστολή": {
    pill: "bg-cyan-50 text-cyan-900",
    dot: "bg-cyan-500",
  },
  Δεσμευμένη: {
    pill: "bg-indigo-50 text-indigo-800",
    dot: "bg-indigo-500",
  },
  "Μερική Αποστολή": {
    pill: "bg-orange-50 text-orange-800",
    dot: "bg-warning",
  },
  Αποστολή: {
    pill: "bg-orange-50 text-orange-800",
    dot: "bg-warning",
  },
  Ολοκληρώθηκε: {
    pill: "bg-emerald-50 text-emerald-800",
    dot: "bg-success",
  },
  "Αναμονή πληρωμής": {
    pill: "bg-amber-50 text-amber-900",
    dot: "bg-amber-500",
  },
  Ακυρώθηκε: {
    pill: "bg-red-50 text-red-700",
    dot: "bg-danger",
  },
};

export function getStatusDotClass(status: OrderStatusType): string {
  return statusStyles[status]?.dot ?? statusStyles["Σε Επεξεργασία"].dot;
}

export function isActiveOrderStatus(status: OrderStatusType): boolean {
  return ACTIVE_STATUSES.includes(status);
}

type OrderStatusBadgeProps = {
  status: OrderStatusType;
  className?: string;
  pulse?: boolean;
};

export function OrderStatusBadge({
  status,
  className,
  pulse,
}: OrderStatusBadgeProps) {
  const styles = statusStyles[status] ?? statusStyles["Σε Επεξεργασία"];
  const shouldPulse = pulse ?? isActiveOrderStatus(status);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        styles.pill,
        className,
      )}
    >
      <StatusDot status={status} pulse={shouldPulse} />
      {status}
    </span>
  );
}

export function StatusDot({
  status,
  className,
  pulse,
}: {
  status: OrderStatusType;
  className?: string;
  pulse?: boolean;
}) {
  const styles = statusStyles[status] ?? statusStyles["Σε Επεξεργασία"];
  const shouldPulse = pulse ?? isActiveOrderStatus(status);

  return (
    <span
      className={cn(
        "size-1.5 shrink-0 rounded-full",
        styles.dot,
        shouldPulse && "status-pulse",
        className,
      )}
      aria-hidden
    />
  );
}
