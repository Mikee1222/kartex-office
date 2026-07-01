"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type FieldTooltipProps = {
  content: string;
  className?: string;
};

export function FieldTooltip({ content, className }: FieldTooltipProps) {
  const [open, setOpen] = React.useState(false);
  const id = React.useId();

  return (
    <span className={cn("relative inline-flex", className)}>
      <button
        type="button"
        aria-describedby={open ? id : undefined}
        aria-label="Βοήθεια"
        className="flex size-4 shrink-0 items-center justify-center rounded-full bg-navy-900/10 text-[10px] font-bold text-navy-900 transition-colors hover:bg-navy-900 hover:text-white"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((current) => !current)}
      >
        ?
      </button>
      {open ? (
        <span
          id={id}
          role="tooltip"
          className="absolute bottom-full left-1/2 z-50 mb-2 w-[250px] max-w-[min(250px,calc(100vw-2rem))] -translate-x-1/2 rounded-lg bg-navy-900 px-3 py-2 text-xs leading-relaxed text-white shadow-lg transition-opacity duration-200"
        >
          {content}
          <span
            className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-navy-900"
            aria-hidden
          />
        </span>
      ) : null}
    </span>
  );
}
