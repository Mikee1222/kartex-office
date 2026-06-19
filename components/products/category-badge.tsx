import { ProductCategory, type ProductCategory as ProductCategoryType } from "@/components/products/types";
import { cn } from "@/lib/utils";

const categoryStyles: Record<ProductCategoryType, string> = {
  [ProductCategory.Sheets]: "bg-blue-100 text-blue-800",
  [ProductCategory.Towels]: "bg-teal-100 text-teal-800",
  [ProductCategory.Pillowcases]: "bg-indigo-100 text-indigo-800",
  [ProductCategory.DuvetCovers]: "bg-violet-100 text-violet-800",
  [ProductCategory.Bathmats]: "bg-cyan-100 text-cyan-800",
  [ProductCategory.Tablecloths]: "bg-amber-100 text-amber-900",
  [ProductCategory.Fabrics]: "bg-rose-100 text-rose-800",
  [ProductCategory.Other]: "bg-slate-100 text-slate-800",
};

const categoryIconStyles: Record<ProductCategoryType, string> = {
  [ProductCategory.Sheets]: "border-blue-200 bg-blue-50 text-blue-600",
  [ProductCategory.Towels]: "border-teal-200 bg-teal-50 text-teal-600",
  [ProductCategory.Pillowcases]: "border-indigo-200 bg-indigo-50 text-indigo-600",
  [ProductCategory.DuvetCovers]: "border-violet-200 bg-violet-50 text-violet-600",
  [ProductCategory.Bathmats]: "border-cyan-200 bg-cyan-50 text-cyan-600",
  [ProductCategory.Tablecloths]: "border-amber-200 bg-amber-50 text-amber-700",
  [ProductCategory.Fabrics]: "border-rose-200 bg-rose-50 text-rose-600",
  [ProductCategory.Other]: "border-slate-200 bg-slate-50 text-slate-600",
};

const defaultCategoryStyle = "bg-slate-100 text-slate-800";
const defaultCategoryIconStyle = "border-slate-200 bg-slate-50 text-slate-600";

export function getCategoryIconClass(category: string): string {
  return category in categoryIconStyles
    ? categoryIconStyles[category as ProductCategoryType]
    : defaultCategoryIconStyle;
}

type CategoryBadgeProps = {
  category: string;
  className?: string;
};

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  const style =
    category in categoryStyles
      ? categoryStyles[category as ProductCategoryType]
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
