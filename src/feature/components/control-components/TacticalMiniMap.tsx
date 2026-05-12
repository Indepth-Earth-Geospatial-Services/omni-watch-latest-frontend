'use client';

import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Plane } from 'lucide-react';

const TacticalMiniMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);

  // Flight Data
  const heading = 247;
  const lat = 6.5244;
  const lng = 3.3792;

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: [lng, lat],
      zoom: 14,
      pitch: 45,
      interactive: true,
    });

    return () => {
      map.current?.remove();
    };
  }, [lat, lng]);

  return (
    <div
      className='relative bg-[#0C0E12] border border-zinc-800/50 rounded-xl overflow-hidden shadow-2xl group'
      style={{ width: '304px', height: '350px' }}
    >
      {/* 1. Live Map Layer */}
      <div ref={mapContainer} className='absolute inset-0 z-0' />

      {/* 2. Tactical Overlays */}
      <div className='absolute inset-0 z-10 pointer-events-none'>
        {/* Dark Vignette for Focus */}
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(12,14,18,0.7)_100%)]' />

        {/* Orientation & Drone Indicator */}
        <div className='absolute inset-0 flex items-center justify-center'>
          <div className='relative w-48 h-48 rounded-full border border-white/10 flex items-center justify-center'>
            {/* Rotating Heading UI */}
            <div
              className='relative transition-transform duration-1000 ease-in-out'
              style={{ transform: `rotate(${heading}deg)` }}
            >
              {/* Directional Beam */}
              <div className='absolute -top-12 left-1/2 -translate-x-1/2 w-[1px] h-20 bg-gradient-to-t from-blue-500 via-blue-500/20 to-transparent' />

              <Plane
                className='text-blue-500 fill-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]'
                size={32}
              />
            </div>
          </div>
        </div>

        {/* 3. Altitude Visualizer (Figma Refined) */}
        <div className='absolute right-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-3'>
          <div className='flex flex-col items-center'>
            <span className='text-[8px] font-black text-white/30 uppercase tracking-[0.2em] mb-1'>
              Alt
            </span>
            <span className='text-[10px] font-mono font-bold text-blue-400'>120m</span>
          </div>

          <div className='relative h-40 w-[2px] bg-white/5 rounded-full overflow-hidden'>
            {/* Scale Markers */}
            <div className='absolute inset-0 flex flex-col justify-between py-1 opacity-20'>
              {[...Array(5)].map((_, i) => (
                <div key={i} className='w-full h-[1px] bg-white' />
              ))}
            </div>

            {/* Active Level Bar */}
            <div
              className='absolute bottom-0 w-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)] transition-all duration-1000'
              style={{ height: '40%' }}
            />
          </div>
        </div>

        {/* HUD Details */}
        <div className='absolute top-4 left-4 flex flex-col gap-1'>
          <div className='w-2 h-2 border-t border-l border-white/40' />
          <span className='text-[8px] font-mono text-white/20 uppercase'>Live_Map_Ready</span>
        </div>
        <div className='absolute bottom-4 right-4 w-2 h-2 border-b border-r border-white/40' />
      </div>
    </div>
  );
};

export default TacticalMiniMap;
