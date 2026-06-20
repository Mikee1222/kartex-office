import { cn } from "@/lib/utils";

type KartexLogoProps = {
  /** Show only the K mark (collapsed sidebar). */
  compact?: boolean;
  className?: string;
};

/** Kartex Office wordmark — text only, no dolphin image assets. */
export function KartexLogo({ compact = false, className }: KartexLogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-gold-500/40 bg-gold-500/10 text-lg font-bold text-gold-400 shadow-gold">
        K
      </span>
      {!compact ? (
        <span>
          <span className="block text-sm font-semibold tracking-[0.2em] text-white">
            KARTEX
          </span>
          <span className="mt-0.5 inline-block rounded bg-gold-500/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-gold-400">
            OFFICE
          </span>
        </span>
      ) : null}
    </div>
  );
}
