// React Query hooks for DJI device management.
// Components import from here — never from device-api.ts directly.
//
// Query key convention: ['dji', 'devices', workspaceId, ...]
// workspaceId is sourced from useAuth().user.workspace_id (fetched after login via /users/current).
// This never collides with the old ['drones'] keys so both can coexist
// during migration while NEXT_PUBLIC_USE_DJI_CLOUD=false.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { DJI_CONFIG } from '@/lib/dji/config';
import {
  bindDevice,
  getBoundDevices,
  getDJIDevice,
  getDJIDevices,
  getDeviceTopologies,
  setDeviceProperty,
  unbindDevice,
} from '@/lib/dji/device-api';
import {
  getLiveCapacity,
  startStream,
  stopStream,
  updateStreamQuality,
  switchStreamCamera,
} from '@/lib/dji/livestream-api';
import type { WebRTCStream } from '@/config/webrtc-streams';
import type {
  BindDeviceRequest,
  DJIDevice,
  DJIDeviceProperty,
  StartStreamRequest,
  StopStreamRequest,
  UpdateStreamRequest,
  SwitchStreamRequest,
} from '@/lib/types';

// ─── Query key factory ────────────────────────────────────────────────────────

// Takes workspaceId so keys are scoped per workspace — safe for multi-tenant use
const deviceKeys = (workspaceId: string) => ({
  all:        ['dji', 'devices', workspaceId] as const,
  list:       ['dji', 'devices', workspaceId, 'list'] as const,
  bound:      ['dji', 'devices', workspaceId, 'bound'] as const,
  topologies: ['dji', 'devices', workspaceId, 'topologies'] as const,
  detail:     (sn: string) => ['dji', 'devices', workspaceId, 'detail', sn] as const,
});

const streamKeys = {
  capacity: ['dji', 'live', 'capacity'] as const,
};

// ─── Transformer ──────────────────────────────────────────────────────────────

// Maps a DJIDevice from the server into the WebRTCStream shape that all existing
// stream cards and dashboard components already understand.
function toWebRTCStream(device: DJIDevice): WebRTCStream {
  const streamUrl = device.status
    ? `${DJI_CONFIG.WEBRTC_BASE_URL}/${device.device_sn}`
    : '';

  return {
    id:        device.device_sn,
    name:      device.device_name,
    streamUrl,
    isOnline:  device.status,
    feedType:  'DRONE',
    startai:   false,
    metadata: {
      alias:       device.nickname || device.device_name,
      description: `${device.device_type} · FW ${device.firmware_version}`,
      webRTCUrl:   streamUrl,
    },
  };
}

// ─── Read hooks ───────────────────────────────────────────────────────────────

/**
 * Fetches all workspace devices and maps them to the WebRTCStream shape.
 * Refetches every 30 seconds so online/offline status stays current.
 *
 * @example
 * const { data: streams = [], isLoading } = useDJIDevices();
 */
export function useDJIDevices() {
  const { user } = useAuth();
  const workspaceId = user?.workspace_id ?? DJI_CONFIG.WORKSPACE_ID;
  const keys = deviceKeys(workspaceId);

  return useQuery({
    queryKey: keys.list,
    queryFn:  () => getDJIDevices(workspaceId),
    enabled:  !!workspaceId,
    refetchInterval:     30_000,
    refetchOnWindowFocus: true,
    staleTime:           10_000,
    select: (devices) => devices.map(toWebRTCStream),
  });
}

/**
 * Fetches a single device by serial number.
 * Only runs when a deviceSn is provided (e.g. a selected device card).
 */
export function useDJIDevice(deviceSn: string | undefined) {
  const { user } = useAuth();
  const workspaceId = user?.workspace_id ?? DJI_CONFIG.WORKSPACE_ID;
  const keys = deviceKeys(workspaceId);

  return useQuery({
    queryKey: keys.detail(deviceSn ?? ''),
    queryFn:  () => getDJIDevice(workspaceId, deviceSn!),
    enabled:  !!workspaceId && !!deviceSn,
    staleTime: 10_000,
  });
}

/**
 * Fetches only devices that are bound to the workspace.
 * Used in the Live Feed page to show which devices can stream.
 */
export function useBoundDevices() {
  const { user } = useAuth();
  const workspaceId = user?.workspace_id ?? DJI_CONFIG.WORKSPACE_ID;
  const keys = deviceKeys(workspaceId);

  return useQuery({
    queryKey: keys.bound,
    queryFn:  () => getBoundDevices(workspaceId),
    enabled:  !!workspaceId,
    refetchInterval:     30_000,
    refetchOnWindowFocus: true,
    staleTime:           10_000,
    select: (response) => response.list,
  });
}

