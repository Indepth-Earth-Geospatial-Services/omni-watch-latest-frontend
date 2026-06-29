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
      className='flex items-center justify-between px-1 bg-background overflow-hidden w-full mb-2'
      style={{ height: '45px' }}
    >
      {/* View mode toggles */}
      <div className='flex items-center h-full gap-2 bg-muted rounded-sm p-2'>
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
                    ? 'bg-theme-accent/20 text-theme-accent ring-1 ring-theme-accent/40 shadow-inner'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
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
