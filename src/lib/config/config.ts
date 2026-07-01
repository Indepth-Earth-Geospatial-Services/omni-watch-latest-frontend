// Single source of truth for all OmniWatch & DJI Cloud configuration.
// No other file should call process.env directly for these variables.

// Helper to convert HTTP URL to WS/WSS URL
const toWsUrl = (url: string) => {
  const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
  return url.replace(/^https?/, isSecure ? 'wss' : 'ws');
};

const OMNIWATCH_API_URL = process.env.NEXT_PUBLIC_OMNIWATCH_API_URL ?? 'http://34.35.12.123:8000';
const DJI_API_URL = process.env.NEXT_PUBLIC_DJI_API_URL ?? 'http://35.222.89.171:6789';

export const DJI_CONFIG = {
  // DJI Cloud API Base
  BASE_URL: DJI_API_URL,

  // OmniWatch API Base (REST)
  OMNIWATCH_API_URL,

  // WebSocket Endpoint
  // On HTTPS deployments: converts to wss:// (requires backend to support WSS or add WSS proxy)
  // On HTTP deployments: converts to ws://
  WS_URL: `${toWsUrl(DJI_API_URL)}/api/v1/ws`,

  // For legacy WebRTC references
  WEBRTC_BASE_URL: `${toWsUrl(OMNIWATCH_API_URL)}/api/v1/ws`,

  WORKSPACE_ID: process.env.NEXT_PUBLIC_WORKSPACE_ID ?? '',
  DEVICE_SN: process.env.NEXT_PUBLIC_DEVICE_SN ?? '',

  // API version prefixes — appended to BASE_URL inside the proxy route handler
  MANAGE: process.env.NEXT_PUBLIC_MANAGE_VERSION ?? '/manage/api/v1',
  MAP: process.env.NEXT_PUBLIC_MAP_VERSION ?? '/map/api/v1',
  MEDIA: process.env.NEXT_PUBLIC_MEDIA_VERSION ?? '/media/api/v1',
  STORAGE: process.env.NEXT_PUBLIC_STORAGE_VERSION ?? '/storage/api/v1',
  WAYLINE: process.env.NEXT_PUBLIC_WAYLINE_VERSION ?? '/wayline/api/v1',
  CONTROL: process.env.NEXT_PUBLIC_CONTROL_VERSION ?? '/control/api/v1',

  // TEMPORARY: Use /api/dji HTTP proxy on HTTPS deployments
  // When backend implements HTTPS, set NEXT_PUBLIC_USE_DJI_PROXY=false
  USE_DJI_PROXY: process.env.NEXT_PUBLIC_USE_DJI_PROXY !== 'false',

  // Feature flag: false = old drone-api.ts / useDrones.ts still runs unchanged.
  // Set NEXT_PUBLIC_USE_DJI_CLOUD=true in .env to activate new path.
  USE_DJI_CLOUD: process.env.NEXT_PUBLIC_USE_DJI_CLOUD === 'true',
} as const;

export type DJIConfig = typeof DJI_CONFIG;
