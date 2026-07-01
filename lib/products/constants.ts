export const MEASUREMENT_UNITS = [
  { value: "τεμ", label: "τεμ" },
  { value: "kg", label: "kg" },
  { value: "μέτρο", label: "μέτρο" },
  { value: "ζεύγος", label: "ζεύγος" },
] as const;

export type MeasurementUnit = (typeof MEASUREMENT_UNITS)[number]["value"];

export const DEFAULT_MEASUREMENT_UNIT: MeasurementUnit = "τεμ";
