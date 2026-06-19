import { redirect } from "next/navigation";

import { WebsiteSettingsPage } from "@/components/website/website-settings-page";
import { getSessionAccess } from "@/lib/auth/get-session-access";
import { hasPermission } from "@/lib/permissions";

export default async function WebsiteSettingsRoute() {
  const access = await getSessionAccess();
  if (!access) {
    redirect("/login");
  }

  if (!hasPermission(access.role, "canManageUsers", access.customPermissions)) {
    redirect("/dashboard");
  }

  return <WebsiteSettingsPage />;
}
