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

  const [isStreaming, setIsStreaming] = useState(() => !!activeStreamUrl);
  const [quality, setQuality] = useState(0);
  const [selectedLens, setSelectedLens] = useState<string | null>(null);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

  const { data: capacityMap } = useLiveCapacity();
  const startMutation = useStartStream();
  const stopMutation = useStopStream();
  const qualityMutation = useUpdateStreamQuality();
  const lensMutation = useSwitchStreamCamera();

  const capacity = capacityMap?.get(deviceSn);
  const firstCamera = capacity?.cameras_list?.[0];
  const availableVideos = firstCamera?.videos_list ?? [];

  const lensOptions = availableVideos.map((v) => ({
    label: v.type.charAt(0).toUpperCase() + v.type.slice(1),
    value: v.type,
  }));

  const effectiveLens = selectedLens ?? availableVideos[0]?.type ?? 'normal';
  const videoForLens = availableVideos.find((v) => v.type === effectiveLens) ?? availableVideos[0];
  const liveVideoId =
    firstCamera && videoForLens ? `${deviceSn}/${firstCamera.index}/${videoForLens.index}` : '0';
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

    setSelectedLens(newLens);
    lensMutation.mutate(
      { url: '', video_id: newVideoId, url_type: 4, video_quality: quality, video_type: newLens },
      {
        onError: () => {
          setSelectedLens(effectiveLens);
          toast.error('Camera switch unavailable — drone MQTT not responding');
        },
        onSuccess: () => {},
      }
    );
  };

  return (
    <div className='flex flex-wrap items-end gap-3 sm:gap-6'>
      {/* Lens selector */}
      {lensOptions.length > 0 && (
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

      {/* Start / Stop — full width on very small screens */}
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
            {startMutation.isPending ? 'Starting…' : 'Start Stream'}
          </button>
        )}
      </div>
    </div>
  );
}
