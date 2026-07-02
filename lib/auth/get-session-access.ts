import {
  roleFromBootstrapOrRow,
} from "@/lib/auth/roles";
import {
  hasPermission,
  type AppRole,
  type PermissionKey,
} from "@/lib/permissions";
import { parseCustomPermissions } from "@/lib/users/roles";
import { createClient } from "@/lib/supabase/server";

export type SessionAccess = {
  userId: string;
  email: string;
  role: AppRole;
  customPermissions?: Partial<Record<PermissionKey, boolean>>;
};

export async function getSessionAccess(): Promise<SessionAccess | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const metadata = user.user_metadata as Record<string, unknown> | undefined;
  const customPermissions = parseCustomPermissions(metadata?.custom_permissions);

  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  const role = roleFromBootstrapOrRow(user.email, roleData?.role ?? null);
  if (!role) return null;

  return {
    userId: user.id,
    email: user.email ?? "",
    role,
    customPermissions,
  };
}

export async function requireManageUsers(): Promise<
  SessionAccess | { error: string; status: number }
> {
  const access = await getSessionAccess();
  if (!access) {
    return { error: "Unauthorized", status: 401 };
  }
  if (!hasPermission(access.role, "canManageUsers", access.customPermissions)) {
    return { error: "Forbidden", status: 403 };
  }
  return access;
}
