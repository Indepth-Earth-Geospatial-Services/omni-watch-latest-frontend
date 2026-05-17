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
  flightId: string;
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
  flyToId: string;
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
