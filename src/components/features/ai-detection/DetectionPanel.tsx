'use client';

import { memo } from 'react';
import { AlertTriangle, ShieldCheck, Loader2 } from 'lucide-react';
import { DetectionItem } from './DetectionItem';
import type { ThreatDetection } from '@/lib/types/threats';

interface DetectionPanelProps {
  title: string;
  accentColor: 'orange' | 'red';
  detections: ThreatDetection[];
  onSelectDetection?: (detection: ThreatDetection) => void;
  onViewOnMap?: (detection: ThreatDetection) => void;
  emptyMessage?: string;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onToggleAll?: () => void;
}

const accentConfig = {
  orange: {
    border: 'border-l-orange-500',
    dot: 'bg-orange-500',
    icon: <AlertTriangle size={12} className='text-orange-500' />,
  },
  red: {
    border: 'border-l-red-500',
    dot: 'bg-red-500',
    icon: <ShieldCheck size={12} className='text-red-500' />,
  },
};

export const DetectionPanel = memo(function DetectionPanel({
  title,
  accentColor,
  detections,
  onSelectDetection,
  onViewOnMap,
  emptyMessage = 'Waiting for detections...',
  selectedIds,
  onToggleSelect,
  onToggleAll,
}: DetectionPanelProps) {
  const accent = accentConfig[accentColor];
  const allChecked = selectedIds && detections.length > 0 && selectedIds.size === detections.length;
  const isConnectingMessage = emptyMessage.toLowerCase().includes('connecting') || emptyMessage.toLowerCase().includes('reconnecting');

  return (
    <div className='flex flex-col bg-[#0C0D10] border border-zinc-800/50 rounded-xl overflow-hidden w-full lg:w-80 flex-shrink-0'>
      {/* Header */}
      <div className='flex items-center justify-between px-3 py-2.5 border-b border-zinc-800/50'>
        <div className='flex items-center gap-2'>
          {onToggleAll && (
            <input
              type='checkbox'
              checked={allChecked}
              onChange={onToggleAll}
              className='w-3.5 h-3.5 rounded border-zinc-600 bg-zinc-800 accent-[#1C93FF] cursor-pointer'
            />
          )}
          <div className={`w-1 h-4 rounded-full ${accent.dot}`} />
          <span className='text-xs font-semibold font-poppins uppercase tracking-wider text-[#8C90A0]'>
            {title}
          </span>
        </div>
        <span className='text-[10px] font-poppins px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-500'>
          {detections.length}
        </span>
      </div>

      {/* Detection list */}
      <div className='flex-1 overflow-y-auto min-h-0'>
        {detections.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-8 px-3 text-center'>
            {isConnectingMessage ? (
              <Loader2 size={12} className='text-zinc-600 animate-spin' />
            ) : (
              <div className='animate-pulse'>{accent.icon}</div>
            )}
            <p className='text-xs font-poppins text-zinc-600 mt-2'>{emptyMessage}</p>
          </div>
        ) : (
          detections.map((d) => (
            <DetectionItem
              key={d.id}
              detection={d}
              onSelect={onSelectDetection}
              onViewOnMap={onViewOnMap}
              selected={selectedIds?.has(d.id)}
              onToggleSelect={onToggleSelect}
            />
          ))
        )}
      </div>
    </div>
  );
});
