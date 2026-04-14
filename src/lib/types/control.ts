// Drone control types — fly-to, takeoff, RTH, DRC session, payload and authority

export interface FlyToPoint {
  latitude: number;
  longitude: number;
  height: number;          // height above takeoff point in metres
  global_altitude: number; // altitude above sea level in metres
}

export interface FlyToPointRequest {
  fly_to_id: string;       // unique ID for this command — used to cancel it later
  max_speed: number;       // metres per second
  points: FlyToPoint[];    // one or more waypoints to fly through in sequence
}

export interface TakeoffRequest {
  fly_to_id: string;
  max_speed: number;
  takeoff_altitude: number; // height to climb to before flying to the first point
  points: FlyToPoint[];
}

// DRC = Device Remote Control — a real-time bidirectional channel for manual control
export interface DRCSession {
  status: number;   // 0 = disconnected, 1 = connected
  deadline: number; // Unix timestamp when the session expires
}

export interface PayloadCommand {
  payload_type: number;
  payload_sn: string;
  commands: PayloadAction[];
}

export interface PayloadAction {
  type: string;     // e.g. "camera_mode_switch", "camera_focus"
  value: unknown;
}
