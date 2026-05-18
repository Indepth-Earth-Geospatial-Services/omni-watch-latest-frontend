'use client';

import React from 'react';
import KPIItem from '../layout/KpiItems';
import { useDJIDevices } from '@/hooks/useDJIDevices';

const FleetOverviewKPI = () => {
  const { data: devices = [] } = useDJIDevices();

  const total = devices.length;
  const drones = devices.filter((d) => d.domain === '0').length;
  const docks = devices.filter((d) => d.domain !== '0').length;
  const online = devices.filter((d) => d.status).length;
  const offline = total - online;

  return (
    <div className='flex items-center justify-between w-[calc(100%-2rem)] h-[70px] px-6 bg-[#1A1C20] backdrop-blur-md border border-zinc-800/50 rounded-xl overflow-hidden my-4 mx-4'>
      <div className='flex items-center'>
        <KPIItem label='Devices' value={total} valueClass='text-[#1C93FF]' />
        <KPIItem label='Drones' value={drones} />
        <KPIItem label='Docks' value={docks} />
        <KPIItem label='Online' value={online} valueClass='text-emerald-400' />
        <KPIItem label='Offline' value={offline} valueClass='text-zinc-500' />
      </div>

      <div className='flex items-center gap-2 px-3 py-1.5 bg-red-600/10 border border-red-600/30 rounded-md'>
        <div className='w-2 h-2 bg-red-600 rounded-full animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.5)]' />
        <span className='text-[10px] font-black text-red-600 tracking-widest uppercase'>Live</span>
      </div>
    </div>
  );
};

export default FleetOverviewKPI;
