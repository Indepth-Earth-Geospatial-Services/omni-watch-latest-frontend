'use client';

import { useMemo, memo } from 'react';
import { Video } from 'lucide-react';
import { StreamVideoCard } from './StreamVideoCard';
import type { ThreatDetection } from '@/lib/types/threats';
import type { DJIDevice } from '@/lib/types';
import type { StreamEntry } from '@/hooks/useStreamKeys';

interface VideoGridProps {
  selectedStreamKeys: Set<string>;
  streams: StreamEntry[];
  devices: DJIDevice[];
  detections: ThreatDetection[];
}

function getGridClasses(count: number): string {
  if (count <= 1) return 'grid-cols-1';
  if (count === 2) return 'grid-cols-1 lg:grid-cols-2';
  if (count === 3) return 'grid-cols-1 lg:grid-cols-3';
  return 'grid-cols-1 lg:grid-cols-2';
}

export const VideoGrid = memo(function VideoGrid({
  selectedStreamKeys,
  streams,
  devices,
  detections,
}: VideoGridProps) {
  const activeStreams = useMemo(() => {
    return Array.from(selectedStreamKeys)
      .map((streamKey) => {
        const entry = streams.find((s) => s.streamKey === streamKey);
        if (!entry) return null;
        const device = devices.find((d) => d.deviceSn === entry.deviceSn);
        const streamDetections = detections.filter((d) => d.streamId === entry.deviceSn);
        return { streamKey, deviceSn: entry.deviceSn, device, detections: streamDetections };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null);
  }, [selectedStreamKeys, streams, devices, detections]);

  if (activeStreams.length === 0) {
    return (
      <div className='relative flex flex-col bg-[#0C0E12] overflow-hidden rounded-xl border border-zinc-800/50 flex-1 min-h-0'>
        <div className='absolute inset-0 flex flex-col items-center justify-center'>
          <div
            className='absolute inset-0 opacity-5'
            style={{
              backgroundImage:
                'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
            }}
          />
          <Video className='w-8 h-8 text-zinc-700 mb-2' />
          <p className='text-xs font-poppins text-zinc-600'>Select streams to begin monitoring</p>
        </div>
      </div>
    );
  }

  const gridClass = getGridClasses(activeStreams.length);

  return (
    <div className={`grid ${gridClass} gap-3 flex-1 min-h-0`}>
      {activeStreams.map(({ streamKey, deviceSn, device, detections: streamDetections }) => (
        <StreamVideoCard
          key={streamKey}
          streamKey={streamKey}
          deviceSn={deviceSn}
          device={device}
          detections={streamDetections}
        />
      ))}
    </div>
  );
});
