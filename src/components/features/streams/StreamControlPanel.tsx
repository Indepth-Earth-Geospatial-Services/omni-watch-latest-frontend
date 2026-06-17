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

  const { data: capacityMap } = useLiveCapacity();
  const startMutation = useStartStream();
  const stopMutation = useStopStream();
  const qualityMutation = useUpdateStreamQuality();
  const lensMutation = useSwitchStreamCamera();

  // ─── Derived capacity values ──────────────────────────────────────────────
  const capacity = capacityMap?.get(deviceSn);
  const cameras = capacity?.cameras_list ?? [];

  const selectedCamera = cameras[0];
  const availableVideos = selectedCamera?.videos_list ?? [];

  // Lens options come entirely from what the selected camera reports.
  // Labels are formatted dynamically from the raw type string — no hardcoded map.
  const lensOptions = availableVideos.map((v) => ({
    label: videoTypeLabel(v.type),
    value: v.type,
  }));

  // Fall back to first available lens when none is selected yet.
  const effectiveLens = selectedLens ?? availableVideos[0]?.type ?? 'normal';

  // Build the DJI composite video_id: {device_sn}/{camera_index}/{video_index}
  const videoForLens = availableVideos.find((v) => v.type === effectiveLens) ?? availableVideos[0];
  const liveVideoId =
    selectedCamera && videoForLens
      ? `${deviceSn}/${selectedCamera.index}/${videoForLens.index}`
      : '0';

  // While a stream is active keep using the video_id it was started with.
  const currentVideoId = activeVideoId ?? liveVideoId;

  const disabled = !(stream.isOnline || stream.status);
  const isPending =
    startMutation.isPending ||
    stopMutation.isPending ||
    qualityMutation.isPending ||
    lensMutation.isPending;

  const streamFeedType = stream.feedType || stream.type || stream.device_type;

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleStart = () => {
    startMutation.mutate(
      { url: '', video_id: liveVideoId, url_type: 4, video_quality: quality, video_type: effectiveLens },
      {
        onSuccess: (data) => {
          setIsStreaming(true);
          setActiveVideoId(liveVideoId);
          onStreamingChange?.(true, data.url);
        },
        onError: (err) => toast.error(`Stream start failed: ${err.message}`),
      }
    );
  };

  const handleStop = () => {
    stopMutation.mutate(
      { url: '', video_id: currentVideoId, url_type: 4, video_quality: quality, video_type: effectiveLens },
      {
        onSettled: () => {
          setIsStreaming(false);
          setActiveVideoId(null);
          onStreamingChange?.(false);
        },
        onError: (err) => toast.error(`Stream stop failed: ${err.message}`),
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

  return (
    <div className='flex flex-wrap items-end gap-6'>
      {/* Lens / video-type selector — built entirely from the selected camera's videos_list */}
      {lensOptions.length > 1 && (
        <div>
          <p className='text-[10px] font-black tracking-widest uppercase text-zinc-600 mb-1.5'>
            Lens
          </p>
          <div className='flex gap-1'>
            {lensOptions.map(({ label, value }) => (
              <button
                key={value}
                disabled={disabled || isPending}
                onClick={() => handleLensChange(value)}
                className={cn(
                  'px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
                  effectiveLens === value
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
        <div className='flex gap-1'>
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
      <div className='ml-auto'>
        <p className='text-[10px] font-black tracking-widest uppercase text-zinc-600 mb-1.5'>
          Stream
        </p>
        {isStreaming ? (
          <button
            disabled={disabled || isPending}
            onClick={handleStop}
            className='px-4 py-1.5 text-[11px] font-bold rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
          >
            {stopMutation.isPending ? 'Stopping…' : 'Stop Stream'}
          </button>
        ) : (
          <button
            disabled={disabled || isPending}
            onClick={handleStart}
            className='px-4 py-1.5 text-[11px] font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
          >
            {startMutation.isPending ? 'Starting…' : 'Start Stream'}
          </button>
        )}
      </div>
    </div>
  );
}
