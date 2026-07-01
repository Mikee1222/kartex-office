import Link from "next/link";
import type { ReactNode } from "react";

import { premiumPageSubtitle, premiumPageTitle } from "@/lib/ui/premium-styles";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
};

export function PageHeader({ title, subtitle, action, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div>
        <h1 className={premiumPageTitle}>{title}</h1>
        {subtitle ? <p className={premiumPageSubtitle}>{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

type BackLinkProps = {
  href: string;
  label: string;
};

export function BackLink({ href, label }: BackLinkProps) {
  return (
    <Link
      href={href}
      className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-[#64748B] transition-colors hover:text-kartex-navy"
    >
      ← {label}
    </Link>
  );
}
