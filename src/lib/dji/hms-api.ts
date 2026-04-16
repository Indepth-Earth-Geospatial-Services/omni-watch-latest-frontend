// HMS (Health Monitoring System) API functions for the DJI Cloud API.
// All requests flow through client.ts → proxy route handler → DJI server.
//
// Endpoint prefix: /manage/api/v1
// workspaceId is passed as a parameter — sourced from useAuth().user.workspace_id at the hook layer.

import { djiRequest } from './client';
import { DJI_CONFIG } from './config';
import type { HMSMessage, HMSListResponse } from '@/lib/types';

const { MANAGE } = DJI_CONFIG;

/**
 * Fetches all HMS health/error messages for every device in the workspace.
 *
 * GET /manage/api/v1/devices/{workspace_id}/devices/hms
 */
export function getWorkspaceHMS(workspaceId: string): Promise<HMSListResponse> {
  return djiRequest.get<HMSListResponse>(
    `${MANAGE}/devices/${workspaceId}/devices/hms`
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
