export interface DroneData {
  sn: string | number;
  name: string;
  latitude: number;
  longitude: number;
  battery: number;
  direction: string;
  status: "online" | "offline";
  feedType: "DRONE" | "BODY CAM" | "CCTV";
  hasAgoraStream: boolean;
  appId?: string;
  token?: string;
  channel?: string;
  agoraChannel?: string | null;
}

export interface IncidentData {
  id: string;
  title: string;
  description: string;
  status: "OPEN" | "RESOLVED" | "IN PROGRESS" | "MONITORING";
  timestamp: string;
  location: string;
  severity: "low" | "medium" | "high" | "critical";
}

export interface MetricData {
  label: string;
  value: string | number;
  change?: {
    value: string;
    type: "increase" | "decrease";
  };
  icon: string;
  color: string;
}

// src/types/drone.ts

export interface Drone {
  // Device information
  droneSn: string;
  status: boolean;
  device_name: string;
  firmware_version: string;
  nickname: string;
  login_time: string;
  workspace_id: string;
  user_id: string;
  domain: number;

  // Token information
  hasToken: boolean;
  appId: string | null;
  token: string | null;
  channel: string | null;
  uid: string | null;
  expire: string | null;
  timeRemaining: number | null;
  createdAt: number | null;
  lastAccessed: string | null;
}

export interface DroneDataResponse {
  success: boolean;
  dronesWithTokens: Record<string, Drone>;
  totalDrones: number;
  dronesWithActiveTokens: number;
  retrievedAt: string;
}
