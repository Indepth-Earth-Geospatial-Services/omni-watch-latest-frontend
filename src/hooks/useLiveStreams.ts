import { useMutation, useQuery } from '@tanstack/react-query';
import {
  getLiveCapacity,
  startStream,
  stopStream,
  updateStreamQuality,
  switchStreamCamera,
} from '@/services/djiservice-layer/dji-service';
import type { LiveCapacity, LiveStreamRequest, StartStreamResponse } from '@/lib/types';

// ─── Query key factory ────────────────────────────────────────────────────────

const streamKeys = {
  capacity: ['dji', 'live', 'capacity'] as const,
};

// Stable module-level reference so React Query only re-evaluates this when the
// raw server data changes, not on every render. An inline arrow would be a new
// function reference on every render, causing React Query to produce a new Map
// each time and triggering an infinite re-render loop in any useEffect that
// lists capacityMap as a dependency.
const toCapacityMap = (capacities: LiveCapacity[]) =>
  new Map(capacities.map((c) => [c.sn, c]));

// ─── Livestream hooks ─────────────────────────────────────────────────────────

/**
 * Fetches which devices can stream and what camera/lens options they expose.
 * Returns a Map keyed by device_sn (or sn) for O(1) lookups in stream cards.
 * Only runs when USE_DJI_CLOUD=true.
 */
export function useLiveCapacity(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: streamKeys.capacity,
    queryFn: getLiveCapacity,
    retry: 1,
    retryDelay: 1500,
    refetchInterval: 30_000,
    staleTime: 10_000,
    select: toCapacityMap,
    enabled: options?.enabled !== false,
  });
}

/**
 * Tells a DJI drone to start pushing video to a destination URL.
 * Call this before connecting your video player — the drone won't push until asked.
 *
 * @example
 * const { mutate: start } = useStartStream();
 * start({ video_id, url_type: "2", video_quality: "0", videoType: "zoom" });
 */
export function useStartStream() {
  return useMutation<StartStreamResponse, Error, LiveStreamRequest>({
    mutationFn: (payload) => startStream(payload),
  });
}

/**
 * Stops an active DJI video stream.
 * Always call on component unmount to avoid the drone streaming to a dead URL.
 */
export function useStopStream() {
  return useMutation<void, Error, LiveStreamRequest>({
    mutationFn: (payload) => stopStream(payload),
  });
}

/**
 * Changes the video quality of an already-running stream without restarting it.
 * video_quality: 0 = auto, 1 = smooth, 2 = SD, 3 = HD, 4 = ultra-HD
 */
export function useUpdateStreamQuality() {
  return useMutation<void, Error, LiveStreamRequest>({
    mutationFn: (payload) => updateStreamQuality(payload),
  });
}

/**
 * Switches the active camera lens (normal / wide / IR) on a running stream.
 * The stream must already be started — call useStartStream() first.
 */
export function useSwitchStreamCamera() {
  return useMutation<void, Error, LiveStreamRequest>({
    mutationFn: (payload) => switchStreamCamera(payload),
  });
}
