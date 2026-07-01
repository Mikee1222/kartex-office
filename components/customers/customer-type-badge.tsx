import { type CustomerType } from "@/components/customers/types";
import { cn } from "@/lib/utils";

const typeStyles: Record<CustomerType, string> = {
  Νοσοκομεία: "bg-blue-100 text-blue-800",
  Ξενοδοχεία: "bg-purple-100 text-purple-800",
  "Walk-in": "bg-slate-100 text-slate-800",
};

type CustomerTypeBadgeProps = {
  type: CustomerType;
  className?: string;
};

export function CustomerTypeBadge({ type, className }: CustomerTypeBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
        typeStyles[type],
        className,
      )}
    >
      {type}
    </span>
  );
}
