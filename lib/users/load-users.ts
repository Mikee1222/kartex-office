import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeAppRole } from "@/lib/permissions";
import {
  isUserActive,
  normalizeUserRole,
  parseCustomPermissions,
  type CustomPermissionsMap,
  type UserRoleKey,
} from "@/lib/users/roles";
import { formatDateEl } from "@/types/database";

export type ManagedUserRow = {
  id: string;
  email: string;
  role: UserRoleKey;
  active: boolean;
  createdAt: string;
  customPermissions?: CustomPermissionsMap;
};

export async function loadManagedUsers(): Promise<{
  users: ManagedUserRow[];
  error: string | null;
}> {
  try {
    const admin = createAdminClient();
    const [{ data: authData, error: authError }, { data: roleRows, error: rolesError }] =
      await Promise.all([
        admin.auth.admin.listUsers({ perPage: 200 }),
        admin.from("user_roles").select("user_id, role"),
      ]);

    if (authError) {
      return { users: [], error: authError.message };
    }

    if (rolesError) {
      return { users: [], error: rolesError.message };
    }

    const roleByUserId = new Map(
      (roleRows ?? []).map((row) => [row.user_id, normalizeAppRole(row.role)]),
    );

    const users = (authData.users ?? []).map((u) => {
      const metadata = u.user_metadata as Record<string, unknown> | undefined;
      const role = normalizeUserRole(roleByUserId.get(u.id) ?? metadata?.role);

      return {
        id: u.id,
        email: u.email ?? "—",
        role,
        active: isUserActive(metadata),
        createdAt: formatDateEl(u.created_at),
        customPermissions: parseCustomPermissions(metadata?.custom_permissions),
      };
    });

    return { users, error: null };
  } catch (err) {
    return {
      users: [],
      error:
        err instanceof Error
          ? err.message
          : "Δεν ήταν δυνατή η φόρτωση χρηστών (έλεγχος service role key).",
    };
  }
}
