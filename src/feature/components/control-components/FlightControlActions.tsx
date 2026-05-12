'use client';

import React, { useState } from 'react';
import { Pause, AlertTriangle, Home, Play } from 'lucide-react';

type FlightCommand = 'PAUSE' | 'LAND' | 'RTH' | 'NONE';

const FlightControlActions = () => {
  const [activeCommand, setActiveCommand] = useState<FlightCommand>('NONE');

  const handleCommand = (cmd: FlightCommand) => {
    setActiveCommand((prev) => (prev === cmd ? 'NONE' : cmd));
  };

  // Professional Glow Layer: Single color, breathing effect
  const ActiveGlow = ({ colorClass }: { colorClass: string }) => (
    <div
      className={`absolute inset-0 rounded-md z-0 pointer-events-none animate-active-glow ring-2 ${colorClass}`}
    />
  );

  return (
    <div
      className='flex items-center gap-[8px] bg-[#333539E5] border-t border-[#42475426] w-full p-4 rounded-b-lg'
      style={{ height: '65px' }}
    >
      {/* 1. Pause Mission - Theme: Zinc/Slate */}
      <div className='relative flex-1 h-full'>
        {activeCommand === 'PAUSE' && (
          <ActiveGlow colorClass='ring-zinc-400/30 shadow-[0_0_15px_rgba(161,161,170,0.2)]' />
        )}
        <button
          onClick={() => handleCommand('PAUSE')}
          className={`relative z-10 w-full h-full flex items-center justify-center gap-2 rounded border transition-all outline-none select-none group focus:outline-none focus:ring-0
            ${
              activeCommand === 'PAUSE'
                ? 'bg-[#1E2024] text-white border-zinc-400 shadow-inner'
                : 'bg-[#1E2024]/60 border-zinc-700/50 text-white hover:text-zinc-300 hover:border-zinc-600'
            }`}
        >
          {activeCommand === 'PAUSE' ? (
            <Play size={16} fill='white' />
          ) : (
            <Pause size={16} className='group-hover:scale-110 transition-transform' />
          )}
          <span className='text-[10px] font-bold tracking-[0.15em] uppercase'>
            {activeCommand === 'PAUSE' ? 'Resume' : 'Pause'}
          </span>
        </button>
      </div>

      {/* 2. Emergency LAND - Theme: Red */}
      <div className='relative flex-1 h-full'>
        {activeCommand === 'LAND' && (
          <ActiveGlow colorClass='ring-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.3)]' />
        )}
        <button
          onClick={() => handleCommand('LAND')}
          className={`relative z-10 w-full h-full flex items-center justify-center gap-2 rounded border transition-all outline-none select-none group focus:outline-none focus:ring-0
            ${
              activeCommand === 'LAND'
                ? 'bg-red-600 text-white border-red-400 scale-[0.98]'
                : 'bg-red-950/40 border-red-900/50 text-red-500/70 hover:bg-red-900/40 hover:text-red-400'
            }`}
        >
          <AlertTriangle size={16} fill={activeCommand === 'LAND' ? 'white' : 'transparent'} />
          <span className='text-[10px] font-black tracking-[0.15em] uppercase'>
            {activeCommand === 'LAND' ? 'Landing...' : 'Land'}
          </span>
        </button>
      </div>

      {/* 3. Return to Home - Theme: Indigo/Violet */}
      <div className='relative flex-1 h-full'>
        {activeCommand === 'RTH' && (
          <ActiveGlow colorClass='ring-indigo-500/40 shadow-[0_0_20px_rgba(99,102,241,0.3)]' />
        )}
        <button
          onClick={() => handleCommand('RTH')}
          className={`relative z-10 w-full h-full flex items-center justify-center gap-2 rounded border transition-all outline-none select-none group focus:outline-none focus:ring-0
            ${
              activeCommand === 'RTH'
                ? 'bg-indigo-600 text-white border-indigo-400'
                : 'bg-indigo-950/40 border-indigo-900/50 text-indigo-500/70 hover:bg-indigo-900/40 hover:border-indigo-400 hover:text-indigo-300'
            }`}
        >
          <Home size={16} fill={activeCommand === 'RTH' ? 'white' : 'transparent'} />
          <span className='text-[10px] font-bold tracking-[0.15em] uppercase'>
            {activeCommand === 'RTH' ? 'Returning' : 'RTH'}
          </span>
        </button>
      </div>
    </div>
  );
};

export default FlightControlActions;
