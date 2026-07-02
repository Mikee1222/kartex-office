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
  /** Branch step — hidden unless the order actually used it. */
  optional?: boolean;
};

/**
 * Fulfillment-only progression. Payment is shown in the dedicated Payment card,
 * not duplicated on this timeline.
 */
export const FULFILLMENT_TIMELINE_STEPS: TimelineStepDefinition[] = [
  { status: OrderStatus.Processing, label: "Δημιουργία", icon: FileText },
  { status: OrderStatus.Scheduled, label: "Προγραμματισμένη", icon: Package, optional: true },
  { status: OrderStatus.Confirmed, label: "Επιβεβαίωση", icon: CheckCircle },
  { status: OrderStatus.Reserved, label: "Δεσμευμένη", icon: Package, optional: true },
  { status: OrderStatus.ReadyForShipment, label: "Έτοιμο", icon: Package },
  { status: OrderStatus.Shipped, label: "Αποστολή", icon: Truck },
  { status: OrderStatus.PartialShipment, label: "Μερική Αποστολή", icon: PackageOpen, optional: true },
  { status: OrderStatus.Completed, label: "Ολοκληρώθηκε", icon: CheckCheck },
];

/** @deprecated Use FULFILLMENT_TIMELINE_STEPS — payment is no longer on this track. */
export const ORDER_TIMELINE_STEPS = FULFILLMENT_TIMELINE_STEPS;

export const ALL_ORDER_STATUSES: OrderStatusType[] = Object.values(OrderStatus);

export type TimelineContext = {
  orderStatus: OrderStatusType;
  statusHistory: StatusHistoryEntry[];
  hasPartialDelivery?: boolean;
  wasReserved?: boolean;
  wasScheduled?: boolean;
};

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

function statusAppearsInHistory(
  history: StatusHistoryEntry[],
  status: OrderStatusType,
): boolean {
  return history.some((entry) => entry.status === status);
}

function optionalStepIsRelevant(
  step: TimelineStepDefinition,
  ctx: TimelineContext,
): boolean {
  if (!step.optional) return true;

  if (step.status === OrderStatus.Scheduled) {
    return (
      Boolean(ctx.wasScheduled) ||
      statusAppearsInHistory(ctx.statusHistory, OrderStatus.Scheduled) ||
      ctx.orderStatus === OrderStatus.Scheduled
    );
  }

  if (step.status === OrderStatus.Reserved) {
    return (
      Boolean(ctx.wasReserved) ||
      statusAppearsInHistory(ctx.statusHistory, OrderStatus.Reserved) ||
      ctx.orderStatus === OrderStatus.Reserved
    );
  }

  if (step.status === OrderStatus.PartialShipment) {
    return (
      Boolean(ctx.hasPartialDelivery) ||
      statusAppearsInHistory(ctx.statusHistory, OrderStatus.PartialShipment) ||
      ctx.orderStatus === OrderStatus.PartialShipment
    );
  }

  return true;
}

export function getVisibleTimelineSteps(ctx: TimelineContext): TimelineStepDefinition[] {
  return FULFILLMENT_TIMELINE_STEPS.filter((step) =>
    optionalStepIsRelevant(step, ctx),
  );
}

function resolveActiveStepIndex(
  steps: TimelineStepDefinition[],
  orderStatus: OrderStatusType,
): number {
  if (orderStatus === OrderStatus.Cancelled) {
    return -1;
  }

  if (orderStatus === OrderStatus.PendingPayment) {
    const confirmIndex = steps.findIndex(
      (step) => step.status === OrderStatus.Confirmed,
    );
    return confirmIndex >= 0 ? confirmIndex : 0;
  }

  const directIndex = steps.findIndex((step) => step.status === orderStatus);
  if (directIndex >= 0) return directIndex;

  const statusRank = FULFILLMENT_TIMELINE_STEPS.findIndex(
    (step) => step.status === orderStatus,
  );
  if (statusRank < 0) return 0;

  let best = 0;
  for (let index = 0; index < steps.length; index += 1) {
    const rank = FULFILLMENT_TIMELINE_STEPS.findIndex(
      (step) => step.status === steps[index].status,
    );
    if (rank >= 0 && rank <= statusRank) {
      best = index;
    }
  }
  return best;
}

export function getCurrentTimelineIndex(status: OrderStatusType): number {
  const index = FULFILLMENT_TIMELINE_STEPS.findIndex((step) => step.status === status);
  if (index >= 0) return index;
  return 0;
}

export type TimelineStepState = "completed" | "active" | "pending" | "cancelled";

export function getTimelineStepState(
  ctx: TimelineContext,
  stepIndex: number,
  visibleSteps: TimelineStepDefinition[] = getVisibleTimelineSteps(ctx),
): TimelineStepState {
  if (ctx.orderStatus === OrderStatus.Cancelled) {
    return "cancelled";
  }

  const activeIndex = resolveActiveStepIndex(visibleSteps, ctx.orderStatus);
  const isTerminal = ctx.orderStatus === OrderStatus.Completed;

  if (isTerminal) {
    return stepIndex <= activeIndex ? "completed" : "pending";
  }

  if (stepIndex < activeIndex) return "completed";
  if (stepIndex === activeIndex) return "active";
  return "pending";
}

/** @deprecated Pass TimelineContext instead. */
export function getTimelineStepStateLegacy(
  orderStatus: OrderStatusType,
  stepIndex: number,
): TimelineStepState {
  return getTimelineStepState({ orderStatus, statusHistory: [] }, stepIndex);
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
