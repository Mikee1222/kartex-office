import {
  normalizeAppRole,
  type AppRole,
} from "@/lib/permissions";

export type UserRoleKey = AppRole;

export const USER_ROLE_KEYS: UserRoleKey[] = [
  "admin",
  "salesperson",
  "warehouse",
  "driver",
];

export const USER_ROLE_LABELS: Record<UserRoleKey, string> = {
  admin: "Admin",
  salesperson: "Πωλητής",
  warehouse: "Αποθήκη",
  driver: "Οδηγός",
};

export function normalizeUserRole(value: unknown): UserRoleKey | null {
  return normalizeAppRole(value);
}

export function isUserActive(metadata: Record<string, unknown> | undefined): boolean {
  return metadata?.active !== false;
}

export type CustomPermissionsMap = Partial<
  Record<import("@/lib/permissions").PermissionKey, boolean>
>;

export function parseCustomPermissions(
  value: unknown,
): CustomPermissionsMap | undefined {
  if (!value || typeof value !== "object") return undefined;
  return value as CustomPermissionsMap;
}
