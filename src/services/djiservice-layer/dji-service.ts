/**
 * @file dji-service.ts
 * @description HTTP service layer for all DJI Cloud API endpoints.
 *
 * Follows the project's API → Service → Hooks layering:
 *   - URLs are resolved from `DJI_URLS` in `DJIGlobalApi.ts` — never constructed inline here.
 *   - HTTP logic lives here — no React, no state.
 *   - React hooks in `src/hooks/` consume these functions and never import from
 *     `client.ts` or `DJIGlobalApi.ts` directly.
 *
 * All requests flow through `djiRequest` (client.ts) which:
 *   1. Attaches the `x-auth-token` header from the in-memory token store
 *   2. Calls the DJI server directly at NEXT_PUBLIC_DJI_API_URL (CORS is open on that server)
 *   3. Unwraps the DJI `{ code, message, data }` response envelope
 *   4. Auto-retries once on 401 after a silent OmniWatch token refresh
 */

import { djiRequest } from '@/lib/config/client';
import { DJI_URLS } from '@/lib/api';
import type {
  DJIDevice,
  DJIDeviceTopology,
  DJIBoundDevicesResponse,
  DJIDeviceProperty,
  BindDeviceRequest,
  DeviceOTARequest,
  HMSMessage,
  HMSListResponse,
  HMSQueryParams,
  LiveCapacity,
  LiveStreamRequest,
  StartStreamResponse,
  UploadedLog,
  DeviceLogModule,
  TriggerLogUploadRequest,
  CancelLogUploadRequest,
  DeviceLogsQueryParams,
  UploadedLogsQueryParams,
  ElementGroup,
  GetElementGroupsParams,
  AddElementRequest,
  AddElementResponse,
  UpdateElementRequest,
  FlightArea,
  AddFlightAreaRequest,
  SyncFlightAreaRequest,
  DeviceFlightAreaStatus,
  WaylineListResponse,
  WaylineJobListResponse,
  MediaListResponse,
  CreateFlightTask,
} from '@/lib/types';
import type {
  PayloadCommandRequest,
  TakeoffToPointRequest,
  DockFlyToPointRequest,
  PayloadAuthorityRequest,
  DRCConnectResponse,
  DRCEnterResponse,
} from '@/lib/types/dock';

// ─── Devices ──────────────────────────────────────────────────────────────────

/** Lists all devices registered in the workspace. */
export function getDJIDevices(workspaceId: string): Promise<DJIDevice[]> {
  return djiRequest.get<DJIDevice[]>(DJI_URLS.devices.list(workspaceId));
}

/** Fetches a single device by its serial number. */
export function getDJIDevice(workspaceId: string, deviceSn: string): Promise<DJIDevice> {
  return djiRequest.get<DJIDevice>(DJI_URLS.devices.detail(workspaceId, deviceSn));
}

/** Lists only bound devices. Optional domain filter + pagination. */
export function getBoundDevices(
  workspaceId: string,
  params: { domain: number; page?: number; page_size?: number }
): Promise<DJIBoundDevicesResponse> {
  return djiRequest.get<DJIBoundDevicesResponse>(DJI_URLS.devices.bound(workspaceId, params));
}

/** Returns the full device topology tree — docks, drones, RCs nested by parent. */
export function getDeviceTopologies(workspaceId: string): Promise<DJIDeviceTopology[]> {
  return djiRequest.get<DJIDeviceTopology[]>(DJI_URLS.devices.topologies(workspaceId));
}

/** Updates basic device info (e.g. nickname). */
export function updateDJIDevice(
  workspaceId: string,
  deviceSn: string,
  payload: Partial<DJIDevice>
): Promise<void> {
  return djiRequest.put<void>(DJI_URLS.devices.detail(workspaceId, deviceSn), payload);
}

/** Binds a device to the workspace. */
export function bindDevice(deviceSn: string, payload: BindDeviceRequest): Promise<void> {
  return djiRequest.post<void>(DJI_URLS.devices.bind(deviceSn), payload);
}

/** Removes a device from the workspace. */
export function unbindDevice(deviceSn: string): Promise<void> {
  return djiRequest.delete<void>(DJI_URLS.devices.unbind(deviceSn));
}

/** Updates a configurable property on a device (e.g. RTH altitude). */
export function setDeviceProperty(
  workspaceId: string,
  deviceSn: string,
  property: DJIDeviceProperty
): Promise<void> {
  return djiRequest.put<void>(DJI_URLS.devices.property(workspaceId, deviceSn), property);
}

