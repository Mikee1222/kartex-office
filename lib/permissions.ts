export const PERMISSIONS = {
  admin: {
    canViewOrders: true,
    canCreateOrders: true,
    canDeleteOrders: true,
    canViewCustomers: true,
    canCreateCustomers: true,
    canDeleteCustomers: true,
    canViewProducts: true,
    canCreateProducts: true,
    canDeleteProducts: true,
    canViewReports: true,
    canViewUsers: true,
    canManageUsers: true,
    canViewInventory: true,
    canAdjustInventory: true,
  },
  salesperson: {
    canViewOrders: true,
    canCreateOrders: true,
    canDeleteOrders: false,
    canViewCustomers: true,
    canCreateCustomers: true,
    canDeleteCustomers: false,
    canViewProducts: true,
    canCreateProducts: false,
    canDeleteProducts: false,
    canViewReports: true,
    canViewUsers: false,
    canManageUsers: false,
    canViewInventory: true,
    canAdjustInventory: false,
  },
  warehouse: {
    canViewOrders: true,
    canCreateOrders: false,
    canDeleteOrders: false,
    canViewCustomers: false,
    canCreateCustomers: false,
    canDeleteCustomers: false,
    canViewProducts: true,
    canCreateProducts: false,
    canDeleteProducts: false,
    canViewReports: false,
    canViewUsers: false,
    canManageUsers: false,
    canViewInventory: true,
    canAdjustInventory: true,
  },
  driver: {
    canViewOrders: true,
    canCreateOrders: false,
    canDeleteOrders: false,
    canViewCustomers: false,
    canCreateCustomers: false,
    canDeleteCustomers: false,
    canViewProducts: false,
    canCreateProducts: false,
    canDeleteProducts: false,
    canViewReports: false,
    canViewUsers: false,
    canManageUsers: false,
    canViewInventory: false,
    canAdjustInventory: false,
  },
} as const;

export type AppRole = keyof typeof PERMISSIONS;

export type PermissionKey = keyof typeof PERMISSIONS.admin;

export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  canViewOrders: "Προβολή παραγγελιών",
  canCreateOrders: "Δημιουργία παραγγελιών",
  canDeleteOrders: "Διαγραφή παραγγελιών",
  canViewCustomers: "Προβολή πελατών",
  canCreateCustomers: "Δημιουργία πελατών",
  canDeleteCustomers: "Διαγραφή πελατών",
  canViewProducts: "Προβολή προϊόντων",
  canCreateProducts: "Δημιουργία προϊόντων",
  canDeleteProducts: "Διαγραφή προϊόντων",
  canViewReports: "Προβολή αναφορών",
  canViewUsers: "Προβολή χρηστών",
  canManageUsers: "Διαχείριση χρηστών",
  canViewInventory: "Προβολή αποθήκης",
  canAdjustInventory: "Προσαρμογή αποθέματος",
};

export const ALL_PERMISSION_KEYS = Object.keys(
  PERMISSIONS.admin,
) as PermissionKey[];

export function normalizeAppRole(value: unknown): AppRole {
  if (value === "admin" || value === "salesperson" || value === "warehouse" || value === "driver") {
    return value;
  }
  if (value === "sales") return "salesperson";
  return "salesperson";
}

export function getRolePermissions(role: string) {
  const key = normalizeAppRole(role);
  return { ...PERMISSIONS[key] };
}

export function resolvePermissions(
  role: string,
  overrides?: Partial<Record<PermissionKey, boolean>> | null,
) {
  const base = getRolePermissions(role);
  if (!overrides) return base;
  return { ...base, ...overrides };
}

export function hasPermission(
  role: string,
  permission: PermissionKey,
  overrides?: Partial<Record<PermissionKey, boolean>> | null,
) {
  return resolvePermissions(role, overrides)[permission] ?? false;
}
