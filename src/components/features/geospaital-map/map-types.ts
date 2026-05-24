// Shared local types for the geospatial map feature

export interface DronePositionType {
  longitude: number;
  latitude: number;
  sn: string;
  nickname: string;
  heading: number;  // 0–360 degrees clockwise from north
  altitude: number; // metres AGL
  hasGPS: boolean;  // false when seeded from REST API with no fix yet
}

export interface SelectedDroneInfo {
  nickname: string;
  serialNumber: string;
  latitude: string;
  longitude: string;
  battery: number;
  altitude: number;
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
