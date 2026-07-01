import { redirect } from "next/navigation";

import { NewUserForm } from "@/components/users/new-user-form";
import { getSessionAccess } from "@/lib/auth/get-session-access";
import { hasPermission } from "@/lib/permissions";

export default async function NewUserPage() {
  const access = await getSessionAccess();
  if (!access) {
    redirect("/login");
  }

  if (!hasPermission(access.role, "canManageUsers", access.customPermissions)) {
    redirect("/users");
  }

  return <NewUserForm />;
}
