import { createClient } from "@/lib/supabase/client";
import type { ScheduleTrip } from "@/lib/schedule/types";

export async function fetchScheduleTrips(): Promise<ScheduleTrip[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("delivery_trips")
    .select(
      "id, trip_number, trip_date, driver_id, driver_name, status, total_boxes, departed_at",
    )
    .order("trip_date", { ascending: true });

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    tripNumber: row.trip_number,
    tripDate: row.trip_date,
    driverId: row.driver_id,
    driverName: row.driver_name?.trim() || "—",
    status: row.status,
    totalBoxes: row.total_boxes ?? 0,
    departedAt: row.departed_at,
  }));
}
