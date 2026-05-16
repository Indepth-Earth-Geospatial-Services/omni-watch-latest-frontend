import { djiRequest } from './client';
import { DJI_CONFIG } from './config';
import type {
  LiveCapacity,
  LiveStreamRequest,
} from '@/lib/types';

const { MANAGE } = DJI_CONFIG;


/**
 * Returns which devices are capable of streaming and what stream URLs they expose.
 *
 * GET /manage/api/v1/live/capacity
 */
export function getLiveCapacity(): Promise<LiveCapacity[]> {
  return djiRequest.get<LiveCapacity[]>(`${MANAGE}/live/capacity`);
}

/**
 * Starts a live video feed from a specific camera lens on a device.
 *
 * POST /manage/api/v1/live/streams/start
 */
export function startStream(payload: LiveStreamRequest): Promise<Record<string, unknown>> {
  return djiRequest.post<Record<string, unknown>>(`${MANAGE}/live/streams/start`, payload);
}

/**
 * Stops an active live video feed.
 *
 * POST /manage/api/v1/live/streams/stop
 */
export function stopStream(payload: LiveStreamRequest): Promise<Record<string, unknown>> {
  return djiRequest.post<Record<string, unknown>>(`${MANAGE}/live/streams/stop`, payload);
}

/**
 * Changes the video quality of an active stream without stopping and restarting it.
 *
 * POST /manage/api/v1/live/streams/update
 */
export function updateStreamQuality(payload: LiveStreamRequest): Promise<Record<string, unknown>> {
  return djiRequest.post<Record<string, unknown>>(`${MANAGE}/live/streams/update`, payload);
}

/**
 * Switches the active camera lens on an already-streaming device.
 *
 * POST /manage/api/v1/live/streams/switch
 */
export function switchStreamCamera(payload: LiveStreamRequest): Promise<Record<string, unknown>> {
  return djiRequest.post<Record<string, unknown>>(`${MANAGE}/live/streams/switch`, payload);
}
