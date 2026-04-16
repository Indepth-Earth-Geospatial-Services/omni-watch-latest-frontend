// Single source of truth for all DJI Cloud environment variables.
// No other file should call process.env directly for DJI config.

export const DJI_CONFIG = {
  // Full base URL assembled from env vars — e.g. "http://192.168.1.10:6789"
  BASE_URL: `http://${process.env.NEXT_PUBLIC_API_IP ?? 'localhost'}:${process.env.NEXT_PUBLIC_API_PORT ?? '6789'}`,

  // WebSocket base URL for the WebRTC signalling server — e.g. "ws://192.168.1.10:6080"
  // Each device stream is at WEBRTC_BASE_URL/{device_sn}
  WEBRTC_BASE_URL: `ws://${process.env.NEXT_PUBLIC_API_IP ?? 'localhost'}:${process.env.NEXT_PUBLIC_WEBRTC_PORT ?? '6080'}`,

  WORKSPACE_ID: process.env.NEXT_PUBLIC_WORKSPACE_ID ?? '',
  DEVICE_SN: process.env.NEXT_PUBLIC_DEVICE_SN ?? '',

  // API version prefixes — appended to BASE_URL inside the proxy route handler
  MANAGE: process.env.NEXT_PUBLIC_MANAGE_VERSION ?? '/manage/api/v1',
  MAP: process.env.NEXT_PUBLIC_MAP_VERSION ?? '/map/api/v1',
  MEDIA: process.env.NEXT_PUBLIC_MEDIA_VERSION ?? '/media/api/v1',
  STORAGE: process.env.NEXT_PUBLIC_STORAGE_VERSION ?? '/storage/api/v1',
  WAYLINE: process.env.NEXT_PUBLIC_WAYLINE_VERSION ?? '/wayline/api/v1',
  CONTROL: process.env.NEXT_PUBLIC_CONTROL_VERSION ?? '/control/api/v1',

  // Feature flag: false = old drone-api.ts / useDrones.ts still runs unchanged.
  // Set NEXT_PUBLIC_USE_DJI_CLOUD=true in .env.local to activate new DJI path.
  USE_DJI_CLOUD: process.env.NEXT_PUBLIC_USE_DJI_CLOUD === 'true',
} as const;

export type DJIConfig = typeof DJI_CONFIG;
