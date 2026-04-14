// Health Management System (HMS) types — device warnings and critical alerts

export interface HMSMessage {
  hms_id: string;
  key: string;             // machine-readable alert code, e.g. "0x16100082"
  level: number;           // 0 = info, 1 = warning, 2 = critical
  module: number;          // subsystem that raised the alert (flight controller, camera, etc.)
  create_time: number;     // Unix timestamp ms
  update_time: number;
  message_zh: string;      // human-readable description in Chinese
  message_en: string;      // human-readable description in English
  device_sn: string;
  is_read: boolean;
  args?: Record<string, string>; // optional placeholders interpolated into the message
}

export interface HMSListResponse {
  list: HMSMessage[];
  pagination: {
    total: number;
    page: number;
    page_size: number;
  };
}
