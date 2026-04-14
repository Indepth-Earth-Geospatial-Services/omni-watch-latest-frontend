// Map and geospatial types — element groups, GeoJSON elements, flight area geofences

// A named collection of map elements (points, lines, polygons)
export interface ElementGroup {
  id: string;
  name: string;
  element_count: number;
  create_time: number; // Unix timestamp ms
  update_time: number;
}

// A single geographic feature (point of interest, route line, area polygon)
export interface MapElement {
  id: string;
  name: string;
  type: string;         // "point" | "line" | "polygon"
  geojson: GeoJSONFeature;
  create_time: number;
  update_time: number;
  username: string;     // who created it
}

// Minimal GeoJSON feature shape — full GeoJSON spec is more complex but DJI uses this subset
export interface GeoJSONFeature {
  type: 'Feature';
  geometry: {
    type: string;       // "Point" | "LineString" | "Polygon"
    coordinates: unknown;
  };
  properties?: Record<string, unknown>;
}

// A restricted or designated flight zone pushed to devices
export interface FlightArea {
  id: string;
  name: string;
  type: string;         // "circle" | "polygon"
  status: number;       // 0 = disabled, 1 = enabled
  geojson: GeoJSONFeature;
  create_time: number;
  update_time: number;
}

export interface FlightAreaSyncRequest {
  area_ids: string[];       // which flight areas to sync
  device_sn_list: string[]; // which devices receive them
}
