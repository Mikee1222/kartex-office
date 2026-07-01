import { redirect } from "next/navigation";

import { WebsiteProductEditPage } from "@/components/website/website-product-edit-page";
import { getSessionAccess } from "@/lib/auth/get-session-access";
import { hasPermission } from "@/lib/permissions";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function WebsiteProductEditRoute({ params }: PageProps) {
  const access = await getSessionAccess();
  if (!access) {
    redirect("/login");
  }

  if (!hasPermission(access.role, "canManageUsers", access.customPermissions)) {
    redirect("/dashboard");
  }

  const { id } = await params;
  return <WebsiteProductEditPage masterId={id} />;
}
