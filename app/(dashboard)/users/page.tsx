import Link from "next/link";
import { Plus } from "lucide-react";
import { redirect } from "next/navigation";

import { UsersTable } from "@/components/users/users-table";
import { Button } from "@/components/ui/button";
import { getSessionAccess } from "@/lib/auth/get-session-access";
import { hasPermission } from "@/lib/permissions";
import { loadManagedUsers } from "@/lib/users/load-users";
import { USER_ROLE_LABELS } from "@/lib/users/roles";
import { PageHeader } from "@/components/ui/page-header";
import { premiumGoldButton } from "@/lib/ui/premium-styles";
import { cn } from "@/lib/utils";

export default async function UsersPage() {
  const access = await getSessionAccess();
  if (!access) {
    redirect("/login");
  }

  const canManage = hasPermission(
    access.role,
    "canManageUsers",
    access.customPermissions,
  );

  const { users, error: loadError } = await loadManagedUsers();

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Διαχείριση Χρηστών"
        subtitle="Ρόλοι και πρόσβαση στο Kartex Office."
        action={
          canManage ? (
            <Button asChild className={cn(premiumGoldButton, "shrink-0")}>
              <Link href="/users/new">
                <Plus className="size-4" />
                Νέος Χρήστης
              </Link>
            </Button>
          ) : undefined
        }
      />

      {loadError ? (
        <p
          className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {loadError}
        </p>
      ) : null}

      <UsersTable initialUsers={users} />

      <p className="text-xs text-muted-foreground">
        Διαθέσιμοι ρόλοι: {Object.values(USER_ROLE_LABELS).join(", ")}.
      </p>
    </div>
  );
}
