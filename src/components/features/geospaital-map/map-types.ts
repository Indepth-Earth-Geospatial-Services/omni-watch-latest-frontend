// Shared local types for the geospatial map feature

export interface DronePositionType {
  longitude: number;
  latitude: number;
  sn: string;
  nickname: string;
  heading: number;       // 0–360 degrees clockwise from north
  altitude: number | null; // metres AGL — null until telemetry arrives
  hasGPS: boolean;       // false when seeded from REST API with no fix yet
}

export interface SelectedDroneInfo {
  nickname: string;
  serialNumber: string;
  latitude: string;
  longitude: string;
  battery: number;
  altitude: number | null; // null until the drone reports a real altitude
  direction: string;
  heading: number;
  speed: number;
  modeCode: number;
}

// 'single' = map follows one drone; 'multi' = all drones visible
export type MapViewMode = 'single' | 'multi';

export interface PendingPoint {
  lng: number;
  lat: number;
}
