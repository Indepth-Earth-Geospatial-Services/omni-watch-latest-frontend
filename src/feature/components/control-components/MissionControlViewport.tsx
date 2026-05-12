'use client';

import React from 'react';
import Image from 'next/image';
import { Maximize2, Crosshair, Navigation } from 'lucide-react';
import SensorToolbar from './SensorToolBar';
import FlightControlActions from './FlightControlActions';

const MissionControlViewport = () => {
  // Mock heading value for the compass
  const heading = 247;

  return (
    <div
      className='relative bg-[#0C0E12] overflow-hidden flex flex-col w-full mb-2'
      style={{
        padding: '0px 0px',
        height: '700px',
      }}
    >
      <SensorToolbar />

      {/* 1. Base Layer: Primary Drone Feed */}
      <div className='relative w-full flex-1 rounded-t-lg overflow-hidden bg-black'>
        <Image
          src='/drone-live-op.jpg' // High-res direct feed from operational drone
          alt='Live Operational Feed'
          fill
          className='object-cover brightness-[0.9] contrast-[1.1]'
          priority
        />

        {/* HUD: Center Targeting Crosshair */}
        <div className='absolute inset-0 flex items-center justify-center pointer-events-none'>
          <div className='relative flex items-center justify-center'>
            <Crosshair className='text-emerald-500/50 w-16 h-16 stroke-[1px]' />
            {/* Dynamic Horizon Line (Professional detail) */}
            <div className='absolute w-48 h-[1px] bg-emerald-500/20' />
            <div className='absolute h-24 w-[1px] bg-emerald-500/20' />
          </div>
        </div>

        {/* 2. Middle Layer: Tactical Circular Compass Inset */}
        <div className='absolute bottom-6 left-6 w-40 h-40 rounded-full border border-white/10 bg-black/20 backdrop-blur-xl shadow-2xl flex items-center justify-center group overflow-hidden'>
          {/* Compass Degrees Ring */}
          <div className='absolute inset-0 rounded-full border-[1px] border-white/5 m-2' />

          {/* Heading Marks (N, S, E, W) */}
          <div className='absolute inset-0 p-3 flex flex-col justify-between items-center text-[10px] font-bold text-white/40 pointer-events-none'>
            <span>N</span>
            <span>S</span>
          </div>
          <div className='absolute inset-0 p-3 flex justify-between items-center text-[10px] font-bold text-white/40 pointer-events-none'>
            <span>W</span>
            <span>E</span>
          </div>

          {/* Rotating Compass Indicator */}
          <div
            className='relative transition-transform duration-700 ease-out'
            style={{ transform: `rotate(${heading}deg)` }}
          >
            <div className='flex flex-col items-center'>
              <Navigation className='text-emerald-400 fill-emerald-400/20' size={24} />
              <div className='absolute -top-6 text-[10px] font-mono font-bold text-emerald-400'>
                {heading}°
              </div>
            </div>
          </div>

          {/* Subtle Radar Sweep effect */}
          <div className='absolute inset-0 bg-gradient-to-tr from-emerald-500/5 to-transparent animate-spin [animation-duration:4s]' />
        </div>

        {/* 3. Top Layer: Telemetry/Scale (Bottom Right) */}
        <div className='absolute bottom-6 right-6 flex flex-col items-end gap-1 bg-white/5 backdrop-blur-md border border-white/10 px-3 py-2 rounded-md shadow-xl pointer-events-none transition-all duration-300'>
          <div className='flex items-center gap-2 mb-1'>
            <div className='w-2 h-2 rounded-full bg-emerald-500 animate-pulse' />
            <span className='text-[8px] font-bold text-emerald-500 uppercase tracking-widest'>
              Stream Active
            </span>
          </div>
          <span className='text-[10px] font-mono text-white/90 tracking-tighter leading-none'>
            Lat: 6.5244° N
          </span>
          <span className='text-[10px] font-mono text-white/90 tracking-tighter leading-none'>
            Lon: 3.3792° E
          </span>
        </div>
      </div>

      <FlightControlActions />
    </div>
  );
};

export default MissionControlViewport;
