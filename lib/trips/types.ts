export type TripStatus = "pending" | "in_progress" | "completed";

export type TripOrderRow = {
  id: string;
  orderNumber: string;
  customerName: string;
  address: string;
  boxesCount: number;
  status: string;
  deliverySequence: number | null;
};

export type DeliveryTrip = {
  id: string;
  tripNumber: number;
  driverId: string;
  driverName: string;
  vehicleId: string | null;
  vehiclePlate: string | null;
  vehicleModel: string | null;
  maxBoxes: number;
  totalBoxes: number;
  status: TripStatus;
  notes: string | null;
  departedAt: string | null;
  returnedAt: string | null;
  orders: TripOrderRow[];
};

export type DriverTripGroup = {
  driverId: string;
  driverName: string;
  vehicleId: string | null;
  vehiclePlate: string | null;
  vehicleModel: string | null;
  maxBoxes: number;
  trips: DeliveryTrip[];
};

export type AvailableTripOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  address: string;
  boxesCount: number;
  deliveryDate: string | null;
};
