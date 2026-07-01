"use client";

import * as React from "react";

import {
  hasPermission,
  type AppRole,
  type PermissionKey,
} from "@/lib/permissions";

export type PermissionsContextValue = {
  userId: string;
  role: AppRole;
  customPermissions?: Partial<Record<PermissionKey, boolean>>;
  can: (permission: PermissionKey) => boolean;
};

const PermissionsContext = React.createContext<PermissionsContextValue | null>(
  null,
);

type PermissionsProviderProps = {
  userId: string;
  role: AppRole;
  customPermissions?: Partial<Record<PermissionKey, boolean>>;
  children: React.ReactNode;
};

export function PermissionsProvider({
  userId,
  role,
  customPermissions,
  children,
}: PermissionsProviderProps) {
  const value = React.useMemo<PermissionsContextValue>(
    () => ({
      userId,
      role,
      customPermissions,
      can: (permission) => hasPermission(role, permission, customPermissions),
    }),
    [userId, role, customPermissions],
  );

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const ctx = React.useContext(PermissionsContext);
  if (!ctx) {
    throw new Error("usePermissions must be used within PermissionsProvider");
  }
  return ctx;
}

export function usePermissionsOptional() {
  return React.useContext(PermissionsContext);
}
