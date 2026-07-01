import { createAdminClient } from "@/lib/supabase/admin";

export type DriverWithVehicle = {
  id: string;
  name: string;
  email: string;
  vehicleId: string | null;
  vehiclePlate: string | null;
  vehicleModel: string | null;
  maxBoxes: number | null;
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

export async function loadDriversWithVehicles(): Promise<{
  drivers: DriverWithVehicle[];
  error: string | null;
}> {
  try {
    const admin = createAdminClient();
    const [
      { data: authData, error: authError },
      { data: roleRows, error: rolesError },
    ] = await Promise.all([
      admin.auth.admin.listUsers({ perPage: 200 }),
      admin
        .from("user_roles")
        .select("user_id, role, vehicle_id, vehicles ( id, plate, model, max_boxes )")
        .eq("role", "driver"),
    ]);

    if (authError) {
      return { drivers: [], error: authError.message };
    }
    if (rolesError) {
      return { drivers: [], error: rolesError.message };
    }

    const roleByUser = new Map(
      (roleRows ?? []).map((row) => [row.user_id, row] as const),
    );

    const drivers = (authData.users ?? [])
      .filter((user) => roleByUser.has(user.id))
      .map((user) => {
        const email = user.email ?? "—";
        const metadata = user.user_metadata as Record<string, unknown> | undefined;
        const role = roleByUser.get(user.id);
        const vehicle = role?.vehicles;
        const vehicleRow = Array.isArray(vehicle) ? vehicle[0] : vehicle;

        return {
          id: user.id,
          email,
          name: displayNameFromUser(email, metadata),
          vehicleId: role?.vehicle_id ?? vehicleRow?.id ?? null,
          vehiclePlate: vehicleRow?.plate ?? null,
          vehicleModel: vehicleRow?.model ?? null,
          maxBoxes: vehicleRow?.max_boxes ?? null,
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
