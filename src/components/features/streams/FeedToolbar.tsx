'use client';

import React, { memo } from 'react';
import { LayoutGrid, Monitor, Square } from 'lucide-react';
import type { DJIDevice } from '@/lib/types';

interface FeedToolbarProps {
  viewMode: 'single' | 'multi';
  selectedDevice: DJIDevice | null;
  streamingDevices: Map<string, string>;
  onViewModeChange: (mode: 'single' | 'multi') => void;
  onStop: (sn: string) => void;
  onStopAll: () => void;
}

export const FeedToolbar = memo(function FeedToolbar({
  viewMode,
  selectedDevice,
  streamingDevices,
  onViewModeChange,
  onStop,
  onStopAll,
}: FeedToolbarProps) {
  return (
    <div className='flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b border-zinc-800 flex-shrink-0 gap-2 min-w-0'>
      <p className='hidden sm:block text-xs font-bold text-zinc-300 truncate min-w-0 flex-shrink'>
        {viewMode === 'single' && selectedDevice
          ? selectedDevice.nickname || selectedDevice.deviceName || selectedDevice.deviceSn
          : 'All Feeds'}
      </p>

      <div className='flex items-center gap-1.5 sm:gap-2 flex-shrink-0 w-full sm:w-auto justify-end'>
        {viewMode === 'single' &&
          selectedDevice &&
          streamingDevices.has(selectedDevice.deviceSn) && (
            <button
              onClick={() => onStop(selectedDevice.deviceSn)}
              className='flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/40 transition-colors'
            >
              <Square size={11} className='hidden sm:block' />
              Stop
            </button>
          )}

        {viewMode === 'multi' && streamingDevices.size > 0 && (
          <button
            onClick={onStopAll}
            className='flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/40 transition-colors'
          >
            <Square size={11} className='hidden sm:block' />
            Stop All
            <span className='ml-0.5 text-[10px] font-black px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-300'>
              {streamingDevices.size}
            </span>
          </button>
        )}

        <div className='flex items-center gap-0.5 p-0.5 bg-zinc-900 border border-zinc-800 rounded-lg'>
          <button
            onClick={() => onViewModeChange('single')}
            className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-md text-[11px] font-bold transition-colors ${
              viewMode === 'single'
                ? 'bg-zinc-700 text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Monitor size={11} className='hidden sm:block' />
            Single
          </button>
          <button
            onClick={() => onViewModeChange('multi')}
            className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-md text-[11px] font-bold transition-colors ${
              viewMode === 'multi'
                ? 'bg-zinc-700 text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <LayoutGrid size={11} className='hidden sm:block' />
            All Feeds
          </button>
        </div>
      </div>
    </div>
  );
});
