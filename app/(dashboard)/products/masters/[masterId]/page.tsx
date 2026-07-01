import { redirect } from "next/navigation";

import { ProductMasterEditPage } from "@/components/products/product-master-edit-page";
import { getSessionAccess } from "@/lib/auth/get-session-access";
import { hasPermission } from "@/lib/permissions";

type ProductMasterPageProps = {
  params: Promise<{ masterId: string }>;
};

export default async function ProductMasterPage({ params }: ProductMasterPageProps) {
  const access = await getSessionAccess();
  if (!access) {
    redirect("/login");
  }

  if (!hasPermission(access.role, "canCreateProducts", access.customPermissions)) {
    redirect("/dashboard");
  }

  const { masterId } = await params;
  return <ProductMasterEditPage masterId={masterId} />;
}
