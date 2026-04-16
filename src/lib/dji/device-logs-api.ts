// Device log API functions for the DJI Cloud API.
// All requests flow through client.ts → proxy route handler → DJI server.
//
// Endpoint prefix: /manage/api/v1
// workspaceId is passed as a parameter — sourced from useAuth().user.workspace_id at the hook layer.

import { djiRequest } from './client';
import { DJI_CONFIG } from './config';
import type {
  UploadedLog,
  DeviceLogModule,
  TriggerLogUploadRequest,
} from '@/lib/types';

const { MANAGE } = DJI_CONFIG;

/**
 * Lists all log files that have already been uploaded from a device.
 *
 * GET /manage/api/v1/workspaces/{workspace_id}/devices/{device_sn}/logs-uploaded
 */
export function getUploadedLogs(
  workspaceId: string,
  deviceSn: string
): Promise<UploadedLog[]> {
  return djiRequest.get<UploadedLog[]>(
    `${MANAGE}/workspaces/${workspaceId}/devices/${deviceSn}/logs-uploaded`
  );
}

/**
 * Lists the available log modules on a device (what can be uploaded).
 *
 * GET /manage/api/v1/workspaces/{workspace_id}/devices/{device_sn}/logs
 */
export function getDeviceLogs(
  workspaceId: string,
  deviceSn: string
): Promise<DeviceLogModule[]> {
  return djiRequest.get<DeviceLogModule[]>(
    `${MANAGE}/workspaces/${workspaceId}/devices/${deviceSn}/logs`
  );
}

/**
 * Tells the device to start uploading the specified log modules.
 *
 * POST /manage/api/v1/workspaces/{workspace_id}/devices/{device_sn}/logs
 */
export function triggerLogUpload(
  workspaceId: string,
  deviceSn: string,
  payload: TriggerLogUploadRequest
): Promise<void> {
  return djiRequest.post<void>(
    `${MANAGE}/workspaces/${workspaceId}/devices/${deviceSn}/logs`,
    payload
  );
}

/**
 * Cancels an in-progress log upload from a device.
 *
 * DELETE /manage/api/v1/workspaces/{workspace_id}/devices/{device_sn}/logs
 */
export function cancelLogUpload(
  workspaceId: string,
  deviceSn: string
): Promise<void> {
  return djiRequest.delete<void>(
    `${MANAGE}/workspaces/${workspaceId}/devices/${deviceSn}/logs`
  );
}

/**
 * Deletes a specific uploaded log record by its ID.
 *
 * DELETE /manage/api/v1/workspaces/{workspace_id}/devices/{device_sn}/logs/{logs_id}
 */
export function deleteLogFile(
  workspaceId: string,
  deviceSn: string,
  logsId: string
): Promise<void> {
  return djiRequest.delete<void>(
    `${MANAGE}/workspaces/${workspaceId}/devices/${deviceSn}/logs/${logsId}`
  );
}
