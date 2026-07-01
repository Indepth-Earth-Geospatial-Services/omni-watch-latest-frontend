'use client';

import { memo } from 'react';
import Image from 'next/image';
import { CheckCircle, Clock, ImageOff, MapPin, X } from 'lucide-react';
import { formatTimeAgo, cn } from '@/lib/utils';
import { getConfidenceColor } from '@/components/features/ai-detection/lib/detection-utils';
import type { ThreatDetection } from '@/lib/types/threats';

interface AlertListItemProps {
  detection: ThreatDetection;
  onSelect?: (detection: ThreatDetection) => void;
  onApprove?: (detection: ThreatDetection) => void;
  onDismiss?: (detection: ThreatDetection) => void;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
  isPending?: boolean;
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

export const AlertListItem = memo(function AlertListItem({
  detection,
  onSelect,
  onApprove,
  onDismiss,
  selected,
  onToggleSelect,
  isPending = false,
}: AlertListItemProps) {
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
        'flex items-center gap-2 px-3 py-2 transition-colors border-b border-zinc-800/20 cursor-pointer group',
        'hover:bg-zinc-800/30',
        d.status === 'approved' && 'bg-green-500/5',
        d.status === 'dismissed' && 'bg-zinc-800/10 opacity-60'
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
      <div
        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${typeDotColor[d.type] || 'bg-zinc-500'}`}
      />

      {/* Thumbnail */}
      {d.imageUrl ? (
        <div className='relative w-10 h-7 rounded overflow-hidden border border-zinc-700/50 bg-zinc-900 flex-shrink-0'>
          <Image src={d.imageUrl} alt='' fill className='object-cover' unoptimized />
        </div>
      ) : (
        <div className='w-10 h-7 rounded border border-zinc-800 bg-zinc-900 flex items-center justify-center flex-shrink-0'>
          <ImageOff className='w-2.5 h-2.5 text-zinc-700' />
        </div>
      )}

      {/* Type + Status badge */}
      <div className='flex items-center gap-1.5 min-w-0'>
        <span className='text-xs font-ui font-medium text-foreground capitalize truncate'>
          {d.type}
        </span>
        <span
          className={cn(
            'text-[9px] px-1.5 py-0.5 rounded font-bold uppercase',
            d.isVerified ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'
          )}
        >
          {d.isVerified ? 'Verified' : 'YOLO'}
        </span>
        {d.status === 'approved' && (
          <span className='text-[9px] px-1.5 py-0.5 rounded font-bold uppercase bg-purple-500/20 text-purple-400'>
            Approved
          </span>
        )}
        {d.status === 'dismissed' && (
          <span className='text-[9px] px-1.5 py-0.5 rounded font-bold uppercase bg-zinc-600/30 text-zinc-500'>
            Dismissed
          </span>
        )}
      </div>

      {/* Confidence */}
      <span className={cn('text-xs font-mono font-ui flex-shrink-0', getConfidenceColor(d.confidence))}>
        {(d.confidence * 100).toFixed(0)}%
      </span>

      {/* Track + Stream */}
      <span className='text-[10px] font-mono font-ui text-zinc-500 flex-shrink-0 hidden sm:inline'>
        #{d.trackId}
      </span>
      <span className='text-[10px] font-ui text-zinc-500 truncate flex-shrink-0 hidden md:inline max-w-[100px]'>
        {d.streamId}
      </span>

      {/* GPS indicator */}
      {d.droneLatitude != null && d.droneLongitude != null && (
        <MapPin className='w-3 h-3 text-zinc-600 flex-shrink-0 hidden lg:inline' />
      )}

      {/* Spacer */}
      <div className='flex-1' />

      {/* Reasoning preview (verified only) */}
      {d.isVerified && d.reasoning && (
        <span className='text-[10px] font-ui text-green-500/60 truncate max-w-[140px] hidden lg:inline'>
          {d.reasoning.slice(0, 50)}...
        </span>
      )}

      {/* Inline action buttons */}
      {(onApprove || onDismiss) && d.status !== 'approved' && d.status !== 'dismissed' && (
        <div className='flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0'>
          {onDismiss && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDismiss(d);
              }}
              disabled={isPending}
              className='p-1 rounded hover:bg-zinc-700/50 transition-colors disabled:opacity-50'
              title='Dismiss'
            >
              <X className='w-3.5 h-3.5 text-zinc-500 hover:text-zinc-300' />
            </button>
          )}
          {onApprove && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onApprove(d);
              }}
              disabled={isPending}
              className='p-1 rounded hover:bg-green-500/10 transition-colors disabled:opacity-50'
              title='Approve'
            >
              <CheckCircle className='w-3.5 h-3.5 text-green-500/60 hover:text-green-400' />
            </button>
          )}
        </div>
      )}

      {/* Status icon + Time */}
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
