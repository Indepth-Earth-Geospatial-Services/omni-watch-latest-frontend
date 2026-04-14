// Wayline types — flight route files (KMZ), tasks, and active job tracking

// A stored wayline route file uploaded by an operator
export interface Wayline {
  wayline_id: string;
  name: string;
  drone_model_key: string;       // which drone model this route is compatible with
  payload_model_key: string[];   // compatible payload models
  wayline_type: number;          // 0 = waypoint, 1 = mapping, 2 = oblique
  update_time: number;           // Unix timestamp ms
  username: string;              // who uploaded it
  favorited: boolean;
  object_key: string;            // KMZ file location in object storage
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

// An active or historical flight job
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
