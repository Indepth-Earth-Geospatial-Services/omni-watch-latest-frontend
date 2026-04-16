// Livestream API functions for the DJI Cloud API.
// Controls video feeds from DJI drones — start, stop, quality, and lens switching.
// All requests flow through client.ts → proxy route handler → DJI server.
//
// Endpoint prefix: /manage/api/v1/live

import { djiRequest } from './client';
import { DJI_CONFIG } from './config';
import type {
  StreamCapacity,
  StartStreamRequest,
  StopStreamRequest,
  UpdateStreamRequest,
  SwitchStreamRequest,
  StreamResponse,
} from '@/lib/types';

const { MANAGE } = DJI_CONFIG;

/**
 * Returns which devices are capable of streaming and what stream URLs they expose.
 * Each device lists its cameras, and each camera lists its available video feeds
 * (wide, zoom, IR). Use this to populate stream URLs in the Live Feed page.
 *
 * GET /manage/api/v1/live/capacity
 */
export function getLiveCapacity(): Promise<StreamCapacity[]> {
  return djiRequest.get<StreamCapacity[]>(`${MANAGE}/live/capacity`);
}

/**
 * Starts a live video feed from a specific camera lens on a device.
 * `video_id` is the combined key: "{device_sn}/{camera_index}/{video_index}"
 * `url_type: 2` = WebRTC (matches the existing WebRTCStream infrastructure).
 * `url` is the destination — the WebRTC signalling server URL.
 *
 * POST /manage/api/v1/live/streams/start
 */
export function startStream(payload: StartStreamRequest): Promise<StreamResponse> {
  return djiRequest.post<StreamResponse>(`${MANAGE}/live/streams/start`, payload);
}

/**
 * Stops an active live video feed.
 * Must be called before switching camera lenses or ending a session cleanly.
 *
 * POST /manage/api/v1/live/streams/stop
 */
export function stopStream(payload: StopStreamRequest): Promise<StreamResponse> {
  return djiRequest.post<StreamResponse>(`${MANAGE}/live/streams/stop`, payload);
}

/**
 * Changes the video quality of an active stream without stopping and restarting it.
 * video_quality: 0 = auto, 1 = smooth, 2 = SD, 3 = HD, 4 = ultra-HD
 *
 * POST /manage/api/v1/live/streams/update
 */
export function updateStreamQuality(payload: UpdateStreamRequest): Promise<StreamResponse> {
  return djiRequest.post<StreamResponse>(`${MANAGE}/live/streams/update`, payload);
}

/**
 * Switches the active camera lens on an already-streaming device.
 * camera_mode: 0 = wide angle, 1 = zoom, 2 = IR thermal
 * The stream must already be running — call startStream() first.
 *
 * POST /manage/api/v1/live/streams/switch
 */
export function switchStreamCamera(payload: SwitchStreamRequest): Promise<StreamResponse> {
  return djiRequest.post<StreamResponse>(`${MANAGE}/live/streams/switch`, payload);
}
