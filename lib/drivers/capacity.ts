import { getAthensDateString } from "@/lib/datetime";

export type CapacityStatus = "available" | "full" | "overloaded" | "none";

export type DriverCapacitySnapshot = {
  driverId: string;
  scheduleDate: string;
  vehicleId: string | null;
  plate: string | null;
  model: string | null;
  maxBoxes: number;
  currentBoxes: number;
  deliveriesCount: number;
  status: CapacityStatus;
};

export function resolveScheduleDate(deliveryDate: string | null | undefined): string {
  return deliveryDate?.trim() || getAthensDateString();
}

export function getCapacityStatus(
  currentBoxes: number,
  maxBoxes: number,
): CapacityStatus {
  if (maxBoxes <= 0) return "none";
  if (currentBoxes > maxBoxes) return "overloaded";
  if (currentBoxes >= maxBoxes * 0.8) return "full";
  return "available";
}

export function capacityStatusLabel(status: CapacityStatus): string {
  switch (status) {
    case "available":
      return "Διαθέσιμο";
    case "full":
      return "Γεμάτο";
    case "overloaded":
      return "Υπερφόρτωση";
    default:
      return "—";
  }
}

export function capacityProgressPercent(current: number, max: number): number {
  if (max <= 0) return 0;
  return Math.min(Math.round((current / max) * 100), 150);
}

export function capacityBarClass(percent: number): string {
  if (percent > 100) return "bg-red-600";
  if (percent >= 80) return "bg-amber-500";
  return "bg-emerald-500";
}

export function formatVehicleLabel(plate: string | null, model: string | null): string {
  if (!plate) return "—";
  return model?.trim() ? `${plate} (${model.trim()})` : plate;
}