/** Initiates an OTA firmware update for one or more devices. */
export function deviceOTA(workspaceId: string, payload: DeviceOTARequest[]): Promise<void> {
  return djiRequest.post<void>(DJI_URLS.devices.ota(workspaceId), payload);
}

// ─── HMS (Health Monitoring System) ──────────────────────────────────────────

/** Fetches all HMS health/error messages for the workspace. Supports filtering + pagination. */
export function getWorkspaceHMS(
  workspaceId: string,
  params?: HMSQueryParams
): Promise<HMSListResponse> {
  return djiRequest.get<HMSListResponse>(DJI_URLS.hms.list(workspaceId, params));
}

/** Marks all HMS messages for a specific device as read. */
export function markHMSRead(workspaceId: string, deviceSn: string): Promise<void> {
  return djiRequest.put<void>(DJI_URLS.hms.device(workspaceId, deviceSn), {});
}

/** Fetches only unread HMS messages for a single device. */
export function getDeviceHMSUnread(workspaceId: string, deviceSn: string): Promise<HMSMessage[]> {
  return djiRequest.get<HMSMessage[]>(DJI_URLS.hms.device(workspaceId, deviceSn));
}

// ─── Livestream ───────────────────────────────────────────────────────────────

/** Returns which devices can stream and what camera/lens options they expose. */
export function getLiveCapacity(): Promise<LiveCapacity[]> {
  return djiRequest.get<LiveCapacity[]>(DJI_URLS.live.capacity);
}

/** Starts a live video feed. Returns the WHEP viewer URL in data.url. */
export function startStream(payload: LiveStreamRequest): Promise<StartStreamResponse> {
  return djiRequest.post<StartStreamResponse>(DJI_URLS.live.start, payload);
}

/** Stops an active live video feed. */
export function stopStream(payload: LiveStreamRequest): Promise<void> {
  return djiRequest.post<void>(DJI_URLS.live.stop, payload);
}

/** Changes video quality of an active stream without stopping and restarting it. */
export function updateStreamQuality(payload: LiveStreamRequest): Promise<void> {
  return djiRequest.post<void>(DJI_URLS.live.update, payload);
}

/** Switches the active camera lens on an already-streaming device. */
export function switchStreamCamera(payload: LiveStreamRequest): Promise<void> {
  return djiRequest.post<void>(DJI_URLS.live.switch, payload);
}

// ─── Device Logs ─────────────────────────────────────────────────────────────

/** Lists the available log modules on a device (what can be uploaded). */
export function getDeviceLogs(
  workspaceId: string,
  deviceSn: string,
  params: DeviceLogsQueryParams
): Promise<DeviceLogModule[]> {
  return djiRequest.get<DeviceLogModule[]>(DJI_URLS.logs.available(workspaceId, deviceSn, params));
}

/** Lists all log files already uploaded from a device. */
export function getUploadedLogs(
  workspaceId: string,
  deviceSn: string,
  params?: UploadedLogsQueryParams
): Promise<UploadedLog[]> {
  return djiRequest.get<UploadedLog[]>(DJI_URLS.logs.uploaded(workspaceId, deviceSn, params));
}

/** Tells the device to start uploading the specified log modules. */
export function triggerLogUpload(
  workspaceId: string,
  deviceSn: string,
  payload: TriggerLogUploadRequest
): Promise<void> {
  return djiRequest.post<void>(DJI_URLS.logs.trigger(workspaceId, deviceSn), payload);
}

/** Cancels an in-progress log upload from a device. */
export function cancelLogUpload(
  workspaceId: string,
  deviceSn: string,
  payload: CancelLogUploadRequest
): Promise<void> {
  return djiRequest.delete<void>(DJI_URLS.logs.cancel(workspaceId, deviceSn), payload);
}

/** Deletes a specific uploaded log record by ID. */
export function deleteLogFile(
  workspaceId: string,
  deviceSn: string,
  logsId: string
): Promise<void> {
  return djiRequest.delete<void>(DJI_URLS.logs.delete(workspaceId, deviceSn, logsId));
}

/** Returns a pre-signed download URL for a specific file within an uploaded log. */
export function getLogFileUrl(
  workspaceId: string,
  logsId: string,
  fileId: string
): Promise<{ url: string }> {
  return djiRequest.get<{ url: string }>(DJI_URLS.logs.fileUrl(workspaceId, logsId, fileId));
}

// ─── Map / Geofencing ─────────────────────────────────────────────────────────

