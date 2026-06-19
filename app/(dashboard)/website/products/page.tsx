import { redirect } from "next/navigation";

import { WebsiteProductsPage } from "@/components/website/website-products-page";
import { getSessionAccess } from "@/lib/auth/get-session-access";
import { hasPermission } from "@/lib/permissions";

export default async function WebsiteProductsRoute() {
  const access = await getSessionAccess();
  if (!access) {
    redirect("/login");
  }

  if (!hasPermission(access.role, "canManageUsers", access.customPermissions)) {
    redirect("/dashboard");
  }

  return <WebsiteProductsPage />;
}
