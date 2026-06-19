import {
  QUOTE_STATUS_LABELS,
  type QuoteRequestStatus,
} from "@/components/quotes/types";
import { cn } from "@/lib/utils";

const statusStyles: Record<QuoteRequestStatus, string> = {
  pending: "bg-yellow-50 text-yellow-800",
  reviewing: "bg-blue-50 text-blue-800",
  quoted: "bg-purple-50 text-purple-800",
  accepted: "bg-emerald-50 text-emerald-800",
  rejected: "bg-red-50 text-red-700",
  cancelled: "bg-slate-100 text-slate-600",
};

const dotStyles: Record<QuoteRequestStatus, string> = {
  pending: "bg-yellow-500",
  reviewing: "bg-blue-500",
  quoted: "bg-purple-500",
  accepted: "bg-emerald-500",
  rejected: "bg-red-500",
  cancelled: "bg-slate-400",
};

type QuoteStatusBadgeProps = {
  status: QuoteRequestStatus;
  className?: string;
};

export function QuoteStatusBadge({ status, className }: QuoteStatusBadgeProps) {
  const label = QUOTE_STATUS_LABELS[status] ?? status;
  const pill = statusStyles[status] ?? statusStyles.pending;
  const dot = dotStyles[status] ?? dotStyles.pending;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        pill,
        className,
      )}
    >
      <span className={cn("size-1.5 shrink-0 rounded-full", dot)} aria-hidden />
      {label}
    </span>
  );
}
