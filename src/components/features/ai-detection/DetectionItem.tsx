'use client';

import { memo } from 'react';
import Image from 'next/image';
import { CheckCircle, Clock, ImageOff, MapPin } from 'lucide-react';
import { formatTimeAgo, cn } from '@/lib/utils';
import { getConfidenceColor } from './lib/detection-utils';
import type { ThreatDetection } from '@/lib/types/threats';

interface DetectionItemProps {
  detection: ThreatDetection;
  onSelect?: (detection: ThreatDetection) => void;
  onViewOnMap?: (detection: ThreatDetection) => void;
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

export const DetectionItem = memo(function DetectionItem({ detection, onSelect, onViewOnMap, selected, onToggleSelect }: DetectionItemProps) {
  const d = detection;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onSelect && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onSelect(d);
    }
  };

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 transition-colors border-b border-zinc-800/20 cursor-pointer group',
        'hover:bg-zinc-800/30'
      )}
      onClick={onSelect ? () => onSelect(d) : undefined}
      onKeyDown={handleKeyDown}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
    >
      {/* Selection checkbox */}
      {onToggleSelect && (
        <input
          type='checkbox'
          checked={selected ?? false}
          onChange={() => onToggleSelect(d.id)}
          className='w-4 h-4 rounded border-zinc-600 bg-zinc-800 accent-primary cursor-pointer flex-shrink-0'
          onClick={(e) => e.stopPropagation()}
        />
      )}

      {/* Type dot */}
      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${typeDotColor[d.type] || 'bg-zinc-500'}`} />

      {/* Thumbnail */}
      {d.imageUrl ? (
        <div className='relative w-8 h-6 rounded overflow-hidden border border-zinc-700/50 bg-zinc-900 flex-shrink-0'>
          <Image src={d.imageUrl} alt='' fill className='object-cover' unoptimized />
        </div>
      ) : (
        <div className='w-8 h-6 rounded border border-zinc-800 bg-zinc-900 flex items-center justify-center flex-shrink-0'>
          <ImageOff className='w-2.5 h-2.5 text-zinc-700' />
        </div>
      )}

      {/* Type + Confidence */}
      <div className='flex items-center gap-1.5 min-w-0'>
        <span className='text-xs font-ui font-medium text-foreground capitalize truncate'>
          {d.type}
        </span>
        <span className={cn('text-xs font-mono font-ui', getConfidenceColor(d.confidence))}>
          {(d.confidence * 100).toFixed(0)}%
        </span>
      </div>

      {/* Track + Stream */}
      <span className='text-[10px] font-mono font-ui text-zinc-500 hidden sm:inline'>
        #{d.trackId}
      </span>
      <span className='text-[10px] font-ui text-zinc-500 truncate hidden md:inline'>
        {d.streamId}
      </span>

      {/* Spacer */}
      <div className='flex-1' />

      {/* View on Map (hover only) */}
      {onViewOnMap && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewOnMap(d);
          }}
          className='opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-zinc-700/50 flex-shrink-0'
          title='View on Map'
        >
          <MapPin className='w-3 h-3 text-primary' />
        </button>
      )}

      {/* Reasoning preview (verified only) */}
      {d.isVerified && d.reasoning && (
        <span className='text-[10px] font-ui text-green-500/60 truncate max-w-[140px] hidden lg:inline'>
          {d.reasoning.slice(0, 50)}...
        </span>
      )}

      {/* Status + Time */}
      {d.isVerified ? (
        <CheckCircle className='w-3.5 h-3.5 text-green-500 flex-shrink-0' />
      ) : (
        <Clock className='w-3.5 h-3.5 text-orange-500/60 flex-shrink-0' />
      )}
      <span className='text-[10px] font-ui text-zinc-500 flex-shrink-0'>
        {formatTimeAgo(d.detectedAt)}
      </span>
    </div>
  );
});