/**
 * Fetches the full device topology tree (dock → drone → RC).
 * Used by the geospatial map to render the device hierarchy panel.
 */
export function useDeviceTopologies() {
  const { user } = useAuth();
  const workspaceId = user?.workspace_id ?? DJI_CONFIG.WORKSPACE_ID;
  const keys = deviceKeys(workspaceId);

  return useQuery({
    queryKey: keys.topologies,
    queryFn:  () => getDeviceTopologies(workspaceId),
    enabled:  !!workspaceId,
    refetchInterval:     60_000,
    staleTime:           30_000,
  });
}

// ─── Mutation hooks ───────────────────────────────────────────────────────────

/**
 * Binds a new device to the workspace.
 * On success: invalidates the device list so the new device appears immediately.
 *
 * @example
 * const { mutate: bind, isPending } = useBindDevice();
 * bind({ user_id, workspace_id, device_sn });
 */
export function useBindDevice() {
  const { user } = useAuth();
  const workspaceId = user?.workspace_id ?? DJI_CONFIG.WORKSPACE_ID;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BindDeviceRequest) => bindDevice(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deviceKeys(workspaceId).all });
    },
  });
}

/**
 * Unbinds (removes) a device from the workspace.
 * On success: invalidates the device list so the removed device disappears immediately.
 *
 * @example
 * const { mutate: unbind } = useUnbindDevice();
 * unbind('DEVICE_SERIAL_NUMBER');
 */
export function useUnbindDevice() {
  const { user } = useAuth();
  const workspaceId = user?.workspace_id ?? DJI_CONFIG.WORKSPACE_ID;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (deviceSn: string) => unbindDevice(deviceSn),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deviceKeys(workspaceId).all });
    },
  });
}

/**
 * Updates a configurable property on a device (e.g. RTH altitude).
 * On success: invalidates the specific device's detail query.
 *
 * @example
 * const { mutate: setProp } = useSetDeviceProperty();
 * setProp({ deviceSn: 'SN123', property: { name: 'rth_altitude', value: 100 } });
 */
export function useSetDeviceProperty() {
  const { user } = useAuth();
  const workspaceId = user?.workspace_id ?? DJI_CONFIG.WORKSPACE_ID;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ deviceSn, property }: { deviceSn: string; property: DJIDeviceProperty }) =>
      setDeviceProperty(workspaceId, deviceSn, property),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: deviceKeys(workspaceId).detail(variables.deviceSn) });
    },
  });
}

// ─── Livestream hooks ─────────────────────────────────────────────────────────

/**
 * Fetches which devices can stream and what camera/lens options they expose.
 * Returns a Map keyed by device_sn for O(1) lookups in stream cards.
 * Only runs when USE_DJI_CLOUD=true.
 */
export function useLiveCapacity() {
  return useQuery({
    queryKey: streamKeys.capacity,
    queryFn:  getLiveCapacity,
    enabled:  DJI_CONFIG.USE_DJI_CLOUD,
    refetchInterval:     30_000,
    staleTime:           10_000,
    select: (capacities) => new Map(capacities.map((c) => [c.device_sn, c])),
  });
}

/**
 * Tells a DJI drone to start pushing video to a WebRTC signalling server.
 * Call this before connecting useWebRTCStream — the drone won't push until asked.
 *
 * @example
 * const { mutate: start } = useStartStream();
 * start({ video_id, url_type: 2, url: streamUrl, video_quality: 0 });
 */
export function useStartStream() {
  return useMutation({
    mutationFn: (payload: StartStreamRequest) => startStream(payload),
  });
}

/**
 * Stops an active DJI video stream.
 * Always call on component unmount to avoid the drone streaming to a dead URL.
 */
export function useStopStream() {
  return useMutation({
    mutationFn: (payload: StopStreamRequest) => stopStream(payload),
  });
}

/**
 * Changes the video quality of an already-running stream without restarting it.
 * video_quality: 0 = auto, 1 = smooth, 2 = SD, 3 = HD, 4 = ultra-HD
 */
export function useUpdateStreamQuality() {
  return useMutation({
    mutationFn: (payload: UpdateStreamRequest) => updateStreamQuality(payload),
  });
}

/**
 * Switches the active camera lens (normal / wide / IR) on a running stream.
 * The stream must already be started — call useStartStream() first.
 * video_type: "normal" | "wide" | "IR"
 */
export function useSwitchStreamCamera() {
  return useMutation({
    mutationFn: (payload: SwitchStreamRequest) => switchStreamCamera(payload),
  });
}
