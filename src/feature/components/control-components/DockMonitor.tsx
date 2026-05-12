'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { DoorOpen, Monitor } from 'lucide-react';

const DockMonitor = () => {
  const [isDoorOpen, setIsDoorOpen] = useState(true);

  return (
    <div
      className='relative flex flex-col bg-[#1A1C20] border border-zinc-800/50 rounded-lg overflow-hidden shadow-2xl'
      style={{ width: '301px', height: '336px' }}
    >
      {/* 1. Camera Viewport */}
      <div className='relative flex-1 bg-black overflow-hidden group'>
        <Image
          src='/dock-camera-feed.jpg' // Replace with CAM-02 stream
          alt='Dock Camera Feed'
          fill
          className='object-cover opacity-80'
        />

        {/* Status Badge */}
        <div
          className={`absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 border rounded transition-colors
          ${
            isDoorOpen
              ? 'bg-[#45F0CF1A] border-[#45F0CF80] text-[#45F0CF]'
              : 'bg-zinc-800/50 border-zinc-700 text-zinc-500'
          }`}
        >
          <DoorOpen size={12} />
          <span className='text-[9px] font-black tracking-widest uppercase'>
            {isDoorOpen ? 'Door Open' : 'Door Closed'}
          </span>
        </div>

        {/* Altitude Visualizer (Right Side) */}
        {/* <div className='absolute right-3 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2'>
          <span className='text-[8px] font-bold text-zinc-500 uppercase'>Alt</span>
          <div className='relative h-32 w-1.5 bg-zinc-800/80 rounded-full overflow-hidden border border-white/5'>
            <div
              className='absolute bottom-0 w-full bg-blue-500 transition-all duration-700'
              style={{ height: '40%' }} // 120m representative height
            />
          </div>
          <span className='text-[10px] font-mono text-blue-400 font-bold'>120m</span>
        </div> */}

        {/* Camera ID Overlay */}
        <div className='absolute top-3 right-3 text-right'>
          <span className='block text-[8px] font-bold text-zinc-500 uppercase tracking-tighter'>
            Cam
          </span>
          <span className='block text-[10px] font-mono text-zinc-400 -mt-1'>-02</span>
        </div>
      </div>

      {/* 2. Hardware Controls */}
      <div className='flex gap-2 p-4 bg-[#333539E5] border-t border-zinc-800/50'>
        <button
          onClick={() => setIsDoorOpen(true)}
          className={`flex-1 py-2 text-xs font-bold rounded border transition-all
            ${
              isDoorOpen
                ? 'bg-[#45F0CF33] border-[#45F0CF80] text-[#45F0CF] shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                : 'bg-[#1E2024] border-[#424754] text-white hover:text-zinc-300'
            }`}
        >
          Open
        </button>
        <button
          onClick={() => setIsDoorOpen(false)}
          className={`flex-1 py-2 text-xs font-bold rounded border transition-all
            ${
              !isDoorOpen
                ? 'bg-[#45F0CF33] border-[#45F0CF80] text-[#45F0CF] shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                : 'bg-[#1E2024] border-[#424754] text-white hover:text-zinc-300'
            }`}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default DockMonitor;
