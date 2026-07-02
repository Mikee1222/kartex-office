"use client";

import { Trash2 } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  buildDeleteTripConfirmMessage,
  deleteTripBlockedReason,
  deleteTripViaApi,
} from "@/lib/trips/delete-trip";
import type { TripStatus } from "@/lib/trips/types";
import { cn } from "@/lib/utils";

type DeleteTripButtonProps = {
  tripId: string;
  tripNumber: number;
  status: TripStatus;
  orderCount: number;
  onDeleted: () => void;
  className?: string;
  disabled?: boolean;
};

export function DeleteTripButton({
  tripId,
  tripNumber,
  status,
  orderCount,
  onDeleted,
  className,
  disabled,
}: DeleteTripButtonProps) {
  const [busy, setBusy] = React.useState(false);
  const blockedReason = deleteTripBlockedReason(status);
  const canDelete = status === "pending" && !disabled;

  async function handleClick(event: React.MouseEvent) {
    event.stopPropagation();
    event.preventDefault();

    if (!canDelete) return;

    const message = buildDeleteTripConfirmMessage({ tripNumber, orderCount });
    if (!window.confirm(message)) return;

    setBusy(true);
    const result = await deleteTripViaApi(tripId);
    setBusy(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    const detached = result.detachedOrderCount;
    if (detached > 0) {
      toast.success(
        `Δρομολόγιο #${tripNumber} διαγράφηκε — ${detached} ${
          detached === 1 ? "παραγγελία αποδεσμεύτηκε" : "παραγγελίες αποδεσμεύτηκαν"
        }.`,
      );
    } else {
      toast.success(`Δρομολόγιο #${tripNumber} διαγράφηκε.`);
    }
    onDeleted();
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={!canDelete || busy}
      title={
        blockedReason ??
        (canDelete ? "Διαγραφή δρομολογίου" : "Διαγραφή δρομολογίου")
      }
      aria-label="Διαγραφή δρομολογίου"
      onClick={(event) => void handleClick(event)}
      className={cn(
        "h-8 w-8 shrink-0 p-0",
        canDelete
          ? "border-red-200 text-destructive hover:bg-red-50 hover:text-destructive"
          : "cursor-not-allowed opacity-40",
        className,
      )}
    >
      <Trash2 className="size-4" aria-hidden />
    </Button>
  );
}
