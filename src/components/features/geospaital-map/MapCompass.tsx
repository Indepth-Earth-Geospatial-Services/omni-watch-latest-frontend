'use client';
import { memo } from 'react';

interface MapCompassProps {
  heading: number; // selected drone heading 0–360
}

export const MapCompass = memo(({ heading }: MapCompassProps) => (
  <div className='flex flex-col items-center gap-1'>
    {/* Compass rose */}
    <div className='relative w-16 h-16'>
      {/* Outer ring */}
      <div className='absolute inset-0 rounded-full bg-neutral-950/90 border border-gray-700 shadow-xl' />

      {/* Tick marks */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
        <div
          key={deg}
          className='absolute inset-0 flex justify-center'
          style={{ transform: `rotate(${deg}deg)` }}
        >
          <div className={`mt-1 rounded-full ${deg % 90 === 0 ? 'w-0.5 h-2 bg-gray-500' : 'w-px h-1.5 bg-gray-700'}`} />
        </div>
      ))}

      {/* Cardinal labels */}
      <div className='absolute inset-0 flex items-start justify-center pt-1'>
        <span className='text-[10px] font-bold text-red-400 leading-none'>N</span>
      </div>
      <div className='absolute inset-0 flex items-end justify-center pb-1'>
        <span className='text-[10px] text-gray-500 leading-none'>S</span>
      </div>
      <div className='absolute inset-0 flex items-center justify-start pl-1'>
        <span className='text-[10px] text-gray-500 leading-none'>W</span>
      </div>
      <div className='absolute inset-0 flex items-center justify-end pr-1'>
        <span className='text-[10px] text-gray-500 leading-none'>E</span>
      </div>

      {/* Heading needle — rotates to match drone heading */}
      <div
        className='absolute inset-0 flex items-center justify-center'
        style={{ transform: `rotate(${heading}deg)` }}
      >
        <div className='relative flex flex-col items-center' style={{ height: 44 }}>
          {/* North half (yellow — front of drone) */}
          <div className='w-1.5 rounded-t-full bg-gradient-to-t from-yellow-500 to-yellow-300' style={{ height: 20 }} />
          {/* South half (gray — tail) */}
          <div className='w-1.5 rounded-b-full bg-gray-600' style={{ height: 14 }} />
        </div>
      </div>

      {/* Centre pin */}
      <div className='absolute inset-0 flex items-center justify-center'>
        <div className='w-2.5 h-2.5 rounded-full bg-white border-2 border-neutral-700' />
      </div>
    </div>

    {/* Numeric heading */}
    <div className='text-[11px] font-mono text-gray-300 bg-neutral-950/80 px-2 py-0.5 rounded border border-gray-700'>
      {heading.toFixed(0)}°
    </div>
  </div>
));

MapCompass.displayName = 'MapCompass';
