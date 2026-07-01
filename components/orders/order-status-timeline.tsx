import { Check, X } from "lucide-react";

import {
  getStatusTimestamp,
  getTimelineStepState,
  ORDER_TIMELINE_STEPS,
  type StatusHistoryEntry,
} from "@/lib/orders/status-timeline";
import { type OrderStatus } from "@/components/orders/types";
import { cn } from "@/lib/utils";

type OrderStatusTimelineProps = {
  status: OrderStatus;
  statusHistory: StatusHistoryEntry[];
  className?: string;
};

export function OrderStatusTimeline({
  status,
  statusHistory,
  className,
}: OrderStatusTimelineProps) {
  return (
    <ol className={cn("space-y-0", className)}>
      {ORDER_TIMELINE_STEPS.map((step, index) => {
        const state = getTimelineStepState(status, index);
        const Icon = step.icon;
        const timestamp =
          state === "completed"
            ? getStatusTimestamp(statusHistory, step.status)
            : null;

        return (
          <li key={step.status} className="relative flex gap-4 pb-8 last:pb-0">
            {index < ORDER_TIMELINE_STEPS.length - 1 ? (
              <span
                className={cn(
                  "absolute left-[17px] top-10 h-[calc(100%-1.25rem)] w-0.5",
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
                  "animate-pulse border-kartex-gold bg-white text-kartex-gold ring-2 ring-kartex-gold/30",
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
                  "text-sm font-bold",
                  state === "pending" ? "text-[#94A3B8]" : "text-kartex-navy",
                  state === "cancelled" && "text-red-700",
                )}
              >
                {step.label}
              </p>
              {state === "active" ? (
                <p className="text-xs font-medium text-kartex-gold">Τρέχουσα φάση</p>
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
  );
}
