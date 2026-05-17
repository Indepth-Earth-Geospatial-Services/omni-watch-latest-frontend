// React Query hooks for DJI Map API — element groups, map elements, flight areas.
// Components import from here — never from map-api.ts directly.
//
// Query key convention: ['dji', 'map', workspaceId, ...]
// workspaceId is sourced from useAuth().user.workspace_id (fetched after login via /users/current).

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { DJI_CONFIG } from '@/lib/dji/config';
import {
  getElementGroups,
  addElement,
  updateElement,
  deleteElement,
  deleteGroupElements,
  getFlightAreas,
  addFlightArea,
  updateFlightArea,
  deleteFlightArea,
  syncFlightAreas,
  getDeviceFlightAreaStatus,
} from '@/services/dji-service';
import type {
  GetElementGroupsParams,
  AddElementRequest,
  AddElementResponse,
  UpdateElementRequest,
  FlightArea,
  AddFlightAreaRequest,
  SyncFlightAreaRequest,
} from '@/lib/types';

// ─── Query key factory ────────────────────────────────────────────────────────

const mapKeys = (workspaceId: string) => ({
  all:           ['dji', 'map', workspaceId] as const,
  elementGroups: ['dji', 'map', workspaceId, 'element-groups'] as const,
  flightAreas:   ['dji', 'map', workspaceId, 'flight-areas'] as const,
  deviceStatus:  ['dji', 'map', workspaceId, 'device-status'] as const,
});

// ─── Read hooks ───────────────────────────────────────────────────────────────

/**
 * Fetches all map element groups (collections of pins, lines, polygons).
 * Optional filters: is_distributed and group_id.
 * Refetches every 60 seconds — element groups change infrequently.
 *
 * @example
 * const { data: groups = [], isLoading } = useElementGroups();
 */
export function useElementGroups(params?: GetElementGroupsParams) {
  const { user } = useAuth();
  const workspaceId = user?.workspace_id ?? DJI_CONFIG.WORKSPACE_ID;
  const keys = mapKeys(workspaceId);

  return useQuery({
    queryKey: keys.elementGroups,
    queryFn:  () => getElementGroups(workspaceId, params),
    enabled:  !!workspaceId,
    refetchInterval:     60_000,
    staleTime:           30_000,
  });
}

/**
 * Fetches all flight areas (geofences) defined in the workspace.
 * Refetches every 60 seconds.
 *
 * @example
 * const { data: areas = [], isLoading } = useFlightAreas();
 */
export function useFlightAreas() {
  const { user } = useAuth();
  const workspaceId = user?.workspace_id ?? DJI_CONFIG.WORKSPACE_ID;
  const keys = mapKeys(workspaceId);

  return useQuery({
    queryKey: keys.flightAreas,
    queryFn:  () => getFlightAreas(workspaceId),
    enabled:  !!workspaceId,
    refetchInterval:     60_000,
    staleTime:           30_000,
  });
}

/**
 * Fetches the sync status of flight areas on each device.
 * Refetches every 30 seconds — status changes shortly after a sync is triggered.
 *
 * @example
 * const { data: statuses = [] } = useDeviceFlightAreaStatus();
 */
export function useDeviceFlightAreaStatus() {
  const { user } = useAuth();
  const workspaceId = user?.workspace_id ?? DJI_CONFIG.WORKSPACE_ID;
  const keys = mapKeys(workspaceId);

  return useQuery({
    queryKey: keys.deviceStatus,
    queryFn:  () => getDeviceFlightAreaStatus(workspaceId),
    enabled:  !!workspaceId,
    refetchInterval:     30_000,
    staleTime:           15_000,
  });
}

// ─── Element mutation hooks ───────────────────────────────────────────────────

/**
 * Adds a GeoJSON map element (point, line, or polygon) to a group.
 * On success: invalidates element groups so the new element appears immediately.
 *
 * @example
 * const { mutate: add } = useAddElement();
 * add({ groupId: 'group-uuid', payload: { id, name, resource } });
 */
export function useAddElement() {
  const { user } = useAuth();
  const workspaceId = user?.workspace_id ?? DJI_CONFIG.WORKSPACE_ID;
  const queryClient = useQueryClient();

  return useMutation<AddElementResponse, Error, { groupId: string; payload: AddElementRequest }>({
    mutationFn: ({ groupId, payload }) => addElement(workspaceId, groupId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mapKeys(workspaceId).elementGroups });
    },
  });
}

/**
 * Updates an existing map element's name, geometry, or properties.
 * On success: invalidates element groups.
 *
 * @example
 * const { mutate: update } = useUpdateElement();
 * update({ elementId: 'el-uuid', payload: { name: 'New name' } });
 */
