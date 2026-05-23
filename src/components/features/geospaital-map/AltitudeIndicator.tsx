'use client';
import { memo } from 'react';

interface AltitudeIndicatorProps {
  altitude: number;   // current altitude in metres
  maxAlt?: number;    // scale ceiling in metres
}

export const AltitudeIndicator = memo(
  ({ altitude, maxAlt = 400 }: AltitudeIndicatorProps) => {
    const pct = Math.min((altitude / maxAlt) * 100, 100);

    // Colour gradient: green → yellow → red as altitude increases
    const fillColor =
      pct > 75 ? '#f87171' : pct > 40 ? '#facc15' : '#34d399';

    return (
      <div className='flex flex-col items-center gap-1'>
        <span className='text-[10px] font-bold text-gray-500 uppercase tracking-wider'>ALT</span>

        {/* Vertical bar */}
        <div className='relative w-5 h-28 bg-neutral-900/90 rounded-full border border-gray-700 shadow-xl overflow-hidden'>
          {/* Scale markers at 25 / 50 / 75 % */}
          {[25, 50, 75].map((mark) => (
            <div
              key={mark}
              className='absolute left-0 right-0 border-t border-gray-600/40 pointer-events-none'
              style={{ bottom: `${mark}%` }}
            />
          ))}
          {/* Fill */}
          <div
            className='absolute bottom-0 left-0 right-0 rounded-full transition-all duration-500'
            style={{ height: `${pct}%`, backgroundColor: fillColor }}
          />
        </div>

        {/* Numeric value */}
        <span className='text-sm font-mono font-bold text-white leading-none'>
          {altitude.toFixed(0)}
        </span>
        <span className='text-[10px] text-gray-500'>m</span>
      </div>
    );
  }
);

AltitudeIndicator.displayName = 'AltitudeIndicator';
