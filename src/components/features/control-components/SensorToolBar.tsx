'use client';

import React, { useState } from 'react';

type ViewMode = 'RGB' | 'Thermal' | 'Wide' | 'Zoom';

const SensorToolbar = () => {
  const [activeMode, setActiveMode] = useState<ViewMode>('RGB');

  const modes: ViewMode[] = ['RGB', 'Thermal', 'Wide', 'Zoom'];

  return (
    <div
      className='flex items-center justify-between px-1 bg-[#0C0E12] overflow-hidden w-full mb-2'
      style={{ height: '45px' }}
    >
      {/* 1. Left: View Mode Toggles */}
      <div className='flex items-center h-full gap-2 bg-[#333539CC] rounded-sm p-2'>
        {modes.map((mode) => {
          const isActive = activeMode === mode;
          return (
            <button
              key={mode}
              onClick={() => setActiveMode(mode)}
              // outline-none removes the flash.
              // Using ring instead of border prevents layout "jumps".
              className={`h-full px-5 text-sm font-bold tracking-tight transition-all rounded-sm
                outline-none focus:outline-none focus:ring-0 select-none
                ${
                  isActive
                    ? 'bg-[#1C93FF33] text-[#1C93FF] ring-1 ring-[#1C93FF]/40 shadow-inner'
                    : 'text-[#C2C6D7] hover:text-zinc-100 hover:bg-zinc-800/30'
                }`}
            >
              {mode}
            </button>
          );
        })}
      </div>

      {/* 2. Right: Recording Status */}
      <div className='flex items-center gap-2 pr-4'>
        <div className='w-2 h-2 rounded-full bg-red-600 animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.5)]' />
        <div className='flex flex-col items-start leading-none'>
          <span className='text-[10px] font-bold text-zinc-500 tracking-tighter uppercase'>
            Rec
          </span>
        </div>
      </div>
    </div>
  );
};

export default SensorToolbar;
