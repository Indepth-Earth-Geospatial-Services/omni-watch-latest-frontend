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
 *   2. Routes every call through the `/api/dji/` Next.js proxy (never directly to the DJI server)
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
} from '@/lib/types';
import type {
  PayloadCommandRequest,
  JobActionRequest,
  TakeoffToPointRequest,
  DockFlyToPointRequest,
  PayloadAuthorityRequest,
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
export function downloadWaylineKmz(
  workspaceId: string,
  waylineId: string
): Promise<ArrayBuffer> {
  return djiRequest.getBinary(DJI_URLS.waylines.downloadUrl(workspaceId, waylineId));
}

// ─── Dock / Flight Control ────────────────────────────────────────────────────

/** Sends a camera or gimbal command to the drone payload mounted on the dock. */
export function sendPayloadCommand(sn: string, payload: PayloadCommandRequest): Promise<void> {
  return djiRequest.post<void>(DJI_URLS.dock.payloadCommand(sn), payload);
}

/** Pause / resume / stop a running dock job (e.g. wayline mission). */
export function executeJob(
  sn: string,
  serviceIdentifier: string,
  body: JobActionRequest
): Promise<void> {
  return djiRequest.post<void>(DJI_URLS.dock.job(sn, serviceIdentifier), body);
}

/** Commands the drone to take off and fly to an absolute GPS point. */
export function takeoffToPoint(sn: string, body: TakeoffToPointRequest): Promise<void> {
  return djiRequest.post<void>(DJI_URLS.dock.takeoffToPoint(sn), body);
}

/** Commands a drone already in flight to fly to one or more GPS waypoints. */
export function flyToPoint(sn: string, body: DockFlyToPointRequest): Promise<void> {
  return djiRequest.post<void>(DJI_URLS.dock.flyToPoint(sn), body);
}

/** Cancels an active fly-to-point command; drone will hover in place. */
export function cancelFlyToPoint(sn: string): Promise<void> {
  return djiRequest.delete<void>(DJI_URLS.dock.flyToPoint(sn));
}

/** Requests exclusive control of the drone's payload (camera/gimbal). */
export function requestPayloadAuthority(sn: string, body: PayloadAuthorityRequest): Promise<void> {
  return djiRequest.post<void>(DJI_URLS.dock.payloadAuthority(sn), body);
}

/** Requests exclusive flight control authority over the drone. */
export function requestFlightAuthority(sn: string): Promise<void> {
  return djiRequest.post<void>(DJI_URLS.dock.flightAuthority(sn));
}
