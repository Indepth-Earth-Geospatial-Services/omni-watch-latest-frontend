// Wayline types — flight route files (KMZ), tasks, and active job tracking

export interface WaypointCoord {
  lat: number;
  lng: number;
  alt: number; // execute height in metres (from wpml:executeHeight or KML altitude)
  index: number;
}

export interface WaylineMissionData {
  missionType: string;
  templateType: number;
  flightAltitude: number;
  flightSpeed: number;
  transitSpeed: number;
  droneEnumValue: number;
  payloadEnumValue: number;
  shootType: string;
  photoInterval: number;
  frontOverlap: number;
  sideOverlap: number;
  surveyPolygon: Array<{ lng: number; lat: number }>;
  totalDistance: number;
  estimatedDuration: number;
  estimatedPhotos: number;
  surveyArea: number;
}

// A stored wayline route file uploaded by an operator.
export interface Wayline {
  id: string;                      // unique wayline UUID
  name: string;
  drone_model_key: string;
  payload_model_keys: string[];    // compatible payload models
  template_types: number[];        // [0]=waypoint, [1]=mapping, [2]=oblique
  update_time: number;             // Unix timestamp ms
  create_time: number;             // Unix timestamp ms
  user_name: string;               // who uploaded it
  favorited: boolean;
  object_key: string;              // KMZ storage path
  sign?: string;                   // file checksum
}

/** Returns the unique ID for a wayline. */
export function getWaylineId(wl: Wayline): string {
  return wl.id;
}

export interface WaylineListResponse {
  list: Wayline[];
  pagination: {
    total: number;
    page: number;
    page_size: number;
  };
}

// Payload sent to schedule a new automated flight
export interface FlightTask {
  name: string;
  file_id: string;               // wayline_id of the route to fly
  task_type: number;             // 0 = immediate, 1 = scheduled (requires execute_time)
  way_point_type: number;        // 0 = global, 1 = relative altitude
  out_of_control_action: number; // 0 = return home, 1 = hover, 2 = land
  rth_altitude: number;          // return-to-home altitude in metres
  execute_time?: number;         // Unix timestamp ms — only needed for scheduled tasks
  select_execute_count?: number; // how many times to repeat the mission
  device_sn: string;             // which drone to assign the task to
}

// An active or historical flight job — as returned by /wayline/api/v1/workspaces/{id}/jobs
export interface FlightJob {
  job_id: string;
  name: string;
  file_id: string;
  status: number;      // 0 = pending, 1 = in-progress, 2 = complete, 3 = failed, 4 = paused, 5 = cancelled
  execute_time?: number;
  device_sn: string;
  update_time: number;
}

export interface UpdateJobStatusRequest {
  status: number; // 0 = pause, 1 = resume
}

// Shape returned by GET /wayline/api/v1/workspaces/{id}/jobs
export interface WaylineJobItem {
  job_id: string;
  job_name: string;
  file_id: string;       // wayline file UUID — used to get download URL
  file_name: string;     // human-readable wayline name
  dock_sn: string;
  workspace_id: string;
  wayline_type: number;  // 0=Waypoint, 1=Mapping, 2=Oblique
  task_type: number;
  execute_time: string;  // "YYYY-MM-DD HH:MM:SS"
  begin_time: string;
  end_time: string;
  completed_time: string;
  status: number;
  progress: number;      // 0-100 percent — task execution progress
  username: string;
  code: number;
  rth_altitude: number;
  out_of_control_action: number;
  media_count: number;
}

export interface WaylineJobListResponse {
  list: WaylineJobItem[];
  pagination: { page: number; total: number; page_size: number };
}

// Flight task status — numeric union matching the DJI API wire format
export type FlightTaskStatus = 1 | 2 | 3 | 4 | 5 | 6;
// 1 = Pending, 2 = InProgress, 3 = Complete, 4 = Failed, 5 = Cancelled, 6 = Paused

// Companion constants for display mapping (not enums — follows codebase convention)
export const FlightTaskStatusMap: Record<FlightTaskStatus, string> = {
  1: 'Pending',
  2: 'In Progress',
  3: 'Complete',
  4: 'Failed',
  5: 'Cancelled',
  6: 'Paused',
};

// Request body for POST /wayline/api/v1/workspaces/{wid}/flight-tasks
export interface CreateFlightTask {
  name: string;
  file_id: string;
  task_type: number;             // 0 = immediate, 1 = timed, 2 = conditional
  way_point_type: number;        // 0 = global, 1 = relative altitude
  out_of_control_action: number; // 0 = return home, 1 = hover, 2 = land
  rth_altitude: number;          // 20-500m
  device_sn: string;
  dock_sn: string;
  wayline_type: number;          // from wayline.template_types[0]
  execute_time?: number;         // Unix timestamp ms — for timed/conditional
  task_days?: number[];          // for conditional tasks
  task_periods?: number[][];     // for conditional tasks
  min_battery_capacity?: number;
  min_storage_capacity?: number;
}

// DELETE /wayline/api/v1/workspaces/{wid}/jobs?job_id=X
export interface DeleteTaskParams {
  job_id: string;
}

// PUT /wayline/api/v1/workspaces/{wid}/jobs/{job_id}
export interface UpdateTaskStatusBody {
  status: number; // 0 = suspend, 1 = resume
}
