"use client";

import { Eye, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { type Order } from "@/components/orders/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type OrderRowActionsProps = {
  order: Order;
  onDeleted?: () => void;
};

export function OrderRowActions({ order, onDeleted }: OrderRowActionsProps) {
  const router = useRouter();
  const [deleting, setDeleting] = React.useState(false);

  const orderLabel = order.orderNumber || order.id.slice(0, 8);

  async function handleDelete() {
    const confirmed = window.confirm(
      `Διαγραφή παραγγελίας ${orderLabel};\n\nΘα διαγραφούν και οι γραμμές της. Η ενέργεια δεν αναιρείται.`,
    );
    if (!confirmed) return;

    setDeleting(true);
    const supabase = createClient();
    const { error } = await supabase.from("orders").delete().eq("id", order.id);

    if (error) {
      toast.error(`Σφάλμα: ${error.message}`);
      setDeleting(false);
      return;
    }

    onDeleted?.();
    router.refresh();
    setDeleting(false);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-kartex-navy"
          aria-label="Ενέργειες παραγγελίας"
          disabled={deleting}
        >
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="z-50 min-w-[11rem]">
        <DropdownMenuItem onClick={() => router.push(`/orders/${order.id}`)}>
          <Eye className="size-4" />
          Προβολή
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push(`/orders/${order.id}/edit`)}>
          <Pencil className="size-4" />
          Επεξεργασία
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={deleting}
          className={cn(
            "text-destructive focus:bg-destructive/10 focus:text-destructive",
          )}
          onClick={() => void handleDelete()}
        >
          <Trash2 className="size-4" />
          {deleting ? "Διαγραφή…" : "Διαγραφή"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
