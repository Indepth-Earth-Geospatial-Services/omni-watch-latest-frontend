'use client';

import { useEffect, useRef, useState } from 'react';
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
  /** Pass the active WHEP URL when a stream is already running (e.g. after a view switch). */
  activeStreamUrl?: string | null;
}

const QUALITY_OPTIONS = [
  { label: 'Auto', value: 0 },
  { label: 'Smooth', value: 1 },
  { label: 'SD', value: 2 },
  { label: 'HD', value: 3 },
  { label: '4K', value: 4 },
] as const;

export function StreamControlPanel({
  stream,
  externalStopSignal,
  onStreamingChange,
  activeStreamUrl,
}: StreamControlPanelProps) {
  const deviceSn = stream.id || stream.deviceSerialNumber || stream.deviceSn || stream.device_sn;

  // Initialise isStreaming from activeStreamUrl so the Stop button shows after a view switch.
  // activeVideoId stays null — it falls back to liveVideoId (from capacity) which is always
  // the correct DJI video_id regardless of whether the component was just mounted.
  const [isStreaming, setIsStreaming] = useState(() => !!activeStreamUrl);
  const [quality, setQuality] = useState(0);
  const [selectedLens, setSelectedLens] = useState<string | null>(null);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [switchError, setSwitchError] = useState<string | null>(null);

  const { data: capacityMap } = useLiveCapacity();
  const startMutation = useStartStream();
  const stopMutation = useStopStream();
  const qualityMutation = useUpdateStreamQuality();
  const lensMutation = useSwitchStreamCamera();

  // Build available lens options from capacity — falls back to empty until capacity loads.
  const capacity = capacityMap?.get(deviceSn);
  const firstCamera = capacity?.cameras_list?.[0];
  const availableVideos = firstCamera?.videos_list ?? [];

  // Lens options are derived from what the drone actually reports.
  const lensOptions = availableVideos.map((v) => ({
    label: v.type.charAt(0).toUpperCase() + v.type.slice(1),
    value: v.type,
  }));

  // Auto-select the first available lens when capacity data arrives.
  const effectiveLens = selectedLens ?? availableVideos[0]?.type ?? 'normal';

  // Build the DJI video_id: {device_sn}/{camera_index}/{video_index}
  const videoForLens = availableVideos.find((v) => v.type === effectiveLens) ?? availableVideos[0];
  const liveVideoId =
    firstCamera && videoForLens ? `${deviceSn}/${firstCamera.index}/${videoForLens.index}` : '0';

  // While a stream is active keep using the video_id it was started with.
  const currentVideoId = activeVideoId ?? liveVideoId;

  const disabled = !(stream.isOnline || stream.status);
  const isPending =
    startMutation.isPending ||
    stopMutation.isPending ||
    qualityMutation.isPending ||
    lensMutation.isPending;

  const streamFeedType = stream.feedType || stream.type || stream.device_type;

  const handleStart = () => {
    startMutation.mutate(
      {
        url: '',
        video_id: liveVideoId,
        url_type: 4,
        video_quality: quality,
        video_type: effectiveLens,
      },
      {
        onSuccess: (data) => {
          setIsStreaming(true);
          setActiveVideoId(liveVideoId);
          onStreamingChange?.(true, data.url);
        },
      }
    );
  };

  const handleStop = () => {
    stopMutation.mutate(
      {
        url: '',
        video_id: currentVideoId,
        url_type: 4,
        video_quality: quality,
        video_type: effectiveLens,
      },
      {
        // Use onSettled (not onSuccess) so the UI always resets even when the API
        // returns an error — e.g. the stream was already broken server-side.
        onSettled: () => {
          setIsStreaming(false);
          setActiveVideoId(null);
          onStreamingChange?.(false);
        },
      }
    );
  };

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

  if (streamFeedType !== 'DRONE') return null;

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
      firstCamera && newVideo
        ? `${deviceSn}/${firstCamera.index}/${newVideo.index}`
        : currentVideoId;

    // Optimistically update the UI — revert on failure so current lens stays accurate.
    setSelectedLens(newLens);
    lensMutation.mutate(
      { url: '', video_id: newVideoId, url_type: 4, video_quality: quality, video_type: newLens },
      {
        onError: () => {
          // Switch failed — revert the lens selector so it reflects what's actually streaming.
          setSelectedLens(effectiveLens);
          setSwitchError('Camera switch unavailable — drone MQTT not responding');
        },
        onSuccess: () => setSwitchError(null),
      }
    );
  };

  return (
    <div className='flex flex-wrap items-end gap-6'>
      {/* Lens selector — built from capacity data */}
      {lensOptions.length > 0 && (
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
          {switchError && <p className='text-[10px] text-amber-400 mt-1.5'>{switchError}</p>}
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
