import { type ProductCategory } from "@/components/products/types";
import { cn } from "@/lib/utils";

const categoryStyles: Record<ProductCategory, string> = {
  Σεντόνια: "bg-blue-100 text-blue-800",
  Πετσέτες: "bg-teal-100 text-teal-800",
  Στολές: "bg-purple-100 text-purple-800",
  Άλλο: "bg-slate-100 text-slate-800",
};

const categoryIconStyles: Record<ProductCategory, string> = {
  Σεντόνια: "border-blue-200 bg-blue-50 text-blue-600",
  Πετσέτες: "border-teal-200 bg-teal-50 text-teal-600",
  Στολές: "border-purple-200 bg-purple-50 text-purple-600",
  Άλλο: "border-slate-200 bg-slate-50 text-slate-600",
};

const defaultCategoryStyle = "bg-slate-100 text-slate-800";
const defaultCategoryIconStyle = "border-slate-200 bg-slate-50 text-slate-600";

export function getCategoryIconClass(category: string): string {
  return category in categoryIconStyles
    ? categoryIconStyles[category as ProductCategory]
    : defaultCategoryIconStyle;
}

type CategoryBadgeProps = {
  category: ProductCategory | string;
  className?: string;
};

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  const style =
    category in categoryStyles
      ? categoryStyles[category as ProductCategory]
      : defaultCategoryStyle;

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
        style,
        className,
      )}
    >
      {category}
    </span>
  );
}
