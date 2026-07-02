import { Check, X } from "lucide-react";

import {
  getStatusTimestamp,
  getTimelineStepState,
  getVisibleTimelineSteps,
  type StatusHistoryEntry,
  type TimelineContext,
} from "@/lib/orders/status-timeline";
import { type OrderStatus } from "@/components/orders/types";
import { cn } from "@/lib/utils";

type OrderStatusTimelineProps = {
  status: OrderStatus;
  statusHistory: StatusHistoryEntry[];
  hasPartialDelivery?: boolean;
  wasReserved?: boolean;
  wasScheduled?: boolean;
  className?: string;
};

export function OrderStatusTimeline({
  status,
  statusHistory,
  hasPartialDelivery = false,
  wasReserved = false,
  wasScheduled = false,
  className,
}: OrderStatusTimelineProps) {
  const ctx: TimelineContext = {
    orderStatus: status,
    statusHistory,
    hasPartialDelivery,
    wasReserved,
    wasScheduled,
  };
  const visibleSteps = getVisibleTimelineSteps(ctx);

  return (
    <div className={cn("overflow-hidden rounded-xl", className)}>
      <div className="border-b border-white/10 bg-kartex-navy px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-kartex-gold/80">
          Εκτέλεση
        </p>
        <p className="mt-0.5 text-sm font-semibold text-white">
          Χρονοδιάγραμμα παράδοσης
        </p>
      </div>
      <ol className="space-y-0 bg-gradient-to-b from-[#F8FAFC] to-white px-4 py-4">
        {visibleSteps.map((step, index) => {
          const state = getTimelineStepState(ctx, index, visibleSteps);
          const Icon = step.icon;
          const timestamp =
            state === "completed"
              ? getStatusTimestamp(statusHistory, step.status)
              : null;

          return (
            <li key={step.status} className="relative flex gap-4 pb-7 last:pb-0">
              {index < visibleSteps.length - 1 ? (
                <span
                  className={cn(
                    "absolute left-[17px] top-10 h-[calc(100%-1rem)] w-0.5",
                    state === "completed"
                      ? "bg-kartex-gold"
                      : state === "cancelled"
                        ? "bg-red-200"
                        : "bg-[#E2E8F0]",
                  )}
                  aria-hidden
                />
              ) : null}
              <span
                className={cn(
                  "relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                  state === "completed" &&
                    "border-kartex-gold bg-kartex-gold text-kartex-navy shadow-sm",
                  state === "active" &&
                    "border-kartex-gold bg-white text-kartex-gold ring-2 ring-kartex-gold/30",
                  state === "pending" &&
                    "border-[#E2E8F0] bg-white text-[#94A3B8]",
                  state === "cancelled" &&
                    "border-red-400 bg-red-50 text-red-600",
                )}
              >
                {state === "completed" ? (
                  <Check className="size-4" strokeWidth={3} aria-hidden />
                ) : state === "cancelled" ? (
                  <X className="size-4" strokeWidth={2.5} aria-hidden />
                ) : (
                  <Icon className="size-4" aria-hidden />
                )}
              </span>
              <div className="min-w-0 pt-1">
                <p
                  className={cn(
                    "text-sm font-bold tracking-tight",
                    state === "pending" ? "text-[#94A3B8]" : "text-kartex-navy",
                    state === "cancelled" && "text-red-700",
                  )}
                >
                  {step.label}
                </p>
                {state === "active" ? (
                  <p className="text-xs font-semibold text-kartex-gold">
                    Τρέχουσα φάση
                  </p>
                ) : state === "completed" && timestamp ? (
                  <p className="text-xs text-[#64748B]">{timestamp}</p>
                ) : state === "completed" ? (
                  <p className="text-xs text-[#64748B]">Ολοκληρώθηκε</p>
                ) : state === "cancelled" ? (
                  <p className="text-xs text-red-600">Ακυρώθηκε</p>
                ) : (
                  <p className="text-xs text-[#94A3B8]">Εκκρεμεί</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
