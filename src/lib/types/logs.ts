// Device log types for the DJI Cloud API

// ─── POST /devices/{device_sn}/logs request ──────────────────────────────────

export interface TriggerLogFileItem {
  bootIndex: number;
  endTime: number;    // Unix timestamp ms
  startTime: number;  // Unix timestamp ms
  size: number;       // bytes
}

export interface TriggerLogFile {
  deviceSn: string;
  list: TriggerLogFileItem[];
  module: string;     // domain/module identifier, e.g. "0"
  objectKey: string;
}

export interface TriggerLogUploadRequest {
  logsInformation: string;
  happenTime: number;         // Unix timestamp ms
  files: TriggerLogFile[];
}

// ─── DELETE /devices/{device_sn}/logs request ────────────────────────────────

export interface CancelLogUploadRequest {
  moduleList: string[];       // module/domain identifiers to cancel, e.g. ["0"]
  status: 'cancel';
}

// ─── Query params ─────────────────────────────────────────────────────────────

export interface DeviceLogsQueryParams {
  domain_list: string[];      // required — e.g. ["0"] for flight controller
}

export interface UploadedLogsQueryParams {
  page?: number;
  status?: number;            // 0 = uploading, 1 = done, 2 = failed
  page_size?: number;
  begin_time?: number;        // Unix timestamp ms
  end_time?: number;
  logs_information?: string;
}

// ─── Response shapes (Swagger shows data: {} — camelCase inferred from pattern) ─

export interface LogFileItem {
  module: number;
  startTime: number;
  endTime: number;
  size: number;
  url: string;
}

export interface UploadedLog {
  logsId: string;
  deviceSn: string;
  createTime: number;
  updateTime: number;
  status: number;     // 0 = uploading, 1 = done, 2 = failed
  list: LogFileItem[];
}

export interface DeviceLogModule {
  module: number;
  startTime: number;
  endTime: number;
}
