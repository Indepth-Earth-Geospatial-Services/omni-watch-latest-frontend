'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  useLiveCapacity,
  useStartStream,
  useStopStream,
  useUpdateStreamQuality,
  useSwitchStreamCamera,
} from '@/hooks/useLiveStreams';

interface StreamControlPanelProps {
  stream: any;
  externalStopSignal?: number;
  onStreamingChange?: (isStreaming: boolean, videoId?: string) => void;
  /** Pass the active stream URL when a stream is already running (e.g. after a view switch). */
  activeStreamUrl?: string | null;
}

const QUALITY_OPTIONS = [
  { label: 'Auto', value: 0 },
  { label: 'Smooth', value: 1 },
  { label: 'SD', value: 2 },
  { label: 'HD', value: 3 },
  { label: '4K', value: 4 },
] as const;

// Format any video_type string from the DJI API into a readable label.
// Splits on underscores and capitalizes each word, so it works for any
// drone model without a hardcoded lookup: "infrared_thermal" → "Infrared Thermal".
function videoTypeLabel(type: string): string {
  return type
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function StreamControlPanel({
  stream,
  externalStopSignal,
  onStreamingChange,
  activeStreamUrl,
}: StreamControlPanelProps) {
  const deviceSn = stream.id || stream.deviceSerialNumber || stream.deviceSn || stream.device_sn;

  // Initialize isStreaming from activeStreamUrl so the Stop button shows after a view switch.
  const [isStreaming, setIsStreaming] = useState(() => !!activeStreamUrl);
  const [quality, setQuality] = useState(0);
  const [selectedLens, setSelectedLens] = useState<string | null>(null);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

  const { data: capacityMap, isLoading: capacityLoading } = useLiveCapacity();
  const startMutation = useStartStream();
  const stopMutation = useStopStream();
  const qualityMutation = useUpdateStreamQuality();
  const lensMutation = useSwitchStreamCamera();

  // ─── Derived capacity values ──────────────────────────────────────────────
  const capacity = capacityMap?.get(deviceSn);
  const cameras = capacity?.cameras_list ?? [];

  // For multi-camera drones (Matrice4TD), skip cameras whose only video type is 'normal'
  // (e.g. the IR/Wide Gimbal sub-camera at 176-0-0). Prefer the camera that has at least
  // one video with a real type (e.g. M4D Camera at 99-0-0 with type:'wide').
  const selectedCamera =
    cameras.find((cam) => cam.videos_list.some((v) => v.type !== 'normal')) ?? cameras[0];

  const availableVideos = selectedCamera?.videos_list ?? [];

  // Lens options — two models:
  // • M4D Camera style: one stream slot with switch_video_types (Normal/Wide/Zoom/IR).
  //   Include all entries from switch_video_types so the user can pick any lens.
  // • Mavic 3T style: separate video entries per lens (wide-0, zoom-0, thermal-0).
  //   Each entry becomes one option.
  const lensOptions = availableVideos.flatMap((v) => {
    if (v.switch_video_types && v.switch_video_types.length > 0) {
      return v.switch_video_types.map((t) => ({ label: videoTypeLabel(t), value: t }));
    }
    return [{ label: videoTypeLabel(v.type), value: v.type }];
  });

  // Default lens: first entry in switch_video_types when present (e.g. 'normal' for
  // M4D Camera — this aligns with drone_tracker.html, which omits video_type entirely
  // and the DJI server defaults the normal-0 slot to 'normal').
  // For Mavic-style cameras without switch_video_types, use the first video's own type.
  const primaryVideo = availableVideos[0];
  const defaultLens = primaryVideo?.switch_video_types?.[0] ?? primaryVideo?.type;
  const effectiveLens = selectedLens ?? defaultLens ?? '';

  // Build the DJI composite video_id: {device_sn}/{camera_index}/{video_index}.
  // For Mavic: videoForLens.index changes per lens (wide-0, zoom-0 …).
  // For M4D:   videoForLens.index is always normal-0 regardless of chosen lens.
  const videoForLens = availableVideos.find((v) => v.type === effectiveLens) ?? availableVideos[0];

  // Fallback for dock-connected drones that temporarily report no cameras_list.
  const DOCK_CAMERA_INDEX = '99-0-0';
  const DOCK_VIDEO_INDEX = 'normal-0';

  const deviceKnown = !!capacity;
  const noCameraData = !capacityLoading && deviceKnown && cameras.length === 0;
  const noCapacityEntry = !capacityLoading && !deviceKnown;

  const liveVideoId =
    selectedCamera && videoForLens
      ? `${deviceSn}/${selectedCamera.index}/${videoForLens.index}`
      : noCameraData
      ? `${deviceSn}/${DOCK_CAMERA_INDEX}/${DOCK_VIDEO_INDEX}`
      : '0';

  // While a stream is active keep using the video_id it was started with.
  const currentVideoId = activeVideoId ?? liveVideoId;

  const deviceOffline = !(stream.isOnline || stream.status);
  const disabled = deviceOffline || capacityLoading || noCapacityEntry;
  const isPending =
    startMutation.isPending ||
    stopMutation.isPending ||
    qualityMutation.isPending ||
    lensMutation.isPending;

  const streamFeedType = stream.feedType || stream.type || stream.device_type;

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleStart = () => {
    const payload = {
      url: '',
      video_id: liveVideoId,
      url_type: 4,
      video_quality: quality,
      video_type: effectiveLens,
    };
    console.log('[LiveFeed:Stream] ▶ start request', { deviceSn, ...payload, noCameraData, noCapacityEntry });
    startMutation.mutate(payload, {
      onSuccess: (data) => {
        console.log('[LiveFeed:Stream] ✅ start success — stream url:', data.url);
        if (!data.url) {
          console.error('[LiveFeed:Stream] ❌ No stream URL in response');
          toast.error('DJI returned no stream URL — check that url_type 4 (WebRTC) is supported');
          return;
        }
        setIsStreaming(true);
        setActiveVideoId(liveVideoId);
        onStreamingChange?.(true, data.url);
      },
      onError: (err) => {
        console.error('[LiveFeed:Stream] ❌ start error:', err);
        toast.error(`Stream start failed: ${err.message}`);
      },
    });
  };

  const handleStop = () => {
    console.log('[LiveFeed:Stream] ■ stop request', { deviceSn, video_id: currentVideoId });
    stopMutation.mutate(
      {
        url: '',
        video_id: currentVideoId,
        url_type: 4,
        video_quality: quality,
        video_type: effectiveLens,
      },
      {
        onSettled: () => {
          setIsStreaming(false);
          setActiveVideoId(null);
          onStreamingChange?.(false);
        },
        onError: (err) => {
          console.warn('[LiveFeed:Stream] stop error (state cleaned up anyway):', err.message);
        },
      }
    );
  };

  const handleQualityChange = (newQuality: number) => {
    setQuality(newQuality);
    if (isStreaming) {
      qualityMutation.mutate({
        url: '',
        video_id: currentVideoId,
        url_type: 4,
        video_quality: newQuality,
        video_type: effectiveLens,
      });
    }
  };

  const handleLensChange = (newLens: string) => {
    if (effectiveLens === newLens) return;
    if (!isStreaming) {
      setSelectedLens(newLens);
      return;
    }

    // For Mavic-style cameras, each lens has its own video entry so the index changes.
    // For M4D-style cameras, the index stays the same and only video_type changes.
    const newVideo = availableVideos.find((v) => v.type === newLens) ?? availableVideos[0];
    const newVideoId =
      selectedCamera && newVideo
        ? `${deviceSn}/${selectedCamera.index}/${newVideo.index}`
        : currentVideoId;

    setSelectedLens(newLens);
    lensMutation.mutate(
      { url: '', video_id: newVideoId, url_type: 4, video_quality: quality, video_type: newLens },
      {
        onError: () => {
          setSelectedLens(effectiveLens);
          toast.error('Camera switch unavailable — drone MQTT not responding');
        },
      }
    );
  };

  // ─── External stop signal ──────────────────────────────────────────────────
  const isStreamingRef = useRef(isStreaming);
  isStreamingRef.current = isStreaming;
  const handleStopRef = useRef(handleStop);
  handleStopRef.current = handleStop;
  const prevSignalRef = useRef(0);

  useEffect(() => {
    const sig = externalStopSignal ?? 0;
    if (sig > prevSignalRef.current) {
      prevSignalRef.current = sig;
      if (isStreamingRef.current) handleStopRef.current();
    }
  }, [externalStopSignal]);

  if (streamFeedType !== 'DRONE' && streamFeedType !== 'DOCK') return null;

  // ─── Render ────────────────────────────────────────────────────────────────

  const startLabel = (() => {
    if (startMutation.isPending) return 'Starting…';
    if (capacityLoading) return 'Loading…';
    if (deviceOffline) return 'Device Offline';
    if (noCapacityEntry) return 'Not in Capacity';
    return 'Start Stream';
  })();

  return (
    <div className='flex flex-col gap-3'>
      {noCameraData && (
        <p className='text-[10px] text-amber-500/80'>
          Dock-connected camera — using integrated payload index ({DOCK_CAMERA_INDEX}).
        </p>
      )}

      <div className='flex flex-wrap items-end gap-6'>
        {/* Lens selector — shows when there are multiple lens options */}
        {lensOptions.length > 1 && (
          <div>
            <p className='text-[10px] font-black tracking-widest uppercase text-zinc-600 mb-1.5'>
              Lens
            </p>
            <div className='flex gap-1 flex-wrap'>
              {lensOptions.map(({ label, value }) => (
                <button
                  key={value}
                  disabled={disabled || isPending}
                  onClick={() => handleLensChange(value)}
                  className={cn(
                    'px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
                    value === effectiveLens
                      ? 'bg-[#1C93FF] text-white'
                      : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-500 hover:text-zinc-200'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quality selector */}
        <div>
          <p className='text-[10px] font-black tracking-widest uppercase text-zinc-600 mb-1.5'>
            Quality
          </p>
          <div className='flex gap-1 flex-wrap'>
            {QUALITY_OPTIONS.map(({ label, value }) => (
              <button
                key={value}
                disabled={disabled || isPending}
                onClick={() => handleQualityChange(value)}
                className={cn(
                  'px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
                  quality === value
                    ? 'bg-violet-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-500 hover:text-zinc-200'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Start / Stop */}
        <div className='sm:ml-auto w-full sm:w-auto'>
          <p className='text-[10px] font-black tracking-widest uppercase text-zinc-600 mb-1.5'>
            Stream
          </p>
          {isStreaming ? (
            <button
              disabled={disabled || isPending}
              onClick={handleStop}
              className='w-full sm:w-auto px-4 py-1.5 text-[11px] font-bold rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
            >
              {stopMutation.isPending ? 'Stopping…' : 'Stop Stream'}
            </button>
          ) : (
            <button
              disabled={disabled || isPending}
              onClick={handleStart}
              className='w-full sm:w-auto px-4 py-1.5 text-[11px] font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
            >
              {startLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}