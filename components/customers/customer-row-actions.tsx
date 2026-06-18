"use client";

import { Eye, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { type Customer } from "@/components/customers/types";
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

type CustomerRowActionsProps = {
  customer: Customer;
  onDeleted?: () => void;
};

export function CustomerRowActions({ customer, onDeleted }: CustomerRowActionsProps) {
  const router = useRouter();
  const [deleting, setDeleting] = React.useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      `Διαγραφή πελάτη «${customer.company}»;\n\nΗ ενέργεια δεν αναιρείται.`,
    );
    if (!confirmed) return;

    setDeleting(true);
    const supabase = createClient();
    const { error } = await supabase.from("customers").delete().eq("id", customer.id);

    if (error) {
      const message =
        error.code === "23503" || error.message.includes("foreign key")
          ? "Δεν μπορείτε να διαγράψετε πελάτη με υπάρχουσες παραγγελίες."
          : error.message;
      toast.error(`Σφάλμα: ${message}`);
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
          aria-label="Ενέργειες πελάτη"
          disabled={deleting}
        >
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="z-50 min-w-[11rem]">
        <DropdownMenuItem onClick={() => router.push(`/customers/${customer.id}`)}>
          <Eye className="size-4" />
          Προβολή
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => router.push(`/customers/${customer.id}/edit`)}
        >
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
