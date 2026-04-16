// Device log types for the DJI Cloud API

export interface UploadedLog {
  logs_id: string;
  device_sn: string;
  create_time: number;  // Unix timestamp ms
  update_time: number;
  status: number;       // 0 = uploading, 1 = done, 2 = failed
  list: LogFileItem[];
}

export interface LogFileItem {
  module: number;       // subsystem identifier (flight controller, camera, etc.)
  start_time: number;   // Unix timestamp ms — earliest log entry
  end_time: number;     // Unix timestamp ms — latest log entry
  size: number;         // file size in bytes
  url: string;          // pre-signed download URL
}

export interface DeviceLogModule {
  module: number;       // subsystem identifier
  start_time: number;
  end_time: number;
}

export interface TriggerLogUploadRequest {
  logs_info: Array<{
    device_sn: string;
    list: Array<{ module: number }>;
  }>;
}
