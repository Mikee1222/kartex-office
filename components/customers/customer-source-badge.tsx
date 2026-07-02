import { type CustomerSource } from "@/components/customers/types";
import { cn } from "@/lib/utils";

const sourceStyles: Record<CustomerSource, string> = {
  Χειροκίνητα: "bg-slate-100 text-slate-700",
  Τηλέφωνο: "bg-amber-100 text-amber-800",
  Κατάστημα: "bg-emerald-100 text-emerald-800",
  Website: "bg-sky-100 text-sky-800",
};

type CustomerSourceBadgeProps = {
  source: CustomerSource;
  className?: string;
};

export function CustomerSourceBadge({ source, className }: CustomerSourceBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
        sourceStyles[source],
        className,
      )}
    >
      {source}
    </span>
  );
}
