export type LiveDriverLocation = {
  lat: number;
  lng: number;
  recordedAt: string;
};

export type LiveDriverRow = {
  tripId: string;
  tripNumber: number;
  driverId: string;
  driverName: string;
  stopsRemaining: number;
  totalStops: number;
  location: LiveDriverLocation | null;
};

export type LiveDriversPayload = {
  today: string;
  drivers: LiveDriverRow[];
  mapsApiKey: string | null;
};
