"use client";

// Coordinates the full DJI livestream lifecycle for a single device:
//   1. startStream() — tells the drone to push video to the WebRTC signalling server
//   2. useWebRTCStream() — frontend connects to the same server to receive the feed
//   3. stopStream()    — clean teardown on unmount so the drone stops pushing
//
// Usage: drop this in place of useWebRTCStream() when USE_DJI_CLOUD=true.
//
// @example
//   const { videoRef, isConnected, isLoading, loadingMessage } = useDJIStream(stream);

import { useEffect, useRef } from 'react';
import { DJI_CONFIG } from '@/lib/dji/config';
import { useStartStream, useStopStream, useLiveCapacity } from '@/hooks/useDJIDevices';
import { useWebRTCStream } from '@/hooks/use-webrtc-stream';
import type { WebRTCStream } from '@/config/webrtc-streams';

export function useDJIStream(stream: WebRTCStream) {
  const { mutate: start } = useStartStream();
  const { mutate: stop  } = useStopStream();
  const { data: capacityMap } = useLiveCapacity();

  // Keep the video_id stable across the effect cleanup so stopStream uses the
  // same id that was passed to startStream, even after capacityMap updates.
  const videoIdRef = useRef<string | null>(null);

  // The WebRTC server path this device streams to / the frontend connects from.
  const streamUrl = stream.isOnline
    ? `${DJI_CONFIG.WEBRTC_BASE_URL}/${stream.id}`
    : '';

  useEffect(() => {
    if (!DJI_CONFIG.USE_DJI_CLOUD || !stream.isOnline) return;

    // Build video_id from live capacity data, falling back to index 0/0 if
    // capacity hasn't loaded yet (the effect re-runs when capacityMap updates).
    const capacity = capacityMap?.get(stream.id);
    const camera   = capacity?.camera_list[0];
    const video    = camera?.video_list[0];

    const videoId = camera && video
      ? `${stream.id}/${camera.camera_index}/${video.video_index}`
      : `${stream.id}/0/0`;

    videoIdRef.current = videoId;

    start({
      video_id:      videoId,
      url_type:      2,    // WebRTC
      url:           streamUrl,
      video_quality: 0,    // auto
    });

    return () => {
      if (videoIdRef.current) {
        stop({ video_id: videoIdRef.current });
        videoIdRef.current = null;
      }
    };
    // start/stop are stable mutation references — safe to omit from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stream.id, stream.isOnline, capacityMap, streamUrl]);

  // Hand the (now-populated) streamUrl to the existing WebRTC hook so the
  // rest of the UI (video ref, connection state, loading messages) works unchanged.
  return useWebRTCStream({ streamUrl, isOnline: stream.isOnline });
}