/** Lists all map element groups (pins, lines, polygons). Optional filters supported. */
export function getElementGroups(
  workspaceId: string,
  params?: GetElementGroupsParams
): Promise<ElementGroup[]> {
  return djiRequest.get<ElementGroup[]>(DJI_URLS.map.elementGroups(workspaceId, params));
}

/** Adds a new GeoJSON map element (point, line, or polygon) to a group. */
export function addElement(
  workspaceId: string,
  groupId: string,
  payload: AddElementRequest
): Promise<AddElementResponse> {
  return djiRequest.post<AddElementResponse>(
    DJI_URLS.map.addElement(workspaceId, groupId),
    payload
  );
}

/** Updates an existing map element's name, geometry, or properties. */
export function updateElement(
  workspaceId: string,
  elementId: string,
  payload: UpdateElementRequest
): Promise<void> {
  return djiRequest.put<void>(DJI_URLS.map.element(workspaceId, elementId), payload);
}

/** Deletes a specific map element by ID. */
export function deleteElement(workspaceId: string, elementId: string): Promise<void> {
  return djiRequest.delete<void>(DJI_URLS.map.element(workspaceId, elementId));
}

/** Deletes all elements within a group at once. */
export function deleteGroupElements(workspaceId: string, groupId: string): Promise<void> {
  return djiRequest.delete<void>(DJI_URLS.map.groupElements(workspaceId, groupId));
}

/** Lists all defined flight areas (geofences) in the workspace. */
export function getFlightAreas(workspaceId: string): Promise<FlightArea[]> {
  return djiRequest.get<FlightArea[]>(DJI_URLS.map.flightAreas(workspaceId));
}

/** Creates a new flight area (geofence). */
export function addFlightArea(
  workspaceId: string,
  payload: AddFlightAreaRequest
): Promise<FlightArea> {
  return djiRequest.post<FlightArea>(DJI_URLS.map.addFlightArea(workspaceId), payload);
}

/** Modifies a flight area's name, status, or geometry. */
export function updateFlightArea(
  workspaceId: string,
  areaId: string,
  payload: Partial<Pick<FlightArea, 'name' | 'status' | 'content'>>
): Promise<void> {
  return djiRequest.put<void>(DJI_URLS.map.flightArea(workspaceId, areaId), payload);
}

/** Removes a flight area by ID. */
export function deleteFlightArea(workspaceId: string, areaId: string): Promise<void> {
  return djiRequest.delete<void>(DJI_URLS.map.flightArea(workspaceId, areaId));
}

/** Pushes ALL current flight areas to the specified devices. */
export function syncFlightAreas(
  workspaceId: string,
  payload: SyncFlightAreaRequest
): Promise<void> {
  return djiRequest.post<void>(DJI_URLS.map.syncFlightAreas(workspaceId), payload);
}

/** Checks the sync status of flight areas on each device. */
export function getDeviceFlightAreaStatus(workspaceId: string): Promise<DeviceFlightAreaStatus[]> {
  return djiRequest.get<DeviceFlightAreaStatus[]>(DJI_URLS.map.deviceFlightAreaStatus(workspaceId));
}

// ─── Waylines ─────────────────────────────────────────────────────────────────

/** Lists all wayline route files uploaded to the workspace. */
export function getWaylines(
  workspaceId: string,
  params?: { page?: number; page_size?: number; order_by?: string; favorited?: boolean }
): Promise<WaylineListResponse> {
  return djiRequest.get<WaylineListResponse>(DJI_URLS.waylines.list(workspaceId, params));
}

/** Lists flight jobs in the workspace. Each job references a wayline file via file_id. */
export function getWaylineJobs(
  workspaceId: string,
  params?: { page?: number; page_size?: number }
): Promise<WaylineJobListResponse> {
  return djiRequest.get<WaylineJobListResponse>(DJI_URLS.waylines.jobs(workspaceId, params));
}

/** Downloads a wayline KMZ file as an ArrayBuffer. The endpoint streams binary directly. */
export function downloadWaylineKmz(workspaceId: string, waylineId: string): Promise<ArrayBuffer> {
  return djiRequest.getBinary(DJI_URLS.waylines.downloadUrl(workspaceId, waylineId));
}

// ─── Dock / Flight Control ────────────────────────────────────────────────────

/** Sends a camera or gimbal command to the drone payload mounted on the dock. */
export function sendPayloadCommand(sn: string, payload: PayloadCommandRequest): Promise<void> {
  return djiRequest.post<void>(DJI_URLS.dock.payloadCommand(sn), payload);
}

