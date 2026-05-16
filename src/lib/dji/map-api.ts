// Map API functions for the DJI Cloud API.
// All requests flow through client.ts → proxy route handler → DJI server.
//
// Endpoint prefix: /map/api/v1
// workspaceId is passed as a parameter — sourced from useAuth().user.workspace_id at the hook layer.

import { djiRequest } from './client';
import { DJI_CONFIG } from './config';
import type {
  ElementGroup,
  GetElementGroupsParams,
  MapElement,
  AddElementRequest,
  UpdateElementRequest,
  FlightArea,
  AddFlightAreaRequest,
  SyncFlightAreaRequest,
  DeviceFlightAreaStatus,
} from '@/lib/types';

const { MAP } = DJI_CONFIG;

// ─── Element Groups ───────────────────────────────────────────────────────────

/**
 * Lists all map element groups in the workspace (pins, lines, polygons).
 * Optional filters: is_distributed (boolean) and group_id (fetch one specific group).
 *
 * GET /map/api/v1/workspaces/{workspace_id}/element-groups
 */
export function getElementGroups(
  workspaceId: string,
  params?: GetElementGroupsParams
): Promise<ElementGroup[]> {
  const query = params
    ? '?' + new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)])
      ).toString()
    : '';
  return djiRequest.get<ElementGroup[]>(
    `${MAP}/workspaces/${workspaceId}/element-groups${query}`
  );
}

// ─── Map Elements ─────────────────────────────────────────────────────────────

/**
 * Adds a new map element (point, line, or polygon) to a group.
 * The body must be a GeoJSON Feature with id, name, and resource fields.
 *
 * POST /map/api/v1/workspaces/{workspace_id}/element-groups/{element_group_id}/elements
 */
export function addElement(
  workspaceId: string,
  groupId: string,
  payload: AddElementRequest
): Promise<MapElement> {
  return djiRequest.post<MapElement>(
    `${MAP}/workspaces/${workspaceId}/element-groups/${groupId}/elements`,
    payload
  );
}

/**
 * Updates an existing map element's name, geometry, or properties.
 * The docs do not enumerate body fields — pass a partial MapElement shape.
 *
 * PUT /map/api/v1/workspaces/{workspace_id}/elements/{element_id}
 */
export function updateElement(
  workspaceId: string,
  elementId: string,
  payload: UpdateElementRequest
): Promise<void> {
  return djiRequest.put<void>(
    `${MAP}/workspaces/${workspaceId}/elements/${elementId}`,
    payload
  );
}

/**
 * Deletes a specific map element by its ID.
 *
 * DELETE /map/api/v1/workspaces/{workspace_id}/elements/{element_id}
 */
export function deleteElement(
  workspaceId: string,
  elementId: string
): Promise<void> {
  return djiRequest.delete<void>(
    `${MAP}/workspaces/${workspaceId}/elements/${elementId}`
  );
}

/**
 * Deletes all elements within a specific group at once.
 *
 * DELETE /map/api/v1/workspaces/{workspace_id}/element-groups/{element_group_id}/elements
 */
export function deleteGroupElements(
  workspaceId: string,
  groupId: string
): Promise<void> {
  return djiRequest.delete<void>(
    `${MAP}/workspaces/${workspaceId}/element-groups/${groupId}/elements`
  );
}

// ─── Flight Areas (Geofencing) ────────────────────────────────────────────────

/**
 * Lists all defined flight areas (geofences) in the workspace.
 *
 * GET /map/api/v1/workspaces/{workspace_id}/flight-areas
 */
export function getFlightAreas(workspaceId: string): Promise<FlightArea[]> {
  return djiRequest.get<FlightArea[]>(
    `${MAP}/workspaces/${workspaceId}/flight-areas`
  );
}

/**
 * Creates a new flight area (geofence).
 * type: "circle" | "polygon" — content shape must match the type.
 *
 * POST /map/api/v1/workspaces/{workspace_id}/flight-area
 */
export function addFlightArea(
  workspaceId: string,
  payload: AddFlightAreaRequest
): Promise<FlightArea> {
  return djiRequest.post<FlightArea>(
    `${MAP}/workspaces/${workspaceId}/flight-area`,
    payload
  );
}

/**
 * Modifies a flight area's name, status, or geometry.
 * The docs do not enumerate body fields — pass any subset of FlightArea fields.
 *
 * PUT /map/api/v1/workspaces/{workspace_id}/flight-area/{area_id}
 */
export function updateFlightArea(
  workspaceId: string,
  areaId: string,
  payload: Partial<Pick<FlightArea, 'name' | 'status' | 'content'>>
): Promise<void> {
  return djiRequest.put<void>(
    `${MAP}/workspaces/${workspaceId}/flight-area/${areaId}`,
    payload
  );
}

/**
 * Removes a flight area by its ID.
 *
 * DELETE /map/api/v1/workspaces/{workspace_id}/flight-area/{area_id}
 */
export function deleteFlightArea(
  workspaceId: string,
  areaId: string
): Promise<void> {
  return djiRequest.delete<void>(
    `${MAP}/workspaces/${workspaceId}/flight-area/${areaId}`
  );
}

/**
 * Pushes ALL current flight areas to the specified devices.
 * Note: syncs all areas — there is no per-area selection in the body.
 *
 * POST /map/api/v1/workspaces/{workspace_id}/flight-area/sync
 */
export function syncFlightAreas(
  workspaceId: string,
  payload: SyncFlightAreaRequest
): Promise<void> {
  return djiRequest.post<void>(
    `${MAP}/workspaces/${workspaceId}/flight-area/sync`,
    payload
  );
}

/**
 * Checks the sync status of flight areas on each device.
 * sync_status: 0 = not synced, 1 = synced, 2 = sync failed
 *
 * GET /map/api/v1/workspaces/{workspace_id}/device-status
 */
export function getDeviceFlightAreaStatus(
  workspaceId: string
): Promise<DeviceFlightAreaStatus[]> {
  return djiRequest.get<DeviceFlightAreaStatus[]>(
    `${MAP}/workspaces/${workspaceId}/device-status`
  );
}