export function useUpdateElement() {
  const { user } = useAuth();
  const workspaceId = user?.workspace_id ?? DJI_CONFIG.WORKSPACE_ID;
  const queryClient = useQueryClient();

  return useMutation<void, Error, { elementId: string; payload: UpdateElementRequest }>({
    mutationFn: ({ elementId, payload }) => updateElement(workspaceId, elementId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mapKeys(workspaceId).elementGroups });
    },
  });
}

/**
 * Deletes a single map element by ID.
 * On success: invalidates element groups.
 *
 * @example
 * const { mutate: remove } = useDeleteElement();
 * remove('element-uuid');
 */
export function useDeleteElement() {
  const { user } = useAuth();
  const workspaceId = user?.workspace_id ?? DJI_CONFIG.WORKSPACE_ID;
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (elementId) => deleteElement(workspaceId, elementId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mapKeys(workspaceId).elementGroups });
    },
  });
}

/**
 * Deletes all elements within a group at once.
 * On success: invalidates element groups.
 *
 * @example
 * const { mutate: clearGroup } = useDeleteGroupElements();
 * clearGroup('group-uuid');
 */
export function useDeleteGroupElements() {
  const { user } = useAuth();
  const workspaceId = user?.workspace_id ?? DJI_CONFIG.WORKSPACE_ID;
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (groupId) => deleteGroupElements(workspaceId, groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mapKeys(workspaceId).elementGroups });
    },
  });
}

// ─── Flight area mutation hooks ───────────────────────────────────────────────

/**
 * Creates a new flight area (geofence).
 * On success: invalidates the flight areas list.
 *
 * @example
 * const { mutate: create } = useAddFlightArea();
 * create({ name: 'Zone A', type: 'circle', content: { ... } });
 */
export function useAddFlightArea() {
  const { user } = useAuth();
  const workspaceId = user?.workspace_id ?? DJI_CONFIG.WORKSPACE_ID;
  const queryClient = useQueryClient();

  return useMutation<FlightArea, Error, AddFlightAreaRequest>({
    mutationFn: (payload) => addFlightArea(workspaceId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mapKeys(workspaceId).flightAreas });
    },
  });
}

/**
 * Modifies a flight area's name, status, or geometry.
 * On success: invalidates flight areas and device status (sync state may be stale).
 *
 * @example
 * const { mutate: update } = useUpdateFlightArea();
 * update({ areaId: 'area-uuid', payload: { status: 0 } });
 */
export function useUpdateFlightArea() {
  const { user } = useAuth();
  const workspaceId = user?.workspace_id ?? DJI_CONFIG.WORKSPACE_ID;
  const queryClient = useQueryClient();

  return useMutation<void, Error, { areaId: string; payload: Partial<Pick<FlightArea, 'name' | 'status' | 'content'>> }>({
    mutationFn: ({ areaId, payload }) => updateFlightArea(workspaceId, areaId, payload),
    onSuccess: () => {
      const keys = mapKeys(workspaceId);
      queryClient.invalidateQueries({ queryKey: keys.flightAreas });
      queryClient.invalidateQueries({ queryKey: keys.deviceStatus });
    },
  });
}

/**
 * Removes a flight area by ID.
 * On success: invalidates flight areas and device status.
 *
 * @example
 * const { mutate: remove } = useDeleteFlightArea();
 * remove('area-uuid');
 */
export function useDeleteFlightArea() {
  const { user } = useAuth();
  const workspaceId = user?.workspace_id ?? DJI_CONFIG.WORKSPACE_ID;
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (areaId) => deleteFlightArea(workspaceId, areaId),
    onSuccess: () => {
      const keys = mapKeys(workspaceId);
      queryClient.invalidateQueries({ queryKey: keys.flightAreas });
      queryClient.invalidateQueries({ queryKey: keys.deviceStatus });
    },
  });
}

/**
 * Pushes ALL current flight areas to the specified devices.
 * On success: invalidates device status so the sync result appears immediately.
 *
 * @example
 * const { mutate: sync } = useSyncFlightAreas();
 * sync({ device_sn: ['SN001', 'SN002'] });
 */
export function useSyncFlightAreas() {
  const { user } = useAuth();
  const workspaceId = user?.workspace_id ?? DJI_CONFIG.WORKSPACE_ID;
  const queryClient = useQueryClient();

  return useMutation<void, Error, SyncFlightAreaRequest>({
    mutationFn: (payload) => syncFlightAreas(workspaceId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mapKeys(workspaceId).deviceStatus });
    },
  });
}
