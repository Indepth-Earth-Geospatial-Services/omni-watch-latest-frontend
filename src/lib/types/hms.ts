// Health Management System (HMS) types — device warnings and critical alerts

export interface HMSMessage {
  hmsId: string;
  tid: string;
  bid: string;
  sn: string;          // device serial number
  level: number;       // 0 = info, 1 = warning, 2 = critical
  module: number;
  key: string;
  messageZh: string;
  messageEn: string;
  createTime: string;  // ISO timestamp
  updateTime: string;  // ISO timestamp
}

export interface HMSListResponse {
  list: HMSMessage[];
  pagination: {
    total: number;
    page: number;
    page_size: number;
  };
}

export interface HMSQueryParams {
  language?: string;
  message?: string;
  page?: number;
  level?: number;
  device_sn?: string[];
  begin_time?: number;
  end_time?: number;
  page_size?: number;
  update_time?: number;
}
