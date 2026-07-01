// Central URL registry for all DJI Cloud API endpoints.
// Paths here are passed to djiRequest (client.ts), which prepends NEXT_PUBLIC_DJI_API_URL
// and attaches the x-auth-token header automatically. Calls go directly to the DJI server
// (CORS is open on that server — no Next.js proxy needed).
//
// Usage:
//   import { DJI_URLS } from '@/lib/api';
//   const data = await djiRequest.get(DJI_URLS.devices.list(workspaceId));

import { DJI_CONFIG } from '@/lib/config/config';
import type {
  HMSQueryParams,
  DeviceLogsQueryParams,
  UploadedLogsQueryParams,
  GetElementGroupsParams,
} from '@/lib/types';

const { MANAGE, MAP, MEDIA, CONTROL, WAYLINE } = DJI_CONFIG;

// Builds a query string from any plain object, skipping undefined/null/empty values.
function qs(params: Record<string, unknown>): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      sp.set(key, String(value));
    }
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}

export const DJI_URLS = {
  // ── Auth / Session ──────────────────────────────────────────────────────────
  auth: {
    login: `${MANAGE}/login`,
    refresh: `${MANAGE}/refresh`,
    logout: `${MANAGE}/logout`,
    currentUser: `${MANAGE}/users/current`,
  },

  // ── Devices ─────────────────────────────────────────────────────────────────
  devices: {
    list: (workspaceId: string) => `${MANAGE}/devices/${workspaceId}/devices`,

    detail: (workspaceId: string, sn: string) => `${MANAGE}/devices/${workspaceId}/devices/${sn}`,

    bound: (workspaceId: string, params: { domain: number; page?: number; page_size?: number }) =>
      `${MANAGE}/devices/${workspaceId}/devices/bound${qs(params)}`,

    topologies: (workspaceId: string) => `${MANAGE}/workspaces/${workspaceId}/devices/topologies`,

    bind: (sn: string) => `${MANAGE}/devices/${sn}/binding`,
    unbind: (sn: string) => `${MANAGE}/devices/${sn}/unbinding`,

    property: (workspaceId: string, sn: string) =>
      `${MANAGE}/devices/${workspaceId}/devices/${sn}/property`,

    ota: (workspaceId: string) => `${MANAGE}/devices/${workspaceId}/devices/ota`,
  },

  // ── Users ───────────────────────────────────────────────────────────────────
  users: {
    current: `${MANAGE}/users/current`,

    list: (workspaceId: string, params?: { page?: number; page_size?: number }) =>
      `${MANAGE}/users/${workspaceId}/users${qs(params ?? {})}`,

    update: (workspaceId: string, userId: string) =>
      `${MANAGE}/users/${workspaceId}/users/${userId}`,
  },

  // ── HMS (Health Monitoring System) ──────────────────────────────────────────
  hms: {
    list: (workspaceId: string, params?: HMSQueryParams) => {
      const base = `${MANAGE}/devices/${workspaceId}/devices/hms`;
      if (!params) return base;
      const sp = new URLSearchParams();
      if (params.language) sp.set('language', params.language);
      if (params.message) sp.set('message', params.message);
      if (params.page !== undefined) sp.set('page', String(params.page));
      if (params.level !== undefined) sp.set('level', String(params.level));
      if (params.page_size !== undefined) sp.set('page_size', String(params.page_size));
      if (params.begin_time !== undefined) sp.set('begin_time', String(params.begin_time));
      if (params.end_time !== undefined) sp.set('end_time', String(params.end_time));
      if (params.update_time !== undefined) sp.set('update_time', String(params.update_time));
      params.device_sn?.forEach((sn) => sp.append('device_sn', sn));
      const s = sp.toString();
      return s ? `${base}?${s}` : base;
    },

    device: (workspaceId: string, sn: string) =>
      `${MANAGE}/devices/${workspaceId}/devices/hms/${sn}`,
  },

  // ── Livestream ──────────────────────────────────────────────────────────────
  live: {
    capacity: `${MANAGE}/live/capacity`,
    activeStreams: `${MANAGE}/live/streams/workspace/active`,
    start: `${MANAGE}/live/streams/start`,
    stop: `${MANAGE}/live/streams/stop`,
    update: `${MANAGE}/live/streams/update`,
    switch: `${MANAGE}/live/streams/switch`,
  },

  // ── Media ──────────────────────────────────────────────────────────────────
  media: {
    files: (workspaceId: string, params?: { page?: number; page_size?: number }) =>
      `${MEDIA}/files/${workspaceId}/files${qs(params ?? {})}`,

    fileUrl: (workspaceId: string, fileId: string) =>
      `${MEDIA}/files/${workspaceId}/file/${fileId}/url`,
  },

  // ── Device Logs ─────────────────────────────────────────────────────────────
  logs: {
    available: (workspaceId: string, sn: string, params: DeviceLogsQueryParams) => {
      const sp = new URLSearchParams();
      params.domain_list.forEach((d) => sp.append('domain_list', d));
      return `${MANAGE}/workspaces/${workspaceId}/devices/${sn}/logs?${sp.toString()}`;
    },

    uploaded: (workspaceId: string, sn: string, params?: UploadedLogsQueryParams) =>
      `${MANAGE}/workspaces/${workspaceId}/devices/${sn}/logs-uploaded${qs(params ?? {})}`,

    trigger: (workspaceId: string, sn: string) =>
      `${MANAGE}/workspaces/${workspaceId}/devices/${sn}/logs`,

    cancel: (workspaceId: string, sn: string) =>
      `${MANAGE}/workspaces/${workspaceId}/devices/${sn}/logs`,

    delete: (workspaceId: string, sn: string, logsId: string) =>
      `${MANAGE}/workspaces/${workspaceId}/devices/${sn}/logs/${logsId}`,

    fileUrl: (workspaceId: string, logsId: string, fileId: string) =>
      `${MANAGE}/workspaces/${workspaceId}/logs/${logsId}/url/${fileId}`,
  },

  // ── Map / Geofencing ────────────────────────────────────────────────────────
  map: {
    elementGroups: (workspaceId: string, params?: GetElementGroupsParams) =>
      `${MAP}/workspaces/${workspaceId}/element-groups${qs(params ?? {})}`,

    addElement: (workspaceId: string, groupId: string) =>
      `${MAP}/workspaces/${workspaceId}/element-groups/${groupId}/elements`,

    element: (workspaceId: string, elementId: string) =>
      `${MAP}/workspaces/${workspaceId}/elements/${elementId}`,

    groupElements: (workspaceId: string, groupId: string) =>
      `${MAP}/workspaces/${workspaceId}/element-groups/${groupId}/elements`,

    flightAreas: (workspaceId: string) => `${MAP}/workspaces/${workspaceId}/flight-areas`,

    flightArea: (workspaceId: string, areaId: string) =>
      `${MAP}/workspaces/${workspaceId}/flight-area/${areaId}`,

    addFlightArea: (workspaceId: string) => `${MAP}/workspaces/${workspaceId}/flight-area`,

    syncFlightAreas: (workspaceId: string) => `${MAP}/workspaces/${workspaceId}/flight-area/sync`,

    deviceFlightAreaStatus: (workspaceId: string) =>
      `${MAP}/workspaces/${workspaceId}/device-status`,
  },

  // ── Waylines ────────────────────────────────────────────────────────────────
  waylines: {
    // Lists wayline files in the workspace
    list: (
      workspaceId: string,
      params?: { page?: number; page_size?: number; order_by?: string; favorited?: boolean }
    ) => `${WAYLINE}/workspaces/${workspaceId}/waylines${qs(params ?? {})}`,

    // Lists executed flight jobs — each job references a wayline file via file_id
    jobs: (workspaceId: string, params?: { page?: number; page_size?: number }) =>
      `${WAYLINE}/workspaces/${workspaceId}/jobs${qs(params ?? {})}`,

    // Pre-signed download URL for a wayline KMZ (uses file_id as the wayline identifier)
    downloadUrl: (workspaceId: string, waylineId: string) =>
      `${WAYLINE}/workspaces/${workspaceId}/waylines/${waylineId}/url`,

    // Create a new flight task
    createTask: (workspaceId: string) => `${WAYLINE}/workspaces/${workspaceId}/flight-tasks`,

    // Delete a flight task by job_id
    deleteTask: (workspaceId: string) => `${WAYLINE}/workspaces/${workspaceId}/jobs`,

    // Update a flight task's status (suspend/resume)
    updateTaskStatus: (workspaceId: string, jobId: string) =>
      `${WAYLINE}/workspaces/${workspaceId}/jobs/${jobId}`,

    // Trigger immediate media upload for a completed flight task
    uploadMedia: (workspaceId: string, jobId: string) =>
      `${WAYLINE}/workspaces/${workspaceId}/jobs/${jobId}/media-highest`,

    // Delete a wayline file from the workspace
    deleteWayline: (workspaceId: string, waylineId: string) =>
      `${WAYLINE}/workspaces/${workspaceId}/waylines/${waylineId}`,

    // Upload a KMZ wayline file to the workspace
    upload: (workspaceId: string) =>
      `${WAYLINE}/workspaces/${workspaceId}/waylines/file/upload`,
  },

  // ── Dock / Flight Control ───────────────────────────────────────────────────
  dock: {
    payloadCommand: (sn: string) => `${CONTROL}/devices/${sn}/payload/commands`,

    job: (sn: string, serviceIdentifier: string) =>
      `${CONTROL}/devices/${sn}/jobs/${serviceIdentifier}`,

    takeoffToPoint: (sn: string) => `${CONTROL}/devices/${sn}/jobs/takeoff-to-point`,

    flyToPoint: (sn: string) => `${CONTROL}/devices/${sn}/jobs/fly-to-point`,

    payloadAuthority: (sn: string) => `${CONTROL}/devices/${sn}/authority/payload`,

    flightAuthority: (sn: string) => `${CONTROL}/devices/${sn}/authority/flight`,
  },

  // **Base Endpoint:**
  // **`POST`** `/control/api/v1/devices/{dock_sn}/jobs/{service_identifier}`

  // - **`dock_sn`**: The serial number of the DJI Dock (Gateway SN).
  // - **`service_identifier`**: The specific command to execute (listed below).

  // > [!IMPORTANT]
  // > **Remote Debugging Mode Requirement**
  // > Most physical hardware commands require the DJI Dock to be placed into **Remote Debug Mode** before they can be executed. Attempting to send these commands while debug mode is disabled will fail.

  // ### A. Mode Toggles & Commands (No Debug Mode Required)
  // These commands can be executed at any time.

  // - **`debug_mode_open`**: Open Debug Mode (调试模式开启) - *Use this first to unlock restricted commands!*
  // - **`debug_mode_close`**: Close Debug Mode (调试模式关闭)
  // - **`return_home`**: Return to Home (一键返航)
  // - **`return_home_cancel`**: Cancel Return to Home (取消返航)

  // ### B. Restricted Hardware Commands (Debug Mode Required)
  // The following commands **require** `debug_mode_open` to have been successfully executed first.

  // ── DRC (Drone Remote Control) ───────────────────────────────────────────
  drc: {
    /** Get MQTT broker credentials for the DRC session */
    connect: (workspaceId: string) => `${CONTROL}/workspaces/${workspaceId}/drc/connect`,

    /** Enter DRC mode — returns MQTT pub/sub topics for flight commands */
    enter: (workspaceId: string) => `${CONTROL}/workspaces/${workspaceId}/drc/enter`,

    /** Exit DRC mode — closes the flight control session */
    exit: (workspaceId: string) => `${CONTROL}/workspaces/${workspaceId}/drc/exit`,
  },
} as const;
