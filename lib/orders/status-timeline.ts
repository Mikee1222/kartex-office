import type { LucideIcon } from "lucide-react";
import {
  CheckCheck,
  CheckCircle,
  FileText,
  Package,
  PackageOpen,
  Truck,
} from "lucide-react";

import { OrderStatus, type OrderStatus as OrderStatusType } from "@/components/orders/types";
import { APP_TIMEZONE } from "@/types/database";

export type StatusHistoryEntry = {
  status: string;
  changed_at: string;
  changed_by: string;
};

export type TimelineStepDefinition = {
  status: OrderStatusType;
  label: string;
  icon: LucideIcon;
};

/** Linear progression including branch statuses (reserved, partial, pending payment). */
export const ORDER_TIMELINE_STEPS: TimelineStepDefinition[] = [
  { status: OrderStatus.Processing, label: "Δημιουργία", icon: FileText },
  { status: OrderStatus.Scheduled, label: "Προγραμματισμένη", icon: Package },
  { status: OrderStatus.Confirmed, label: "Επιβεβαίωση", icon: CheckCircle },
  { status: OrderStatus.Reserved, label: "Δεσμευμένη", icon: Package },
  { status: OrderStatus.ReadyForShipment, label: "Έτοιμο", icon: Package },
  { status: OrderStatus.Shipped, label: "Αποστολή", icon: Truck },
  { status: OrderStatus.PartialShipment, label: "Μερική Αποστολή", icon: PackageOpen },
  { status: OrderStatus.Completed, label: "Παραδόθηκε", icon: CheckCheck },
  { status: OrderStatus.PendingPayment, label: "Αναμονή πληρωμής", icon: CheckCircle },
];

export const ALL_ORDER_STATUSES: OrderStatusType[] = Object.values(OrderStatus);

export function parseStatusHistory(raw: unknown): StatusHistoryEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (entry): entry is StatusHistoryEntry =>
        typeof entry === "object" &&
        entry !== null &&
        typeof (entry as StatusHistoryEntry).status === "string" &&
        typeof (entry as StatusHistoryEntry).changed_at === "string",
    )
    .map((entry) => ({
      status: entry.status,
      changed_at: entry.changed_at,
      changed_by:
        typeof entry.changed_by === "string" ? entry.changed_by : "—",
    }));
}

export function getCurrentTimelineIndex(status: OrderStatusType): number {
  const index = ORDER_TIMELINE_STEPS.findIndex((step) => step.status === status);
  if (index >= 0) return index;
  return 0;
}

export type TimelineStepState = "completed" | "active" | "pending" | "cancelled";

export function getTimelineStepState(
  orderStatus: OrderStatusType,
  stepIndex: number,
): TimelineStepState {
  if (orderStatus === OrderStatus.Cancelled) {
    return "cancelled";
  }
  const currentIndex = getCurrentTimelineIndex(orderStatus);
  if (stepIndex < currentIndex) return "completed";
  if (stepIndex === currentIndex) return "active";
  return "pending";
}

export function getStatusTimestamp(
  history: StatusHistoryEntry[],
  stepStatus: OrderStatusType,
): string | null {
  const matches = history.filter((entry) => entry.status === stepStatus);
  if (matches.length === 0) return null;
  const latest = matches[matches.length - 1];
  return formatDateTimeEl(latest.changed_at);
}

export function formatDateTimeEl(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("el-GR", {
    timeZone: APP_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function appendStatusHistory(
  existing: StatusHistoryEntry[],
  status: OrderStatusType,
  changedBy: string,
): StatusHistoryEntry[] {
  return [
    ...existing,
    {
      status,
      changed_at: new Date().toISOString(),
      changed_by: changedBy || "—",
    },
  ];
}
