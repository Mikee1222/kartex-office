import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { PermissionsProvider } from "@/lib/auth/permissions-context";
import { getSessionAccess } from "@/lib/auth/get-session-access";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const access = await getSessionAccess();

  if (!access) {
    redirect("/login");
  }

  return (
    <PermissionsProvider
      userId={access.userId}
      role={access.role}
      customPermissions={access.customPermissions}
    >
      <DashboardShell userEmail={access.email} userRole={access.role}>
        {children}
      </DashboardShell>
    </PermissionsProvider>
  );
}
