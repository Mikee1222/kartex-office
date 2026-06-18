"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
  className?: string;
}

function getVisiblePageNumbers(
  currentPage: number,
  totalPages: number,
  maxVisible = 5,
): number[] {
  if (totalPages <= 0) return [];
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const half = Math.floor(maxVisible / 2);
  let start = Math.max(1, currentPage - half);
  let end = Math.min(totalPages, start + maxVisible - 1);
  start = Math.max(1, end - maxVisible + 1);

  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

export function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  itemLabel = "αποτελέσματα",
  className,
}: PaginationControlsProps) {
  const safeTotalPages = Math.max(totalPages, 1);
  const pageStart =
    totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const pageEnd = Math.min(currentPage * itemsPerPage, totalItems);
  const visiblePages = getVisiblePageNumbers(currentPage, safeTotalPages);

  const countLabel =
    totalItems === 0
      ? `Εμφάνιση 0 από 0 ${itemLabel}`
      : `Εμφάνιση ${pageStart}-${pageEnd} από ${totalItems} ${itemLabel}`;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-between gap-4 border-t border-gray-100 px-4 py-4 sm:flex-row sm:px-6",
        className,
      )}
    >
      <p className="text-sm text-muted-foreground">{countLabel}</p>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={currentPage <= 1 || totalPages <= 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          className="border-gray-200 text-kartex-navy hover:bg-gray-50"
        >
          <ChevronLeft className="size-4" />
          Προηγούμενο
        </Button>

        {visiblePages.length > 1 ? (
          <div className="flex items-center gap-1">
            {visiblePages.map((pageNum) => (
              <Button
                key={pageNum}
                type="button"
                variant={pageNum === currentPage ? "default" : "outline"}
                size="sm"
                className={cn(
                  "min-w-9 tabular-nums",
                  pageNum === currentPage
                    ? "bg-kartex-navy text-white hover:bg-kartex-navy/90"
                    : "border-gray-200 text-kartex-navy hover:bg-gray-50",
                )}
                onClick={() => onPageChange(pageNum)}
                aria-label={`Σελίδα ${pageNum}`}
                aria-current={pageNum === currentPage ? "page" : undefined}
              >
                {pageNum}
              </Button>
            ))}
          </div>
        ) : (
          <span className="px-2 text-sm font-medium tabular-nums text-kartex-navy">
            Σελίδα {currentPage} από {safeTotalPages}
          </span>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages || totalPages <= 1}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          className="border-gray-200 text-kartex-navy hover:bg-gray-50"
        >
          Επόμενο
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
