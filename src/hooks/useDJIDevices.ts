// React Query hooks for DJI device management.
// Components import from here — never from device-api.ts directly.
//
// Query key convention: ['dji', 'devices', workspaceId, ...]
// workspaceId is sourced from useAuth().user.workspace_id (fetched after login via /users/current).
// This never collides with the old ['drones'] keys so both can coexist
// during migration while NEXT_PUBLIC_USE_DJI_CLOUD=false.

import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { DJI_CONFIG } from '@/lib/config/config';
import {
  bindDevice,
  getBoundDevices,
  getDJIDevice,
  getDeviceTopologies,
  setDeviceProperty,
  unbindDevice,
  updateDJIDevice,
  deviceOTA,
} from '@/services/djiservice-layer/dji-service';
import type {
  BindDeviceRequest,
  DJIDevice,
  DJIDeviceProperty,
  DeviceOTARequest,
} from '@/lib/types';

// ─── Query key factory ────────────────────────────────────────────────────────

// Takes workspaceId so keys are scoped per workspace — safe for multi-tenant use
const deviceKeys = (workspaceId: string) => ({
  all: ['dji', 'devices', workspaceId] as const,
  list: ['dji', 'devices', workspaceId, 'list'] as const,
  bound: ['dji', 'devices', workspaceId, 'bound'] as const,
  topologies: ['dji', 'devices', workspaceId, 'topologies'] as const,
  detail: (sn: string) => ['dji', 'devices', workspaceId, 'detail', sn] as const,
});

// ─── Transformer ──────────────────────────────────────────────────────────────

// The DJI API returns snake_case fields and domain/type as integers.
// This raw shape matches the actual JSON; DJIDevice uses camelCase with domain as string.
interface RawDJIDevice {
  device_sn: string;
  device_name: string;
  workspace_id: string;
  control_source?: string;
  device_desc?: string;
  child_device_sn?: string;
  domain: number;
  type: number;
  sub_type: number;
  status: boolean;
  bound_status?: boolean;
  login_time?: string;
  bound_time?: string;
  nickname: string;
  firmware_version?: string;
  workspace_name?: string;
  firmware_status?: number;
  thing_version?: string;
  icon_url?: { normal_icon_url: string; selected_icon_url: string };
}

function transformDevice(raw: RawDJIDevice): DJIDevice {
  return {
    deviceSn: raw.device_sn,
    deviceName: raw.device_name,
    workspaceId: raw.workspace_id,
    controlSource: raw.control_source,
    deviceDesc: raw.device_desc,
    childDeviceSn: raw.child_device_sn,
    domain: String(raw.domain),   // "0"=drone "1"=dock "2"=RC
    type: String(raw.type),
    subType: String(raw.sub_type),
    status: raw.status,
    boundStatus: raw.bound_status,
    loginTime: raw.login_time ?? '',
    boundTime: raw.bound_time ?? '',
    nickname: raw.nickname,
    firmwareVersion: raw.firmware_version ?? '',
    workspaceName: raw.workspace_name,
    firmwareStatus: raw.firmware_status != null ? String(raw.firmware_status) : undefined,
    thingVersion: raw.thing_version,
  };
}

// ─── Read hooks ───────────────────────────────────────────────────────────────

/**
 * Fetches all workspace devices.
 * Refetches every 30 seconds so online/offline status stays current.
 *
 * @example
 * const { data: devices = [], isLoading } = useDJIDevices();
 */
export function useDJIDevices(options?: { refetchInterval?: number }) {
  const { user } = useAuth();
  const workspaceId = user?.workspace_id ?? DJI_CONFIG.WORKSPACE_ID;
  const keys = deviceKeys(workspaceId);

  // Domain values per DJI Cloud API: 0 = drone, 1 = dock, 2 = RC, 3 = dock (some deployments)
  const DEVICE_DOMAINS = [0, 1, 2, 3];

  const results = useQueries({
    queries: DEVICE_DOMAINS.map((domain) => ({
      queryKey: [...keys.bound, domain],
      queryFn: () => getBoundDevices(workspaceId, { domain, page_size: 100 }),
      enabled: !!workspaceId,
      retry: false,
      refetchInterval: options?.refetchInterval ?? 30_000,
      refetchOnWindowFocus: true,
      staleTime: 0,
    })),
  });

  const seen = new Set<string>();
  const data = results
    .flatMap((r) => (r.data?.list ?? []) as unknown as RawDJIDevice[])
    .map(transformDevice)
    .filter((d) => {
      if (!d.deviceSn || seen.has(d.deviceSn)) return false;
      seen.add(d.deviceSn);
      return true;
    });

  // Surface an error only if ALL domain queries failed (no data at all).
  // A single domain failing (e.g. no docks) is a normal workspace state.
  const allFailed = results.every((r) => r.isError);
  const firstError = results.find((r) => r.error)?.error ?? null;

  return {
    data,
    isLoading: results.some((r) => r.isLoading),
    error: allFailed ? firstError : null,
  };
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
    queryFn: () => getDJIDevice(workspaceId, deviceSn!),
    enabled: !!workspaceId && !!deviceSn,
    retry: false,
    staleTime: 10_000,
  });
}

/**
 * Fetches only bound drones (domain 0) for the workspace.
 * Used in the Live Feed page to show which devices can stream.
 */
export function useBoundDevices() {
  const { user } = useAuth();
  const workspaceId = user?.workspace_id ?? DJI_CONFIG.WORKSPACE_ID;
  const keys = deviceKeys(workspaceId);

  return useQuery({
    queryKey: keys.bound,
    queryFn: () => getBoundDevices(workspaceId, { domain: 1 }),
    enabled: !!workspaceId,
    retry: false,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    staleTime: 10_000,
    select: (response) =>
      ((response.list ?? []) as unknown as RawDJIDevice[]).map(transformDevice),
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
    queryFn: () => getDeviceTopologies(workspaceId),
    enabled: !!workspaceId,
    retry: false,
    refetchInterval: 60_000,
    staleTime: 30_000,
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

  return useMutation<void, Error, BindDeviceRequest>({
    mutationFn: (payload) => bindDevice(payload.deviceSn, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deviceKeys(workspaceId).all });
    },
  });
}

/**
 * Updates basic device information (e.g. nickname).
 */
export function useUpdateDJIDevice() {
  const { user } = useAuth();
  const workspaceId = user?.workspace_id ?? DJI_CONFIG.WORKSPACE_ID;
  const queryClient = useQueryClient();

  return useMutation<void, Error, { deviceSn: string; payload: Partial<DJIDevice> }>({
    mutationFn: ({ deviceSn, payload }) => updateDJIDevice(workspaceId, deviceSn, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: deviceKeys(workspaceId).detail(variables.deviceSn),
      });
      queryClient.invalidateQueries({ queryKey: deviceKeys(workspaceId).list });
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

  return useMutation<void, Error, string>({
    mutationFn: (deviceSn) => unbindDevice(deviceSn),
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

  return useMutation<void, Error, { deviceSn: string; property: DJIDeviceProperty }>({
    mutationFn: ({ deviceSn, property }) => setDeviceProperty(workspaceId, deviceSn, property),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: deviceKeys(workspaceId).detail(variables.deviceSn),
      });
    },
  });
}

/**
 * Initiates an OTA firmware update.
 */
export function useDeviceOTA() {
  const { user } = useAuth();
  const workspaceId = user?.workspace_id ?? DJI_CONFIG.WORKSPACE_ID;

  return useMutation<void, Error, DeviceOTARequest[]>({
    mutationFn: (payload) => deviceOTA(workspaceId, payload),
  });
}
