import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { premiumCard, premiumGoldButton } from "@/lib/ui/premium-styles";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  actionLabel?: string;
  actionHref?: string;
  className?: string;
};

function EmptyIllustration() {
  return (
    <svg
      viewBox="0 0 200 140"
      className="mx-auto h-28 w-44 text-kartex-gold/30"
      aria-hidden
    >
      <rect x="20" y="30" width="160" height="90" rx="12" fill="currentColor" opacity="0.15" />
      <rect x="40" y="50" width="80" height="8" rx="4" fill="#0A1628" opacity="0.2" />
      <rect x="40" y="68" width="120" height="6" rx="3" fill="#0A1628" opacity="0.12" />
      <rect x="40" y="82" width="100" height="6" rx="3" fill="#0A1628" opacity="0.12" />
      <circle cx="150" cy="45" r="18" fill="#D4AF37" opacity="0.35" />
    </svg>
  );
}

export function EmptyState({
  title,
  description,
  icon: Icon,
  actionLabel,
  actionHref = "#",
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("mx-auto max-w-lg text-center", className)}>
      <div className={cn(premiumCard, "px-8 py-12")}>
        <EmptyIllustration />
        <span className="mx-auto mt-4 flex size-12 items-center justify-center rounded-full bg-kartex-gold/15 text-kartex-gold">
          <Icon className="size-6" aria-hidden />
        </span>
        <h2 className="mt-4 text-lg font-bold text-kartex-navy">{title}</h2>
        <p className="mt-2 text-sm text-[#64748B]">{description}</p>
        {actionLabel ? (
          <Button asChild className={cn("mt-6", premiumGoldButton)}>
            <Link href={actionHref}>{actionLabel}</Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