/**
 * Grabs payload authority (fire-and-forget; never throws).
 * Call once before a burst of gimbal commands so the server accepts them.
 */
export function grabPayloadAuthority(dockSn: string, payloadIndex: string): Promise<void> {
  return djiRequest
    .post<void>(DJI_URLS.dock.payloadAuthority(dockSn), { payload_index: payloadIndex })
    .catch(() => {});
}

/**
 * Points the gimbal at a GPS coordinate via `camera_look_at`.
 * `locked: false` → only the gimbal turns; drone heading/body stays fixed.
 * Call every ~150 ms while a button is held, updating the target each tick
 * to achieve continuous pitch / yaw motion.
 */
export function gimbalLookAt(
  dockSn: string,
  payloadIndex: string,
  latitude: number,
  longitude: number,
  height: number
): Promise<void> {
  return djiRequest.post<void>(DJI_URLS.dock.payloadCommand(dockSn), {
    cmd: 'camera_look_at',
    data: {
      payload_index: payloadIndex,
      latitude,
      longitude,
      height: Math.max(2.0, height),
      locked: false,
    },
  });
}

/**
 * Snaps the gimbal to a preset: 0 = recenter (level), 1 = straight down (nadir).
 * Grabs payload authority first, matching the drone_tracker.html reference pattern.
 */
export async function gimbalReset(
  dockSn: string,
  payloadIndex: string,
  resetMode: number
): Promise<void> {
  await djiRequest
    .post<void>(DJI_URLS.dock.payloadAuthority(dockSn), { payload_index: payloadIndex })
    .catch(() => {});
  await djiRequest.post<void>(DJI_URLS.dock.payloadCommand(dockSn), {
    cmd: 'gimbal_reset',
    data: { payload_index: payloadIndex, reset_mode: resetMode },
  });
}

/** Execute a dock job by service identifier.
 *  body is optional — no-payload commands (cover_open, drone_open, etc.) omit it;
 *  action commands (alarm_state_switch, sdr_workmode_switch, etc.) pass { action: N }.
 */
export function executeJob(sn: string, serviceIdentifier: string, body?: object): Promise<void> {
  return djiRequest.post<void>(DJI_URLS.dock.job(sn, serviceIdentifier), body);
}

/** Commands the drone to take off and fly to an absolute GPS point.
 *  Transforms camelCase TypeScript types → snake_case wire format the DJI server expects.
 *  Matches the field names and integer value types confirmed working in drone_tracker.html.
 */
export function takeoffToPoint(sn: string, body: TakeoffToPointRequest): Promise<void> {
  const wire = {
    target_latitude: body.targetLatitude,
    target_longitude: body.targetLongitude,
    target_height: body.targetHeight,
    security_takeoff_height: body.securityTakeoffHeight,
    rth_altitude: body.rthAltitude,
    rc_lost_action: Number(body.rcLostAction),
    exit_wayline_when_rc_lost: Number(body.exitWaylineWhenRcLost),
    max_speed: body.maxSpeed,
    rth_mode: Number(body.rthMode),
    commander_mode_lost_action: Number(body.commanderModeLostAction),
    commander_flight_mode: Number(body.commanderFlightMode),
    commander_flight_height: body.commanderFlightHeight,
  };
  console.log('[takeoffToPoint] wire payload →', wire);
  return djiRequest.post<void>(DJI_URLS.dock.takeoffToPoint(sn), wire);
}

/** Commands a drone already in flight to fly to one or more GPS waypoints.
 *  Transforms camelCase TypeScript types → snake_case wire format the DJI server expects.
 */
export function flyToPoint(sn: string, body: DockFlyToPointRequest): Promise<void> {
  const wire = {
    max_speed: body.maxSpeed,
    points: body.points,
  };
  console.log('[flyToPoint] wire payload →', wire);
  return djiRequest.post<void>(DJI_URLS.dock.flyToPoint(sn), wire);
}

/** Cancels an active fly-to-point command; drone will hover in place. */
export function cancelFlyToPoint(sn: string): Promise<void> {
  return djiRequest.delete<void>(DJI_URLS.dock.flyToPoint(sn));
}

/** Cancels an active takeoff-to-point mission. */
export function cancelTakeoffToPoint(sn: string): Promise<void> {
  return djiRequest.delete<void>(DJI_URLS.dock.takeoffToPoint(sn));
}

// http://35.222.89.171:6789/control/api/v1/devices/8UUXN3H00A031T/jobs/return_home_cancel

