'use client';

import { memo } from 'react';
import Image from 'next/image';
import { MapPin, ImageOff, CheckCircle, Clock, Crosshair } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn, formatTimeAgo } from '@/lib/utils';
import { getConfidenceColor } from './lib/detection-utils';
import type { ThreatDetection } from '@/lib/types/threats';

interface DetectionCardProps {
  detection: ThreatDetection;
  onSelect?: (detection: ThreatDetection) => void;
  className?: string;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
}

const typeDotColor: Record<string, string> = {
  person: 'bg-blue-400',
  vehicle: 'bg-green-400',
  boat: 'bg-cyan-400',
  weapon: 'bg-red-400',
  suspicious: 'bg-orange-400',
  drone: 'bg-purple-400',
  animal: 'bg-yellow-400',
};

export const DetectionCard = memo(function DetectionCard({ detection, onSelect, className, selected, onToggleSelect }: DetectionCardProps) {
  const d = detection;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onSelect && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onSelect(d);
    }
  };

  return (
    <Card
      className={cn(
        'bg-background border-border/50 transition-colors overflow-hidden',
        onSelect && 'cursor-pointer hover:bg-zinc-800/20',
        d.isVerified ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-orange-500',
        className
      )}
      onClick={onSelect ? () => onSelect(d) : undefined}
      onKeyDown={handleKeyDown}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
    >
      {/* Thumbnail */}
      {d.imageUrl ? (
        <div className='relative aspect-video w-full border-b border-border/50 bg-secondary'>
          <Image
            src={d.imageUrl}
            alt={`${d.type} detection`}
            fill
            className='object-cover'
            unoptimized
          />
          {onToggleSelect && (
            <div className='absolute top-2 right-2 z-10'>
              <input
                type='checkbox'
                checked={selected ?? false}
                onChange={() => onToggleSelect(d.id)}
                className='w-4 h-4 rounded border-zinc-600 bg-secondary accent-primary cursor-pointer'
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
        </div>
      ) : (
        <div className='relative aspect-video w-full border-b border-border/50 bg-secondary flex items-center justify-center'>
          <ImageOff className='w-6 h-6 text-zinc-700' />
          {onToggleSelect && (
            <div className='absolute top-2 right-2 z-10'>
              <input
                type='checkbox'
                checked={selected ?? false}
                onChange={() => onToggleSelect(d.id)}
                className='w-4 h-4 rounded border-zinc-600 bg-secondary accent-primary cursor-pointer'
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
        </div>
      )}

      <CardContent className='p-3 space-y-2'>
        {/* Header row: Type + Status + Confidence */}
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <div
              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                typeDotColor[d.type] || 'bg-zinc-500'
              }`}
            />
            <span className='text-xs font-ui font-medium text-foreground capitalize'>
              {d.type}
            </span>
            <span
              className={cn(
                'text-[10px] px-1.5 py-0.5 rounded text-white',
                d.isVerified ? 'bg-green-500' : 'bg-orange-500'
              )}
            >
              {d.isVerified ? 'Verified' : 'Pending'}
            </span>
          </div>
          <span className={cn('text-xs font-mono font-ui', getConfidenceColor(d.confidence))}>
            {(d.confidence * 100).toFixed(0)}%
          </span>
        </div>

        {/* Metadata row: Track + Stream + Time */}
        <div className='flex items-center gap-2 text-[10px] font-ui text-muted-foreground'>
          <span className='font-mono'>#{d.trackId}</span>
          <span className='truncate'>{d.streamId}</span>
          <div className='flex-1' />
          <span className='flex items-center gap-1 flex-shrink-0'>
            <Clock className='w-2.5 h-2.5' />
            {formatTimeAgo(d.detectedAt)}
          </span>
        </div>

        {/* GPS row */}
        {d.droneLatitude != null && d.droneLongitude != null && (
          <div className='flex items-center gap-1 text-[10px] font-ui text-muted-foreground'>
            <MapPin className='w-2.5 h-2.5 flex-shrink-0' />
            <span className='font-mono'>
              {d.droneLatitude.toFixed(6)}, {d.droneLongitude.toFixed(6)}
            </span>
          </div>
        )}

        {/* Reasoning preview */}
        {d.isVerified && d.reasoning && (
          <p className='text-[10px] font-ui text-green-500/60 line-clamp-2'>
            {d.reasoning.slice(0, 80)}
            {d.reasoning.length > 80 ? '...' : ''}
          </p>
        )}
      </CardContent>
    </Card>
  );
});
