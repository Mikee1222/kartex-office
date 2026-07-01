import {
  premiumInputFocus,
  premiumLabel,
  premiumUnderlineInput,
} from "@/lib/ui/premium-styles";
import { cn } from "@/lib/utils";

export { premiumLabel };

export const premiumRequiredMark = "text-gold-500";

export const premiumSelect = cn(
  "flex h-11 w-full rounded-none border-0 border-b border-gray-200 bg-transparent px-0 text-sm shadow-none transition-colors focus-visible:border-gold-500 focus-visible:ring-0",
  premiumInputFocus,
);

export const premiumTextarea = cn(
  "flex min-h-[88px] w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-gray-400",
  premiumInputFocus,
);

export const premiumFormInput = cn(
  "h-11 rounded-none border-0 border-b border-gray-200 bg-transparent px-0 shadow-none",
  premiumUnderlineInput,
);
