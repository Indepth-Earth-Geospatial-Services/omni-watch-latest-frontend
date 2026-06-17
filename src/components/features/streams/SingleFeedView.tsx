'use client';

import React, { memo } from 'react';
import { Activity, Box } from 'lucide-react';
import { VideoArea } from './VideoArea';
import { StreamControlPanel } from './StreamControlPanel';
import { isDrone, toStream } from './stream-utils';
import type { StreamState } from './WebRTCPlayer';
import type { DJIDevice } from '@/lib/types';

interface SingleFeedViewProps {
  device: DJIDevice;
  allDevices: DJIDevice[];
  onSwitch: (sn: string) => void;
  stopSignal: number;
  onStreamingChange: (isStreaming: boolean, url?: string) => void;
  activeStreamUrl: string | null;
  mediaStream: MediaStream | null;
  streamState: { state: StreamState; errorMsg?: string } | null;
  onRetry: () => void;
}

export const SingleFeedView = memo(function SingleFeedView({
  device,
  allDevices,
  onSwitch,
  stopSignal,
  onStreamingChange,
  activeStreamUrl,
  mediaStream,
  streamState,
  onRetry,
}: SingleFeedViewProps) {
  const drone = isDrone(device);

  return (
    <div className='flex flex-col h-full p-3 sm:p-5 gap-3 sm:gap-4'>
      {/* Device header + switcher */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 flex-shrink-0'>
        <div className='flex items-center gap-3'>
          <div
            className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 ${
              drone ? 'bg-blue-500/10 border-blue-500/20' : 'bg-cyan-500/10 border-cyan-500/20'
            }`}
          >
            {drone ? (
              <Activity size={15} className='text-blue-400' />
            ) : (
              <Box size={15} className='text-cyan-400' />
            )}
          </div>
          <div className='min-w-0'>
            <p className='text-sm font-bold text-zinc-100 truncate'>
              {device.nickname || device.deviceName || device.deviceSn}
            </p>
            <p className='text-[10px] font-mono text-zinc-600 truncate'>{device.deviceSn}</p>
          </div>
          <span
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border flex-shrink-0 ${
              device.status
                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                : 'text-zinc-600 bg-zinc-800/60 border-zinc-700/50'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${device.status ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`}
            />
            {device.status ? 'Online' : 'Offline'}
          </span>
        </div>

        {allDevices.length > 1 && (
          <div className='flex items-center gap-1 flex-wrap'>
            <span className='text-[10px] text-zinc-600 mr-0.5'>Switch:</span>
            {allDevices.map((d) => (
              <button
                key={d.deviceSn}
                onClick={() => onSwitch(d.deviceSn)}
                title={d.nickname || d.deviceName || d.deviceSn}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                  device.deviceSn === d.deviceSn
                    ? 'bg-[#1C93FF] border-[#1C93FF] text-white'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
                }`}
              >
                {d.nickname || d.deviceSn.slice(-6)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Video */}
      <div className='flex-1 min-h-0'>
        <VideoArea
          device={device}
          mediaStream={mediaStream}
          streamState={streamState}
          isActive={!!activeStreamUrl}
          onRetry={onRetry}
          large
        />
      </div>

      {/* Controls */}
      <div className='flex-shrink-0'>
        <StreamControlPanel
          stream={toStream(device)}
          externalStopSignal={stopSignal}
          onStreamingChange={onStreamingChange}
          activeStreamUrl={activeStreamUrl}
        />
      </div>
    </div>
  );
});
