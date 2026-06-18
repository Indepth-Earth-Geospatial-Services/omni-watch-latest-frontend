'use client';

import React from 'react';

// DJI video_type values → friendly labels shown in the toolbar
const MODES = [
  { label: 'RGB',     value: 'normal' },
  { label: 'Zoom',    value: 'zoom'   },
  { label: 'Wide',    value: 'wide'   },
  { label: 'Thermal', value: 'ir'     },
] as const;

export interface SensorToolbarProps {
  selectedVideoType?: string;
  onVideoTypeChange?: (type: string) => void;
  isStreaming?: boolean;
}

const SensorToolbar = ({
  selectedVideoType = 'zoom',
  onVideoTypeChange,
  isStreaming = false,
}: SensorToolbarProps) => {
  return (
    <div
      className='flex items-center justify-between px-1 bg-[#0C0E12] overflow-hidden w-full mb-2'
      style={{ height: '45px' }}
    >
      {/* View mode toggles */}
      <div className='flex items-center h-full gap-2 bg-[#333539CC] rounded-sm p-2'>
        {MODES.map(({ label, value }) => {
          const isActive = selectedVideoType === value;
          return (
            <button
              key={value}
              onClick={() => onVideoTypeChange?.(value)}
              disabled={isStreaming}
              title={isStreaming ? 'Stop stream to switch lens' : undefined}
              className={`h-full px-5 text-sm font-bold tracking-tight transition-all rounded-sm
                outline-none focus:outline-none focus:ring-0 select-none
                disabled:cursor-not-allowed disabled:opacity-50
                ${
                  isActive
                    ? 'bg-[#1C93FF33] text-[#1C93FF] ring-1 ring-[#1C93FF]/40 shadow-inner'
                    : 'text-[#C2C6D7] hover:text-zinc-100 hover:bg-zinc-800/30'
                }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Recording / streaming status */}
      <div className='flex items-center gap-2 pr-4'>
        <div
          className={`w-2 h-2 rounded-full transition-colors ${
            isStreaming
              ? 'bg-red-600 animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.5)]'
              : 'bg-zinc-600'
          }`}
        />
        <span
          className={`text-[10px] font-bold tracking-tighter uppercase transition-colors ${
            isStreaming ? 'text-red-500' : 'text-zinc-600'
          }`}
        >
          {isStreaming ? 'Live' : 'Idle'}
        </span>
      </div>
    </div>
  );
};

export default SensorToolbar;
