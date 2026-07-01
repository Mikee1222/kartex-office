export type Vehicle = {
  id: string;
  plate: string;
  model: string | null;
  maxBoxes: number;
  notes: string | null;
  isActive: boolean;
  assignedDriverId: string | null;
  assignedDriverName: string | null;
};

export type VehicleFormData = {
  plate: string;
  model: string;
  maxBoxes: number;
  notes: string;
  isActive: boolean;
};
