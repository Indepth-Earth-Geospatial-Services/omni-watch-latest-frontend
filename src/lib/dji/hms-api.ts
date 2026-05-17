// HMS (Health Monitoring System) API functions for the DJI Cloud API.
// All requests flow through client.ts → proxy route handler → DJI server.
//
// Endpoint prefix: /manage/api/v1
// workspaceId is passed as a parameter — sourced from useAuth().user.workspace_id at the hook layer.

import { djiRequest } from './client';
import { DJI_CONFIG } from './config';
import type { HMSMessage, HMSListResponse, HMSQueryParams } from '@/lib/types';

const { MANAGE } = DJI_CONFIG;

/**
 * Fetches all HMS health/error messages for every device in the workspace.
 * Supports filtering by level, device serial numbers, time range, and pagination.
 *
 * GET /manage/api/v1/devices/{workspace_id}/devices/hms
 */
export function getWorkspaceHMS(
  workspaceId: string,
  params?: HMSQueryParams
): Promise<HMSListResponse> {
  let query = '';
  if (params) {
    const sp = new URLSearchParams();
    if (params.language)                  sp.set('language', params.language);
    if (params.message)                   sp.set('message', params.message);
    if (params.page !== undefined)        sp.set('page', String(params.page));
    if (params.level !== undefined)       sp.set('level', String(params.level));
    if (params.device_sn)                 params.device_sn.forEach(sn => sp.append('device_sn', sn));
    if (params.begin_time !== undefined)  sp.set('begin_time', String(params.begin_time));
    if (params.end_time !== undefined)    sp.set('end_time', String(params.end_time));
    if (params.page_size !== undefined)   sp.set('page_size', String(params.page_size));
    if (params.update_time !== undefined) sp.set('update_time', String(params.update_time));
    const qs = sp.toString();
    if (qs) query = `?${qs}`;
  }
  return djiRequest.get<HMSListResponse>(
    `${MANAGE}/devices/${workspaceId}/devices/hms${query}`
  );
}

/**
 * Marks all HMS messages for a specific device as read.
 *
 * PUT /manage/api/v1/devices/{workspace_id}/devices/hms/{device_sn}
 */
export function markHMSRead(workspaceId: string, deviceSn: string): Promise<void> {
  return djiRequest.put<void>(
    `${MANAGE}/devices/${workspaceId}/devices/hms/${deviceSn}`,
    {}
  );
}

/**
 * Fetches only unread HMS messages for a single device.
 *
 * GET /manage/api/v1/devices/{workspace_id}/devices/hms/{device_sn}
 */
export function getDeviceHMSUnread(workspaceId: string, deviceSn: string): Promise<HMSMessage[]> {
  return djiRequest.get<HMSMessage[]>(
    `${MANAGE}/devices/${workspaceId}/devices/hms/${deviceSn}`
  );
}
