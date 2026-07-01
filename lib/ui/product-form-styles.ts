import { premiumInputFocus } from "@/lib/ui/premium-styles";
import { cn } from "@/lib/utils";

/** Layout + field styles scoped to the product create/edit form. */
export const productFormShell = "mx-auto w-full max-w-6xl space-y-8";

export const productFormLayout = "grid gap-8 lg:grid-cols-[1fr_320px]";

export const productFormSection =
  "space-y-6 rounded-2xl border border-gray-200/80 bg-white p-8 shadow-card";

export const productFormSectionTitle = "text-lg font-semibold text-navy-900";

export const productFormGrid = "grid gap-6 sm:grid-cols-2";

export const productFormField = "space-y-3";

export const productFormLabel =
  "text-xs font-semibold uppercase tracking-wide text-gray-500";

export const productFormInput = cn(
  "h-11 rounded-lg border border-gray-200 bg-white px-4 text-base shadow-sm",
  premiumInputFocus,
);

export const productFormSelect = cn(
  "flex h-11 w-full rounded-lg border border-gray-200 bg-white px-4 text-base shadow-sm transition-shadow focus-visible:border-kartex-gold/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kartex-gold/30 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50",
);

export const productFormTextarea = cn(
  "flex min-h-[120px] w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-base shadow-sm placeholder:text-gray-400",
  premiumInputFocus,
);
