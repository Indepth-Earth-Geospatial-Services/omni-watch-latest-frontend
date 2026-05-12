'use client';

import React from 'react';
import KPIItem from '../layout/KpiItems';

const FleetOverviewKPI = () => {
  return (
    <div className='flex items-center justify-between w-[calc(100%-2rem)] h-[70px] px-6 bg-[#1A1C20] backdrop-blur-md border border-zinc-800/50 rounded-xl overflow-hidden my-4 mx-4'>
      {/* 1. Metrics Grid */}
      <div className='flex items-center'>
        <KPIItem label='Devices' value={8} valueClass='text-[#1C93FF]' />
        <KPIItem label='Drones' value={14} />
        <KPIItem label='Dock' value={3} />
        <KPIItem label='Online' value={2} valueClass='text-[#FF4D4D]' />
        <KPIItem label='Offline' value='4.2' unit='km²' valueClass='text-[#45F0CF]' />
      </div>

      {/* 2. Live Indicator (Right-aligned) */}
      <div className='flex items-center gap-2 px-3 py-1.5 bg-red-600/10 border border-red-600/30 rounded-md'>
        <div className='w-2 h-2 bg-red-600 rounded-full animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.5)]' />
        <span className='text-[10px] font-black text-red-600 tracking-widest uppercase'>Live</span>
      </div>
    </div>
  );
};

export default FleetOverviewKPI;
