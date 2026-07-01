"use client";

import { Check, ChevronDown } from "lucide-react";
import * as React from "react";

import {
  OrderStatusBadge,
  StatusDot,
} from "@/components/orders/order-status-badge";
import { OrderStatus, type OrderStatus as OrderStatusType } from "@/components/orders/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ALL_ORDER_STATUSES,
  appendStatusHistory,
  type StatusHistoryEntry,
} from "@/lib/orders/status-timeline";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type OrderStatusDropdownProps = {
  orderId: string;
  status: OrderStatusType;
  statusHistory: StatusHistoryEntry[];
  assignedDriverName: string | null;
  onStatusChanged: () => void;
  className?: string;
};

export function OrderStatusDropdown({
  orderId,
  status,
  statusHistory,
  assignedDriverName,
  onStatusChanged,
  className,
}: OrderStatusDropdownProps) {
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function changeStatus(newStatus: OrderStatusType) {
    if (newStatus === status || pending) return;

    if (newStatus === OrderStatus.Cancelled) {
      const ok = window.confirm(
        "Είστε σίγουροι ότι θέλετε να ακυρώσετε την παραγγελία;",
      );
      if (!ok) return;
    }

    if (newStatus === OrderStatus.Shipped && !assignedDriverName?.trim()) {
      const ok = window.confirm(
        "Δεν έχει ανατεθεί οδηγός. Συνέχεια;",
      );
      if (!ok) return;
    }

    setError(null);
    setPending(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const nextHistory = appendStatusHistory(
      statusHistory,
      newStatus,
      user?.email ?? "—",
    );

    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: newStatus,
        status_history: nextHistory,
      })
      .eq("id", orderId);

    setPending(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    onStatusChanged();
  }

  return (
    <div className={cn("space-y-1", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={pending}>
          <Button
            type="button"
            variant="ghost"
            className="h-auto gap-1 rounded-full p-0 hover:bg-transparent focus-visible:ring-2 focus-visible:ring-kartex-gold/40"
            aria-label="Αλλαγή κατάστασης παραγγελίας"
          >
            <OrderStatusBadge status={status} className="text-sm" />
            <ChevronDown
              className={cn(
                "size-4 text-kartex-muted transition-transform",
                pending && "opacity-50",
              )}
              aria-hidden
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="max-h-[min(24rem,70vh)] w-64 overflow-y-auto">
          {ALL_ORDER_STATUSES.map((option) => (
            <DropdownMenuItem
              key={option}
              disabled={pending}
              onClick={() => void changeStatus(option)}
              className="flex cursor-pointer items-center gap-2"
            >
              <StatusDot status={option} className="size-2" />
              <span className="flex-1">{option}</span>
              {option === status ? (
                <Check className="size-4 shrink-0 text-kartex-gold" aria-hidden />
              ) : null}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
