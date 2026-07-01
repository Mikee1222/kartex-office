import {
  hasPermission,
  normalizeAppRole,
  type AppRole,
  type PermissionKey,
} from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseCustomPermissions } from "@/lib/users/roles";
import { createClient } from "@/lib/supabase/server";

const BOOTSTRAP_ADMIN_EMAIL = "admin@karalis.gr";

export type SessionAccess = {
  userId: string;
  email: string;
  role: AppRole;
  customPermissions?: Partial<Record<PermissionKey, boolean>>;
};

function isBootstrapAdminEmail(email: string | undefined) {
  return email?.trim().toLowerCase() === BOOTSTRAP_ADMIN_EMAIL;
}

export async function getSessionAccess(): Promise<SessionAccess | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const metadata = user.user_metadata as Record<string, unknown> | undefined;
  const customPermissions = parseCustomPermissions(metadata?.custom_permissions);

  let role: AppRole;

  try {
    const admin = createAdminClient();
    const { data: roleData } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (roleData?.role) {
      role = normalizeAppRole(roleData.role);
    } else if (isBootstrapAdminEmail(user.email)) {
      role = "admin";
    } else {
      role = normalizeAppRole(metadata?.role);
    }
  } catch {
    role = isBootstrapAdminEmail(user.email)
      ? "admin"
      : normalizeAppRole(metadata?.role);
  }

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
