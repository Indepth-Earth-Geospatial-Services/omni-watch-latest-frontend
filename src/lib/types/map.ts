// Map and geospatial types — element groups, GeoJSON elements, flight area geofences
// All field names verified against live docs at cerulean-scone-58646f.netlify.app

// ─── Query params ─────────────────────────────────────────────────────────────

// Optional filters for GET /map/api/v1/workspaces/{workspace_id}/element-groups
export interface GetElementGroupsParams {
  is_distributed?: boolean; // filter by distributed flag
  group_id?: string;        // fetch a specific group only
}

// ─── Map Elements ─────────────────────────────────────────────────────────────

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
  resource: unknown;    // GeoJSON geometry or resource descriptor from server
  create_time: number;
  update_time: number;
  username: string;     // who created it
}

// Minimal GeoJSON feature shape — DJI uses this subset of the full GeoJSON spec
export interface GeoJSONFeature {
  type: 'Feature';
  geometry: {
    type: string;       // "Point" | "LineString" | "Polygon"
    coordinates: unknown;
  };
  properties?: Record<string, unknown>;
}

// Body for POST /element-groups/{element_group_id}/elements
// The server expects a GeoJSON Feature with DJI-specific fields
export interface AddElementRequest {
  id: string;       // client-generated UUID for the element
  name: string;     // display name for the element
  resource: unknown; // GeoJSON geometry or DJI resource descriptor
}

// ─── Flight Areas (Geofencing) ────────────────────────────────────────────────

// A restricted or designated flight zone pushed to devices
export interface FlightArea {
  id: string;
  name: string;
  type: string;         // "circle" | "polygon"
  status: number;       // 0 = disabled, 1 = enabled
  content: unknown;     // Circle/Polygon geometry (DJI-specific format)
  create_time: number;
  update_time: number;
}

// Body for POST /map/api/v1/workspaces/{workspace_id}/flight-area
export interface AddFlightAreaRequest {
  name: string;
  type: string;     // "circle" | "polygon"
  content: unknown; // Circle/Polygon geometry matching the type above
}

// Body for POST /map/api/v1/workspaces/{workspace_id}/flight-area/sync
// Pushes all current flight areas to the specified devices.
// Note: no area_ids field — the server syncs ALL areas to the listed devices.
export interface SyncFlightAreaRequest {
  device_sn: string[]; // array of device serial numbers to push flight areas to
}

// Response item for GET /map/api/v1/workspaces/{workspace_id}/device-status
export interface DeviceFlightAreaStatus {
  device_sn: string;
  sync_status: number; // 0 = not synced, 1 = synced, 2 = sync failed
  update_time: number;
}
