// Livestream types — stream capacity, start/stop/switch/update

export interface StreamCapacity {
  device_sn: string;
  camera_list: CameraCapacity[];
}

export interface CameraCapacity {
  camera_index: string;           // e.g. "39-0-7" (payload_index format)
  available_video_number: number; // how many concurrent streams this camera supports
  coexist_video_number_max: number;
  video_list: VideoCapacity[];
}

export interface VideoCapacity {
  video_index: string;
  video_type: string;             // "normal" | "IR" | "wide"
  switch_result: boolean;         // whether this lens can be switched to
  stream_quality_available: boolean;
}

export interface StartStreamRequest {
  video_id: string;               // combined identifier: "{device_sn}/{camera_index}/{video_index}"
  url_type: number;               // 0 = RTMP, 2 = WebRTC
  url: string;                    // destination stream URL
  video_quality: number;          // 0 = auto, 1 = smooth, 2 = SD, 3 = HD, 4 = ultra-HD
}

export interface StopStreamRequest {
  video_id: string;
}

export interface UpdateStreamRequest {
  video_id: string;
  video_quality: number;
}

export interface SwitchStreamRequest {
  video_id: string;
  video_type: string; // "normal" | "wide" | "IR" — matches VideoCapacity.video_type
}

export interface StreamResponse {
  result: number; // 0 = success
}
