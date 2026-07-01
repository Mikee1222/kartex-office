"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TablePaginationProps = {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  className?: string;
};

export function TablePagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  className,
}: TablePaginationProps) {
  const pageStart = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const pageEnd = Math.min(page * pageSize, totalItems);

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-between gap-3 border-t border-kartex-border px-4 py-4 sm:flex-row sm:px-6",
        className,
      )}
    >
      <p className="text-sm text-kartex-muted">
        {totalItems === 0
          ? "0 αποτελέσματα"
          : `Εμφάνιση ${pageStart}–${pageEnd} από ${totalItems}`}
      </p>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
          aria-label="Προηγούμενη σελίδα"
          className="border-kartex-border"
        >
          <ChevronLeft className="size-4" />
          Προηγ.
        </Button>
        {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNum) => (
          <Button
            key={pageNum}
            type="button"
            variant={pageNum === page ? "default" : "outline"}
            size="sm"
            className={cn(
              "min-w-9 tabular-nums",
              pageNum === page
                ? "bg-kartex-navy text-white hover:bg-kartex-navy/90"
                : "border-kartex-border",
            )}
            onClick={() => onPageChange(pageNum)}
            aria-label={`Σελίδα ${pageNum}`}
            aria-current={pageNum === page ? "page" : undefined}
          >
            {pageNum}
          </Button>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          aria-label="Επόμενη σελίδα"
          className="border-kartex-border"
        >
          Επόμ.
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
