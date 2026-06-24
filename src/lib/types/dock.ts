// Types for the DJI dock-controller endpoints under /control/api/v1

// ─── Shared ───────────────────────────────────────────────────────────────────

export interface GimbalRotation {
  pitch: number;
  roll: number;
  yaw: number;
}

// ─── Payload command ──────────────────────────────────────────────────────────

export type CameraType = 'zoom' | 'wide' | 'ir';

export interface PayloadCommandData {
  payloadIndex: string;
  cameraType: CameraType;
  zoomFactor?: number;
  cameraMode?: string;    // "0" = photo, "1" = video
  locked?: boolean;
  pitchSpeed?: number;
  yawSpeed?: number;
  x?: number;
  y?: number;
  resetMode?: string;
  controlType?: number;
  rotation?: GimbalRotation;
}

export type PayloadCmd = 'camera_mode_switch' | 'gimbal_reset' | 'gimbal_rotate' | 'camera_aim' | string;

export interface PayloadCommandRequest {
  sn: string;
  cmd: PayloadCmd;
  data: PayloadCommandData;
}

// ─── Job control (generic service) ───────────────────────────────────────────

export interface JobActionRequest {
  action: number;  // 0 = pause, 1 = resume, 2 = stop (varies by service)
}

// ─── Takeoff-to-point ─────────────────────────────────────────────────────────

export interface TakeoffToPointRequest {
  flightId?: string; // stripped by service layer before sending to DJI
  targetLongitude: number;
  targetLatitude: number;
  targetHeight: number;
  securityTakeoffHeight: number;
  rthAltitude: number;
  rcLostAction: string;              // "0" = hover, "1" = land, "2" = go home
  exitWaylineWhenRcLost: string;     // "0" = no, "1" = yes
  maxSpeed: number;
  rthMode: string;                   // "0" = smart, "1" = altitude-first
  commanderModeLostAction: string;
  commanderFlightMode: string;
  commanderFlightHeight: number;
}

// ─── Fly-to-point ─────────────────────────────────────────────────────────────

export interface DockFlyToPoint {
  latitude: number;
  longitude: number;
  height: number;
}

export interface DockFlyToPointRequest {
  flyToId?: string; // stripped by service layer before sending to DJI
  maxSpeed: number;
  points: DockFlyToPoint[];
}

// ─── Authority ────────────────────────────────────────────────────────────────

export interface PayloadAuthorityRequest {
  payloadIndex: string;
  cameraType: CameraType;
  zoomFactor?: number;
  cameraMode?: string;
  locked?: boolean;
  pitchSpeed?: number;
  yawSpeed?: number;
  x?: number;
  y?: number;
  resetMode?: string;
  controlType?: number;
  rotation?: GimbalRotation;
}

// ─── DRC (Drone Remote Control) ───────────────────────────────────────────────

/** POST /control/api/v1/workspaces/{wid}/drc/connect — request body */
export interface DRCConnectRequest {
  client_id: string;
  expire_sec: number;
}

/** Response from /drc/connect — MQTT broker credentials */
export interface DRCConnectResponse {
  address: string;       // e.g. "tcp://35.222.89.171:1883"
  client_id: string;
  username: string;
  password: string;
  expire_sec: number;
}

/** POST /control/api/v1/workspaces/{wid}/drc/enter — request body */
export interface DRCEnterRequest {
  client_id: string;
  dock_sn: string;
}

/** Response from /drc/enter — MQTT pub/sub topics for sending commands */
export interface DRCEnterResponse {
  pub: string[];   // topics to publish drone_control / heart_beat messages
  sub: string[];   // topics to subscribe for DRC responses
}

/** POST /control/api/v1/workspaces/{wid}/drc/exit — request body */
export interface DRCExitRequest {
  client_id: string;
  dock_sn: string;
}

/** Velocity command published over DRC MQTT at 50ms intervals */
export interface DRCVelocityCommand {
  x?: number;   // forward/backward speed (m/s), positive = forward
  y?: number;   // left/right speed (m/s), positive = right
  h?: number;   // altitude delta (m), positive = up
  w?: number;   // yaw speed (deg/s), positive = clockwise
  seq: number;  // monotonically increasing sequence number
}

