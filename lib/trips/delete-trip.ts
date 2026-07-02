import type { TripStatus } from "@/lib/trips/types";

export function buildDeleteTripConfirmMessage(input: {
  tripNumber: number;
  orderCount: number;
}): string {
  const lines = [`Διαγραφή δρομολογίου #${input.tripNumber};`, ""];

  if (input.orderCount > 0) {
    const label = input.orderCount === 1 ? "παραγγελία" : "παραγγελίες";
    lines.push(
      `Αυτό το δρομολόγιο έχει ${input.orderCount} ${label} — θα αποδεσμευτούν και θα χρειαστούν νέα ανάθεση.`,
      "",
    );
  } else {
    lines.push("Το δρομολόγιο είναι κενό.", "");
  }

  lines.push("Η ενέργεια δεν αναιρείται.");
  return lines.join("\n");
}

export function deleteTripBlockedReason(status: TripStatus): string | null {
  if (status === "in_progress") {
    return "Δρομολόγιο σε εξέλιξη — περιέχει ιστορικό GPS και ενεργές παραδόσεις. Δεν μπορεί να διαγραφεί.";
  }
  if (status === "completed") {
    return "Ολοκληρωμένο δρομολόγιο — το ιστορικό παράδοσης διατηρείται. Δεν μπορεί να διαγραφεί.";
  }
  return null;
}

export async function deleteTripViaApi(
  tripId: string,
): Promise<{ ok: true; detachedOrderCount: number } | { ok: false; error: string }> {
  const res = await fetch(`/api/trips/${tripId}`, { method: "DELETE" });
  const json = (await res.json()) as {
    error?: string;
    detachedOrderCount?: number;
  };

  if (!res.ok) {
    return { ok: false, error: json.error ?? "Αποτυχία διαγραφής." };
  }

  return { ok: true, detachedOrderCount: json.detachedOrderCount ?? 0 };
}
