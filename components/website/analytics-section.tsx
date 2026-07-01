import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Section header with one-line Greek explanation. */
export function AnalyticsSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-4", className)}>
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-navy-900">{title}</h2>
        <p className="mt-0.5 text-sm text-gray-400">{description}</p>
      </div>
      {children}
    </section>
  );
}

/** Empty state matching Live Οδηγοί sidebar pattern. */
export function AnalyticsEmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-12 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-gold-500/10 text-gold-500">
        <Icon className="size-7" aria-hidden />
      </span>
      <div>
        <p className="text-sm font-semibold text-navy-900">{title}</p>
        <p className="mt-1 text-xs text-gray-400">{description}</p>
      </div>
    </div>
  );
}
