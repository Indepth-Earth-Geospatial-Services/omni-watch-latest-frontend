'use client';

import React, { memo } from 'react';
import { PlaneTakeoff } from 'lucide-react';
import { FeedCard } from './FeedCard';
import type { StreamState } from './WebRTCPlayer';
import type { DJIDevice } from '@/lib/types';

interface MultiFeedViewProps {
  devices: DJIDevice[];
  onExpand: (sn: string) => void;
  stopSignals: Map<string, number>;
  onStreamingChange: (sn: string, isStreaming: boolean, url?: string) => void;
  streamingDevices: Map<string, string>;
  mediaStreams: Map<string, MediaStream | null>;
  streamStates: Map<string, { state: StreamState; errorMsg?: string }>;
  onRetryDevice: (sn: string) => void;
}

export const MultiFeedView = memo(function MultiFeedView({
  devices,
  onExpand,
  stopSignals,
  onStreamingChange,
  streamingDevices,
  mediaStreams,
  streamStates,
  onRetryDevice,
}: MultiFeedViewProps) {
  if (devices.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center h-full gap-3 py-16 text-center'>
        <PlaneTakeoff className='w-8 h-8 text-zinc-700' />
        <p className='text-sm text-zinc-600'>
          Devices are assigned but not yet bound to the workspace.
        </p>
      </div>
    );
  }

  return (
    <div className='p-4'>
      <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4'>
        {devices.map((device) => (
          <FeedCard
            key={device.deviceSn}
            device={device}
            onExpand={() => onExpand(device.deviceSn)}
            stopSignal={stopSignals.get(device.deviceSn) ?? 0}
            onStreamingChange={(s, url) => onStreamingChange(device.deviceSn, s, url)}
            activeStreamUrl={streamingDevices.get(device.deviceSn) ?? null}
            mediaStream={mediaStreams.get(device.deviceSn) ?? null}
            streamState={streamStates.get(device.deviceSn) ?? null}
            onRetry={() => onRetryDevice(device.deviceSn)}
          />
        ))}
      </div>
    </div>
  );
});
