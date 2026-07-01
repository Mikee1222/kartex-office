"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { UserRowActions } from "@/components/users/user-row-actions";
import { UserRoleBadge } from "@/components/users/user-role-badge";
import { Card, CardContent } from "@/components/ui/card";
import type { ManagedUserRow } from "@/lib/users/load-users";
import { cn } from "@/lib/utils";

type UsersTableProps = {
  initialUsers: ManagedUserRow[];
};

export function UsersTable({ initialUsers }: UsersTableProps) {
  const router = useRouter();
  const [users, setUsers] = React.useState(initialUsers);
  const [fetchKey, setFetchKey] = React.useState(0);

  React.useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers, fetchKey]);

  function handleChanged() {
    setFetchKey((k) => k + 1);
    router.refresh();
  }

  return (
    <Card className="premiumTableWrap">
      <CardContent className="overflow-x-auto p-0">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left">
              <th className="px-4 py-3 font-medium text-muted-foreground sm:px-6">
                Email
              </th>
              <th className="px-4 py-3 font-medium text-muted-foreground">
                Ρόλος
              </th>
              <th className="px-4 py-3 font-medium text-muted-foreground">
                Κατάσταση
              </th>
              <th className="px-4 py-3 font-medium text-muted-foreground">
                Ημ. Δημιουργίας
              </th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground sm:pr-6">
                Ενέργειες
              </th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-12 text-center text-muted-foreground sm:px-6"
                >
                  Δεν υπάρχουν χρήστες.
                </td>
              </tr>
            ) : (
              users.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-border/60 last:border-0 hover:bg-muted/30"
                >
                  <td className="px-4 py-3 font-medium text-kartex-navy sm:px-6">
                    {row.email}
                  </td>
                  <td className="px-4 py-3">
                    <UserRoleBadge role={row.role} />
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                        row.active
                          ? "bg-emerald-50 text-emerald-800"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {row.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {row.createdAt}
                  </td>
                  <td className="px-4 py-3 text-right sm:pr-6">
                    <UserRowActions user={row} onChanged={handleChanged} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
