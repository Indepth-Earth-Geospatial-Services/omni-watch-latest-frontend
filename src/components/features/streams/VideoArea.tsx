'use client';

import React, { memo, useEffect, useRef } from 'react';
import { Activity, WifiOff, Battery, BatteryLow, BatteryWarning } from 'lucide-react';
import { useTelemetry } from '@/hooks/useTelemetry';
import type { StreamState } from './WebRTCPlayer';
import type { DJIDevice } from '@/lib/types';

interface VideoAreaProps {
  device: DJIDevice;
  mediaStream: MediaStream | null;
  streamState: { state: StreamState; errorMsg?: string } | null;
  isActive?: boolean;
  large?: boolean;
  onRetry?: () => void;
}

function batteryStyle(pct: number): { color: string; Icon: React.ElementType } {
  if (pct < 20) return { color: '#f87171', Icon: BatteryLow };
  if (pct < 40) return { color: '#facc15', Icon: BatteryWarning };
  return { color: '#34d399', Icon: Battery };
}

export const VideoArea = memo(function VideoArea({
  device,
  mediaStream,
  streamState,
  isActive = false,
  large = false,
  onRetry,
}: VideoAreaProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { getProcessedDroneData } = useTelemetry();
  const telemetry = getProcessedDroneData(device.deviceSn);
  const battery = telemetry?.battery ?? null;

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [mediaStream]);

  const isPlaying = streamState?.state === 'playing' && !!mediaStream;
  const showPlayer = isActive || !!streamState;
  const displayState = streamState?.state ?? (isActive ? 'connecting' : null);

  const containerCls = `relative bg-zinc-950 overflow-hidden ${
    large ? 'h-full w-full rounded-xl border border-zinc-800' : 'aspect-video'
  }`;

  return (
    <div className={large ? 'h-full' : ''}>
      <div className={containerCls}>
        {showPlayer ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className={`w-full h-full object-cover ${isPlaying ? 'block' : 'hidden'}`}
            />

            {displayState === 'connecting' && (
              <div className='absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-zinc-950'>
                <div className='w-6 h-6 rounded-full border-2 border-[#1C93FF] border-t-transparent animate-spin' />
                <p className='text-[11px] font-medium text-zinc-500'>Connecting…</p>
              </div>
            )}

            {displayState === 'error' && (
              <div className='absolute inset-0 flex flex-col items-center justify-center gap-3 px-4 text-center bg-zinc-950'>
                <p className='text-xs font-semibold text-red-400'>
                  {streamState?.errorMsg ?? 'Stream error'}
                </p>
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className='flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-zinc-800 border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-zinc-100 transition-colors'
                  >
                    Retry
                  </button>
                )}
              </div>
            )}

            {isPlaying && (
              <>
                <div className='absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2 py-1 bg-red-600/90 rounded-md z-10'>
                  <span className='w-1.5 h-1.5 rounded-full bg-white animate-pulse' />
                  <span className='text-[9px] font-black tracking-widest text-white uppercase'>
                    Live
                  </span>
                </div>

                {battery !== null && (() => {
                  const { color, Icon } = batteryStyle(battery);
                  return (
                    <div
                      className='absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-md z-10'
                      style={{ color }}
                    >
                      <Icon size={11} />
                      <span className='text-[9px] font-bold font-mono'>{battery}%</span>
                    </div>
                  );
                })()}

                <span className='absolute bottom-2 right-2.5 text-[9px] font-mono text-zinc-800 select-none z-10'>
                  {device.deviceSn}
                </span>
              </>
            )}
          </>
        ) : device.status ? (
          <div className='absolute inset-0 flex flex-col items-center justify-center gap-2 text-center px-4'>
            <div className='w-9 h-9 rounded-xl bg-[#1C93FF]/10 border border-[#1C93FF]/20 flex items-center justify-center'>
              <Activity size={large ? 20 : 15} className='text-[#1C93FF]/60' />
            </div>
            <p className={`font-bold text-zinc-500 ${large ? 'text-sm' : 'text-[11px]'}`}>
              Stream Ready
            </p>
            {large && (
              <p className='text-[11px] text-zinc-700'>Use the controls below to start streaming</p>
            )}
          </div>
        ) : (
          <div className='absolute inset-0 flex flex-col items-center justify-center gap-2'>
            <WifiOff size={large ? 26 : 18} className='text-zinc-800' />
            <p className={`font-semibold text-zinc-700 ${large ? 'text-sm' : 'text-[11px]'}`}>
              Device Offline
            </p>
          </div>
        )}
      </div>
    </div>
  );
});
