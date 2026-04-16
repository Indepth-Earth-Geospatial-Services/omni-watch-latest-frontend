// Device management API functions for the DJI Cloud API.
// All requests flow through client.ts → proxy route handler → DJI server.
//
// Endpoint prefix: /manage/api/v1
// workspaceId is passed as a parameter — sourced from useAuth().user.workspace_id at the hook layer.

import { djiRequest } from './client';
import { DJI_CONFIG } from './config';
import type {
  DJIDevice,
  DJIDeviceTopology,
  DJIBoundDevicesResponse,
  DJIDeviceProperty,
  BindDeviceRequest,
} from '@/lib/types';

const { MANAGE } = DJI_CONFIG;

// ─── Read operations ──────────────────────────────────────────────────────────

/**
 * Lists all devices registered in the workspace.
 * Used by the Dashboard page to show device counts and online/offline status.
 *
 * GET /manage/api/v1/devices/{workspace_id}/devices
 */
export function getDJIDevices(workspaceId: string): Promise<DJIDevice[]> {
  return djiRequest.get<DJIDevice[]>(`${MANAGE}/devices/${workspaceId}/devices`);
}

/**
 * Fetches a single device by its serial number.
 * Used when a component needs live detail for one device (e.g. a selected card).
 *
 * GET /manage/api/v1/devices/{workspace_id}/devices/{device_sn}
 */
export function getDJIDevice(workspaceId: string, deviceSn: string): Promise<DJIDevice> {
  return djiRequest.get<DJIDevice>(`${MANAGE}/devices/${workspaceId}/devices/${deviceSn}`);
}

/**
 * Lists only devices that are currently bound to the workspace.
 * A device must be bound before it can receive commands or stream video.
 * Optional pagination and domain filter match the query params the DJI server accepts.
 *
 * GET /manage/api/v1/devices/{workspace_id}/devices/bound
 */
export function getBoundDevices(
  workspaceId: string,
  params?: { page?: number; page_size?: number; domain?: number }
): Promise<DJIBoundDevicesResponse> {
  const query = params
    ? '?' + new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)])
      ).toString()
    : '';
  return djiRequest.get<DJIBoundDevicesResponse>(
    `${MANAGE}/devices/${workspaceId}/devices/bound${query}`
  );
}

/**
 * Returns the full device topology tree — docks, drones, remote controllers
 * nested under their parent relationships.
 * Used by the geospatial map and dashboard topology view.
 *
 * GET /manage/api/v1/workspaces/{workspace_id}/devices/topologies
 */
export function getDeviceTopologies(workspaceId: string): Promise<DJIDeviceTopology[]> {
  return djiRequest.get<DJIDeviceTopology[]>(`${MANAGE}/workspaces/${workspaceId}/devices/topologies`);
}

// ─── Write operations ─────────────────────────────────────────────────────────

/**
 * Binds a device (drone or dock) to the workspace so it can be managed.
 * Called from the Register Device modal when the user submits the SN + token.
 *
 * POST /manage/api/v1/devices/binding
 */
export function bindDevice(payload: BindDeviceRequest): Promise<void> {
  return djiRequest.post<void>(`${MANAGE}/devices/binding`, payload);
}

/**
 * Removes a device from the workspace. The device will no longer appear
 * in listings or accept commands until re-bound.
 *
 * DELETE /manage/api/v1/devices/{device_sn}/unbinding
 */
export function unbindDevice(deviceSn: string): Promise<void> {
  return djiRequest.delete<void>(`${MANAGE}/devices/${deviceSn}/unbinding`);
}

/**
 * Updates a configurable property on a device (e.g. RTH altitude, obstacle avoidance).
 * The `property` object shape varies by device model — see DJI Cloud API docs for full list.
 *
 * PUT /manage/api/v1/devices/{workspace_id}/devices/{device_sn}/property
 */
export function setDeviceProperty(
  workspaceId: string,
  deviceSn: string,
  property: DJIDeviceProperty
): Promise<void> {
  return djiRequest.put<void>(
    `${MANAGE}/devices/${workspaceId}/devices/${deviceSn}/property`,
    property
  );
}
