'use client';

import React, { memo } from 'react';
import { Activity, Box, Maximize2 } from 'lucide-react';
import { VideoArea } from './VideoArea';
import { StreamControlPanel } from './StreamControlPanel';
import { isDrone, toStream } from './stream-utils';
import type { StreamState } from './WebRTCPlayer';
import type { DJIDevice } from '@/lib/types';

interface FeedCardProps {
  device: DJIDevice;
  onExpand: () => void;
  stopSignal: number;
  onStreamingChange: (isStreaming: boolean, url?: string) => void;
  activeStreamUrl: string | null;
  mediaStream: MediaStream | null;
  streamState: { state: StreamState; errorMsg?: string } | null;
  onRetry: () => void;
}

export const FeedCard = memo(function FeedCard({
  device,
  onExpand,
  stopSignal,
  onStreamingChange,
  activeStreamUrl,
  mediaStream,
  streamState,
  onRetry,
}: FeedCardProps) {
  const drone = isDrone(device);

  return (
    <div
      className={`flex flex-col bg-zinc-900/40 border rounded-xl overflow-hidden transition-colors ${
        device.status ? 'border-zinc-800 hover:border-zinc-700' : 'border-zinc-800/40'
      }`}
    >
      <div className='flex items-center justify-between px-3.5 py-3 border-b border-zinc-800/60'>
        <div className='flex items-center gap-2 min-w-0'>
          <div
            className={`w-6 h-6 rounded border flex items-center justify-center flex-shrink-0 ${
              drone ? 'bg-blue-500/10 border-blue-500/20' : 'bg-cyan-500/10 border-cyan-500/20'
            }`}
          >
            {drone ? (
              <Activity size={11} className='text-blue-400' />
            ) : (
              <Box size={11} className='text-cyan-400' />
            )}
          </div>
          <div className='min-w-0'>
            <p className='text-xs font-bold text-zinc-200 truncate'>
              {device.nickname || device.deviceName || device.deviceSn}
            </p>
            <p className='text-[9px] font-mono text-zinc-600 truncate'>{device.deviceSn}</p>
          </div>
        </div>
        <div className='flex items-center gap-2 flex-shrink-0'>
          <span
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${
              device.status
                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                : 'text-zinc-600 bg-zinc-800/50 border-zinc-700/50'
            }`}
          >
            <span
              className={`w-1 h-1 rounded-full ${device.status ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`}
            />
            {device.status ? 'Online' : 'Offline'}
          </span>
          <button
            onClick={onExpand}
            title='Expand to single feed'
            className='p-1 rounded text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-colors'
          >
            <Maximize2 size={11} />
          </button>
        </div>
      </div>

      <VideoArea
        device={device}
        mediaStream={mediaStream}
        streamState={streamState}
        isActive={!!activeStreamUrl}
        onRetry={onRetry}
      />

      <div className='px-3.5 py-3 border-t border-zinc-800/40'>
        {drone ? (
          <StreamControlPanel
            stream={toStream(device)}
            externalStopSignal={stopSignal}
            onStreamingChange={onStreamingChange}
            activeStreamUrl={activeStreamUrl}
          />
        ) : (
          <p className='text-[10px] text-zinc-700 italic text-center py-0.5'>
            Streaming not available for docks
          </p>
        )}
      </div>
    </div>
  );
});
