import type { TripStatus } from "@/lib/trips/types";
import { cn } from "@/lib/utils";

const LABELS: Record<TripStatus, string> = {
  pending: "Αναμονή",
  in_progress: "Σε εξέλιξη",
  completed: "Ολοκληρώθηκε",
};

const STYLES: Record<TripStatus, string> = {
  pending: "bg-slate-100 text-slate-700",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-emerald-100 text-emerald-800",
};

export function TripStatusBadge({ status }: { status: TripStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
        STYLES[status],
      )}
    >
      {LABELS[status]}
    </span>
  );
}
