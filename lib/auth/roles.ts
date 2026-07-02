import type { SupabaseClient, User } from "@supabase/supabase-js";

import type { AppRole } from "@/lib/permissions";

export const STAFF_ALLOWED_ROLES = [
  "admin",
  "salesperson",
  "warehouse",
  "driver",
] as const;

export type StaffRole = (typeof STAFF_ALLOWED_ROLES)[number];

const BOOTSTRAP_ADMIN_EMAIL = "admin@karalis.gr";

export function isStaffRole(
  role: string | null | undefined,
): role is StaffRole {
  return (
    role === "admin" ||
    role === "salesperson" ||
    role === "warehouse" ||
    role === "driver"
  );
}

export function isBootstrapAdminEmail(email: string | undefined) {
  return email?.trim().toLowerCase() === BOOTSTRAP_ADMIN_EMAIL;
}

export function roleFromBootstrapOrRow(
  email: string | undefined,
  role: string | null | undefined,
): AppRole | null {
  if (isBootstrapAdminEmail(email)) {
    return "admin";
  }
  return isStaffRole(role) ? role : null;
}

export async function resolveStaffRole(
  supabase: SupabaseClient,
  user: User,
): Promise<AppRole | null> {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  return roleFromBootstrapOrRow(user.email, data?.role ?? null);
}
