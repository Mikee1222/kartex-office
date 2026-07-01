export type LiveDriverLocation = {
  lat: number;
  lng: number;
  recordedAt: string;
};

export type LiveStopCoords = {
  lat: number;
  lng: number;
};

export type LiveDriverRow = {
  tripId: string;
  tripNumber: number;
  driverId: string;
  driverName: string;
  stopsRemaining: number;
  totalStops: number;
  location: LiveDriverLocation | null;
  locationTrail: LiveDriverLocation[];
  nextStop: LiveStopCoords | null;
};

export type LiveDriversPayload = {
  today: string;
  drivers: LiveDriverRow[];
  mapsApiKey: string | null;
};
