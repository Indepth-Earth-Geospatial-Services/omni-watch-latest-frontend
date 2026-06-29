import type { DJIDevice } from '@/lib/types';

export const isDrone = (device: DJIDevice) => device.domain === '0';

export const toStream = (device: DJIDevice) => ({
  ...device,
  id: device.deviceSn,
  type: isDrone(device) ? 'DRONE' : 'DOCK',
  feedType: isDrone(device) ? 'DRONE' : 'DOCK',
  isOnline: device.status,
});

// DJI's LensChangeVideoTypeEnum removed 'normal' in SDK v2.x but the capacity
// API may still return it for basic single-lens cameras. Map to 'zoom' — the
// standard camera accepted by the start/switch stream endpoints.
export function normalizeLensType(type: string | undefined): string {
  if (!type || type === 'normal') return 'zoom';
  return type;
}
