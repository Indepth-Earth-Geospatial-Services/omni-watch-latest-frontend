import type { DJIDevice } from '@/lib/types';

export const isDrone = (device: DJIDevice) => device.domain === '0';

export const toStream = (device: DJIDevice) => ({
  ...device,
  id: device.deviceSn,
  type: isDrone(device) ? 'DRONE' : 'DOCK',
  feedType: isDrone(device) ? 'DRONE' : 'DOCK',
  isOnline: device.status,
});
