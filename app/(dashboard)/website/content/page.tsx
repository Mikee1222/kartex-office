import { redirect } from "next/navigation";

import { WebsiteContentPage } from "@/components/website/website-content-page";
import { getSessionAccess } from "@/lib/auth/get-session-access";
import { hasPermission } from "@/lib/permissions";

export default async function WebsiteContentRoute() {
  const access = await getSessionAccess();
  if (!access) {
    redirect("/login");
  }

  if (!hasPermission(access.role, "canManageUsers", access.customPermissions)) {
    redirect("/dashboard");
  }

  return <WebsiteContentPage />;
}
