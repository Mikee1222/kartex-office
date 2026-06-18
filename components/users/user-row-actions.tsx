"use client";

import { MoreVertical, Pencil, Trash2, UserX } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import {
  EditUserModal,
  type EditUserTarget,
} from "@/components/users/edit-user-modal";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePermissions } from "@/lib/auth/permissions-context";
import { cn } from "@/lib/utils";
import type { ManagedUserRow } from "@/lib/users/load-users";

type UserRowActionsProps = {
  user: ManagedUserRow;
  onChanged: () => void;
};

export function UserRowActions({ user, onChanged }: UserRowActionsProps) {
  const router = useRouter();
  const { userId: currentUserId, can } = usePermissions();
  const [editOpen, setEditOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  const editTarget: EditUserTarget = {
    id: user.id,
    email: user.email,
    role: user.role,
    active: user.active,
    customPermissions: user.customPermissions,
  };

  async function patchUser(body: Record<string, unknown>) {
    setBusy(true);
    const res = await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    setBusy(false);

    if (!res.ok) {
      toast.error(data.error || "Η ενέργεια αποτυχία.");
      return false;
    }

    onChanged();
    router.refresh();
    return true;
  }

  async function handleDeactivate() {
    const confirmed = window.confirm(
      `Απενεργοποίηση χρήστη «${user.email}»;`,
    );
    if (!confirmed) return;
    await patchUser({ active: false });
  }

  async function handleDelete() {
    if (user.id === currentUserId) {
      toast.error("Δεν μπορείτε να διαγράψετε τον δικό σας λογαριασμό.");
      return;
    }

    const confirmed = window.confirm(
      `Διαγραφή χρήστη «${user.email}»; Η ενέργεια δεν αναιρείται.`,
    );
    if (!confirmed) return;

    setBusy(true);
    const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    setBusy(false);

    if (!res.ok) {
      toast.error(data.error || "Αποτυχία διαγραφής.");
      return;
    }

    onChanged();
    router.refresh();
  }

  if (!can("canManageUsers")) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={busy}
            aria-label="Ενέργειες χρήστη"
          >
            <MoreVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="z-50 min-w-[12rem]">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" />
            Επεξεργασία Ρόλου
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!user.active || user.id === currentUserId}
            onClick={() => void handleDeactivate()}
          >
            <UserX className="size-4" />
            Απενεργοποίηση
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={user.id === currentUserId}
            className={cn(
              "text-destructive focus:bg-destructive/10 focus:text-destructive",
            )}
            onClick={() => void handleDelete()}
          >
            <Trash2 className="size-4" />
            Διαγραφή
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditUserModal
        user={editTarget}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={onChanged}
      />
    </>
  );
}
