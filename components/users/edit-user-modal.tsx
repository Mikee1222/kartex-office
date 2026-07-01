"use client";

import * as React from "react";

import {
  ALL_PERMISSION_KEYS,
  getRolePermissions,
  PERMISSION_LABELS,
  type PermissionKey,
} from "@/lib/permissions";
import {
  USER_ROLE_KEYS,
  USER_ROLE_LABELS,
  type CustomPermissionsMap,
  type UserRoleKey,
} from "@/lib/users/roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  premiumFormCard,
  premiumFormGrid,
  premiumFormShell,
  premiumGoldButton,
  premiumInputFocus,
  premiumLabel,
} from "@/lib/ui/premium-styles";
import { premiumSelect, premiumTextarea } from "@/lib/ui/form-styles";

export type EditUserTarget = {
  id: string;
  email: string;
  role: UserRoleKey;
  active: boolean;
  customPermissions?: CustomPermissionsMap;
};

type EditUserModalProps = {
  user: EditUserTarget | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
};

export function EditUserModal({
  user,
  open,
  onOpenChange,
  onSaved,
}: EditUserModalProps) {
  const [role, setRole] = React.useState<UserRoleKey>("salesperson");
  const [permissions, setPermissions] = React.useState<
    Record<PermissionKey, boolean>
  >(getRolePermissions("salesperson"));
  const [customizePermissions, setCustomizePermissions] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  React.useEffect(() => {
    if (!user || !open) return;

    setRole(user.role);
    const merged: Record<PermissionKey, boolean> = {
      ...getRolePermissions(user.role),
    };
    if (user.customPermissions) {
      for (const key of ALL_PERMISSION_KEYS) {
        const value = user.customPermissions[key];
        if (typeof value === "boolean") {
          merged[key] = value;
        }
      }
      setCustomizePermissions(true);
    } else {
      setCustomizePermissions(false);
    }
    setPermissions(merged);
    setError(null);
  }, [user, open]);

  function handleRoleChange(nextRole: UserRoleKey) {
    setRole(nextRole);
    if (!customizePermissions) {
      setPermissions(getRolePermissions(nextRole));
    }
  }

  function togglePermission(key: PermissionKey) {
    setCustomizePermissions(true);
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!user) return;

    setError(null);
    setPending(true);

    const payload = {
      role,
      active: user.active,
      custom_permissions: customizePermissions ? permissions : {},
    };

    const res = await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const body = (await res.json().catch(() => ({}))) as { error?: string };

    if (!res.ok) {
      setError(body.error || "Αποτυχία αποθήκευσης.");
      setPending(false);
      return;
    }

    setPending(false);
    onOpenChange(false);
    onSaved();
  }

  if (!open || !user) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-user-title"
    >
      <button
        type="button"
        className="absolute inset-0"
        aria-label="Κλείσιμο"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border bg-card shadow-2xl">
        <form onSubmit={(e) => void handleSave(e)} className="space-y-5 p-6">
          <div>
            <h2
              id="edit-user-title"
              className="text-lg font-semibold text-kartex-navy"
            >
              Επεξεργασία Ρόλου
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
          </div>

          {error ? (
            <p
              className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <div className="space-y-2">
            <Label className={premiumLabel} htmlFor="edit-user-email">Email</Label>
            <Input id="edit-user-email" value={user.email} readOnly disabled />
          </div>

          <div className="space-y-2">
            <Label className={premiumLabel} htmlFor="edit-user-role">Ρόλος</Label>
            <select
              id="edit-user-role"
              value={role}
              onChange={(e) => handleRoleChange(e.target.value as UserRoleKey)}
              className={premiumSelect}
              disabled={pending}
            >
              {USER_ROLE_KEYS.map((key) => (
                <option key={key} value={key}>
                  {USER_ROLE_LABELS[key]}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <Label>Δικαιώματα</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pending}
                onClick={() => {
                  setCustomizePermissions(false);
                  setPermissions(getRolePermissions(role));
                }}
              >
                Επαναφορά ρόλου
              </Button>
            </div>
            <div className="max-h-56 overflow-y-auto rounded-md border border-border">
              <table className="w-full text-sm">
                <tbody>
                  {ALL_PERMISSION_KEYS.map((key) => (
                    <tr key={key} className="border-b border-border/60 last:border-0">
                      <td className="px-3 py-2 text-foreground">
                        {PERMISSION_LABELS[key]}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="checkbox"
                          checked={permissions[key]}
                          onChange={() => togglePermission(key)}
                          disabled={pending}
                          className="size-4 accent-kartex-gold"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => onOpenChange(false)}
            >
              Ακύρωση
            </Button>
            <Button
              type="submit"
              disabled={pending}
              className={cn(premiumGoldButton, "min-w-[120px]")}
            >
              {pending ? "Αποθήκευση…" : "Αποθήκευση"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
