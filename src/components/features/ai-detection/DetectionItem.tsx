'use client';

import { CheckCircle, Clock, ImageOff } from 'lucide-react';
import { formatTimeAgo, cn } from '@/lib/utils';
import { getConfidenceColor } from './lib/detection-utils';
import type { ThreatDetection } from '@/lib/types/threats';

interface DetectionItemProps {
  detection: ThreatDetection;
  onSelect?: (detection: ThreatDetection) => void;
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

export function DetectionItem({ detection, onSelect }: DetectionItemProps) {
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
      {/* Type dot */}
      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${typeDotColor[d.type] || 'bg-zinc-500'}`} />

      {/* Thumbnail */}
      {d.imageUrl ? (
        <div className='w-8 h-6 rounded overflow-hidden border border-zinc-700/50 bg-zinc-900 flex-shrink-0'>
          <img src={d.imageUrl} alt='' className='w-full h-full object-cover' loading='lazy' />
        </div>
      ) : (
        <div className='w-8 h-6 rounded border border-zinc-800 bg-zinc-900 flex items-center justify-center flex-shrink-0'>
          <ImageOff className='w-2.5 h-2.5 text-zinc-700' />
        </div>
      )}

      {/* Type + Confidence */}
      <div className='flex items-center gap-1.5 min-w-0'>
        <span className='text-xs font-poppins font-medium text-[#E2E2E8] capitalize truncate'>
          {d.type}
        </span>
        <span className={cn('text-xs font-mono font-poppins', getConfidenceColor(d.confidence))}>
          {(d.confidence * 100).toFixed(0)}%
        </span>
      </div>

      {/* Track + Stream */}
      <span className='text-[10px] font-mono font-poppins text-zinc-500 hidden sm:inline'>
        #{d.trackId}
      </span>
      <span className='text-[10px] font-poppins text-zinc-500 truncate hidden md:inline'>
        {d.streamId}
      </span>

      {/* Spacer */}
      <div className='flex-1' />

      {/* Reasoning preview (verified only) */}
      {d.isVerified && d.reasoning && (
        <span className='text-[10px] font-poppins text-green-500/60 truncate max-w-[140px] hidden lg:inline'>
          {d.reasoning.slice(0, 50)}...
        </span>
      )}

      {/* Status + Time */}
      {d.isVerified ? (
        <CheckCircle className='w-3.5 h-3.5 text-green-500 flex-shrink-0' />
      ) : (
        <Clock className='w-3.5 h-3.5 text-orange-500/60 flex-shrink-0' />
      )}
      <span className='text-[10px] font-poppins text-zinc-500 flex-shrink-0'>
        {formatTimeAgo(d.detectedAt)}
      </span>
    </div>
  );
}
