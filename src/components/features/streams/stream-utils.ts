import type { DJIDevice } from '@/lib/types';

export const isDrone = (device: DJIDevice) => device.domain === '0';

export const toStream = (device: DJIDevice) => {
  const drone = isDrone(device);
  return {
    ...device,
    // Docks: live capacity is indexed by the DRONE's SN (childDeviceSn), not the dock's SN.
    // Using the dock's own SN would produce an empty capacity lookup and a broken video_id.
    id: drone ? device.deviceSn : (device.childDeviceSn || device.deviceSn),
    type: drone ? 'DRONE' : 'DOCK',
    feedType: drone ? 'DRONE' : 'DOCK',
    isOnline: device.status,
  };
};
