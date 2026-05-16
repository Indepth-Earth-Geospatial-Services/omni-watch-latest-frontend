import { DJIDevice } from "./device";
import { DroneAPIResponse } from "@/services/api/drone-api";

// Unified stream structure for UI consistency across Dashboard and Live Feed
export interface UnifiedStream {
  id: string;
  name: string;
  type: string;
  isOnline: boolean;
  raw: DroneAPIResponse | DJIDevice;
  metadata?: {
    alias?: string;
  };
}

// Livestream types — stream capacity, start/stop/switch/update

export interface LiveCapacity {
  sn: string;
  name: string;
  camerasList: CameraCapacity[];
}

export interface CameraCapacity {
  id: string;
  deviceSn: string;
  name: string;
  index: string;
  type: string;
  videosList: VideoCapacity[];
}

export interface VideoCapacity {
  id: string;
  index: string;
  type: string;
  switchVideoTypes: string[];
}

export interface LiveStreamRequest {
  videoType: string;
  url_type: string;
  video_id: string;
  video_quality: string;
}

export interface StreamResponse {
  result: number; // 0 = success
}
