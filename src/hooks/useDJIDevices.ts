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
  updateDJIDevice,
  deviceOTA,
} from '@/lib/dji/device-api';
import type {
  BindDeviceRequest,
  DJIDevice,
  DJIDeviceProperty,
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

// ─── Transformer ──────────────────────────────────────────────────────────────

// Transformers for DJI devices will be implemented here if needed.

// ─── Read hooks ───────────────────────────────────────────────────────────────

/**
 * Fetches all workspace devices.
 * Refetches every 30 seconds so online/offline status stays current.
 *
 * @example
 * const { data: devices = [], isLoading } = useDJIDevices();
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
    mutationFn: (payload: BindDeviceRequest) => bindDevice(payload.deviceSn, payload),
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

  return useMutation({
    mutationFn: ({ deviceSn, payload }: { deviceSn: string; payload: Partial<DJIDevice> }) =>
      updateDJIDevice(workspaceId, deviceSn, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: deviceKeys(workspaceId).detail(variables.deviceSn) });
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

/**
 * Initiates an OTA firmware update.
 */
export function useDeviceOTA() {
  const { user } = useAuth();
  const workspaceId = user?.workspace_id ?? DJI_CONFIG.WORKSPACE_ID;

  return useMutation({
    mutationFn: (payload: any[]) => deviceOTA(workspaceId, payload),
  });
}