/** Best-effort cancel of any active dock job (fly-to-point, takeoff-to-point, wayline).
 *  Individual failures are swallowed — useful for clearing stuck job state. */
export async function cancelAllJobs(sn: string): Promise<void> {
  await Promise.allSettled([
    cancelFlyToPoint(sn),
    cancelTakeoffToPoint(sn),
    executeJob(sn, 'wayline', { action: 2 }),
  ]);
}

/** Requests exclusive control of the drone's payload (camera/gimbal). */
export function requestPayloadAuthority(sn: string, body?: PayloadAuthorityRequest): Promise<void> {
  return djiRequest.post<void>(DJI_URLS.dock.payloadAuthority(sn), body ?? {});
}

/** Requests exclusive flight control authority over the drone. */
export function requestFlightAuthority(sn: string): Promise<void> {
  return djiRequest.post<void>(DJI_URLS.dock.flightAuthority(sn));
}

// ─── DRC (Drone Real-time Control) ───────────────────────────────────────────

// Fixed client_id — matches the pattern in the HTML reference (cesium_drc).
// A stable ID avoids stale-session 514304 errors that occur when a random ID
// from a previous session was never properly exited.
export const DRC_CLIENT_ID = 'omniwatch_drc';

/** Step 1 — obtain MQTT broker credentials for a DRC session. */
export function drcConnect(workspaceId: string): Promise<DRCConnectResponse> {
  return djiRequest.post<DRCConnectResponse>(DJI_URLS.drc.connect(workspaceId), {
    client_id: DRC_CLIENT_ID,
    expire_sec: 3600,
  });
}

/** Step 2 — open a DRC channel for the dock; returns MQTT pub/sub topics. */
export function drcEnter(
  workspaceId: string,
  clientId: string,
  dockSn: string
): Promise<DRCEnterResponse> {
  return djiRequest.post<DRCEnterResponse>(DJI_URLS.drc.enter(workspaceId), {
    client_id: clientId,
    dock_sn: dockSn,
  });
}

/** Close the DRC channel when done (fire-and-forget is acceptable on unmount). */
export function drcExit(workspaceId: string, clientId: string, dockSn: string): Promise<void> {
  return djiRequest.post<void>(DJI_URLS.drc.exit(workspaceId), {
    client_id: clientId,
    dock_sn: dockSn,
  });
}

// ─── Media ──────────────────────────────────────────────────────────────────

/** Lists media files captured by devices in the workspace. Supports pagination. */
export function getMediaFiles(
  workspaceId: string,
  params?: { page?: number; page_size?: number }
): Promise<MediaListResponse> {
  return djiRequest.get<MediaListResponse>(DJI_URLS.media.files(workspaceId, params));
}

/** Downloads a media file as an ArrayBuffer. The endpoint streams binary directly. */
export function downloadMediaFile(workspaceId: string, fileId: string): Promise<ArrayBuffer> {
  return djiRequest.getBinary(DJI_URLS.media.fileUrl(workspaceId, fileId));
}

// ─── Flight Tasks ───────────────────────────────────────────────────────────

/** Creates a new flight task (immediate, timed, or conditional). */
export function createFlightTask(
  workspaceId: string,
  body: CreateFlightTask
): Promise<void> {
  return djiRequest.post<void>(DJI_URLS.waylines.createTask(workspaceId), body);
}

/** Deletes a flight task by job_id. */
export function deleteFlightTask(
  workspaceId: string,
  jobId: string
): Promise<void> {
  return djiRequest.delete<void>(DJI_URLS.waylines.deleteTask(workspaceId), {
    params: { job_id: jobId },
  });
}

/** Suspends (0) or resumes (1) a flight task. */
export function updateFlightTaskStatus(
  workspaceId: string,
  jobId: string,
  status: number
): Promise<void> {
  return djiRequest.put<void>(DJI_URLS.waylines.updateTaskStatus(workspaceId, jobId), {
    status,
  });
}

/** Triggers immediate media upload for a completed flight task. */
export function uploadMediaNow(workspaceId: string, jobId: string): Promise<void> {
  return djiRequest.post<void>(DJI_URLS.waylines.uploadMedia(workspaceId, jobId));
}

// ─── Waylines ───────────────────────────────────────────────────────────────

/** Deletes a wayline file from the workspace. */
export function deleteWaylineFile(workspaceId: string, waylineId: string): Promise<void> {
  return djiRequest.delete<void>(DJI_URLS.waylines.deleteWayline(workspaceId, waylineId));
}
