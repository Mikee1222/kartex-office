import { createAdminClient } from "@/lib/supabase/admin";

export type DriverOption = {
  id: string;
  name: string;
  email: string;
};

function displayNameFromUser(
  email: string,
  metadata: Record<string, unknown> | undefined,
): string {
  const fullName = metadata?.full_name ?? metadata?.name;
  if (typeof fullName === "string" && fullName.trim()) {
    return fullName.trim();
  }
  const local = email.split("@")[0] ?? email;
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function loadDrivers(): Promise<{
  drivers: DriverOption[];
  error: string | null;
}> {
  try {
    const admin = createAdminClient();
    const [{ data: authData, error: authError }, { data: roleRows, error: rolesError }] =
      await Promise.all([
        admin.auth.admin.listUsers({ perPage: 200 }),
        admin.from("user_roles").select("user_id, role").eq("role", "driver"),
      ]);

    if (authError) {
      return { drivers: [], error: authError.message };
    }
    if (rolesError) {
      return { drivers: [], error: rolesError.message };
    }

    const driverIds = new Set((roleRows ?? []).map((row) => row.user_id));

    const drivers = (authData.users ?? [])
      .filter((user) => driverIds.has(user.id))
      .map((user) => {
        const email = user.email ?? "—";
        const metadata = user.user_metadata as Record<string, unknown> | undefined;
        return {
          id: user.id,
          email,
          name: displayNameFromUser(email, metadata),
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name, "el"));

    return { drivers, error: null };
  } catch (err) {
    return {
      drivers: [],
      error:
        err instanceof Error
          ? err.message
          : "Αποτυχία φόρτωσης οδηγών.",
    };
  }
}
