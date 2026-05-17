// Device log API functions for the DJI Cloud API.
// All requests flow through client.ts → proxy route handler → DJI server.
//
// Endpoint prefix: /manage/api/v1
// workspaceId is sourced from useAuth().user.workspace_id at the hook layer.

import { djiRequest } from './client';
import { DJI_CONFIG } from './config';
import type {
  UploadedLog,
  DeviceLogModule,
  TriggerLogUploadRequest,
  CancelLogUploadRequest,
  DeviceLogsQueryParams,
  UploadedLogsQueryParams,
} from '@/lib/types';

const { MANAGE } = DJI_CONFIG;

/**
 * Lists the available log modules on a device (what can be uploaded).
 * domain_list is required — pass ["0"] to request flight controller logs.
 *
 * GET /manage/api/v1/workspaces/{workspace_id}/devices/{device_sn}/logs
 */
export function getDeviceLogs(
  workspaceId: string,
  deviceSn: string,
  params: DeviceLogsQueryParams
): Promise<DeviceLogModule[]> {
  const sp = new URLSearchParams();
  params.domain_list.forEach((d) => sp.append('domain_list', d));
  return djiRequest.get<DeviceLogModule[]>(
    `${MANAGE}/workspaces/${workspaceId}/devices/${deviceSn}/logs?${sp.toString()}`
  );
}

/**
 * Lists all log files that have already been uploaded from a device.
 *
 * GET /manage/api/v1/workspaces/{workspace_id}/devices/{device_sn}/logs-uploaded
 */
export function getUploadedLogs(
  workspaceId: string,
  deviceSn: string,
  params?: UploadedLogsQueryParams
): Promise<UploadedLog[]> {
  let query = '';
  if (params) {
    const sp = new URLSearchParams();
    if (params.page !== undefined)             sp.set('page', String(params.page));
    if (params.status !== undefined)           sp.set('status', String(params.status));
    if (params.page_size !== undefined)        sp.set('page_size', String(params.page_size));
    if (params.begin_time !== undefined)       sp.set('begin_time', String(params.begin_time));
    if (params.end_time !== undefined)         sp.set('end_time', String(params.end_time));
    if (params.logs_information)              sp.set('logs_information', params.logs_information);
    const qs = sp.toString();
    if (qs) query = `?${qs}`;
  }
  return djiRequest.get<UploadedLog[]>(
    `${MANAGE}/workspaces/${workspaceId}/devices/${deviceSn}/logs-uploaded${query}`
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
  deviceSn: string,
  payload: CancelLogUploadRequest
): Promise<void> {
  return djiRequest.delete<void>(
    `${MANAGE}/workspaces/${workspaceId}/devices/${deviceSn}/logs`,
    payload
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

/**
 * Returns a pre-signed download URL for a specific file within an uploaded log.
 *
 * GET /manage/api/v1/workspaces/{workspace_id}/logs/{logs_id}/url/{file_id}
 */
export function getLogFileUrl(
  workspaceId: string,
  logsId: string,
  fileId: string
): Promise<{ url: string }> {
  return djiRequest.get<{ url: string }>(
    `${MANAGE}/workspaces/${workspaceId}/logs/${logsId}/url/${fileId}`
  );
}
